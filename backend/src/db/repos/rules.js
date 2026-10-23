import { newId, nowMs } from '../../lib/util.js'

export function listRulesByTeen(db, teenId) {
  return db.allRows('SELECT * FROM rules WHERE teen_id = ?', [teenId])
}
export function createRule(db, { familyId = null, teenId = null, scope = 'tenant', category = null, amountCap = null, dailyCap = null }) {
  const id = newId()
  db.runStatement('INSERT INTO rules (id, family_id, teen_id, scope, category, amount_cap, daily_cap, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [id, familyId, teenId, scope, category, amountCap, dailyCap, nowMs()])
  return db.firstRow('SELECT * FROM rules WHERE id = ?', [id])
}
export function listFamilyLinks(db, parentId) {
  return db.allRows('SELECT * FROM family_links WHERE parent_id = ?', [parentId])
}
export function listTeensForParent(db, parentId) {
  return db.allRows('SELECT u.* FROM users u JOIN family_links f ON f.teen_id = u.id WHERE f.parent_id = ?', [parentId])
}

