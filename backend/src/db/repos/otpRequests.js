import { newId, nowMs } from '../../lib/util.js'

export function createOtpRequest(db, { mobile, otpSalt, otpHash, expiresAt }) {
  const id = newId()
  db.runStatement(
    'INSERT INTO otp_requests (id, mobile, otp_salt, otp_hash, expires_at, created_at) VALUES (?,?,?,?,?,?)',
    [id, mobile, otpSalt, otpHash, expiresAt, nowMs()],
  )
  return { id }
}

export function findLatestOtpRequest(db, mobile) {
  const rows = db.allRows(
    'SELECT * FROM otp_requests WHERE mobile = ? ORDER BY created_at DESC LIMIT 1',
    [mobile],
  )
  return rows[0] ?? null
}

export function markOtpConsumed(db, id) {
  db.runStatement('UPDATE otp_requests SET consumed_at = ? WHERE id = ?', [nowMs(), id])
}

export function recordOtpFailure(db, id) {
  db.runStatement('UPDATE otp_requests SET attempts = attempts + 1 WHERE id = ?', [id])
}
