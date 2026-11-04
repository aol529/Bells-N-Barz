-- ============================================================
-- M-PESA PAYBILL PAYMENTS
-- Run after 93-blood-oxygen.sql. Safe to re-run.
--
-- Members pay by M-Pesa Paybill themselves, then send in the M-Pesa
-- code from their confirmation SMS. The money lands in the gym's bank
-- account, where this app can't see it, so nothing here counts as paid
-- until staff have matched the code to the bank/M-Pesa statement and
-- confirmed it. Confirming posts the payment (invoice) or marks the
-- order paid (credits or stock), in one step.
--
-- Amounts: invoices and orders are kept in US dollars. The member
-- pays in shillings, so a claim keeps both. amount_usd always comes
-- from the invoice or order here on the server; amount_kes is what the
-- member was asked to pay, for staff to compare with the statement.
-- ============================================================

create table if not exists public.mpesa_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  invoice_id uuid references public.invoices(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  amount_usd numeric not null check (amount_usd > 0),
  amount_kes integer not null check (amount_kes > 0),
  code text not null check (code ~ '^[A-Z0-9]{10}$'),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  note text check (note is null or length(note) <= 300),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((invoice_id is null) <> (order_id is null) or status <> 'pending')
);
create index if not exists mpesa_claims_status_idx on public.mpesa_claims (status, created_at);
create index if not exists mpesa_claims_user_idx on public.mpesa_claims (user_id, created_at);
-- A code can only be claimed once, unless staff rejected it.
create unique index if not exists mpesa_claims_code_uniq on public.mpesa_claims (code) where status <> 'rejected';

grant select on public.mpesa_claims to authenticated;
alter table public.mpesa_claims enable row level security;

-- All writes go through the two functions below.
drop policy if exists "members read own mpesa_claims" on public.mpesa_claims;
create policy "members read own mpesa_claims"
  on public.mpesa_claims for select
  using (user_id = my_user_id() or is_staff());

-- ---------------- Member: "I've paid, here's my code" ----------------
create or replace function submit_mpesa_claim(p_invoice uuid, p_order uuid, p_kes integer, p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_usd numeric;
  v_status text;
  v_name text;
  v_id uuid;
  v_admin record;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  if (p_invoice is null) = (p_order is null) then raise exception 'Choose one invoice or order to pay.'; end if;
  if v_code !~ '^[A-Z0-9]{10}$' then raise exception 'An M-Pesa code is 10 letters and numbers, from your confirmation SMS.'; end if;
  if p_kes is null or p_kes <= 0 or p_kes > 10000000 then raise exception 'Enter the amount you paid.'; end if;
  if (select count(*) from mpesa_claims where user_id = caller and status = 'pending') >= 10 then
    raise exception 'You have several payments waiting to be checked. Please ask the front desk.';
  end if;

  if p_invoice is not null then
    select greatest(i.amount - coalesce((select sum(p.amount) from payments p where p.invoice_id = i.id), 0), 0)
      into v_usd
      from invoices i
      where i.id = p_invoice and i.user_id = caller and not coalesce(i.voided, false);
    if v_usd is null then raise exception 'That invoice was not found.'; end if;
    if v_usd <= 0.005 then raise exception 'That invoice is already paid.'; end if;
    if exists (select 1 from mpesa_claims where invoice_id = p_invoice and status = 'pending') then
      raise exception 'A payment for this invoice is already waiting to be checked.';
    end if;
  else
    select o.amount, o.status into v_usd, v_status from orders o where o.id = p_order and o.user_id = caller;
    if v_usd is null then raise exception 'That order was not found.'; end if;
    if v_status <> 'pending' then raise exception 'That order is not waiting for payment.'; end if;
    if exists (select 1 from mpesa_claims where order_id = p_order and status = 'pending') then
      raise exception 'A payment for this order is already waiting to be checked.';
    end if;
  end if;

  begin
    insert into mpesa_claims (user_id, invoice_id, order_id, amount_usd, amount_kes, code)
    values (caller, p_invoice, p_order, v_usd, p_kes, v_code)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'That M-Pesa code has already been sent in.';
  end;

  select full_name into v_name from users where id = caller;
  for v_admin in select id from users where roles && array['admin']::text[] and status <> 'suspended' loop
    insert into notifications (user_id, type, message, link_tab)
    values (v_admin.id, 'mpesa_claim',
      coalesce(v_name, 'A member') || ' sent M-Pesa code ' || v_code || ' for KSh ' || to_char(p_kes, 'FM999,999,999') || '. Check it against the statement.',
      null);
  end loop;
  return v_id;
end;
$$;

-- ---------------- Staff: confirm or reject ----------------
create or replace function review_mpesa_claim(p_id uuid, p_approve boolean, p_note text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c mpesa_claims;
  v_owed numeric;
  v_amount numeric;
  v_inv_amount numeric;
  v_order orders;
  v_product products;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not is_staff() then raise exception 'Staff only.'; end if;
  select * into c from mpesa_claims where id = p_id for update;
  if not found then raise exception 'That payment was not found.'; end if;
  if c.status <> 'pending' then raise exception 'That payment has already been reviewed.'; end if;

  if not coalesce(p_approve, false) then
    update mpesa_claims set status = 'rejected', note = left(v_note, 300), reviewed_by = my_user_id(), reviewed_at = now() where id = p_id;
    insert into notifications (user_id, type, message, link_tab)
    values (c.user_id, 'mpesa_claim', 'We could not match M-Pesa code ' || c.code || '.'
      || coalesce(' ' || left(v_note, 300), '') || ' Please check it or talk to the front desk.', null);
    return 'rejected';
  end if;

  if c.invoice_id is not null then
    select i.amount, greatest(i.amount - coalesce((select sum(p.amount) from payments p where p.invoice_id = i.id), 0), 0)
      into v_inv_amount, v_owed
      from invoices i where i.id = c.invoice_id for update;
    if v_owed is null then raise exception 'That invoice no longer exists.'; end if;
    v_amount := least(c.amount_usd, v_owed);
    if v_amount > 0 then
      insert into payments (invoice_id, user_id, amount, date, method, notes)
      values (c.invoice_id, c.user_id, v_amount, (now() at time zone 'Africa/Nairobi')::date, 'M-Pesa',
              'M-Pesa ' || c.code || ', KSh ' || c.amount_kes);
    end if;
    if v_owed - v_amount <= 0.005 then update invoices set status = 'paid' where id = c.invoice_id; end if;
    update users u set balance = (
      select coalesce(sum(greatest(i.amount - coalesce((select sum(p.amount) from payments p where p.invoice_id = i.id), 0), 0)), 0)
      from invoices i where i.user_id = c.user_id and not coalesce(i.voided, false)
    ) where u.id = c.user_id;
  elsif c.order_id is not null then
    select * into v_order from orders where id = c.order_id for update;
    if not found then raise exception 'That order no longer exists.'; end if;
    if v_order.status = 'pending' then
      select * into v_product from products where id = v_order.product_id;
      update orders set status = 'paid' where id = v_order.id;
      if v_product.type = 'package' then
        update users set credits = coalesce(credits, 0) + coalesce(v_product.credits, 0) * v_order.quantity where id = c.user_id;
      elsif v_product.type <> 'digital' then
        perform shop_take_stock(v_order.product_id, v_order.quantity);
      end if;
    end if;
  else
    raise exception 'That invoice or order no longer exists.';
  end if;

  update mpesa_claims set status = 'confirmed', note = left(v_note, 300), reviewed_by = my_user_id(), reviewed_at = now() where id = p_id;
  insert into notifications (user_id, type, message, link_tab)
  values (c.user_id, 'mpesa_claim', 'Your M-Pesa payment ' || c.code || ' is confirmed. Thank you!', null);
  return 'confirmed';
end;
$$;

revoke all on function submit_mpesa_claim(uuid, uuid, integer, text) from public, anon;
grant execute on function submit_mpesa_claim(uuid, uuid, integer, text) to authenticated;
revoke all on function review_mpesa_claim(uuid, boolean, text) from public, anon;
grant execute on function review_mpesa_claim(uuid, boolean, text) to authenticated;

-- ============================================================
-- Check:
--   select count(*) from mpesa_claims;   -- 0, no error
-- ============================================================
