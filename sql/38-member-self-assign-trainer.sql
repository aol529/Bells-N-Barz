-- ============================================================
-- MEMBER SELF-ASSIGN TRAINER
-- Lets a member pick their own coach from the pool of active trainer
-- accounts (admin still controls that pool, by tagging a user with the
-- Trainer role in Admin > Users — this doesn't change). Previously
-- trainer_id was staff-only (see 13-trainer-assignment.sql), which
-- blocked this entirely.
--
-- Members can now set trainer_id themselves, any time, but only to
-- NULL (unassign) or to a user who currently holds the trainer role
-- and isn't suspended — checked here, server-side, since the
-- member-facing dropdown itself is not a security boundary. A member
-- still can't set trainer_id to an arbitrary account (another member,
-- a suspended trainer, etc.), and every other staff-only column
-- (roles, balance, plan, ...) stays exactly as protected as before.
-- ============================================================

create or replace function protect_staff_only_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_staff() then
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
     new.last_checkin   is distinct from old.last_checkin
  then
    raise exception 'You do not have permission to change that field. Contact your coach/staff.';
  end if;

  return new;
end;
$$;

-- ============================================================
-- Verify:
-- 1. As a plain member, set your own trainer_id to a real, active
--    trainer's user id — should succeed.
-- 2. As that same member, set trainer_id to a non-trainer user's id
--    (e.g. another member) — should fail with "You can only pick an
--    active coach."
-- 3. As that member, set trainer_id to null — should succeed
--    (unassigning is always allowed).
-- 4. As that member, try changing an unrelated protected field (e.g.
--    plan) in the same statement — should still fail as before.
-- ============================================================
