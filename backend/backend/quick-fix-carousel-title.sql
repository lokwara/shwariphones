-- Quick fix: Make title column nullable in carousels table
-- Run this in Supabase SQL Editor

-- Make title nullable if it exists and is NOT NULL
ALTER TABLE public.carousels ALTER COLUMN title DROP NOT NULL;

