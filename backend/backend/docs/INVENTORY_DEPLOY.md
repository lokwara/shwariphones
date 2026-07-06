# Inventory SQLite Deploy (Railway)

## 1. Persistent volume

1. Open the existing Express backend service on Railway.
2. Add a **Volume** mounted at `/data`.
3. Set environment variable:

```bash
SQLITE_PATH=/data/inventory.db
```

## 2. Required environment variables

| Variable | Purpose |
|----------|---------|
| `SQLITE_PATH` | `/data/inventory.db` |
| `INVENTORY_WEBHOOK_SECRET` | Secret for Google Apps Script (`X-Webhook-Secret`) |
| `INVENTORY_API_KEY` | Secret for Next.js (`X-Api-Key`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON (bootstrap only) |
| `GOOGLE_INVENTORY_SPREADSHEET_ID` | `1Yujl5pws4dOoi10kCeyJSchb6WbwUlwCjo9PXA18GP4` |
| `GOOGLE_INVENTORY_SHEET_NAME` | `ALL STOCK/ BUYBACK` |
| `GOOGLE_INVENTORY_MIN_YEAR` | `2025` (optional) |
| `GOOGLE_INVENTORY_MAX_ROWS` | `150000` (optional) |

## 3. Bootstrap (one-time)

After deploy and volume mount:

```bash
# On Railway shell or locally with env vars set:
npm run bootstrap-inventory

# Or via HTTP:
curl -X POST https://YOUR-RAILWAY-HOST/inventory/bootstrap \
  -H "X-Api-Key: YOUR_INVENTORY_API_KEY"
```

Verify:

```bash
curl https://YOUR-RAILWAY-HOST/inventory/status \
  -H "X-Api-Key: YOUR_INVENTORY_API_KEY"
```

## 4. Google Apps Script

Copy [`docs/inventory-apps-script.js`](./inventory-apps-script.js) into the bound Apps Script project for the inventory spreadsheet. Set script properties:

- `INVENTORY_WEBHOOK_URL` → `https://YOUR-RAILWAY-HOST/webhooks/inventory`
- `INVENTORY_WEBHOOK_SECRET` → same as Railway `INVENTORY_WEBHOOK_SECRET`

Run `installInventoryTrigger()` once.

## 5. Next.js (Vercel) cutover

```bash
INVENTORY_SOURCE=railway
INVENTORY_API_URL=https://YOUR-RAILWAY-HOST
INVENTORY_API_KEY=<same as Railway INVENTORY_API_KEY>
```

Rollback to Google Sheets cache:

```bash
INVENTORY_SOURCE=sheets
```

## 6. Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/webhooks/inventory` | `X-Webhook-Secret` |
| GET | `/inventory/imei/:imei` | `X-Api-Key` |
| POST | `/inventory/bootstrap` | `X-Api-Key` |
| GET | `/inventory/status` | `X-Api-Key` |
