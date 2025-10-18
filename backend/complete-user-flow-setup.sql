-- Complete User Flow Setup
-- This ensures smooth user experience from signup to phone verification
-- Run this in your Supabase SQL Editor

-- 1. Ensure all required columns exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "adminRights" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "isAdmin" boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "phoneVerified" boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "phoneNumber" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "verificationToken" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT NOW();

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- 4. Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Create a robust function for seamless user profile management
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  image text,
  "isAdmin" boolean,
  "adminRights" jsonb,
  "phoneVerified" boolean,
  "emailVerified" boolean,
  "phoneNumber" text,
  "verificationToken" text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := auth.uid();
  user_email text := auth.email();
  user_meta jsonb := auth.jwt() -> 'user_metadata';
  existing_user public.users%ROWTYPE;
BEGIN
  -- If no user is authenticated, return empty
  IF user_id IS NULL THEN
    RETURN;
  END IF;

  -- Try to get existing user
  SELECT * INTO existing_user FROM public.users WHERE id = user_id;
  
  -- If user exists, return their data
  IF existing_user.id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      existing_user.id,
      existing_user.email,
      existing_user.name,
      existing_user.image,
      existing_user."isAdmin",
      existing_user."adminRights",
      existing_user."phoneVerified",
      existing_user."emailVerified",
      existing_user."phoneNumber",
      existing_user."verificationToken",
      existing_user.created_at,
      existing_user.updated_at;
    RETURN;
  END IF;

  -- If user doesn't exist, create one automatically
  INSERT INTO public.users (
    id,
    email,
    name,
    image,
    "isAdmin",
    "adminRights",
    "phoneVerified",
    "emailVerified",
    "phoneNumber",
    "verificationToken",
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    COALESCE(
      user_meta ->> 'full_name',
      user_meta ->> 'name',
      split_part(user_email, '@', 1)
    ),
    COALESCE(
      user_meta ->> 'avatar_url',
      user_meta ->> 'picture'
    ),
    false,
    '[]'::jsonb,
    false,
    true,
    null,
    null,
    NOW(),
    NOW()
  );

  -- Return the newly created user
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.image,
    u."isAdmin",
    u."adminRights",
    u."phoneVerified",
    u."emailVerified",
    u."phoneNumber",
    u."verificationToken",
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.id = user_id;
END;
$$;

-- 6. Create a view for seamless access
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT * FROM public.ensure_user_profile();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO anon, authenticated, service_role;
GRANT SELECT ON public.user_profiles TO anon, authenticated, service_role;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users("phoneNumber");

-- 9. Update existing users with default values if needed
UPDATE public.users SET 
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

-- 10. Verify the setup
SELECT 
  'Setup Complete!' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN "phoneNumber" IS NOT NULL THEN 1 END) as users_with_phone,
  COUNT(CASE WHEN "phoneVerified" = true THEN 1 END) as verified_users
FROM public.users;


