# SQL setup files

## Run in this order

1. **01-schema.sql** — creates all 21 tables.

2. **05-grant-schema-privileges.sql** — baseline `GRANT`s on the `public`
   schema for `anon`/`authenticated`/`service_role`. Supabase normally
   applies these automatically on project creation, but they can end up
   missing on a project (this happened on staging) — without them, every
   query fails with "permission denied for table ..." even for a fully
   RLS-eligible user, since a missing GRANT is checked before RLS ever
   runs. Safe and idempotent to run on every project, including
   production, even if it already has these.

3. **gym.sql** — `is_staff()` / `my_user_id()` helper functions, plus RLS
   policies for everything under the Gym app: users, invoices, payments,
   classes, class_sessions, bookings, slots, pt_bookings, checkins,
   assessments, weight_log, period_log, programs, mls_live_store,
   mls_history, hep_progression_store. **Run this before blog.sql / gallery.sql /
   shop.sql** — they all call `is_staff()`, which is defined here.

4. **blog.sql**, **gallery.sql**, **shop.sql** — policies for the three
   standalone site sections. Order doesn't matter between these three,
   as long as gym.sql already ran.

5. **03-fix-users-self-escalation.sql** — the trigger that stops a plain
   member from editing their own `roles`, `balance`, `credits`,
   `trainer`, `last_checkin`, etc. on their own `users` row. Run after
   gym.sql (needs `is_staff()` to already exist).

6. **06-accountability-groups.sql** — the Accountability Groups feature:
   two new tables (`accountability_groups`, `accountability_group_members`)
   plus RPCs for searching members, connecting/inviting, accepting or
   declining, leaving, and reading a group's feed (today's workout +
   check-in stats). Run after gym.sql (needs `is_staff()`/`my_user_id()`).

7. **07-program-assignment.sql** — adds `assigned_by`/`assigned_at` to
   `programs`, so a coach-assigned program can be told apart from a
   member's own self-edit. No new tables, no RLS changes — reuses the
   existing owner-or-staff write policy and the existing coach-client
   relationship (`pt_bookings`, via `activeClientIdsForTrainer()`).
   Safe to run any time after `01-schema.sql`.

8. **02-rls-audit-diagnostic.sql** — not a setup step, a read-only check.
   Run any time to see what RLS state actually looks like.

## Fresh vs. reconstructed

`gym.sql`, `blog.sql`, `gallery.sql`, and `shop.sql` are freshly written,
reconstructed from the exact policy audit you ran and pasted back earlier
in this conversation — not copied from an original file, since I never
had one. They should match what's already live on production. If you
still have your *actual* original policy-creation scripts saved
somewhere, treat those as the source of truth and use these as a
cross-check instead.

**One flagged gap:** your audit only showed a single SELECT policy on
`programs` — no INSERT/UPDATE at all. `gym.sql` includes a write policy
for it (owner or staff), matching the pattern used correctly on
`hep_progression_store` and `mls_live_store`, but this is a best guess,
not a confirmed match to production. Worth a quick check with
`02-rls-audit-diagnostic.sql` after running it, to see whether it matches
what you'd expect.

## Already applied elsewhere, not part of this folder

- **`promote kevin to admin and coach.sql`** — a one-off account change,
  already run, not part of repeatable project setup.
