import { describe, it, expect } from 'vitest'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSqlDatabase, migrate } from '../src/db/sqlite.js'
import { seedDatabase } from '../src/db/seed.js'
import { createApp } from '../src/app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('backend smoke', () => {
  it('starts and serves health', async () => {
    const db = await createSqlDatabase(':memory:')
    const schema = fs.readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8')
    migrate(db, schema)
    await seedDatabase(db)
    const app = createApp({ db })
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
