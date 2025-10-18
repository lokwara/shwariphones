-- Complete Supabase Setup for Seamless Authentication
-- Run this in your Supabase SQL Editor to set up everything properly

-- 1. Clean up any existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP VIEW IF EXISTS public.user_profiles;
DROP FUNCTION IF EXISTS public.get_user_profile();

-- 2. Enable Row Level Security on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- 4. Create new policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Create a function to get or create user profile
CREATE OR REPLACE FUNCTION public.get_user_profile()
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
BEGIN
  -- Get current user ID
  DECLARE
    user_id uuid := auth.uid();
    user_email text := auth.email();
  BEGIN
    -- If no user is authenticated, return empty
    IF user_id IS NULL THEN
      RETURN;
    END IF;

    -- Try to get existing user
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

    -- If no user found, create one automatically
    IF NOT FOUND THEN
      INSERT INTO public.users (
        id,
        email,
        name,
        image,
        "isAdmin",
        "adminRights",
        "phoneVerified",
        "emailVerified"
      ) VALUES (
        user_id,
        user_email,
        COALESCE(
          auth.jwt() ->> 'user_metadata' ->> 'full_name',
          auth.jwt() ->> 'user_metadata' ->> 'name',
          split_part(user_email, '@', 1)
        ),
        COALESCE(
          auth.jwt() ->> 'user_metadata' ->> 'avatar_url',
          auth.jwt() ->> 'user_metadata' ->> 'picture'
        ),
        false,
        '[]'::jsonb,
        false,
        true
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
    END IF;
  END;
END;
$$;

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO anon, authenticated, service_role;

-- 7. Create a view for easy access to user data
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT * FROM public.get_user_profile();

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO anon, authenticated, service_role;

-- 8. Ensure the verificationToken column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'verificationToken') THEN
        ALTER TABLE public.users ADD COLUMN "verificationToken" text;
    END IF;
END $$;

-- 9. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 10. Set up proper RLS for the users table
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;


