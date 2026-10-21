/* =========================================================================
   BELL(E)S N' BARZ — BUILD A PROGRAM (Coach > Program Builder)
   Makes a program in the Training Manual's own format from what a client
   has to train with: pick the equipment, days a week, goal and session
   length, and it lays out each day as
     Warm-up (Pulse, Mobilize, Core, Activate, Potentiate)
     → Block A … E (A1/A2 pairs, rest by block tier)
     → ★ Signature Hold,
   plus an optional Sunday recovery. Each day's Block A1 is the lift that
   runs Hepburn double progression by default. On top of that base sit
   optional switches from named methods: PHUL / PHAT splits, a set scheme
   (StrongLifts, Bill Starr or Reg Park 5×5, Gironda 8×8, German Volume 10×10, Hepburn A or B) and the
   progression rule. Rule-based, no AI: the same choices
   give the same program, and "Shuffle exercises" picks other options.
   The coach previews it and loads it for the selected client, the same
   way as a preset (window.bnbLoadProgramForClient in training-core).
   Loaded on demand when Program Builder opens (bnbLoadModule).
   ========================================================================= */
(function(){

  const EQUIPMENT = [
    ['db', 'Dumbbells'], ['bench', 'Bench'], ['bb', 'Barbell & plates'],
    ['cable', 'Cables & machines'], ['bar', 'Pull-up / dip bar']
  ];
  const EQ_NAME = { db:'Dumbbell', bb:'Barbell', bench:'Bench', cable:'Cable/Machine', bar:'Bar' };

  /* Exercise library: movement pattern → options, best first when the
     equipment is there. [name, needs, dose] — needs is the equipment it
     can't do without (bodyweight needs nothing); dose overrides the goal's
     sets/reps: { reps, sets, per } where per is '/leg' or '/side'. */
  const L = {
    squat: [['Back Squat', ['bb']], ['Heel-Elevated Goblet Squat', ['db']], ['Zercher Squat', ['bb']], ['Goblet Squat', ['db']], ['Tempo Bodyweight Squat (3 sec down)', []]],
    hinge: [['Romanian Deadlift', ['bb']], ['Dumbbell Romanian Deadlift', ['db']], ['Trap Bar / Conventional Deadlift', ['bb']], ['Single-Leg Dumbbell RDL', ['db'], { per:'/leg' }], ['Single-Leg RDL (bodyweight)', [], { per:'/leg' }]],
    lunge: [['Bulgarian Split Squat', ['db', 'bench'], { per:'/leg' }], ['Dumbbell Reverse Lunge', ['db'], { per:'/leg' }], ['Walking Lunges', ['db'], { per:'/leg' }], ['Bulgarian Split Squat (bodyweight)', ['bench'], { per:'/leg' }], ['Reverse Lunge', [], { per:'/leg' }]],
    stepup: [['Dumbbell Step-Up', ['db', 'bench'], { per:'/leg' }], ['Barbell Step-Up', ['bb', 'bench'], { per:'/leg' }], ['Step-Up (stairs or a box)', [], { per:'/leg' }]],
    lateral_leg: [['Goblet Cossack Squat', ['db'], { per:'/leg' }], ['Cossack Squats', [], { per:'/leg' }]],
    quad_iso: [['Leg Extensions', ['cable']], ['Dumbbell Spanish Squat (feet hooked)', ['db']], ['Reverse Nordic Curl', []]],
    adductor: [['Copenhagen Plank', ['bench'], { reps:'20–30 sec', per:'/side' }], ['Short-Lever Copenhagen Plank (knee on a chair)', [], { reps:'20–30 sec', per:'/side' }]],
    hipflexor: [['Standing Cable Hip Flexion', ['cable'], { per:'/side' }], ['Hanging Knee Raise', ['bar']], ['Seated Knee Raise (dumbbell on thigh)', ['db'], { per:'/side' }], ['Standing Knee Drive', [], { per:'/side' }]],
    hamcurl: [['Lying Leg Curls', ['cable']], ['Nordic Curls', [], { sets:'4', reps:'3–5' }], ['Slider Leg Curl', []]],
    glute: [['Barbell Hip Thrust', ['bb', 'bench']], ['Dumbbell Hip Thrust', ['db', 'bench']], ['Dumbbell Glute Bridge', ['db']], ['Single-Leg Glute Bridge', [], { per:'/leg' }]],
    calf: [['Standing Calf Raises', ['cable'], { reps:'15–20' }], ['Standing Dumbbell Calf Raise', ['db'], { reps:'15–20' }], ['Single-Leg Calf Raise', [], { reps:'15–20', per:'/leg' }]],
    lowback: [['Back Extensions', ['cable'], { reps:'12–15' }], ['Dumbbell Good Morning', ['db'], { reps:'12–15' }], ['Prone Superman', [], { reps:'12–15' }]],
    hpush: [['Barbell Bench Press', ['bb', 'bench']], ['Flat Dumbbell Bench Press', ['db', 'bench']], ['Dumbbell Floor Press', ['db']], ['Push-ups', []]],
    hpush_incline: [['Incline Barbell Bench Press', ['bb', 'bench']], ['Incline Dumbbell Press', ['db', 'bench']], ['Dumbbell Floor Press (feet up)', ['db']], ['Feet-Elevated Push-ups', []]],
    pushup: [['Deficit Push-ups (hands on dumbbells)', ['db'], { reps:'15–20' }], ['Push-ups', [], { reps:'15–20' }]],
    dips: [['Dips', ['bar']], ['Bench Dips', ['bench']], ['Diamond Push-ups', []]],
    chest_iso: [['Cable Flyes', ['cable']], ['Dumbbell Flyes', ['db', 'bench']], ['Wide Push-ups', []]],
    hpull: [['Chest-Supported Dumbbell Row', ['db', 'bench']], ['Barbell Row', ['bb']], ['Seated Cable Row', ['cable']], ['Bent-Over Dumbbell Row', ['db']], ['Inverted Row (under a sturdy table)', []]],
    hpull_uni: [['Single-Arm Dumbbell Row', ['db'], { per:'/side' }], ['Single-Arm Cable Row', ['cable'], { per:'/side' }], ['T-Bar Row', ['bb']], ['Inverted Row (under a sturdy table)', []]],
    vpush: [['Military Press', ['bb']], ['Half-Kneeling Single-Arm Dumbbell Press', ['db'], { per:'/side' }], ['Seated Arnold Press', ['db', 'bench']], ['Pike Push-ups', []]],
    vpull: [['Weighted Pull-ups', ['bar']], ['Wide Cable Lat Pulldowns', ['cable']], ['Dumbbell Pullover', ['db', 'bench']], ['Floor Pullover', ['db']], ['Inverted Row (under a sturdy table)', []]],
    pullover: [['Pullovers', ['db', 'bench']], ['Straight-Arm Pulldowns', ['cable']], ['Floor Pullover', ['db']], ['Prone Y-Raise', []]],
    lateral: [['Dumbbell Lateral Raise', ['db']], ['Cable Lateral Raise', ['cable']], ['Prone Y-Raise', []]],
    reardelt: [['Face Pulls', ['cable']], ['Bent-Over Rear Delt Fly', ['db']], ['Prone Reverse Fly', []]],
    trap: [['Dumbbell Shrug', ['db']], ['Barbell Shrug', ['bb']], ['Scapular Pull-ups', ['bar']], ['Prone Y-T-W Raises', []]],
    triceps: [['Overhead Dumbbell Triceps Extension', ['db']], ['Cable Pushdowns', ['cable']], ['Close-Grip Bench Press', ['bb', 'bench']], ['Bench Dips', ['bench']], ['Diamond Push-ups', []]],
    biceps: [['Incline Dumbbell Curl', ['db', 'bench']], ['E-Z Bar Curl', ['bb']], ['Hammer Curl', ['db']], ['Cable Curl', ['cable']], ['Chin-ups', ['bar']], ['Towel Isometric Curl', [], { reps:'30 sec' }]],
    carry: [["Farmer's Carry", ['db'], { reps:'40 m' }], ['Suitcase Carry', ['db'], { reps:'20 m', per:'/side' }], ['Bear Crawl', [], { reps:'20 m' }]]
  };

  /* Day templates: a focus (warm-up, potentiation and hold follow it) and
     its blocks as pairs of patterns, A first. */
  const DAYS = {
    fbA: { title:'Full Body A — Squat, Horizontal Push & Pull', focus:'squat', core:true,
      blocks:[['squat', 'hpull'], ['hpush', 'hpull_uni'], ['lateral_leg', 'lateral'], ['adductor', 'calf'], ['triceps', 'biceps']] },
    fbB: { title:'Full Body B — Hinge, Single Leg & Overhead', focus:'hinge', core:true,
      blocks:[['hinge', 'vpush'], ['lunge', 'vpull'], ['glute', 'reardelt'], ['hamcurl', 'trap'], ['hipflexor', 'lowback']] },
    fbC: { title:'Full Body C — Chest, Shoulders & Arms + Carry', focus:'push', core:true,
      blocks:[['hpush_incline', 'hpull'], ['stepup', 'lateral'], ['triceps', 'biceps'], ['pushup', 'biceps'], ['carry']] },
    fb2A: { title:'Full Body A — Squat, Push & Pull', focus:'squat', core:true,
      blocks:[['squat', 'hpull'], ['hpush', 'vpull'], ['lunge', 'lateral'], ['adductor', 'calf'], ['triceps', 'biceps']] },
    fb2B: { title:'Full Body B — Hinge, Press & Row', focus:'hinge', core:true,
      blocks:[['hinge', 'vpush'], ['hpush_incline', 'hpull_uni'], ['glute', 'reardelt'], ['hamcurl', 'hipflexor'], ['carry']] },
    upH: { title:'Upper — Rows & Bench Presses', focus:'push', core:true,
      blocks:[['hpush_incline', 'hpull'], ['hpush', 'hpull_uni'], ['chest_iso', 'reardelt'], ['triceps', 'biceps'], ['lateral']] },
    loQ: { title:'Lower — Quads, Adductors & Hip Flexors', focus:'squat', core:false,
      blocks:[['squat', 'hamcurl'], ['lunge', 'lateral_leg'], ['adductor', 'hipflexor'], ['calf'], ['carry']] },
    upV: { title:'Upper — Vertical Push & Pull', focus:'pull', core:true,
      blocks:[['vpush', 'vpull'], ['lateral', 'pullover'], ['trap', 'reardelt'], ['triceps', 'biceps'], ['carry']] },
    loG: { title:'Lower — Glutes, Hamstrings & Low Back', focus:'hinge', core:false,
      blocks:[['hinge', 'lunge'], ['glute', 'hamcurl'], ['stepup', 'adductor'], ['calf'], ['lowback']] },
    arms: { title:'Chest & Arms', focus:'push', core:true,
      blocks:[['pushup', 'dips'], ['triceps', 'biceps'], ['chest_iso', 'biceps'], ['lateral', 'reardelt']] },
    // PHUL (Brandon Campbell): heavy days at 3–5 reps, size days at 8–12.
    phulUP: { title:'Upper Power', focus:'push', core:true, style:'power',
      blocks:[['hpush', 'hpull'], ['hpush_incline', 'vpull'], ['vpush', 'biceps'], ['triceps']] },
    phulLP: { title:'Lower Power', focus:'squat', core:false, style:'power',
      blocks:[['squat', 'hamcurl'], ['hinge', 'calf'], ['lunge', 'quad_iso']] },
    phulUH: { title:'Upper Hypertrophy', focus:'push', core:true, style:'hyper',
      blocks:[['hpush_incline', 'hpull'], ['chest_iso', 'hpull_uni'], ['lateral', 'biceps'], ['triceps']] },
    phulLH: { title:'Lower Hypertrophy', focus:'squat', core:false, style:'hyper',
      blocks:[['squat', 'lunge'], ['quad_iso', 'hamcurl'], ['calf']] },
    // PHAT (Layne Norton): two power days, three size days opening with speed work.
    phatUP: { title:'Upper Body Power', focus:'pull', core:true, style:'power',
      blocks:[['hpull', 'vpull'], ['hpush', 'dips'], ['vpush', 'biceps'], ['triceps']] },
    phatLP: { title:'Lower Body Power', focus:'squat', core:false, style:'power',
      blocks:[['squat', 'quad_iso'], ['hinge', 'hamcurl'], ['calf']] },
    phatBS: { title:'Back & Shoulders Hypertrophy', focus:'pull', core:true, style:'hyper', speed:true,
      blocks:[['hpull', 'vpull'], ['hpull_uni', 'trap'], ['vpush', 'lateral'], ['reardelt']] },
    phatLH: { title:'Lower Body Hypertrophy', focus:'squat', core:false, style:'hyper', speed:true,
      blocks:[['squat', 'lunge'], ['quad_iso', 'hinge'], ['hamcurl', 'calf']] },
    phatCA: { title:'Chest & Arms Hypertrophy', focus:'push', core:true, style:'hyper', speed:true,
      blocks:[['hpush', 'hpush_incline'], ['chest_iso', 'biceps'], ['triceps', 'biceps'], ['triceps']] }
  };
  // Days a week → which template on which weekday (rest days between where possible).
  const SPLITS = {
    '2': { name:'2-day full body', days:{ mon:'fb2A', thu:'fb2B' } },
    '3': { name:'3-day full body', days:{ mon:'fbA', wed:'fbB', fri:'fbC' } },
    '4': { name:'4-day upper / lower', days:{ mon:'upH', tue:'loQ', thu:'upV', fri:'loG' } },
    '4phul': { name:'4-day PHUL (power / hypertrophy)', days:{ mon:'phulUP', tue:'phulLP', thu:'phulUH', fri:'phulLH' } },
    '5': { name:'5-day split (the Training Manual’s)', days:{ mon:'upH', tue:'loQ', thu:'upV', fri:'loG', sat:'arms' } },
    '5phat': { name:'5-day PHAT (power / hypertrophy)', days:{ mon:'phatUP', tue:'phatLP', thu:'phatBS', fri:'phatLH', sat:'phatCA' } }
  };
  const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY_NAME = { mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday' };

  // Sets × reps and rest per block tier (A = the lift that drives the day).
  const GOALS = {
    muscle:   { name:'Build muscle', A:['4', '8–10'], B:['3', '10–12'], C:['3', '10–12'], D:['3', '12–15'], E:['3', '12–15'],
                rest:{ A:'90–120 sec', B:'60–90 sec', C:'60–90 sec', D:'45–60 sec', E:'45–60 sec' }, top:10 },
    strength: { name:'Get stronger', A:['5', '4–6'], B:['4', '6–8'], C:['3', '8–10'], D:['3', '10–12'], E:['3', '10–12'],
                rest:{ A:'2–3 min', B:'90–120 sec', C:'60–90 sec', D:'60 sec', E:'60 sec' }, top:6 },
    fitness:  { name:'Fitness & fat loss', A:['3', '10–12'], B:['3', '12–15'], C:['3', '12–15'], D:['2', '15–20'], E:['2', '15–20'],
                rest:{ A:'60–90 sec', B:'45–60 sec', C:'45–60 sec', D:'30–45 sec', E:'30–45 sec' }, top:12 }
  };
  // PHUL / PHAT days set their own sets × reps (the Goal applies to the other splits).
  const STYLES = {
    power: { name:'power', A:['4', '3–5'], B:['3', '6–10'], C:['3', '6–10'], D:['3', '6–10'], E:['3', '6–10'],
             rest:{ A:'3–5 min', B:'2–3 min', C:'2 min', D:'2 min', E:'2 min' }, top:5 },
    hyper: { name:'hypertrophy', A:['3', '8–12'], B:['3', '8–12'], C:['3', '8–12'], D:['2', '12–15'], E:['2', '15–20'],
             rest:{ A:'90–120 sec', B:'60–90 sec', C:'60–90 sec', D:'45–60 sec', E:'45–60 sec' }, top:12 }
  };
  // Bill Starr's week: heavy, light, medium (repeating for other day counts).
  const STARR_DAY = ['heavy day', 'light day, ~80% of heavy', 'medium day, ~90% of heavy'];
  const SPEED = { sets:'6', reps:'3 — speed work: explosive, 65–70% of your 3–5 rep max', rest:'90 sec max' };

  // Set schemes from named methods, layered on the manual's blocks.
  const METHODS = {
    manual:  { name:'The manual (sets × reps by goal)' },
    '5x5':   { name:'5×5 (StrongLifts) on the main lifts', progress:'linear' },
    starr:   { name:'Bill Starr 5×5 (ramping sets, heavy / light / medium days)', progress:'starr' },
    park:    { name:'Reg Park 5×5 (2 warm-up + 3 work sets)', progress:'park' },
    gironda: { name:'Gironda 8×8 (8 sets of 8, short rest)', progress:'gironda' },
    gvt:     { name:'German Volume Training (10×10 on Block A)', progress:'gvt', blocks:3 },
    hepA:    { name:'Hepburn Program A on each A1 (8×2→8×3, then pump)', progress:'own' },
    hepB:    { name:'Hepburn Program B on each A1 (singles, then fives)', progress:'own' }
  };
  const PROGRESS = {
    auto:    'The method’s own',
    hepburn: 'Hepburn double progression (A1)',
    linear:  'Linear — more weight every session',
    double:  'Double progression (golden-era style)'
  };
  const PROGRESS_NOTE = {
    hepburn: 'Hepburn: +1 rep a session, then add load',
    linear:  '+2.5 kg each session',
    double:  'top of the range on all sets → add weight',
    gironda: 'all 8 × 8 done → add weight',
    starr:   '5 reps on the 5th set → raise every set',
    park:    'all 3 work sets of 5 → add 5–10 lb',
    gvt:     'all 10 × 10 done → add 4–5%'
  };
  const LENGTHS = { 45:3, 60:4, 75:5 };   // minutes → how many blocks after the warm-up
  // The big lifts. Anything else paired into Block A (a lunge, a leg curl…)
  // is dosed like Block B, so a strength day doesn't ask for 5 × 4–6 Cossacks.
  const MAIN = ['squat', 'hinge', 'hpush', 'hpush_incline', 'hpull', 'vpush', 'vpull'];

  /* ---------------- Choosing exercises ---------------- */
  const has = (eq, needs) => needs.every(n => eq.has(n));
  // The options this equipment allows, best first.
  const options = (pattern, eq) => (L[pattern] || []).filter(o => has(eq, o[1]));
  // Pick one: among the two best options, rotated by `turn` so the same
  // pattern twice in a week (or after a shuffle) gets the other one. Only
  // options that use the kit take turns; bodyweight is the fallback when
  // nothing else fits, never a swap for a loaded move.
  function pick(pattern, eq, turn, heavy){
    let ok = options(pattern, eq);
    if (!ok.length) return null;
    // Power days want the barbell version when there is one.
    if (heavy) ok = ok.filter(o => o[1].includes('bb')).concat(ok.filter(o => !o[1].includes('bb')));
    const loaded = ok.filter(o => o[1].length);
    const pool = loaded.length ? loaded : ok;
    const best = pool.slice(0, Math.min(2, pool.length));
    const choice = best[turn % best.length];
    const alt = ok.find(o => o !== choice);
    return { name: choice[0], needs: choice[1], dose: choice[2] || {}, alt: alt ? alt[0] : '' };
  }
  const equipLabel = needs => needs.length ? needs.map(n => EQ_NAME[n]).join('/') : 'Bodyweight';

  function row(name, sets, reps, rest, alternates, equipment){
    return { name, rest: rest || '', tempo: '', equipment: equipment || '', alternates: alternates || '', sets: sets || '', reps: reps || '' };
  }

  // Warm-up in the manual's order, fitted to the day's focus and equipment.
  function warmup(day, eq, goal){
    const lower = day.focus === 'squat' || day.focus === 'hinge';
    const rows = [];
    rows.push(eq.has('cable') ? row('Rower', '', '5 min easy, last minute hard', '', 'Bike, Jump Rope', 'Machine')
                              : row('Jump Rope', '', '5 min', '', 'Jumping Jacks, High Knees', 'Bodyweight'));
    rows.push(lower ? row("World's Greatest Stretch", '1', '5 /side', '', 'Hip CARs, 90/90 Switches, Knee & Ankle CARs', 'Bodyweight')
                    : row('Thoracic Rotations', '1', '8 /side', '', 'Neck CARs, Shoulder CARs, Wall Slides, Wrist CARs', 'Bodyweight'));
    // Core slot on days without a heavy squat or hinge (the manual's rule); full-body days keep it light.
    if (day.core){
      rows.push(row('Dead Bug', '2', '10', '30–45 sec', 'Leg Drops', 'Bodyweight'));
      rows.push(eq.has('cable') ? row('Pallof Press', '2', '10 /side', '30–45 sec', 'Suitcase Carry', 'Cable')
              : eq.has('db') ? row('Suitcase Carry', '2', '20 m /side', '30–45 sec', 'Torso Rotations', 'Dumbbell')
              : row('Torso Rotations', '2', '10 /side', '30–45 sec', '', 'Bodyweight'));
    }
    rows.push(lower ? row('Glute Bridges', '1', '15', '', 'Monster Walks, Tibialis Raises, Bodyweight Squats', 'Bodyweight')
                    : row('Scapular Push-ups', '1', '10', '', 'Prone Y-T-W Raises, Scapular Pull-ups, Bear Crawl Hold', 'Bodyweight'));
    const pot = {
      squat: row('Jump Squats', '3', '5', '2 min', 'Box Jumps', 'Bodyweight'),
      hinge: row('Broad Jumps', '3', '3', '2 min', eq.has('db') ? 'Dumbbell Hang High Pull' : 'Kettlebell Swings', 'Bodyweight'),
      push: row('Plyometric Push-ups', '3', '5', '2 min', eq.has('db') ? 'Dumbbell Push Press' : 'Clap Push-ups', 'Bodyweight'),
      pull: eq.has('bar') ? row('Explosive Pull-ups', '3', '3', '2 min', 'Dumbbell Push Press', 'Bar')
                          : row('Dumbbell Push Press', '3', '3', '2 min', 'Plyometric Push-ups', 'Dumbbell')
    }[day.focus];
    if (pot && !(pot.equipment === 'Dumbbell' && !eq.has('db'))) rows.push(goal === 'fitness' ? Object.assign(pot, { rest:'60–90 sec' }) : pot);
    return { name:'Warm-up', exercises: rows };
  }

  function signatureHold(day, eq){
    const h = {
      squat: eq.has('db') ? row('Goblet Squat Bottom Hold', '', '45–60 sec', '', 'Horse Stance', 'Dumbbell') : row('Horse Stance', '', '45–60 sec', '', 'Deep Squat Hold', 'Bodyweight'),
      hinge: row('Single-Leg Glute Bridge Hold', '', '30–45 sec /side', '', 'Hip Airplane Hold', 'Bodyweight'),
      push: row('Push-up Plank Hold', '', '45–60 sec', '', '', 'Bodyweight'),
      pull: eq.has('bar') ? row('Scapular Hang', '', '30–45 sec', '', 'Flexed-Arm Hang', 'Bar')
          : eq.has('db') ? row("Farmer's Hold", '', '45–60 sec', '', '', 'Dumbbell') : row('Bear Crawl Hold', '', '30–45 sec', '', '', 'Bodyweight')
    }[day.focus];
    return { name:'★ Signature Hold', exercises:[h] };
  }

  function recoveryDay(eq){
    return [
      { name:'Movement Practice', exercises:[
        row('Deep Squat Hold', '', '90 sec', '', '', 'Bodyweight'),
        eq.has('bar') ? row('Dead Hang', '', '60–90 sec', '', '', 'Bar')
          : eq.has('db') ? row("Farmer's Hold", '', '60 sec', '', 'Dead Hang (with a bar)', 'Dumbbell')
          : row('Bear Crawl Hold', '', '30–45 sec', '', '', 'Bodyweight')
      ]},
      { name:'Core Finisher', exercises:[
        eq.has('cable') ? row('Cable Crunches', '2', '10–12', '', '', 'Cable') : eq.has('db') ? row('Dumbbell Crunch', '2', '10–12', '', '', 'Dumbbell') : row('Crunch', '2', '15', '', '', 'Bodyweight'),
        eq.has('cable') ? row('Back Extensions', '2', '10–12', '', '', 'Machine') : row('Prone Superman', '2', '10–12', '', '', 'Bodyweight'),
        eq.has('cable') ? row('Cable Side Bends', '2', '10–12 /side', '', '', 'Cable') : eq.has('db') ? row('Dumbbell Side Bend', '2', '10–12 /side', '', '', 'Dumbbell') : row('Side Plank', '2', '20–30 sec /side', '', '', 'Bodyweight')
      ]},
      { name:'Breath Work', exercises:[ row('Box Breathing', '', '3–5 min', '', '', 'None') ] }
    ];
  }

  /* The whole program: { data: { mon: [blocks] … }, days: [{ key, title, blocks }], summary } */
  function build(opts){
    const eq = new Set(opts.equipment);
    const goal = GOALS[opts.goal] || GOALS.muscle;
    const split = SPLITS[String(opts.days)] || SPLITS['3'];
    const method = METHODS[opts.method] ? opts.method : 'manual';
    const nBlocks = Math.min(LENGTHS[opts.minutes] || 4, METHODS[method].blocks || 9);
    const progress = opts.progress && opts.progress !== 'auto' ? opts.progress
      : METHODS[method].progress === 'own' ? '' : METHODS[method].progress || 'hepburn';
    // A method's sets × reps over the goal's, on one row.
    function applyMethod(r, { tier, pattern, first, timed, per, pump, dayIdx }){
      const suffix = per ? ' ' + per : '';
      if (method === '5x5' && MAIN.includes(pattern) && (tier === 'A' || tier === 'B'))
        Object.assign(r, { sets:'5', reps:'5' + suffix, rest: tier === 'A' ? '3 min' : '2–3 min' });
      else if (method === 'starr' && MAIN.includes(pattern) && (tier === 'A' || tier === 'B'))
        Object.assign(r, { sets:'5', reps:'5' + suffix + ' (each set heavier; ' + STARR_DAY[dayIdx % 3] + ')', rest:'2–3 min' });
      else if (method === 'park' && MAIN.includes(pattern) && (tier === 'A' || tier === 'B'))
        Object.assign(r, { sets:'5', reps:'5' + suffix + ' (2 warm-up sets, then 3 at one weight)', rest: tier === 'A' ? '3–5 min' : '2 min' });
      else if (method === 'gironda' && !timed)
        Object.assign(r, { sets:'8', reps:'8' + suffix, rest:'15–30 sec' });
      else if (method === 'gvt' && !timed)
        Object.assign(r, tier === 'A' ? { sets:'10', reps:'10' + suffix, rest:'90 sec' } : { sets:'3', reps:'10–12' + suffix, rest:'60 sec' });
      else if (method === 'hepA' && pump)
        Object.assign(r, { sets:'3', reps:'6 → 8 at ~65% (one more rep each workout; at 3 × 8 add weight)' });
      else if (method === 'hepA' && first)
        Object.assign(r, { sets:'8', reps:'2 → 3 (one more 3 each workout; at 8 × 3 add 5–10 lb)', rest:'3 min' });
      else if (method === 'hepB' && pump)
        Object.assign(r, { sets:'6', reps:'3 → 5 at your 8-rep weight (up to 6 × 5, then add weight)' });
      else if (method === 'hepB' && first)
        Object.assign(r, { sets:'5 → 8', reps:'1 at your 3-rep weight (one more single each workout; at 8 add 5–10 lb)', rest:'3–5 min' });
      if (first && progress && method !== 'hepA' && method !== 'hepB') r.reps += ' · ' + PROGRESS_NOTE[progress];
    }
    const data = {}, days = [], seen = {};
    DAY_ORDER.forEach(k => { data[k] = []; });
    Object.entries(split.days).forEach(([key, tpl], dayIdx) => {
      const day = DAYS[tpl];
      const blocks = [];
      if (opts.warmup) blocks.push(warmup(day, eq, opts.goal));
      const used = new Set();
      day.blocks.slice(0, nBlocks).forEach((pair, bi) => {
        const tier = 'ABCDE'[bi];
        const exs = [];
        pair.forEach(pattern => {
          // Same pattern again this week (or this day) → its other option, so days differ.
          const speedLift = day.speed && bi === 0 && !exs.length;
          // PHAT's speed work uses the power day's own lift: the best option, heavy-first.
          let turn = speedLift ? 0 : (seen[pattern] || 0) + (opts.shuffle || 0);
          const heavy = day.style === 'power' || speedLift;
          let p = pick(pattern, eq, turn, heavy);
          if (p && used.has(p.name)) p = pick(pattern, eq, turn + 1, heavy);
          if (!p || used.has(p.name)) return;
          seen[pattern] = (seen[pattern] || 0) + 1;
          used.add(p.name);
          const scheme = day.style ? STYLES[day.style] : goal;
          const doseTier = tier === 'A' && !MAIN.includes(pattern) ? 'B' : tier;
          const [sets, reps] = scheme[doseTier];
          const d = p.dose;
          const r = row(p.name, d.sets || sets, (d.reps || reps) + (d.per ? ' ' + d.per : ''), scheme.rest[doseTier], p.alt, equipLabel(p.needs));
          const first = tier === 'A' && !exs.length;
          if (first && day.speed) Object.assign(r, { name: r.name + ' — speed work', sets: SPEED.sets, reps: SPEED.reps, rest: SPEED.rest });
          else applyMethod(r, { tier, pattern, first, timed: !!d.reps, per: d.per, dayIdx });
          exs.push(r);
          // Hepburn A/B: the A1 lift's pump sets follow its power sets.
          if (first && !day.speed && (method === 'hepA' || method === 'hepB')){
            exs.push(row(p.name + ' (pump)', '', '', '2 min', '', r.equipment));
            applyMethod(exs[exs.length - 1], { tier, pattern, pump: true });
          }
        });
        if (exs.length) blocks.push({ name: 'Block ' + tier, exercises: exs });
      });
      // Letters stay in order even if a block came out empty.
      blocks.filter(b => /^Block /.test(b.name)).forEach((b, i) => { b.name = 'Block ' + 'ABCDE'[i]; });
      if (opts.hold) blocks.push(signatureHold(day, eq));
      data[key] = blocks;
      days.push({ key, title: day.title, blocks });
    });
    if (opts.recovery){
      data.sun = recoveryDay(eq);
      days.push({ key:'sun', title:'Recovery', blocks: data.sun });
    }
    const a1 = days.filter(d => d.key !== 'sun').map(d => (d.blocks.find(b => b.name === 'Block A') || { exercises:[{}] }).exercises[0].name).filter(n => n && !/speed work/.test(n));
    const styled = Object.values(split.days).some(t => DAYS[t].style);
    const progressText = {
      hepburn: `Block A1 lifts run Hepburn double progression (add a rep per session until every set reaches the top of the range, then add load): ${a1.join(', ')}.`,
      linear: `Linear progression: add about 2.5 kg every session the sets are all completed (5 kg on deadlifts); fail a weight three sessions running, drop 10% and build back.`,
      double: `Double progression on every lift: work up to the top of the rep range on all sets, then add weight and start again at the bottom.`,
      starr: `Bill Starr's rule: when all 5 reps come on the fifth set, raise every set next time — small jumps, as little as 2.5 lb a week.`,
      park: `Reg Park's rule: when all three work sets reach 5 reps, add 5–10 lb to every set. No training to failure.`,
      gironda: `Gironda's rule: keep one weight for all 8 sets; when all 8 × 8 are done with good form and short rest, add weight.`,
      gvt: `German Volume Training: start Block A at about 60% of your max (a weight you could lift 20 times); when all 10 × 10 are done, add 4–5%.`
    }[progress] || '';
    const methodText = {
      '5x5': 'Main lifts in Blocks A and B run 5 × 5. ',
      starr: 'Main lifts in Blocks A and B run Bill Starr\u2019s 5 × 5 — each set heavier than the last — with the training days rotating heavy, light (~80%) and medium (~90%). ',
      park: 'Main lifts in Blocks A and B run Reg Park\u2019s 5 × 5: two warm-up sets, then three work sets of 5 at one weight, 3–5 min rest on Block A. ',
      gironda: 'Every block runs Gironda\u2019s 8 × 8 with 15–30 sec rest — an advanced shock routine, not for every week. ',
      gvt: 'Block A runs 10 × 10 (90 sec rest), Blocks B–C 3 × 10–12; the session stops at three blocks. Expect real soreness. ',
      hepA: 'Each Block A1 runs Hepburn\u2019s Program A: 8 × 2 building to 8 × 3, then a pump of 3 × 6 building to 3 × 8. ',
      hepB: 'Each Block A1 runs Hepburn\u2019s Program B: singles at a 3-rep weight building from 5 to 8, then 6 × 3 building to 6 × 5. Run it for about six weeks. '
    }[method] || '';
    const kit = opts.equipment.length ? opts.equipment.map(k => EQUIPMENT.find(e => e[0] === k)[1]).join(', ') : 'bodyweight only';
    return {
      data, days,
      name: `${split.name}${method !== 'manual' ? ' · ' + METHODS[method].name.split(' (')[0] : ''}${styled ? '' : ' · ' + goal.name.toLowerCase()} · ${kit}`,
      summary: `${split.name}, about ${opts.minutes} min a session, with ${kit.toLowerCase()}. Each day runs the manual's way: `
        + `${opts.warmup ? 'a Warm-up block (Pulse, Mobilize, Core on full-body and upper days, Activate, Potentiate), ' : ''}`
        + `lettered A1/A2 blocks${styled ? ' (power days heavy at 3–5 reps with 3–5 min rest on Block A, hypertrophy days 8–20 reps' + (Object.values(split.days).some(t => DAYS[t].speed) ? ', each opening with speed work' : '') + ')' : ` (rest ${goal.rest.A} on A, ${goal.rest.B} on B/C, ${goal.rest.D} on D/E)`}`
        + `${opts.hold ? ' and a Signature Hold' : ''}. ` + methodText + progressText
    };
  }

  /* ---------------- Program Builder panel ---------------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const STORE = 'bnb-program-generator-v1';
  let state = (function(){
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e){ return defaults(); }
  })();
  function defaults(){ return { equipment:['db', 'bench'], days:'3', goal:'muscle', minutes:60, method:'manual', progress:'auto', warmup:true, hold:true, recovery:true, shuffle:0 }; }
  function remember(){ try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e){} }
  let built = null;

  function draw(){
    const box = document.getElementById('program-generator');
    if (!box) return;
    box.innerHTML = `
      <div class="pg-form">
        <div class="field"><label>Equipment</label>
          <div class="pg-checks">${EQUIPMENT.map(([k, n]) => `<label class="pg-check"><input type="checkbox" data-eq="${k}"${state.equipment.includes(k) ? ' checked' : ''}> ${esc(n)}</label>`).join('')}
            <span class="field-hint">Bodyweight moves are always allowed.</span></div></div>
        <div class="pg-row">
          <div class="field"><label>Days a week</label><select id="pg-days">${Object.entries(SPLITS).map(([n, s]) => `<option value="${n}"${n === String(state.days) ? ' selected' : ''}>${n.charAt(0)} — ${esc(s.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Goal</label><select id="pg-goal">${Object.entries(GOALS).map(([k, g]) => `<option value="${k}"${k === state.goal ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Session length</label><select id="pg-minutes">${Object.keys(LENGTHS).map(m => `<option value="${m}"${+m === +state.minutes ? ' selected' : ''}>about ${m} min</option>`).join('')}</select></div>
        </div>
        <div class="pg-row pg-row-2">
          <div class="field"><label>Method</label><select id="pg-method">${Object.entries(METHODS).map(([k, m]) => `<option value="${k}"${k === state.method ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Progression</label><select id="pg-progress">${Object.entries(PROGRESS).map(([k, n]) => `<option value="${k}"${k === state.progress ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        </div>
        <div class="pg-checks">
          <label class="pg-check"><input type="checkbox" id="pg-warmup"${state.warmup ? ' checked' : ''}> Warm-up block</label>
          <label class="pg-check"><input type="checkbox" id="pg-hold"${state.hold ? ' checked' : ''}> Signature Hold</label>
          <label class="pg-check"><input type="checkbox" id="pg-recovery"${state.recovery ? ' checked' : ''}> Sunday recovery</label>
        </div>
        <div class="crud-actions" style="padding-left:0;">
          <button class="btn2 primary" type="button" id="pg-build">Build Program</button>
          <button class="btn2" type="button" id="pg-shuffle"${built ? '' : ' disabled'}>Shuffle Exercises</button>
          <button class="btn2" type="button" id="pg-load"${built ? '' : ' disabled'}>Load for Client</button>
        </div>
      </div>
      <div id="pg-preview">${built ? preview(built) : ''}</div>`;

    const read = () => {
      state.equipment = [...box.querySelectorAll('[data-eq]')].filter(c => c.checked).map(c => c.dataset.eq);
      state.days = box.querySelector('#pg-days').value;
      state.method = box.querySelector('#pg-method').value;
      state.progress = box.querySelector('#pg-progress').value;
      state.goal = box.querySelector('#pg-goal').value;
      state.minutes = +box.querySelector('#pg-minutes').value;
      state.warmup = box.querySelector('#pg-warmup').checked;
      state.hold = box.querySelector('#pg-hold').checked;
      state.recovery = box.querySelector('#pg-recovery').checked;
      remember();
    };
    // Changing a choice after building rebuilds straight away.
    box.querySelectorAll('.pg-form input, .pg-form select').forEach(el => el.onchange = () => { read(); if (built){ built = build(state); draw(); } });
    box.querySelector('#pg-build').onclick = () => { read(); state.shuffle = 0; remember(); built = build(state); draw(); };
    box.querySelector('#pg-shuffle').onclick = () => { read(); state.shuffle++; remember(); built = build(state); draw(); };
    box.querySelector('#pg-load').onclick = () => {
      if (!built || typeof window.bnbLoadProgramForClient !== 'function') return;
      const picker = document.getElementById('admin-client-picker');
      const who = picker && picker.selectedOptions[0] ? picker.selectedOptions[0].textContent.trim() : 'the client selected above';
      if (!confirm(`Load this program (${built.name}) for ${who}? This replaces every day of their current program.`)) return;
      window.bnbLoadProgramForClient(built.data);
      alert('Program loaded.');
    };
  }

  function preview(p){
    const presc = ex => [ex.sets ? ex.sets + ' × ' : '', ex.reps].join('');
    return `
      <p class="field-hint pg-summary">${esc(p.summary)}</p>
      <div class="pg-days">${p.days.map(d => `
        <div class="pg-day">
          <h4>${esc(DAY_NAME[d.key])} <span>${esc(d.title)}</span></h4>
          ${d.blocks.map(b => `
            <table class="block pg-block"><caption>${esc(b.name)}</caption>
              ${b.exercises.map((ex, i) => `<tr>
                <td>${/^Block /.test(b.name) ? `<b class="pg-tag">${esc(b.name.slice(6) + (i + 1))}</b> ` : ''}${esc(ex.name)}
                  ${ex.alternates || ex.rest ? `<div class="mono pg-meta">${[ex.rest && 'Rest ' + ex.rest, ex.alternates && 'Alt: ' + ex.alternates].filter(Boolean).map(esc).join(' &nbsp;•&nbsp; ')}</div>` : ''}</td>
                <td class="mono">${esc(presc(ex))}</td></tr>`).join('')}
            </table>`).join('')}
        </div>`).join('')}
      </div>`;
  }

  window.bnbProgramGeneratorOnShown = draw;
  window.bnbBuildProgram = build;   // for testing from the console
  draw();
})();
