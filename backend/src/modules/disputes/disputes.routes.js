import { Router } from 'express'
import { authRequired } from '../../http/auth.js'
import { createDispute } from '../../db/repos/chores.js'
import { listDisputesByUser } from '../../db/repos/chores.js'
import * as paymentsRepo from '../../db/repos/payments.js'

export function createDisputesRouter(db) {
  const router = Router()
  router.use(authRequired)
  router.get('/', (req, res) => {
    res.json({ disputes: listDisputesByUser(db, req.user.id) })
  })
  router.post('/payments/:id', (req, res, next) => {
    try {
      const payment = paymentsRepo.findPayment(db, req.params.id)
      if (!payment || payment.user_id !== req.user.id) throw new Error('not found')
      const dispute = createDispute(db, { paymentId: payment.id, userId: req.user.id, reason: (req.body || {}).reason || 'dispute' })
      res.status(201).json({ dispute })
    } catch (e) { next(e) }
  })
  return router
}

