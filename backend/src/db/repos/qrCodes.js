import { newId, nowMs } from '../../lib/util.js'
import { createPaymentAddress } from '../../../../middleware/qr.js'

export const getActiveByUser = (db, userId) =>
  db.firstRow(
    'SELECT * FROM qr_codes WHERE user_id = ? AND status = ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at DESC LIMIT 1',
    [userId, 'active', nowMs()],
  )

export const createQr = (db, { userId, amount }) => {
  db.runStatement("UPDATE qr_codes SET status = 'superseded' WHERE user_id = ? AND status = 'active'", [userId])
  const id = newId()
  const address = createPaymentAddress()
  const expiresAt = nowMs() + 900000
  db.runStatement(
    'INSERT INTO qr_codes (id, user_id, kind, amount, status, address, expires_at, rotate_count, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, userId, 'amount', amount, 'active', address, expiresAt, 0, nowMs()],
  )
  return { id, address, amount, expiresAt }
}

export const rotateQr = (db, userId) => {
  db.runStatement("UPDATE qr_codes SET status = 'rotated' WHERE user_id = ? AND status = 'active'", [userId])
  const created = createQr(db, { userId, amount: null })
  return { ...created, rotateCount: 1 }
}
