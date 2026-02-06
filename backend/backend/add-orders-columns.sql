-- Add missing columns to orders table
-- Run this in Supabase SQL Editor
-- CRITICAL: This fixes NULL values in orders table

-- Add user_id column (extracted from saleInfo.customer)
alter table public.orders add column if not exists user_id uuid references public.users(id) on delete set null;

-- Add total column (extracted from saleInfo.payment.amount)
alter table public.orders add column if not exists total numeric;

-- Add items column (can store order items summary or count)
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;

-- Add status column if it doesn't exist (for order status tracking)
alter table public.orders add column if not exists status text default 'pending';

-- Ensure device_id column exists (might already exist from table creation)
-- This is critical for linking orders to devices and marking devices as Sold
alter table public.orders add column if not exists device_id uuid references public.devices(id) on delete set null;

-- Create index on user_id for faster queries
create index if not exists idx_orders_user_id on public.orders(user_id);

-- Create index on total for faster queries
create index if not exists idx_orders_total on public.orders(total);

-- Backfill existing orders with data from saleInfo
-- This updates existing orders to populate user_id and total from saleInfo
update public.orders
set 
  user_id = (saleInfo->>'customer')::uuid,
  total = (saleInfo->'payment'->>'amount')::numeric
where 
  user_id is null 
  and saleInfo->>'customer' is not null;

-- Verify the update
select 
  id,
  user_id,
  total,
  items,
  device_id,
  status,
  saleInfo->>'customer' as customer_from_saleinfo,
  saleInfo->'payment'->>'amount' as amount_from_saleinfo
from public.orders
order by created_at desc
limit 10;

-- Verify all columns exist
select 
  column_name, 
  data_type,
  is_nullable
from information_schema.columns 
where table_name = 'orders' 
and table_schema = 'public'
and column_name in ('user_id', 'total', 'items', 'device_id', 'status')
order by column_name;

