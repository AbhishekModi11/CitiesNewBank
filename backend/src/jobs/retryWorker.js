import { pollJobs, updateJob } from '../db/repos/jobs.js'
import * as paymentsRepo from '../db/repos/payments.js'
import * as accountsRepo from '../db/repos/accounts.js'
import { bankUpStatus } from '../integrations/bank/mockBank.js'
import { createLedger } from '../integrations/ledger/index.js'
import { config } from '../config.js'

export function createProcessJob(db, ledger) {
  return async function processJob(job) {
    if (job.type !== 'process_payment') {
      updateJob(db, job.id, { status: 'completed' })
      return
    }
    const payload = JSON.parse(job.payload)
    updateJob(db, job.id, { attempts: job.attempts + 1, status: 'processing' })
    try {
      const payment = paymentsRepo.findPayment(db, payload.paymentId)
      if (!payment || ['completed', 'failed', 'cancelled', 'blocked', 'declined'].includes(payment.status)) {
        updateJob(db, job.id, { status: 'completed' })
        return
      }
      if (!bankUpStatus()) throw new Error('bank down')
      const fresh = paymentsRepo.findPayment(db, payment.id)
      if (fresh.status === 'completed') { updateJob(db, job.id, { status: 'completed' }); return }
      if (fresh.status !== 'queued' && fresh.status !== 'cooling') { updateJob(db, job.id, { status: 'completed' }); return }
      const account = accountsRepo.findAccount(db, fresh.account_id)
      if (!account || account.balance < fresh.amount) {
        paymentsRepo.updatePayment(db, fresh.id, { status: 'failed', updated_at: Date.now() })
        updateJob(db, job.id, { status: 'failed', last_error: 'insufficient funds' })
        return
      }
      paymentsRepo.updatePayment(db, fresh.id, { status: 'processing', updated_at: Date.now() })
      account.balance -= fresh.amount
      accountsRepo.updateBalance(db, account.id, account.balance)
      paymentsRepo.updatePayment(db, fresh.id, { status: 'completed', completed_at: Date.now(), updated_at: Date.now() })
      paymentsRepo.addPaymentEvent(db, fresh.id, 'queued', 'completed', 'Settled by worker', Date.now())
      ledger.recordPaymentEvent({ paymentId: fresh.id, from: 'queued', to: 'completed', reason: 'Settled by worker', at: Date.now() })
      updateJob(db, job.id, { status: 'completed' })
    } catch (err) {
      const nextRun = Date.now() + Math.min(30000, 2000 * Math.pow(2, job.attempts))
      updateJob(db, job.id, { status: 'failed', last_error: String(err.message || err), run_at: nextRun })
    }
  }
}

export function startRetryWorker(db, ledger) {
  const processJob = createProcessJob(db, ledger)
  const handle = setInterval(() => {
    const jobs = pollJobs(db, 20)
    jobs.forEach((job) => { processJob(job).catch(() => {}) })
  }, 500)
  return handle
}



