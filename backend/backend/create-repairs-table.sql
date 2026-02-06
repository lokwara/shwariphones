-- Create repairs table in Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.repairs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete set null,
  repairType text,
  dateBrought text,
  dateFixed text,
  serviceCost int default 0,
  partsBought jsonb default '[]'::jsonb, -- array of {part: string, cost: int}
  defects text[] default '{}',
  repairedBy text,
  imei text,
  serialNo text,
  variant text,
  customer jsonb default '{}'::jsonb, -- {name: string, phoneNumber: string}
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_repairs_device on public.repairs(device_id);
create index if not exists idx_repairs_created_at on public.repairs(created_at desc);

-- RLS
alter table public.repairs enable row level security;

-- SECURITY: Do NOT allow public read access to repairs - this exposes customer repair records with personal info!
-- Only service role should have access (for admin operations)
drop policy if exists repairs_read_all on public.repairs;
-- create policy repairs_read_all on public.repairs for select using (true); -- REMOVED FOR SECURITY

-- Allow service role to manage all repairs
drop policy if exists "Service role can manage repairs" on public.repairs;
create policy "Service role can manage repairs"
on public.repairs
for all
to service_role
using (true)
with check (true);


