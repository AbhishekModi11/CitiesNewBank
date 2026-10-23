import { Router } from 'express'
import { authRequired } from '../../http/auth.js'
import { bankUpStatus, setBankUpStatus } from '../../integrations/bank/mockBank.js'
import { config } from '../../config.js'

export function createBanksRouter() {
  const router = Router()
  router.use(authRequired)
  router.get('/status', (req, res) => {
    res.json({ bankUp: bankUpStatus() })
  })
  router.post('/toggle', (req, res, next) => {
    if (!config.demo) return res.status(403).json({ error: 'Demo controls disabled' })
    const nextStatus = !bankUpStatus()
    setBankUpStatus(nextStatus)
    res.json({ bankUp: nextStatus })
  })
  return router
}

