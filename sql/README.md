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

19. **19-blog-bring-sally-up.sql** — a one-off content insert, not a
    schema/RLS change: adds the "Bring Sally Up Challenge" post (Health
    & Appearance category) to `blog_posts`, idempotent via
    `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS` (what a from-scratch install
    gets); this is what an already-live project gets. Run any time.

20. **20-blog-old-school-70s.sql** — a one-off content insert, not a
    schema/RLS change: adds "The Old School 70's Bodybuilding Split"
    post (Health & Appearance category) to `blog_posts`, idempotent via
    `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

21. **21-blog-old-school-intensity-techniques.sql** — a one-off content
    insert, not a schema/RLS change: adds "Old School Intensity
    Techniques" (Health & Appearance category) to `blog_posts`,
    idempotent via `on conflict (slug) do nothing`. Mirrors the matching
    entry in `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

22. **22-blog-serge-nubret.sql** — a one-off content insert, not a
    schema/RLS change: adds "Serge Nubret's Pump: Golden-Era Training
    Without the Pyramid" (Health & Appearance category) to `blog_posts`,
    idempotent via `on conflict (slug) do nothing`. Mirrors the matching
    entry in `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

23. **23-blog-lee-haney.sql** — a one-off content insert, not a
    schema/RLS change: adds "Lee Haney's 3-On-1-Off Split" (Health &
    Appearance category) to `blog_posts`, idempotent via
    `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

24. **24-blog-bill-kazmaier.sql** — a one-off content insert, not a
    schema/RLS change: adds "Bill Kazmaier's Power-Building Split"
    (Health & Appearance category) to `blog_posts`, idempotent via
    `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

25. **25-blog-doug-hepburn.sql** — a one-off content insert, not a
    schema/RLS change: adds "Doug Hepburn's Program A" (Health &
    Appearance category) to `blog_posts`, idempotent via
    `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

26. **26-blog-vince-gironda-8x8.sql** — a one-off content insert, not a
    schema/RLS change: adds "Vince Gironda's 8×8" (Health & Appearance
    category) to `blog_posts`, idempotent via `on conflict (slug) do
    nothing`. Mirrors the matching entry in `js/bells-n-barz-blog.js`'s
    `SEED_POSTS`. Run any time.

27. **27-blog-german-volume-training.sql** — a one-off content insert,
    not a schema/RLS change: adds "German Volume Training: The Ten Sets
    Method" (Health & Appearance category) to `blog_posts`, idempotent
    via `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

28. **28-blog-steve-reeves.sql** — a one-off content insert, not a
    schema/RLS change: adds "The Steve Reeves Classic Physique Routine"
    (Health & Appearance category) to `blog_posts`, idempotent via
    `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

29. **29-blog-frank-zane.sql** — a one-off content insert, not a
    schema/RLS change: adds "Frank Zane's Torso/Legs/Arms Split" (Health
    & Appearance category) to `blog_posts`, idempotent via `on conflict
    (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

30. **30-blog-ronnie-coleman.sql** — a one-off content insert, not a
    schema/RLS change: adds "Ronnie Coleman's Power-Building Split"
    (Health & Appearance category) to `blog_posts`, idempotent via
    `on conflict (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. Run any time.

31. **31-blog-tom-platz.sql** — a one-off content insert, not a
    schema/RLS change: adds "The Tom Platz Leg Workout" (Health &
    Appearance category) to `blog_posts`, idempotent via `on conflict
    (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. No Program Builder preset
    accompanies this one (a single leg-only day doesn't fit the "replace
    the whole week" preset loader) — the post explains why. Run any time.

32. **32-blog-ed-coan.sql** — a one-off content insert, not a schema/RLS
    change: adds "Ed Coan's 10-Week Deadlift Program" (Health &
    Appearance category) to `blog_posts`, idempotent via `on conflict
    (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. No Program Builder preset
    (same reasoning as Tom Platz above). Run any time.

33. **33-blog-john-grimek.sql** — a one-off content insert, not a
    schema/RLS change: adds "The John Grimek Breathing Squat" (Health &
    Appearance category) to `blog_posts`, idempotent via `on conflict
    (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. No Program Builder preset
    (a finisher technique, not a training day). Run any time.

34. **34-blog-weider-principles.sql** — a one-off content insert, not a
    schema/RLS change: adds "The Weider Training Principles" (Health &
    Appearance category) to `blog_posts`, idempotent via `on conflict
    (slug) do nothing`. Mirrors the matching entry in
    `js/bells-n-barz-blog.js`'s `SEED_POSTS`. No Program Builder preset
    (a training philosophy/vocabulary piece, not a routine). Run any
    time.

35. **35-blog-contrast-training.sql** — a one-off content insert, not a
    schema/RLS change: adds "Contrast Training" (Health & Appearance
    category) to `blog_posts`, idempotent via `on conflict (slug) do
    nothing`. Mirrors the matching entry in `js/bells-n-barz-blog.js`'s
    `SEED_POSTS`. No Program Builder preset (an exercise-pairing
    technique, not a weekly split). Run any time.

36. **36-blog-bulgarian-method.sql** — a one-off content insert, not a
    schema/RLS change: adds "The Bulgarian Method" (Health & Appearance
    category) to `blog_posts`, idempotent via `on conflict (slug) do
    nothing`. Mirrors the matching entry in `js/bells-n-barz-blog.js`'s
    `SEED_POSTS`. Deliberately has no Program Builder preset — the
    source method requires daily near-max attempts under constant expert
    supervision and is explicitly unsuitable for self-selection by a
    general member; the post explains the safety reasoning. Run any
    time.

37. **37-blog-arnold-8-principles.sql** — a one-off content insert, not a
    schema/RLS change: adds "Arnold Schwarzenegger's 8 Training
    Principles" (Health & Appearance category) to `blog_posts`,
    idempotent via `on conflict (slug) do nothing`. Mirrors the matching
    entry in `js/bells-n-barz-blog.js`'s `SEED_POSTS`. No Program
    Builder preset (mindset/philosophy guidance, not a routine — Arnold's
    actual splits are already represented by the earlier Old School
    presets). Run any time.

38. **38-member-self-assign-trainer.sql** — lets a member pick their own
    coach from the active trainer accounts (admin still controls who is a
    trainer).

39. **39-available-coaches-directory.sql** — a `SECURITY DEFINER`
    directory of active coaches (id, name, photo, status), because a
    member's RLS read access is own-row only and couldn't see trainers to
    pick one.

40. **40-points-system.sql** — points for check-ins and streak
    milestones, redeemable for a free 1-on-1 credit; enforced in the
    database.

41. **41-coach-ratings.sql** — clients rate coaches they've trained with
    (five categories); coaches see averages and comments, never who wrote
    them. Also adds `gym_local_now()` and `is_admin()`, used by later files.

42. **42-pt-booking-rpcs.sql** — 1-on-1 booking and cancelling via server
    functions (`book_pt_slot`, `cancel_pt_booking`). Run after 41.

43. **43-lunar-reminders.sql** — one server function for Ekadashi and New
    Moon reminders, replacing the client-side loop from 15.

44. **44-full-moon-reminders.sql** — adds Full Moon as a third reminder
    kind. Run after 43.

45. **45-meal-plans.sql** — member questionnaires, coach-built meal plans
    and check-ins. Run after 41.

46. **46-diets-and-ai.sql** — "Try a diet" and AI meal plan suggestions.
    Run after 45.

47. **47-shopping-list.sql** — meal plan shopping list and weekly food
    budget. Run after 45.

48. **48-food-log-privacy.sql** — Me > Food Log privacy rules. Run after 45.

49. **49-body-measurements.sql** — Me > Weight > Body Composition. Run
    after 45.

50. **50-blood-pressure-and-steps.sql** — Me > BP and Me > Steps logs.
    Run after 49.

51. **51-fix-broken-blog-links.sql** — content fix, not schema: points two
    dead bodybuilding.com citations at Internet Archive copies and unlinks
    one from a site that no longer exists. Safe to re-run.

52. **52-member-archive.sql** — adds `users.archived_at` and protects it
    as a staff-only column. Admin > Users now archives members instead of
    deleting them (status `suspended` + `archived_at`; every record is
    kept, and they can be restored). Safe to re-run.

53. **53-period-log.sql** — creates `period_log` (Me > Period) with its
    RLS where it's missing; staging didn't have it. Safe to re-run.

54. **54-users-staff-column-trigger.sql** — attaches the
    `trg_protect_staff_only_user_columns` trigger to `users` (staging had
    the function but no trigger) and extends it to sign-up inserts, so a
    member can't give themselves admin roles, credits or balance changes.
    Run on both projects. Safe to re-run.

55. **55-inbox-unread.sql** — per-person "read up to" times on
    `dm_threads`, `unread` in `my_dm_threads()`, and
    `mark_dm_thread_read()`, for the unread count on the INBOX button.
    Without it the count is tracked per device. Safe to re-run.

56. **56-read-receipts.sql** — read receipts: `member_read_at` /
    `staff_read_at` on `message_threads` with `mark_message_thread_read()`,
    and the other person's read time (`other_read_at`) in
    `my_dm_threads()`. Run after 55. Safe to re-run.

57. **57-realtime-notifications.sql** — adds `notifications` to Supabase
    Realtime, for instant message alerts (sound, pop-up, desktop
    notification). Realtime applies the table's RLS. Safe to re-run.

58. **58-message-reactions.sql** — emoji reactions on messages:
    `dm_message_reactions` (Inbox) and `message_reactions` (Messages),
    readable by whoever can read the message, changed only through
    `toggle_dm_reaction()` / `toggle_message_reaction()` with a fixed set
    of six emoji. Safe to re-run.

59. **59-group-chats.sql** — Inbox group chats: `chat_groups`,
    `chat_group_members`, `chat_group_messages`, `chat_group_reactions`,
    readable only by members, changed only through `create_chat_group()`,
    `send_group_message()`, `add_chat_group_members()`,
    `rename_chat_group()`, `leave_chat_group()`, `mark_chat_group_read()`
    and `toggle_group_reaction()`. Run after 58. Safe to re-run.

60. **60-message-attachments.sql** — photo and file sharing in messages:
    private `message-files` bucket (10 MB; photos, PDF, Office, text/CSV),
    upload only to your own folder, read only if the file is attached to
    a message you can read; `attachment` on the three message tables; the
    three send functions take an optional attachment. Run after 59. Safe
    to re-run.

61. **61-coach-workouts.sql** — the coach's "Workouts to Try" card:
    `coach_workouts` (title, pasted text, parsed variants), private to the
    coach who saved it; only staff can add one. Run after 60. Safe to
    re-run.

62. **62-class-booking.sql** — class booking through the server
    (`book_class` / `cancel_class_booking`, real "X/12 booked" counts via
    `class_session_counts`; members can no longer write `bookings`
    directly), automatic waitlist promotion, recurring classes
    (`ensure_class_sessions` makes sessions 3 weeks ahead from a class's
    "Repeats" text), coach/member booking notifications, and 24-hour
    reminders (every 15 min via pg_cron if available, else on app open).
    Run after 61. Safe to re-run — and re-run it after gym.sql, which
    would restore the old member write policies on `bookings`.

63. **63-reschedule.sql** — drag-and-drop rescheduling in the coach and
    admin calendars: `reschedule_class_session` / `reschedule_pt_slot`
    (staff only) move a class or 1-on-1, keep its bookings, tell everyone
    booked and re-arm their reminder. A moved recurring session becomes a
    one-off. Run after 62. Safe to re-run.

64. **64-switch-booking.sql** — members drag their own booking to a new
    time on the member calendar: `switch_class_booking` (another time of
    the same class, must have room) / `switch_pt_booking` (any open
    slot). The booking moves in one step, a 1-on-1 keeps its credit, the
    freed class spot goes to the waitlist, the coach is told. Run after
    63. Safe to re-run.

65. **65-book-a-trainer.sql** — `coach_profiles` (bio + specialties,
    readable by anyone signed in, edited by the coach or admin/staff);
    `book_pt_slot` takes an optional note ("what do you want to work
    on?"), `set_pt_booking_notes` changes it later, and the coach's
    booking notification includes it. Run after 64. Safe to re-run.

66. **66-pt-waitlist.sql** — a waitlist on booked 1-on-1 slots
    (`pt_waitlist`, `join_pt_waitlist` / `leave_pt_waitlist` /
    `pt_waitlist_counts`). When a slot goes from booked back to open, a
    trigger books the longest-waiting member in (1 credit, their note
    kept) or skips them if they have no credit / an overlapping 1-on-1.
    Run after 65. Safe to re-run.

67. **67-pt-waitlist-reminders.sql** — `send_booking_reminders()` also
    reminds members waiting for a 1-on-1 (once, within 24 hours: their
    place, and a warning if they have no credits), and closes waitlists
    whose slot started without opening, telling those still waiting.
    Run after 66. Safe to re-run.

68. **68-class-waitlist-reminders.sql** — `send_booking_reminders()`
    also reminds members on a class waitlist (once, within 24 hours,
    with their place) and moves leftover waitlist places to 'expired'
    once the class starts, telling them. Run after 67. Safe to re-run.

69. **69-coach-agenda.sql** — a "Tomorrow" summary for each coach, once
    a day from 6 PM gym time: their booked 1-on-1s (with notes), classes
    (fill and waitlist) and open slots, in time order
    (`send_coach_agendas`, called from `send_booking_reminders`;
    `coach_agenda_sent` keeps it to once). Run after 68. Safe to re-run.

70. **70-open-slot-reminders.sql** — `send_open_slot_reminders()`
    (called from `send_booking_reminders`): from noon, members with a
    credit hear about tomorrow's free 1-on-1s with their coach(es);
    coaches are nudged about a slot still open within 3 hours; and on
    Sunday evening a coach with no slots next week is reminded to add
    some. Each once. Run after 69. Safe to re-run.

71. **71-invoice-reminders.sql** — `send_invoice_reminders()` (called
    from `send_booking_reminders`, 9 AM–8 PM): members get a reminder 3
    days before an invoice is due and up to four overdue reminders (day
    1, 8, 15, 22); admin/staff get a Monday summary of what's overdue.
    Each once (`invoice_reminders`, `billing_digest_sent`). Run after
    70. Safe to re-run.

72. **02-rls-audit-diagnostic.sql** — not a setup step, a read-only check.
    For a one-row pass/fail summary (RLS, the staff-column trigger,
    `programs` policies, `period_log`), run **check-security.sql**.
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
