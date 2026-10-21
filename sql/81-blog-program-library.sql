-- ============================================================
-- BLOG POSTS: the program library write-ups (Health & Appearance) —
-- StrongLifts 5x5, Bill Starr's 5x5, Reg Park's 5x5, PHUL, PHAT and
-- Doug Hepburn's Program B, each pointing to its Program Builder preset
-- and Build a Program method and ending with links to the originals.
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/25-blog-doug-hepburn.sql. Mirrors the matching entries in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'StrongLifts 5×5: Three Lifts a Day, A Little More Every Time',
  'stronglifts-5x5',
  'Health & Appearance',
  '2026-10-21',
  'Coach KA',
  0,
  '',
  array['5x5','strength','beginner','program-design'],
  'Two workouts, five lifts, and one rule: if you made every rep, the bar gets heavier next time.',
  '## The program most people meet first

StrongLifts 5×5 is Mehdi Hadim''s take on the old five-sets-of-five idea, and it has introduced more people to the barbell than almost anything else. It strips training down to five lifts and one decision per session: did you make all your reps or not?

### The scheme

There are two workouts, alternated three days a week with a day off between:

- **Workout A:** Squat 5×5, Bench Press 5×5, Barbell Row 5×5
- **Workout B:** Squat 5×5, Overhead Press 5×5, Deadlift 1×5

Week one runs A/B/A, week two B/A/B, and so on. All five sets use the same weight, with about three minutes of rest — five after a set you missed.

### The rule that does the work

Make every rep, and the next session adds **2.5 kg** to that lift (5 kg on the deadlift). Miss a weight three sessions in a row and you take 10% off and build back up. That''s the whole progression.

### Why it works

Squatting three times a week with small, steady jumps is a fast way for a newer lifter to get strong, and the fixed 5×5 removes almost every decision. The trade-off is the same as any linear program: the jumps eventually outrun recovery, and that''s the signal to move on to something with more variety — PHUL, Bill Starr''s heavy/light/medium week, or our own manual.

### Try it yourself

Load **StrongLifts 5×5** from **Coach > Program Builder > Preset Programs**, or pick **5×5 (StrongLifts)** as the Method in **Build a Program** to keep our warm-up, blocks and Signature Hold around it.

---

**Source:** Mehdi Hadim, ["Stronglifts 5×5: The Complete Workout Guide"](https://stronglifts.com/5x5/), StrongLifts. This post summarizes the program in our own words — read the original for the full guide.',
  'published'
)
on conflict (slug) do nothing;

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Bill Starr''s 5×5: The Big Three and the Heavy, Light, Medium Week',
  'bill-starr-5x5',
  'Health & Appearance',
  '2026-10-21',
  'Coach KA',
  0,
  '',
  array['5x5','old-school','strength','program-design'],
  'The strength coach who taught football players to lift built his program on three movements and a week that never asks for maximum effort twice.',
  '## The coach behind the 5×5 most people run

Bill Starr coached strength for football teams and Olympic lifters, and his 1976 book *The Strongest Shall Survive* is where the 5×5 most coaches know today comes from. His version is built around **"The Big Three"**: the power clean, the bench press and the back squat, taken as deep as you can.

### The scheme

- **Monday — heavy:** work up to near your best for five.
- **Wednesday — light:** about 80% of Monday''s weights, with the overhead press in place of the bench.
- **Friday — medium:** about 90% of Monday''s weights.

The three lifts are run as a **circuit** — one set of power cleans, one of bench, one of squats, then round again — five times.

### The detail that separates it from Reg Park''s 5×5

Starr **ramps every set**: each of the five sets is heavier than the one before, so only the last is a true top set. Reg Park did two warm-up sets and then three sets at one weight. Same "5×5" on paper, very different day under the bar.

### Progression and extras

When all five reps come on the fifth set, every set goes up next time — in small jumps, as little as 2.5 lb a week. Leg extensions and leg curls warm the knees up first; sit-ups and leg raises finish the session.

### Try it yourself

Load **Bill Starr''s 5×5 (The Big Three)** from **Preset Programs**, or choose **Bill Starr 5×5** as the Method in **Build a Program** — it ramps the main lifts and rotates your days heavy, light and medium.

---

**Sources:** Chris Colucci, ["The 5x5 Workout Explained: The Classic Program for Size and Strength"](https://breakingmuscle.com/5-x-5-workout-explained/), Breaking Muscle; Greg Merritt, ["5x5 Workout: Your Complete Training Guide"](https://thebarbell.com/5x5-workout/), The Barbell. Starr''s original is his book, *The Strongest Shall Survive* (1976); later versions differ in the details.',
  'published'
)
on conflict (slug) do nothing;

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Reg Park''s 5×5: The Three-Phase Plan Arnold Grew Up On',
  'reg-park-5x5',
  'Health & Appearance',
  '2026-10-21',
  'Coach KA',
  0,
  '',
  array['5x5','old-school','bodybuilding','strength','program-design'],
  'Before Arnold had a training philosophy of his own, he had Reg Park''s — three phases, three months each, and very little that was optional.',
  '## Arnold''s idol, Arnold''s first program

Reg Park won Mr Universe three times and was the man a teenage Arnold Schwarzenegger wanted to become. His 1960 book *Strength and Bulk Training for Weight Lifters and Body Builders* laid out a 5×5 plan in three phases, each run for about three months, three days a week.

### What "5×5" meant to Park

The first two sets are **warm-ups** that climb toward the working weight; the last **three sets of five are at one weight**. When you get all three, add 5–10 lb next time. No training to failure — Park wanted every set clean.

### The three phases

- **Phase 1:** 45° back extensions 3×10, then back squat, bench press and deadlift at 5×5. Rest 3–5 minutes between work sets.
- **Phase 2 (for bodybuilders):** back extensions, front squat, back squat, bench press, standing barbell press, high pulls and deadlift at 5×5, plus standing calf raises 5×25. Rest drops to about two minutes.
- **Phase 3:** the big lifts plus bent-over rows, behind-the-neck presses (or one-arm dumbbell presses), barbell curls, lying triceps extensions and calf raises.

At the end of a phase, Park tested his singles, took four days off and moved on. After Phase 3, back to Phase 1 — heavier.

### Try it yourself

All three phases are in **Preset Programs** as **Reg Park''s 5×5 — Phase 1, 2 and 3**. In **Build a Program**, the **Reg Park 5×5** Method gives your main lifts his two-warm-up, three-work-set structure.

---

**Sources:** Chris Colucci, ["The 5x5 Workout Explained: The Classic Program for Size and Strength"](https://breakingmuscle.com/5-x-5-workout-explained/), Breaking Muscle, and a reader''s transcription of Park''s phases on the [Ronnie.cz forum](https://forum.ronnie.cz/post1159958.html). Park''s original is his book (1960); secondary sources differ on some Phase 3 set counts.',
  'published'
)
on conflict (slug) do nothing;

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'PHUL: Strong on Monday, Big by Friday',
  'phul-power-hypertrophy-upper-lower',
  'Health & Appearance',
  '2026-10-21',
  'Coach KA',
  0,
  '',
  array['upper-lower','powerbuilding','hypertrophy','program-design'],
  'Brandon Campbell''s four-day split hits every muscle twice a week — once heavy, once for size — and fits around a working life.',
  '## Two goals, one week

PHUL — **Power Hypertrophy Upper Lower** — is Brandon Campbell''s answer to the lifter who wants to get stronger and bigger without living in the gym. Four sessions a week, every muscle trained twice: once with heavy, low-rep compounds, once with lighter, higher-rep work.

### The week

- **Monday — Upper Power:** bench press and bent-over rows at 3–5 reps, then incline dumbbell press, pulldowns, overhead press and arms at 5–10.
- **Tuesday — Lower Power:** squats and deadlifts at 3–5, then leg press, leg curls and calves.
- **Wednesday:** off.
- **Thursday — Upper Hypertrophy:** incline bench, flyes, cable and dumbbell rows, lateral raises and arms, all at 8–12.
- **Friday — Lower Hypertrophy:** front squats, lunges, leg extensions and curls, and two calf movements at 8–15.

### The rules that make it work

Leave at least a rep in the tank on every set, rest properly on the heavy compounds (three to five minutes is normal), and don''t stack both power days or both hypertrophy days back to back. Run it in blocks of about four weeks and push the power numbers up a little each block.

### Try it yourself

Load **PHUL — Power Hypertrophy Upper Lower** from **Preset Programs**, or pick **4 — PHUL** under Days a week in **Build a Program** to get the same power/hypertrophy week built in our warm-up-and-blocks format, fitted to your equipment.

---

**Source:** Brandon Campbell, ["Power Hypertrophy Upper Lower (P.H.U.L.) Workout"](https://www.muscleandstrength.com/workouts/phul-workout), Muscle & Strength. This post summarizes the program in our own words — read the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'PHAT: Layne Norton''s Power and Pump in One Week',
  'phat-layne-norton',
  'Health & Appearance',
  '2026-10-21',
  'Coach KA',
  0,
  '',
  array['powerbuilding','hypertrophy','strength','program-design'],
  'Two heavy days, three size days, and a speed-work opener most programs forget: how a natural pro bodybuilder and powerlifter trained both qualities at once.',
  '## Built by someone who competed at both

Dr Layne Norton competed as a natural pro bodybuilder and a powerlifter, and **PHAT — Power Hypertrophy Adaptive Training** — is how he trained for both at once. It''s a five-day week for lifters with a few years behind them.

### The week

- **Day 1 — Upper Body Power:** rows and dumbbell presses at 3–5 reps, then pull-ups, chins, dips, shoulder presses and arms at 6–10.
- **Day 2 — Lower Body Power:** squats at 3–5, then hack squats, extensions, stiff-legged deadlifts, hamstrings and calves.
- **Day 3:** rest.
- **Day 4 — Back & Shoulders Hypertrophy**, **Day 5 — Lower Body Hypertrophy**, **Day 6 — Chest & Arms Hypertrophy:** 8–20 reps, 1–2 minutes'' rest.
- **Day 7:** rest.

### The speed-work opener

Each hypertrophy day starts with **6 sets of 3** on that day''s power lift at **65–70% of your 3–5 rep max**, moved as fast as you can with no more than 90 seconds'' rest. If the bar slows, it''s too heavy. It keeps the power days'' skill sharp without adding fatigue.

### Norton''s guard rails

Rest as long as you need on the power days — five or six minutes is fine. Stop a rep or two short of failure on the size days, only go to failure on the last set or two, and not at all for the first few weeks. Rotate the power movements every two to three weeks and deload every 6–12 weeks. Newer lifters: drop one assistance exercise per day until you adapt.

### Try it yourself

Load **PHAT** from **Preset Programs**, or pick **5 — PHAT** under Days a week in **Build a Program** — the speed work opens each hypertrophy day automatically, on the same lift as the power day.

---

**Source:** Layne Norton, ["PHAT: Power Hypertrophy Adaptive Training"](https://biolayne.com/articles/training/phat-power-hypertrophy-adaptive-training/), biolayne.com. This post summarizes the program in our own words — read the original for Norton''s full explanation.',
  'published'
)
on conflict (slug) do nothing;

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Doug Hepburn''s Program B: Singles for Power, Fives for Size',
  'doug-hepburn-program-b',
  'Health & Appearance',
  '2026-10-21',
  'Coach KA',
  0,
  '',
  array['old-school','strength','powerlifting','program-design'],
  'Program A built Hepburn''s strength with 2s and 3s. Program B goes heavier still — singles first, then the fives that put the size on.',
  '## The other half of Hepburn''s method

Our post on Doug Hepburn''s Program A covered the famous 2s-and-3s ladder. Hepburn also trained with a second, heavier scheme — usually called **Program B** — that pairs a power part with a pump part on each lift.

### The scheme, lift by lift

- **Power:** singles with a weight you could lift **three times**. Start with 5 singles; add one single each workout until you reach 8; then add 5–10 lb and go back to 5.
- **Pump:** straight after, **6 sets of 3** with a weight you could lift **eight times**. Add a rep to one set each workout until it reads 6 × 5; then add weight and start again at 3s.

Squat and bench on Monday and Thursday, deadlift and overhead press on Tuesday and Friday is a common way to set out the week.

### What Hepburn himself said

Asked about his bench routine, Hepburn described it as roughly **singles, then fives** — and said he rarely ran exactly the same scheme twice. The singles get the body used to a single maximal effort; the fives add the volume that builds muscle.

### A word of caution

This is demanding. Most write-ups suggest running it for about six weeks and then switching to something lighter. Hepburn never published a definitive "Program B" himself, so the numbers vary a little between sources.

### Try it yourself

Load **Doug Hepburn''s Program B** from **Preset Programs**, or pick **Hepburn Program B on each A1** as the Method in **Build a Program** to run it on each day''s main lift inside our format.

---

**Sources:** Dresdin Archibald, ["The Doug Hepburn Bench Press Success Formula"](https://breakingmuscle.com/the-doug-hepburn-bench-press-success-formula/), Breaking Muscle, and a [StrongFirst forum summary](https://www.strongfirst.com/community/goto/post?id=260685) of Mike Mahler''s T-Nation article on Hepburn''s method.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, status from public.blog_posts where slug in
--   ('stronglifts-5x5','bill-starr-5x5','reg-park-5x5',
--    'phul-power-hypertrophy-upper-lower','phat-layne-norton','doug-hepburn-program-b');
-- six rows, all published.
-- ============================================================
