-- Create offers table in Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Offers table
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  "start" text not null,
  "end" text not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if table exists but columns don't (for existing tables)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'offers' and column_name = 'created_by') then
    alter table public.offers add column created_by uuid;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'offers_created_by_fkey') then
    alter table public.offers add constraint offers_created_by_fkey foreign key (created_by) references public.users(id) on delete set null;
  end if;
  
  alter table public.offers add column if not exists label text;
  alter table public.offers add column if not exists "start" text;
  alter table public.offers add column if not exists "end" text;
  alter table public.offers add column if not exists created_at timestamptz;
  alter table public.offers add column if not exists updated_at timestamptz;
  
  -- Set defaults if columns were just created
  alter table public.offers alter column created_at set default now();
  alter table public.offers alter column updated_at set default now();
end $$;

-- Indexes for performance
drop index if exists idx_offers_created_by;
drop index if exists idx_offers_created_at;
drop index if exists idx_offers_start;
drop index if exists idx_offers_end;

create index if not exists idx_offers_created_by on public.offers(created_by);
create index if not exists idx_offers_created_at on public.offers(created_at desc);
create index if not exists idx_offers_start on public.offers("start");
create index if not exists idx_offers_end on public.offers("end");

-- RLS policies
alter table public.offers enable row level security;

-- Allow all users to read offers (for public display)
drop policy if exists "Public read offers" on public.offers;
create policy "Public read offers" on public.offers
  for select using (true);

-- Allow service role to manage all offers
drop policy if exists "Service role can manage all offers" on public.offers;
create policy "Service role can manage all offers" on public.offers
  for all using (auth.role() = 'service_role');

-- Ensure devices table has offer_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'devices') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'devices' and column_name = 'offer_id') then
      alter table public.devices add column offer_id uuid references public.offers(id) on delete set null;
    end if;
    
    if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'devices_offer_id_fkey') then
      alter table public.devices add constraint devices_offer_id_fkey foreign key (offer_id) references public.offers(id) on delete set null;
    end if;
    
    -- Create index on offer_id
    drop index if exists idx_devices_offer_id;
    create index if not exists idx_devices_offer_id on public.devices(offer_id);
  end if;
end $$;


