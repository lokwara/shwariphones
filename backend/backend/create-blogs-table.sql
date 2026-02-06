-- Create blogs table in Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Blogs table
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  thumbnail text,
  category text,
  content text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if table exists but columns don't (for existing tables)
do $$ 
begin
  -- Add created_by column and foreign key if missing
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blogs' and column_name = 'created_by') then
    alter table public.blogs add column created_by uuid;
  end if;
  
  if not exists (select 1 from information_schema.table_constraints where constraint_schema = 'public' and constraint_name = 'blogs_created_by_fkey') then
    alter table public.blogs add constraint blogs_created_by_fkey foreign key (created_by) references public.users(id) on delete set null;
  end if;
  
  -- Add all other columns if they don't exist
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blogs' and column_name = 'title') then
    alter table public.blogs add column title text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blogs' and column_name = 'thumbnail') then
    alter table public.blogs add column thumbnail text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blogs' and column_name = 'category') then
    alter table public.blogs add column category text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blogs' and column_name = 'content') then
    alter table public.blogs add column content text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blogs' and column_name = 'created_at') then
    alter table public.blogs add column created_at timestamptz default now();
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blogs' and column_name = 'updated_at') then
    alter table public.blogs add column updated_at timestamptz default now();
  end if;
  
  -- Set defaults if columns exist but don't have defaults
  alter table public.blogs alter column created_at set default now();
  alter table public.blogs alter column updated_at set default now();
end $$;

-- Indexes for performance
drop index if exists idx_blogs_created_by;
drop index if exists idx_blogs_created_at;
drop index if exists idx_blogs_category;

create index if not exists idx_blogs_created_by on public.blogs(created_by);
create index if not exists idx_blogs_created_at on public.blogs(created_at desc);
create index if not exists idx_blogs_category on public.blogs(category);

-- RLS policies
alter table public.blogs enable row level security;

-- Allow all users to read blogs (for public display)
drop policy if exists "Public read blogs" on public.blogs;
create policy "Public read blogs" on public.blogs
  for select using (true);

-- Allow service role to manage all blogs
drop policy if exists "Service role can manage all blogs" on public.blogs;
create policy "Service role can manage all blogs" on public.blogs
  for all using (auth.role() = 'service_role');

