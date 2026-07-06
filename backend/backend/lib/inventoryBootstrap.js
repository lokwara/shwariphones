import { google } from 'googleapis'
import { normalizeImei } from './validateImei.js'
import { replaceAllRows, getRowCount } from './inventoryStore.js'

const DEFAULT_SHEET_NAME = 'ALL STOCK/ BUYBACK'
const DEFAULT_MAX_ROWS = 150000

function quoteSheetRange(sheetName, a1Range) {
  const escaped = String(sheetName).replace(/'/g, "''")
  return `'${escaped}'!${a1Range}`
}

async function getSheetsClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set')
  }

  let credentialsObj
  try {
    credentialsObj = JSON.parse(credentials)
  } catch {
    const fs = await import('fs')
    const path = await import('path')
    const credPath = path.isAbsolute(credentials)
      ? credentials
      : path.join(process.cwd(), credentials)
    credentialsObj = JSON.parse(fs.readFileSync(credPath, 'utf8'))
  }

  const auth = new google.auth.GoogleAuth({
    credentials: credentialsObj,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const authClient = await auth.getClient()
  return google.sheets({ version: 'v4', auth: authClient })
}

export async function fetchInventoryRowsFromSheet() {
  const spreadsheetId = process.env.GOOGLE_INVENTORY_SPREADSHEET_ID
  if (!spreadsheetId) {
    throw new Error('GOOGLE_INVENTORY_SPREADSHEET_ID environment variable is not set')
  }

  const sheetName = process.env.GOOGLE_INVENTORY_SHEET_NAME || DEFAULT_SHEET_NAME
  const maxRows = parseInt(process.env.GOOGLE_INVENTORY_MAX_ROWS || String(DEFAULT_MAX_ROWS), 10)
  const endRow = maxRows + 1

  const sheets = await getSheetsClient()
  const ranges = [
    quoteSheetRange(sheetName, `C2:C${endRow}`),
    quoteSheetRange(sheetName, `G2:G${endRow}`),
    quoteSheetRange(sheetName, `H2:H${endRow}`),
  ]

  console.log(`Fetching inventory from "${sheetName}" (C/G/H)...`)
  const startedAt = Date.now()

  const response = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges })
  const valueRanges = response.data.valueRanges || []
  const yearRows = valueRanges[0]?.values || []
  const imeiRows = valueRanges[1]?.values || []
  const statusRows = valueRanges[2]?.values || []
  const rowCount = Math.max(yearRows.length, imeiRows.length, statusRows.length)

  const now = new Date().toISOString()
  const rows = []

  for (let i = 0; i < rowCount; i++) {
    const sheetRow = i + 2
    const year = parseInt(String(yearRows[i]?.[0] ?? '').trim(), 10)
    const imeiRaw = String(imeiRows[i]?.[0] ?? '').trim()
    const status = String(statusRows[i]?.[0] ?? '').trim()
    const normalized = normalizeImei(imeiRaw)

    if (!normalized || !/^\d{15}$/.test(normalized)) continue
    if (Number.isNaN(year) || year === 0) continue
    if (!status) continue

    rows.push({
      sheetRow,
      year,
      imeiRaw,
      imei: normalized,
      status,
      updatedAt: now,
    })
  }

  console.log(`Fetched ${rows.length} inventory rows in ${Date.now() - startedAt}ms`)
  return rows
}

export async function bootstrapInventoryFromSheet() {
  const rows = await fetchInventoryRowsFromSheet()
  const imported = replaceAllRows(rows)
  return { imported, totalInDb: getRowCount() }
}
