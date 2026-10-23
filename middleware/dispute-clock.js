import { POLICIES } from '../guideware/policies.js'

export const disputeWindowOpen = (payment, now = Date.now()) =>
  now - (payment.completedAt ?? payment.updatedAt ?? 0) <= POLICIES.dispute.raiseWindowMs

export const disputeStatus = (dispute, now = Date.now()) => {
  const deadline = (dispute.raisedAt ?? now) + POLICIES.dispute.resolutionWindowMs
  const remainingMs = deadline - now
  const status =
    remainingMs <= 0 ? 'overdue' : remainingMs < 86400000 ? 'urgent' : 'open'
  return { deadline, remainingMs, status }
}

export const canRaiseDispute = (payment, now = Date.now()) =>
  payment.status === 'completed' && disputeWindowOpen(payment, now)
