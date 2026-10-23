import { describe, it, expect } from 'vitest'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSqlDatabase, migrate } from '../src/db/sqlite.js'
import { seedDatabase } from '../src/db/seed.js'
import { createApp } from '../src/app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function buildApp() {
  const db = await createSqlDatabase(':memory:')
  const schema = fs.readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8')
  migrate(db, schema)
  await seedDatabase(db)
  return { app: createApp({ db }), db }
}

function getCookie(res, name) {
  const header = res.headers['set-cookie'] || []
  const line = header.find((c) => c.startsWith(name + '='))
  return line ? line.split(';')[0].split('=')[1] : null
}

describe('security rules', () => {
  it('lockout works', async () => {
    const { app } = await buildApp()
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/auth/login').send({ email: 'lockout@example.com', password: 'wrong' })
    }
    const res = await request(app).post('/auth/login').send({ email: 'lockout@example.com', password: 'wrong' })
    expect(res.status).toBe(429)
  })

  it('CSRF enforced', async () => {
    const { app } = await buildApp()
    const login = await request(app).post('/auth/login').send({ email: 'adult@example.com', password: 'password' })
    const session = getCookie(login, 'session')
    const res = await request(app).post('/auth/logout').set('Cookie', 'session=' + session)
    expect(res.status).toBe(403)
  })

  it('replayed approval rejected', async () => {
    const { app } = await buildApp()
    const teenToken = (await request(app).post('/auth/login').send({ email: 'teen@example.com', password: 'password' })).body.token
    const parentToken = (await request(app).post('/auth/login').send({ email: 'parent@example.com', password: 'password' })).body.token
    const accounts = await request(app).get('/accounts').set('Authorization', 'Bearer ' + teenToken)
    const accountId = accounts.body.accounts[0].id
    const created = await request(app).post('/payments').set('Authorization', 'Bearer ' + teenToken).send({ payee: 'Priya', amount: 6000, accountId })
    const id = created.body.payment.id
    await request(app).post('/payments/' + id + '/approve').set('Authorization', 'Bearer ' + parentToken)
    const second = await request(app).post('/payments/' + id + '/approve').set('Authorization', 'Bearer ' + parentToken)
    expect(second.status).toBeGreaterThanOrEqual(400)
  })

  it('expired approval rejected', async () => {
    const { app, db } = await buildApp()
    const teenToken = (await request(app).post('/auth/login').send({ email: 'teen@example.com', password: 'password' })).body.token
    const parentToken = (await request(app).post('/auth/login').send({ email: 'parent@example.com', password: 'password' })).body.token
    const accounts = await request(app).get('/accounts').set('Authorization', 'Bearer ' + teenToken)
    const accountId = accounts.body.accounts[0].id
    const created = await request(app).post('/payments').set('Authorization', 'Bearer ' + teenToken).send({ payee: 'Priya', amount: 6000, accountId })
    const id = created.body.payment.id
    const approval = db.firstRow('SELECT * FROM approvals WHERE payment_id = ?', [id])
    db.runStatement('UPDATE approvals SET created_at = ? WHERE id = ?', [Date.now() - 1000000, approval.id])
    const res = await request(app).post('/payments/' + id + '/approve').set('Authorization', 'Bearer ' + parentToken)
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
