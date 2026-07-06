import { getDb } from './sqlite.js'
import { normalizeImei } from './validateImei.js'

const IN_STOCK_STATUS = 'Available'

function getMinYear() {
  return parseInt(process.env.GOOGLE_INVENTORY_MIN_YEAR || '2025', 10)
}

export function upsertRow({ sheetRow, year, imei, imeiRaw, status }) {
  const database = getDb()
  const normalized = normalizeImei(imei)
  if (!normalized || !/^\d{15}$/.test(normalized)) {
    return { skipped: true, reason: 'invalid_imei' }
  }

  const stmt = database.prepare(`
    INSERT INTO inventory_rows (sheet_row, year, imei_raw, imei, status, updated_at)
    VALUES (@sheetRow, @year, @imeiRaw, @imei, @status, @updatedAt)
    ON CONFLICT(sheet_row) DO UPDATE SET
      year = excluded.year,
      imei_raw = excluded.imei_raw,
      imei = excluded.imei,
      status = excluded.status,
      updated_at = excluded.updated_at
  `)

  stmt.run({
    sheetRow,
    year: Number(year) || 0,
    imeiRaw: imeiRaw || imei || '',
    imei: normalized,
    status: String(status || '').trim(),
    updatedAt: new Date().toISOString(),
  })

  return { ok: true, sheetRow, imei: normalized }
}

export function deleteRow(sheetRow) {
  const database = getDb()
  const result = database.prepare('DELETE FROM inventory_rows WHERE sheet_row = ?').run(sheetRow)
  return { ok: true, deleted: result.changes }
}

export function countAvailable(imei, minYear = getMinYear()) {
  const database = getDb()
  const normalized = normalizeImei(imei)
  if (!normalized) return 0

  const row = database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM inventory_rows
       WHERE imei = ?
         AND status = ?
         AND year >= ?`
    )
    .get(normalized, IN_STOCK_STATUS, minYear)

  return row?.count || 0
}

export function getRowCount() {
  const database = getDb()
  const row = database.prepare('SELECT COUNT(*) AS count FROM inventory_rows').get()
  return row?.count || 0
}

export function replaceAllRows(rows) {
  const database = getDb()
  const insert = database.prepare(`
    INSERT INTO inventory_rows (sheet_row, year, imei_raw, imei, status, updated_at)
    VALUES (@sheetRow, @year, @imeiRaw, @imei, @status, @updatedAt)
  `)

  const tx = database.transaction((items) => {
    database.exec('DELETE FROM inventory_rows')
    for (const item of items) {
      insert.run(item)
    }
  })

  tx(rows)
  return rows.length
}

/**
 * Tom's rule: 0 in-stock rows → reject, 1 → allow, 2+ → duplicate error.
 */
export function validateImeiInStock(imei) {
  const normalized = normalizeImei(imei)
  if (!normalized || !/^\d{15}$/.test(normalized)) {
    return {
      ok: false,
      code: 'INVALID_IMEI',
      message: 'IMEI must be 15 digits, optionally prefixed with R. No spaces.',
    }
  }

  const count = countAvailable(normalized)
  if (count === 0) {
    return {
      ok: false,
      code: 'NOT_IN_STOCK',
      message:
        'This IMEI is not in inventory. Please feed the device into stock first before completing the sale.',
    }
  }
  if (count > 1) {
    return {
      ok: false,
      code: 'DUPLICATE_IMEI',
      message:
        'Duplicate in-stock IMEI found in inventory. Please contact admin to clean up the sheet before selling.',
    }
  }

  return { ok: true, imei: normalized }
}
