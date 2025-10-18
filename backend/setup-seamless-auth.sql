-- Seamless Supabase Authentication Integration
-- This approach uses RLS and Supabase's built-in user management
-- Run this in your Supabase SQL Editor

-- 1. First, let's clean up the old trigger approach
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Enable Row Level Security on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy that allows users to read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 4. Create a policy that allows users to update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 5. Create a policy that allows service role to manage all users
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Create a function to get or create user profile
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

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO anon, authenticated, service_role;

-- 8. Create a view for easy access to user data
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT * FROM public.get_user_profile();

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO anon, authenticated, service_role;


