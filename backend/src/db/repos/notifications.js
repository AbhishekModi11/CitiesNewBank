import { newId, nowMs } from '../../lib/util.js'

export function createNotification(db, { userId, type, title, body }) {
  const id = newId()
  db.runStatement(
    'INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (?,?,?,?,?,?)',
    [id, userId, type, title, body, nowMs()],
  )
  return db.firstRow('SELECT * FROM notifications WHERE id = ?', [id])
}
export function listNotifications(db, userId) {
  return db.allRows('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId])
}
export function markRead(db, id) {
  db.runStatement('UPDATE notifications SET read = 1 WHERE id = ?', [id])
}
export function createPushSubscription(db, { userId, endpoint, p256dh, auth }) {
  const existing = db.firstRow('SELECT * FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', [userId, endpoint])
  if (existing) return existing
  const id = newId()
  db.runStatement(
    'INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) VALUES (?,?,?,?,?,?)',
    [id, userId, endpoint, p256dh ?? null, auth ?? null, nowMs()],
  )
  return db.firstRow('SELECT * FROM push_subscriptions WHERE id = ?', [id])
}
export function listPushSubscriptions(db, userId) {
  return db.allRows('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId])
}

