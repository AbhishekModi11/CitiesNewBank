import { newId, nowMs } from '../../lib/util.js'

export function getProfile(db, userId) {
  return db.firstRow('SELECT * FROM profiles WHERE user_id = ?', [userId])
}

export function saveProfile(db, input) {
  const existing = getProfile(db, input.userId)
  const completedAt = input.completedAt ?? nowMs()
  if (existing) {
    db.runStatement(
      'UPDATE profiles SET display_name = ?, date_of_birth = ?, gender = ?, bio = ?, avatar = ?, guardian_id = ?, completed_at = ? WHERE user_id = ?',
      [
        input.displayName,
        input.dateOfBirth ?? null,
        input.gender ?? null,
        input.bio ?? '',
        input.avatar ?? null,
        input.guardianId ?? null,
        completedAt,
        input.userId,
      ],
    )
    return getProfile(db, input.userId)
  }
  const id = newId()
  db.runStatement(
    'INSERT INTO profiles (id, user_id, display_name, date_of_birth, gender, bio, avatar, guardian_id, completed_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [
      id,
      input.userId,
      input.displayName,
      input.dateOfBirth ?? null,
      input.gender ?? null,
      input.bio ?? '',
      input.avatar ?? null,
      input.guardianId ?? null,
      completedAt,
      nowMs(),
    ],
  )
  return getProfile(db, input.userId)
}

export function confirmGuardian(db, guardianUserId, teenUserId) {
  db.runStatement(
    'UPDATE guardian_links SET status = ?, consent_recorded_at = ? WHERE teen_id = ? AND parent_id = ?',
    ['confirmed', nowMs(), teenUserId, guardianUserId],
  )
}

export function getGuardianLink(db, teenUserId) {
  return db.firstRow('SELECT * FROM guardian_links WHERE teen_id = ? ORDER BY created_at DESC LIMIT 1', [teenUserId])
}

export function upsertGuardianLink(db, { teenId, parentId }) {
  const existing = db.firstRow('SELECT * FROM guardian_links WHERE teen_id = ? ORDER BY created_at DESC LIMIT 1', [teenId])
  if (existing) {
    db.runStatement('UPDATE guardian_links SET parent_id = ?, status = ? WHERE id = ?', [parentId, 'pending', existing.id])
    return { id: existing.id, status: 'pending' }
  }
  const id = newId()
  db.runStatement(
    'INSERT INTO guardian_links (id, teen_id, parent_id, status, created_at) VALUES (?,?,?,?,?)',
    [id, teenId, parentId, 'pending', nowMs()],
  )
  return { id, status: 'pending' }
}
