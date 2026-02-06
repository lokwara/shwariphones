-- Grant RECEIPT_MANAGEMENT to okwaralewis16@gmail.com
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query)

UPDATE public.users
SET "adminRights" = COALESCE("adminRights", '[]'::jsonb) || '["RECEIPT_MANAGEMENT"]'::jsonb
WHERE email = 'okwaralewis16@gmail.com'
  AND NOT (COALESCE("adminRights", '[]'::jsonb) @> '["RECEIPT_MANAGEMENT"]'::jsonb);

-- Optional: see updated row
-- SELECT id, email, "adminRights" FROM public.users WHERE email = 'okwaralewis16@gmail.com';
