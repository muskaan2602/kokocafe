-- ============================================================
-- KOKO Café & Bakers — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES (café tables / seating)
-- ============================================================
create table if not exists public.tables (
  id            uuid primary key default uuid_generate_v4(),
  table_number  text not null unique,
  qr_token      text not null unique,
  status        text not null default 'available'
                  check (status in ('available', 'occupied', 'reserved')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  icon        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table if not exists public.menu_items (
  id           uuid primary key default uuid_generate_v4(),
  category_id  uuid not null references public.categories(id) on delete cascade,
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  is_available boolean not null default true,
  is_veg       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create sequence if not exists order_number_seq start 1001;

create table if not exists public.orders (
  id            uuid primary key default uuid_generate_v4(),
  order_number  text not null unique default 'KOKO' || nextval('order_number_seq')::text,
  table_id      uuid not null references public.tables(id),
  status        text not null default 'pending'
                  check (status in ('pending','accepted','preparing','ready','completed','rejected')),
  subtotal      numeric(10,2) not null,
  tax           numeric(10,2) not null,
  total         numeric(10,2) not null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists public.order_items (
  id                    uuid primary key default uuid_generate_v4(),
  order_id              uuid not null references public.orders(id) on delete cascade,
  menu_item_id          uuid references public.menu_items(id) on delete set null,
  item_name             text not null,
  quantity              integer not null check (quantity > 0),
  price                 numeric(10,2) not null,
  special_instructions  text
);

-- ============================================================
-- PROFILES (manager users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'manager'
                check (role in ('manager','admin')),
  created_at  timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'manager')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.tables     enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;
alter table public.profiles   enable row level security;

-- Tables: public read, manager write
create policy "public_read_tables"
  on public.tables for select using (true);
create policy "manager_write_tables"
  on public.tables for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Categories: public read, manager write
create policy "public_read_categories"
  on public.categories for select using (true);
create policy "manager_write_categories"
  on public.categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Menu items: public read, manager write
create policy "public_read_menu_items"
  on public.menu_items for select using (true);
create policy "manager_write_menu_items"
  on public.menu_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Orders: public insert (anyone can place), authenticated read/update
create policy "public_insert_orders"
  on public.orders for insert with check (true);
create policy "public_read_own_orders"
  on public.orders for select using (true);
create policy "manager_update_orders"
  on public.orders for update
  using (auth.role() = 'authenticated');

-- Order items: public insert, public read
create policy "public_insert_order_items"
  on public.order_items for insert with check (true);
create policy "public_read_order_items"
  on public.order_items for select using (true);

-- Profiles: own profile
create policy "own_profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "manager_read_profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.tables;
alter publication supabase_realtime add table public.menu_items;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_orders_table_id   on public.orders(table_id);
create index if not exists idx_orders_status      on public.orders(status);
create index if not exists idx_orders_created_at  on public.orders(created_at desc);
create index if not exists idx_order_items_order  on public.order_items(order_id);
create index if not exists idx_menu_items_cat     on public.menu_items(category_id);
create index if not exists idx_tables_qr_token    on public.tables(qr_token);
