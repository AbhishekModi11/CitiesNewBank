import { describe, it, expect, vi } from 'vitest'
import Module from 'node:module'

// Mock fabric-contract-api in Node's require cache before loading chaincode
const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'fabric-contract-api') {
    return { Contract: class Contract {} }
  }
  return originalLoad.apply(this, arguments)
}

const { AllowanceRules, Approvals, PaymentStatus, Chores } = await import('../../chaincode/index.js')

function createMockStub() {
  const state = new Map()
  return {
    createCompositeKey(type, parts) {
      return `${type}:${parts.join(':')}`
    },
    async putState(key, buffer) {
      state.set(key, buffer)
    },
    async getState(key) {
      return state.get(key) || null
    },
  }
}

describe('chaincode contracts', () => {
  it('AllowanceRules creates and fetches rule', async () => {
    const stub = createMockStub()
    const ctx = { stub }
    const contract = new AllowanceRules()

    const ruleId = await contract.CreateRule(ctx, 'rule1', 'teen1', 'gaming', 2000)
    expect(ruleId).toBe('rule1')

    const fetched = await contract.GetRule(ctx, 'teen1', 'rule1')
    expect(fetched).toEqual({ ruleId: 'rule1', teenId: 'teen1', category: 'gaming', limit: 2000 })
  })

  it('Approvals creates and approves single-use requests', async () => {
    const stub = createMockStub()
    const ctx = { stub }
    const contract = new Approvals()

    const approvalId = await contract.CreateApproval(ctx, 'appr1', 'pay1')
    expect(approvalId).toBe('appr1')

    await expect(contract.CreateApproval(ctx, 'appr1', 'pay1')).rejects.toThrow('duplicate approval')

    const approved = await contract.Approve(ctx, 'appr1')
    expect(approved.status).toBe('approved')
  })

  it('PaymentStatus records payments and rejects duplicate IDs', async () => {
    const stub = createMockStub()
    const ctx = { stub }
    const contract = new PaymentStatus()

    const paymentId = await contract.RecordPayment(ctx, 'pay100', 'queued')
    expect(paymentId).toBe('pay100')

    await expect(contract.RecordPayment(ctx, 'pay100', 'queued')).rejects.toThrow('duplicate payment id')

    const updated = await contract.AppendEvent(ctx, 'pay100', 'settled')
    expect(updated.status).toBe('settled')
    expect(updated.events).toEqual(['queued', 'settled'])
  })

  it('Chores handles lifecycle: Create, Complete, Approve, Release', async () => {
    const stub = createMockStub()
    const ctx = { stub }
    const contract = new Chores()

    const choreId = await contract.CreateChore(ctx, 'chore1', 'teen1', 500)
    expect(choreId).toBe('chore1')

    const completed = await contract.CompleteChore(ctx, 'chore1')
    expect(completed.status).toBe('completed')

    const approved = await contract.ApproveChore(ctx, 'chore1')
    expect(approved.status).toBe('approved')

    const released = await contract.ReleaseChore(ctx, 'chore1')
    expect(released.status).toBe('released')
  })
})
