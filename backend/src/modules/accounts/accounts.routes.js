import { Router } from 'express'
import { z } from 'zod'
import * as accountsRepo from '../../db/repos/accounts.js'
import * as bankLinksRepo from '../../db/repos/bankLinks.js'
import { authRequired, createValidation } from '../../http/auth.js'
import { ApiError } from '../../http/errorHandler.js'
import { bankUpStatus } from '../../integrations/bank/mockBank.js'

const startSchema = z.object({
  body: z.object({ bankCode: z.string().min(2).max(8) }),
})

const verifySchema = z.object({
  body: z.object({
    bankLinkId: z.string().min(1),
    accountLast4: z.string().regex(/^\d{4}$/).optional(),
  }),
})

export function createAccountsRouter(db) {
  const router = Router()
  router.use(authRequired)

  router.get('/', (req, res) => {
    res.json({ accounts: accountsRepo.listAccountsByUser(db, req.user.id) })
  })

  router.post('/link/start', createValidation(startSchema), (req, res) => {
    const bankCode = req.validated.body.bankCode
    const bankLink = bankLinksRepo.create(db, {
      userId: req.user.id,
      bankCode,
      bankName: `Bank ${bankCode}`,
      last4: '0000',
    })
    const banks = [
      { code: 'HDFC', name: 'HDFC Bank' },
      { code: 'ICICI', name: 'ICICI Bank' },
      { code: 'SBI', name: 'State Bank of India' },
      { code: 'AXIS', name: 'Axis Bank' },
      { code: 'KOTAK', name: 'Kotak Mahindra Bank' },
    ]
    res.json({ bankLinkId: bankLink.id, banks, nextStep: 'choose_account' })
  })

  router.post('/link/verify', createValidation(verifySchema), async (req, res, next) => {
    try {
      const { bankLinkId } = req.validated.body
      const link = bankLinksRepo.findById(db, bankLinkId)
      if (!link || link.user_id !== req.user.id) throw new ApiError(404, 'Bank link not found')
      if (link.status !== 'pending') throw new ApiError(400, 'Bank link is not pending')

      if (!bankUpStatus()) throw new ApiError(503, 'Bank is temporarily unavailable')

      const accountLast4 = req.validated.body.accountLast4 ?? link.account_last4
      if (!/^\d{4}$/.test(accountLast4)) throw new ApiError(400, 'Enter a valid account number ending')

      bankLinksRepo.deactivate(db, link.id)
      bankLinksRepo.setPrimary(db, link.id)
      const account = accountsRepo.createAccount(db, {
        id: link.id,
        userId: req.user.id,
        name: link.bank_name,
        last4: accountLast4,
        balance: 15000 + Math.floor(Math.random() * 40000),
      })
      res.json({ account, bankLink: { id: link.id, status: 'active', accountLast4 } })
    } catch (err) { next(err) }
  })

  router.patch(['/:id/primary', '/accounts/:id/primary'], (req, res) => {
    const account = accountsRepo.findAccount(db, req.params.id)
    if (!account || account.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' })
    bankLinksRepo.setPrimary(db, req.user.id, account.id)
    res.json({ account })
  })

  router.delete('/:id', (req, res, next) => {
    try {
      const account = accountsRepo.findAccount(db, req.params.id)
      if (!account || account.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' })
      const pending = db.allRows(
        "SELECT id FROM payments WHERE account_id = ? AND status IN ('requested','awaiting_approval','cooling','queued','processing')",
        [account.id],
      )
      const mandates = accountsRepo.listMandatesByAccount(db, account.id)
      if (pending.length > 0 || mandates.length > 0) {
        throw new ApiError(409, 'Account cannot be removed while a payment is pending or a mandate is active')
      }
      bankLinksRepo.deactivate(db, account.id)
      db.runStatement('DELETE FROM bank_links WHERE id = ?', [account.id])
      db.runStatement('DELETE FROM accounts WHERE id = ?', [account.id])
      res.json({ ok: true })
    } catch (err) { next(err) }
  })

  return router
}
