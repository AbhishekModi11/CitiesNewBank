import { Router } from 'express'
import { authRequired } from '../../http/auth.js'
import { createAssistantService } from './assistant.service.js'

export function createAssistantRouter(db, config) {
  const router = Router()
  router.use(authRequired)
  const service = createAssistantService(db, config)
  router.post('/message', async (req, res, next) => {
    try {
      const user = { id: req.user.id, role: req.user.role }
      const result = await service.message(user, req.body?.message || '')
      res.json(result)
    } catch (e) { next(e) }
  })
  return router
}
