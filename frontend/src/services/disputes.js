import {
  canRaiseDispute,
  disputeStatus,
} from '../../../middleware/index.js'

export const raiseDispute = ({ payment, reason, now = Date.now() }) => ({
  id: `dsp-${now}-${Math.random().toString(36).slice(2, 6)}`,
  paymentId: payment.id,
  payee: payment.payee,
  amount: payment.amount,
  reason,
  raisedAt: now,
  status: 'open',
})

export const disputeWithStatus = (dispute, now = Date.now()) => ({
  ...dispute,
  ...disputeStatus(dispute, now),
})

export const eligiblePayments = (payments, now = Date.now()) =>
  payments.filter((p) => canRaiseDispute(p, now))
