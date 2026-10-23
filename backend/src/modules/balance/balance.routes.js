import { Router } from 'express'
import * as accountsRepo from '../../db/repos/accounts.js'
import { authRequired } from '../../http/auth.js'

export function createBalanceRouter(db) {
  const router = Router()
  router.use(authRequired)

  router.get('/balances/check', (req, res) => {
    const accounts = accountsRepo.listAccountsByUser(db, req.user.id)
    res.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        bank: a.name,
        last4: a.last4,
        balance: a.balance,
        currency: 'INR',
        mandate: null,
      })),
    })
  })

  return router
}
