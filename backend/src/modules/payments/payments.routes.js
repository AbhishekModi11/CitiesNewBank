import { Router } from 'express'
import { z } from 'zod'
import { authRequired, createValidation } from '../../http/auth.js'
import * as usersRepo from '../../db/repos/users.js'

export function createPaymentsRouter(service, db) {
  const router = Router()
  router.use(authRequired)
  const createSchema = z.object({
    body: z.object({ payee: z.string().min(1), amount: z.number().int().positive(), accountId: z.string().min(1) }),
    params: z.object({}),
    query: z.object({}),
    headers: z.object({}).passthrough(),
  })

  router.get('/', (req, res) => {
    res.json({ payments: service.list(req.user.id) })
  })

  router.get('/:id', (req, res, next) => {
    try { res.json(service.get(req.user.id, req.params.id)) } catch (e) { next(e) }
  })

  router.post('/', createValidation(createSchema), (req, res, next) => {
    try {
      const user = usersRepo.findUserById(db, req.user.id)
      const idempotencyKey = req.get('idempotency-key') || req.get('Idempotency-Key')
      const result = service.create(user, req.validated.body, idempotencyKey)
      res.status(201).json(result)
    } catch (e) { next(e) }
  })

  router.post('/:id/cancel', (req, res, next) => {
    try { res.json(service.cancel(req.user.id, req.params.id)) } catch (e) { next(e) }
  })

  router.post('/:id/approve', (req, res, next) => {
    try { res.json(service.approve(req.user.id, req.params.id)) } catch (e) { next(e) }
  })

  router.post('/:id/decline', (req, res, next) => {
    try { res.json(service.decline(req.user.id, req.params.id)) } catch (e) { next(e) }
  })

  return router
}
