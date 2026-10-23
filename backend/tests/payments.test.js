import { describe, it, expect } from 'vitest'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSqlDatabase, migrate } from '../src/db/sqlite.js'
import { seedDatabase } from '../src/db/seed.js'
import { createApp } from '../src/app.js'
import { bankUpStatus, setBankUpStatus } from '../src/integrations/bank/mockBank.js'
import { pollJobs } from '../src/db/repos/jobs.js'
import { tamperForTest } from '../src/db/repos/ledger.js'
import { createLedger } from '../src/integrations/ledger/index.js'
import { config } from '../src/config.js'
import { setSmsDemoMode } from '../src/integrations/sms/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function buildApp() {
  const db = await createSqlDatabase(':memory:')
  const schema = fs.readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8')
  migrate(db, schema)
  await seedDatabase(db)
  return { app: createApp({ db }), db }
}

async function login(app, mobile) {
  const requestRes = await request(app).post('/auth/otp/request').send({ mobile })
  const verifyRes = await request(app).post('/auth/otp/verify').send({ mobile, otp: requestRes.body.demoOtp })
  return verifyRes.body.token
}

describe('backend payments', () => {
  it('blocks a rule-breaking teen payment the client allowed', async () => {
    const { app } = await buildApp()
    const parentToken = await login(app, '9000000002')
    await request(app).post('/guardian/confirm').set('Authorization', `Bearer ${parentToken}`).send({ teenMobile: '9000000003' })
    const token = await login(app, '9000000003')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const accountId = accounts.body.accounts[0].id
    const res = await request(app).post('/payments').set('Authorization', `Bearer ${token}`).send({ payee: 'Games', amount: 3000, accountId })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('minor above 5000 needs parent approval once guardian confirmed', async () => {
    const { app } = await buildApp()
    const parentToken = await login(app, '9000000002')
    const confirmRes = await request(app).post('/guardian/confirm').set('Authorization', `Bearer ${parentToken}`).send({ teenMobile: '9000000003' })
    expect(confirmRes.status).toBe(200)

    const teenToken = await login(app, '9000000003')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${teenToken}`)
    const accountId = accounts.body.accounts[0].id
    const res = await request(app).post('/payments').set('Authorization', `Bearer ${teenToken}`).send({ payee: 'Priya', amount: 6000, accountId })
    expect([200, 201]).toContain(res.status)
    expect(res.body.payment.status).toBe('awaiting_approval')
  })

  it('duplicate idempotency key does not debit twice', async () => {
    const { app } = await buildApp()
    const token = await login(app, '9000000001')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const account = accounts.body.accounts[0]
    const before = account.balance
    const first = await request(app).post('/payments').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'idem-1').send({ payee: 'Rahul', amount: 200, accountId: account.id })
    const second = await request(app).post('/payments').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'idem-1').send({ payee: 'Rahul', amount: 200, accountId: account.id })
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    const afterAccounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const acc = afterAccounts.body.accounts.find((a) => a.id === account.id)
    expect(acc.balance).toBe(before - 200)
  })

  it('bank down then up completes the payment exactly once', async () => {
    const { app, db } = await buildApp()
    const token = await login(app, '9000000001')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const account = accounts.body.accounts[0]
    setBankUpStatus(false)
    const first = await request(app).post('/payments').set('Authorization', `Bearer ${token}`).send({ payee: 'Rahul', amount: 150, accountId: account.id })
    expect(first.status).toBe(201)
    expect(first.body.payment.status).toBe('queued')
    setBankUpStatus(true)
    await new Promise((resolve) => setTimeout(resolve, 3500))
    const after = await request(app).get(`/payments/${first.body.payment.id}`).set('Authorization', `Bearer ${token}`)
    expect(after.body.payment.status).toBe('completed')
    const afterAccounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const acc = afterAccounts.body.accounts.find((a) => a.id === account.id)
    expect(acc.balance).toBe(account.balance - 150)
  })
})

describe('ledger', () => {
  it('chain verifies', async () => {
    const { app } = await buildApp()
    const token = await login(app, '9000000001')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const accountId = accounts.body.accounts[0].id
    await request(app).post('/payments').set('Authorization', `Bearer ${token}`).send({ payee: 'Rahul', amount: 100, accountId })
    const verify = await request(app).get('/ledger/verify')
    expect(verify.body.valid).toBe(true)
  })
})

describe('assistant', () => {
  it('refuses to move money or reveal OTP', async () => {
    const { app } = await buildApp()
    const token = await login(app, '9000000001')
    const res1 = await request(app).post('/assistant/message').set('Authorization', `Bearer ${token}`).send({ message: 'Send 100 to Rahul' })
    const res2 = await request(app).post('/assistant/message').set('Authorization', `Bearer ${token}`).send({ message: 'What is my OTP?' })
    expect(res1.body.reply).toMatch(/cannot move money/)
    expect(res2.body.reply).toMatch(/cannot move money|reveal secrets/)
  })
})

describe('ledger tamper', () => {
  it('detects a changed entry', async () => {
    const { app, db } = await buildApp()
    const token = await login(app, '9000000001')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const accountId = accounts.body.accounts[0].id
    await request(app).post('/payments').set('Authorization', `Bearer ${token}`).send({ payee: 'Rahul', amount: 100, accountId })
    const ledger = createLedger(db, config)
    const entries = (await import('../src/db/repos/ledger.js')).allEntries(db)
    tamperForTest(db, entries[0].id)
    const verify = ledger.verifyChain()
    expect(verify.valid).toBe(false)
  })
})
