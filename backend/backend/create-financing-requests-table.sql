-- Create financing_requests table in Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Financing requests table
create table if not exists public.financing_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.users(id) on delete set null,
  variant_id uuid references public.variants(id) on delete set null,
  storage text,
  color text,
  financer text,
  status text default 'PROCESSING',
  date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if table exists but columns don't (for existing tables)
-- Note: Foreign key constraints are added separately after columns exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'financing_requests' and column_name = 'customer_id') then
    alter table public.financing_requests add column customer_id uuid;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'financing_requests_customer_id_fkey') then
    alter table public.financing_requests add constraint financing_requests_customer_id_fkey foreign key (customer_id) references public.users(id) on delete set null;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'financing_requests' and column_name = 'variant_id') then
    alter table public.financing_requests add column variant_id uuid;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'financing_requests_variant_id_fkey') then
    alter table public.financing_requests add constraint financing_requests_variant_id_fkey foreign key (variant_id) references public.variants(id) on delete set null;
  end if;
  
  alter table public.financing_requests add column if not exists storage text;
  alter table public.financing_requests add column if not exists color text;
  alter table public.financing_requests add column if not exists financer text;
  alter table public.financing_requests add column if not exists status text;
  alter table public.financing_requests add column if not exists date text;
  alter table public.financing_requests add column if not exists created_at timestamptz;
  alter table public.financing_requests add column if not exists updated_at timestamptz;
  
  -- Set defaults if columns were just created
  alter table public.financing_requests alter column status set default 'PROCESSING';
  alter table public.financing_requests alter column created_at set default now();
  alter table public.financing_requests alter column updated_at set default now();
end $$;

-- Alternative table name (if needed)
create table if not exists public.finance_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.users(id) on delete set null,
  variant_id uuid references public.variants(id) on delete set null,
  storage text,
  color text,
  financer text,
  status text default 'PROCESSING',
  date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if alternative table exists but columns don't
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'finance_requests' and column_name = 'customer_id') then
    alter table public.finance_requests add column customer_id uuid;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'finance_requests_customer_id_fkey') then
    alter table public.finance_requests add constraint finance_requests_customer_id_fkey foreign key (customer_id) references public.users(id) on delete set null;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'finance_requests' and column_name = 'variant_id') then
    alter table public.finance_requests add column variant_id uuid;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'finance_requests_variant_id_fkey') then
    alter table public.finance_requests add constraint finance_requests_variant_id_fkey foreign key (variant_id) references public.variants(id) on delete set null;
  end if;
  
  alter table public.finance_requests add column if not exists storage text;
  alter table public.finance_requests add column if not exists color text;
  alter table public.finance_requests add column if not exists financer text;
  alter table public.finance_requests add column if not exists status text;
  alter table public.finance_requests add column if not exists date text;
  alter table public.finance_requests add column if not exists created_at timestamptz;
  alter table public.finance_requests add column if not exists updated_at timestamptz;
  
  -- Set defaults if columns were just created
  alter table public.finance_requests alter column status set default 'PROCESSING';
  alter table public.finance_requests alter column created_at set default now();
  alter table public.finance_requests alter column updated_at set default now();
end $$;

-- Indexes for performance (drop first if they exist to avoid conflicts)
drop index if exists idx_financing_requests_customer_id;
drop index if exists idx_financing_requests_variant_id;
drop index if exists idx_financing_requests_status;
drop index if exists idx_financing_requests_created_at;

create index if not exists idx_financing_requests_customer_id on public.financing_requests(customer_id);
create index if not exists idx_financing_requests_variant_id on public.financing_requests(variant_id);
create index if not exists idx_financing_requests_status on public.financing_requests(status);
create index if not exists idx_financing_requests_created_at on public.financing_requests(created_at desc);

drop index if exists idx_finance_requests_customer_id;
drop index if exists idx_finance_requests_variant_id;
drop index if exists idx_finance_requests_status;
drop index if exists idx_finance_requests_created_at;

create index if not exists idx_finance_requests_customer_id on public.finance_requests(customer_id);
create index if not exists idx_finance_requests_variant_id on public.finance_requests(variant_id);
create index if not exists idx_finance_requests_status on public.finance_requests(status);
create index if not exists idx_finance_requests_created_at on public.finance_requests(created_at desc);

-- RLS policies for financing_requests
alter table public.financing_requests enable row level security;

-- Allow authenticated users to read their own financing requests
drop policy if exists "Users can view own financing requests" on public.financing_requests;
create policy "Users can view own financing requests" on public.financing_requests
  for select using (customer_id = auth.uid());

-- Allow service role to manage all financing requests
drop policy if exists "Service role can manage all financing requests" on public.financing_requests;
create policy "Service role can manage all financing requests" on public.financing_requests
  for all using (auth.role() = 'service_role');

-- SECURITY: Do NOT allow public read access to financing requests - this exposes customer financial data!
-- If you need admin access, use the service role key server-side, not a public policy
-- drop policy if exists "Public read financing requests" on public.financing_requests;
-- create policy "Public read financing requests" on public.financing_requests
--   for select using (true);

-- RLS policies for finance_requests (alternative table)
alter table public.finance_requests enable row level security;

drop policy if exists "Users can view own finance requests" on public.finance_requests;
create policy "Users can view own finance requests" on public.finance_requests
  for select using (customer_id = auth.uid());

drop policy if exists "Service role can manage all finance requests" on public.finance_requests;
create policy "Service role can manage all finance requests" on public.finance_requests
  for all using (auth.role() = 'service_role');

-- SECURITY: Do NOT allow public read access to finance requests - this exposes customer financial data!
-- drop policy if exists "Public read finance requests" on public.finance_requests;
-- create policy "Public read finance requests" on public.finance_requests
--   for select using (true);

