(function(){

  const STORE_KEY = 'bnb-blog-posts-v1';

  const SEED_POSTS = [
    {
      id: 'p1', title: "Why Progressive Overload Still Wins",
      slug: 'why-progressive-overload-still-wins', category: 'Health & Appearance',
      date: '2026-08-10', author: 'Coach KA', views: 412,
      cover: '', tags: ['hypertrophy','progression','basics'],
      excerpt: "No app, gadget or trend replaces the simplest rule in the book: do a little more over time.",
      body: "## The one rule that never expires\n\nEvery program in the Bell(e)s n' Barz system is built around one non-negotiable: **progressive overload**. Whether that's more weight, more reps, better form, or less rest — the body only changes when it's asked to do something it hasn't fully adapted to yet.\n\n### What this looks like week to week\n\n- Add reps within the prescribed range before adding load\n- Once you hit the top of the rep range for all sets, add weight and drop back to the bottom of the range\n- Track everything — the [logsheet](#) exists so you're not guessing\n\nDeloads aren't a break from this rule, they're part of it — a planned dip that lets the next block of overload actually land.",
      status: 'published'
    },
    {
      id: 'p2', title: "Reading Your Own RIR Honestly",
      slug: 'reading-your-own-rir-honestly', category: 'Personal Development',
      date: '2026-08-18', author: 'Coach KA', views: 268,
      cover: '', tags: ['RIR','autoregulation'],
      excerpt: "Reps in reserve only works as a tool if you're not lying to yourself about the number.",
      body: "Most people round down when they're tired and round up when they're motivated. Both wrong.\n\n**A quick gut check:** if someone offered you $1000 for one more clean rep, could you get it? If yes, you weren't at RIR 0.",
      status: 'draft'
    },
    {
      id: 'p3', title: "The Deload Week Nobody Wants to Take",
      slug: 'the-deload-week-nobody-wants-to-take', category: 'Health & Appearance',
      date: '2026-07-22', author: 'Coach KA', views: 587,
      cover: '', tags: ['deload','recovery'],
      excerpt: "Skipping deloads doesn't make you tougher — it makes the next block shorter.",
      body: "Fatigue is cumulative long before it's visible on the bar. A planned deload every 4-6 weeks isn't lost progress, it's the mechanism that lets progress keep happening.",
      status: 'published'
    },
    {
      id: 'p4', title: "Double Progression, Explained Simply",
      slug: 'double-progression-explained-simply', category: 'Health & Appearance',
      date: '2026-07-05', author: 'Coach KA', views: 731,
      cover: '', tags: ['progression','reps'],
      excerpt: "One rule that removes almost all the guesswork from adding weight to the bar.",
      body: "Hit the top of your rep range on every set? Add weight next session and drop back to the bottom of the range. That's it — that's double progression.",
      status: 'published'
    },
    {
      id: 'p5', title: "Why Your Sleep Matters More Than Your Supplements",
      slug: 'why-your-sleep-matters-more-than-your-supplements', category: 'Health & Appearance',
      date: '2026-06-28', author: 'Coach KA', views: 449,
      cover: '', tags: ['sleep','recovery'],
      excerpt: "No stack on the market compensates for five hours of sleep, night after night.",
      body: "Recovery isn't a supplement stack — it's mostly sleep, food, and stress management, in roughly that order of leverage.",
      status: 'published'
    },
    {
      id: 'p6', title: "Building the Six-Day Split: What Changed and Why",
      slug: 'building-the-six-day-split', category: 'Community & Charity',
      date: '2026-06-14', author: 'Coach KA', views: 203,
      cover: '', tags: ['program-design','split'],
      excerpt: "A look inside the SWOT-style audit that reshaped the weekly training split.",
      body: "Every restructure starts with an audit: where's the volume stacking up, where's it thin, and what's the anterior-delt seam that keeps showing up on paper.",
      status: 'published'
    },
    {
      id: 'p7', title: "Rest Intervals: Why 90 Seconds Isn't a Universal Law",
      slug: 'rest-intervals-arent-universal', category: 'Health & Appearance',
      date: '2026-06-02', author: 'Coach KA', views: 156,
      cover: '', tags: ['rest','intensity'],
      excerpt: "Compound lifts and isolation work don't need the same clock.",
      body: "Heavier compounds recruiting more muscle mass generally need longer rest to keep quality high across sets; isolation work can often run tighter.",
      status: 'published'
    },
    {
      id: 'p8', title: "Tempo Training: When It Helps and When It's Just Noise",
      slug: 'tempo-training-when-it-helps', category: 'Health & Appearance',
      date: '2026-05-19', author: 'Coach KA', views: 98,
      cover: '', tags: ['tempo','technique'],
      excerpt: "Slowing the eccentric isn't magic — but it fixes specific, common problems.",
      body: "Tempo is a tool for a problem, not a default setting. Use it when bar speed is masking poor control, not on every set of every lift.",
      status: 'published'
    },
    {
      id: 'p9', title: "Kenyan MMFs, SACCOs and T-Bills: A Quick Primer",
      slug: 'kenyan-mmfs-saccos-tbills-primer', category: 'Wealth & Finance',
      date: '2026-05-03', author: 'Coach KA', views: 812,
      cover: '', tags: ['finance','kenya'],
      excerpt: "Liquidity, income, and long-term growth — three buckets, three vehicles.",
      body: "Money Market Funds cover liquidity, SACCOs and T-Bills via DhowCSD cover income, and long-term growth needs its own separate bucket entirely.",
      status: 'published'
    },
    {
      id: 'p10', title: "Copenhagen Planks and the Adductor Gap",
      slug: 'copenhagen-planks-adductor-gap', category: 'Health & Appearance',
      date: '2026-04-20', author: 'Coach KA', views: 341,
      cover: '', tags: ['adductors','core'],
      excerpt: "The one anti-lateral-flexion drill most leg days quietly skip.",
      body: "Adductors get hit incidentally by squats and rarely get trained directly — which is exactly why they show up as the weak link during change-of-direction work.",
      status: 'published'
    },
    {
      id: 'p11', title: "The Bring Sally Up Challenge: What It Actually Trains",
      slug: 'bring-sally-up-challenge', category: 'Health & Appearance',
      date: '2026-09-20', author: 'Coach KA', views: 0,
      cover: '', tags: ['challenge','push-ups','core','conditioning'],
      excerpt: "A 3:32 song turned into a push-up gauntlet — the real difficulty isn't the rep count, it's the hold.",
      body: "## The workout hiding inside a song\n\nThe Bring Sally Up challenge isn't a program, it's a single track (Moby's \"Flower\") turned into a push-up gauntlet. The premise is almost insultingly simple: on the \"up\" cue, you push up. On the \"down\" cue, you lower until your chest is hovering an inch off the floor, and you hold there, dead still, until the next \"up.\" Repeat until the song ends.\n\n### Why it's harder than it sounds\n\nTotal rep count over the full track lands around 30 — nothing to write home about on its own. The actual demand is time under tension: every \"down\" is an isometric hold in the bottom position, not a rest. By the second half of the song, the chest, triceps, and front delts are fighting to stay stable in a dead hang above the floor, over and over, with no real recovery window.\n\n### What it trains\n\n- **Pressing strength-endurance** — not max strength, but the ability to keep producing force under fatigue\n- **Core bracing** — a sagging hip line in that hover position turns the challenge into a bad plank\n- **Pacing discipline** — the track sets the tempo, not you, so sandbagging the holds isn't an option\n\n### A caution worth saying out loud\n\nThis isn't a beginner drill. If a strict push-up plank can't be held for 60+ seconds, or 15+ strict push-ups can't be done unbroken, the hold-heavy structure here will break form long before the song ends — and bad form under fatigue is exactly how shoulders get hurt. Build the base first.\n\n### Try it in the app\n\nThere's a Bring Sally Up pacer under **Challenges** in the Members area — it calls \"Up\" and \"Down\" on a comparable cadence so the same up/down/hold structure can be run with any music playing, no need to track the original song down. Push-ups are the classic version, but the same up/down pattern works for squats or pull-ups too.",
      status: 'published'
    },
    {
      id: 'p12', title: "The Old School 70's Bodybuilding Split: How the Golden Era Trained",
      slug: 'old-school-70s-bodybuilding-split', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','program-design','volume'],
      excerpt: "High volume, a three-day body-part rotation, and a diet built on raw eggs and steak — how Arnold's generation actually trained.",
      body: "## Why the \"golden era\" look still gets referenced\n\nAsk anyone to picture a \"classic\" bodybuilder physique and they're picturing the 1970s: wide shoulders and lats tapering to a small waist, visible abs at a bodyfat level that still looked athletic rather than stage-lean year-round. That look — the V-taper — came from a specific training approach, not a supplement stack.\n\n### The split\n\nThree body-part groups, each hit twice a week, one full rest day:\n\n- **Monday & Thursday** — Chest & Back\n- **Tuesday & Friday** — Shoulders & Arms\n- **Wednesday & Saturday** — Legs\n- **Sunday** — Rest\n\nAbs, calves, forearms, and neck were trained separately, 4–6 times a week, as needed rather than on a fixed schedule.\n\n### How each session actually ran\n\nFive sets per exercise was the default, with reps generally in the 8–12 range (legs ran looser, 5–20). The first exercise of the day — usually the heaviest compound lift — was pyramided: start light, add weight every set, and finish the last set as heavy as possible for as few as 1–2 reps. That first lift was meant to \"activate\" the rest of the session.\n\nArnold Schwarzenegger's signature variation was supersetting opposing muscle groups — a set of Bench Press immediately followed by a set of Chinups, no rest between, repeated for all 5 sets. Rest periods generally stayed short: about a minute between sets or supersets.\n\nOnce a week, one exercise (Bench Press, Squat, or Deadlift) was taken to a genuine one-rep max as a strength check — not a weekly habit for every lift, just a periodic test.\n\n### Diet: built on volume, not precision\n\nThe golden-era approach to eating matched the training: a lot of protein and saturated fat, with carbohydrate intake cycled up during bulking phases and down while cutting. Steak, chicken, tuna, and — notably — raw eggs were staple protein sources; homemade shakes were often just raw eggs, milk powder, and whatever else was on hand.\n\n**Worth flagging**: raw eggs carry a real salmonella risk that wasn't well understood or taken seriously in the 1970s. If replicating this diet, pasteurized eggs are the safer substitute for anything eaten raw.\n\n### Try it yourself\n\nThis split is now a loadable preset in **Coach > Program Builder** — select a client, choose \"Old School 70's Split\" under Preset Programs, and it populates their full week in one click.\n\n---\n\n**Source:** Gustavo Mirabal Castro, [\"The Old School 70's Bodybuilding Routine\"](https://gustavomirabal.ch/health/the-old-school-70s-bodybuilding-routine-gustavo-mirabal/), published January 10, 2020, gustavomirabal.ch. This post summarizes and adapts that article's training and diet notes — see the original for the author's full commentary.",
      status: 'published'
    },
    {
      id: 'p13', title: "Old School Intensity Techniques: Forced Reps, Drop Sets & Rest-Pause",
      slug: 'old-school-intensity-techniques', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','intensity-techniques','program-design'],
      excerpt: "The golden-era split gets the attention, but it was the techniques layered on top — forced reps, drop sets, rest-pause — that made the volume actually work.",
      body: "## The split is only half the story\n\nA second look at the classic golden-era routine — same three body-part groups, just resequenced to Chest & Back, then Legs, then Shoulders & Arms, each twice a week with Sunday off. The structure alone isn't what made it brutal, though. What made it brutal was a small toolkit of intensity techniques stacked on top of straight sets, used deliberately to push past normal failure rather than around it.\n\n### The toolkit\n\n- **Forced reps** — once a set stalls, a spotter helps move just enough of the bar to grind out a few more reps beyond a normal stopping point.\n- **Drop sets** — hit failure, immediately drop to a lighter weight and keep going, then drop again; two or three drops is usually enough to finish a muscle off.\n- **Rest-pause** — stop just short of failure, take a few seconds to breathe, then squeeze out another short burst; repeat a few times inside what looks like one long \"set.\"\n- **Negatives** — control the lowering phase as slowly as possible, sometimes with a spotter lifting the concentric so only the eccentric is trained; brutal on the muscle, easy to overuse.\n- **Max contractions** — hold the peak-squeeze position of the last rep for several seconds instead of releasing straight away.\n- **Supersets, tri-sets, and mega-sets** — two, three, or more exercises run back-to-back with no rest, the same superset logic the companion split article covers, just extended further.\n\n### How they actually got used\n\nThese weren't all stacked onto every set of every exercise — that's a fast route to burnout and injury. The pattern was closer to: run straight sets for most of the work, then reach for one technique on the last set or two of a movement, once the muscle was already close to done. A single drop set or rest-pause finisher at the end of a lift did more than adding another full set from fresh.\n\n### Worth saying plainly\n\nThese techniques assume a base of straightforward training is already in place — a lifter who can't yet complete a normal working set with good form has no business chasing forced reps or negatives, which load a fatigued or compromised joint harder than anything else on this list. It's also worth being honest that a lot of the era's top competitors trained on performance-enhancing drugs, which meaningfully changed how much of this volume and intensity a body could actually recover from. Treat the split and the intensity techniques as separate decisions — a natural lifter can use either without the other, and doesn't need to match a golden-era pro's total workload to see the split work.\n\n### Try it yourself\n\nThe resequenced split (Chest/Back → Legs → Shoulders/Arms) is a second loadable preset in **Coach > Program Builder** — look for \"Old School 70's Routine (Iron & Grit)\" under Preset Programs.\n\n---\n\n**Source:** Jordan, [\"The Old School 70's Bodybuilding Routine\"](https://ironandgrit.com/2016/08/13/old-school-bodybuilding-workout-routine/), Iron & Grit. This post summarizes and adapts that article's intensity-technique and training notes — see the original for the author's full commentary.",
      status: 'published'
    },
    {
      id: 'p14', title: "Serge Nubret's Pump: Golden-Era Training Without the Pyramid",
      slug: 'serge-nubret-pump-training', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','high-volume','program-design'],
      excerpt: "Arnold pyramided up to a heavy single. Serge Nubret did the opposite — light-ish weight, 12 reps a set, 6 to 8 sets an exercise, and almost no rest.",
      body: "## The other golden-era approach\n\nMost \"old school 70's\" write-ups describe one training philosophy: pyramid the weight up each set, chase a heavy single once a week, keep sets in the 5-12 range. Serge Nubret — a Mr. Universe and a fixture of that same era — trained almost the opposite way, and it's worth understanding as its own approach rather than a variation on the first.\n\n### The split\n\nStill a three-way body-part rotation, twice through the week, Sunday off — but grouped differently:\n\n- **Monday & Thursday** — Chest & Quads\n- **Tuesday & Friday** — Back & Hamstrings\n- **Wednesday & Saturday** — Shoulders, Arms & Calves\n- **Sunday** — full rest (\"stay home in bed and recover\" is how the source article put it, not a euphemism)\n\n### The actual difference: pump over peak\n\nWhere the pyramid approach builds to one very heavy set, Nubret's routine stayed at one working weight for every set of an exercise — enough to get 12 reps, no more, no less — for 6 to 8 sets in a row. Rest periods were kept short, aiming for 30 seconds and capping at a minute. There was no weekly 1-rep-max test built into the week at all.\n\nThe goal wasn't peak force output, it was time spent with blood forced into the muscle — what's usually called \"the pump.\" More total sets at a moderate load, less rest between them, no attempt to max out. It's a legitimate way to build muscle that trades absolute strength focus for sheer volume and metabolic stress.\n\n### What this means if you're choosing between presets\n\nThis is not a drop-in replacement for the pyramid-style Old School presets — it's a different stimulus. Sets nearly double (6-8 vs. 5) while rest is cut in half, so total session time and cardiovascular demand both go up noticeably. It suits a lifter who tolerates volume well and wants a step toward bodybuilding-style conditioning rather than a step toward raw strength.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"Serge Nubret's High-Volume Routine\" under Preset Programs.\n\n---\n\n**Source:** [\"Serge Nubret's Old School Workout Routine\"](https://www.castironstrength.com/serge-nubrets-old-school-workout-routine/), Cast Iron Strength. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p15', title: "Lee Haney's 3-On-1-Off Split: How an 8-Time Mr. Olympia Trained",
      slug: 'lee-haney-3-on-1-off-split', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','program-design','mr-olympia'],
      excerpt: "Lee Haney won eight straight Mr. Olympia titles on a split that doesn't care what day of the week it is.",
      body: "## A split that ignores the calendar\n\nLee Haney holds a share of the record for the most Mr. Olympia wins (eight, 1984-1991, since matched by Ronnie Coleman). His training approach differs from the other Old School presets in this app in one structural way that's easy to miss: it isn't locked to specific weekdays at all.\n\n### The actual pattern\n\nThree training days, then one rest day, repeating continuously:\n\n1. **Chest & Arms**\n2. **Legs**\n3. **Back & Shoulders**\n4. **Rest**\n\n...then back to Chest & Arms, regardless of what day of the week that lands on. Calves and abs were trained on every training day. Because 4 doesn't divide evenly into a 7-day week, the actual rest day drifts by one weekday every cycle if you run it exactly as written — Thursday rest one week, then whatever weekday the cycle lands on next.\n\n### Why the preset in this app looks different\n\nProgram Builder assigns exercises per calendar weekday, so the loadable preset fits one full pass of the cycle into Monday through Sunday (Mon/Fri Chest & Arms, Tue/Sat Legs, Wed/Sun Back & Shoulders, Thursday rest) rather than truly drifting. That's a reasonable way to run it, but it's not identical to the original protocol — if you want the exact drifting rest day, track \"day number in the cycle\" instead of day of the week.\n\n### The training itself\n\nRep ranges run moderate compared to the other Old School presets here — mostly 6-10 reps on compound lifts, 12-15 on accessory and calf work, 4 to 5 sets per exercise rather than 5-8. A few exercises (leg press, stiff leg deadlift) were only used one workout in every three, rotated in rather than run every single leg day.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"Lee Haney's 3-On-1-Off Split\" under Preset Programs.\n\n---\n\n**Source:** [\"Old School Workout: Lee Haney\"](https://generationiron.com/old-school-workout-lee-haney/), Generation Iron. This post summarizes and adapts that article's training notes — see the original for the full write-up and a second workout variation to alternate in.",
      status: 'published'
    },
    {
      id: 'p16', title: "Bill Kazmaier's Power-Building Split: Strength Training From a Strongman",
      slug: 'bill-kazmaier-power-building-split', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','strength','powerbuilding','program-design'],
      excerpt: "A three-time World's Strongest Man winner didn't train like a bodybuilder or a pure powerlifter — he split the difference, on purpose.",
      body: "## Not quite a bodybuilder, not quite a powerlifter\n\nBill Kazmaier won World's Strongest Man three times and held plenty of lifting titles along the way, but his training didn't look like either a typical bodybuilding split or a typical powerlifting peaking cycle. It landed in between — often called \"power-building\" today.\n\n### The heavy/light structure\n\nKazmaier trained four days a week (Monday, Tuesday, Thursday, Saturday), and the trick was alternating which lift got the heavy treatment on which day:\n\n- **Monday** — Chest heavy, then shoulders and triceps\n- **Tuesday** — Squats heavy, deadlifts light, then back and biceps\n- **Thursday** — Chest light, shoulders heavy, triceps\n- **Saturday** — Deadlifts heavy, squats light, then back and arms\n\nEach major lift got trained twice a week, but never hard twice in the same week — one heavy session, one light session focused on form and a slower rep speed. That's a meaningfully different recovery strategy than either straight bodybuilding (same intensity every session) or straight powerlifting (long, slow builds toward a single peak).\n\n### Mostly moderate reps, not singles\n\nDespite the strongman background, most of the actual work here sits in the 8-10 rep range rather than 1-3 rep max attempts — accessory volume for shoulders, arms, and legs on top of the heavy/light compound work. Kazmaier ran this on a roughly 10-week cycle building toward a competition, gradually working back up toward (and slightly past) his previous best in the final weeks.\n\n### Try it yourself\n\nThis split is a loadable preset in **Coach > Program Builder** — look for \"Bill Kazmaier's Power-Building Split\" under Preset Programs.\n\n---\n\n**Source:** Evette Hinzman, [\"Classic Strength Training with Bill Kazmaier\"](https://www.getholistichealth.com/13332/classic-strength-training-with-bill-kazmaier/), Get Holistic Health. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p17', title: "Doug Hepburn's Program A: The Simplest Progression That Works",
      slug: 'doug-hepburn-program-a', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','strength','powerlifting','program-design'],
      excerpt: "A Canadian strongman who could squat 600 for reps at 54 built his strength on a scheme simple enough to run on a sticky note.",
      body: "## Strong enough to not need anything fancy\n\nDoug Hepburn was a Canadian strongman who won weightlifting gold at the 1953 World Championships, the first natural lifter to bench press 500 pounds, and could still squat 600 for reps at age 54. His signature method — known as Program A — is about as unfussy as strength training gets, and that's the point.\n\n### The scheme\n\nSquat, bench press, and deadlift are each trained twice a week. Every session for a given lift is 8 sets, and the whole program is really just one progression rule applied over and over:\n\n- **Workout 1:** all 8 sets at 2 reps (roughly 80% of your 1-rep max)\n- **Each workout after that:** one more of the remaining 2-rep sets becomes a 3-rep set\n- **Once all 8 sets read 3 reps** (around workout 8): add 10 lb to the bar and start over at 2 reps\n\nWritten out, the cycle looks like: 2,2,2,2,2,2,2,2 → 2,2,2,2,2,2,2,3 → 2,2,2,2,2,2,3,3 → ... → 3,3,3,3,3,3,3,3, one workout at a time. No max-effort testing, no RPE guesswork, no deload weeks to plan — just a fixed, predictable climb.\n\n### Why it works\n\nAdding 10 lb a month sounds slow, but compounded over a year that's 120 lb added to each major lift — a genuinely large jump, especially for someone earlier in their training. Because the intensity increase is so gradual, it's also a program that's easy to stick with for a long stretch without the burnout that comes from constantly chasing new max attempts.\n\n### Try it yourself\n\nThis progression is a loadable preset in **Coach > Program Builder** — look for \"Doug Hepburn's Program A\" under Preset Programs. The preset's rep field spells out the exact progression rule so it's visible right in the program.\n\n---\n\n**Source:** [\"Extreme Powerbuilding: The Hepburn Method\"](https://www.muscleandstrength.com/articles/extreme-powerbuilding-doug-hepburn.html), Muscle & Strength. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p18', title: "Vince Gironda's 8×8: The \"Honest Workout\"",
      slug: 'vince-gironda-8x8-workout', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','high-volume','program-design'],
      excerpt: "Vince Gironda's favorite \"shock routine\" for advanced bodybuilders: 8 sets of 8 reps, barely any rest, and a strict no-talking rule.",
      body: "## The trainer who came before German Volume Training\n\nVince Gironda trained bodybuilders out of his Hollywood gym for decades and was pushing high-volume training concepts long before \"German Volume Training\" (10 sets of 10) became a household name. His own favorite version was 8 sets of 8 reps — what he called the \"honest workout.\"\n\n### How it actually runs\n\n8 sets of 8 reps per exercise, 2 to 4 exercises per muscle group, only 15 to 30 seconds of rest between sets. Gironda was strict about the tempo rules: no putting the weight down between sets, no re-racking, no conversation, no leaving the bench or machine until all 8 sets of an exercise are done. \"This program requires 100% total concentration.\"\n\nBecause the rest periods are so short, the weight used has to drop substantially — often around 40% less than a normal 8-rep working weight. The overload here doesn't come from adding weight to the bar; it comes from doing more total work in less time. Whole sessions are meant to fit inside 45 to 60 minutes, working two to three muscle groups.\n\n### Not for beginners, not for every week\n\nGironda was explicit that this isn't a program to run constantly. It's a \"shock routine\" for an advanced bodybuilder (he suggested at least two years of training experience) to break a plateau or bring up a lagging body part — used for a few weeks at a time, then set aside in favor of more conventional training.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"Vince Gironda's 8 X 8\" under Preset Programs. It's a genuinely demanding session; make sure a client has real training experience before assigning it.\n\n---\n\n**Source:** [\"Vince Gironda's 8 X 8 Workout\"](https://oldschooltrainer.com/vince-girondas-8-x-8-workout/), Old School Trainer. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p19', title: "German Volume Training: The Ten Sets Method",
      slug: 'german-volume-training-ten-sets', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','high-volume','program-design'],
      excerpt: "Ten sets of ten reps, same weight, same exercise, minimal rest. It sounds too simple to work — that's exactly why it does.",
      body: "## A method that predates its own name\n\nWhat's called \"German Volume Training\" today traces back to 1970s Germany, where it was used in the weightlifting off-season to help lifters gain lean mass quickly — efficient enough that lifters routinely moved up a full weight class in about 12 weeks. Strength coach Charles Poliquin popularized the name in the English-speaking world; a very similar method was independently promoted in the US by Vince Gironda.\n\n### The rule\n\nOne exercise per body part. Ten straight sets of ten reps, with the same weight for every set — a weight you could otherwise lift for about 20 reps to failure (roughly 60% of your 1-rep max). Rest 60-90 seconds between straight sets, 90-120 seconds if performed as a superset. Once you can complete all 10 sets of 10 with your rest intervals intact, add 4-5% to the weight and repeat.\n\nThe program deliberately avoids forced reps, negatives, or burns — the sheer volume of repeated effort against the same weight is what drives the hypertrophy, and it's usually more than enough on its own. Gains of 10+ pounds in six weeks aren't unusual, even in experienced lifters, though the soreness that comes with it is legendary — a hard quad-and-hamstring day can leave you limping for the better part of a week.\n\n### A 5-day, not-quite-weekly cycle\n\nThe standard beginner/intermediate split is Chest & Back, Legs & Abs, Off, Arms & Shoulders, Off — a 5-day cycle repeated every 5 days rather than tied to Monday-Sunday. Fit into a calendar week it comfortably leaves two full rest days on top of the built-in off days.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"German Volume Training (10×10)\" under Preset Programs.\n\n---\n\n**Source:** Charles Poliquin, [\"German Volume Training!\"](http://www.bodybuilding.com/fun/luis13.htm), Bodybuilding.com. This post summarizes and adapts that article's training notes — see the original for the full write-up, including the follow-up 10×6 phase.",
      status: 'published'
    },
    {
      id: 'p20', title: "The Steve Reeves Classic Physique Routine: Training Before the Split Era",
      slug: 'steve-reeves-classic-physique-routine', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','full-body','program-design'],
      excerpt: "Before body-part splits, the bodybuilders with arguably the best physiques of all time trained the whole body, three times a week, for hours at a stretch.",
      body: "## The physique that started it all\n\nSteve Reeves — a Mr. Universe winner and 1950s movie star — is still held up by many as the most naturally well-proportioned physique bodybuilding has ever produced. Reeves himself was an outspoken critic of the split-training, steroid-fueled direction the sport later took, and continued advocating full-body training for his entire life.\n\n### One workout, thirteen exercises\n\nUnlike the body-part splits in the other Old School presets, this is genuinely full-body: chest, back, shoulders, arms, and legs all get hit in a single session — first published in the May 1951 issue of Your Physique magazine. It runs three non-consecutive days a week (Reeves suggested Monday morning, Wednesday evening, Saturday morning), with the same 13-exercise session repeated each time.\n\nEvery set is taken to genuine failure, with a slow, controlled tempo (roughly 2 seconds up, 3 seconds down) and 45-60 seconds rest between sets, 2 full minutes between exercises. The whole session takes hours — Reeves reportedly spent 2 to 4 hours per workout, working with total focus and no socializing until he was done.\n\n### Why full-body, three days a week\n\nWith only three sessions and every major muscle group hit each time, this gives roughly 48-72 hours of recovery before the same muscle is trained again — plenty, even with genuinely hard, to-failure sets. It's a very different recovery model than a 4-6 day split where a muscle group might only get trained once a week but the whole body never gets a true day fully off.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"Steve Reeves' Classic Physique Routine\" under Preset Programs.\n\n---\n\n**Source:** [\"The Steve Reeves 'Classic Physique' Routine\"](https://gymtalk.com/steve-reeves-classic-physique-routine/), GymTalk. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p21', title: "Frank Zane's Torso/Legs/Arms Split: Quality Over Quantity",
      slug: 'frank-zane-torso-legs-arms-split', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','program-design','aesthetics'],
      excerpt: "Three-time Mr. Olympia Frank Zane built one of bodybuilding's most admired physiques on just two working sets per exercise.",
      body: "## Less volume than you'd expect\n\nFrank Zane won Mr. Olympia three years running (1977-79) at a bodyweight around 185-190 pounds, competing against much heavier rivals, and is still frequently cited as having one of the most aesthetically proportioned physiques the sport has produced. His signature \"Zane Experience\" routine looks almost minimalist compared to the other Old School presets here: just two working sets per exercise.\n\n### The split\n\nThree training days, each covering a distinct region:\n\n- **Torso day** — back, shoulders, and chest (the hardest session, done right after a rest day)\n- **Legs day** — thighs and calves (a bit easier)\n- **Arms day** — triceps, biceps, and forearms (the easiest, since these are small muscle groups)\n\nAbs are trained at the end of every session. Zane deliberately ordered the split hardest-to-easiest across the week, calling it \"a great psychological advantage to have your split routine get easier as you go through it.\"\n\n### Two sets, real effort\n\nEach exercise gets exactly two working sets: the first around 12 reps, then a heavier weight for a second set around 10 reps. Instead of timed rest between sets, Zane used a brief targeted stretch of the muscle just worked (roughly 15 seconds) before moving on. It's a much lower total set count than German Volume Training or Gironda's 8×8 — Zane's approach leans on precise exercise selection and full mental focus on each rep rather than sheer volume.\n\n### A cycle that changes with the season\n\nZane didn't run the same frequency year-round — he described maintenance-season cycles (once every 6-7 days), a faster \"growth\" cycle for spring/summer (train 3 days, rest 1, repeating), and everything in between. This preset uses his own recommended maintenance cycle (Monday/Wednesday/Friday, each body part once every 7 days) as the simplest, most sustainable starting point.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"Frank Zane's Torso/Legs/Arms Split\" under Preset Programs. A few of Zane's own exercise choices used specialty equipment from his personal home gym; the preset substitutes standard gym-equivalent exercises where needed.\n\n---\n\n**Source:** Frank Zane, *The Zane Body Training Manual* (Zananda Incorporated, ISBN 0-9636167-3-0). This post summarizes and adapts the book's \"Zane Experience Workout Program\" chapter — see the original for Zane's full commentary, nutrition guidance, and posing instruction.",
      status: 'published'
    },
    {
      id: 'p22', title: "Ronnie Coleman's Power-Building Split: Yeah Buddy, Light Weight",
      slug: 'ronnie-coleman-power-building-split', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','powerbuilding','mr-olympia'],
      excerpt: "8-time Mr. Olympia Ronnie Coleman built size by treating a near-max deadlift as a warmup and everything else as a bodybuilder.",
      body: "## Bodybuilder's volume, powerlifter's loading\n\nRonnie Coleman matched Lee Haney's record of eight Mr. Olympia wins (1998-2005), and became just as famous for how he trained as for how he looked — footage of him talking through 800-pound deadlifts like a warmup set is still widely shared. His actual weekly structure, though, is closer to modern \"power-building\" than pure powerlifting: one very heavy, low-rep compound lift anchoring each session, surrounded by higher-rep bodybuilding accessory work.\n\n### The split\n\nFour training days, each body part hit once a week:\n\n- **Back & Biceps** — anchored by low-rep deadlifts\n- **Chest & Triceps** — anchored by low-rep bench press\n- **Shoulders & Traps** — moderate-rep pressing and raises\n- **Legs** — anchored by low-rep squats, plus a long list of higher-rep accessory work\n\n### It's meant to progress, not repeat\n\nUnlike most of the other Old School presets here, this one is explicitly a multi-week template: the anchor lift's rep count is meant to climb over successive weeks (for example, squats starting around 2 reps a set and working up toward 6-10 over a few weeks) while the accessory exercises stay roughly the same. The version loaded into this app's Program Builder is Week 1 — treat it as a starting point to build from rather than a fixed routine to run unchanged for months.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"Ronnie Coleman's Power-Building Split\" under Preset Programs.\n\n---\n\n**Source:** exercise.com, \"Ronnie Coleman Workout Plan.\" This post summarizes and adapts that workout plan's exercise selection and set/rep scheme.",
      status: 'published'
    }
  ];

  function postToRow(p){
    return {
      id: (p.id && p.id.length === 36) ? p.id : undefined,
      title: p.title, slug: p.slug, category: p.category, date: p.date,
      author: p.author, views: p.views || 0, cover: p.cover,
      tags: p.tags || [], excerpt: p.excerpt, body: p.body, status: p.status
    };
  }
  function rowToPost(r){
    return {
      id: r.id, title: r.title, slug: r.slug, category: r.category||'',
      date: r.date, author: r.author||'', views: r.views||0, cover: r.cover||'',
      tags: r.tags||[], excerpt: r.excerpt||'', body: r.body||'', status: r.status
    };
  }

  async function migrateSeedPosts(){
    let ok = 0;
    for (const p of SEED_POSTS){
      const { data: existing } = await bnbClient.from('blog_posts').select('id').eq('slug', p.slug);
      if (existing && existing.length) continue; // already migrated
      const row = postToRow(p);
      delete row.id;
      const { error } = await bnbClient.from('blog_posts').insert([row]);
      if (error){ console.warn('Seed migration: post failed', p.slug, error); continue; }
      ok++;
    }
    return ok;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.posts = migrateSeedPosts;

  let postsSnapshot = [];
  function loadPosts(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshPostsFromSupabase below).
    return SEED_POSTS.slice();
  }
  async function refreshPostsFromSupabase(){
    const { data, error } = await bnbClient.from('blog_posts').select('*');
    if (error) { console.error('Supabase load blog_posts failed:', error); return; }
    if (data && data.length) {
      posts = data.map(rowToPost);
      postsSnapshot = posts.slice();
      if (typeof renderList === 'function') renderList();
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }
  function savePosts(){
    const oldIds = new Set(postsSnapshot.map(x=>x.id));
    const newIds = new Set(posts.map(x=>x.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    postsSnapshot = posts.slice();
    (async () => {
      const realRows = posts.filter(p => p.id && p.id.length === 36);
      const rows = realRows.map(postToRow);
      const results = await Promise.allSettled(rows.map(row => bnbClient.from('blog_posts').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('blog_posts').delete().eq('id', id)));
      const successCount = results.filter(r => r.status === 'fulfilled' && !(r.value && r.value.error)).length;
      if (successCount === 0 && rows.length > 0){
        alert('Could not save to database — check your connection or Supabase setup.');
      }
    })();
  }

  /* ---------------- MEGATRON (hero slider) ---------------- */
  const GALLERY_STORE_KEY = 'bnb-gallery-images-v1';
  const GALLERY_SEED_IMAGES = [
    { id:'g1', url:'https://picsum.photos/seed/bnb1/800/800', title:'Deadlift Day, Block A' },
    { id:'g2', url:'https://picsum.photos/seed/bnb2/800/800', title:'12-Week Transformation — J.M.' },
    { id:'g3', url:'https://picsum.photos/seed/bnb3/800/800', title:'Facility — Free Weight Floor' },
    { id:'g4', url:'https://picsum.photos/seed/bnb4/800/800', title:'Group Session — Saturday AM' },
    { id:'g5', url:'https://picsum.photos/seed/bnb5/800/800', title:'Coach KA Coaching a Set' },
    { id:'g6', url:'https://picsum.photos/seed/bnb6/800/800', title:'Progress Check — 6 Weeks In' }
  ];
  function loadGalleryImages(){
    // Gallery is now Supabase-backed and defined later in the document —
    // read its live data once available; fall back to seed images for
    // the brief window before that module has loaded/fetched.
    if (window.BNB_GALLERY && window.BNB_GALLERY.getImages){
      const real = window.BNB_GALLERY.getImages();
      if (real.length) return real;
    }
    return GALLERY_SEED_IMAGES.slice();
  }

  const MEGATRON_STORE_KEY = 'bnb-blog-megatron-v1';
  const MEGATRON_SEED = [
    { id:'m1', imageId:'g1', caption:'' },
    { id:'m2', imageId:'g4', caption:'' },
    { id:'m3', imageId:'g2', caption:'' }
  ];
  function megatronToRow(s, idx){
    return {
      id: (s.id && s.id.length === 36) ? s.id : undefined,
      image_id: (s.imageId && s.imageId.length === 36) ? s.imageId : null,
      caption: s.caption, sort_order: idx
    };
  }
  function rowToMegatron(r){
    return { id: r.id, imageId: r.image_id, caption: r.caption||'' };
  }

  async function migrateSeedMegatron(galleryIdMap){
    let ok = 0, idx = 0;
    for (const s of MEGATRON_SEED){
      const newImageId = galleryIdMap[s.imageId];
      if (!newImageId) { idx++; continue; }
      const row = megatronToRow(s, idx);
      delete row.id;
      row.image_id = newImageId;
      const { error } = await bnbClient.from('megatron_slides').insert([row]);
      if (!error) ok++;
      idx++;
    }
    return ok;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.megatron = migrateSeedMegatron;

  let megatronSnapshot = [];
  function loadMegatron(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshMegatronFromSupabase below).
    return MEGATRON_SEED.slice();
  }
  async function refreshMegatronFromSupabase(){
    const { data, error } = await bnbClient.from('megatron_slides').select('*').order('sort_order');
    if (error) { console.error('Supabase load megatron_slides failed:', error); return; }
    if (data && data.length) {
      megatronSlides = data.map(rowToMegatron);
      megatronSnapshot = megatronSlides.slice();
      renderMegatron();
    }
  }
  function saveMegatron(){
    const oldIds = new Set(megatronSnapshot.map(x=>x.id));
    const newIds = new Set(megatronSlides.map(x=>x.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    megatronSnapshot = megatronSlides.slice();
    (async () => {
      const realSlides = megatronSlides.filter(s => s.id && s.id.length === 36);
      const rows = realSlides.map(megatronToRow);
      await Promise.allSettled(rows.map(row => bnbClient.from('megatron_slides').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('megatron_slides').delete().eq('id', id)));
    })();
  }
  let megatronSlides = loadMegatron();
  megatronSnapshot = megatronSlides.slice();
  refreshMegatronFromSupabase(); // async — replaces seed data once Supabase responds
  let megatronIndex = 0;
  let megatronTimer = null;

  function renderMegatron(){
    const el = document.getElementById('megatron');
    if (!el) return;
    const gallery = loadGalleryImages();
    const slides = megatronSlides.map(s => {
      const img = gallery.find(g=>g.id===s.imageId);
      return img ? Object.assign({}, s, {url: img.url, title: img.title}) : null;
    }).filter(Boolean);
    if (megatronTimer){ clearInterval(megatronTimer); megatronTimer = null; }
    if (!slides.length){
      el.innerHTML = '<div class="megatron-empty">No hero slides yet — add some from Admin.</div>';
      return;
    }
    if (megatronIndex >= slides.length) megatronIndex = 0;
    el.innerHTML = slides.map((s,i)=>`
      <div class="megatron-slide${i===megatronIndex?' active':''}" style="background-image:url('${escAttr(s.url)}')">
        ${s.caption ? `<div class="megatron-caption">${esc(s.caption)}</div>` : ''}
      </div>
    `).join('') + (slides.length > 1 ? `
      <button class="megatron-arrow prev" id="megatron-prev" type="button">‹</button>
      <button class="megatron-arrow next" id="megatron-next" type="button">›</button>
      <div class="megatron-dots">${slides.map((_,i)=>`<button class="megatron-dot${i===megatronIndex?' active':''}" data-i="${i}" type="button"></button>`).join('')}</div>
    ` : '');
    if (slides.length > 1){
      document.getElementById('megatron-prev').onclick = ()=>{ megatronIndex = (megatronIndex - 1 + slides.length) % slides.length; renderMegatron(); };
      document.getElementById('megatron-next').onclick = ()=>{ megatronIndex = (megatronIndex + 1) % slides.length; renderMegatron(); };
      el.querySelectorAll('.megatron-dot').forEach(d=>{
        d.onclick = ()=>{ megatronIndex = parseInt(d.dataset.i,10); renderMegatron(); };
      });
      megatronTimer = setInterval(()=>{ megatronIndex = (megatronIndex + 1) % slides.length; renderMegatron(); }, 6000);
    }
  }

  function renderMegatronAdmin(){
    const gallery = loadGalleryImages();
    const list = document.getElementById('megatron-slide-list');
    if (!megatronSlides.length){
      list.innerHTML = '<div class="field-hint">No slides yet — add one below.</div>';
    } else {
      list.innerHTML = megatronSlides.map((s,i)=>{
        const img = gallery.find(g=>g.id===s.imageId);
        const url = img ? img.url : '';
        const label = s.caption || (img ? img.title : 'Missing image');
        return `<div class="megatron-slide-row">
          <img src="${escAttr(url)}" alt="">
          <div class="msr-cap">${esc(label)}</div>
          <div class="msr-actions">
            <button data-act="up" data-i="${i}" type="button" ${i===0?'disabled':''}>↑</button>
            <button data-act="down" data-i="${i}" type="button" ${i===megatronSlides.length-1?'disabled':''}>↓</button>
            <button data-act="remove" data-i="${i}" type="button">✕</button>
          </div>
        </div>`;
      }).join('');
    }
    list.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const i = parseInt(btn.dataset.i, 10);
        const act = btn.dataset.act;
        if (act === 'remove'){ megatronSlides.splice(i,1); }
        else if (act === 'up' && i>0){ const tmp=megatronSlides[i-1]; megatronSlides[i-1]=megatronSlides[i]; megatronSlides[i]=tmp; }
        else if (act === 'down' && i<megatronSlides.length-1){ const tmp=megatronSlides[i+1]; megatronSlides[i+1]=megatronSlides[i]; megatronSlides[i]=tmp; }
        saveMegatron();
        renderMegatronAdmin();
        renderMegatron();
      });
    });

    const sel = document.getElementById('megatron-image-select');
    sel.innerHTML = gallery.map(g=>`<option value="${escAttr(g.id)}">${esc(g.title)}</option>`).join('');
  }

  document.getElementById('megatron-add-btn').addEventListener('click', ()=>{
    const sel = document.getElementById('megatron-image-select');
    const capInput = document.getElementById('megatron-caption-input');
    const imageId = sel.value;
    if (!imageId) return;
    megatronSlides.push({ id: window.BNB_UUID(), imageId, caption: capInput.value.trim() });
    capInput.value = '';
    saveMegatron();
    renderMegatronAdmin();
    renderMegatron();
  });

  let posts = loadPosts();
  postsSnapshot = posts.slice();
  refreshPostsFromSupabase(); // async — replaces seed data once Supabase responds
  let activeCategory = 'all';
  let searchTerm = '';
  let currentPostId = null;
  let editingId = null;

  /* ---------------- tiny markdown renderer (no deps) ---------------- */
  function mdToHtml(md){
    if (!md) return '';
    const lines = md.split('\n');
    let html = ''; let inList = false;
    function inline(t){
      t = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Markdown links: escape quotes in the URL (otherwise a crafted URL
      // like `" onmouseover="...` breaks out of the href attribute and
      // injects arbitrary attributes/event handlers), and only allow
      // http(s)/mailto/relative links — javascript: and other schemes
      // would otherwise execute on click.
      t = t.replace(/\[(.+?)\]\((.+?)\)/g, (match, label, url) => {
        const safeUrl = /^(https?:|mailto:|\/|#)/i.test(url)
          ? url.replace(/"/g, '&quot;')
          : '#';
        return '<a href="' + safeUrl + '" target="_blank" rel="noopener">' + label + '</a>';
      });
      return t;
    }
    lines.forEach(raw=>{
      const line = raw.trim();
      if (line === ''){ if(inList){ html+='</ul>'; inList=false; } return; }
      if (line.startsWith('### ')){ if(inList){html+='</ul>';inList=false;} html += '<h3>'+inline(line.slice(4))+'</h3>'; return; }
      if (line.startsWith('## ')){ if(inList){html+='</ul>';inList=false;} html += '<h2>'+inline(line.slice(3))+'</h2>'; return; }
      if (line.startsWith('# ')){ if(inList){html+='</ul>';inList=false;} html += '<h2>'+inline(line.slice(2))+'</h2>'; return; }
      if (line.startsWith('- ')){ if(!inList){html+='<ul>';inList=true;} html += '<li>'+inline(line.slice(2))+'</li>'; return; }
      if(inList){ html+='</ul>'; inList=false; }
      html += '<p>'+inline(line)+'</p>';
    });
    if (inList) html += '</ul>';
    return html;
  }

  function slugify(s){
    return (s||'').toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  }
  function fmtDate(d){
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  }

  /* ---------------- VIEW SWITCH ---------------- */
  function switchView(view){
    document.querySelectorAll('.blog-scope .view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.querySelectorAll('.blog-scope #mode-switch button').forEach(b=>{
      b.classList.toggle('active', b.dataset.mode === (view === 'admin' ? 'admin' : 'read'));
    });
  }
  document.querySelectorAll('.blog-scope #mode-switch button').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (b.dataset.mode === 'admin'){
        if (typeof isSignedIn === 'function' && !isSignedIn()){ goToLoginPrompt(); return; }
        if (typeof isStaff === 'function' && !isStaff()){ showStaffOnlyToast(); return; }
        switchView('admin'); renderAdmin(); renderMegatronAdmin();
      }
      else { switchView('list'); renderList(); renderMegatron(); }
    });
  });

  /* ---------------- CATEGORY CHIPS ---------------- */
  const BLOG_TOPICS = ['Recreation', 'Health & Appearance', 'Wealth & Finance', 'Love & Relationships', 'Community & Charity', 'Career', 'Personal Development'];
  function renderCategoryChips(){
    const cats = ['all', ...BLOG_TOPICS];
    const bar = document.getElementById('cat-filter');
    bar.innerHTML = '';
    cats.forEach(c=>{
      const btn = document.createElement('button');
      btn.textContent = c === 'all' ? 'All' : c;
      btn.className = c === activeCategory ? 'active' : '';
      btn.onclick = ()=>{ activeCategory = c; renderList(); };
      bar.appendChild(btn);
    });
  }

  function openPost(id){
    currentPostId = id;
    const p = posts.find(x=>x.id===id);
    if (p){ p.views = (p.views||0) + 1; savePosts(); }
    renderPost();
    switchView('post');
  }

  /* ---------------- SIDEBAR: TRENDING / NEWEST ---------------- */
  let sideSort = 'popular';

  function renderSideList(){
    const list = document.getElementById('side-post-list');
    list.innerHTML = '';
    let items = posts.filter(p => p.status === 'published');
    if (sideSort === 'popular'){
      items = items.slice().sort((a,b)=> (b.views||0) - (a.views||0));
    } else {
      items = items.slice().sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    }
    items = items.slice(0, 9);

    items.forEach((p, i)=>{
      const li = document.createElement('li');
      li.className = 'side-post-item';
      const metaHtml = sideSort === 'popular'
        ? `<span>${(p.views||0).toLocaleString()} views</span>`
        : `<span>${fmtDate(p.date)}</span>`;
      li.innerHTML = `
        <span class="side-post-rank">${String(i+1).padStart(2,'0')}</span>
        <div class="side-post-body">
          <span class="side-post-title">${esc(p.title)}</span>
          <div class="side-post-meta">${metaHtml}</div>
        </div>`;
      li.onclick = ()=> openPost(p.id);
      list.appendChild(li);
    });
  }

  const sortToggle = document.getElementById('sort-toggle');
  sortToggle.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      sideSort = b.dataset.sort;
      sortToggle.setAttribute('data-value', sideSort);
      sortToggle.querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b));
      renderSideList();
    });
  });

  /* ---------------- LIST VIEW ---------------- */
  function renderList(){
    renderCategoryChips();
    renderSideList();
    const grid = document.getElementById('post-grid');
    const emptyMsg = document.getElementById('empty-msg');
    grid.innerHTML = '';
    let visible = posts.filter(p => p.status === 'published');
    if (activeCategory !== 'all') visible = visible.filter(p => p.category === activeCategory);
    if (searchTerm){
      const s = searchTerm.toLowerCase();
      visible = visible.filter(p => (p.title+p.excerpt+p.body).toLowerCase().includes(s));
    }
    visible.sort((a,b)=> (b.date||'').localeCompare(a.date||''));

    if (visible.length === 0){ emptyMsg.style.display = 'block'; return; }
    emptyMsg.style.display = 'none';

    visible.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'post-card';
      const coverHtml = p.cover
        ? `<div class="cover" style="background-image:url('${escAttr(p.cover)}')"></div>`
        : `<div class="cover empty">No Cover Image</div>`;
      card.innerHTML = `
        ${coverHtml}
        <div class="body">
          <div class="cat">${esc(p.category||'General')}</div>
          <h3>${esc(p.title)}</h3>
          <div class="excerpt">${esc(p.excerpt||'')}</div>
          <button class="read-more">Read more <span class="arrow">→</span></button>
          <div class="meta"><span>${esc(p.author||'')}</span><span>${fmtDate(p.date)}</span></div>
        </div>`;
      card.onclick = ()=> openPost(p.id);
      grid.appendChild(card);
    });
  }
  document.getElementById('search-input').addEventListener('input', e=>{
    searchTerm = e.target.value; renderList();
  });

  /* ---------------- SINGLE POST VIEW ---------------- */
  function renderPost(){
    const p = posts.find(x=>x.id===currentPostId);
    const wrap = document.getElementById('post-reader-content');
    if (!p){ wrap.innerHTML = '<p>Post not found.</p>'; return; }
    const coverHtml = p.cover ? `<img class="cover" src="${escAttr(p.cover)}" alt="">` : '';
    const tagsHtml = (p.tags||[]).map(t=>`<span class="tag-pill">#${esc(t)}</span>`).join('');
    wrap.innerHTML = `
      ${coverHtml}
      <div class="cat">${esc(p.category||'General')}</div>
      <h1>${esc(p.title)}</h1>
      <div class="meta">${esc(p.author||'')} &nbsp;·&nbsp; ${fmtDate(p.date)}</div>
      <div class="post-body">${mdToHtml(p.body)}</div>
      ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
    `;
  }
  document.getElementById('back-to-list').addEventListener('click', ()=>{ switchView('list'); renderList(); });

  /* ---------------- ADMIN TABLE ---------------- */
  let blogSort = { key: 'date', dir: 'desc' };
  function applySort(list, sort){
    return list.slice().sort((a,b)=>{
      const av = (a[sort.key]||'').toString().toLowerCase();
      const bv = (b[sort.key]||'').toString().toLowerCase();
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  function updateSortHeaderUI(rowEl, sort){
    rowEl.querySelectorAll('th[data-sort]').forEach(th=>{
      const active = th.dataset.sort === sort.key;
      th.classList.toggle('sort-active', active);
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = active ? (sort.dir === 'asc' ? '▴' : '▾') : '▾';
    });
  }
  document.querySelectorAll('#admin-thead-row th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if (blogSort.key === key) blogSort.dir = blogSort.dir === 'asc' ? 'desc' : 'asc';
      else { blogSort.key = key; blogSort.dir = 'asc'; }
      renderAdmin();
    });
  });
  function renderAdmin(){
    const tbody = document.getElementById('admin-tbody');
    tbody.innerHTML = '';
    updateSortHeaderUI(document.getElementById('admin-thead-row'), blogSort);
    const sorted = applySort(posts, blogSort);
    if (sorted.length === 0){
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:30px;">No posts yet — click "+ New Post" to write one.</td></tr>';
      return;
    }
    sorted.forEach(p=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${esc(p.title)}</b></td>
        <td>${esc(p.category||'—')}</td>
        <td class="mono">${fmtDate(p.date)}</td>
        <td><span class="status-pill ${p.status}">${p.status}</span></td>
        <td><div class="row-actions">
          <button class="edit-btn">Edit</button>
          <button class="del del-btn">Delete</button>
        </div></td>
      `;
      tr.querySelector('.edit-btn').onclick = ()=> openEditor(p.id);
      tr.querySelector('.del-btn').onclick = ()=>{
        if (!confirm('Delete "' + p.title + '"? This cannot be undone.')) return;
        posts = posts.filter(x=>x.id!==p.id); savePosts(); renderAdmin();
      };
      tbody.appendChild(tr);
    });
  }

  /* ---------------- EDITOR PANEL ---------------- */
  const backdrop = document.getElementById('panel-backdrop');
  const fTitle = document.getElementById('f-title');
  const fSlug = document.getElementById('f-slug');
  const fCategory = document.getElementById('f-category');
  const fDate = document.getElementById('f-date');
  const fAuthor = document.getElementById('f-author');
  const fCover = document.getElementById('f-cover');
  const fTags = document.getElementById('f-tags');
  const fExcerpt = document.getElementById('f-excerpt');
  const fBody = document.getElementById('f-body');
  let slugManuallyEdited = false;
  let currentStatus = 'draft';

  fTitle.addEventListener('input', ()=>{
    if (!slugManuallyEdited) fSlug.value = slugify(fTitle.value);
  });
  fSlug.addEventListener('input', ()=> slugManuallyEdited = true);

  document.querySelectorAll('#status-toggle button').forEach(b=>{
    b.addEventListener('click', ()=>{
      currentStatus = b.dataset.status;
      document.querySelectorAll('#status-toggle button').forEach(x=>x.classList.toggle('active', x===b));
    });
  });

  function openEditor(id){
    editingId = id || null;
    slugManuallyEdited = false;
    const p = id ? posts.find(x=>x.id===id) : null;
    document.getElementById('panel-title').textContent = p ? 'Edit Post' : 'New Post';
    fTitle.value = p ? p.title : '';
    fSlug.value = p ? p.slug : '';
    if (p) slugManuallyEdited = true;
    fCategory.value = p ? p.category : 'Recreation';
    fDate.value = p ? p.date : new Date().toISOString().slice(0,10);
    fAuthor.value = p ? p.author : 'Coach KA';
    fCover.value = p ? p.cover : '';
    fTags.value = p ? (p.tags||[]).join(', ') : '';
    fExcerpt.value = p ? p.excerpt : '';
    fBody.value = p ? p.body : '';
    currentStatus = p ? p.status : 'draft';
    document.querySelectorAll('#status-toggle button').forEach(x=>x.classList.toggle('active', x.dataset.status===currentStatus));
    backdrop.classList.add('show');
  }
  document.getElementById('new-post-btn').addEventListener('click', ()=> openEditor(null));
  document.getElementById('panel-cancel').addEventListener('click', ()=> backdrop.classList.remove('show'));
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) backdrop.classList.remove('show'); });

  document.getElementById('panel-save').addEventListener('click', ()=>{
    if (!fTitle.value.trim()){ alert('Give the post a title first.'); return; }
    const tags = fTags.value.split(',').map(t=>t.trim()).filter(Boolean);
    const data = {
      title: fTitle.value.trim(),
      slug: fSlug.value.trim() || slugify(fTitle.value),
      category: fCategory.value.trim() || 'General',
      date: fDate.value || new Date().toISOString().slice(0,10),
      author: fAuthor.value.trim() || 'Coach KA',
      cover: fCover.value.trim(),
      tags: tags,
      excerpt: fExcerpt.value.trim(),
      body: fBody.value,
      status: currentStatus
    };
    if (editingId){
      const idx = posts.findIndex(x=>x.id===editingId);
      posts[idx] = Object.assign({id: editingId}, data);
    } else {
      data.id = window.BNB_UUID();
      posts.push(data);
    }
    savePosts();
    backdrop.classList.remove('show');
    renderAdmin();
  });

  /* ---------------- IMPORT / EXPORT ---------------- */
  document.getElementById('export-btn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(posts, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wkab-blog-posts-export.json'; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('import-btn').addEventListener('click', ()=> document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        posts = parsed; savePosts(); renderAdmin();
        alert('Posts imported.');
      } catch(err){ alert('That file could not be read as a valid posts JSON export.'); }
    };
    reader.readAsText(file);
  });

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  /* ---------------- INIT ---------------- */
  document.addEventListener('bnb-gallery-updated', renderMegatron);
  renderList();
  renderMegatron();
  renderAdmin();
  renderMegatronAdmin();

})();
