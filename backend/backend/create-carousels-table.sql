-- Create carousels table in Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Carousels table
create table if not exists public.carousels (
  id uuid primary key default gen_random_uuid(),
  small_screen text not null,
  large_screen text not null,
  link text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if table exists but columns don't (for existing tables)
do $$ 
begin
  -- Make title nullable if it exists (for existing tables that might have title)
  if exists (
    select 1 
    from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'carousels' 
    and column_name = 'title'
    and is_nullable = 'NO'
  ) then
    alter table public.carousels alter column title drop not null;
  end if;
  
  -- Add created_by column and foreign key if missing
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'carousels' and column_name = 'created_by') then
    alter table public.carousels add column created_by uuid;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'carousels_created_by_fkey') then
    alter table public.carousels add constraint carousels_created_by_fkey foreign key (created_by) references public.users(id) on delete set null;
  end if;
  
  -- Add all other columns if they don't exist
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'carousels' and column_name = 'small_screen') then
    alter table public.carousels add column small_screen text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'carousels' and column_name = 'large_screen') then
    alter table public.carousels add column large_screen text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'carousels' and column_name = 'link') then
    alter table public.carousels add column link text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'carousels' and column_name = 'created_at') then
    alter table public.carousels add column created_at timestamptz default now();
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'carousels' and column_name = 'updated_at') then
    alter table public.carousels add column updated_at timestamptz default now();
  end if;
end $$;

-- Create index for performance
create index if not exists idx_carousels_created_by on public.carousels(created_by);
create index if not exists idx_carousels_created_at on public.carousels(created_at desc);

-- Enable Row Level Security
alter table public.carousels enable row level security;

-- Create policies (drop first if they exist)
drop policy if exists "Service role can do everything on carousels" on public.carousels;
drop policy if exists "Authenticated users can read carousels" on public.carousels;
drop policy if exists "Authenticated users can insert carousels" on public.carousels;
drop policy if exists "Authenticated users can delete carousels" on public.carousels;

-- Allow service role to do everything
create policy "Service role can do everything on carousels"
  on public.carousels
  for all
  to service_role
  using (true)
  with check (true);

-- Allow authenticated users to read carousels
create policy "Authenticated users can read carousels"
  on public.carousels
  for select
  to authenticated
  using (true);

-- Allow authenticated users to insert carousels (for admins)
create policy "Authenticated users can insert carousels"
  on public.carousels
  for insert
  to authenticated
  with check (true);

-- Allow authenticated users to delete carousels (for admins)
create policy "Authenticated users can delete carousels"
  on public.carousels
  for delete
  to authenticated
  using (true);

