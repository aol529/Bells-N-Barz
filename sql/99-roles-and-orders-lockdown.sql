-- ============================================================
-- ROLES ARE ADMIN-ONLY, AND ORDERS GO THROUGH place_shop_order (ran on live 2026-11-06)
-- Run after 54-users-staff-column-trigger.sql and 97-shop-delivery.sql.
-- Safe to re-run.
--
-- 1. Any staff session could change roles, so a coach could make themselves
--    an admin. Now only admins can. Staff can still add members, who are
--    always created as plain members.
-- 2. Members could still insert an order directly with a total of their
--    choosing. place_shop_order works out the total and doesn't need this
--    policy. App versions before 2.0 can no longer place orders.
--
-- To undo: re-run sql/54-users-staff-column-trigger.sql, and re-create
-- "members create own orders" from sql/shop.sql.
-- ============================================================

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

drop policy if exists "members create own orders" on public.orders;
