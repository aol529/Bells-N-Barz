-- ============================================================
-- SHOP — RLS policies for products, orders
-- Requires is_staff() and my_user_id() from gym.sql — run that first.
-- (Checkout also calls straight into invoices via
-- window.BNB_BILLING.createInvoice() — see gym.sql's invoices policies.)
-- ============================================================

-- ---------------- PRODUCTS ----------------
alter table public.products enable row level security;

drop policy if exists "anyone can read active products" on public.products;
create policy "anyone can read active products"
  on public.products for select
  using (active = true or is_staff());

drop policy if exists "staff manage products" on public.products;
create policy "staff manage products"
  on public.products for insert
  with check (is_staff());

drop policy if exists "staff update products" on public.products;
create policy "staff update products"
  on public.products for update
  using (is_staff());

drop policy if exists "staff delete products" on public.products;
create policy "staff delete products"
  on public.products for delete
  using (is_staff());

-- ---------------- ORDERS ----------------
alter table public.orders enable row level security;

drop policy if exists "members read own orders" on public.orders;
create policy "members read own orders"
  on public.orders for select
  using (user_id = my_user_id());

drop policy if exists "members create own orders" on public.orders;
create policy "members create own orders"
  on public.orders for insert
  with check (user_id = my_user_id());

drop policy if exists "staff full access orders" on public.orders;
create policy "staff full access orders"
  on public.orders for all
  using (is_staff());
