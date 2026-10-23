import { POLICIES } from '../guideware/policies.js'
import { assessScam } from './scam-shield.js'
import { checkEmiBuffer } from './autopay-guard.js'
import { requiresFamilyApproval } from './family-circle.js'
import { isKillSwitchActive } from './kill-switch.js'

const policies = POLICIES

export const evaluatePayment = (draft, context = {}) => {
  const reasons = []
  const warnings = []
  const now = draft.now ?? Date.now()

  if (context.killSwitch && isKillSwitchActive(context.killSwitch, now)) {
    return { outcome: 'blocked', reasons: ['Payments paused by kill switch'], warnings, riskScore: 100, requiresApproval: false, coolingMs: 0 }
  }

  if (!Number.isFinite(draft.amount) || draft.amount < POLICIES.payment.minAmount) {
    return { outcome: 'blocked', reasons: ['Enter a valid amount'], warnings, riskScore: 0, requiresApproval: false, coolingMs: 0 }
  }
  if (draft.amount > POLICIES.payment.maxAmount) {
    reasons.push('Amount exceeds payment limit')
  }
  if (!context.account || draft.amount > context.account.balance) {
    reasons.push('Not enough balance in selected account')
  }
  if (reasons.length) {
    return { outcome: 'blocked', reasons, warnings, riskScore: 100, requiresApproval: false, coolingMs: 0 }
  }

  const scam = assessScam({ payee: draft.payee, amount: draft.amount, now }, {
    knownPayees: context.knownPayees,
    recentPayments: context.recentPayments,
  })
  if (scam.blocked) {
    return { outcome: 'blocked', reasons: ['Blocked by scam shield'], warnings: scam.flags, riskScore: scam.riskScore, requiresApproval: false, coolingMs: 0 }
  }
  if (scam.level === 'warning') warnings.push(...scam.flags)

  const emi = checkEmiBuffer(context.account, draft.amount)
  if (!emi.safe) warnings.push('Payment leaves less than required EMI buffer')

  const requiresApproval = requiresFamilyApproval({ amount: draft.amount })
  if (requiresApproval) {
    return { outcome: 'awaiting_approval', reasons: [], warnings, riskScore: scam.riskScore, requiresApproval: true, coolingMs: 0 }
  }
  if (scam.riskScore >= POLICIES.scam.warnThreshold) {
    return {
      outcome: 'cooling',
      reasons: [],
      warnings,
      riskScore: scam.riskScore,
      requiresApproval: false,
      coolingMs: POLICIES.payment.coolingPeriodMs,
    }
  }
  return { outcome: 'allow', reasons: [], warnings, riskScore: scam.riskScore, requiresApproval: false, coolingMs: 0 }
}
