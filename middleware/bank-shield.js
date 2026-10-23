import { POLICIES } from '../guideware/policies.js'

export const isBankAvailable = (bankUp) => Boolean(bankUp)

export const getRetryDelay = (retryCount) => {
  const delays = POLICIES.payment.bankRetryDelaysMs
  const index = Math.min(retryCount, delays.length - 1)
  return delays[index]
}

export const shouldRetryNow = (payment, now, bankUp) => {
  if (!bankUp) return false
  if (!payment.nextRetryAt) return true
  return now >= payment.nextRetryAt
}

export const queueCapacityRemaining = (queueLength) => Math.max(
  0,
  POLICIES.bankShield.offlineQueueLimit - queueLength,
)
