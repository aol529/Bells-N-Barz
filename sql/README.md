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

8. **08-accountability-streaks.sql** — adds `checkin_streak(uid)` (a
   plpgsql port of the existing client-side `currentStreak()` on a
   member's own Profile page — same rest-gap rule, not a plain
   consecutive-days count) and extends `accountability_group_feed()` with
   a `streak` column. Run after `06-accountability-groups.sql`.

9. **09-notifications.sql** — an in-app notification bell: new
   `notifications` table + RLS, plus updated `accountability_connect`/
   `accountability_respond` that now insert a notification on invite and
   on accept. Run after `06-accountability-groups.sql` (replaces those
   two functions).

10. **10-nutrition-log.sql** — the Nutrition tracker: a new `nutrition_log`
    table (one row per calendar day — calories, protein/carbs/fat, water,
    notes) plus RLS. Same ownership pattern as `weight_log`/`period_log`
    in `gym.sql` (member manages own rows, staff full access), no new
    RPCs. Run after `gym.sql` (needs `is_staff()`/`my_user_id()`).

11. **11-messages.sql** — Messaging: one thread per member, "Staff"
    collectively as the other party (any coach/admin can see and reply —
    there's no reliable way to resolve a member's specific trainer to a
    real staff `user_id`, so this isn't 1:1 with a named trainer). Two
    new tables (`message_threads`, `messages`), SELECT-only RLS, a
    `my_thread_id()` helper, and a `send_message()` RPC that does all
    writes (same "RPC-only writes" shape as `06-accountability-groups.sql`)
    plus inserts `notifications` rows. Run after `06-accountability-groups.sql`
    and `09-notifications.sql` (needs `is_staff()`/`my_user_id()` and the
    `notifications` table).

12. **12-notifications-delete-policy.sql** — adds a `staff can delete
    notifications` policy, missing from `09-notifications.sql`. Without
    it, even staff can't delete a notification row from the app itself
    (a client-side delete "succeeds" with 0 rows affected, since RLS
    silently denies any command with no matching policy). Run any time
    after `09-notifications.sql`.

13. **13-trainer-assignment.sql** — adds a real `trainer_id` link from a
    member to their assigned coach (organizational only — no RLS
    changes, every staff role keeps full access everywhere, same as
    before). Also updates `protect_staff_only_user_columns` (from
    `03-fix-users-self-escalation.sql`) so a member still can't
    self-assign their own coach. Run after `03-fix-users-self-escalation.sql`.

14. **14-inbox.sql** — Inbox: general-purpose 1:1 messaging between ANY
    two users (member, trainer, or admin), separate from `11-messages.sql`'s
    pooled member<->"all staff" support thread — both stay live side by
    side. Two new tables (`dm_threads`, `dm_messages`, deduplicated per
    unordered pair via a `(user_a, user_b)` unique constraint), SELECT-only
    RLS, a `my_dm_threads()` RPC that joins in the other participant's
    name/avatar (a plain member can't otherwise SELECT another user's row),
    and a `send_direct_message()` RPC that does all writes. Reuses
    `accountability_search_members()` from `06-accountability-groups.sql`
    to search for who to message — no new search RPC needed. Run after
    `06-accountability-groups.sql` and `09-notifications.sql` (needs
    `is_staff()`/`my_user_id()`, `accountability_search_members()`, and
    the `notifications` table).

15. **15-ekadashi-reminders.sql** — a dedup log (`ekadashi_reminders_sent`,
    one row per member per Ekadashi occurrence) for the automatic 24h-before
    reminder the Ekadashi timer sends via the Inbox. Needed because the
    reminder can be triggered by any staff member who happens to have the
    app open in that window — this table is the cross-session, cross-staff
    "has this already been sent" check, claimed via a primary-key insert
    before the Inbox message goes out. Staff-only bookkeeping, not
    member-facing. Run after `gym.sql` and `14-inbox.sql` (needs
    `is_staff()`/`my_user_id()` and `send_direct_message()`).

16. **16-fasting.sql** — the Intermittent Fasting tracker: two new tables,
    `fasting_settings` (one row per member — their chosen protocol, 16:8/
    18:6/20:4/custom) and `fasting_log` (one row per fast, `fast_end` null
    while a fast or its eating window is still in progress). Same
    owner-or-staff RLS shape as `weight_log`/`nutrition_log`, no RPCs. Run
    after `gym.sql` (needs `is_staff()`/`my_user_id()`).

17. **17-fasting-522.sql** — adds the 5:2 mode to the Fasting tracker:
    three new columns on `fasting_settings` (`mode`, `weekly_fast_days`,
    `weekly_calorie_cap`). No new tables or RLS — 5:2 "logs" reuse
    `nutrition_log`'s existing `calories`/`date` columns instead of a
    dedicated log table, since a 5:2 fasting day is just one of two
    chosen weekdays checked against that day's already-logged calories.
    Run after `16-fasting.sql`.

18. **18-nutrition-goals.sql** — the Calorie & Macro Calculator on the
    Nutrition tab: a new `nutrition_goals` table (one row per member —
    their stats, activity level, goal, and the computed daily
    calorie/protein/carb/fat targets). Same owner-or-staff RLS shape as
    `nutrition_log`, no RPCs. Run after `gym.sql` (needs
    `is_staff()`/`my_user_id()`).

19. **02-rls-audit-diagnostic.sql** — not a setup step, a read-only check.
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
