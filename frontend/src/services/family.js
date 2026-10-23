import {
  approvePaymentRequest,
  declinePaymentRequest,
  requiresFamilyApproval,
  withinMemberCap,
} from '../../../middleware/index.js'

export const familyApprove = (request, approverId, now = Date.now()) =>
  approvePaymentRequest(request, approverId, now)

export const familyDecline = (request, approverId, now = Date.now()) =>
  declinePaymentRequest(request, approverId, now)

export { requiresFamilyApproval, withinMemberCap }
