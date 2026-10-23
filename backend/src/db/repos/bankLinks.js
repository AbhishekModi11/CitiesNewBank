import { newId, nowMs } from '../../lib/util.js'

export function listByUser(db, userId) {
  return db.allRows('SELECT * FROM bank_links WHERE user_id = ? ORDER BY created_at', [userId])
}

export function listActiveByUser(db, userId) {
  return db.allRows('SELECT * FROM bank_links WHERE user_id = ? AND status = ? ORDER BY created_at', [userId, 'active'])
}

export function findById(db, id) {
  return db.firstRow('SELECT * FROM bank_links WHERE id = ?', [id])
}

export function create(db, { userId, bankCode, bankName, last4, status = 'active', isPrimary = 0 }) {
  const id = newId()
  db.runStatement(
    'INSERT INTO bank_links (id, user_id, bank_code, bank_name, account_last4, is_primary, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [id, userId, bankCode, bankName, last4, isPrimary ? 1 : 0, status, nowMs()],
  )
  return { id, userId, bankCode, bankName, last4, is_primary: isPrimary ? 1 : 0, status }
}

export function setPrimary(db, userId, accountId) {
  db.runStatement('UPDATE bank_links SET is_primary = 0 WHERE user_id = ?', [userId])
  db.runStatement('UPDATE bank_links SET is_primary = 1 WHERE id = ? AND user_id = ?', [accountId, userId])
}

export function deactivate(db, id) {
  db.runStatement('UPDATE bank_links SET status = ? WHERE id = ?', ['inactive', id])
}
