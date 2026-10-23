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

async function issueAndVerify(app, mobile) {
  const requestRes = await request(app).post('/auth/otp/request').send({ mobile })
  return (await verifyOtp(app, mobile, requestRes.body.demoOtp)).body.token
}

async function verifyOtp(app, mobile, otp) {
  const res = await request(app).post('/auth/otp/verify').send({ mobile, otp })
  return res
}

describe('auth otp flow', () => {
  beforeAll(() => {
    setSmsDemoMode(true)
  })
  afterAll(() => {
    setSmsDemoMode(false)
  })

  it('returns the otp only in demo mode', async () => {
    const { app } = await buildApp()
    const demo = await request(app).post('/auth/otp/request').send({ mobile: '9000000009' })
    expect(demo.status).toBe(200)
    expect(demo.body.demoOtp).toHaveLength(6)

    setSmsDemoMode(false)
    const real = await request(app).post('/auth/otp/request').send({ mobile: '9000000010' })
    expect(real.status).toBe(200)
    expect(real.body).not.toHaveProperty('demoOtp')
    setSmsDemoMode(true)
  })

  it('returns uniform responses for new and existing numbers', async () => {
    const { app } = await buildApp()
    const existing = await request(app).post('/auth/otp/request').send({ mobile: '9000000001' })
    const fresh = await request(app).post('/auth/otp/request').send({ mobile: '9000000099' })
    expect(Object.keys(existing.body).sort()).toEqual(Object.keys(fresh.body).sort())
    expect(existing.body.mobile).toBe('9000000001')
    expect(fresh.body.mobile).toBe('9000000099')
  })

  it('rate limits resend per number per hour', async () => {
    const { app } = await buildApp()
    const first = await request(app).post('/auth/otp/request').send({ mobile: '9000000012' })
    expect(first.status).toBe(200)
    const second = await request(app).post('/auth/otp/request').send({ mobile: '9000000012' })
    expect(second.status).toBe(429)
  })

  it('expires the otp and consumes it on single use', async () => {
    const { app, db } = await buildApp()
    const mobile = '9000000013'
    const requestRes = await request(app).post('/auth/otp/request').send({ mobile })
    const otp = requestRes.body.demoOtp
    const issued = db.firstRow('SELECT * FROM otp_requests WHERE mobile = ? ORDER BY created_at DESC LIMIT 1', [mobile])

    db.runStatement('UPDATE otp_requests SET expires_at = ? WHERE id = ?', [Date.now() - 1000, issued.id])
    const expired = await verifyOtp(app, mobile, otp)
    expect(expired.status).toBe(400)

    const requestRes2 = await request(app).post('/auth/otp/request').send({ mobile })
    const otp2 = requestRes2.body.demoOtp
    const ok = await verifyOtp(app, mobile, otp2)
    expect(ok.status).toBe(200)
    const replay = await verifyOtp(app, mobile, otp2)
    expect(replay.status).toBe(400)
  })

  it('locks out after five wrong attempts', async () => {
    const { app } = await buildApp()
    const mobile = '9000000014'
    const requestRes = await request(app).post('/auth/otp/request').send({ mobile })
    const otp = requestRes.body.demoOtp
    for (let i = 0; i < 5; i += 1) {
      const res = await verifyOtp(app, mobile, i === 4 ? otp : '000000')
      expect(res.status).toBe(400)
    }
    const locked = await verifyOtp(app, mobile, otp)
    expect(locked.status).toBe(429)
  })

  it('logs a user in through otp and reaches home data', async () => {
    const { app } = await buildApp()
    const token = await issueAndVerify(app, '9000000001')
    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`)
    expect(me.status).toBe(200)
    expect(me.body.user.mobile).toBe('9000000001')
  })
})
