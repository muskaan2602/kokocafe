-- ============================================================
-- KOKO Café & Bakers — Schema v2
-- Employee, Attendance, Payouts, Inventory
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- EMPLOYEES
-- ============================================================
create table if not exists public.employees (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   text not null unique,          -- e.g. EMP001
  name          text not null,
  phone         text,
  email         text,
  role          text not null default 'Staff'
                  check (role in ('Barista','Chef','Baker','Waiter','Cashier','Manager','Cleaner','Security','Delivery','Other')),
  joining_date  date not null default current_date,
  leaving_date  date,
  monthly_salary numeric(10,2) not null default 0,
  status        text not null default 'active'
                  check (status in ('active','inactive')),
  address       text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger employees_updated_at
  before update on public.employees
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ATTENDANCE
-- ============================================================
create table if not exists public.attendance (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  date          date not null,
  status        text not null default 'present'
                  check (status in ('present','absent','half_day','leave','late')),
  check_in      time,
  check_out     time,
  remarks       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (employee_id, date)
);

create trigger attendance_updated_at
  before update on public.attendance
  for each row execute function public.handle_updated_at();

create index if not exists idx_attendance_employee on public.attendance(employee_id);
create index if not exists idx_attendance_date     on public.attendance(date desc);

-- ============================================================
-- EMPLOYEE TRANSACTIONS (advances, salary, bonus, deductions)
-- ============================================================
create table if not exists public.employee_transactions (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references public.employees(id) on delete cascade,
  type            text not null
                    check (type in ('advance','salary','bonus','deduction','other')),
  amount          numeric(10,2) not null,
  description     text,
  payment_method  text not null default 'cash'
                    check (payment_method in ('cash','bank_transfer','upi','cheque','other')),
  reference_month text,   -- e.g. "2026-09" for which month's salary
  created_at      timestamptz not null default now()
);

create index if not exists idx_emp_txn_employee on public.employee_transactions(employee_id);
create index if not exists idx_emp_txn_created  on public.employee_transactions(created_at desc);

-- ============================================================
-- INVENTORY CATEGORIES
-- ============================================================
create table if not exists public.inventory_categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
create table if not exists public.inventory_items (
  id              uuid primary key default uuid_generate_v4(),
  category_id     uuid references public.inventory_categories(id) on delete set null,
  name            text not null,
  unit            text not null default 'pcs'
                    check (unit in ('kg','g','litre','ml','pcs','box','packet','dozen','other')),
  current_stock   numeric(12,3) not null default 0,
  min_stock       numeric(12,3) not null default 0,
  purchase_price  numeric(10,2),
  supplier        text,
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.handle_updated_at();

create index if not exists idx_inv_items_category on public.inventory_items(category_id);

-- ============================================================
-- INVENTORY STOCK MOVEMENTS
-- ============================================================
create table if not exists public.inventory_movements (
  id           uuid primary key default uuid_generate_v4(),
  item_id      uuid not null references public.inventory_items(id) on delete cascade,
  type         text not null
                 check (type in ('add','reduce','wastage','adjustment','opening')),
  quantity     numeric(12,3) not null,
  note         text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_inv_movements_item    on public.inventory_movements(item_id);
create index if not exists idx_inv_movements_created on public.inventory_movements(created_at desc);

-- Auto-update current_stock when a movement is inserted
create or replace function public.apply_inventory_movement()
returns trigger language plpgsql as $$
begin
  if new.type = 'add' or new.type = 'opening' then
    update public.inventory_items
    set current_stock = current_stock + new.quantity,
        updated_at = now()
    where id = new.item_id;
  elsif new.type in ('reduce','wastage') then
    update public.inventory_items
    set current_stock = greatest(0, current_stock - new.quantity),
        updated_at = now()
    where id = new.item_id;
  elsif new.type = 'adjustment' then
    -- quantity is the new absolute value
    update public.inventory_items
    set current_stock = new.quantity,
        updated_at = now()
    where id = new.item_id;
  end if;
  return new;
end;
$$;

create trigger on_inventory_movement
  after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.employees              enable row level security;
alter table public.attendance             enable row level security;
alter table public.employee_transactions  enable row level security;
alter table public.inventory_categories   enable row level security;
alter table public.inventory_items        enable row level security;
alter table public.inventory_movements    enable row level security;

-- Authenticated users (managers) can do everything
create policy "auth_all_employees"
  on public.employees for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth_all_attendance"
  on public.attendance for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth_all_emp_transactions"
  on public.employee_transactions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth_all_inv_categories"
  on public.inventory_categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth_all_inv_items"
  on public.inventory_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth_all_inv_movements"
  on public.inventory_movements for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.inventory_items;

-- ============================================================
-- SEED INVENTORY CATEGORIES
-- ============================================================
insert into public.inventory_categories (name) values
  ('Dairy'), ('Beverages'), ('Bakery'), ('Vegetables'), ('Meat'),
  ('Dry Goods'), ('Packaging'), ('Cleaning'), ('Other')
on conflict (name) do nothing;
