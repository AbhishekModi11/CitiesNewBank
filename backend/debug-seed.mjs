import { createSqlDatabase, migrate } from './src/db/sqlite.js'
import fs from 'node:fs'
import * as users from './src/db/repos/users.js'
import * as accounts from './src/db/repos/accounts.js'
import * as bankLinks from './src/db/repos/bankLinks.js'
import * as profiles from './src/db/repos/profiles.js'
import * as qrCodes from './src/db/repos/qrCodes.js'
import * as rules from './src/db/repos/rules.js'
import crypto from 'node:crypto'

const db = await createSqlDatabase(':memory:')
migrate(db, fs.readFileSync('../database/schema.sql', 'utf8'))
const step = async (label, fn) => {
  try { await fn(); console.log('OK  -', label) } catch (e) { console.log('FAIL-', label, String(e)) }
}

await step('users.createUser adult', async () => {
  const adult = users.createUser(db, { mobile: '9000000001', role: 'adult', name: 'Adult Demo' })
  console.log('  adult id', adult.id)
})
await step('users.createUser parent', async () => { users.createUser(db, { mobile: '9000000002', role: 'parent', name: 'Parent Demo' }) })
await step('users.createUser teen', async () => { users.createUser(db, { mobile: '9000000003', role: 'teen', name: 'Teen Demo' }) })
await step('profiles.saveProfile adult', async () => {
  profiles.saveProfile(db, { userId: 'u-adult', displayName: 'Adult Demo', dateOfBirth: '1990-01-15', gender: 'male', bio: 'Demo profile', avatar: null, guardianId: null, completedAt: Date.now() })
})
await step('bankLinks.create', async () => { const l = bankLinks.create(db, { userId: 'u1', bankCode: 'HDFC', bankName: 'HDFC Bank', last4: '4417' }); return l.id })
await step('bankLinks.setPrimary', async () => { bankLinks.setPrimary(db, 'b1') })
await step('accounts.createAccount', async () => { const a = accounts.createAccount(db, { id: 'b1', userId: 'u1', name: 'HDFC Bank', last4: '4417', balance: 48250 }); return a.id })
await step('accounts.createMandate', async () => { accounts.createMandate(db, { accountId: 'b1', label: 'Home loan EMI', amount: 3000, due: 'tomorrow' }) })
await step('qrCodes.createQr', async () => { const q = qrCodes.createQr(db, { userId: 'u1', amount: 500 }); return q.address })
await step('db.runStatement family', async () => { db.runStatement('INSERT INTO family_links (id, parent_id, teen_id, status, created_at) VALUES (?,?,?,?,?)', [crypto.randomUUID(), 'p1', 't1', 'active', Date.now()]) })
await step('db.runStatement rules', async () => { db.runStatement('INSERT INTO rules (id, family_id, teen_id, scope, category, amount_cap, daily_cap, created_at) VALUES (?,?,?,?,?,?,?,?)', [crypto.randomUUID(), 'family-1', 't1', 'teen', 'entertainment', 1000, 2000, Date.now()]) })
