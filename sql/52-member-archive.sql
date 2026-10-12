-- ============================================================
-- MEMBER ARCHIVE (Admin > Users: "Archive" replaces "Delete")
-- Run after 51-fix-broken-blog-links.sql. Safe to re-run.
--
-- Deleting a member would have to touch 30+ tables that reference them
-- (messages, meal plans, health logs, invoices, ratings…). Archiving
-- keeps every record and just takes the member out of circulation:
--
--   * status is set to 'suspended', which every server function already
--     excludes (coach directory, points, reminders, meal plans, teams,
--     inbox search) — so nothing else needs changing;
--   * archived_at records when, which is what tells an archived member
--     apart from an ordinary suspension. The app hides archived members
--     from Admin lists (there's an "Archived" filter with Restore) and
--     refuses their sign-in.
--
-- archived_at is a staff-only column: the trigger below is the version
-- from 40-points-system.sql with archived_at added to the protected
-- list, so a member can't archive or un-archive themselves.
-- ============================================================

alter table public.users add column if not exists archived_at timestamptz;

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

-- Check: should list archived_at.
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name = 'users' and column_name = 'archived_at';
