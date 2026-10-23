import { newId, nowMs } from '../../lib/util.js'

export function listAccountsByUser(db, userId) {
  return db.allRows('SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at', [userId])
}
export function findAccount(db, id) {
  return db.firstRow('SELECT * FROM accounts WHERE id = ?', [id])
}
export function createAccount(db, { id = newId(), userId, name, last4, balance }) {
  db.runStatement(
    'INSERT INTO accounts (id, user_id, name, last4, balance, created_at) VALUES (?,?,?,?,?,?)',
    [id, userId, name, last4, balance, nowMs()],
  )
  return findAccount(db, id)
}
export function updateBalance(db, id, balance) {
  db.runStatement('UPDATE accounts SET balance = ? WHERE id = ?', [balance, id])
  return findAccount(db, id)
}
export function listMandatesByAccount(db, accountId) {
  return db.allRows('SELECT * FROM mandates WHERE account_id = ?', [accountId])
}
export function createMandate(db, { accountId, label, amount, due }) {
  const id = newId()
  db.runStatement('INSERT INTO mandates (id, account_id, label, amount, due) VALUES (?,?,?,?,?)', [id, accountId, label, amount, due])
  return { id, accountId, label, amount, due }
}

