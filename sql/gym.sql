-- ============================================================
-- GYM APP — helper functions + RLS policies
-- Covers: users, invoices, payments, classes, class_sessions,
-- bookings, slots, pt_bookings, checkins, assessments, weight_log,
-- period_log, programs, mls_live_store, mls_history, hep_progression_store
--
-- Run this FIRST — blog.sql, gallery.sql, and shop.sql all call
-- is_staff() and my_user_id(), which are defined here.
-- Safe to re-run: functions use CREATE OR REPLACE, policies are
-- dropped before being recreated.
-- ============================================================

-- ---------------- HELPER FUNCTIONS ----------------

-- Maps the logged-in Supabase Auth user to their row in public.users.
create or replace function my_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_id = auth.uid();
$$;

-- True if the logged-in user's profile has any staff-level role.
create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid()
    and roles && array['admin','trainer','staff']::text[]
  );
$$;

-- ---------------- USERS ----------------
alter table public.users enable row level security;

drop policy if exists "a user can insert their own profile row" on public.users;
create policy "a user can insert their own profile row"
  on public.users for insert
  with check (auth_id = auth.uid());

drop policy if exists "members can read own row" on public.users;
create policy "members can read own row"
  on public.users for select
  using (auth_id = auth.uid());

drop policy if exists "members can update own row" on public.users;
create policy "members can update own row"
  on public.users for update
  using (auth_id = auth.uid());
-- Paired with the trigger in 03-fix-users-self-escalation.sql, which
-- blocks non-staff from changing roles/balance/credits/etc. on this
-- same row-level UPDATE policy.

drop policy if exists "staff can read all users" on public.users;
create policy "staff can read all users"
  on public.users for select
  using (is_staff());

drop policy if exists "staff can write all users" on public.users;
create policy "staff can write all users"
  on public.users for all
  using (is_staff());

-- ---------------- INVOICES ----------------
alter table public.invoices enable row level security;

drop policy if exists "members read own invoices" on public.invoices;
create policy "members read own invoices"
  on public.invoices for select
  using (user_id = my_user_id());

drop policy if exists "staff full access invoices" on public.invoices;
create policy "staff full access invoices"
  on public.invoices for all
  using (is_staff());

-- ---------------- PAYMENTS ----------------
alter table public.payments enable row level security;

drop policy if exists "members read own payments" on public.payments;
create policy "members read own payments"
  on public.payments for select
  using (user_id = my_user_id());

drop policy if exists "staff full access payments" on public.payments;
create policy "staff full access payments"
  on public.payments for all
  using (is_staff());

-- ---------------- CLASSES ----------------
alter table public.classes enable row level security;

drop policy if exists "anyone can read classes" on public.classes;
create policy "anyone can read classes"
  on public.classes for select
  using (true);

drop policy if exists "staff manage classes" on public.classes;
create policy "staff manage classes"
  on public.classes for insert
  with check (is_staff());

drop policy if exists "staff update classes" on public.classes;
create policy "staff update classes"
  on public.classes for update
  using (is_staff());

drop policy if exists "staff delete classes" on public.classes;
create policy "staff delete classes"
  on public.classes for delete
  using (is_staff());

-- ---------------- CLASS_SESSIONS ----------------
alter table public.class_sessions enable row level security;

drop policy if exists "anyone can read sessions" on public.class_sessions;
create policy "anyone can read sessions"
  on public.class_sessions for select
  using (true);

drop policy if exists "staff manage sessions" on public.class_sessions;
create policy "staff manage sessions"
  on public.class_sessions for insert
  with check (is_staff());

drop policy if exists "staff update sessions" on public.class_sessions;
create policy "staff update sessions"
  on public.class_sessions for update
  using (is_staff());

drop policy if exists "staff delete sessions" on public.class_sessions;
create policy "staff delete sessions"
  on public.class_sessions for delete
  using (is_staff());

-- ---------------- BOOKINGS ----------------
alter table public.bookings enable row level security;

drop policy if exists "members read own bookings" on public.bookings;
create policy "members read own bookings"
  on public.bookings for select
  using (user_id = my_user_id());

drop policy if exists "members create own bookings" on public.bookings;
create policy "members create own bookings"
  on public.bookings for insert
  with check (user_id = my_user_id());

drop policy if exists "members cancel own bookings" on public.bookings;
create policy "members cancel own bookings"
  on public.bookings for update
  using (user_id = my_user_id());

drop policy if exists "staff full access bookings" on public.bookings;
create policy "staff full access bookings"
  on public.bookings for all
  using (is_staff());

-- ---------------- SLOTS ----------------
alter table public.slots enable row level security;

drop policy if exists "anyone can read slots" on public.slots;
create policy "anyone can read slots"
  on public.slots for select
  using (true);

drop policy if exists "staff manage slots" on public.slots;
create policy "staff manage slots"
  on public.slots for insert
  with check (is_staff());

drop policy if exists "staff update slots" on public.slots;
create policy "staff update slots"
  on public.slots for update
  using (is_staff());

drop policy if exists "staff delete slots" on public.slots;
create policy "staff delete slots"
  on public.slots for delete
  using (is_staff());

-- ---------------- PT_BOOKINGS ----------------
alter table public.pt_bookings enable row level security;

drop policy if exists "members read own pt_bookings" on public.pt_bookings;
create policy "members read own pt_bookings"
  on public.pt_bookings for select
  using (user_id = my_user_id());

drop policy if exists "members create own pt_bookings" on public.pt_bookings;
create policy "members create own pt_bookings"
  on public.pt_bookings for insert
  with check (user_id = my_user_id());

drop policy if exists "staff full access pt_bookings" on public.pt_bookings;
create policy "staff full access pt_bookings"
  on public.pt_bookings for all
  using (is_staff());

-- ---------------- CHECKINS ----------------
alter table public.checkins enable row level security;

drop policy if exists "members read own checkins" on public.checkins;
create policy "members read own checkins"
  on public.checkins for select
  using (user_id = my_user_id());

drop policy if exists "members create own checkins" on public.checkins;
create policy "members create own checkins"
  on public.checkins for insert
  with check (user_id = my_user_id());

drop policy if exists "staff full access checkins" on public.checkins;
create policy "staff full access checkins"
  on public.checkins for all
  using (is_staff());

-- ---------------- ASSESSMENTS ----------------
alter table public.assessments enable row level security;

drop policy if exists "members read own assessments" on public.assessments;
create policy "members read own assessments"
  on public.assessments for select
  using (user_id = my_user_id());

drop policy if exists "staff full access assessments" on public.assessments;
create policy "staff full access assessments"
  on public.assessments for all
  using (is_staff());
-- No member INSERT/UPDATE policy — matches production. Assessments are
-- logged by staff only (the app's "+ Log New Assessment" button lives in
-- the staff-facing Admin editor, not anywhere a member can reach).

-- ---------------- WEIGHT_LOG ----------------
alter table public.weight_log enable row level security;

drop policy if exists "members manage own weight_log" on public.weight_log;
create policy "members manage own weight_log"
  on public.weight_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "staff full access weight_log" on public.weight_log;
create policy "staff full access weight_log"
  on public.weight_log for all
  using (is_staff());

-- ---------------- PERIOD_LOG ----------------
-- Same ownership pattern as weight_log: a member manages their own rows,
-- staff have full access for training/health-plan purposes.
alter table public.period_log enable row level security;

drop policy if exists "members manage own period_log" on public.period_log;
create policy "members manage own period_log"
  on public.period_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "staff full access period_log" on public.period_log;
create policy "staff full access period_log"
  on public.period_log for all
  using (is_staff());

-- ---------------- PROGRAMS ----------------
-- NOTE: the audit you ran only showed ONE policy on this table — the
-- (already-fixed) SELECT policy below. No INSERT/UPDATE policy showed up
-- at all. That's either a real gap (member program-saves could be
-- silently failing) or it just didn't make it into what got pasted back.
-- The ALL/write policy below is my best guess at what SHOULD exist,
-- matching the identical pattern already used correctly on
-- hep_progression_store and mls_live_store (same owner_id + jsonb shape).
-- Verify against your actual production policies before trusting this
-- fully — if production already has a working write policy with
-- different wording, keep that one instead of this guess.
alter table public.programs enable row level security;

drop policy if exists "anyone can read programs" on public.programs; -- old, over-broad — superseded below
drop policy if exists "owner or staff can read programs" on public.programs;
create policy "owner or staff can read programs"
  on public.programs for select
  using (owner_id = my_user_id() or is_staff());

drop policy if exists "owner or staff can write programs" on public.programs;
create policy "owner or staff can write programs"
  on public.programs for all
  using (owner_id = my_user_id() or is_staff())
  with check (owner_id = my_user_id() or is_staff());

-- ---------------- MLS_LIVE_STORE (Live Session Log — in-progress state) ----------------
alter table public.mls_live_store enable row level security;

drop policy if exists "users manage own mls_live_store" on public.mls_live_store;
create policy "users manage own mls_live_store"
  on public.mls_live_store for all
  using (owner_id = my_user_id())
  with check (owner_id = my_user_id());

drop policy if exists "staff full access mls_live_store" on public.mls_live_store;
create policy "staff full access mls_live_store"
  on public.mls_live_store for all
  using (is_staff());

-- ---------------- MLS_HISTORY (Live Session Log — saved sessions) ----------------
alter table public.mls_history enable row level security;

drop policy if exists "members manage own mls_history" on public.mls_history;
create policy "members manage own mls_history"
  on public.mls_history for all
  using (member_id = my_user_id())
  with check (member_id = my_user_id());

drop policy if exists "staff full access mls_history" on public.mls_history;
create policy "staff full access mls_history"
  on public.mls_history for all
  using (is_staff());

-- ---------------- HEP_PROGRESSION_STORE (Track tab — Hepburn progression) ----------------
alter table public.hep_progression_store enable row level security;

drop policy if exists "users manage own hep_progression_store" on public.hep_progression_store;
create policy "users manage own hep_progression_store"
  on public.hep_progression_store for all
  using (owner_id = my_user_id())
  with check (owner_id = my_user_id());

drop policy if exists "staff full access hep_progression_store" on public.hep_progression_store;
create policy "staff full access hep_progression_store"
  on public.hep_progression_store for all
  using (is_staff());
