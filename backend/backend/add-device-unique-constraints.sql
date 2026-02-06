-- Add unique constraints for IMEI and Serial Number in devices table
-- Run this in Supabase SQL Editor

-- First, check for and handle any existing duplicates
-- This will help identify any duplicate IMEIs
SELECT imei, COUNT(*) as count
FROM public.devices
WHERE imei IS NOT NULL AND imei != ''
GROUP BY imei
HAVING COUNT(*) > 1;

-- This will help identify any duplicate Serial Numbers
SELECT "serialNo", COUNT(*) as count
FROM public.devices
WHERE "serialNo" IS NOT NULL AND "serialNo" != ''
GROUP BY "serialNo"
HAVING COUNT(*) > 1;

-- If duplicates exist, you'll need to resolve them before adding constraints
-- Once duplicates are resolved, run the following:

-- Add unique constraint for IMEI (allowing NULL values)
-- Note: In PostgreSQL, NULL values are considered distinct, so multiple NULLs are allowed
DO $$
BEGIN
  -- Drop existing unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'devices_imei_unique'
  ) THEN
    ALTER TABLE public.devices DROP CONSTRAINT devices_imei_unique;
  END IF;

  -- Create unique constraint for IMEI (excluding NULL and empty strings)
  -- We'll use a unique index with a WHERE clause to allow NULLs
  DROP INDEX IF EXISTS idx_devices_imei_unique;
  CREATE UNIQUE INDEX idx_devices_imei_unique 
  ON public.devices(imei) 
  WHERE imei IS NOT NULL AND imei != '';
  
  RAISE NOTICE 'Unique constraint/index created for IMEI';
END $$;

-- Add unique constraint for Serial Number (allowing NULL values)
DO $$
BEGIN
  -- Drop existing unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'devices_serialno_unique'
  ) THEN
    ALTER TABLE public.devices DROP CONSTRAINT devices_serialno_unique;
  END IF;

  -- Create unique index for Serial Number (excluding NULL and empty strings)
  DROP INDEX IF EXISTS idx_devices_serialno_unique;
  CREATE UNIQUE INDEX idx_devices_serialno_unique 
  ON public.devices("serialNo") 
  WHERE "serialNo" IS NOT NULL AND "serialNo" != '';
  
  RAISE NOTICE 'Unique constraint/index created for Serial Number';
END $$;

-- Verify the constraints were created
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'devices' 
  AND (indexname LIKE '%imei%' OR indexname LIKE '%serial%')
ORDER BY indexname;


