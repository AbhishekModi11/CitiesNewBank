import {
  evaluatePayment,
  transition,
  PAYMENT_STATES,
  shouldRetryNow,
  isBankAvailable,
} from '../../../middleware/index.js'

export const createPaymentRequest = ({ payee, amount, accountId, account, context = {}, now = Date.now() }) => {
  const draft = { payee, amount, accountId, now }
  const evaluation = evaluatePayment(draft, {
    ...context,
    account,
    knownPayees: context.knownPayees ?? [],
    recentPayments: context.recentPayments ?? [],
  })

  let status = PAYMENT_STATES.BLOCKED
  if (evaluation.outcome === 'blocked') status = PAYMENT_STATES.BLOCKED
  else if (evaluation.outcome === 'awaiting_approval') status = PAYMENT_STATES.AWAITING_APPROVAL
  else if (evaluation.outcome === 'cooling') status = PAYMENT_STATES.COOLING
  else status = PAYMENT_STATES.QUEUED

  const payment = {
    id: `pay-${now}-${Math.random().toString(36).slice(2, 8)}`,
    payee,
    amount,
    accountId,
    status,
    createdAt: now,
    updatedAt: now,
    riskScore: evaluation.riskScore,
    reasons: evaluation.reasons,
    warnings: evaluation.warnings,
    requiresApproval: evaluation.requiresApproval,
    coolingUntil: evaluation.outcome === 'cooling' ? now + evaluation.coolingMs : null,
    retryCount: 0,
    nextRetryAt: null,
    completedAt: null,
    history: [{ from: null, to: status, reason: 'created', at: now }],
  }

  return { payment, evaluation }
}

export const processQueue = ({ payments, accounts, bankUp, killSwitch, now = Date.now() }) => {
  if (killSwitch?.active && now < (killSwitch.lockedUntil ?? Infinity)) {
    return { payments, accounts, completed: [] }
  }
  const accountMap = new Map(accounts.map((a) => [a.id, { ...a }]))
  const completed = []

  const updatedPayments = payments.map((payment) => {
    if (['completed', 'failed', 'blocked', 'cancelled', 'declined'].includes(payment.status)) {
      return payment
    }

    let next = { ...payment }

    if (next.status === 'cooling' && next.coolingUntil && now >= next.coolingUntil) {
      next = transition(next, PAYMENT_STATES.QUEUED, 'Cooling complete', now)
    }

    if (!isBankAvailable(bankUp)) {
      if (next.status === 'processing') {
        next = transition(next, PAYMENT_STATES.QUEUED, 'Bank unavailable', now)
      }
      return next
    }

    if (next.status === 'queued' && shouldRetryNow(next, now, bankUp)) {
      const account = accountMap.get(next.accountId)
      if (!account || next.amount > account.balance) {
        next = transition(next, PAYMENT_STATES.FAILED, 'Insufficient balance at settlement', now)
        return next
      }
      next = transition(next, PAYMENT_STATES.PROCESSING, 'Bank accepted request', now)
      account.balance -= next.amount
      next = transition(next, PAYMENT_STATES.COMPLETED, 'Settled by bank', now)
      next.completedAt = now
      completed.push(next)
      accountMap.set(account.id, account)
    }

    return next
  })

  return {
    payments: updatedPayments,
    accounts: accounts.map((a) => accountMap.get(a.id) ?? a),
    completed,
  }
}
