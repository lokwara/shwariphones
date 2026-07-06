/**
 * Google Apps Script for ALL STOCK/ BUYBACK sheet.
 *
 * Setup:
 * 1. Open Shwari Phones-Inv/Planning Doc → Extensions → Apps Script
 * 2. Paste this file, set WEBHOOK_URL and WEBHOOK_SECRET below
 * 3. Run installInventoryTrigger() once (authorize when prompted)
 * 4. Edit a row in ALL STOCK/ BUYBACK to verify sync
 *
 * Script properties (optional, instead of constants):
 *   INVENTORY_WEBHOOK_URL, INVENTORY_WEBHOOK_SECRET
 */

const SHEET_NAME = 'ALL STOCK/ BUYBACK'
const WEBHOOK_URL = 'https://YOUR-RAILWAY-HOST/webhooks/inventory'
const WEBHOOK_SECRET = 'YOUR-WEBHOOK-SECRET'

// Column indices (1-based): C=Year, G=IMEI 1, H=Status-1
const COL_YEAR = 3
const COL_IMEI = 7
const COL_STATUS = 8
const WATCHED_COLUMNS = [COL_YEAR, COL_IMEI, COL_STATUS]

function getConfig() {
  const props = PropertiesService.getScriptProperties()
  return {
    url: props.getProperty('INVENTORY_WEBHOOK_URL') || WEBHOOK_URL,
    secret: props.getProperty('INVENTORY_WEBHOOK_SECRET') || WEBHOOK_SECRET,
  }
}

function normalizeImei(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/^R+(?=\d)/, '')
}

function postToWebhook(payload) {
  const config = getConfig()
  if (!config.url || config.url.indexOf('YOUR-RAILWAY') !== -1) {
    throw new Error('Set INVENTORY_WEBHOOK_URL in script properties or WEBHOOK_URL constant.')
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Webhook-Secret': config.secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  }

  const response = UrlFetchApp.fetch(config.url, options)
  const code = response.getResponseCode()
  if (code < 200 || code >= 300) {
    throw new Error('Webhook failed (' + code + '): ' + response.getContentText())
  }
  return response.getContentText()
}

function onInventoryEdit(e) {
  if (!e || !e.range) return

  const sheet = e.range.getSheet()
  if (sheet.getName() !== SHEET_NAME) return
  if (e.range.getRow() < 2) return

  const editedCol = e.range.getColumn()
  if (WATCHED_COLUMNS.indexOf(editedCol) === -1) return

  const row = e.range.getRow()
  const year = sheet.getRange(row, COL_YEAR).getValue()
  const imei = sheet.getRange(row, COL_IMEI).getValue()
  const status = sheet.getRange(row, COL_STATUS).getValue()

  if (!imei && !status && !year) {
    postToWebhook({ action: 'delete', sheetRow: row })
    return
  }

  postToWebhook({
    action: 'upsert',
    sheetRow: row,
    year: year,
    imei: String(imei || ''),
    status: String(status || '').trim(),
  })
}

function installInventoryTrigger() {
  const triggers = ScriptApp.getProjectTriggers()
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onInventoryEdit') {
      ScriptApp.deleteTrigger(triggers[i])
    }
  }

  ScriptApp.newTrigger('onInventoryEdit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create()

  Logger.log('Inventory onEdit trigger installed.')
}

function testWebhook() {
  postToWebhook({
    action: 'upsert',
    sheetRow: 999999,
    year: 2026,
    imei: 'R000000000000001',
    status: 'Available',
  })
  Logger.log('Test webhook sent.')
}
