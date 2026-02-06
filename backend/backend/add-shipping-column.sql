-- Add shipping column to users table
-- Run this in Supabase SQL Editor

-- Add shipping column as JSONB
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS shipping JSONB DEFAULT '{}'::jsonb;

-- Create an index on shipping for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_users_shipping ON public.users USING gin (shipping);

-- Update RLS policy if needed (adjust based on your requirements)
-- The shipping column should be readable/writable by the user themselves
-- This assumes you already have RLS policies on the users table

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'shipping';


