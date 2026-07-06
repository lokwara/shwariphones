CREATE TABLE IF NOT EXISTS inventory_rows (
  sheet_row   INTEGER PRIMARY KEY,
  year        INTEGER NOT NULL,
  imei_raw    TEXT,
  imei        TEXT NOT NULL,
  status      TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_imei ON inventory_rows(imei);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory_rows(imei, status, year);
