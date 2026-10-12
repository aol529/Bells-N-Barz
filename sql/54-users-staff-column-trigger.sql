-- ============================================================
-- STAFF-ONLY USER COLUMNS: make sure the trigger is actually attached,
-- and cover sign-up inserts too.
-- Run on BOTH projects (staging = the GitHub Pages site, and production).
-- Safe to re-run.
--
-- Found Oct 2026 with sql/check-security.sql on staging:
--   staff_column_trigger_on = false
-- The function protect_staff_only_user_columns() existed, but no trigger
-- on public.users was calling it. sql/03 only ever replaced the function
-- ("the trigger doesn't need to be recreated"); the trigger itself came
-- from an older script that isn't in this repo and was never run on
-- staging. Without it, a signed-in member could update their own row and
-- give themselves roles = {admin}, clear their balance, add credits, etc.
--
-- Second gap, both projects: the users INSERT policy only checks
-- auth_id = auth.uid(). The sign-up screen sends roles {member}, but
-- anyone could create an auth account and insert their own profile row
-- directly with roles {admin} and 999 credits. So the trigger now also
-- runs on INSERT: for a non-staff insert, every staff-only column is set
-- to the same safe values the sign-up screen sends, whatever was sent.
--
-- The UPDATE logic is unchanged from 52-member-archive.sql.
-- ============================================================

create or replace function protect_staff_only_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists trg_protect_staff_only_user_columns on public.users;
create trigger trg_protect_staff_only_user_columns
  before insert or update on public.users
  for each row execute function protect_staff_only_user_columns();

-- Check: re-run sql/check-security.sql — staff_column_trigger_on should
-- now be true.
