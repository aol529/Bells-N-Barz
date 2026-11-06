-- ============================================================
-- COACHES SEE THEIR OWN CLIENTS, STAGE 2: BILLING
-- Run after 100-coach-own-clients.sql. Safe to re-run.
--
-- Invoices, payments, M-Pesa claims and shop orders are for the front
-- office (admin and front desk). Coaches keep each client's balance and
-- credits on the users row they can already see, and can change credits
-- but not balances. Points history follows can_see_member().
-- Members still read their own records, and triggers and reminders run
-- as the database, so they carry on working.
--
-- To undo: re-create the staff policies from sql/gym.sql and sql/shop.sql,
-- and re-run sql/94 and sql/80.
-- ============================================================

drop policy if exists "staff full access invoices" on public.invoices;
drop policy if exists "front office manage invoices" on public.invoices;
create policy "front office manage invoices"
  on public.invoices for all to authenticated
  using (is_front_office()) with check (is_front_office());

drop policy if exists "staff full access payments" on public.payments;
drop policy if exists "front office manage payments" on public.payments;
create policy "front office manage payments"
  on public.payments for all to authenticated
  using (is_front_office()) with check (is_front_office());

drop policy if exists "staff full access orders" on public.orders;
drop policy if exists "front office manage orders" on public.orders;
create policy "front office manage orders"
  on public.orders for all to authenticated
  using (is_front_office()) with check (is_front_office());

drop policy if exists "members read own mpesa_claims" on public.mpesa_claims;
create policy "members read own mpesa_claims"
  on public.mpesa_claims for select to authenticated
  using (user_id = my_user_id() or is_front_office());

drop policy if exists "staff read all points_ledger" on public.points_ledger;
drop policy if exists "staff read points they can see" on public.points_ledger;
create policy "staff read points they can see"
  on public.points_ledger for select to authenticated
  using (is_staff() and can_see_member(user_id));

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
  if not is_front_office() then raise exception 'Only the front desk can confirm payments.'; end if;
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

create or replace function shop_take_stock(p_product uuid, p_qty integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
begin
  if not is_front_office() then
    raise exception 'Only the front desk can update stock';
  end if;
  update public.products
     set stock = greatest(0, coalesce(stock, 0) - greatest(coalesce(p_qty, 0), 0))
   where id = p_product
  returning stock into v_stock;
  return v_stock;
end;
$$;

create or replace function protect_staff_only_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only admins decide who is staff. Coaches and front desk keep everything
  -- else they could already do, including credits and balances.
  if not is_admin() and current_setting('bnb.system_write', true) is distinct from 'on' then
    if tg_op = 'UPDATE' and new.roles is distinct from old.roles then
      raise exception 'Only an admin can change roles.';
    end if;
    if tg_op = 'INSERT' and is_staff() then
      new.roles := array['member']::text[];
    end if;
  end if;

  -- Coaches don't assign clients: the member, front desk or an admin does.
  if tg_op = 'UPDATE' and new.trainer_id is distinct from old.trainer_id and old.id is distinct from my_user_id()
     and is_staff() and not is_front_office() and current_setting('bnb.system_write', true) is distinct from 'on' then
    raise exception 'Ask the front desk to change a client''s coach.';
  end if;

  -- A balance comes from invoices, so coaches adjust credits only.
  if tg_op = 'UPDATE' and new.balance is distinct from old.balance
     and is_staff() and not is_front_office() and current_setting('bnb.system_write', true) is distinct from 'on' then
    raise exception 'Ask the front desk to change a balance.';
  end if;

  if is_staff() or current_setting('bnb.system_write', true) = 'on' then
    return new;
  end if;

  -- New profile row from a non-staff session (self sign-up): staff-only
  -- columns get sign-up defaults no matter what the client sent.
  if tg_op = 'INSERT' then
    new.roles          := array['member']::text[];
    new.status         := 'active';
    new.balance        := 0;
    new.credits        := 0;
    new.comp           := '';
    new.plan           := '';
    new.mstatus        := 'pending';
    new.contract_end   := null;
    new.flag           := 'green';
    new.internal_notes := '';
    new.auto_renew     := false;
    new.trainer        := '';
    new.trainer_id     := null;
    new.last_checkin   := null;
    new.archived_at    := null;
    return new;
  end if;

  if new.trainer_id is distinct from old.trainer_id then
    if new.trainer_id is not null and not exists (
      select 1 from public.users
      where id = new.trainer_id
      and status <> 'suspended'
      and roles && array['trainer']::text[]
    ) then
      raise exception 'You can only pick an active coach.';
    end if;
  end if;

  if new.roles      is distinct from old.roles      or
     new.status     is distinct from old.status     or
     new.balance    is distinct from old.balance    or
     new.credits    is distinct from old.credits    or
     new.comp       is distinct from old.comp       or
     new.plan       is distinct from old.plan       or
     new.mstatus    is distinct from old.mstatus    or
     new.contract_end   is distinct from old.contract_end   or
     new.flag           is distinct from old.flag           or
     new.internal_notes is distinct from old.internal_notes or
     new.lead_source    is distinct from old.lead_source    or
     new.auto_renew     is distinct from old.auto_renew     or
     new.trainer        is distinct from old.trainer        or
     new.last_checkin   is distinct from old.last_checkin   or
     new.archived_at    is distinct from old.archived_at
  then
    raise exception 'You do not have permission to change that field. Contact your coach/staff.';
  end if;

  return new;
end;
$$;

