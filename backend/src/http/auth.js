import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import * as deviceSessions from '../db/repos/deviceSessions.js'

export function signToken(user, sessionId) {
  return jwt.sign(
    { sub: user.id, role: user.role, sid: sessionId, mobile: user.mobile },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  )
}

export function parseCookies(req) {
  const header = req.get('cookie') || ''
  const cookies = {}
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name) cookies[name] = decodeURIComponent(rest.join('='))
  }
  return cookies
}

export function authRequired(req, res, next) {
  let token = null
  const header = req.get('authorization') || ''
  if (header.startsWith('Bearer ')) token = header.slice(7)
  else token = parseCookies(req).session
  if (!token) return res.status(401).json({ error: 'Authentication required' })
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const sessionId = payload.sid
    if (!sessionId) return res.status(401).json({ error: 'Authentication required' })
    const db = req.db || req.app?.locals?.db
    const session = db ? deviceSessions.findByToken(db, sessionId) : null
    if (!session || session.user_id !== payload.sub) return res.status(401).json({ error: 'Authentication required' })
    if (session.expires_at < Date.now()) {
      if (db) deviceSessions.revoke(db, sessionId)
      return res.status(401).json({ error: 'Session expired' })
    }
    if (db) deviceSessions.touch(db, sessionId)
    req.user = { id: payload.sub, role: payload.role, mobile: payload.mobile }
    req.authCookies = parseCookies(req)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

export function createValidation(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query, headers: req.headers })
    if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() })
    req.validated = result.data
    next()
  }
}
