import { Router } from 'express'
import { queryLimiter } from '../middleware/rateLimiter.js'
import { upsertRow, deleteRow, validateImeiInStock, getRowCount } from '../lib/inventoryStore.js'
import { bootstrapInventoryFromSheet } from '../lib/inventoryBootstrap.js'
import { getDb } from '../lib/sqlite.js'

const router = Router()

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key']
  const expected = process.env.INVENTORY_API_KEY
  if (!expected) {
    return res.status(503).json({
      ok: false,
      code: 'INVENTORY_NOT_CONFIGURED',
      message: 'Inventory API key is not configured on the server.',
    })
  }
  if (key !== expected) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'Invalid API key.' })
  }
  next()
}

function requireWebhookSecret(req, res, next) {
  const secret = req.headers['x-webhook-secret']
  const expected = process.env.INVENTORY_WEBHOOK_SECRET
  if (!expected) {
    return res.status(503).json({
      ok: false,
      code: 'WEBHOOK_NOT_CONFIGURED',
      message: 'Inventory webhook secret is not configured.',
    })
  }
  if (secret !== expected) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'Invalid webhook secret.' })
  }
  next()
}

// Initialize SQLite on first inventory route hit
router.use((req, res, next) => {
  try {
    getDb()
    next()
  } catch (error) {
    console.error('SQLite init failed:', error.message)
    res.status(500).json({
      ok: false,
      code: 'DB_ERROR',
      message: 'Inventory database is unavailable.',
    })
  }
})

router.post('/webhooks/inventory', requireWebhookSecret, (req, res) => {
  const { action, sheetRow, year, imei, status } = req.body || {}

  if (!sheetRow || !Number.isInteger(Number(sheetRow))) {
    return res.status(400).json({ ok: false, message: 'sheetRow is required.' })
  }

  if (action === 'delete') {
    const result = deleteRow(Number(sheetRow))
    return res.json({ ok: true, ...result })
  }

  if (action === 'upsert') {
    const result = upsertRow({
      sheetRow: Number(sheetRow),
      year,
      imei,
      imeiRaw: imei,
      status,
    })
    if (result.skipped) {
      return res.status(400).json({ ok: false, message: 'Invalid IMEI in webhook payload.' })
    }
    return res.json({ ok: true, ...result })
  }

  return res.status(400).json({ ok: false, message: 'action must be upsert or delete.' })
})

router.get('/inventory/imei/:imei', requireApiKey, queryLimiter, (req, res) => {
  const result = validateImeiInStock(req.params.imei)
  const status = result.ok ? 200 : 400
  return res.status(status).json(result)
})

router.post('/inventory/bootstrap', requireApiKey, async (req, res) => {
  try {
    const result = await bootstrapInventoryFromSheet()
    return res.json({ ok: true, ...result })
  } catch (error) {
    console.error('Bootstrap failed:', error.message)
    return res.status(500).json({
      ok: false,
      code: 'BOOTSTRAP_FAILED',
      message: error.message,
    })
  }
})

router.get('/inventory/status', requireApiKey, (req, res) => {
  return res.json({
    ok: true,
    rowCount: getRowCount(),
    dbPath: process.env.SQLITE_PATH || 'data/inventory.db',
  })
})

export default router
