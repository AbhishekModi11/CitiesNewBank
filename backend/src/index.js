import { createSqlDatabase, migrate } from './db/sqlite.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { seedDatabase } from './db/seed.js'
import { config } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const dbPath = path.resolve(process.cwd(), config.dbPath)
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = await createSqlDatabase(dbPath)
  const schema = fs.readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8')
  migrate(db, schema)
  await seedDatabase(db)
  const app = createApp({ db })
  app.listen(config.port, () => {
    console.log('Backend listening on port ' + config.port)
  })
}

main().catch(() => { process.exit(1) })
