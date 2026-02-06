-- Create buybacks table in Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Buybacks table (Trade-in requests)
create table if not exists public.buybacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  variant_id uuid references public.variants(id) on delete set null,
  storage text,
  color text,
  batteryHealth int,
  frontCamOk boolean default false,
  backCamOk boolean default false,
  earpieceOk boolean default false,
  mouthpieceOk boolean default false,
  speakerOk boolean default false,
  authorizationOk boolean default false,
  simTrayPresent boolean default false,
  chargingOk boolean default false,
  screenCondition text,
  sideNBackCondition text,
  offer int default 0,
  payment jsonb default '{}'::jsonb, -- { mode: String, amount: Int, timestamp: String, code: String, phoneNumber: String }
  cancelled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_buybacks_user_id on public.buybacks(user_id);
create index if not exists idx_buybacks_variant_id on public.buybacks(variant_id);
create index if not exists idx_buybacks_created_at on public.buybacks(created_at desc);
create index if not exists idx_buybacks_cancelled on public.buybacks(cancelled);

-- RLS policies
alter table public.buybacks enable row level security;

-- Allow authenticated users to read their own buybacks
drop policy if exists "Users can view own buybacks" on public.buybacks;
create policy "Users can view own buybacks" on public.buybacks
  for select using (user_id = auth.uid());

-- Allow service role to manage all buybacks
drop policy if exists "Service role can manage all buybacks" on public.buybacks;
create policy "Service role can manage all buybacks" on public.buybacks
  for all using (auth.role() = 'service_role');

-- SECURITY: Do NOT allow public read access to buybacks - this exposes user trade-in data!
-- If you need admin access, use the service role key server-side, not a public policy
-- drop policy if exists "Public read buybacks" on public.buybacks;
-- create policy "Public read buybacks" on public.buybacks
--   for select using (true);

