-- ============================================================
-- 5:2 INTERMITTENT FASTING MODE
-- Extends fasting_settings (sql/16-fasting.sql) with a second mode:
-- eat normally 5 days a week, cap calories on 2 chosen (ideally
-- non-consecutive) days. Unlike the daily 16:8/18:6/20:4 ring timer,
-- 5:2 has no "hours until X" to count down to — it's a weekly calendar
-- pattern checked against calorie intake, so it reuses nutrition_log
-- (already in 10-nutrition-log.sql) instead of a new log table: a
-- "fasting day" is just one of the two chosen weekdays, and "did you
-- hit it" is just that date's nutrition_log.calories vs. the cap.
--
-- No RLS changes needed — fasting_settings' existing owner-or-staff
-- "for all" policies already cover these new columns at the row level.
-- Run after 16-fasting.sql.
-- ============================================================

alter table public.fasting_settings add column if not exists mode text not null default 'daily';
alter table public.fasting_settings add column if not exists weekly_fast_days text; -- comma-separated day-of-week ints, JS Date.getDay() convention (0=Sun..6=Sat), e.g. '1,4' for Mon & Thu
alter table public.fasting_settings add column if not exists weekly_calorie_cap integer not null default 500;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fasting_settings_mode_check'
  ) then
    alter table public.fasting_settings
      add constraint fasting_settings_mode_check check (mode in ('daily', '5:2'));
  end if;
end $$;

-- ============================================================
-- Verify:
-- 1. As a member, upsert your own fasting_settings row with
--    mode = '5:2', weekly_fast_days = '1,4', weekly_calorie_cap = 500 —
--    succeeds.
-- 2. Same upsert with mode = 'bogus' — fails (check constraint).
-- 3. As that member, log a nutrition_log row for today's date with
--    calories under 500, on a day that matches weekly_fast_days —
--    the app's 5:2 status card should read "under your cap."
-- ============================================================
