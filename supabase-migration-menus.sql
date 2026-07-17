-- Migration: add seasonal "menus" support to an existing Spirit Soda database.
-- Run this in the Supabase SQL editor. Safe to run more than once.

-- 1) Menus table (e.g. "Full Menu", "Fasting Menu"); one is active at a time.
create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Which menus each item belongs to ([] = appears in every menu).
alter table menu_items add column if not exists menu_ids jsonb not null default '[]'::jsonb;

-- 3) Allow the anon key to read/write menus (prototype policy).
alter table menus enable row level security;
drop policy if exists "anon all" on menus;
create policy "anon all" on menus for all using (true) with check (true);

-- 4) Live sync for menus across devices (ignore error if already added).
do $$
begin
  alter publication supabase_realtime add table menus;
exception when others then null;
end $$;
