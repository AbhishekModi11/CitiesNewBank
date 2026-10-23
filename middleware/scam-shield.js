import { POLICIES } from '../guideware/policies.js'

const policies = POLICIES.scam

export const assessScam = (payment, context = {}) => {
  const flags = []
  const payee = payment.payee
  const amount = payment.amount
  let riskScore = 0

  if (!context.knownPayees?.includes(payee) && amount >= policies.newPayeeThreshold) {
    flags.push('New payee with high amount')
    riskScore += policies.riskWeights.newPayeeHighAmount
  }

  const recent = (context.recentPayments ?? []).filter(
    (p) => p.payee === payee && payment.now - p.at <= policies.velocityWindowMs,
  )
  if (recent.length >= 1) {
    flags.push('Repeated recipient')
    riskScore += policies.riskWeights.repeatedRecipient
  }

  const velocityCount = (context.recentPayments ?? []).filter(
    (p) => payment.now - p.at <= policies.velocityWindowMs,
  ).length
  if (velocityCount >= policies.highVelocityCount) {
    flags.push('High payment velocity')
    riskScore += policies.riskWeights.exceedsDailyPattern
  }

  if (riskScore >= policies.blockThreshold) {
    flags.push('Blocked by scam shield')
  } else if (riskScore >= policies.warnThreshold) {
    flags.push('Review recommended')
  }

  const level =
    riskScore >= policies.blockThreshold
      ? 'blocked'
      : riskScore >= policies.warnThreshold
        ? 'warning'
        : 'clear'

  return { riskScore, flags, level, blocked: level === 'blocked' }
}
