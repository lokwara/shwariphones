-- Fix the public.users table schema
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add adminRights column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'adminRights') THEN
        ALTER TABLE public.users ADD COLUMN "adminRights" jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add isAdmin column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'isAdmin') THEN
        ALTER TABLE public.users ADD COLUMN "isAdmin" boolean DEFAULT false;
    END IF;
    
    -- Add phoneVerified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phoneVerified') THEN
        ALTER TABLE public.users ADD COLUMN "phoneVerified" boolean DEFAULT false;
    END IF;
    
    -- Add emailVerified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'emailVerified') THEN
        ALTER TABLE public.users ADD COLUMN "emailVerified" boolean DEFAULT true;
    END IF;
    
    -- Add phoneNumber column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phoneNumber') THEN
        ALTER TABLE public.users ADD COLUMN "phoneNumber" text;
    END IF;
    
    -- Add verificationToken column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'verificationToken') THEN
        ALTER TABLE public.users ADD COLUMN "verificationToken" text;
    END IF;
    
    -- Add created_at and updated_at columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE public.users ADD COLUMN "created_at" timestamptz DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN "updated_at" timestamptz DEFAULT NOW();
    END IF;
END $$;

-- 2. Update existing rows to have default values
UPDATE public.users 
SET 
    "adminRights" = COALESCE("adminRights", '[]'::jsonb),
    "isAdmin" = COALESCE("isAdmin", false),
    "phoneVerified" = COALESCE("phoneVerified", false),
    "emailVerified" = COALESCE("emailVerified", true),
    "created_at" = COALESCE("created_at", NOW()),
    "updated_at" = COALESCE("updated_at", NOW())
WHERE 
    "adminRights" IS NULL 
    OR "isAdmin" IS NULL 
    OR "phoneVerified" IS NULL 
    OR "emailVerified" IS NULL 
    OR "created_at" IS NULL 
    OR "updated_at" IS NULL;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_isAdmin ON public.users("isAdmin");

-- 4. Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;



