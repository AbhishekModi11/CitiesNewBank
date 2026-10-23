import initSqlJs from 'sql.js'
import fs from 'node:fs'

export async function createSqlDatabase(filePath = ':memory:') {
  const SQL = await initSqlJs()
  let db
  if (filePath !== ':memory:' && fs.existsSync(filePath)) {
    db = new SQL.Database(fs.readFileSync(filePath))
  } else {
    db = new SQL.Database()
  }
  const save = () => {
    if (filePath !== ':memory:') {
      fs.mkdirSync(filePath.split(/[\\/]/).slice(0, -1).join('/') || '.', { recursive: true })
      fs.writeFileSync(filePath, Buffer.from(db.export()))
    }
  }
  db.save = save
  db.runStatement = (sql, params = []) => {
    const statement = db.prepare(sql)
    statement.bind(params)
    while (statement.step()) {}
    statement.free()
    save()
  }
  db.allRows = (sql, params = []) => {
    const statement = db.prepare(sql)
    statement.bind(params)
    const rows = []
    while (statement.step()) rows.push(statement.getAsObject())
    statement.free()
    return rows
  }
  db.firstRow = (sql, params = []) => db.allRows(sql, params)[0] ?? null
  return db
}

export function migrate(db, sqlText) {
  db.exec(sqlText)
  try {
    db.runStatement('ALTER TABLE ledger_entries ADD COLUMN signature TEXT')
  } catch {
    // Column may already exist.
  }
  db.save()
}
