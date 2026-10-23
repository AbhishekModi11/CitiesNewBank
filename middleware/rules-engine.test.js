import { describe, it, expect } from 'vitest'
import { evaluatePayment } from './rules-engine.js'
import { transition, PAYMENT_STATES, isTerminal } from './payment-state-machine.js'

describe('rules engine', () => {
  it('blocks payments without enough balance', () => {
    const result = evaluatePayment(
      { payee: 'Priya', amount: 1000, accountId: 'sav', now: 1 },
      { account: { id: 'sav', balance: 100 }, knownPayees: [], recentPayments: [], killSwitch: { active: false } },
    )
    expect(result.outcome).toBe('blocked')
  })

  it('requires family approval above threshold', () => {
    const result = evaluatePayment(
      { payee: 'Priya', amount: 6000, accountId: 'sav', now: 1 },
      { account: { id: 'sav', balance: 50000 }, knownPayees: ['Priya'], recentPayments: [] },
    )
    expect(result.outcome).toBe('awaiting_approval')
    expect(result.requiresApproval).toBe(true)
  })
})

describe('payment state machine', () => {
  it('allows queued to processing to completed', () => {
    const queued = { id: '1', status: PAYMENT_STATES.QUEUED, history: [] }
    const processing = transition(queued, PAYMENT_STATES.PROCESSING, 'bank', 2)
    const completed = transition(processing, PAYMENT_STATES.COMPLETED, 'settled', 3)
    expect(completed.status).toBe(PAYMENT_STATES.COMPLETED)
    expect(isTerminal(completed.status)).toBe(true)
  })
})
