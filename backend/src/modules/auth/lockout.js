import { POLICIES } from '../../../../guideware/policies.js'

const attempts = new Map()

export function isMobileLocked(mobile) {
  const entry = attempts.get(mobile)
  if (!entry) return false
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return true
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) attempts.delete(mobile)
  return false
}

export function registerOtpFailure(mobile) {
  const entry = attempts.get(mobile) || { attempts: 0, lockedUntil: null }
  entry.attempts += 1
  const maxAttempts = POLICIES.auth.maxOtpAttempts
  if (entry.attempts >= maxAttempts) {
    entry.lockedUntil = Date.now() + POLICIES.auth.lockoutMs
  }
  attempts.set(mobile, entry)
  return entry
}

export function registerOtpSuccess(mobile) {
  attempts.delete(mobile)
}

export const getRemainingOtpAttempts = (mobile) => {
  const entry = attempts.get(mobile)
  if (!entry) return POLICIES.auth.maxOtpAttempts
  return Math.max(0, POLICIES.auth.maxOtpAttempts - entry.attempts)
}

export const isResendCooling = (mobile, now = Date.now()) => {
  const entry = attempts.get(mobile)
  if (!entry?.resendAt) return false
  return now < entry.resendAt
}

export const registerResend = (mobile, now = Date.now()) => {
  attempts.set(mobile, { attempts: 0, lockedUntil: null, resendAt: now + POLICIES.auth.resendCooldownMs })
}
