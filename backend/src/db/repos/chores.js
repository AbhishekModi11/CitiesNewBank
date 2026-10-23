import { newId, nowMs } from '../../lib/util.js'

export function createChore(db, { familyId, teenId, title, amount }) {
  const id = newId()
  db.runStatement('INSERT INTO chores (id, family_id, teen_id, title, amount, status, created_at) VALUES (?,?,?,?,?,?,?)',
    [id, familyId, teenId, title, amount, 'created', nowMs()])
  return db.firstRow('SELECT * FROM chores WHERE id = ?', [id])
}
export function listChores(db, { teenId, familyId } = {}) {
  if (teenId) return db.allRows('SELECT * FROM chores WHERE teen_id = ?', [teenId])
  if (familyId) return db.allRows('SELECT * FROM chores WHERE family_id = ?', [familyId])
  return db.allRows('SELECT * FROM chores')
}
export function setChoreStatus(db, id, status, extra = {}) {
  const extraKeys = Object.keys(extra)
  if (extraKeys.length === 0) {
    db.runStatement('UPDATE chores SET status = ? WHERE id = ?', [status, id])
  } else {
    db.runStatement(`UPDATE chores SET status = ?, ${extraKeys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [status, ...extraKeys.map((k) => extra[k]), id])
  }
  return db.firstRow('SELECT * FROM chores WHERE id = ?', [id])
}
export function createDispute(db, { paymentId, userId, reason }) {
  const id = newId()
  const now = nowMs()
  db.runStatement('INSERT INTO disputes (id, payment_id, user_id, reason, status, created_at, updated_at, deadline) VALUES (?,?,?,?,?,?,?,?)',
    [id, paymentId, userId, reason, 'open', now, now, now + 259200000])
  return db.firstRow('SELECT * FROM disputes WHERE id = ?', [id])
}
export function listDisputesByUser(db, userId) {
  return db.allRows('SELECT * FROM disputes WHERE user_id = ? ORDER BY created_at DESC', [userId])
}
export function listDisputesByPayment(db, paymentId) {
  return db.allRows('SELECT * FROM disputes WHERE payment_id = ?', [paymentId])
}

