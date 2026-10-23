import { ApiError } from '../../http/errorHandler.js'
import * as paymentsRepo from '../../db/repos/payments.js'
import * as jobsRepo from '../../db/repos/jobs.js'
import * as accountsRepo from '../../db/repos/accounts.js'
import * as rulesRepo from '../../db/repos/rules.js'
import * as bankLinksRepo from '../../db/repos/bankLinks.js'
import * as profilesRepo from '../../db/repos/profiles.js'
import { newId, nowMs } from '../../lib/util.js'
import { evaluatePayment } from '../../../../middleware/index.js'
import { isBankAvailable, calculateAge } from '../../../../middleware/index.js'
import { setBankUpStatus, bankUpStatus, mockBankPay } from '../../integrations/bank/mockBank.js'
import { killSwitchState } from '../safety/killSwitchState.js'

const POLICIES = (await import('../../../../guideware/policies.js')).POLICIES

function recentPayments(db, userId) {
  return paymentsRepo.listPaymentsByUser(db, userId).slice(0, 10).map((p) => ({ payee: p.payee, amount: p.amount, at: p.created_at }))
}

function teenDailySpend(db, userId, now) {
  const start = now - 86400000
  return paymentsRepo.listPaymentsByUser(db, userId)
    .filter((p) => p.created_at >= start && ['completed', 'queued', 'processing', 'awaiting_approval', 'cooling'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0)
}

export function createPaymentService({ db, ledger, killSwitch }) {
  return {
    list(userId) {
      return paymentsRepo.listPaymentsByUser(db, userId)
    },
    get(userId, id) {
      const payment = paymentsRepo.findPayment(db, id)
      if (!payment || payment.user_id !== userId) throw new ApiError(404, 'Payment not found')
      return { payment, events: paymentsRepo.listPaymentEvents(db, id), ledger: ledger.getPaymentHistory(id) }
    },
    create(user, body, idempotencyKey) {
      const linkedBanks = bankLinksRepo.listActiveByUser(db, user.id)
      if (linkedBanks.length === 0) throw new ApiError(400, 'No linked bank. Link a bank to pay.')

      const { payee, amount, accountId } = body
      const account = accountsRepo.findAccount(db, accountId)
      if (!account || account.user_id !== user.id) throw new ApiError(404, 'Account not found')
      if (!Number.isInteger(amount) || amount < 1) throw new ApiError(400, 'Invalid amount')

      const profile = profilesRepo.getProfile(db, user.id)
      const guardianLink = profilesRepo.getGuardianLink(db, user.id)
      const guardianConfirmed = profile?.guardian_id ? true : guardianLink?.status === 'confirmed'
      if (user.role === 'teen' && !guardianConfirmed) {
        throw new ApiError(403, 'Guardian consent is required before payments')
      }

      if (idempotencyKey) {
        const existing = paymentsRepo.findByIdempotencyKey(db, idempotencyKey, user.id)
        if (existing) return { payment: existing, events: paymentsRepo.listPaymentEvents(db, existing.id), duplicate: true }
      }

      const now = nowMs()
      let outcome = 'allow'
      let riskScore = 0
      let warnings = []
      let requiresApproval = false
      let coolingMs = 0

      try {
        const decision = evaluatePayment(
          { payee, amount, accountId, now },
          {
            account,
            killSwitch: killSwitchState,
            knownPayees: [],
            recentPayments: recentPayments(db, user.id),
          },
        )
        outcome = decision.outcome
        riskScore = decision.riskScore
        warnings = decision.warnings
        requiresApproval = decision.requiresApproval
        coolingMs = decision.coolingMs
      } catch {
        // Fall back to allow if middleware evaluation fails.
      }

      // Rule-based teen limits.
      if (user.role === 'teen') {
        const teenRules = rulesRepo.listRulesByTeen(db, user.id)
        const dailyCap = teenRules.find((r) => r.daily_cap)?.daily_cap ?? 2000
        const catCap = teenRules.find((r) => r.category === 'entertainment')?.amount_cap
        if (amount > (catCap ?? Infinity)) {
          outcome = 'blocked'
          warnings = [...warnings, 'Amount exceeds category cap']
        }
        if (teenDailySpend(db, user.id, now) + amount > dailyCap) {
          outcome = 'blocked'
          warnings = [...warnings, 'Amount exceeds daily cap']
        }
        if (amount > 5000) {
          outcome = 'awaiting_approval'
          requiresApproval = true
        }
      }

      if (outcome === 'blocked') {
        const id = newId()
        const payment = paymentsRepo.createPayment(db, {
          id,
          idempotencyKey,
          userId: user.id,
          accountId,
          payee,
          amount,
          status: 'blocked',
          reason: warnings.join('; ') || 'Blocked by shield',
          riskScore,
          now,
        })
        paymentsRepo.addPaymentEvent(db, payment.id, null, 'blocked', warnings.join('; '), now)
        ledger.recordPaymentEvent({ paymentId: payment.id, from: null, to: 'blocked', reason: warnings.join('; '), at: now })
        throw new ApiError(400, 'Payment blocked by shield', { payment, events: paymentsRepo.listPaymentEvents(db, payment.id), ledger: ledger.getPaymentHistory(payment.id) })
      }

      // Chain/network decision already in outcome.
      let status = 'queued'
      if (outcome === 'awaiting_approval') status = 'awaiting_approval'
      else if (outcome === 'cooling') status = 'cooling'

      const coolingUntil = outcome === 'cooling' ? now + coolingMs : null

      const id = newId()
      const payment = paymentsRepo.createPayment(db, {
        id,
        idempotencyKey,
        userId: user.id,
        accountId,
        payee,
        amount,
        status,
        reason: warnings.join('; ') || null,
        riskScore,
        coolingUntil,
        now,
      })

      paymentsRepo.addPaymentEvent(db, payment.id, null, status, 'created', now)
      ledger.recordPaymentEvent({ paymentId: payment.id, from: null, to: status, reason: 'created', at: now })

      if (status === 'awaiting_approval') {
        paymentsRepo.createApproval(db, { paymentId: payment.id, approverId: this.findApprover(user) || user.id })
        ledger.recordApproval(payment.id, user.id, 'pending')
        this.notify(user.id, 'approval_needed', 'Approval needed', `Payment to ${payee} needs approval`)
        return { payment: paymentsRepo.findPayment(db, payment.id), events: paymentsRepo.listPaymentEvents(db, payment.id), ledger: ledger.getPaymentHistory(payment.id) }
      }

      if (isBankAvailable(bankUpStatus())) {
        try {
          mockBankPay()
          paymentsRepo.updatePayment(db, payment.id, { status: 'completed', completed_at: now, updated_at: now })
          paymentsRepo.addPaymentEvent(db, payment.id, 'queued', 'completed', 'Settled by bank', now)
          ledger.recordPaymentEvent({ paymentId: payment.id, from: 'queued', to: 'completed', reason: 'Settled by bank', at: now })
          account.balance -= amount
          accountsRepo.updateBalance(db, account.id, account.balance)
          paymentsRepo.updatePayment(db, payment.id, { reason: warnings.join('; ') || 'completed' })
          this.notify(user.id, 'payment_completed', 'Payment complete', `Payment to ${payee} completed`)
        } catch (err) {
          // Bank threw, keep queued and enqueue retry.
          paymentsRepo.updatePayment(db, payment.id, { status: 'queued', updated_at: now })
          paymentsRepo.addPaymentEvent(db, payment.id, status, 'queued', 'Bank unavailable', now)
          ledger.recordPaymentEvent({ paymentId: payment.id, from: status, to: 'queued', reason: 'Bank unavailable', at: now })
        }
      } else {
        this.notify(user.id, 'bank_down', 'Bank unavailable', 'Payments are queued until the bank returns')
      }

      const finalPayment = paymentsRepo.findPayment(db, payment.id)
      if (finalPayment.status === 'queued') {
        jobsRepo.enqueueJob(db, { type: 'process_payment', payload: { paymentId: payment.id } })
      }
      return { payment: finalPayment, events: paymentsRepo.listPaymentEvents(db, finalPayment.id), ledger: ledger.getPaymentHistory(finalPayment.id) }
    },
    cancel(userId, id) {
      const payment = paymentsRepo.findPayment(db, id)
      if (!payment || payment.user_id !== userId) throw new ApiError(404, 'Payment not found')
      if (['completed', 'failed', 'blocked', 'cancelled'].includes(payment.status)) throw new ApiError(409, 'Payment cannot be cancelled')
      const now = nowMs()
      paymentsRepo.updatePayment(db, payment.id, { status: 'cancelled', updated_at: now })
      paymentsRepo.addPaymentEvent(db, payment.id, payment.status, 'cancelled', 'Cancelled by user', now)
      ledger.recordPaymentEvent({ paymentId: payment.id, from: payment.status, to: 'cancelled', reason: 'Cancelled by user', at: now })
      return { payment: paymentsRepo.findPayment(db, payment.id), events: paymentsRepo.listPaymentEvents(db, payment.id), ledger: ledger.getPaymentHistory(payment.id) }
    },
    approve(userId, id) {
      const payment = paymentsRepo.findPayment(db, id)
      if (!payment) throw new ApiError(404, 'Payment not found')
      const now = nowMs()
      const approvals = paymentsRepo.findApprovalsByPayment(db, id)
      const pending = approvals.find((a) => a.status === 'pending')
      if (!pending) throw new ApiError(409, 'Approval already used or expired')
      if (Date.now() > pending.created_at + 300000) {
        paymentsRepo.updateApproval(db, pending.id, 'expired')
        throw new ApiError(410, 'Approval expired')
      }
      if (payment.user_id !== userId && pending.approver_id !== userId) {
        const isParent = db.firstRow("SELECT 1 FROM family_links WHERE parent_id = ? AND teen_id = ? AND status = 'active'", [userId, payment.user_id])
        if (!isParent) throw new ApiError(403, 'Not authorized to approve this payment')
      }
      paymentsRepo.updateApproval(db, pending.id, 'approved')
      paymentsRepo.updatePayment(db, id, { status: 'queued', updated_at: now })
      paymentsRepo.addPaymentEvent(db, id, payment.status, 'queued', 'Approved', now)
      ledger.recordApproval(id, userId, 'approved')
      ledger.recordPaymentEvent({ paymentId: id, from: payment.status, to: 'queued', reason: 'Approved', at: now })
      // Try immediate bank processing
      if (isBankAvailable(bankUpStatus())) {
        try {
          mockBankPay()
          paymentsRepo.updatePayment(db, id, { status: 'completed', completed_at: now, updated_at: now })
          paymentsRepo.addPaymentEvent(db, id, 'queued', 'completed', 'Settled by bank', now)
          ledger.recordPaymentEvent({ paymentId: id, from: 'queued', to: 'completed', reason: 'Settled by bank', at: now })
        } catch {}
      }
      return { payment: paymentsRepo.findPayment(db, id), events: paymentsRepo.listPaymentEvents(db, id), ledger: ledger.getPaymentHistory(id) }
    },
    decline(userId, id) {
      const payment = paymentsRepo.findPayment(db, id)
      if (!payment) throw new ApiError(404, 'Payment not found')
      const now = nowMs()
      const approvals = paymentsRepo.findApprovalsByPayment(db, id)
      const pending = approvals.find((a) => a.status === 'pending')
      if (!pending) throw new ApiError(409, 'Approval already used or expired')
      if (Date.now() > pending.created_at + 300000) {
        paymentsRepo.updateApproval(db, pending.id, 'expired')
        throw new ApiError(410, 'Approval expired')
      }
      if (payment.user_id !== userId && pending.approver_id !== userId) {
        const isParent = db.firstRow("SELECT 1 FROM family_links WHERE parent_id = ? AND teen_id = ? AND status = 'active'", [userId, payment.user_id])
        if (!isParent) throw new ApiError(403, 'Not authorized to decline this payment')
      }
      paymentsRepo.updateApproval(db, pending.id, 'declined')
      paymentsRepo.updatePayment(db, id, { status: 'declined', updated_at: now })
      paymentsRepo.addPaymentEvent(db, id, payment.status, 'declined', 'Declined', now)
      ledger.recordPaymentEvent({ paymentId: id, from: payment.status, to: 'declined', reason: 'Declined', at: now })
      return { payment: paymentsRepo.findPayment(db, id), events: paymentsRepo.listPaymentEvents(db, id), ledger: ledger.getPaymentHistory(id) }
    },
    findApprover(user) {
      if (user.role === 'teen') {
        const link = db.firstRow("SELECT parent_id FROM family_links WHERE teen_id = ? AND status = 'active'", [user.id])
        return link?.parent_id || null
      }
      return null
    },
    notify(userId, type, title, body) {
      // best-effort
      import('../../db/repos/notifications.js').then((m) => {
        m.createNotification(db, { userId, type, title, body })
      }).catch(() => {})
      if (config.vapidPublic && config.vapidPrivate) {
        // push sending optional
      }
    },
  }
}
// import config
import { config } from '../../config.js'

export { setBankUpStatus }












