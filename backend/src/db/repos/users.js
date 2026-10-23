import { newId, nowMs } from '../../lib/util.js'

export function findUserByMobile(db, mobile) {
  return db.firstRow('SELECT * FROM users WHERE mobile = ?', [mobile])
}

export function findUserById(db, id) {
  return db.firstRow('SELECT * FROM users WHERE id = ?', [id])
}

export function createUser(db, { mobile, role, name, dateOfBirth, parentId }) {
  const id = newId()
  db.runStatement(
    'INSERT INTO users (id, mobile, role, name, date_of_birth, parent_id, created_at) VALUES (?,?,?,?,?,?,?)',
    [id, mobile, role, name, dateOfBirth ?? null, parentId ?? null, nowMs()],
  )
  return findUserById(db, id)
}

export function listUsers(db) {
  return db.allRows('SELECT id, mobile, role, name, created_at FROM users ORDER BY created_at')
}
