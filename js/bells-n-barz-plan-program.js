/* ============================================================
   PLAN PROGRAM — works out a meal plan from questionnaire answers,
   with no AI. Brought over from the Meal Plan Sandbox
   (js/plan-program.js there): meal options built from the foods the
   member loves, their way of eating and what they avoid; hand
   portions; swaps, eating out, a grocery list; and the weekly weigh-in
   rule that corrects the estimate.

   One difference from the sandbox: the calories, macros, activity and
   goal come from the app's shared formula (js/bells-n-barz-targets.js),
   so the "Suggested plan" page, the coach's "From their answers"
   targets, Food Log and Coach KA's diet all agree. Calories per food
   are rough averages for common Kenyan foods; the weekly check takes
   care of the difference.
   ============================================================ */
window.MP_PROGRAM = (function(){
  const num = x => parseFloat(String(x == null ? '' : x).replace(',', '.')) || 0;
  const r10 = n => Math.round(n / 10) * 10, r50 = n => Math.round(n / 50) * 50;
  // A digestion answer that starts "None"/"No"…
  const NONE = /^\s*(none|no|nothing|n\/a|not sure)\b/i;
  // …but for foods to avoid only a whole-answer "none" counts, so "No pork" still avoids pork.
  const NONE_ONLY = /^[\s.!-]*(none|no|nil|nothing|n\/?a|not sure)( (known|really|at all|that i know of))?( (allergies|intolerances|dislikes))?[\s.!]*$/i;

  /* ---------- Energy ---------- */
  // Height or weight missing: a typical adult of that sex in Kenya (about
  // 158 cm women, 170 cm men) at a healthy BMI of 22, with a smaller
  // (−6 cm, BMI 19) and larger (+7 cm, BMI 26) body for the range.
  const T = window.BNB_TARGETS;
  const TYPICAL = { Female: 158, Male: 170 };
  function bodies(v){
    if (v.height && v.weight) return { mid: { cm: v.height, kg: v.weight } };
    const typ = TYPICAL[v.sex] || TYPICAL.Female;
    const body = (dcm, bmi) => { const cm = v.height || typ + dcm; return { cm, kg: v.weight || bmi * Math.pow(cm / 100, 2) }; };
    return { low: body(-6, 19), mid: body(0, 22), high: body(7, 26) };
  }
  // The shared formula, plus the check-in adjustment (never below its safe floor).
  function targets(v, body, adjust){
    const r = T.calc({ sex: v.sex === 'Male' ? 'male' : 'female', age: v.age || 25, heightCm: body.cm, weightKg: body.kg, factor: v.factor, goal: v.goal });
    const cal = adjust ? Math.max(v.sex === 'Male' ? 1500 : 1200, r50(r.calories + adjust)) : r.calories;
    // Rounded in the same order as the shared formula, so the numbers match exactly.
    const protein = r.protein_g, fat = Math.round(cal * 0.3 / 9);
    return { cal, protein, fat, carbs: Math.max(0, Math.round((cal - protein * 4 - fat * 9) / 4)), maintenance: r.maintenance, note: r.note };
  }

  /* ---------- Questionnaire answers -> the program's inputs ---------- */
  function fromAnswers(a){
    a = a || {};
    const act = T.activityFromAnswers(a), days = act.perWeek, goal = T.goalFromAnswers(a);
    const wantsSnacks = /snack/i.test((a.anything_else || '') + ' ' + JSON.stringify(a.typical_day || {}));
    return {
      age: num(a.age), sex: a.sex === 'Male' ? 'Male' : 'Female', height: num(a.height_cm), weight: num(a.weight_kg),
      job: a.job_activity || 'Mostly sitting', days, factor: act.factor, activity: act.label, goal,
      meals: a.meals_per_day === '1' || a.meals_per_day === '2' ? (goal === 'lose' ? 2 : 3) : 3,
      snacks: goal === 'gain' || wantsSnacks || a.meals_per_day === '4 or more' ? 2 : 1,
      loves: a.loves || '', avoid: [a.dislikes, a.allergies].filter(x => x && !NONE_ONLY.test(x)).join(' '),
      diet: a.diet || '', gut: a.digestion || '', budget: a.budget || '', mealPrep: a.meal_prep || '', eatOut: a.eat_out || '',
      target: a.target || '', typical: a.typical_day || {}
    };
  }

  /* ---------- Foods ---------- */
  // tag: what a way of eating or an allergy can rule out.
  const PROTEINS = [
    { k: /chicken|kuku/, name: 'Chicken stew', amt: '1 palm', kcal: 240, p: 30, tag: 'meat' },
    { k: /\bfish|tilapia|samaki/, name: 'Tilapia', amt: '1 medium fish', kcal: 190, p: 32, tag: 'fish' },
    { k: /omena|dagaa/, name: 'Omena', amt: '1 cupped hand', kcal: 200, p: 25, tag: 'fish' },
    { k: /beef|nyama|red meat/, name: 'Beef stew', amt: '1 palm', kcal: 260, p: 30, tag: 'meat' },
    { k: /pork|red meat/, name: 'Pork', amt: '1 palm', kcal: 290, p: 30, tag: 'pork' },
    { k: /liver|red meat|offal/, name: 'Liver', amt: '1 palm', kcal: 210, p: 30, tag: 'meat' },
    { k: /green ?grams|ndengu|lentil/, name: 'Ndengu', amt: '1½ cups', kcal: 300, p: 20, tag: 'plant' },
    { k: /beans|maharagwe|githeri/, name: 'Beans', amt: '1½ cups', kcal: 340, p: 22, tag: 'plant' },
    { k: /\beggs?\b/, name: 'Eggs', amt: '3 eggs', kcal: 230, p: 19, tag: 'egg' },
    // Only when they love it, or nothing else is left (e.g. vegan and no beans).
    { k: /soy|soya|tofu/, name: 'Soya chunks', amt: '1 cup cooked', kcal: 200, p: 24, tag: 'plant' }
  ];
  // q = usual amount; one/many = how to say it.
  const STARCHES = [
    { k: /ugali/, name: 'Ugali', q: 1, one: 'fist-sized piece', many: 'fist-sized pieces', kcal: 240, p: 5 },
    { k: /rice|wali|pilau/, name: 'Rice', q: 1, one: 'cup', many: 'cups', kcal: 210, p: 4 },
    { k: /waru|potato|viazi/, name: 'Boiled waru', q: 2, one: 'medium potato', many: 'medium potatoes', kcal: 220, p: 5 },
    { k: /chap/, name: 'Chapati', q: 1, one: 'chapati', many: 'chapatis', kcal: 270, p: 6, tag: 'gluten' },
    { k: /sweet potato|ngwaci/, name: 'Sweet potato', q: 1, one: 'medium sweet potato', many: 'medium sweet potatoes', kcal: 180, p: 3 },
    { k: /matoke/, name: 'Matoke', q: 2, one: 'finger', many: 'fingers', kcal: 220, p: 3 }
  ];
  const VEG = { text: 'sukuma wiki, cabbage or managu (1–2 fists)', kcal: 70, p: 3 };
  const LEGUMES = /beans|ndengu|green ?grams|lentil|legume|pulses/;
  const BREAKFASTS = [
    { needs: ['dairy', 'nut', 'egg', 'gluten'], text: 'Tea with milk, 2 slices of bread with 1 tablespoon peanut butter, 2 eggs', kcal: 520, p: 26 },
    { needs: ['dairy', 'nut'], text: 'Uji (millet or sorghum) made with half milk, a small handful of groundnuts, a banana', kcal: 450, p: 15 },
    { needs: ['egg'], text: '1 sweet potato or 2 pieces of nduma, 2–3 boiled eggs, tea', kcal: 420, p: 18 },
    { needs: ['gluten'], bad: LEGUMES, text: 'Leftover beans or ndengu (1 cup) with 1 chapati or 2 slices of bread, tea', kcal: 480, p: 18 },
    { needs: ['dairy', 'gluten'], text: 'Mala or yoghurt (1 cup), a fruit and 2 slices of bread', kcal: 380, p: 14 },
    { needs: [], bad: LEGUMES, text: 'Leftover beans or ndengu (1 cup) with 1 sweet potato or 2 pieces of nduma, tea', kcal: 400, p: 17 },
    { needs: [], text: 'Uji (millet or sorghum) with a banana and half an avocado, tea', kcal: 400, p: 8 }
  ];
  const SNACKS = [
    { needs: ['nut'], text: 'A banana and a small handful of groundnuts', kcal: 275, p: 8 },
    { needs: ['dairy'], text: 'Mala or yoghurt (1 cup) and a fruit in season', kcal: 240, p: 9 },
    { needs: ['egg'], text: '2 boiled eggs and a fruit', kcal: 230, p: 13 },
    { needs: [], text: 'Roasted maize, or a fruit with half an avocado', kcal: 250, p: 5 },
    { needs: ['nut', 'gluten'], text: '2 slices of bread with peanut butter', kcal: 260, p: 10 }
  ];
  // What an allergy or dislike rules out ("shellfish" isn't fish, "eggplant" isn't eggs, "coconut" isn't a nut).
  const AVOID_TAG = { egg: /\beggs?\b/, dairy: /milk|dairy|lactose|mala|yoghurt|yogurt|cheese/, nut: /\bnuts?\b|peanut|groundnut|cashew|almond/,
    fish: /\bfish|seafood|samaki/, meat: /(?<!red )\bmeats?\b/, gluten: /gluten|wheat|c(o)?eliac/ };
  function tagOk(v, tag){
    const d = v.diet;
    if (tag === 'meat' || tag === 'pork') if (/Vegetarian|Vegan|Pescatarian/.test(d)) return false;
    if (tag === 'pork' && /Halal|Kosher/.test(d)) return false;
    if (tag === 'fish' && /Vegetarian|Vegan/.test(d)) return false;
    if ((tag === 'egg' || tag === 'dairy') && d === 'Vegan') return false;
    if (tag === 'pork' && AVOID_TAG.meat.test(v.avoid.toLowerCase())) return false;
    return !(AVOID_TAG[tag] && AVOID_TAG[tag].test(v.avoid.toLowerCase()));
  }
  const foodOk = (v, f) => tagOk(v, f.tag) && !f.k.test(v.avoid.toLowerCase());
  const okList = (v, list) => list.filter(x => (x.needs || []).every(t => tagOk(v, t)) && (!x.k || foodOk(v, x)) && !(x.bad && x.bad.test(v.avoid.toLowerCase())));
  // What they love (two or more is enough to rotate), else topped up with everyday defaults.
  // Anything they can eat when even that leaves nothing; a stand-in if they can eat none.
  function choices(v, list, defaults, fallback){
    const loves = v.loves.toLowerCase();
    const ok = list.filter(f => (!f.tag || tagOk(v, f.tag)) && !f.k.test(v.avoid.toLowerCase()));
    const loved = ok.filter(f => f.k.test(loves));
    const out = loved.length >= 2 ? loved : loved.concat(ok.filter(f => !loved.includes(f) && defaults.test(f.name.toLowerCase())));
    return out.length ? out : ok.length ? ok : [fallback];
  }
  const ANY_PROTEIN = { name: 'A protein you eat', amt: '1 palm', kcal: 220, p: 25 };
  const ANY_STARCH = { name: 'A starch you eat', q: 1, one: 'cupped hand', many: 'cupped hands', kcal: 200, p: 4 };
  const proteinChoices = v => choices(v, PROTEINS, /beans|chicken|eggs|ndengu|tilapia/, ANY_PROTEIN);
  const starchChoices = v => choices(v, STARCHES, /ugali|rice|sweet potato|chapati/, ANY_STARCH);
  const half = q => (Math.floor(q) ? Math.floor(q) : '') + (q % 1 ? '½' : '') || '0';
  const starchText = (s, step) => { const q = s.q * step; return s.name.toLowerCase() + ' (' + half(q) + ' ' + (q > 1 ? s.many : s.one) + ')'; };
  // sShift pairs each protein with a different starch, so dinners aren't lunches again.
  // seen (shared by lunches and dinners) skips pairs already used, until
  // the foods run out; then repeats are fine.
  function plates(v, n, offset, sShift, step, seen){
    const P = proteinChoices(v), S = starchChoices(v);
    const out = [];
    seen = seen || {};
    for (let i = 0; out.length < n && i < n * 4 + P.length * S.length; i++){
      const p = P[(i + offset) % P.length], s = S[(i + offset + sShift + Math.floor(i / P.length)) % S.length];
      if (seen[p.name + s.name] && i < P.length * S.length) continue;
      seen[p.name + s.name] = 1;
      out.push({ pf: p, sf: s, text: p.name + ' (' + p.amt + ') + ' + starchText(s, step) + ' + ' + VEG.text,
        kcal: p.kcal + s.kcal * step + VEG.kcal, p: p.p + s.p * step + VEG.p });
    }
    return out;
  }

  /* ---------- The whole plan ---------- */
  // v from fromAnswers() (or the starter page's form); checkins newest
  // first, as stored. Returns everything the pages show.
  function build(v, checkins){
    const notes = [];
    // A weigh-in fills a missing weight, and two weeks of them adjust the calories.
    const weights = (checkins || []).filter(c => num(c.weight_kg)).map(c => ({ kg: num(c.weight_kg), at: new Date(c.created_at) }));
    if (!v.weight && weights.length){ v = Object.assign({}, v, { weight: weights[0].kg }); notes.push('Weight ' + weights[0].kg + ' kg from the latest check-in.'); }
    let adjust = 0;
    if (weights.length >= 2){
      const first = weights[weights.length - 1], last = weights[0], weeks = (last.at - first.at) / 6048e5;
      if (weeks >= 1.4){
        const rate = (last.kg - first.kg) / weeks;
        if (v.goal === 'gain') adjust = rate < 0.25 ? 150 : rate > 0.5 ? -150 : 0;
        else if (v.goal === 'lose') adjust = rate > -0.25 ? -150 : rate < -0.75 ? 150 : 0;
        else adjust = rate > 0.25 ? -150 : rate < -0.25 ? 150 : 0;
        notes.push('Check-ins: ' + (rate >= 0 ? '+' : '') + rate.toFixed(2) + ' kg a week over ' + Math.round(weeks) + ' weeks' +
          (adjust ? ', so ' + (adjust > 0 ? '+' : '') + adjust + ' kcal.' : ', on track, so no change.'));
      }
    }
    const B = bodies(v), t = targets(v, B.mid, adjust);
    if (t.note) notes.push(t.note);
    const ranged = !!B.low;
    const lo = ranged && targets(v, B.low, adjust), hi = ranged && targets(v, B.high, adjust);

    const breakfasts = okList(v, BREAKFASTS).slice(0, 3), snacks = okList(v, SNACKS);
    // Size the starch at lunch and dinner (½× to 2×) so a typical day lands near the target.
    const base = plates(v, 1, 0, 1, 1)[0], base2 = plates(v, 1, 1, 3, 1)[0];
    const fixed = (v.meals >= 3 && breakfasts[0] ? breakfasts[0].kcal : 0) + snacks.slice(0, v.snacks).reduce((s, x) => s + x.kcal, 0);
    const starchK = base.sf.kcal + base2.sf.kcal;
    const step = Math.min(2, Math.max(0.5, Math.round((1 + (t.cal - fixed - base.kcal - base2.kcal) / starchK) * 2) / 2));
    const used = {}, lunches = plates(v, 4, 0, 1, step, used), dinners = plates(v, 5, 1, 3, step, used);

    const day = [];
    if (v.meals >= 3 && breakfasts[0]) day.push({ name: 'Breakfast', items: [breakfasts[0]] });
    if (v.snacks >= 1) day.push({ name: 'Mid-morning snack', items: [snacks[0]] });
    day.push({ name: 'Lunch', items: [lunches[0]] });
    if (v.snacks >= 2) day.push({ name: 'Afternoon snack', items: [snacks[1] || snacks[0]] });
    day.push({ name: 'Dinner', items: [dinners[0]] });
    const dayKcal = day.reduce((s, m) => s + m.items.reduce((a, x) => a + x.kcal, 0), 0);
    const dayProtein = day.reduce((s, m) => s + m.items.reduce((a, x) => a + x.p, 0), 0);

    return { v, B, t, ranged, lo, hi, adjust, notes, step, breakfasts, snacks, lunches, dinners, day, dayKcal, dayProtein };
  }

  const hands = v => v.sex === 'Male'
    ? { p: '2 palms', s: '2 cupped hands', veg: '2 fists', f: '2 thumbs' }
    : { p: '1 palm', s: '1 cupped hand', veg: '1–2 fists', f: '1 thumb' };
  function weeklyRule(v){
    if (v.goal === 'gain') return { aim: 'gain 0.25–0.5 kg a week', rows: [
      ['Gaining less than 0.25 kg a week', 'Add about 150–200 kcal: an extra cupped hand of ugali or rice at dinner, or a banana and groundnuts snack'],
      ['0.25–0.5 kg a week', 'Keep going'], ['More than 0.5 kg a week', 'Take away about 150 kcal (half the extra starch)']] };
    if (v.goal === 'lose') return { aim: 'lose 0.25–0.75 kg a week', rows: [
      ['Losing less than 0.25 kg a week', 'Take away about 150 kcal: half a cupped hand of starch at dinner'],
      ['0.25–0.75 kg a week', 'Keep going'], ['Losing faster, or tired and hungry', 'Add about 150 kcal back']] };
    return { aim: 'stay within 1 kg', rows: [['Moving more than 1 kg', 'Adjust by 150 kcal the other way']] };
  }
  const hasGutIssue = g => /bloat|constip|gas|reflux|heartburn|stomach|diarr/i.test(g || '') && !NONE.test(g || '');
  const GUT_TIPS = [
    'Drink water through the day: about 8 glasses (2 litres), more on gym days.',
    'Vegetables at lunch and dinner and a fruit a day, but add fibre slowly over 2–3 weeks; a sudden jump makes bloating worse.',
    'Soak beans and ndengu overnight, pour the water away and cook them well; start with smaller portions.',
    'Eat at regular times, chew slowly, and walk for 10 minutes after the evening meal.',
    'Note what was eaten on the worst bloating days; milk, beans or fried food are common triggers.',
    'If constipation carries on for more than 3 weeks, or there is pain, blood, or weight loss without trying, see a doctor.'
  ];

  // In the shape the app's plan pages use (same as the AI's schema).
  function plan(answers, checkins, opts){
    const v0 = fromAnswers(answers), R = build(v0, checkins), v = R.v, t = R.t, h = hands(v);
    const typical = v.typical || {}, when = row => typical[row] && typical[row].time ? ' (' + typical[row].time + ')' : '';
    const pattern = v.meals + ' meals' + (v.snacks ? ' + ' + v.snacks + ' snack' + (v.snacks > 1 ? 's' : '') : '') + ': ' + (v.meals >= 3 ? 'breakfast' + when('Breakfast') + ', ' : '') +
      (v.snacks >= 1 ? 'a snack mid-morning, ' : '') + 'lunch' + when('Lunch') + (v.snacks >= 2 ? ', a snack mid-afternoon' : '') + ', dinner' + when('Dinner') +
      '. Eat every 3–4 hours' + (v.snacks ? ' and carry the snacks to work.' : '.');
    // Swaps and eating out from the foods this member can have.
    const canEat = list => list.filter(f => (!f.tag || tagOk(v, f.tag)) && !f.k.test(v.avoid.toLowerCase())).map(f => f.name.replace(/ stew|Boiled /g, '').toLowerCase());
    // Soya only when it's on the menu; six is plenty for one line.
    const ORDER = ['chicken', 'tilapia', 'beef', 'beans', 'ndengu', 'eggs', 'omena', 'pork', 'liver', 'soya chunks'];
    const proteinsOk = canEat(PROTEINS).filter(x => x !== 'soya chunks' || R.lunches.some(l => l.pf.name === 'Soya chunks'))
      .sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y)).slice(0, 6), starchesOk = canEat(STARCHES);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const meaty = proteinsOk.some(x => /chicken|beef|pork|liver/.test(x));
    const swaps = [
      proteinsOk.length > 1 && cap(proteinsOk.join(' ↔ ')) + (meaty && /beans|ndengu/.test(proteinsOk.join()) ? ' (1½ cups of beans = a palm of meat)' : ''),
      starchesOk.length > 1 && cap(starchesOk.join(' ↔ ')),
      'Sukuma ↔ cabbage ↔ managu ↔ spinach ↔ terere',
      tagOk(v, 'nut') ? 'Groundnuts ↔ a spoon of peanut butter ↔ half an avocado' : '',
      'Soda or juice → water, or tea with less sugar'
    ].filter(Boolean);
    const often = /3–5|Most days/.test(v.eatOut);
    const outProtein = ['chicken', 'tilapia', 'beef', 'beans', 'ndengu', 'eggs', 'soya chunks'].filter(x => proteinsOk.includes(x)).slice(0, 3)
      .map(x => x === 'beef' ? 'nyama choma' : x === 'tilapia' ? 'fish' : x);
    const outStarch = ['ugali', 'rice', 'chapati'].filter(x => starchesOk.includes(x)).slice(0, 2);
    const eating_out = 'Pick a plate you can see: ' + (outProtein.length ? outProtein.join(', ').replace(/, ([^,]*)$/, ' or $1') : 'a protein you eat') +
      ' with ' + (outStarch.length ? outStarch.join(' or ') : 'one starch') + ' and kachumbari or greens: one starch, not two (skip the chips when there is ' + (outStarch.length ? outStarch.join(' or ') : 'another starch') + '). Water or tea instead of soda.' +
      (often ? ' Eating out ' + v.eatOut.toLowerCase() + ': pack lunch 2–3 days a week (take the dinner leftovers); it saves money and keeps portions right.' : '') +
      (v.goal === 'gain' ? ' Having chips? Add a protein' + (outProtein.length ? ' (' + outProtein.slice(0, 2).join(' or ') + ')' : '') + ' rather than chips alone.' : '');

    const used = arr => [...new Set(arr)];
    const grocery = [
      { category: 'Protein', items: used(R.lunches.concat(R.dinners).map(x => x.pf.name.replace(/ stew|Boiled /g, '').toLowerCase())) },
      { category: 'Starches', items: used(R.lunches.concat(R.dinners).map(x => x.sf.name.replace(/Boiled /, '').toLowerCase()).concat(tagOk(v, 'gluten') ? ['bread'] : [], ['millet or sorghum flour (uji)'])) },
      { category: 'Vegetables & fruit', items: ['sukuma wiki', 'cabbage', 'managu', 'tomatoes', 'onions', 'carrots', 'bananas', 'fruit in season'] },
      { category: 'Dairy & eggs', items: ['milk', 'mala or yoghurt', 'eggs'].filter(x => tagOk(v, /egg/.test(x) ? 'egg' : 'dairy')) },
      { category: 'Other', items: ['groundnuts', 'peanut butter', 'cooking oil (a little)', 'tea leaves'].filter(x => tagOk(v, 'nut') || !/nut/.test(x)) }
    ].filter(g => g.items.length);

    const rule = weeklyRule(v), parts = [];
    parts.push('Portions without numbers, at each main meal: protein ' + h.p + ', starch ' + h.s + (v.goal === 'gain' ? ' plus an extra half to one at lunch or dinner' : '') +
      ', vegetables ' + h.veg + ', fat ' + h.f + '.');
    parts.push('Weigh 2 mornings a week (same scale, after the toilet, before eating) and aim to ' + rule.aim + '. After 2 weeks:\n' + rule.rows.map(r => '- ' + r[0] + ': ' + r[1]).join('\n'));
    if (R.ranged) parts.push('No ' + [!v.height && 'height', !v.weight && 'weight'].filter(Boolean).join(' or ') + ' in the answers yet, so the targets are an estimate (range ' +
      r50(Math.min(R.lo.cal, R.hi.cal)) + '–' + r50(Math.max(R.lo.cal, R.hi.cal)) + ' kcal). Adding them makes it exact; the weekly check corrects it either way.');
    if (v.goal === 'gain' && /glute|hip|bum|butt/i.test(v.target)) parts.push('For glutes and hips the food only works with the training: squats, hip thrusts and lunges, a little heavier over time. A flatter tummy comes mostly from less bloating and gaining slowly.');
    if (hasGutIssue(v.gut)) parts.push('For the digestion:\n' + GUT_TIPS.map(x => '- ' + x).join('\n'));
    if (/Yes|Maybe/.test(v.mealPrep)) parts.push('Cook once, eat twice: make a bigger dinner pot and take the leftovers for lunch.');
    if (v.budget) parts.push('Budget: eggs, beans, ndengu and omena are the cheapest proteins; cook beans in bulk and keep meat for a few days a week.');

    const b = R.B.mid, goalText = { lose: ', minus 500 kcal to lose fat', gain: ', plus 250 kcal to gain', maintain: '' }[v.goal];
    const rationale = 'Mifflin-St Jeor for ' + v.sex.toLowerCase() + ', ' + (v.age || 25) + ', ' + Math.round(b.cm) + ' cm, ' + Math.round(b.kg) + ' kg' +
      (R.ranged ? ' (typical size, since ' + [!v.height && 'height', !v.weight && 'weight'].filter(Boolean).join(' and ') + ' are missing)' : '') +
      ' = ' + Math.round(T.bmr(v.sex === 'Male' ? 'male' : 'female', b.kg, b.cm, v.age || 25)) + ' kcal at rest, × ' + v.factor + ' (' + v.activity.toLowerCase() + ': ' + v.job.toLowerCase() + ', ' +
      v.days + ' exercise day' + (v.days === 1 ? '' : 's') + ' a week) = about ' + t.maintenance + ' kcal to maintain' + (t.note && t.cal === t.maintenance ? '' : goalText) +
      ' → ' + r50(t.cal) + ' kcal. Protein ' + (v.goal === 'gain' ? '1.8' : '1.6') + ' g/kg, fat 30%, carbs the rest (the same formula as Food Log). Meals are built from the foods they love' +
      (v.diet && v.diet !== 'No restrictions' ? ' (' + v.diet.toLowerCase() + ')' : '') + (v.avoid ? ', leaving out what they avoid' : '') +
      ', with lunch and dinner starch sized so a typical day comes to about ' + r10(R.dayKcal) + ' kcal.' + (R.notes.length ? ' ' + R.notes.join(' ') : '');

    return {
      model: 'program',
      plan: {
        targets: { calories: r50(t.cal), protein_g: Math.round(t.protein), carbs_g: Math.round(t.carbs), fat_g: Math.round(t.fat) },
        pattern, breakfasts: R.breakfasts.map(x => x.text), lunches: R.lunches.map(x => x.text), dinners: R.dinners.map(x => x.text),
        snacks: R.snacks.slice(0, 4).map(x => x.text), swaps, eating_out, grocery, notes: parts.join('\n\n'), rationale,
        referral_note: opts && opts.refer ? opts.refer : ''
      }
    };
  }

  return { fromAnswers, build, plan, hands, weeklyRule, hasGutIssue, GUT_TIPS, r10, r50 };
})();
