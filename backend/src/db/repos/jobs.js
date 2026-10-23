import { newId, nowMs } from '../../lib/util.js'

export function enqueueJob(db, { type, payload, runAt = nowMs(), maxAttempts = 5 }) {
  const id = newId()
  db.runStatement(
    'INSERT INTO jobs (id, type, payload, run_at, attempts, max_attempts, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, type, JSON.stringify(payload), runAt, 0, maxAttempts, 'pending', nowMs(), nowMs()],
  )
  return db.firstRow('SELECT * FROM jobs WHERE id = ?', [id])
}

export function pollJobs(db, limit = 10, now = nowMs()) {
  return db.allRows(
    `SELECT * FROM jobs WHERE status IN ('pending','failed') AND run_at <= ? AND attempts < max_attempts ORDER BY run_at LIMIT ?`,
    [now, limit],
  )
}

export function updateJob(db, id, patch) {
  const mapped = {}
  for (const [key, value] of Object.entries(patch)) {
    const column = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
    mapped[column] = value
  }
  mapped.updated_at = nowMs()
  const keys = Object.keys(mapped)
  const values = keys.map((k) => mapped[k])
  db.runStatement(`UPDATE jobs SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...values, id])
  return db.firstRow('SELECT * FROM jobs WHERE id = ?', [id])
}

