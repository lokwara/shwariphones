-- Fix admin rights columns in users table
-- Run this in Supabase SQL Editor

-- Add rulesSetBy column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "rulesSetBy" uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Ensure adminRights column exists and is JSONB
DO $$ 
BEGIN
  -- Add adminRights if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'adminRights'
  ) THEN
    ALTER TABLE public.users ADD COLUMN "adminRights" jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  -- Ensure adminRights is JSONB type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'adminRights'
    AND data_type != 'jsonb'
  ) THEN
    -- Convert to JSONB if it's not already
    ALTER TABLE public.users 
    ALTER COLUMN "adminRights" TYPE jsonb 
    USING "adminRights"::jsonb;
  END IF;
  
  -- Set default value for existing NULL rows
  UPDATE public.users 
  SET "adminRights" = '[]'::jsonb 
  WHERE "adminRights" IS NULL;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_admin_rights ON public.users USING gin ("adminRights");
CREATE INDEX IF NOT EXISTS idx_users_rules_set_by ON public.users("rulesSetBy");




