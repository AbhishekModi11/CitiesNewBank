import crypto from 'node:crypto'
import { newId, nowMs } from '../../lib/util.js'

export function appendEntry(db, { entryType, paymentId = null, payload, signature = null }) {
  const rows = db.allRows('SELECT sequence, hash FROM ledger_entries ORDER BY sequence DESC LIMIT 1')
  const prev = rows[0]
  const sequence = prev ? prev.sequence + 1 : 1
  const id = newId()
  const createdAt = nowMs()
  const prevHash = prev?.hash ?? null
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ id, sequence, entryType, paymentId, payload, createdAt, prevHash }))
    .digest('hex')
  db.runStatement(
    'INSERT INTO ledger_entries (id, sequence, entry_type, payment_id, payload, prev_hash, hash, signature, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, sequence, entryType, paymentId, JSON.stringify(payload), prevHash, hash, signature, createdAt],
  )
  return db.firstRow('SELECT * FROM ledger_entries WHERE id = ?', [id])
}

export function historyByPayment(db, paymentId) {
  return db.allRows('SELECT * FROM ledger_entries WHERE payment_id = ? ORDER BY sequence', [paymentId])
}

export function allEntries(db) {
  return db.allRows('SELECT * FROM ledger_entries ORDER BY sequence')
}

export function verifyChain(db) {
  const entries = allEntries(db)
  let prevHash = null
  for (const entry of entries) {
    const payload = JSON.parse(entry.payload)
    const expected = crypto
      .createHash('sha256')
      .update(JSON.stringify({ id: entry.id, sequence: entry.sequence, entryType: entry.entry_type, paymentId: entry.payment_id, payload, createdAt: entry.created_at, prevHash }))
      .digest('hex')
    if (entry.prev_hash !== prevHash) return { valid: false, reason: 'prev_hash mismatch', entryId: entry.id }
    if (entry.hash !== expected) return { valid: false, reason: 'hash mismatch', entryId: entry.id }
    prevHash = entry.hash
  }
  return { valid: true, count: entries.length }
}

export function tamperForTest(db, id) {
  db.runStatement('UPDATE ledger_entries SET payload = ? WHERE id = ?', ['{"tampered":true}', id])
}


