-- ============================================================
-- SHOP: DIGITAL PRODUCTS UNLOCK AFTER PAYMENT (ran on live 2026-11-05)
-- Run after 97-shop-delivery.sql. Safe to re-run.
--
-- products can be read by anyone, so its file_url gave every file away.
-- Links now live in product_files, which only staff can read. A buyer
-- gets theirs from my_digital_link() once their order is paid.
-- ============================================================

create table if not exists public.product_files (
  product_id uuid primary key references public.products(id) on delete cascade,
  file_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.product_files enable row level security;

drop policy if exists "staff read product files" on public.product_files;
create policy "staff read product files"
  on public.product_files for select
  to authenticated
  using (is_staff());

drop policy if exists "admins manage product files" on public.product_files;
create policy "admins manage product files"
  on public.product_files for all
  to authenticated
  using (is_admin())
  with check (is_admin());

grant select, insert, update, delete on public.product_files to authenticated;

insert into public.product_files (product_id, file_url)
  select id, trim(file_url) from public.products where coalesce(trim(file_url), '') <> ''
  on conflict (product_id) do nothing;
update public.products set file_url = null where file_url is not null;

create or replace function my_digital_link(p_order uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select f.file_url
  from public.orders o
  join public.products p on p.id = o.product_id and p.type = 'digital'
  join public.product_files f on f.product_id = p.id
  where o.id = p_order and o.user_id = my_user_id() and o.status in ('paid', 'fulfilled');
$$;

revoke all on function my_digital_link(uuid) from public, anon;
grant execute on function my_digital_link(uuid) to authenticated;

-- A digital product with no file can't be sold: nothing to unlock.
create or replace function digital_file_ready(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.product_files where product_id = p_product);
$$;

create or replace function shop_block_digital_without_file()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select type from public.products where id = new.product_id) = 'digital'
     and not digital_file_ready(new.product_id) then
    raise exception 'That download isn''t ready yet. Please ask the front desk.';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_digital_file_check on public.orders;
create trigger orders_digital_file_check
  before insert on public.orders
  for each row execute function shop_block_digital_without_file();
