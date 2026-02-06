-- Create orders table in Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references public.variants(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  storage text,
  color text,
  saleInfo jsonb default '{}'::jsonb, -- { saleVia: string, payment: {...}, customer: uuid, delivery: {...} }
  review jsonb default null, -- { rating: string, review: string, image: string, date: string, id: uuid }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if table exists but columns don't (for existing tables)
do $$ 
begin
  alter table public.orders add column if not exists variant_id uuid;
  alter table public.orders add column if not exists device_id uuid;
  alter table public.orders add column if not exists storage text;
  alter table public.orders add column if not exists color text;
  alter table public.orders add column if not exists saleInfo jsonb;
  alter table public.orders add column if not exists review jsonb;
  alter table public.orders add column if not exists created_at timestamptz;
  alter table public.orders add column if not exists updated_at timestamptz;
  
  -- Set defaults if columns were just created
  alter table public.orders alter column saleInfo set default '{}'::jsonb;
  alter table public.orders alter column created_at set default now();
  alter table public.orders alter column updated_at set default now();
  
  -- Add foreign keys if they don't exist
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'orders_variant_id_fkey') then
    alter table public.orders add constraint orders_variant_id_fkey foreign key (variant_id) references public.variants(id) on delete set null;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'orders_device_id_fkey') then
    alter table public.orders add constraint orders_device_id_fkey foreign key (device_id) references public.devices(id) on delete set null;
  end if;
end $$;

-- Indexes for performance
drop index if exists idx_orders_variant_id;
drop index if exists idx_orders_device_id;
drop index if exists idx_orders_created_at;
drop index if exists idx_orders_saleinfo;

create index if not exists idx_orders_variant_id on public.orders(variant_id);
create index if not exists idx_orders_device_id on public.orders(device_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
-- GIN index on entire saleInfo JSONB for efficient JSON queries
create index if not exists idx_orders_saleinfo on public.orders using gin (saleInfo);

-- RLS policies
alter table public.orders enable row level security;

-- Allow service role to manage all orders (for webhook)
drop policy if exists "Service role can manage all orders" on public.orders;
create policy "Service role can manage all orders" on public.orders
  for all using (auth.role() = 'service_role');

-- Allow authenticated users to read their own orders (via saleInfo.customer)
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders
  for select using (
    (saleInfo->>'customer')::uuid = auth.uid() OR
    auth.role() = 'service_role'
  );

-- SECURITY: Do NOT allow all to read orders - this exposes all user data!
-- Users should only see their own orders via the "Users can view own orders" policy above
-- If you need admin access, use the service role key server-side, not a public policy
-- drop policy if exists "Allow all to read orders" on public.orders;
-- create policy "Allow all to read orders" on public.orders
--   for select using (true);

