-- Run this on BOTH projects (production now, staging once it exists).
-- It replaces the function from fix-users-self-escalation.sql with the
-- same logic plus two more protected columns:
--   - trainer       (which staff member is assigned to this member —
--                     a staff decision, not something to self-assign)
--   - last_checkin  (a denormalized field that should only be updated
--                     by whatever process reads the real checkins table,
--                     not hand-edited by the member)
-- The trigger itself (trg_protect_staff_only_user_columns) doesn't need
-- to be recreated — CREATE OR REPLACE on the function is enough since the
-- trigger just calls it by name.

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
     new.last_checkin   is distinct from old.last_checkin
  then
    raise exception 'You do not have permission to change that field. Contact your coach/staff.';
  end if;

  return new;
end;
$$;

-- ============================================================
-- Verify (as a logged-in plain member): both should now fail
--   update users set trainer = 'Someone Else' where auth_id = auth.uid();
--   update users set last_checkin = current_date where auth_id = auth.uid();
-- This should still succeed:
--   update users set phone = '+254700000000' where auth_id = auth.uid();
-- ============================================================
