-- ============================================================
-- SHOP: ONLY ADMINS CHANGE PRODUCTS
-- Run after shop.sql and 41-coach-ratings.sql (needs is_admin()).
-- Safe to re-run.
--
-- Prices, products and stock are the owner's call, so adding, editing,
-- hiding and deleting products is now admin-only. Coaches and other
-- staff still see every product (hidden ones too) and still handle
-- orders; marking an order paid takes it out of stock through
-- shop_take_stock() below, which is the only product change they can make.
-- ============================================================

drop policy if exists "staff manage products" on public.products;
drop policy if exists "admins add products" on public.products;
create policy "admins add products"
  on public.products for insert
  with check (is_admin());

drop policy if exists "staff update products" on public.products;
drop policy if exists "admins update products" on public.products;
create policy "admins update products"
  on public.products for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "staff delete products" on public.products;
drop policy if exists "admins delete products" on public.products;
create policy "admins delete products"
  on public.products for delete
  using (is_admin());

-- Takes p_qty off a product's stock (never below 0) when an order is
-- marked paid, and returns the new stock. Staff only.
create or replace function shop_take_stock(p_product uuid, p_qty integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
begin
  if not is_staff() then
    raise exception 'Only staff can update stock';
  end if;
  update public.products
     set stock = greatest(0, coalesce(stock, 0) - greatest(coalesce(p_qty, 0), 0))
   where id = p_product
  returning stock into v_stock;
  return v_stock;
end;
$$;

revoke all on function shop_take_stock(uuid, integer) from public, anon;
grant execute on function shop_take_stock(uuid, integer) to authenticated;
