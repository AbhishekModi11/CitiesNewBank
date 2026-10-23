import { createSqlDatabase, migrate } from './src/db/sqlite.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as users from './src/db/repos/users.js'
import * as accounts from './src/db/repos/accounts.js'
import * as bankLinks from './src/db/repos/bankLinks.js'
import * as profiles from './src/db/repos/profiles.js'
import * as qrCodes from './src/db/repos/qrCodes.js'
import * as rules from './src/db/repos/rules.js'
import { seedDatabase } from './src/db/seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = await createSqlDatabase(':memory:')
const schema = fs.readFileSync(path.resolve(__dirname, '../database/schema.sql'), 'utf8')
migrate(db, schema)
console.log('MIGRATED')

try { console.log('users count', db.firstRow('SELECT COUNT(*) AS c FROM users')) } catch (e) { console.error('ERR count', e) }
try { const u = users.createUser(db, { mobile: '9000000001', role: 'adult', name: 'Adult Demo' }); console.log('USER OK') } catch (e) { console.error('ERR user', e) }
try { const p = profiles.saveProfile(db, { userId: u.id, displayName: 'x', dateOfBirth: '1990-01-15', gender: 'male', bio: 'b', avatar: null, guardianId: null, completedAt: Date.now() }); console.log('PROFILE OK', p) } catch (e) { console.error('ERR profile', e) }
try { const b = bankLinks.create(db, { userId: u.id, bankCode: 'HDFC', bankName: 'HDFC Bank', last4: '4417' }); console.log('BANKLINK OK', b) } catch (e) { console.error('ERR banklink', e) }
try { const a = accounts.createAccount(db, { id: b.id, userId: u.id, name: 'HDFC Bank', last4: '4417', balance: 48250 }); console.log('ACCOUNT OK', a) } catch (e) { console.error('ERR account', e) }
try { const m = accounts.createMandate(db, { accountId: a.id, label: 'EMI', amount: 3000, due: 'tomorrow' }); console.log('MANDATE OK', m) } catch (e) { console.error('ERR mandate', e) }
try { const q = qrCodes.createQr(db, { userId: u.id, amount: 500 }); console.log('QR OK', q) } catch (e) { console.error('ERR qr', e) }
try { const r = rules.createRule?.(db, {}) ?? null; console.log('RULE OK') } catch (e) { console.error('ERR rule', e) }
try { await seedDatabase(db); console.log('SEED OK') } catch (e) { console.error('ERR seed', e) }
process.exit(0)
