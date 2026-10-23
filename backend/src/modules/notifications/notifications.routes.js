import { Router } from 'express'
import { authRequired } from '../../http/auth.js'
import * as notificationsRepo from '../../db/repos/notifications.js'
import * as pushRepo from '../../db/repos/notifications.js'

export function createNotificationsRouter(db) {
  const router = Router()
  router.use(authRequired)
  router.get('/', (req, res) => {
    res.json({ notifications: notificationsRepo.listNotifications(db, req.user.id) })
  })
  router.post('/subscribe', (req, res) => {
    const sub = req.body?.subscription || req.body || {}
    const saved = pushRepo.createPushSubscription(db, { userId: req.user.id, endpoint: sub.endpoint, p256dh: sub.keys?.p256dh, auth: sub.keys?.auth })
    res.status(201).json({ subscription: saved })
  })
  return router
}
