-- Cafe POS schema. Run this in the Supabase SQL editor.
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
-- if the table already existed, add the column:
alter table categories add column if not exists emoji text default '';

create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text default '',
  emoji text default '',
  image_url text default '',
  -- which menus this item appears in; [] = appears in all menus
  menu_ids jsonb not null default '[]'::jsonb,
  available boolean not null default true,
  -- [{ "name": "Regular", "price": 3.5 }, ...]  always at least one size
  sizes jsonb not null default '[{"name":"Regular","price":0}]'::jsonb,
  -- [{ "name": "Extra shot", "price": 0.5 }, ...]
  addons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
-- if the table already existed, add the new columns:
alter table menu_items add column if not exists emoji text default '';
alter table menu_items add column if not exists image_url text default '';
alter table menu_items add column if not exists menu_ids jsonb not null default '[]'::jsonb;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default '',
  status text not null default 'new', -- new | preparing | ready | completed
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  item_name text not null,
  category_name text default '',
  size_name text default '',
  unit_price numeric(10,2) not null default 0,
  qty int not null default 1,
  addons jsonb not null default '[]'::jsonb,
  note text default '',
  line_total numeric(10,2) not null default 0
);

-- Prototype access: allow the anon key to read/write. Tighten later with auth.
alter table categories  enable row level security;
alter table menus       enable row level security;
alter table menu_items  enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

create policy "anon all" on categories  for all using (true) with check (true);
create policy "anon all" on menus       for all using (true) with check (true);
create policy "anon all" on menu_items  for all using (true) with check (true);
create policy "anon all" on orders      for all using (true) with check (true);
create policy "anon all" on order_items for all using (true) with check (true);

-- Enable realtime so screens update live across devices.
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table menus;
