(function(){
  /* ============================================================
     MEAL PLANS (sql/45, sql/46)
     Built from the gym's meal-plan guide: the member fills in the
     intake questionnaire, their coach writes the plan, and the member
     checks in every 2-3 weeks so the coach can adjust it. Calorie and
     macro targets come from the member's saved Nutrition calculator
     goals (nutrition_goals), which already implements the guide's
     Mifflin-St Jeor + macro steps.

     Also brought over from the Meal Plan Sandbox: the How it works page,
     Try a diet (+ Coach > My diets). (AI suggestions were left out for
     now — the sandbox still has them.) Data goes through MP_STORE
     (js/bells-n-barz-mealplan-store.js); who sees what is enforced by
     RLS: the member, their assigned coach, and admins only.
     ============================================================ */
  const memberBody = document.getElementById('mealplan-body');
  const coachBody = document.getElementById('coach-mealplans-body');
  if (!memberBody && !coachBody) return;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  const S = window.MP_STORE;
  function self(){ return S.me(); }
  function nameOf(id){ const u = S.user(id); return u ? u.fullName : 'Member'; }
  function toast(msg){
    const t = document.getElementById('t-toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._mpTimer); t._mpTimer = setTimeout(()=> t.classList.remove('show'), 2600);
  }
  function fmtDate(iso){
    return new Date(iso).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
  }
  function daysSince(iso){ return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }

  /* ---------------- QUESTIONNAIRE (from Meal_Plan_Guide) ---------------- */
  const TYPICAL_DAY_ROWS = ['Breakfast', 'Mid-morning snack', 'Lunch', 'Afternoon snack', 'Dinner', 'Late-night snack', 'Drinks through the day'];
  const QUESTIONS = [
    { section: 'A. About you' },
    { id:'age', label:'Age', type:'number', min:10, max:100 },
    { id:'sex', label:'Sex', type:'radio', options:['Female','Male'] },
    { id:'height_cm', label:'Height (cm)', type:'number', min:100, max:250 },
    { id:'weight_kg', label:'Current weight (kg)', type:'number', min:20, max:400 },
    { id:'job', label:'What is your job, and what does a typical workday look like?', type:'text' },
    { section: 'B. Your goals' },
    { id:'goals', label:'What is your main goal? (tick all that apply)', type:'checks', options:['Lose fat','Build muscle','Maintain weight','More energy','Sports performance','Manage a health condition','Other'] },
    { id:'target', label:'Do you have a specific target or timeframe in mind?', type:'text' },
    { section: 'C. Activity' },
    { id:'job_activity', label:'How active is your job?', type:'radio', options:['Mostly sitting','On my feet some of the day','Physically demanding'] },
    { id:'exercise', label:'What exercise do you do? (type, days per week, how long each session)', type:'text' },
    { section: 'D. Health', note: 'Only your coach and the gym admin can see your answers.' },
    { id:'conditions', label:'Do you have any medical conditions (e.g. diabetes, high blood pressure, kidney or thyroid problems)?', type:'text' },
    { id:'medications', label:'Do you take any medications or supplements?', type:'text' },
    { id:'pregnant', label:'Are you pregnant or breastfeeding?', type:'radio', options:['Yes','No'] },
    { id:'allergies', label:'Do you have any food allergies or intolerances?', type:'text' },
    { id:'digestion', label:'Do you have any regular digestive issues (bloating, reflux, constipation)?', type:'text' },
    { id:'eating_disorder', label:'Have you ever had a difficult relationship with food or been treated for an eating disorder?', type:'radio', options:['Yes','No','Prefer to discuss in person'] },
    { section: 'E. Food preferences' },
    { id:'diet', label:'Do you follow any particular way of eating?', type:'radio', options:['No restrictions','Vegetarian','Vegan','Pescatarian','Halal','Kosher','Other'] },
    { id:'loves', label:'Which foods do you love and would like to keep in your plan?', type:'text' },
    { id:'dislikes', label:"Which foods do you dislike or won't eat?", type:'text' },
    { id:'drinks', label:'What do you usually drink? (water, tea, coffee, soda, juice, alcohol, and how much)', type:'text' },
    { section: 'F. Lifestyle' },
    { id:'meals_per_day', label:'How many meals do you usually eat a day?', type:'radio', options:['1','2','3','4 or more'] },
    { id:'cooking_skill', label:'How would you rate your cooking skills?', type:'radio', options:['Beginner','Comfortable','Confident'] },
    { id:'cook_time', label:'How much time can you spend cooking on a weekday?', type:'radio', options:['Under 15 min','15–30 min','30–60 min','Over an hour'] },
    { id:'meal_prep', label:'Would you be willing to meal-prep (cook in batches ahead of time)?', type:'radio', options:['Yes','No','Maybe'] },
    { id:'budget', label:'Roughly what is your weekly food budget?', type:'line' },
    { id:'household', label:'Who else do you cook or eat with at home?', type:'line' },
    { id:'eat_out', label:'How often do you eat out or order takeaway?', type:'radio', options:['Rarely','1–2 times a week','3–5 times a week','Most days'] },
    { section: 'G. A typical day of eating', note: 'Describe what you eat on a normal day right now. Be honest; there are no wrong answers.' },
    { id:'typical_day', type:'day' },
    { section: 'H. Anything else' },
    { id:'anything_else', label:'Is there anything else you would like your coach to know?', type:'text' }
  ];

  // The guide's "when to refer out" rule, applied to the answers. All
  // flags show to the coach; only the clear-cut ones (strong) also show
  // the member a gentle note. Medication only flags for the coach to
  // judge — the guide refers out for medication *affected by diet*,
  // which a plain "takes an iron supplement" answer doesn't establish.
  function referralFlags(a){
    const flags = [];
    if (/diabet|kidney|renal/i.test(a.conditions || '')) flags.push({ text: 'Mentions diabetes or kidney disease', strong: true });
    if (a.pregnant === 'Yes') flags.push({ text: 'Pregnant or breastfeeding', strong: true });
    if (a.eating_disorder === 'Yes') flags.push({ text: 'History of a difficult relationship with food', strong: true });
    if (a.eating_disorder === 'Prefer to discuss in person') flags.push({ text: 'Wants to discuss eating history in person', strong: false });
    if ((a.medications || '').trim()) flags.push({ text: 'Takes medication/supplements — check whether any are affected by diet', strong: false });
    return flags;
  }
  const REFER_NOTE = 'Based on your answers, it’s a good idea to also work with a registered dietitian. Your coach can still help with general healthy-eating structure.';

  function questionnaireFormHtml(a){
    let n = 0;
    let html = '<form class="mp-form" id="mp-intake-form" autocomplete="off">';
    QUESTIONS.forEach(q=>{
      if (q.section){
        html += '<div class="mp-section-head">' + esc(q.section) + '</div>';
        if (q.note) html += '<div class="field-hint mp-section-note">' + esc(q.note) + '</div>';
        return;
      }
      if (q.type === 'day'){
        const day = a.typical_day || {};
        html += '<div class="mp-day-grid"><div class="mp-day-h">Meal</div><div class="mp-day-h">Time</div><div class="mp-day-h">What you usually eat and drink</div>';
        TYPICAL_DAY_ROWS.forEach((row, i)=>{
          const v = day[row] || {};
          html += '<div class="mp-day-label">' + esc(row) + '</div>' +
            '<input type="text" class="mp-input" data-day-row="' + i + '" data-day-part="time" value="' + esc(v.time) + '" placeholder="e.g. 7:30" aria-label="' + esc(row) + ' time">' +
            '<input type="text" class="mp-input" data-day-row="' + i + '" data-day-part="what" value="' + esc(v.what) + '" aria-label="' + esc(row) + ' — what you eat">';
        });
        html += '</div>';
        return;
      }
      n++;
      html += '<div class="mp-q"><label class="mp-q-label" for="mp-q-' + q.id + '">' + n + '. ' + esc(q.label) + '</label>';
      if (q.type === 'text'){
        html += '<textarea class="mp-input" id="mp-q-' + q.id + '" name="' + q.id + '" rows="2">' + esc(a[q.id]) + '</textarea>';
      } else if (q.type === 'line'){
        html += '<input type="text" class="mp-input" id="mp-q-' + q.id + '" name="' + q.id + '" value="' + esc(a[q.id]) + '">';
      } else if (q.type === 'number'){
        html += '<input type="number" class="mp-input mp-num" id="mp-q-' + q.id + '" name="' + q.id + '" min="' + q.min + '" max="' + q.max + '" step="any" value="' + esc(a[q.id]) + '">';
      } else {
        const multi = q.type === 'checks';
        const chosen = multi ? (a[q.id] || []) : [a[q.id]];
        html += '<div class="mp-choices" role="group" aria-label="' + esc(q.label) + '">';
        q.options.forEach(opt=>{
          html += '<label class="mp-choice"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + q.id + '" value="' + esc(opt) + '"' +
            (chosen.indexOf(opt) !== -1 ? ' checked' : '') + '> ' + esc(opt) + '</label>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '<div class="mp-actions"><button type="submit" class="btn2 primary">Send to my coach</button></div></form>';
    return html;
  }

  function readQuestionnaire(form){
    const a = {};
    QUESTIONS.forEach(q=>{
      if (!q.id) return;
      if (q.type === 'day'){
        const day = {};
        TYPICAL_DAY_ROWS.forEach((row, i)=>{
          const time = form.querySelector('[data-day-row="' + i + '"][data-day-part="time"]').value.trim();
          const what = form.querySelector('[data-day-row="' + i + '"][data-day-part="what"]').value.trim();
          if (time || what) day[row] = { time, what };
        });
        a.typical_day = day;
      } else if (q.type === 'checks'){
        a[q.id] = Array.from(form.querySelectorAll('input[name="' + q.id + '"]:checked')).map(x=>x.value);
      } else if (q.type === 'radio'){
        const c = form.querySelector('input[name="' + q.id + '"]:checked');
        a[q.id] = c ? c.value : '';
      } else {
        a[q.id] = form.querySelector('[name="' + q.id + '"]').value.trim();
      }
    });
    return a;
  }

  // Read-only answers, for the coach (and the member's own "your answers").
  function answersHtml(a){
    let n = 0, html = '<div class="mp-answers">';
    QUESTIONS.forEach(q=>{
      if (q.section){ html += '<div class="mp-section-head">' + esc(q.section) + '</div>'; return; }
      if (q.type === 'day'){
        const day = a.typical_day || {};
        const rows = TYPICAL_DAY_ROWS.filter(r=> day[r]);
        html += rows.length
          ? '<table class="admin-table mp-day-table"><tr><th>Meal</th><th>Time</th><th>What</th></tr>' +
            rows.map(r=> '<tr><td>' + esc(r) + '</td><td>' + esc(day[r].time) + '</td><td>' + esc(day[r].what) + '</td></tr>').join('') + '</table>'
          : '<div class="mp-a-val mp-empty">Not filled in</div>';
        return;
      }
      n++;
      const v = Array.isArray(a[q.id]) ? a[q.id].join(', ') : a[q.id];
      html += '<div class="mp-a"><div class="mp-a-q">' + n + '. ' + esc(q.label) + '</div>' +
        '<div class="mp-a-val' + (v ? '' : ' mp-empty') + '">' + (v ? esc(v) : 'Not answered') + '</div></div>';
    });
    return html + '</div>';
  }

  /* ---------------- PLAN CONTENT ---------------- */
  // Plain-text fields, one item per line — quick for a coach to write and
  // easy for a member to read on a phone. The grocery list takes one
  // "Category: item, item" line per category, per the guide's "grocery
  // list grouped by category".
  const PLAN_FIELDS = [
    { id:'pattern', label:'Meal pattern', hint:'e.g. 3 meals + 1 snack, breakfast before 8, last meal by 8pm', rows:2 },
    { id:'breakfasts', label:'Breakfast options', hint:'2–3 options, one per line', rows:3, list:true },
    { id:'lunches', label:'Lunch options', hint:'3–4 options, one per line', rows:4, list:true },
    { id:'dinners', label:'Dinner options', hint:'4–5 options, one per line — plan leftovers on purpose (cook once, eat twice)', rows:5, list:true },
    { id:'snacks', label:'Snacks', hint:'A few options, one per line', rows:3, list:true },
    { id:'swaps', label:'Easy swaps', hint:'e.g. chicken ↔ fish ↔ beans, rice ↔ potatoes — one per line', rows:3, list:true },
    { id:'eating_out', label:'Eating out', hint:'What to order or look for when eating out', rows:2 },
    { id:'grocery', label:'Grocery list', hint:'One line per category, e.g. "Protein: eggs, chicken, beans"', rows:5, grocery:true },
    { id:'notes', label:'Notes from your coach', hint:'Anything else — portions, timing, foods to keep enjoying', rows:3 }
  ];

  function lines(s){ return String(s || '').split('\n').map(x=>x.trim()).filter(Boolean); }

  // opts.collapsible: each block becomes a <details>, closed by default,
  // whose summary shows the title, item count and a one-line preview —
  // used on the AI page, where the plan is long and is mostly skimmed.
  function planViewHtml(plan, opts){
    const collapsible = !!(opts && opts.collapsible);
    const c = plan.content || {};
    let html = '';
    PLAN_FIELDS.forEach(f=>{
      const v = c[f.id];
      if (!v || !String(v).trim()) return;
      if (collapsible){
        const items = lines(v);
        const count = (f.list || f.grocery) ? ' <span class="mp-count">' + items.length + '</span>' : '';
        html += '<details class="mp-plan-block mp-fold"><summary><span class="mp-fold-title">' + esc(f.label) + count + '</span>' +
          '<span class="mp-fold-preview">' + esc(items[0] || '') + '</span></summary>';
      } else {
        html += '<div class="mp-plan-block"><h4>' + esc(f.label) + '</h4>';
      }
      if (f.list){
        html += '<ul>' + lines(v).map(x=> '<li>' + esc(x) + '</li>').join('') + '</ul>';
      } else if (f.grocery){
        html += '<div class="mp-grocery">' + lines(v).map(line=>{
          const i = line.indexOf(':');
          return i > 0
            ? '<div><b>' + esc(line.slice(0, i)) + '</b> ' + esc(line.slice(i + 1).trim()) + '</div>'
            : '<div>' + esc(line) + '</div>';
        }).join('') + '</div>';
      } else {
        html += '<p>' + esc(v).replace(/\n/g, '<br>') + '</p>';
      }
      html += collapsible ? '</details>' : '</div>';
    });
    return html ? '<div class="mp-plan-grid">' + html + '</div>' : '<div class="empty-msg">Your coach hasn’t added anything to the plan yet.</div>';
  }

  function targetsHtml(goals, forCoach){
    if (!goals){
      return '<div class="mp-targets mp-targets-empty">' + (forCoach
        ? 'No calorie/macro targets saved yet — the member sets these with the calculator in Me → Nutrition.'
        : 'No daily targets yet. Set them with the calculator in Me → Nutrition, or just use the plate method: half vegetables, a quarter protein, a quarter starch, plus a little healthy fat.') + '</div>';
    }
    return '<div class="mp-targets">' +
      '<div><span class="mp-t-num">' + goals.target_calories + '</span><span class="mp-t-lbl">kcal / day</span></div>' +
      '<div><span class="mp-t-num">' + goals.target_protein_g + 'g</span><span class="mp-t-lbl">protein</span></div>' +
      '<div><span class="mp-t-num">' + goals.target_carbs_g + 'g</span><span class="mp-t-lbl">carbs</span></div>' +
      '<div><span class="mp-t-num">' + goals.target_fat_g + 'g</span><span class="mp-t-lbl">fat</span></div>' +
      '</div>';
  }

  /* ---------------- CHECK-INS ---------------- */
  const CHECKIN_SCALES = [
    { id:'energy', label:'Energy', low:'Very low', high:'Great' },
    { id:'hunger', label:'Hunger', low:'Always hungry', high:'Satisfied' },
    { id:'digestion', label:'Digestion', low:'Poor', high:'Great' },
    { id:'ease', label:'How easy is the plan to follow?', low:'Very hard', high:'Very easy' }
  ];
  function checkinListHtml(rows){
    if (!rows.length) return '<div class="empty-msg">No check-ins yet.</div>';
    return '<table class="admin-table"><tr><th>Date</th><th>Weight</th>' +
      CHECKIN_SCALES.map(s=> '<th>' + esc(s.id === 'ease' ? 'Ease' : s.label) + '</th>').join('') + '<th>Diet</th><th>Notes</th></tr>' +
      rows.map(r=> '<tr><td>' + fmtDate(r.created_at) + '</td><td>' + (r.weight_kg != null ? esc(r.weight_kg) + ' kg' : '—') + '</td>' +
        CHECKIN_SCALES.map(s=> '<td>' + r[s.id] + '/5</td>').join('') +
        '<td>' + (r.diet ? esc(r.diet) : 'Coach\u2019s plan') + '</td><td>' + (r.notes ? esc(r.notes) : '—') + '</td></tr>').join('') + '</table>';
  }
  function checkinFormHtml(){
    let html = '<form class="mp-form" id="mp-checkin-form"><div class="mp-q"><label class="mp-q-label" for="mp-ci-weight">Current weight (kg, optional)</label>' +
      '<input type="number" class="mp-input mp-num" id="mp-ci-weight" min="20" max="400" step="any"></div>';
    CHECKIN_SCALES.forEach(s=>{
      html += '<div class="mp-q"><div class="mp-q-label">' + esc(s.label) + '</div><div class="mp-choices mp-scale" role="group" aria-label="' + esc(s.label) + '">' +
        '<span class="field-hint">' + esc(s.low) + '</span>';
      for (let i = 1; i <= 5; i++) html += '<label class="mp-choice"><input type="radio" name="ci-' + s.id + '" value="' + i + '"> ' + i + '</label>';
      html += '<span class="field-hint">' + esc(s.high) + '</span></div></div>';
    });
    html += '<div class="mp-q"><label class="mp-q-label" for="mp-ci-notes">Anything to tell your coach? (optional)</label><textarea class="mp-input" id="mp-ci-notes" rows="2" maxlength="1000"></textarea></div>' +
      '<div class="mp-actions"><button type="submit" class="btn2 primary">Send check-in</button></div></form>';
    return html;
  }

  /* ---------------- DATA ---------------- */
  async function loadFor(memberId){
    const ok = await S.loadMember(memberId);
    return {
      intake: S.getIntake(memberId),
      plan: S.getPlan(memberId),
      checkins: S.getCheckins(memberId),
      goals: S.getGoals(memberId),
      error: ok ? null : 'load failed'
    };
  }

  // The guide's steps 2-3 (Mifflin-St Jeor -> activity factor -> goal
  // adjustment -> protein by bodyweight, fat ~30%, carbs the rest),
  // from the questionnaire answers. A starting point for the coach to
  // tweak, not a final number — "her real-world results over 2-3 weeks
  // matter more than the formula."
  function suggestTargets(a){
    const age = Number(a.age), h = Number(a.height_cm), w = Number(a.weight_kg);
    if (!age || !h || !w || !a.sex) return null;
    const exercise = String(a.exercise || '').trim();
    const trains = !!exercise;
    // "Gym 4x/week", "3 times a week", "5 days" -> sessions per week.
    // 3+ sessions is "moderately active" even with a desk job; fewer (or
    // unstated) is "lightly active".
    const perWeek = (exercise.match(/(\d+)\s*(x|×|times|days|sessions)/i) || [])[1];
    const bmr = 10 * w + 6.25 * h - 5 * age + (a.sex === 'Male' ? 5 : -161);
    const factor = a.job_activity === 'Physically demanding' ? 1.725
      : a.job_activity === 'On my feet some of the day' ? 1.55
      : !trains ? 1.2
      : Number(perWeek) >= 3 ? 1.55 : 1.375;
    const goals = a.goals || [];
    let cal = bmr * factor;
    if (goals.includes('Lose fat')) cal -= 500;
    else if (goals.includes('Build muscle')) cal += 250;
    cal = Math.round(cal / 10) * 10;
    const protein = Math.round(w * (trains ? 1.8 : 1.2));
    const fat = Math.round(cal * 0.30 / 9);
    const carbs = Math.max(0, Math.round((cal - protein * 4 - fat * 9) / 4));
    return { target_calories: cal, target_protein_g: protein, target_carbs_g: carbs, target_fat_g: fat };
  }

  /* ============================================================
     HOW IT WORKS (member-facing explanation)
     The gym's meal-plan guide (lappy/prof-meal-plan-Ndombii/
     Meal_Plan_Guide(1).docx) is written for coaches; this is the same
     seven steps reworded for the member, so they know what happens to
     their answers and why the plan looks the way it does. Where their
     questionnaire has the numbers, step 2 shows their own calculation.
     ============================================================ */
  function yourNumbersHtml(a){
    const t = a && suggestTargets(a);
    if (!t) return '';
    const age = Number(a.age), h = Number(a.height_cm), w = Number(a.weight_kg);
    const bmr = Math.round(10 * w + 6.25 * h - 5 * age + (a.sex === 'Male' ? 5 : -161));
    return '<div class="mp-plan-block mp-your-numbers"><h4>With your answers</h4><p>' +
      esc(a.sex) + ', ' + esc(age) + ', ' + esc(h) + ' cm, ' + esc(w) + ' kg → about <b>' + bmr.toLocaleString() + ' kcal</b> a day at rest. ' +
      'With your activity and goal, a starting point of roughly <b>' + t.target_calories.toLocaleString() + ' kcal</b>: ' +
      t.target_protein_g + ' g protein, ' + t.target_carbs_g + ' g carbs, ' + t.target_fat_g + ' g fat. ' +
      'Your coach may set it differently — they know you, the formula doesn\u2019t.</p></div>';
  }

  function howItWorksHtml(answers){
    const step = (n, title, body) => '<div class="mp-how-step"><div class="mp-how-num">' + n + '</div><div><h3>' + title + '</h3>' + body + '</div></div>';
    return '<div class="day-focus">How your meal plan works</div>' +
      '<p class="mp-how-lede">Your plan isn\u2019t a generic diet sheet. Your coach builds it around you in seven steps, then adjusts it as you go. Here\u2019s what happens, and why.</p>' +

      step(1, 'You tell us about you',
        '<p>The questionnaire covers your goals, how active you are, your health, the foods you love and won\u2019t eat, your budget, cooking time, and who you eat with. ' +
        'The most useful part is <b>what you eat on a normal day right now</b> — the best plan usually adjusts the habits you already have rather than replacing them, so be honest; there are no wrong answers.</p>' +
        '<p>Only your coach and the gym admin can see your answers. Prefer paper? <a href="docs/Meal_Plan_Questionnaire.pdf" target="_blank" rel="noopener">Download the printable questionnaire</a>.</p>') +

      step(2, 'We estimate how much energy you need',
        '<p>Your coach starts from a standard formula (Mifflin-St Jeor) that uses your weight, height, age and sex to estimate what your body burns at rest, then multiplies it by how active you are — from 1.2 if you mostly sit, up to 1.725 if you\u2019re very active.</p>' +
        '<p>Then it\u2019s adjusted for your goal: about 300–500 kcal less a day for gradual fat loss, or 200–300 kcal more for building muscle. ' +
        'These are estimates. <b>How your body actually responds over 2–3 weeks matters more than the formula</b>, which is why step 7 exists.</p>' +
        yourNumbersHtml(answers)) +

      step(3, 'We balance protein, fat and carbs',
        '<ul><li><b>Protein</b> — about 1.6–2.2 g per kg of body weight if you train, or about 1.2 g/kg if you\u2019re less active. It keeps you full and protects muscle.</li>' +
        '<li><b>Fat</b> — about a quarter to a third of your calories.</li>' +
        '<li><b>Carbs</b> — the rest, mostly from whole grains, fruit, vegetables, beans and starchy staples.</li></ul>' +
        '<p>Don\u2019t want to count anything? You don\u2019t have to. Use the <b>plate method</b>: half the plate vegetables, a quarter protein, a quarter starch, plus a little healthy fat.</p>' +
        '<div class="mp-plate" role="img" aria-label="Plate method: half vegetables, a quarter protein, a quarter starch">' +
          '<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="var(--surface-2)" stroke="var(--line)" stroke-width="2"/>' +
          '<path d="M60 60 L60 4 A56 56 0 0 0 60 116 Z" fill="rgba(var(--accent-3-rgb),.55)"/>' +
          '<path d="M60 60 L60 4 A56 56 0 0 1 116 60 Z" fill="rgba(var(--accent-rgb),.6)"/>' +
          '<path d="M60 60 L116 60 A56 56 0 0 1 60 116 Z" fill="rgba(var(--accent-rgb),.28)"/></svg>' +
          '<ul class="mp-plate-key"><li><span class="k veg"></span>½ vegetables</li><li><span class="k pro"></span>¼ protein</li><li><span class="k sta"></span>¼ starch</li><li>+ a little healthy fat</li></ul></div>') +

      step(4, 'We build your meals',
        '<p>First, a meal pattern that fits your day — for example 3 meals and 1 snack. Then every meal is built from four parts:</p>' +
        '<ul><li><b>A protein</b> — eggs, chicken, fish, beans, lentils, yoghurt, beef</li>' +
        '<li><b>A carb or starch</b> — rice, potatoes, oats, bread, whole grains</li>' +
        '<li><b>Vegetables and/or fruit</b></li>' +
        '<li><b>A bit of fat</b> — oil, avocado, nuts, seeds</li></ul>') +

      step(5, 'A week that repeats',
        '<p>You won\u2019t get 21 different meals to cook — people stick with plans that repeat. Expect 2–3 breakfast options, 3–4 lunches, 4–5 dinners and a few snacks, rotated through the week. ' +
        'Leftovers are planned on purpose (cook once, eat twice), and you get a grocery list grouped by category.</p>') +

      step(6, 'Room to be flexible',
        '<p>A rigid plan tends to fail by week two, so yours includes simple swaps (chicken ↔ fish ↔ beans, rice ↔ potatoes), a plan for eating out, and room for the foods you enjoy.</p>') +

      step(7, 'Check in, then adjust',
        '<p>Every 2–3 weeks you send a quick check-in: your weight, energy, hunger, digestion, and how easy the plan is to follow. ' +
        'Your coach uses it to adjust portions or calories in small steps — so the plan keeps fitting you, not the formula.</p>') +

      '<div class="admin-notice mp-refer"><b>When a dietitian helps too.</b> If you have diabetes or kidney disease, are pregnant or breastfeeding, have had a difficult relationship with food, or take medication that diet can affect, your coach will suggest also working with a registered dietitian. ' +
      'You can still get help with general healthy-eating structure here — it\u2019s about getting you the right support, not turning you away.</div>' +

''
  }

  /* ============================================================
     MEMBER VIEW
     ============================================================ */
  let memberPage = 'coach'; // 'coach' | 'how' | 'diets' — which page
  let dietOpenId = null, dietVariantId = null; // Try a diet: which diet / option is open
  let memberViewerId = null;
  let memberMode = null; // null = auto, 'edit' = editing the questionnaire

  async function renderMember(){
    if (!memberBody) return;
    const me = self();
    if (!me){ memberBody.innerHTML = '<div class="empty-msg">Sign in to start your meal plan.</div>'; return; }
    // A different person opened the page (View as): start them on their
    // own plan/questionnaire, not on whatever page the last person left open.
    if (memberViewerId !== me.id){ memberViewerId = me.id; memberPage = 'coach'; memberMode = null; dietOpenId = null; dietVariantId = null; }
    memberBody.innerHTML = '<div class="empty-msg">Loading…</div>';
    const d = await loadFor(me.id);
    if (d.error){ memberBody.innerHTML = '<div class="empty-msg">Couldn’t load your meal plan — check your connection and try again.</div>'; return; }

    const head = '<div class="day-head"><h2>Meal Plan</h2></div>';
    // Private draft page: only exists for the owner's account, and only
    // if the git-ignored js/coach-ka-draft.js is present.
    // "Try a diet" tab only when this viewer can see at least one diet
    // (drafts are visible to their owner only — see js/diets.js).
    await S.loadDiets();
    const showDiets = !!(window.MP_DIETS && window.MP_DIETS.visibleTo(me).length);
    if (memberPage === 'diets' && !showDiets) memberPage = 'coach';
    const pageTabs = '<div class="sched-sub mp-page-tabs">' +
      (d.intake ? '<button type="button" data-mp-page="coach" class="' + (memberPage === 'coach' ? 'active' : '') + '">Coach\u2019s plan</button>' +
        '' : '') +
      '<button type="button" data-mp-page="how" class="' + (memberPage === 'how' ? 'active' : '') + '">How it works</button>' +
      (showDiets ? '<button type="button" data-mp-page="diets" class="' + (memberPage === 'diets' ? 'active' : '') + '">Try a diet</button>' : '') + '</div>';
    const wirePageTabs = ()=> memberBody.querySelectorAll('[data-mp-page]').forEach(b=> b.addEventListener('click', ()=>{
      memberPage = b.getAttribute('data-mp-page'); memberMode = null; renderMember(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }));

    if (memberPage === 'diets'){
      const answers = d.intake ? d.intake.answers : null;
      const trial = S.getTrial(me.id);
      const diet = dietOpenId && window.MP_DIETS.visibleTo(me).find(x=> x.id === dietOpenId);
      memberBody.innerHTML = head + pageTabs + (diet
        ? window.MP_DIETS.detailHtml(diet, me, answers, trial, dietVariantId)
        : window.MP_DIETS.listHtml(me, trial));
      wirePageTabs();
      const rerender = ()=>{ renderMember(); };
      memberBody.querySelectorAll('[data-diet-open]').forEach(b=> b.addEventListener('click', ()=>{
        dietOpenId = b.getAttribute('data-diet-open'); dietVariantId = null; rerender(); window.scrollTo({ top: 0, behavior: 'smooth' });
      }));
      const editOwn = memberBody.querySelector('[data-diet-edit-own]');
      if (editOwn) editOwn.addEventListener('click', ()=>{
        window.MP_DIETS.startEditing(editOwn.getAttribute('data-diet-edit-own'));
        coachSection = 'diets';
        if (typeof window.switchTab === 'function') window.switchTab('coach');
        const tile = document.querySelector('#coach-section-switch [data-coach-section="mealplans"]');
        if (tile) tile.click();
      });
      const back = memberBody.querySelector('[data-diet-back]');
      if (back) back.addEventListener('click', ()=>{ dietOpenId = null; dietVariantId = null; rerender(); });
      memberBody.querySelectorAll('[data-diet-variant]').forEach(b=> b.addEventListener('click', ()=>{
        dietVariantId = b.getAttribute('data-diet-variant'); rerender();
      }));
      const start = memberBody.querySelector('[data-diet-start]');
      if (start) start.addEventListener('click', async ()=>{
        const shown = memberBody.querySelector('[data-diet-variant].active');
        const variant = diet.variants.find(v=> v.id === (shown && shown.getAttribute('data-diet-variant')));
        try { await S.startTrial(diet, variant); } catch (err){ toast(err.message); return; }
        dietVariantId = null;
        toast('You\u2019re trying ' + diet.name + (variant ? ' — ' + variant.label : '') + '. Your coach has been told.');
        rerender();
      });
      const stop = memberBody.querySelector('[data-diet-stop]');
      if (stop) stop.addEventListener('click', async ()=>{
        if (!confirm('Stop trying ' + diet.name + '?')) return;
        try { await S.stopTrial(); } catch (err){ toast(err.message); return; }
        toast('Stopped. Your coach has been told.'); rerender();
      });
      return;
    }

    if (memberPage === 'how'){
      memberBody.innerHTML = head + pageTabs + howItWorksHtml(d.intake ? d.intake.answers : null) +
        (d.intake ? '' : '<div class="mp-actions"><button type="button" class="btn2 primary" id="mp-start-questionnaire">Start the questionnaire</button></div>');
      wirePageTabs();
      const start = document.getElementById('mp-start-questionnaire');
      if (start) start.addEventListener('click', ()=>{ memberPage = 'coach'; renderMember(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      return;
    }

    if (!d.intake || memberMode === 'edit'){
      const prefill = d.intake ? d.intake.answers : {
        sex: d.goals ? (d.goals.sex === 'female' ? 'Female' : 'Male') : '',
        age: d.goals ? d.goals.age : '',
        height_cm: (d.goals && d.goals.height_cm) || me.height || '',
        weight_kg: (d.goals && d.goals.weight_kg) || me.weight || ''
      };
      memberBody.innerHTML = head + (d.intake ? '' : pageTabs) +
        '<div class="day-focus">' + (d.intake ? 'Update your answers' : 'Step 1 — tell your coach about you') + '</div>' +
        '<div class="admin-notice">Fill in as much as you can. Your answers help your coach build a plan that fits your goals, tastes and daily routine. Only your coach and the gym admin can see them.' +
        (me.trainerId ? ' Your coach: <b>' + esc(nameOf(me.trainerId)) + '</b>.' : ' <b>You don’t have a coach assigned yet</b> — until then it goes to the admin.') + '</div>' +
        questionnaireFormHtml(prefill) +
        (d.intake ? '<div class="mp-actions"><button type="button" class="btn2" id="mp-cancel-edit">Cancel</button></div>' : '');
      wirePageTabs();
      const form = document.getElementById('mp-intake-form');
      form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true;
        const answers = readQuestionnaire(form);
        try { await S.saveIntake(answers); }
        catch (err){ btn.disabled = false; toast(err.message); return; }
        btn.disabled = false;
        memberMode = null;
        toast(d.intake ? 'Answers updated — your coach has been told.' : 'Sent to your coach!');
        renderMember();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      const cancel = document.getElementById('mp-cancel-edit');
      if (cancel) cancel.addEventListener('click', ()=>{ memberMode = null; renderMember(); });
      return;
    }

    let html = head;
    if (referralFlags(d.intake.answers).some(f=> f.strong)) html += '<div class="admin-notice mp-refer">' + REFER_NOTE + '</div>';
    html += pageTabs;

    if (!d.plan){
      html += '<div class="day-focus">Step 2 — your coach is building your plan</div>' +
        '<div class="empty-msg">Your answers are with your coach (sent ' + fmtDate(d.intake.submitted_at) + '). You’ll get a notification when your plan is ready.</div>';
    } else {
      html += '<div class="day-focus">Your plan · updated ' + fmtDate(d.plan.updated_at) + (d.plan.coach_id ? ' by ' + esc(nameOf(d.plan.coach_id)) : '') + '</div>' +
        '<div class="mp-sub-head">Daily targets</div>' + targetsHtml(d.goals, false) +
        planViewHtml(d.plan);

      const last = d.checkins[0];
      const due = !last || daysSince(last.created_at) >= 14;
      html += '<div class="mp-sub-head">Check in</div>' +
        '<div class="field-hint" style="margin:-4px 0 12px;">Every 2–3 weeks, tell your coach how it’s going so they can adjust portions or calories in small steps.' +
        (last ? ' Last check-in: ' + fmtDate(last.created_at) + '.' : '') + '</div>';
      html += due ? checkinFormHtml()
        : '<details class="mp-details"><summary>Send a check-in early</summary>' + checkinFormHtml() + '</details>';
      if (d.checkins.length) html += '<details class="mp-details"><summary>Past check-ins (' + d.checkins.length + ')</summary>' + checkinListHtml(d.checkins) + '</details>';
    }
    html += '<details class="mp-details"><summary>Your questionnaire answers</summary>' + answersHtml(d.intake.answers) +
      '<div class="mp-actions"><button type="button" class="btn2" id="mp-edit-intake">Update my answers</button></div></details>';
    memberBody.innerHTML = html;

    wirePageTabs();
    document.getElementById('mp-edit-intake').addEventListener('click', ()=>{ memberMode = 'edit'; renderMember(); });
    const ciForm = document.getElementById('mp-checkin-form');
    if (ciForm) ciForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const row = { member_id: me.id };
      for (const s of CHECKIN_SCALES){
        const c = ciForm.querySelector('input[name="ci-' + s.id + '"]:checked');
        if (!c){ toast('Rate all four questions first.'); return; }
        row[s.id] = Number(c.value);
      }
      const w = document.getElementById('mp-ci-weight').value;
      row.weight_kg = w ? Number(w) : null;
      row.notes = document.getElementById('mp-ci-notes').value.trim() || null;
      const btn = ciForm.querySelector('button[type=submit]');
      btn.disabled = true;
      try { delete row.member_id; await S.addCheckin(row); }
      catch (err){ btn.disabled = false; toast(err.message); return; }
      btn.disabled = false;
      toast('Check-in sent to your coach.');
      renderMember();
    });
  }

  /* ============================================================
     COACH VIEW
     ============================================================ */
  let coachSelected = null;
  let coachSection = 'clients'; // 'clients' | 'diets' (My diets — only for coaches who wrote one)
  let coachTab = 'answers'; // 'answers' | 'plan' | 'checkins'

  async function renderCoach(){
    if (!coachBody) return;
    const me = self();
    if (!me){ coachBody.innerHTML = ''; return; }
    coachBody.innerHTML = '<div class="empty-msg">Loading…</div>';

    await S.loadDiets();
    // Coaches who've written a diet also get "My diets" (the editor).
    const ownsDiets = !!(window.MP_DIETS && window.MP_DIETS.ownedBy(me).length);
    if (!ownsDiets) coachSection = 'clients';
    const sectionTabs = ownsDiets ? '<div class="sched-sub mp-coach-sections">' +
      '<button type="button" data-coach-sec="clients" class="' + (coachSection === 'clients' ? 'active' : '') + '">Clients\u2019 meal plans</button>' +
      '<button type="button" data-coach-sec="diets" class="' + (coachSection === 'diets' ? 'active' : '') + '">My diets</button></div>' : '';
    const wireSections = ()=> coachBody.querySelectorAll('[data-coach-sec]').forEach(b=> b.addEventListener('click', ()=>{
      coachSection = b.getAttribute('data-coach-sec'); renderCoach(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
    if (coachSection === 'diets'){
      coachBody.innerHTML = sectionTabs + '<div id="mp-diet-editor"></div>';
      wireSections();
      window.MP_DIETS.renderEditor(document.getElementById('mp-diet-editor'), me, toast);
      return;
    }

    // RLS already limits these to the caller's own clients (or everyone,
    // for an admin) — no client-side filtering needed.
    if (!(await S.loadCoachList())){ coachBody.innerHTML = sectionTabs + '<div class="empty-msg">Couldn\u2019t load meal plans.</div>'; wireSections(); return; }
    const rows = S.visibleIntakes();
    const plans = { data: S.coachPlans() };
    const checkins = { data: S.coachCheckins() };
    if (!rows.length){
      coachBody.innerHTML = sectionTabs + '<div class="empty-msg">No questionnaires yet. When one of your clients fills in theirs (Me → Meal Plan), it shows up here and you get a notification.</div>';
      wireSections();
      return;
    }
    const planAt = {}; (plans.data || []).forEach(p=> planAt[p.member_id] = p.updated_at);
    const lastCheckin = {}; (checkins.data || []).forEach(c=>{ if (!lastCheckin[c.member_id]) lastCheckin[c.member_id] = c.created_at; });
    if (!coachSelected || !rows.some(r=> r.member_id === coachSelected)) coachSelected = rows[0].member_id;

    const status = r=>{
      if (!planAt[r.member_id]) return '<span class="mp-pill todo">Needs plan</span>';
      if (lastCheckin[r.member_id] && lastCheckin[r.member_id] > planAt[r.member_id]) return '<span class="mp-pill todo">New check-in</span>';
      if (r.updated_at > planAt[r.member_id]) return '<span class="mp-pill todo">Answers updated</span>';
      return '<span class="mp-pill ok">Plan sent</span>';
    };

    let html = '<div class="mp-coach-layout"><div class="mp-client-list">' + rows.map(r=>
      '<button type="button" class="mp-client' + (r.member_id === coachSelected ? ' active' : '') + '" data-member="' + r.member_id + '">' +
      '<span>' + esc(nameOf(r.member_id)) + (referralFlags(r.answers).some(f=> f.strong) ? ' <span class="mp-flag-dot" title="Consider a dietitian referral">⚑</span>' : '') + '</span>' + status(r) + '</button>'
    ).join('') + '</div><div class="mp-client-detail" id="mp-coach-detail"><div class="empty-msg">Loading…</div></div></div>';
    coachBody.innerHTML = sectionTabs + html;
    wireSections();
    coachBody.querySelectorAll('.mp-client').forEach(b=> b.addEventListener('click', ()=>{
      coachSelected = b.getAttribute('data-member'); renderCoach();
    }));
    renderCoachDetail();
  }

  async function renderCoachDetail(){
    const el = document.getElementById('mp-coach-detail');
    if (!el || !coachSelected) return;
    const memberId = coachSelected;
    const d = await loadFor(memberId);
    if (memberId !== coachSelected) return; // selection changed while loading
    if (!d.intake){ el.innerHTML = '<div class="empty-msg">No questionnaire for this member.</div>'; return; }

    const flags = referralFlags(d.intake.answers);
    let html = '<div class="mp-detail-head"><h3>' + esc(nameOf(memberId)) + '</h3>' +
      '<span class="field-hint">Questionnaire sent ' + fmtDate(d.intake.submitted_at) +
      (d.intake.updated_at !== d.intake.submitted_at ? ', updated ' + fmtDate(d.intake.updated_at) : '') + '</span></div>';
    const trial = S.getTrial(memberId);
    if (trial) html += '<div class="admin-notice diet-active">Trying <b>' + esc(trial.diet_name) + '</b>' + (trial.variant_label ? ' (' + esc(trial.variant_label) + ')' : '') +
      ' since ' + fmtDate(trial.started_at) + ' — alongside your plan. Their check-ins show which diet they were on.</div>';
    if (flags.length){
      const strong = flags.some(f=> f.strong);
      html += '<div class="admin-notice mp-refer"><b>' + (strong ? 'Consider referring to a registered dietitian:' : 'Worth checking:') + '</b><ul>' +
        flags.map(f=> '<li>' + esc(f.text) + '</li>').join('') +
        '</ul>' + (strong ? 'You can still help with general healthy-eating structure.' : '') + '</div>';
    }
    html += '<div class="sched-sub mp-coach-tabs">' +
      ['answers','plan','checkins'].map(t=> '<button type="button" data-mp-tab="' + t + '" class="' + (t === coachTab ? 'active' : '') + '">' +
        (t === 'answers' ? 'Questionnaire' : t === 'plan' ? (d.plan ? 'Edit Plan' : 'Write Plan') : 'Check-ins (' + d.checkins.length + ')') + '</button>').join('') + '</div>';

    if (coachTab === 'answers'){
      html += answersHtml(d.intake.answers);
    } else if (coachTab === 'checkins'){
      html += checkinListHtml(d.checkins);
    } else {
      const c = (d.plan && d.plan.content) || {};
      html += '<div class="mp-sub-head" style="margin-top:0;">Daily targets</div>' + targetsHtml(d.goals, true) +
        '<form class="mp-form" id="mp-plan-form">' +
        '<div class="mp-editor-grid">' + PLAN_FIELDS.map(f=> '<div class="mp-q' + (f.id === 'pattern' ? ' mp-wide' : '') + '"><label class="mp-q-label" for="mp-p-' + f.id + '">' + esc(f.label) + '</label>' +
          '<div class="field-hint mp-q-hint">' + esc(f.hint) + '</div>' +
          '<textarea class="mp-input" id="mp-p-' + f.id + '" name="' + f.id + '" rows="' + f.rows + '">' + esc(c[f.id]) + '</textarea></div>').join('') + '</div>' +
        '<div class="mp-actions"><button type="submit" class="btn2 primary">' + (d.plan ? 'Save & notify member' : 'Send plan to member') + '</button>' +
        (d.plan ? '<span class="field-hint">Last saved ' + fmtDate(d.plan.updated_at) + '</span>' : '') + '</div></form>';
    }
    el.innerHTML = html;

    el.querySelectorAll('[data-mp-tab]').forEach(b=> b.addEventListener('click', ()=>{
      coachTab = b.getAttribute('data-mp-tab'); renderCoachDetail();
    }));
    const form = document.getElementById('mp-plan-form');
    if (form) form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const content = {};
      PLAN_FIELDS.forEach(f=>{ content[f.id] = form.querySelector('[name="' + f.id + '"]').value.trim(); });
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try { await S.savePlan(memberId, content); }
      catch (err){ btn.disabled = false; toast(err.message); return; }
      btn.disabled = false;
      toast('Plan saved — ' + nameOf(memberId) + ' has been notified.');
      renderCoach();
    });
  }

  window.bnbMealPlanOnTabShown = renderMember;
  window.bnbMealPlanCoachOnShown = renderCoach;
  if (memberBody) renderMember();
})();
