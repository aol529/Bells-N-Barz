-- ============================================================
-- COACHING PACKAGES
-- Run after 71-invoice-reminders.sql. Safe to re-run.
--
-- Adds more Session Packages to the Shop alongside the 10- and 5-Session
-- Packs. All are plain credit packs: buying one creates an invoice in
-- Admin > Billing, and the credits land on the member once it's paid.
-- Skips any package whose name already exists, so edits made in
-- Admin > Shop are never overwritten. Prices can be changed there.
-- ============================================================

insert into public.products (type, name, description, price, credits, active)
select v.type, v.name, v.description, v.price, v.credits, true
from (values
  ('package', 'Intro Session',            '1 one-on-one taster session with a coach · new members',                              35,   1),
  ('package', 'Starter 3-Pack',           '3 sessions: assessment, program walkthrough and technique check · never expires',      150,  3),
  ('package', '20-Session Pack',          '20 one-on-one session credits · best per-session price · never expires',              880,  20),
  ('package', 'Partner Pack',             '10 sessions for two people training together · booked by the buyer · never expires',  720,  10),
  ('package', 'Transformation 12-Week',   '24 sessions (2 a week for 12 weeks) with body-fat and measurement checks at start and finish', 1080, 24)
) as v(type, name, description, price, credits)
where not exists (select 1 from public.products p where p.name = v.name);
