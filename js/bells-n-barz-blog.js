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
      body: "## Why the \"golden era\" look still gets referenced\n\nAsk anyone to picture a \"classic\" bodybuilder physique and they're picturing the 1970s: wide shoulders and lats tapering to a small waist, visible abs at a bodyfat level that still looked athletic rather than stage-lean year-round. That look — the V-taper — came from a specific training approach, not a supplement stack.\n\n### The split\n\nThree body-part groups, each hit twice a week, one full rest day:\n\n- **Monday & Thursday** — Chest & Back\n- **Tuesday & Friday** — Shoulders & Arms\n- **Wednesday & Saturday** — Legs\n- **Sunday** — Rest\n\nAbs, calves, forearms, and neck were trained separately, 4–6 times a week, as needed rather than on a fixed schedule.\n\n### How each session actually ran\n\nFive sets per exercise was the default, with reps generally in the 8–12 range (legs ran looser, 5–20). The first exercise of the day — usually the heaviest compound lift — was pyramided: start light, add weight every set, and finish the last set as heavy as possible for as few as 1–2 reps. That first lift was meant to \"activate\" the rest of the session.\n\nArnold Schwarzenegger's signature variation was supersetting opposing muscle groups — a set of Bench Press immediately followed by a set of Chinups, no rest between, repeated for all 5 sets. Rest periods generally stayed short: about a minute between sets or supersets.\n\nOnce a week, one exercise (Bench Press, Squat, or Deadlift) was taken to a genuine one-rep max as a strength check — not a weekly habit for every lift, just a periodic test.\n\n### Diet: built on volume, not precision\n\nThe golden-era approach to eating matched the training: a lot of protein and saturated fat, with carbohydrate intake cycled up during bulking phases and down while cutting. Steak, chicken, tuna, and — notably — raw eggs were staple protein sources; homemade shakes were often just raw eggs, milk powder, and whatever else was on hand.\n\n**Worth flagging**: raw eggs carry a real salmonella risk that wasn't well understood or taken seriously in the 1970s. If replicating this diet, pasteurized eggs are the safer substitute for anything eaten raw.\n\n### Try it yourself\n\nThis split is now a loadable preset in **Coach > Program Builder** — select a client, choose \"Old School 70's Split\" under Preset Programs, and it populates their full week in one click.\n\n---\n\n**Source:** Gustavo Mirabal Castro, \"The Old School 70's Bodybuilding Routine\" (gustavomirabal.ch, no longer online), published January 10, 2020, gustavomirabal.ch. This post summarizes and adapts that article's training and diet notes — see the original for the author's full commentary.",
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
      body: "## A method that predates its own name\n\nWhat's called \"German Volume Training\" today traces back to 1970s Germany, where it was used in the weightlifting off-season to help lifters gain lean mass quickly — efficient enough that lifters routinely moved up a full weight class in about 12 weeks. Strength coach Charles Poliquin popularized the name in the English-speaking world; a very similar method was independently promoted in the US by Vince Gironda.\n\n### The rule\n\nOne exercise per body part. Ten straight sets of ten reps, with the same weight for every set — a weight you could otherwise lift for about 20 reps to failure (roughly 60% of your 1-rep max). Rest 60-90 seconds between straight sets, 90-120 seconds if performed as a superset. Once you can complete all 10 sets of 10 with your rest intervals intact, add 4-5% to the weight and repeat.\n\nThe program deliberately avoids forced reps, negatives, or burns — the sheer volume of repeated effort against the same weight is what drives the hypertrophy, and it's usually more than enough on its own. Gains of 10+ pounds in six weeks aren't unusual, even in experienced lifters, though the soreness that comes with it is legendary — a hard quad-and-hamstring day can leave you limping for the better part of a week.\n\n### A 5-day, not-quite-weekly cycle\n\nThe standard beginner/intermediate split is Chest & Back, Legs & Abs, Off, Arms & Shoulders, Off — a 5-day cycle repeated every 5 days rather than tied to Monday-Sunday. Fit into a calendar week it comfortably leaves two full rest days on top of the built-in off days.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for \"German Volume Training (10×10)\" under Preset Programs.\n\n---\n\n**Source:** Charles Poliquin, [\"German Volume Training!\"](https://web.archive.org/web/20161120063251/http://www.bodybuilding.com/fun/luis13.htm), Bodybuilding.com. This post summarizes and adapts that article's training notes — see the original for the full write-up, including the follow-up 10×6 phase.",
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
    },
    {
      id: 'p23', title: "The Tom Platz Leg Workout: How Much Volume Is Too Much?",
      slug: 'tom-platz-leg-workout', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','legs','high-volume'],
      excerpt: "Widely regarded as having the best leg development bodybuilding has ever seen, Tom Platz got there with a squat session most lifters would never survive.",
      body: "## The legs that started arguments\n\nTom Platz never won Mr. Olympia — his best finish was 3rd in 1981 — but in a poll of Flex magazine readers, he was voted as having the best quad and hamstring development of all time. His legs were built almost entirely on one idea taken to its extreme: squat, a lot, at high reps, to genuine failure.\n\n### The session\n\nA single leg day, but a huge one — roughly 33 to 47 total working sets:\n\n- **Back Squats** — 8-12 sets of 5-20 reps\n- **Hack Squats** — 5 sets of 10-15 reps\n- **Leg Extension** — 5-8 sets of 10-15 reps\n- **Leg Curls** — 6-10 sets of 10-15 reps\n- **Standing, Seated, and Hack Machine Calf Raises** — 3-4 sets each of 10-15 reps\n\nPlatz reportedly squatted for 10 minutes straight on occasion, racking up over 100 reps with 225 pounds in a single continuous set, and famously squatted 495 pounds for 23 reps on camera. Every set was pushed to true failure — by his own account, if he didn't end a set on the floor, he hadn't gone hard enough.\n\n### Not a starting point\n\nThis is explicitly an advanced session — roughly 33-47 total sets for one muscle group is an enormous volume by any standard, and the source article itself suggests cutting it in half to make it achievable for most lifters. Strict below-parallel form on every rep matters even more at this volume, since fatigue is exactly when form breaks down.\n\n### How to use this\n\nThis isn't offered as a standalone Program Builder preset, since a single leg-only day would wipe out the rest of a client's week if loaded the normal way. If you want to use it, swap it in by hand as the Legs day inside any of the other Old School presets — Kazmaier's, Coleman's, or the original Old School 70's Split are all good hosts for it.\n\n---\n\n**Source:** [\"The Tom Platz Leg Workout\"](https://gymtalk.com/tom-platz-leg-workout/), GymTalk. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p24', title: "Ed Coan's 10-Week Deadlift Program: Peaking With Percentages",
      slug: 'ed-coan-10-week-deadlift-program', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['powerlifting','deadlift','program-design'],
      excerpt: "Widely considered the greatest powerlifter of all time, Ed Coan's deadlift program built a friend's pull by 35 pounds in ten weeks — using percentages, not guesswork.",
      body: "## Built for a friend, not for himself\n\nEd Coan set 71 world records over his powerlifting career and is routinely called the greatest powerlifter of all time — a 6'0\", 220lb lifter with a best deadlift of 901 pounds. This particular 10-week program wasn't written for Coan's own training; he designed it for training partner Mark Phillipi (who went on to win America's Strongest Man), and Phillipi credited it with taking his deadlift from 505 to 540 pounds.\n\n### The structure\n\nEverything in the 10 weeks centers on the deadlift specifically, run once a week alongside a lifter's regular training:\n\n- **Work sets** — a single heavy set climbing from 75% of your target max in week 1 up to a new PR attempt at 100%+ by week 10-11\n- **Speed sets** — multiple lighter, faster sets (starting around 8 sets of 3 at 60%) that taper down in both volume and load as the work sets get heavier\n- **Assistance circuit** — stiff-legged deadlifts, bent-over rows, underhand lat pulldowns, and arched-back good mornings, run as a circuit early in the program and as straight sets later on\n\nThe logic is pure specificity: if you want your deadlift to go up, the deadlift itself — trained at a range of loads and speeds — needs to be the centerpiece, not accessory work alone.\n\n### What to expect\n\nThis is described by the source as \"not for the faint hearted\" — a real mental and physical test, with significant lower-back and hamstring soreness in the first few weeks that can spill over into other lifts (squats in particular). Plan on eating and recovering accordingly.\n\n### How to use this\n\nBecause it's designed to run alongside a lifter's existing program rather than replace it, this isn't offered as a standalone Program Builder preset — loading it the normal way would wipe out the rest of a client's week for the sake of one lift. Add the deadlift work sets, speed sets, and assistance circuit to a client's existing Back or Legs day by hand instead.\n\n---\n\n**Source:** [\"Ed Coan's 10 Week Deadlift Routine Review\"](https://gymtalk.com/ed-coan-deadlift-routine-review/), GymTalk. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p25', title: "The John Grimek Breathing Squat: One Exercise, Total Bulk",
      slug: 'john-grimek-breathing-squat', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school','bodybuilding','squats','finisher'],
      excerpt: "Two-time Mr. America John Grimek didn't build his frame with a routine — he built it with one superset, done until he could barely breathe.",
      body: "## The exercise that started with a magazine letter\n\nIn the early 1930s, a lifter named Joseph Hise wrote to Strongman magazine describing how adding deep knee bends (squats) to his routine helped him gain 29 pounds in a single month. That letter kicked off widespread interest in high-rep squatting for mass — and John Grimek, a training partner of Hise's who went on to become a two-time Mr. America, Mr. Universe, and 1936 Olympic weightlifter for the USA, built much of his \"Monarch of Muscledom\" physique around the idea.\n\n### The breathing squat pyramid\n\nRather than a full weekly split, this is really one technique run as a single finisher: a pyramid of squats, starting at 20-25 reps and dropping in reps as the weight climbs each set (20-25 → 12-15 → 10-12 → 8-10 → 5-6 → 3-5 → 1-3), with every single squat immediately supersetted with a chest exercise (Grimek favored dumbbell pullovers or lying lateral raises) done for 8-10 reps.\n\nThe \"breathing\" part is deliberate: between reps of the squat itself, Grimek took three deep breaths, sucking air in until he felt pressure build in his chest, then squatted again with lungs full. The theory — shared by several pre-steroid-era bodybuilders — was that this expanded the ribcage and helped drive upper-body mass, with the immediate chest superset reinforcing the same effect while still out of breath.\n\n### How to use this\n\nThis is a finisher technique, not a full training day, so it isn't offered as a standalone Program Builder preset. It fits well added onto the end of an existing Legs day in any of the other Old School presets — just don't stack it on top of an already-high-volume leg session like Tom Platz's or German Volume Training's.\n\n---\n\n**Source:** [\"The John Grimek Squat & Bulk Routine\"](https://gymtalk.com/john-grimek-squat-bulk-routine/), GymTalk. This post summarizes and adapts that article's training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p26', title: "The Weider Training Principles: A Common Language for Bodybuilding",
      slug: 'weider-training-principles', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['bodybuilding','training-philosophy','history'],
      excerpt: "Before there were apps and coaches to explain progressive overload, there was Joe Weider — and a set of named principles that gave an entire sport a shared vocabulary.",
      body: "## Naming the ideas everyone already used\n\nJoe Weider spent decades developing and labeling training concepts so bodybuilders would have a common language to describe what they were doing in the gym — the \"Weider Training Principles.\" They aren't a single routine to follow; they're a toolkit of named ideas, meant to be layered in as a lifter gets more experienced.\n\n### For beginners\n\n- **Set System Training** — do multiple sets per exercise (2-4 sets of 1-4 exercises per body part) instead of the old single-set-of-12 approach, which produced slow results.\n- **Progressive Overload** — the foundation everything else sits on: keep adding weight, reps, sets, or reducing rest over time, or progress stalls.\n- **Isolation Training** — a common misread. It doesn't mean an exercise works only one muscle (nothing does); it means some exercises are simply better suited to emphasizing a given body part than others — triceps pressdowns over bench press, for a triceps-focused example.\n\n### For intermediates\n\n- **Split-System Training** — dividing the body across multiple sessions so each muscle group gets more focused volume and intensity than a single full-body workout allows.\n- **Cycle Training** — dedicating blocks of the training year to specific goals (strength, mass, cutting) rather than chasing everything at once.\n- **Superset Training** — pairing two opposing-muscle exercises back to back (like biceps curls with triceps pushdowns), which can also aid recovery since one muscle relaxes while its opposite contracts.\n- **Compound Sets** — supersetting two exercises for the same muscle group instead of opposing ones, for a more concentrated pump.\n- **Muscle Confusion** — regularly varying something in training (sets, reps, exercise order, rest periods) so the body doesn't fully adapt and progress doesn't stall.\n- **Forced Reps** — a spotter helps move the bar just enough to complete a few reps past normal failure (the same technique covered in this app's companion post on old-school intensity techniques).\n\n### Why this still matters\n\nThese aren't a program in themselves — they're vocabulary for describing training decisions, several of which show up throughout the other Old School presets in this app (supersets in the golden-era splits, progressive overload in Doug Hepburn's Program A, cycle training in Frank Zane's seasonal approach). Understanding the terms makes it easier to recognize the same underlying ideas across very different-looking routines.\n\n### How to use this\n\nThis is a philosophy and vocabulary piece rather than a specific routine, so there's no standalone Program Builder preset attached to it.\n\n---\n\n**Source:** Jeff Everson & Carey Rossi Walker, \"Laws of Physiques: How the Weider Principles Can Turn Training Into a Science,\" Muscle & Fitness, July 1999. This post summarizes and adapts that article's explanations of the Weider Training Principles.",
      status: 'published'
    },
    {
      id: 'p27', title: "Contrast Training: Pairing Heavy Lifts With Explosive Movement",
      slug: 'contrast-training-explained', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['athletic-performance','power','program-design'],
      excerpt: "Heavy squat, then a jump squat. The pairing isn't random — it primes your nervous system to fire harder on the very next rep.",
      body: "## The pairing, explained simply\n\nContrast training is a simple idea with a research-backed mechanism behind it: do a heavy set of a lift (5-10 reps), then immediately follow it with an unloaded, explosive version of the same movement pattern at a similar rep count. Squats followed by jump squats. Bench press followed by explosive push-ups or a medicine-ball chest pass. Pull-ups followed by medicine-ball slams.\n\n### Why it works: post-activation potentiation\n\nThe mechanism is called post-activation potentiation, or PAP — after a muscle performs a near-maximal contraction, its explosive capability is temporarily enhanced. Researchers point to a few contributing factors: more motor units get recruited, those motor units synchronize better, and some of the nervous system's normal \"brakes\" on all-out force loosen up. The net effect: the same muscle can produce faster, more powerful movement in the minutes right after a heavy set than it could cold.\n\n### A few ready-to-use pairings\n\n- **Knee-dominant** — Barbell Squat → Squat Jump or Box Jump\n- **Hip-dominant** — Deadlift or Romanian Deadlift → Broad Jump or Vertical Jump from a deadlift position\n- **Upper-body push** — Bench Press → Medicine-Ball Chest Pass or Explosive Push-Up\n- **Upper-body pull** — Chin-Up → Medicine-Ball Slam or Explosive Band/Cable Row\n- **Torso rotation** — Band or Cable Rotation → Medicine-Ball Rotational Throw\n\nFor athletes, this builds strength and power at the same time. For general lifters, it's a way to recruit more high-threshold muscle fibers for hypertrophy or add a metabolic, fat-loss-friendly finisher to a session — slightly higher reps on both halves of the pairing (8-12 instead of 5-10) shifts the emphasis from pure power toward more total training volume.\n\n### How to use this\n\nThis is a technique for pairing exercises, not a weekly split, so there's no standalone Program Builder preset attached to it — but it's straightforward to layer onto any of the other presets in this app: add the matching explosive movement right after the main heavy lift on a given day.\n\n---\n\n**Source:** Nick Tumminello, [\"Contrast Training for Strength, Size, and Power\"](https://archive.t-nation.com/training/contrast-training-for-strength-size-and-power/), T Nation. This post summarizes and adapts that article's technique notes — see the original for the full exercise library and video demonstrations.",
      status: 'published'
    },
    {
      id: 'p28', title: "The Bulgarian Method: Why the Most Effective Program Isn't for You",
      slug: 'the-bulgarian-method-explained', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['weightlifting','powerlifting','training-philosophy'],
      excerpt: "The Bulgarian national weightlifting team dominated the sport for 25 years training near-daily maxes. It's also one of the clearest examples of a program that's genuinely dangerous for the wrong person.",
      body: "## A program built for a very specific athlete\n\nThe Bulgarian Method, developed by coach Ivan Abadjiev starting in the 1960s, is credited with an extraordinary run of Olympic weightlifting dominance — for roughly 25 years, no world record was considered safe from the Bulgarian team. The method itself is almost shockingly simple to describe: squat, snatch, and clean & jerk, multiple times a day, nearly every day, at or near your daily max, with only one or two reps per set.\n\n### Why it isn't included as a preset here\n\nThis app doesn't offer the Bulgarian Method as a Program Builder preset, and that's a deliberate choice, not an oversight. The source article — written by an experienced weightlifting coach who has personally used this system — is explicit that it was designed for elite, genetically gifted athletes (ideally 15-18 years old, already training at a high level for 5-8 years, ranked in the top three nationally in their federation) and requires constant supervision from an experienced, relentless coach who can judge in real time whether an athlete should be squatting that day or resting. It is not a program a member should self-select from a dropdown, or that a coach should assign without the exact kind of hands-on daily judgment the source describes.\n\n### What makes it dangerous outside that context\n\nDaily near-max attempts on the competition lifts, with minimal deload structure, place enormous and continuous stress on connective tissue and the nervous system. Elite Bulgarian-team athletes could handle that because of a combination of genetics, years of prior training, and expert coaching making constant real-time load decisions. Without all three of those pieces in place, the far more likely outcome is injury or burnout rather than the legendary results the method is known for.\n\n### The takeaway\n\nThe Bulgarian Method is worth understanding as a piece of weightlifting history and as the far extreme of the frequency/intensity spectrum — genuinely useful context when discussing training philosophy with clients. It isn't worth attempting without an experienced weightlifting coach physically present to run it.\n\n---\n\n**Source:** Jim Moser, [\"The Bulgarian Method of Training Olympic Weightlifters\"](https://startingstrength.com/article/the_bulgarian_method_of_training_olympic_weightlifters), Starting Strength. This post summarizes and adapts that article's history and training notes — see the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p29', title: "Arnold Schwarzenegger's 8 Training Principles: The Mindset Behind The Oak",
      slug: 'arnold-schwarzenegger-8-training-principles', category: 'Health & Appearance',
      date: '2026-09-22', author: 'Coach KA', views: 0,
      cover: '', tags: ['bodybuilding','training-philosophy','mindset'],
      excerpt: "Arnold Schwarzenegger's chest-and-back and shoulders-and-arms routines are already old-school classics — but he was just as deliberate about the mindset behind them.",
      body: "## Not just what he did — how he thought about it\n\nArnold Schwarzenegger's training splits from the golden era are already represented in this app's other Old School presets (the same Mon/Thu Chest & Back → Tue/Fri Shoulders & Arms → Wed/Sat Legs structure traces back to his era). What's less often covered is the mental approach he wrote and spoke about for decades, which he considered just as important as the exercise selection.\n\n### A few of the principles\n\n- **Lifting requires brain work, too.** Arnold trained with total mental focus, using visualization to \"see\" the muscle he wanted before and during the set — imagining his biceps as mountains, for instance, and consciously coaxing them to grow rather than just moving the weight.\n- **Train harder than everybody else.** Arnold's stated goal wasn't to be as good as his competition, it was to be unmistakably better — which meant treating every session as an opportunity to outwork the room, not just complete the prescribed sets.\n- **Prioritize your weak points.** Arnold trained the body parts he judged weakest first in a session, while fresh and able to give them maximum intensity, rather than leaving them for the end of a tired workout.\n- **Use variety deliberately.** Rather than sticking to one routine indefinitely, Arnold regularly changed exercises, angles, and techniques specifically to keep forcing the muscle to adapt to something new.\n\n### Why this is worth reading even with the routines already covered\n\nA written program only captures exercises, sets, and reps — it can't capture the intensity, focus, or self-belief a lifter brings to each set, and Arnold was explicit that those mental factors were a deliberate part of his training, not an afterthought. Pair this mindset with any of the other Old School presets rather than treating it as a separate program.\n\n### How to use this\n\nThis is a set of training principles and mindset guidance rather than a specific routine, so there's no standalone Program Builder preset attached to it.\n\n---\n\n**Source:** David Robson & Bill Geiger, [\"Arnold Schwarzenegger's 8 Best Training Principles\"](https://web.archive.org/web/20161207232058/http://www.bodybuilding.com/fun/arnold-schwarzenegger-8-best-training-principles.html), Bodybuilding.com. This post summarizes and adapts that article's explanations — see the original 4-part series for Arnold's full commentary, including his specific chest/back, shoulders/arms, and legs/abs workouts.",
      status: 'published'
    },
    {
      id: 'p30', title: "StrongLifts 5×5: Three Lifts a Day, A Little More Every Time",
      slug: 'stronglifts-5x5', category: 'Health & Appearance',
      date: '2026-10-21', author: 'Coach KA', views: 0,
      cover: '', tags: ['5x5',  'strength',  'beginner',  'program-design'],
      excerpt: "Two workouts, five lifts, and one rule: if you made every rep, the bar gets heavier next time.",
      body: "## The program most people meet first\n\nStrongLifts 5×5 is Mehdi Hadim's take on the old five-sets-of-five idea, and it has introduced more people to the barbell than almost anything else. It strips training down to five lifts and one decision per session: did you make all your reps or not?\n\n### The scheme\n\nThere are two workouts, alternated three days a week with a day off between:\n\n- **Workout A:** Squat 5×5, Bench Press 5×5, Barbell Row 5×5\n- **Workout B:** Squat 5×5, Overhead Press 5×5, Deadlift 1×5\n\nWeek one runs A/B/A, week two B/A/B, and so on. All five sets use the same weight, with about three minutes of rest — five after a set you missed.\n\n### The rule that does the work\n\nMake every rep, and the next session adds **2.5 kg** to that lift (5 kg on the deadlift). Miss a weight three sessions in a row and you take 10% off and build back up. That's the whole progression.\n\n### Why it works\n\nSquatting three times a week with small, steady jumps is a fast way for a newer lifter to get strong, and the fixed 5×5 removes almost every decision. The trade-off is the same as any linear program: the jumps eventually outrun recovery, and that's the signal to move on to something with more variety — PHUL, Bill Starr's heavy/light/medium week, or our own manual.\n\n### Try it yourself\n\nLoad **StrongLifts 5×5** from **Coach > Program Builder > Preset Programs**, or pick **5×5 (StrongLifts)** as the Method in **Build a Program** to keep our warm-up, blocks and Signature Hold around it.\n\n---\n\n**Source:** Mehdi Hadim, [\"Stronglifts 5×5: The Complete Workout Guide\"](https://stronglifts.com/5x5/), StrongLifts. This post summarizes the program in our own words — read the original for the full guide.",
      status: 'published'
    },
    {
      id: 'p31', title: "Bill Starr's 5×5: The Big Three and the Heavy, Light, Medium Week",
      slug: 'bill-starr-5x5', category: 'Health & Appearance',
      date: '2026-10-21', author: 'Coach KA', views: 0,
      cover: '', tags: ['5x5',  'old-school',  'strength',  'program-design'],
      excerpt: "The strength coach who taught football players to lift built his program on three movements and a week that never asks for maximum effort twice.",
      body: "## The coach behind the 5×5 most people run\n\nBill Starr coached strength for football teams and Olympic lifters, and his 1976 book *The Strongest Shall Survive* is where the 5×5 most coaches know today comes from. His version is built around **\"The Big Three\"**: the power clean, the bench press and the back squat, taken as deep as you can.\n\n### The scheme\n\n- **Monday — heavy:** work up to near your best for five.\n- **Wednesday — light:** about 80% of Monday's weights, with the overhead press in place of the bench.\n- **Friday — medium:** about 90% of Monday's weights.\n\nThe three lifts are run as a **circuit** — one set of power cleans, one of bench, one of squats, then round again — five times.\n\n### The detail that separates it from Reg Park's 5×5\n\nStarr **ramps every set**: each of the five sets is heavier than the one before, so only the last is a true top set. Reg Park did two warm-up sets and then three sets at one weight. Same \"5×5\" on paper, very different day under the bar.\n\n### Progression and extras\n\nWhen all five reps come on the fifth set, every set goes up next time — in small jumps, as little as 2.5 lb a week. Leg extensions and leg curls warm the knees up first; sit-ups and leg raises finish the session.\n\n### Try it yourself\n\nLoad **Bill Starr's 5×5 (The Big Three)** from **Preset Programs**, or choose **Bill Starr 5×5** as the Method in **Build a Program** — it ramps the main lifts and rotates your days heavy, light and medium.\n\n---\n\n**Sources:** Chris Colucci, [\"The 5x5 Workout Explained: The Classic Program for Size and Strength\"](https://breakingmuscle.com/5-x-5-workout-explained/), Breaking Muscle; Greg Merritt, [\"5x5 Workout: Your Complete Training Guide\"](https://thebarbell.com/5x5-workout/), The Barbell. Starr's original is his book, *The Strongest Shall Survive* (1976); later versions differ in the details.",
      status: 'published'
    },
    {
      id: 'p32', title: "Reg Park's 5×5: The Three-Phase Plan Arnold Grew Up On",
      slug: 'reg-park-5x5', category: 'Health & Appearance',
      date: '2026-10-21', author: 'Coach KA', views: 0,
      cover: '', tags: ['5x5',  'old-school',  'bodybuilding',  'strength',  'program-design'],
      excerpt: "Before Arnold had a training philosophy of his own, he had Reg Park's — three phases, three months each, and very little that was optional.",
      body: "## Arnold's idol, Arnold's first program\n\nReg Park won Mr Universe three times and was the man a teenage Arnold Schwarzenegger wanted to become. His 1960 book *Strength and Bulk Training for Weight Lifters and Body Builders* laid out a 5×5 plan in three phases, each run for about three months, three days a week.\n\n### What \"5×5\" meant to Park\n\nThe first two sets are **warm-ups** that climb toward the working weight; the last **three sets of five are at one weight**. When you get all three, add 5–10 lb next time. No training to failure — Park wanted every set clean.\n\n### The three phases\n\n- **Phase 1:** 45° back extensions 3×10, then back squat, bench press and deadlift at 5×5. Rest 3–5 minutes between work sets.\n- **Phase 2 (for bodybuilders):** back extensions, front squat, back squat, bench press, standing barbell press, high pulls and deadlift at 5×5, plus standing calf raises 5×25. Rest drops to about two minutes.\n- **Phase 3:** the big lifts plus bent-over rows, behind-the-neck presses (or one-arm dumbbell presses), barbell curls, lying triceps extensions and calf raises.\n\nAt the end of a phase, Park tested his singles, took four days off and moved on. After Phase 3, back to Phase 1 — heavier.\n\n### Try it yourself\n\nAll three phases are in **Preset Programs** as **Reg Park's 5×5 — Phase 1, 2 and 3**. In **Build a Program**, the **Reg Park 5×5** Method gives your main lifts his two-warm-up, three-work-set structure.\n\n---\n\n**Sources:** Chris Colucci, [\"The 5x5 Workout Explained: The Classic Program for Size and Strength\"](https://breakingmuscle.com/5-x-5-workout-explained/), Breaking Muscle, and a reader's transcription of Park's phases on the [Ronnie.cz forum](https://forum.ronnie.cz/post1159958.html). Park's original is his book (1960); secondary sources differ on some Phase 3 set counts.",
      status: 'published'
    },
    {
      id: 'p33', title: "PHUL: Strong on Monday, Big by Friday",
      slug: 'phul-power-hypertrophy-upper-lower', category: 'Health & Appearance',
      date: '2026-10-21', author: 'Coach KA', views: 0,
      cover: '', tags: ['upper-lower',  'powerbuilding',  'hypertrophy',  'program-design'],
      excerpt: "Brandon Campbell's four-day split hits every muscle twice a week — once heavy, once for size — and fits around a working life.",
      body: "## Two goals, one week\n\nPHUL — **Power Hypertrophy Upper Lower** — is Brandon Campbell's answer to the lifter who wants to get stronger and bigger without living in the gym. Four sessions a week, every muscle trained twice: once with heavy, low-rep compounds, once with lighter, higher-rep work.\n\n### The week\n\n- **Monday — Upper Power:** bench press and bent-over rows at 3–5 reps, then incline dumbbell press, pulldowns, overhead press and arms at 5–10.\n- **Tuesday — Lower Power:** squats and deadlifts at 3–5, then leg press, leg curls and calves.\n- **Wednesday:** off.\n- **Thursday — Upper Hypertrophy:** incline bench, flyes, cable and dumbbell rows, lateral raises and arms, all at 8–12.\n- **Friday — Lower Hypertrophy:** front squats, lunges, leg extensions and curls, and two calf movements at 8–15.\n\n### The rules that make it work\n\nLeave at least a rep in the tank on every set, rest properly on the heavy compounds (three to five minutes is normal), and don't stack both power days or both hypertrophy days back to back. Run it in blocks of about four weeks and push the power numbers up a little each block.\n\n### Try it yourself\n\nLoad **PHUL — Power Hypertrophy Upper Lower** from **Preset Programs**, or pick **4 — PHUL** under Days a week in **Build a Program** to get the same power/hypertrophy week built in our warm-up-and-blocks format, fitted to your equipment.\n\n---\n\n**Source:** Brandon Campbell, [\"Power Hypertrophy Upper Lower (P.H.U.L.) Workout\"](https://www.muscleandstrength.com/workouts/phul-workout), Muscle & Strength. This post summarizes the program in our own words — read the original for the full write-up.",
      status: 'published'
    },
    {
      id: 'p34', title: "PHAT: Layne Norton's Power and Pump in One Week",
      slug: 'phat-layne-norton', category: 'Health & Appearance',
      date: '2026-10-21', author: 'Coach KA', views: 0,
      cover: '', tags: ['powerbuilding',  'hypertrophy',  'strength',  'program-design'],
      excerpt: "Two heavy days, three size days, and a speed-work opener most programs forget: how a natural pro bodybuilder and powerlifter trained both qualities at once.",
      body: "## Built by someone who competed at both\n\nDr Layne Norton competed as a natural pro bodybuilder and a powerlifter, and **PHAT — Power Hypertrophy Adaptive Training** — is how he trained for both at once. It's a five-day week for lifters with a few years behind them.\n\n### The week\n\n- **Day 1 — Upper Body Power:** rows and dumbbell presses at 3–5 reps, then pull-ups, chins, dips, shoulder presses and arms at 6–10.\n- **Day 2 — Lower Body Power:** squats at 3–5, then hack squats, extensions, stiff-legged deadlifts, hamstrings and calves.\n- **Day 3:** rest.\n- **Day 4 — Back & Shoulders Hypertrophy**, **Day 5 — Lower Body Hypertrophy**, **Day 6 — Chest & Arms Hypertrophy:** 8–20 reps, 1–2 minutes' rest.\n- **Day 7:** rest.\n\n### The speed-work opener\n\nEach hypertrophy day starts with **6 sets of 3** on that day's power lift at **65–70% of your 3–5 rep max**, moved as fast as you can with no more than 90 seconds' rest. If the bar slows, it's too heavy. It keeps the power days' skill sharp without adding fatigue.\n\n### Norton's guard rails\n\nRest as long as you need on the power days — five or six minutes is fine. Stop a rep or two short of failure on the size days, only go to failure on the last set or two, and not at all for the first few weeks. Rotate the power movements every two to three weeks and deload every 6–12 weeks. Newer lifters: drop one assistance exercise per day until you adapt.\n\n### Try it yourself\n\nLoad **PHAT** from **Preset Programs**, or pick **5 — PHAT** under Days a week in **Build a Program** — the speed work opens each hypertrophy day automatically, on the same lift as the power day.\n\n---\n\n**Source:** Layne Norton, [\"PHAT: Power Hypertrophy Adaptive Training\"](https://biolayne.com/articles/training/phat-power-hypertrophy-adaptive-training/), biolayne.com. This post summarizes the program in our own words — read the original for Norton's full explanation.",
      status: 'published'
    },
    {
      id: 'p35', title: "Doug Hepburn's Program B: Singles for Power, Fives for Size",
      slug: 'doug-hepburn-program-b', category: 'Health & Appearance',
      date: '2026-10-21', author: 'Coach KA', views: 0,
      cover: '', tags: ['old-school',  'strength',  'powerlifting',  'program-design'],
      excerpt: "Program A built Hepburn's strength with 2s and 3s. Program B goes heavier still — singles first, then the fives that put the size on.",
      body: "## The other half of Hepburn's method\n\nOur post on Doug Hepburn's Program A covered the famous 2s-and-3s ladder. Hepburn also trained with a second, heavier scheme — usually called **Program B** — that pairs a power part with a pump part on each lift.\n\n### The scheme, lift by lift\n\n- **Power:** singles with a weight you could lift **three times**. Start with 5 singles; add one single each workout until you reach 8; then add 5–10 lb and go back to 5.\n- **Pump:** straight after, **6 sets of 3** with a weight you could lift **eight times**. Add a rep to one set each workout until it reads 6 × 5; then add weight and start again at 3s.\n\nSquat and bench on Monday and Thursday, deadlift and overhead press on Tuesday and Friday is a common way to set out the week.\n\n### What Hepburn himself said\n\nAsked about his bench routine, Hepburn described it as roughly **singles, then fives** — and said he rarely ran exactly the same scheme twice. The singles get the body used to a single maximal effort; the fives add the volume that builds muscle.\n\n### A word of caution\n\nThis is demanding. Most write-ups suggest running it for about six weeks and then switching to something lighter. Hepburn never published a definitive \"Program B\" himself, so the numbers vary a little between sources.\n\n### Try it yourself\n\nLoad **Doug Hepburn's Program B** from **Preset Programs**, or pick **Hepburn Program B on each A1** as the Method in **Build a Program** to run it on each day's main lift inside our format.\n\n---\n\n**Sources:** Dresdin Archibald, [\"The Doug Hepburn Bench Press Success Formula\"](https://breakingmuscle.com/the-doug-hepburn-bench-press-success-formula/), Breaking Muscle, and a [StrongFirst forum summary](https://www.strongfirst.com/community/goto/post?id=260685) of Mike Mahler's T-Nation article on Hepburn's method.",
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
      if (typeof tryRestorePendingSlug === 'function') tryRestorePendingSlug();
    }
  }
  function savePosts(){
    // Only push rows that actually changed since the last save — diffing
    // against postsSnapshot instead of re-upserting every real post every
    // time. With enough posts, blindly re-uploading the whole table on
    // every save (even a single view-count bump) fires a large burst of
    // simultaneous requests that can intermittently fail together and
    // trip the "Could not save" alert below for no real reason.
    const oldById = new Map(postsSnapshot.map(x=>[x.id, x]));
    const newIds = new Set(posts.map(x=>x.id));
    const removedIds = [...oldById.keys()].filter(id => !newIds.has(id));
    const changedRows = posts
      .filter(p => p.id && p.id.length === 36)
      .filter(p => {
        const old = oldById.get(p.id);
        return !old || JSON.stringify(old) !== JSON.stringify(p);
      })
      .map(postToRow);
    postsSnapshot = posts.slice();
    (async () => {
      const results = await Promise.allSettled(changedRows.map(row => bnbClient.from('blog_posts').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('blog_posts').delete().eq('id', id)));
      const successCount = results.filter(r => r.status === 'fulfilled' && !(r.value && r.value.error)).length;
      if (successCount === 0 && changedRows.length > 0){
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
    const heroCount = document.getElementById('blog-admin-hero-count');
    if (heroCount) heroCount.textContent = megatronSlides.length + ' slide' + (megatronSlides.length===1?'':'s');
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
  const postsReady = refreshPostsFromSupabase(); // async — replaces seed data once Supabase responds
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
      // Pictures: ![caption](url). Same URL rules as links below, before
      // them so the link pattern doesn't swallow the [caption](url) part.
      t = t.replace(/!\[(.*?)\]\((.+?)\)/g, (match, alt, url) => {
        if (!/^(https?:|\/)/i.test(url)) return '';
        return '<img src="' + url.replace(/"/g, '&quot;') + '" alt="' + alt.replace(/"/g, '&quot;') + '" loading="lazy">';
      });
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
      if (/^(-{3,}|\*{3,})$/.test(line)){ if(inList){html+='</ul>';inList=false;} html += '<hr>'; return; }
      if (line.startsWith('> ')){ if(inList){html+='</ul>';inList=false;} html += '<blockquote>'+inline(line.slice(2))+'</blockquote>'; return; }
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
  // Category cards (icon, name, published-post count) — clicking one
  // filters the post grid below, same as the old pills.
  const TOPIC_ICONS = { all: '📚', 'Recreation': '🏕️', 'Health & Appearance': '💪', 'Wealth & Finance': '💰',
    'Love & Relationships': '❤️', 'Community & Charity': '🤝', 'Career': '💼', 'Personal Development': '🌱' };
  function renderCategoryChips(){
    const cats = ['all', ...BLOG_TOPICS];
    const bar = document.getElementById('cat-filter');
    const published = posts.filter(p => p.status === 'published');
    bar.innerHTML = '';
    cats.forEach(c=>{
      const n = c === 'all' ? published.length : published.filter(p => p.category === c).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-card' + (c === activeCategory ? ' active' : '') + (n === 0 ? ' empty' : '');
      btn.innerHTML = '<span class="cat-card-icon" aria-hidden="true">' + (TOPIC_ICONS[c] || '🏷️') + '</span>'
        + '<span class="cat-card-name">' + esc(c === 'all' ? 'All' : c) + '</span>'
        + '<span class="cat-card-count">' + n + ' post' + (n === 1 ? '' : 's') + '</span>';
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
    // Reflects the open post in the URL (#blog:<slug>) so the address bar
    // is actually shareable — see the Share button in renderPost() and
    // restoreInitialHash()/tryRestorePendingPost() for the read side.
    if (p) history.replaceState(null, '', '#blog:' + p.slug);
  }

  // A page load (or the shell's restoreInitialHash()) that starts on
  // #blog:<slug> stashes the slug here before this module has even
  // fetched its posts — retried once synchronously (seed data) and again
  // once Supabase responds, since a real post's slug usually only exists
  // in the Supabase-loaded set, not the legacy seed fallback.
  function tryRestorePendingSlug(){
    const slug = window.__bnbPendingBlogSlug;
    if (!slug) return;
    const match = posts.find(p => p.slug === slug && p.status === 'published');
    if (match){
      window.__bnbPendingBlogSlug = null;
      openPost(match.id);
    }
  }

  /* ---------------- SIDEBAR: TRENDING / NEWEST ---------------- */
  let sideSort = 'newest';

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

  /* ---------------- FEATURED READING ----------------
     The original articles behind our program write-ups, by their own
     authors. We link out to them rather than reprinting them: a short
     summary in our words, the original's title, author and site, and a
     button to read it where it was published. `post` is the slug of our
     own write-up of the same program. */
  const FEATURED_READING = [
    { title:'PHAT: Power Hypertrophy Adaptive Training', author:'Layne Norton', site:'biolayne.com', year:'2016',
      url:'https://biolayne.com/articles/training/phat-power-hypertrophy-adaptive-training/', post:'phat-layne-norton',
      summary:'The five-day power and hypertrophy split in Norton\u2019s own words, with his rules on rest, failure, speed work and deloads.' },
    { title:'Power Hypertrophy Upper Lower (P.H.U.L.) Workout', author:'Brandon Campbell', site:'Muscle & Strength', year:'2013',
      url:'https://www.muscleandstrength.com/workouts/phul-workout', post:'phul-power-hypertrophy-upper-lower',
      summary:'The original PHUL write-up: two power days, two hypertrophy days, every muscle twice a week.' },
    { title:'Stronglifts 5×5: The Complete Workout Guide', author:'Mehdi Hadim', site:'StrongLifts', year:'',
      url:'https://stronglifts.com/5x5/', post:'stronglifts-5x5',
      summary:'The full StrongLifts guide: workouts A and B, how much to add each session, and what to do when you stall.' },
    { title:'The 5x5 Workout Explained: The Classic Program for Size and Strength', author:'Chris Colucci', site:'Breaking Muscle', year:'2023',
      url:'https://breakingmuscle.com/5-x-5-workout-explained/', post:'reg-park-5x5',
      summary:'Where 5×5 came from — Reg Park\u2019s three phases and Bill Starr\u2019s heavy, light and medium week, side by side.' },
    { title:'5x5 Workout: Your Complete Training Guide', author:'Greg Merritt', site:'The Barbell', year:'',
      url:'https://thebarbell.com/5x5-workout/', post:'bill-starr-5x5',
      summary:'A wide look at the 5×5 family, from Bill Starr\u2019s original to the versions lifters run today.' },
    { title:'The Doug Hepburn Bench Press Success Formula', author:'Dresdin Archibald', site:'Breaking Muscle', year:'2012',
      url:'https://breakingmuscle.com/the-doug-hepburn-bench-press-success-formula/', post:'doug-hepburn-program-b',
      summary:'Hepburn\u2019s own description of how he trained the bench: singles, then fives — and why he rarely repeated a scheme.' },
    { title:'Double progression', author:'Benjamin Schnabel', site:'Alpha Progression', year:'',
      url:'https://alphaprogression.com/en/glossary/double-progression', post:'double-progression-explained-simply',
      summary:'The rule behind most rep ranges: reps first, then weight — and where it comes from.' }
  ];
  function renderFeatured(){
    const box = document.getElementById('featured-reading');
    if (!box) return;
    // Only on the unfiltered list (or the training topic), not over a search.
    if (searchTerm || (activeCategory !== 'all' && activeCategory !== 'Health & Appearance')){ box.innerHTML = ''; return; }
    box.innerHTML = `
      <div class="fr-head"><span class="fr-kicker">Featured reading</span>
        <span class="fr-note">The original articles behind our program write-ups, by their own authors. We summarize and link to them — the full articles belong to their writers.</span></div>
      <div class="fr-row">${FEATURED_READING.map((f, i) => {
        const ours = posts.find(p => p.slug === f.post && p.status === 'published');
        return `<article class="fr-card">
          <div class="fr-site">${esc(f.site)}</div>
          <h3>${esc(f.title)}</h3>
          <div class="fr-by">by ${esc(f.author)}${f.year ? ' · ' + esc(f.year) : ''}</div>
          <p>${esc(f.summary)}</p>
          <div class="fr-actions">
            <a class="fr-read" href="${escAttr(f.url)}" target="_blank" rel="noopener">Read the original →</a>
            ${ours ? `<button type="button" class="fr-ours" data-fr="${i}">Our write-up</button>` : ''}
          </div>
        </article>`; }).join('')}</div>`;
    box.querySelectorAll('[data-fr]').forEach(b => b.onclick = () => {
      const p = posts.find(x => x.slug === FEATURED_READING[b.dataset.fr].post && x.status === 'published');
      if (p) openPost(p.id);
    });
  }

  /* ---------------- LIST VIEW ---------------- */
  function renderList(){
    renderCategoryChips();
    renderSideList();
    renderFeatured();
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
      <div class="meta">
        <span>${esc(p.author||'')} &nbsp;·&nbsp; ${fmtDate(p.date)}</span>
        <button class="share-btn" id="post-share-btn" type="button">&#x2197; Share</button>
      </div>
      <div class="post-body">${mdToHtml(p.body)}</div>
      ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
    `;

    const shareBtn = document.getElementById('post-share-btn');
    shareBtn.addEventListener('click', async ()=>{
      const shareUrl = location.origin + location.pathname + '#blog:' + p.slug;
      if (navigator.share){
        try { await navigator.share({ title: p.title, text: p.excerpt||'', url: shareUrl }); }
        catch(err){ /* user closed the share sheet without picking anything — not an error */ }
        return;
      }
      // Desktop/unsupported-browser fallback: copy the link instead.
      try {
        await navigator.clipboard.writeText(shareUrl);
        const original = shareBtn.textContent;
        shareBtn.textContent = 'Link copied!';
        setTimeout(()=> shareBtn.textContent = original, 2000);
      } catch(err){
        prompt('Copy this link:', shareUrl);
      }
    });
  }
  document.getElementById('back-to-list').addEventListener('click', ()=>{
    switchView('list'); renderList();
    history.replaceState(null, '', '#blog');
  });

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
  // Scroll so el sits just below the sticky site nav and this page's own
  // sticky header (both vary in height, so measure them at click time).
  function scrollBelowHeaders(el){
    if (!el) return;
    const nav = document.querySelector('.outer-header');
    const head = el.closest('.site-page') && el.closest('.site-page').querySelector('header.site');
    const offset = (nav ? nav.getBoundingClientRect().height : 0) + (head ? head.getBoundingClientRect().height : 0) + 12;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  }

  // Admin cards: Posts / Hero Slider, one section at a time.
  document.querySelectorAll('#blog-admin-subtabs [data-blog-admin]').forEach(card=>{
    card.addEventListener('click', ()=>{
      const key = card.dataset.blogAdmin;
      document.querySelectorAll('#blog-admin-subtabs [data-blog-admin]').forEach(c=> c.classList.toggle('active', c===card));
      document.getElementById('blog-admin-posts-panel').style.display = key === 'posts' ? '' : 'none';
      document.getElementById('blog-admin-hero-panel').style.display = key === 'hero' ? '' : 'none';
      scrollBelowHeaders(document.getElementById('blog-admin-' + key + '-panel'));
    });
  });
  document.querySelectorAll('#admin-thead-row th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if (blogSort.key === key) blogSort.dir = blogSort.dir === 'asc' ? 'desc' : 'asc';
      else { blogSort.key = key; blogSort.dir = 'asc'; }
      renderAdmin();
    });
  });
  function renderAdmin(){
    const postsCount = document.getElementById('blog-admin-posts-count');
    if (postsCount) postsCount.textContent = posts.length + ' post' + (posts.length===1?'':'s');
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
    showCover();
    setBodyView('write');
    updateCount();
    openedWith = editorState();
    backdrop.classList.add('show');
  }
  // Ask before throwing away typing (Cancel, or a click outside the panel).
  let openedWith = '';
  function editorState(){
    return JSON.stringify([fTitle.value, fSlug.value, fCategory.value, fDate.value, fAuthor.value, fCover.value, fTags.value, fExcerpt.value, fBody.value, currentStatus]);
  }
  function closeEditor(){
    if (editorState() !== openedWith && !confirm('Close without saving? Your changes to this post will be lost.')) return;
    backdrop.classList.remove('show');
  }
  document.getElementById('new-post-btn').addEventListener('click', ()=> openEditor(null));
  document.getElementById('panel-cancel').addEventListener('click', closeEditor);
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) closeEditor(); });

  /* ---- Pictures: upload to the public 'blog-images' bucket (sql/79-blog-images.sql) ---- */
  const BUCKET = 'blog-images';
  async function uploadImage(file, btn){
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024){ alert('That picture is over 5 MB. Pick a smaller one.'); return null; }
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Uploading…';
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = 'post-' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '.' + ext;
    const { error } = await bnbClient.storage.from(BUCKET).upload(path, file);
    btn.disabled = false; btn.textContent = label;
    if (error){
      console.error('Blog image upload failed:', error);
      alert('Upload failed: ' + (error.message || 'try again.') + '\n\nIf this keeps happening, sql/79-blog-images.sql may not have been run yet.');
      return null;
    }
    return bnbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  const coverPreview = document.getElementById('f-cover-preview');
  const coverFile = document.getElementById('f-cover-file');
  function showCover(){
    const src = fCover.value.trim();
    coverPreview.hidden = !/^(https?:|\/)/i.test(src);
    if (!coverPreview.hidden) coverPreview.src = src;
  }
  coverPreview.addEventListener('error', ()=> coverPreview.hidden = true);
  fCover.addEventListener('input', showCover);
  document.getElementById('f-cover-upload').addEventListener('click', ()=> coverFile.click());
  coverFile.addEventListener('change', async ()=>{
    const url = await uploadImage(coverFile.files[0], document.getElementById('f-cover-upload'));
    coverFile.value = '';
    if (url){ fCover.value = url; showCover(); }
  });

  /* ---- Formatting buttons: write the Markdown for the owner ---- */
  function wrapSelection(before, after, placeholder){
    const a = fBody.selectionStart, b = fBody.selectionEnd;
    const picked = fBody.value.slice(a, b) || placeholder;
    fBody.setRangeText(before + picked + after, a, b, 'end');
    fBody.setSelectionRange(a + before.length, a + before.length + picked.length);
  }
  // Puts a prefix on every line the selection touches (headings, lists, quotes).
  function prefixLines(prefix, placeholder){
    const v = fBody.value;
    const a = v.lastIndexOf('\n', fBody.selectionStart - 1) + 1;
    let b = v.indexOf('\n', fBody.selectionEnd); if (b < 0) b = v.length;
    const block = v.slice(a, b) || placeholder;
    const out = block.split('\n').map(l => prefix + l.replace(/^(#{1,3} |- |> )/, '')).join('\n');
    fBody.setRangeText(out, a, b, 'end');
  }
  // Goes at the end of the current line (never over the selection or
  // inside a link or bold), on lines of its own.
  function insertBlock(text){
    let a = fBody.value.indexOf('\n', fBody.selectionEnd);
    if (a < 0) a = fBody.value.length;
    const pre = a > 0 && fBody.value[a-1] !== '\n' ? '\n\n' : '';
    fBody.setRangeText(pre + text + '\n\n', a, a, 'end');
  }
  const bodyFile = document.getElementById('f-body-file');
  document.querySelectorAll('#f-body-bar [data-md]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      setBodyView('write');
      fBody.focus();
      const kind = btn.dataset.md;
      if (kind === 'h2') prefixLines('## ', 'Heading');
      else if (kind === 'h3') prefixLines('### ', 'Subheading');
      else if (kind === 'bold') wrapSelection('**', '**', 'bold text');
      else if (kind === 'italic') wrapSelection('*', '*', 'italic text');
      else if (kind === 'list') prefixLines('- ', 'List item');
      else if (kind === 'quote') prefixLines('> ', 'Quote');
      else if (kind === 'hr') insertBlock('---');
      else if (kind === 'link'){
        const url = prompt('Link address (starts with https://):', 'https://');
        if (!url || url === 'https://') return;
        wrapSelection('[', '](' + url.trim() + ')', 'link text');
      }
      else if (kind === 'image') bodyFile.click();
      updateCount();
    });
  });
  bodyFile.addEventListener('change', async ()=>{
    const url = await uploadImage(bodyFile.files[0], document.querySelector('#f-body-bar [data-md=image]'));
    bodyFile.value = '';
    if (!url) return;
    const caption = (prompt('Caption for the picture (optional):', '') || '').replace(/[\[\]]/g, '');
    setBodyView('write');
    insertBlock('![' + caption + '](' + url + ')');
    updateCount();
  });

  /* ---- Write / Preview ---- */
  const bodyPreview = document.getElementById('f-body-preview');
  function setBodyView(view){
    document.querySelectorAll('#f-body-mode button').forEach(x=> x.classList.toggle('active', x.dataset.view === view));
    fBody.hidden = view === 'preview';
    bodyPreview.hidden = view !== 'preview';
    if (view === 'preview') bodyPreview.innerHTML = mdToHtml(fBody.value) || '<p class="field-hint">Nothing written yet.</p>';
  }
  document.querySelectorAll('#f-body-mode button').forEach(b=> b.addEventListener('click', ()=> setBodyView(b.dataset.view)));
  const bodyCount = document.getElementById('f-body-count');
  function updateCount(){
    const words = (fBody.value.match(/[A-Za-z0-9\u00C0-\u024F'’]+/g) || []).length;
    bodyCount.textContent = words + ' word' + (words === 1 ? '' : 's') + (words ? ' · about ' + Math.max(1, Math.round(words / 200)) + ' min read' : '');
  }
  fBody.addEventListener('input', updateCount);

  document.getElementById('panel-save').addEventListener('click', ()=>{
    if (!fTitle.value.trim()){ alert('Give the post a title first.'); return; }
    const tags = fTags.value.split(',').map(t=>t.trim()).filter(Boolean);
    const slug = slugify(fSlug.value) || slugify(fTitle.value);
    // The slug is the post's link (#blog:slug) and must be unique in the database.
    if (posts.some(x => x.slug === slug && x.id !== editingId)){
      alert('Another post already uses the link "' + slug + '". Change the slug (or the title) a little.');
      fSlug.focus(); return;
    }
    if (currentStatus === 'published' && !fBody.value.trim() && !confirm('This post has no body yet. Publish it anyway?')) return;
    const data = {
      title: fTitle.value.trim(),
      slug: slug,
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
      // Keep the view count (it isn't on the form, so it would reset to 0).
      posts[idx] = Object.assign({id: editingId, views: posts[idx].views || 0}, data);
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
        // Merge, don't replace: a post missing from the file stays (a
        // straight replace would delete it from the database on save).
        // A post matches by id, then by slug; anything new gets a fresh id.
        let added = 0, updated = 0;
        parsed.forEach(raw=>{
          if (!raw || !raw.title) return;
          const idx = posts.findIndex(x => (raw.id && x.id === raw.id) || (raw.slug && x.slug === raw.slug));
          if (idx >= 0){ posts[idx] = Object.assign({}, posts[idx], raw, { id: posts[idx].id }); updated++; }
          else { posts.push(Object.assign({ status: 'draft', tags: [] }, raw, { id: window.BNB_UUID(), slug: raw.slug || slugify(raw.title) })); added++; }
        });
        savePosts(); renderAdmin();
        alert('Imported: ' + added + ' new, ' + updated + ' updated. Posts not in the file were left alone.');
      } catch(err){ alert('That file could not be read as a valid posts JSON export.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  // Admin > Content opens the editor from outside the blog page.
  window.BNB_BLOG = {
    ready: postsReady,
    list: () => posts.slice(),
    showAdmin(){ switchView('admin'); renderAdmin(); renderMegatronAdmin(); },
    newPost: () => openEditor(null),
    edit: id => { if (posts.some(x => x.id === id)) openEditor(id); }
  };

  /* ---------------- INIT ---------------- */
  document.addEventListener('bnb-gallery-updated', renderMegatron);
  renderList();
  renderMegatron();
  renderAdmin();
  renderMegatronAdmin();
  tryRestorePendingSlug();

})();
