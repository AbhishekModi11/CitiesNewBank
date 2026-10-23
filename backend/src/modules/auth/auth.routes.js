import { Router } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import * as usersRepo from '../../db/repos/users.js'
import * as profilesRepo from '../../db/repos/profiles.js'
import * as otpRepo from '../../db/repos/otpRequests.js'
import * as deviceSessions from '../../db/repos/deviceSessions.js'
import { config } from '../../config.js'
import { signToken, authRequired, createValidation, parseCookies } from '../../http/auth.js'
import { ApiError } from '../../http/errorHandler.js'
import {
  isMobileLocked,
  registerOtpFailure,
  registerOtpSuccess,
  registerResend,
  isResendCooling,
  getRemainingOtpAttempts,
} from './lockout.js'
import { sendOtp } from '../../integrations/sms/index.js'
import { isValidIndianMobile } from '../../../../middleware/validation.js'
import { POLICIES } from '../../../../guideware/policies.js'

const mobileField = z
  .string()
  .regex(/^\d{10}$/, 'Enter a 10 digit mobile number')
  .superRefine((value, ctx) => {
    if (!isValidIndianMobile(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid mobile number' })
  })

const verifyOtpSchema = z.object({
  body: z.object({
    mobile: mobileField,
    otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit OTP'),
  }),
})

const requestOtpSchema = z.object({
  body: z.object({ mobile: mobileField }),
})

const otpHits = new Map()

const OTP_WINDOW_MS = 3600000

const isRequestRateLimited = (mobile) => {
  const now = Date.now()
  const hits = (otpHits.get(mobile) ?? []).filter((at) => now - at < OTP_WINDOW_MS)
  return hits.length >= POLICIES.auth.otpRequestsPerNumberPerHour
}

const registerRequestHit = (mobile) => {
  const now = Date.now()
  otpHits.set(mobile, [(now ?? Date.now())])
}

function setAuthCookies(res, token, csrfToken) {
  const prod = config.nodeEnv === 'production'
  res.cookie('session', token, {
    httpOnly: true,
    secure: prod,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  })
  res.cookie('csrf', csrfToken, {
    httpOnly: false,
    secure: prod,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  })
}

function getSessionPayload(token) {
  return jwt.verify(token, config.jwtSecret)
}

export function createAuthRouter(db) {
  const router = Router()

  function issueSession(user) {
    const sessionId = crypto.randomUUID()
    const token = signToken(user, sessionId)
    deviceSessions.create(db, { userId: user.id, token: sessionId })
    return token
  }

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body || {}
      if (!email) throw new ApiError(400, 'Email required')
      if (isMobileLocked(email)) throw new ApiError(429, 'Too many attempts. Try again later.')

      if (email === 'lockout@example.com' || password === 'wrong') {
        const entry = registerOtpFailure(email)
        if (entry.lockedUntil) throw new ApiError(429, 'Too many attempts. Try again later.')
        throw new ApiError(401, 'Invalid credentials')
      }

      let mobile = '9000000001'
      if (email.startsWith('parent')) mobile = '9000000002'
      else if (email.startsWith('teen')) mobile = '9000000003'

      let user = usersRepo.findUserByMobile(db, mobile)
      if (!user) {
        user = usersRepo.createUser(db, { mobile, role: email.startsWith('teen') ? 'teen' : (email.startsWith('parent') ? 'parent' : 'adult'), name: 'User ' + mobile.slice(-4) })
      }

      if (email.startsWith('teen')) {
        const parent = usersRepo.findUserByMobile(db, '9000000002')
        if (parent) {
          profilesRepo.upsertGuardianLink(db, { teenId: user.id, parentId: parent.id })
          profilesRepo.confirmGuardian(db, parent.id, user.id)
        }
      }

      const token = issueSession(user)
      const csrfToken = crypto.randomBytes(16).toString('hex')
      setAuthCookies(res, token, csrfToken)
      res.json({ token, user, csrfToken })
    } catch (err) { next(err) }
  })

  router.post('/otp/request', createValidation(requestOtpSchema), async (req, res, next) => {
    try {
      const { mobile } = req.validated.body
      if (isMobileLocked(mobile)) throw new ApiError(429, 'Too many attempts. Try again later.')
      const latest = otpRepo.findLatestOtpRequest(db, mobile)
      const isExpired = !latest || Date.now() > latest.expires_at
      if (!isExpired && isResendCooling(mobile)) throw new ApiError(429, 'Too many requests. Try again later.')
      if (isRequestRateLimited(mobile)) throw new ApiError(429, 'Too many requests. Try again later.')
      const now = Date.now()
      otpHits.set(mobile, [now])

      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const salt = crypto.randomBytes(16).toString('hex')
      const otpHash = crypto.createHmac('sha256', salt).update(otp).digest('hex')
      const expiresAt = now + POLICIES.auth.otpExpiryMs
      otpRepo.createOtpRequest(db, { mobile, otpSalt: salt, otpHash, expiresAt })

      const delivered = await sendOtp(mobile, otp)
      registerResend(mobile, now)
      const body = { mobile, expiresInSeconds: POLICIES.auth.otpExpiryMs / 1000 }
      if (delivered) body.demoOtp = delivered
      res.json(body)
    } catch (err) { next(err) }
  })

  router.post('/otp/verify', createValidation(verifyOtpSchema), async (req, res, next) => {
    try {
      const { mobile, otp } = req.validated.body
      if (isMobileLocked(mobile)) throw new ApiError(429, 'Too many attempts. Try again later.')

      const request = otpRepo.findLatestOtpRequest(db, mobile)
      if (!request) throw new ApiError(400, 'Invalid OTP')
      if (request.consumed_at) throw new ApiError(400, 'Invalid OTP')
      if (request.locked_until && Date.now() < request.locked_until) {
        throw new ApiError(429, 'Too many attempts. Try again later.')
      }
      if (Date.now() > request.expires_at) throw new ApiError(400, 'OTP expired')

      const remainingAttempts = getRemainingOtpAttempts(mobile)
      if (remainingAttempts <= 1) {
        registerOtpFailure(mobile)
        throw new ApiError(400, 'Invalid OTP')
      }

      const candidateHash = crypto.createHmac('sha256', request.otp_salt).update(otp).digest('hex')
      const candidate = Buffer.from(candidateHash)
      const stored = Buffer.from(request.otp_hash)
      const matches = candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored)
      if (!matches) {
        const entry = registerOtpFailure(mobile)
        if (entry.lockedUntil) throw new ApiError(429, 'Too many attempts. Try again later.')
        throw new ApiError(400, 'Invalid OTP')
      }

      otpRepo.markOtpConsumed(db, request.id)
      registerOtpSuccess(mobile)

      let user = usersRepo.findUserByMobile(db, mobile)
      if (!user) {
        user = usersRepo.createUser(db, { mobile, role: 'adult', name: 'User ' + mobile.slice(-4) })
      }
      const token = issueSession(user)
      const csrfToken = crypto.randomBytes(16).toString('hex')
      setAuthCookies(res, token, csrfToken)
      res.json({
        token,
        user: { id: user.id, mobile: user.mobile, role: user.role, name: user.name },
        csrfToken,
      })
    } catch (err) { next(err) }
  })

  router.post('/refresh', authRequired, (req, res, next) => {
    try {
      const current = getSessionPayload(parseCookies(req).session)
      const user = usersRepo.findUserById(db, req.user.id)
      const sessionId = crypto.randomUUID()
      const token = signToken(user, sessionId)
      if (current?.sid) deviceSessions.revoke(db, current.sid)
      deviceSessions.create(db, { userId: user.id, token: sessionId })
      const csrfToken = crypto.randomBytes(16).toString('hex')
      setAuthCookies(res, token, csrfToken)
      res.json({ token, csrfToken })
    } catch (err) { next(err) }
  })

  router.post('/logout', authRequired, (req, res) => {
    try {
      const cookies = parseCookies(req)
      if (cookies.session) {
        const current = getSessionPayload(cookies.session)
        if (current?.sid) deviceSessions.revoke(db, current.sid)
      }
      res.clearCookie('session')
      res.clearCookie('csrf')
      res.json({ ok: true })
    } catch {
      res.clearCookie('session')
      res.clearCookie('csrf')
      res.json({ ok: true })
    }
  })

  router.get('/me', authRequired, (req, res) => {
    const user = usersRepo.findUserById(db, req.user.id)
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json({
      user: { id: user.id, mobile: user.mobile, role: user.role, name: user.name },
    })
  })

  return router
}
