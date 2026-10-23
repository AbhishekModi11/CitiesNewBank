import { POLICIES } from '../guideware/policies.js'

export const checkEmiBuffer = (account, amount) => {
  if (!account?.mandate) {
    return { safe: true, required: 0, leftAfterPayment: account.balance - amount }
  }
  const left = account.balance - amount
  const required = account.mandate.amount + POLICIES.emi.minimumBuffer
  return {
    safe: left >= required,
    required,
    leftAfterPayment: left,
    shortage: required - left,
  }
}

export const upcomingMandates = (accounts, now = Date.now()) =>
  accounts
    .filter((a) => a.mandate)
    .map((a) => ({
      accountId: a.id,
      bank: a.bank,
      ...a.mandate,
      atRisk: a.balance < a.mandate.amount + POLICIES.emi.minimumBuffer,
    }))
