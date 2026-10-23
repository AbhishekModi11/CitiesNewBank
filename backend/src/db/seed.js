import crypto from 'node:crypto'
import * as users from './repos/users.js'
import * as accounts from './repos/accounts.js'
import * as bankLinks from './repos/bankLinks.js'
import * as profiles from './repos/profiles.js'
import * as qrCodes from './repos/qrCodes.js'
import * as rules from './repos/rules.js'

export async function seedDatabase(db) {
  const count = db.firstRow('SELECT COUNT(*) AS c FROM users')
  if (count && count.c > 0) return

  const adult = users.createUser(db, { mobile: '9000000001', role: 'adult', name: 'Adult Demo' })
  const parent = users.createUser(db, { mobile: '9000000002', role: 'parent', name: 'Parent Demo' })
  const teen = users.createUser(db, { mobile: '9000000003', role: 'teen', name: 'Teen Demo' })

  profiles.saveProfile(db, {
    userId: adult.id,
    displayName: 'Adult Demo',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    bio: 'Demo profile',
    avatar: null,
    guardianId: null,
    completedAt: Date.now(),
  })
  profiles.saveProfile(db, {
    userId: parent.id,
    displayName: 'Parent Demo',
    dateOfBirth: '1988-06-20',
    gender: 'female',
    bio: 'Family wallet',
    avatar: null,
    guardianId: null,
    completedAt: Date.now(),
  })
  profiles.saveProfile(db, {
    userId: teen.id,
    displayName: 'Teen Demo',
    dateOfBirth: '2011-11-02',
    gender: 'male',
    bio: 'Demo teen profile',
    avatar: null,
    guardianId: null,
    completedAt: Date.now(),
  })

  const adultBank = bankLinks.create(db, { userId: adult.id, bankCode: 'HDFC', bankName: 'HDFC Bank', last4: '4417', status: 'active', isPrimary: 1 })
  bankLinks.setPrimary(db, adult.id, adultBank.id)
  accounts.createAccount(db, { id: adultBank.id, userId: adult.id, name: 'HDFC Bank', last4: '4417', balance: 48250 })
  accounts.createMandate(db, { accountId: adultBank.id, label: 'Home loan EMI', amount: 3000, due: 'tomorrow' })

  const teenBank = bankLinks.create(db, { userId: teen.id, bankCode: 'ICICI', bankName: 'ICICI Bank', last4: '1234', status: 'active', isPrimary: 1 })
  accounts.createAccount(db, { id: teenBank.id, userId: teen.id, name: 'ICICI Bank', last4: '1234', balance: 5000 })

  const parentBank = bankLinks.create(db, { userId: parent.id, bankCode: 'SBI', bankName: 'State Bank of India', last4: '9999', status: 'active', isPrimary: 1 })
  accounts.createAccount(db, { id: parentBank.id, userId: parent.id, name: 'State Bank of India', last4: '9999', balance: 100000 })

  qrCodes.createQr(db, { userId: adult.id, amount: 500 })

  db.runStatement(
    'INSERT INTO family_links (id, parent_id, teen_id, status, created_at) VALUES (?,?,?,?,?)',
    [crypto.randomUUID(), parent.id, teen.id, 'active', Date.now()],
  )

  db.runStatement(
    'INSERT INTO rules (id, family_id, teen_id, scope, category, amount_cap, daily_cap, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [crypto.randomUUID(), 'family-1', teen.id, 'teen', 'entertainment', 1000, 2000, Date.now()],
  )
}
