-- ============================================================
-- TRAINER ASSIGNMENT
-- Adds a real, ID-based link from a member to their assigned coach.
-- Until now the only thing resembling this was users.trainer, a
-- free-text label an admin typed in (e.g. "Coach KA") that was never
-- matched back to a real staff user_id anywhere in the codebase — and
-- the only actual relational link, pt_bookings, only reflects members
-- who've had a confirmed 1-on-1 session, not who a coach is generally
-- responsible for.
--
-- Organizational only, per the user's explicit choice: every staff
-- role (admin/trainer/staff) keeps its existing full read/write access
-- to every table everywhere — this does not touch RLS or restrict who
-- can read what, matching the "staff = broad access" pattern already
-- used consistently across this whole app. It only adds the
-- assignment link itself and lets the UI correctly reflect it.
--
-- The old free-text `trainer` column is left in place (non-destructive)
-- but the UI stops writing/reading it — trainer_id is the source of
-- truth for "who is this member's coach" going forward.
-- ============================================================

alter table public.users add column if not exists trainer_id uuid references public.users(id);

-- ---------------- Protect trainer_id the same way trainer already is ----------------
-- Replaces the function from 03-fix-users-self-escalation.sql with the
-- same logic plus trainer_id — a member still can't self-assign their
-- own coach. The trigger itself doesn't need to be recreated —
-- CREATE OR REPLACE on the function is enough since the trigger just
-- calls it by name.

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
     new.trainer_id      is distinct from old.trainer_id    or
     new.last_checkin   is distinct from old.last_checkin
  then
    raise exception 'You do not have permission to change that field. Contact your coach/staff.';
  end if;

  return new;
end;
$$;

-- ============================================================
-- Verify:
-- 1. As staff, update a member's trainer_id to a real trainer's user
--    id — should succeed.
-- 2. As that same member (logged in), try to change your own
--    trainer_id — should fail with "You do not have permission...".
-- 3. As that member, updating an unrelated field (e.g. phone) should
--    still succeed — confirms the trigger only blocks the protected
--    columns, not the whole row.
-- ============================================================
