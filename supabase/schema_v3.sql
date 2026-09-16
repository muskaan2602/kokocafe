-- ============================================================
-- KOKO Café — Schema v3
-- Delivery order source tracking (Zomato, Swiggy, Phone, etc.)
-- Run this in Supabase SQL Editor AFTER schema.sql + schema_v2.sql
-- ============================================================

-- Add order_source column to existing orders table
alter table public.orders
  add column if not exists order_source text not null default 'dine_in'
    check (order_source in ('dine_in','zomato','swiggy','phone','takeaway','other'));

-- Add external_order_id column (to store Zomato/Swiggy order number)
alter table public.orders
  add column if not exists external_order_id text;

-- Add customer_name for delivery orders (optional)
alter table public.orders
  add column if not exists customer_name text;

-- Add customer_phone for delivery orders (optional)
alter table public.orders
  add column if not exists customer_phone text;

-- Add delivery_address for delivery orders (optional)
alter table public.orders
  add column if not exists delivery_address text;

-- Index for filtering by source
create index if not exists idx_orders_source on public.orders(order_source);

-- A "delivery" virtual table — no new table needed,
-- just a view that makes querying delivery orders easier
create or replace view public.delivery_orders as
  select
    o.*,
    t.table_number
  from public.orders o
  left join public.tables t on t.id = o.table_id
  where o.order_source in ('zomato','swiggy','phone','takeaway','other')
  order by o.created_at desc;
