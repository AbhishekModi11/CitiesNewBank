import { Router } from 'express'
import { authRequired } from '../../http/auth.js'
import { ApiError } from '../../http/errorHandler.js'
import { killSwitchState, activateKillSwitch, deactivateKillSwitch } from './killSwitchState.js'

export function createSafetyRouter() {
  const router = Router()
  router.use(authRequired)
  router.get('/kill-switch', (req, res) => {
    res.json({ killSwitch: killSwitchState })
  })
  router.post('/kill-switch', (req, res, next) => {
    try {
      const { active } = req.body || {}
      if (active) {
        activateKillSwitch()
      } else {
        if (!deactivateKillSwitch()) throw new ApiError(423, 'Kill switch locked')
      }
      res.json({ killSwitch: killSwitchState })
    } catch (e) { next(e) }
  })
  router.get('/limits', (req, res) => {
    res.json({ limits: { maxPayment: 100000 } })
  })
  return router
}
export { killSwitchState }
