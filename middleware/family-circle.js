import { POLICIES } from '../guideware/policies.js'

export const requiresFamilyApproval = (payment, policies = POLICIES.family) =>
  payment.amount >= policies.approvalThreshold

export const approvePaymentRequest = (request, approverId, now = Date.now()) => ({
  ...request,
  status: 'approved',
  approvedBy: approverId,
  approvedAt: now,
})

export const declinePaymentRequest = (request, approverId, now = Date.now()) => ({
  ...request,
  status: 'declined',
  declinedBy: approverId,
  declinedAt: now,
})

export const withinMemberCap = (member, amount) =>
  (member.spent ?? 0) + amount <= (member.monthlyCap ?? POLICIES.family.memberMonthlyCap)
