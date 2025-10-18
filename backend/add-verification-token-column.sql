-- Add verificationToken column to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verificationToken text;

-- Grant permissions for the new column
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- Optional: Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verificationToken);


