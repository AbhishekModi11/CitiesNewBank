import { newId, nowMs } from '../../lib/util.js'

export function findByToken(db, token) {
  return db.firstRow('SELECT * FROM device_sessions WHERE token = ?', [token])
}

export function touch(db, token, now = nowMs()) {
  db.runStatement('UPDATE device_sessions SET last_seen_at = ? WHERE token = ?', [now, token])
}

export function create(db, { userId, token }) {
  const id = newId()
  db.runStatement(
    'INSERT INTO device_sessions (id, user_id, token, created_at, last_seen_at, expires_at) VALUES (?,?,?,?,?,?)',
    [id, userId, token, nowMs(), nowMs(), nowMs() + 24 * 3600 * 1000],
  )
  return { id, userId, token }
}

export function revoke(db, token) {
  db.runStatement('DELETE FROM device_sessions WHERE token = ?', [token])
}
