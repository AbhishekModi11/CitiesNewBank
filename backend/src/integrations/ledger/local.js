import { signPayload } from './signing.js'
import * as ledgerRepo from '../../db/repos/ledger.js'

export function createLocalLedger(db) {
  return {
    recordPaymentEvent: ({ paymentId, from, to, reason, at }) => {
      const payload = { from, to, reason, at }
      const signature = signPayload({ entryType: 'payment_event', paymentId, payload, createdAt: Date.now() })
      return ledgerRepo.appendEntry(db, {
        entryType: 'payment_event',
        paymentId,
        payload,
        signature,
      })
    },
    getPaymentHistory: (paymentId) => ledgerRepo.historyByPayment(db, paymentId),
    saveRules: (payload) => {
      const signature = signPayload({ entryType: 'rules', payload, createdAt: Date.now() })
      return ledgerRepo.appendEntry(db, { entryType: 'rules', payload, signature })
    },
    recordApproval: (paymentId, approverId, status) => {
      const payload = { approverId, status }
      const signature = signPayload({ entryType: 'approval', paymentId, payload, createdAt: Date.now() })
      return ledgerRepo.appendEntry(db, { entryType: 'approval', paymentId, payload, signature })
    },
    recordChore: (choreId, payload) => {
      const fullPayload = { choreId, ...payload }
      const signature = signPayload({ entryType: 'chore', payload: fullPayload, createdAt: Date.now() })
      return ledgerRepo.appendEntry(db, { entryType: 'chore', payload: fullPayload, signature })
    },
    verifyChain: () => ledgerRepo.verifyChain(db),
  }
}
