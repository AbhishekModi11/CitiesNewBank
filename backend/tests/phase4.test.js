import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSqlDatabase, migrate } from '../src/db/sqlite.js'
import { seedDatabase } from '../src/db/seed.js'
import { createApp } from '../src/app.js'
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

describe('phase 4 checklist', () => {
  beforeAll(() => {
    setSmsDemoMode(true)
  })
  afterAll(() => {
    setSmsDemoMode(false)
  })

  it('rejects a payment from a user without a bank link', async () => {
    const { app } = await buildApp()
    const token = await login(app, '9000000009')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    expect(accounts.body.accounts).toHaveLength(0)
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ payee: 'Rahul', amount: 100, accountId: 'any-account' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/linked bank/i)
  })

  it('keeps a minor blocked until the guardian confirms', async () => {
    const { app } = await buildApp()
    const teenToken = await login(app, '9000000003')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${teenToken}`)
    const accountId = accounts.body.accounts[0].id
    const blocked = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${teenToken}`)
      .send({ payee: 'Rahul', amount: 100, accountId })
    expect(blocked.status).toBe(403)
    expect(blocked.body.error).toMatch(/guardian/i)

    const parentToken = await login(app, '9000000002')
    const confirmRes = await request(app)
      .post('/guardian/confirm')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ teenMobile: '9000000003' })
    expect(confirmRes.status).toBe(200)

    const afterConfirm = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${teenToken}`)
      .send({ payee: 'Rahul', amount: 100, accountId })
    expect([200, 201]).toContain(afterConfirm.status)
  })

  it('blocks account removal while a payment is pending', async () => {
    const { app } = await buildApp()
    const token = await login(app, '9000000001')
    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`)
    const accountId = accounts.body.accounts[0].id
    await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ payee: 'Rahul', amount: 100, accountId })
    const del = await request(app).delete(`/accounts/${accountId}`).set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(409)
  })

  it('issues amount qr codes that expire', async () => {
    const { app, db } = await buildApp()
    const token = await login(app, '9000000001')
    const created = await request(app)
      .post('/qr/amount')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500 })
    expect(created.status).toBe(201)
    const address = created.body.qr.address
    expect(String(address)).not.toMatch(/\d{4}/)

    db.runStatement('UPDATE qr_codes SET expires_at = ? WHERE address = ?', [Date.now() - 1000, address])
    const expired = await request(app).get('/qr/me').set('Authorization', `Bearer ${token}`)
    expect(expired.status).toBe(404)
  })

  it('rejects avatar uploads with an unsupported file type', async () => {
    const { app } = await buildApp()
    const token = await login(app, '9000000001')
    const res = await request(app)
      .post('/profile/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('not-an-image'), { filename: 'avatar.txt', contentType: 'text/plain' })
    expect(res.status).toBe(400)
  })
})
