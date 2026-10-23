import { newId, nowMs } from '../../lib/util.js'

export function findByIdempotencyKey(db, key, userId) {
  return db.firstRow('SELECT * FROM payments WHERE idempotency_key = ? AND user_id = ?', [key, userId])
}
export function findPayment(db, id) {
  return db.firstRow('SELECT * FROM payments WHERE id = ?', [id])
}
export function listPaymentsByUser(db, userId) {
  return db.allRows('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [userId])
}
export function createPayment(db, input) {
  const id = input.id
  db.runStatement(
    `INSERT INTO payments (id, idempotency_key, user_id, account_id, payee, amount, status, reason, risk_score, cooling_until, retry_count, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, input.idempotencyKey ?? null, input.userId, input.accountId, input.payee, input.amount, input.status, input.reason ?? null, input.riskScore, input.coolingUntil ?? null, 0, input.now, input.now],
  )
  return findPayment(db, id)
}
export function updatePayment(db, id, patch) {
  const fields = []
  const values = []
  for (const [key, value] of Object.entries(patch)) {
    const column = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
    fields.push(`${column} = ?`)
    values.push(value)
  }
  values.push(id)
  db.runStatement(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, values)
  return findPayment(db, id)
}
export function addPaymentEvent(db, paymentId, fromState, toState, reason, at = nowMs()) {
  db.runStatement(
    'INSERT INTO payment_events (id, payment_id, from_state, to_state, reason, at) VALUES (?,?,?,?,?,?)',
    [newId(), paymentId, fromState, toState, reason ?? null, at],
  )
}
export function listPaymentEvents(db, paymentId) {
  return db.allRows('SELECT * FROM payment_events WHERE payment_id = ? ORDER BY at', [paymentId])
}
export function listApprovalsByPayment(db, paymentId) {
  return db.allRows('SELECT * FROM approvals WHERE payment_id = ?', [paymentId])
}
export function createApproval(db, { paymentId, approverId }) {
  const id = newId()
  db.runStatement('INSERT INTO approvals (id, payment_id, approver_id, status, created_at) VALUES (?,?,?,?,?)', [id, paymentId, approverId, 'pending', nowMs()])
  return db.firstRow('SELECT * FROM approvals WHERE id = ?', [id])
}
export function updateApproval(db, id, status) {
  db.runStatement('UPDATE approvals SET status = ?, decided_at = ? WHERE id = ?', [status, nowMs(), id])
  return db.firstRow('SELECT * FROM approvals WHERE id = ?', [id])
}
export function findApprovalsByPayment(db, paymentId) {
  return db.allRows('SELECT * FROM approvals WHERE payment_id = ?', [paymentId])
}
export function getPaymentTimeline(db, paymentId) {
  return listPaymentEvents(db, paymentId)
}

