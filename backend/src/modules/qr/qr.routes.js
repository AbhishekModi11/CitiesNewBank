import { Router } from 'express'
import { z } from 'zod'
import * as qrRepo from '../../db/repos/qrCodes.js'
import { authRequired, createValidation } from '../../http/auth.js'
import { ApiError } from '../../http/errorHandler.js'
import { POLICIES } from '../../../../guideware/policies.js'
import { amountQrExpiresAt } from '../../../../middleware/qr.js'

const createAmountSchema = z.object({
  body: z.object({
    amount: z.number().int().min(1).max(100000),
  }),
})

export function createQrRouter(db) {
  const router = Router()
  router.use(authRequired)

  router.get(['/me', '/qr/me'], (req, res) => {
    const qr = qrRepo.getActiveByUser(db, req.user.id)
    if (!qr) return res.status(404).json({ error: 'QR not found' })
    res.json({
      qr: {
        address: qr.address,
        displayName: req.user.name ?? 'CitiPay user',
        amount: qr.amount,
        status: qr.status,
        expiresAt: qr.expires_at,
      },
    })
  })

  router.post(['/amount', '/qr/amount'], createValidation(createAmountSchema), (req, res) => {
    const { amount } = req.validated.body
    const qr = qrRepo.createQr(db, { userId: req.user.id, amount })
    res.status(201).json({ qr: { address: qr.address, amount: qr.amount, expiresAt: qr.expiresAt } })
  })

  router.post(['/rotate', '/qr/rotate'], (req, res) => {
    const qr = qrRepo.rotateQr(db, req.user.id)
    res.json({ qr: { address: qr.address, amount: qr.amount, expiresAt: qr.expiresAt, rotateCount: qr.rotate_count } })
  })

  return router
}
