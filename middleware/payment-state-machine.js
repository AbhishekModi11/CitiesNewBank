export const PAYMENT_STATES = {
  REQUESTED: 'requested',
  AWAITING_APPROVAL: 'awaiting_approval',
  COOLING: 'cooling',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
}

const TERMINAL = new Set([
  PAYMENT_STATES.COMPLETED,
  PAYMENT_STATES.FAILED,
  PAYMENT_STATES.BLOCKED,
  PAYMENT_STATES.CANCELLED,
])

export const isTerminal = (state) => TERMINAL.has(state)

export const canTransition = (from, to) => {
  if (from === to) return false
  if (TERMINAL.has(from)) return false
  const allowed = {
    [PAYMENT_STATES.REQUESTED]: [
      PAYMENT_STATES.AWAITING_APPROVAL,
      PAYMENT_STATES.COOLING,
      PAYMENT_STATES.QUEUED,
      PAYMENT_STATES.PROCESSING,
      PAYMENT_STATES.BLOCKED,
      PAYMENT_STATES.CANCELLED,
    ],
    [PAYMENT_STATES.AWAITING_APPROVAL]: [
      PAYMENT_STATES.COOLING,
      PAYMENT_STATES.QUEUED,
      PAYMENT_STATES.BLOCKED,
      PAYMENT_STATES.CANCELLED,
    ],
    [PAYMENT_STATES.COOLING]: [PAYMENT_STATES.QUEUED, PAYMENT_STATES.CANCELLED],
    [PAYMENT_STATES.QUEUED]: [
      PAYMENT_STATES.PROCESSING,
      PAYMENT_STATES.CANCELLED,
      PAYMENT_STATES.FAILED,
    ],
    [PAYMENT_STATES.PROCESSING]: [
      PAYMENT_STATES.COMPLETED,
      PAYMENT_STATES.FAILED,
      PAYMENT_STATES.QUEUED,
    ],
  }
  return Boolean(allowed[from]?.includes(to))
}

export const transition = (payment, nextState, reason = '', now = Date.now()) => {
  if (!canTransition(payment.status, nextState)) {
    return { ...payment, lastError: `Cannot move from ${payment.status} to ${nextState}` }
  }
  return {
    ...payment,
    status: nextState,
    updatedAt: now,
    reason: reason || payment.reason,
    history: [
      ...(payment.history ?? []),
      { from: payment.status, to: nextState, reason, at: now },
    ],
  }
}
