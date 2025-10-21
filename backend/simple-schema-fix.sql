-- Simple fix for missing columns in public.users table
-- Run this in your Supabase SQL Editor

-- Add missing columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "adminRights" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "isAdmin" boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "phoneVerified" boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "phoneNumber" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "verificationToken" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT NOW();

-- Update existing rows with default values
UPDATE public.users SET 
    "adminRights" = '[]'::jsonb,
    "isAdmin" = false,
    "phoneVerified" = false,
    "emailVerified" = true,
    "created_at" = NOW(),
    "updated_at" = NOW()
WHERE "adminRights" IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);



