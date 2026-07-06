import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let db = null

function getDbPath() {
  return process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'inventory.db')
}

function runMigrations(database) {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_inventory_rows.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  database.exec(sql)
}

export function getDb() {
  if (db) return db

  const dbPath = getDbPath()
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  runMigrations(db)
  console.log(`SQLite inventory DB ready at ${dbPath}`)
  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
