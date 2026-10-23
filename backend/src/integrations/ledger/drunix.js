export function createDrunixLedger(config) {
  return {
    recordPaymentEvent: async () => { throw new Error('DRUNIX ledger not configured') },
    getPaymentHistory: async () => [],
    saveRules: async () => { throw new Error('DRUNIX ledger not configured') },
    recordApproval: async () => { throw new Error('DRUNIX ledger not configured') },
    recordChore: async () => { throw new Error('DRUNIX ledger not configured') },
    verifyChain: async () => ({ valid: false, reason: 'not configured' }),
  }
}
