#!/usr/bin/env node
/**
 * One-time bootstrap: import ALL STOCK/ BUYBACK rows into SQLite.
 * Usage: node scripts/bootstrap-inventory.js
 */

import dotenv from 'dotenv'
import { bootstrapInventoryFromSheet } from '../lib/inventoryBootstrap.js'
import { closeDb } from '../lib/sqlite.js'

dotenv.config()

async function main() {
  console.log('Starting inventory bootstrap...')
  const result = await bootstrapInventoryFromSheet()
  console.log(`Bootstrap complete: ${result.imported} rows imported, ${result.totalInDb} in DB.`)
  closeDb()
}

main().catch((err) => {
  console.error('Bootstrap failed:', err.message)
  closeDb()
  process.exit(1)
})
