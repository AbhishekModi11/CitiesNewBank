const { Contract } = require('fabric-contract-api')

class AllowanceRules extends Contract {
  async CreateRule(ctx, ruleId, teenId, category, limit) {
    const key = ctx.stub.createCompositeKey('rule', [teenId, ruleId])
    await ctx.stub.putState(key, Buffer.from(JSON.stringify({ ruleId, teenId, category, limit })))
    return ruleId
  }
  async GetRule(ctx, teenId, ruleId) {
    const key = ctx.stub.createCompositeKey('rule', [teenId, ruleId])
    const data = await ctx.stub.getState(key)
    if (!data || !data.length) throw new Error('rule not found')
    return JSON.parse(data.toString())
  }
}
class Approvals extends Contract {
  async CreateApproval(ctx, approvalId, paymentId) {
    const exists = await ctx.stub.getState(approvalId)
    if (exists && exists.length) throw new Error('duplicate approval')
    await ctx.stub.putState(approvalId, Buffer.from(JSON.stringify({ approvalId, paymentId, status: 'pending' })))
    return approvalId
  }
  async Approve(ctx, approvalId) {
    const data = await ctx.stub.getState(approvalId)
    const obj = JSON.parse(data.toString())
    obj.status = 'approved'
    await ctx.stub.putState(approvalId, Buffer.from(JSON.stringify(obj)))
    return obj
  }
}
class PaymentStatus extends Contract {
  async RecordPayment(ctx, paymentId, status) {
    const existing = await ctx.stub.getState(paymentId)
    if (existing && existing.length) {
      // append event instead of overwrite? For simplicity reject duplicate
      throw new Error('duplicate payment id')
    }
    await ctx.stub.putState(paymentId, Buffer.from(JSON.stringify({ paymentId, status, events: [status] })))
    return paymentId
  }
  async AppendEvent(ctx, paymentId, status) {
    const data = await ctx.stub.getState(paymentId)
    if (!data || !data.length) throw new Error('payment not found')
    const obj = JSON.parse(data.toString())
    obj.events.push(status)
    obj.status = status
    await ctx.stub.putState(paymentId, Buffer.from(JSON.stringify(obj)))
    return obj
  }
}
class Chores extends Contract {
  async CreateChore(ctx, choreId, teenId, amount) {
    await ctx.stub.putState(choreId, Buffer.from(JSON.stringify({ choreId, teenId, amount, status: 'created' })))
    return choreId
  }
  async CompleteChore(ctx, choreId) {
    const data = await ctx.stub.getState(choreId)
    const obj = JSON.parse(data.toString())
    obj.status = 'completed'
    await ctx.stub.putState(choreId, Buffer.from(JSON.stringify(obj)))
    return obj
  }
  async ApproveChore(ctx, choreId) {
    const data = await ctx.stub.getState(choreId)
    const obj = JSON.parse(data.toString())
    obj.status = 'approved'
    await ctx.stub.putState(choreId, Buffer.from(JSON.stringify(obj)))
    return obj
  }
  async ReleaseChore(ctx, choreId) {
    const data = await ctx.stub.getState(choreId)
    const obj = JSON.parse(data.toString())
    obj.status = 'released'
    await ctx.stub.putState(choreId, Buffer.from(JSON.stringify(obj)))
    return obj
  }
}

module.exports = { AllowanceRules, Approvals, PaymentStatus, Chores }
