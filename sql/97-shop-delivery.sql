-- ============================================================
-- SHOP: PICKUP OR DELIVERY BY ZONE (ran on live 2026-11-05)
-- Run after shop.sql and 80-shop-admin-only.sql. Safe to re-run.
--
-- delivery_zones   areas and their fees. Admins add, change, hide and
--                  delete them; everyone signed in sees the active ones.
--                  Fees are in dollars, like every other price here.
-- orders           gains how the order reaches the buyer.
-- place_shop_order the one way the website and app place an order. The
--                  database works out the price and fee itself, so a
--                  changed page or old app can't choose its own total.
-- ============================================================

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  fee numeric(10,2) not null default 0 check (fee >= 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.delivery_zones enable row level security;

drop policy if exists "signed in read active zones" on public.delivery_zones;
create policy "signed in read active zones"
  on public.delivery_zones for select
  to authenticated
  using (active or is_staff());

drop policy if exists "admins manage zones" on public.delivery_zones;
create policy "admins manage zones"
  on public.delivery_zones for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select, insert, update, delete on public.delivery_zones to authenticated;

alter table public.orders add column if not exists fulfilment text not null default 'pickup';
alter table public.orders add column if not exists delivery_zone text;
alter table public.orders add column if not exists delivery_fee numeric(10,2) not null default 0;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists delivery_phone text;

alter table public.orders drop constraint if exists orders_fulfilment_check;
alter table public.orders add constraint orders_fulfilment_check check (fulfilment in ('pickup', 'delivery'));

-- p_zone null means pickup. Digital products and packages ignore delivery.
create or replace function place_shop_order(
  p_product uuid,
  p_qty integer default 1,
  p_zone uuid default null,
  p_address text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  p public.products%rowtype;
  z public.delivery_zones%rowtype;
  physical boolean;
  qty integer := greatest(coalesce(p_qty, 1), 1);
  address text := nullif(trim(coalesce(p_address, '')), '');
  phone text := nullif(trim(coalesce(p_phone, '')), '');
  oid uuid;
begin
  if me is null then raise exception 'Please sign in to order.'; end if;
  select * into p from public.products where id = p_product and active;
  if not found then raise exception 'That product is no longer available.'; end if;

  physical := p.type not in ('package', 'digital');
  if physical and coalesce(p.stock, 0) < qty then
    raise exception 'Only % left in stock.', greatest(coalesce(p.stock, 0), 0);
  end if;

  if physical and p_zone is not null then
    select * into z from public.delivery_zones where id = p_zone and active;
    if not found then raise exception 'That delivery area is no longer available.'; end if;
    if address is null then raise exception 'Enter your delivery address.'; end if;
    if phone is null then raise exception 'Enter a phone number for delivery.'; end if;
  end if;

  insert into public.orders (user_id, product_id, quantity, amount, status,
                             fulfilment, delivery_zone, delivery_fee, delivery_address, delivery_phone)
  values (me, p.id, qty, p.price * qty + coalesce(z.fee, 0), 'pending',
          case when z.id is null then 'pickup' else 'delivery' end,
          z.name, coalesce(z.fee, 0),
          case when z.id is null then null else address end,
          case when z.id is null then null else phone end)
  returning id into oid;
  return oid;
end;
$$;

revoke all on function place_shop_order(uuid, integer, uuid, text, text) from public, anon;
grant execute on function place_shop_order(uuid, integer, uuid, text, text) to authenticated;
