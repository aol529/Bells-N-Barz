-- ============================================================
-- REGISTRATION FEE
-- Run after 73-restore-seed-products.sql. Safe to re-run.
--
-- Every self sign-up gets a one-time $0.50 "Registration" invoice, due
-- a week after joining. Staff mark it paid in Admin > Billing as usual;
-- nothing in the app is blocked while it's unpaid. Members staff add by
-- hand (Admin > Members) aren't charged — add the invoice yourself if
-- they should be.
--
-- Self sign-up = a users row inserted by a non-staff session (the same
-- test protect_staff_only_user_columns() uses in 54). Runs AFTER INSERT,
-- so the upserts saveUsers() sends for existing rows never trigger it.
-- security definer because members can only read invoices, not create.
-- Amounts are US dollars; the app shows the KES equivalent on request.
-- ============================================================

create or replace function add_registration_invoice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_staff() or current_setting('bnb.system_write', true) = 'on' then
    return new;
  end if;

  insert into public.invoices (user_id, amount, type, issued_date, due_date, notes)
  values (new.id, 0.50, 'registration', gym_local_now()::date, gym_local_now()::date + 7,
          'One-time app registration fee');
  return new;
end;
$$;

drop trigger if exists trg_add_registration_invoice on public.users;
create trigger trg_add_registration_invoice
  after insert on public.users
  for each row execute function add_registration_invoice();
