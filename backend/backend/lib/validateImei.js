/**
 * IMEI format helpers (mirrors frontend/lib/validateImei.js).
 */

export function normalizeImei(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/^R+(?=\d)/, '')
}

export function isValidImeiFormat(value) {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw) return false
  if (/\s/.test(raw)) return false
  return /^R*\d{15}$/.test(raw)
}

export function parseImei(value) {
  if (!isValidImeiFormat(value)) return null
  return normalizeImei(value)
}
