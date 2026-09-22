(function(){
  const dateInput = document.getElementById('nutrition-date');
  const caloriesInput = document.getElementById('nutrition-calories');
  const proteinInput = document.getElementById('nutrition-protein');
  const carbsInput = document.getElementById('nutrition-carbs');
  const fatInput = document.getElementById('nutrition-fat');
  const waterInput = document.getElementById('nutrition-water');
  const notesInput = document.getElementById('nutrition-notes');
  const submitBtn = document.getElementById('nutrition-submit');
  const statsBox = document.getElementById('nutrition-stats');
  const statCalories = document.getElementById('nutrition-stat-calories');
  const statProtein = document.getElementById('nutrition-stat-protein');
  const statCarbs = document.getElementById('nutrition-stat-carbs');
  const statFat = document.getElementById('nutrition-stat-fat');
  const chartEmpty = document.getElementById('nutrition-chart-empty');
  const chartSvg = document.getElementById('nutrition-chart-svg');
  const chartLegend = document.getElementById('nutrition-chart-legend');
  const historyTable = document.getElementById('nutrition-history-table');
  const historyBody = document.getElementById('nutrition-history-body');
  const historyEmpty = document.getElementById('nutrition-history-empty');
  const clearBtn = document.getElementById('nutrition-clear-btn');
  const goalSummaryBox = document.getElementById('nutrition-goal-summary');
  const goalEmptyHint = document.getElementById('nutrition-goal-empty');
  const ngsCalories = document.getElementById('ngs-calories');
  const ngsProtein = document.getElementById('ngs-protein');
  const ngsCarbs = document.getElementById('ngs-carbs');
  const ngsFat = document.getElementById('ngs-fat');
  const ccSexSelect = document.getElementById('cc-sex');
  const ccAgeInput = document.getElementById('cc-age');
  const ccHeightInput = document.getElementById('cc-height');
  const ccWeightInput = document.getElementById('cc-weight');
  const ccWeightUnitLabel = document.getElementById('cc-weight-unit-label');
  const ccActivitySelect = document.getElementById('cc-activity');
  const ccGoalSelect = document.getElementById('cc-goal');
  const ccCalculateBtn = document.getElementById('cc-calculate');
  const ccResultsBox = document.getElementById('cc-results');
  const ccResultCalories = document.getElementById('cc-result-calories');
  const ccResultProtein = document.getElementById('cc-result-protein');
  const ccResultCarbs = document.getElementById('cc-result-carbs');
  const ccResultFat = document.getElementById('cc-result-fat');

  if (!dateInput) return; // Nutrition tab not present on this page

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  /* ---------------- CALORIE & MACRO CALCULATOR ----------------
     Mifflin-St Jeor BMR -> TDEE (activity multiplier) -> calorie
     target (+/- for goal) -> protein by bodyweight -> fat by % of
     calories -> carbs fill whatever's left. Reuses the Weight
     tracker's own kg/lb preference (bnb-weight-unit) so this doesn't
     need a second unit toggle, and — via window.BNB_WEIGHT, exposed
     by js/bells-n-barz-weight.js, already loaded before this module
     since "Me" defaults to Weight/BMI — pre-fills weight from the
     member's most recent logged entry when they haven't set goals yet. */
  const KG_PER_LB = 0.45359237;
  function getWeightUnit(){
    try { return localStorage.getItem('bnb-weight-unit') || 'lb'; } catch(e){ return 'lb'; }
  }
  function displayWeightToKg(v){ return getWeightUnit() === 'kg' ? v : v * KG_PER_LB; }
  function kgToDisplayWeight(kg){ return getWeightUnit() === 'kg' ? kg : kg / KG_PER_LB; }

  function calcBMR(sex, weightKg, heightCm, age){
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === 'male' ? base + 5 : base - 161;
  }
  function calcGoals(sex, weightKg, heightCm, age, activityMultiplier, goal){
    const bmr = calcBMR(sex, weightKg, heightCm, age);
    const tdee = bmr * activityMultiplier;
    let calories = tdee;
    if (goal === 'lose') calories -= 500;
    else if (goal === 'gain') calories += 400;
    calories = Math.max(1200, calories); // sane floor regardless of inputs
    const weightLb = weightKg / KG_PER_LB;
    const proteinG = Math.round(weightLb * 0.85); // midpoint of the 0.7-1g/lb range
    const fatCalories = calories * 0.28; // midpoint of the 20-35% range
    const fatG = Math.round(fatCalories / 9);
    const proteinCalories = proteinG * 4;
    const carbsCalories = Math.max(0, calories - proteinCalories - fatCalories);
    const carbsG = Math.round(carbsCalories / 4);
    return { calories: Math.round(calories), proteinG: proteinG, fatG: fatG, carbsG: carbsG };
  }

  let goalsCache = null; // populated by refreshGoalsFromSupabase; null until goals are set

  function showResults(cal, protein, carbs, fat){
    ccResultsBox.style.display = 'grid';
    ccResultCalories.textContent = cal + ' kcal';
    ccResultProtein.textContent = protein + 'g';
    ccResultCarbs.textContent = carbs + 'g';
    ccResultFat.textContent = fat + 'g';
  }
  function populateCalculatorForm(g){
    ccSexSelect.value = g.sex;
    ccAgeInput.value = g.age;
    ccHeightInput.value = g.height_cm;
    ccWeightInput.value = kgToDisplayWeight(g.weight_kg).toFixed(1);
    ccActivitySelect.value = String(g.activity_multiplier);
    ccGoalSelect.value = g.goal;
    showResults(g.target_calories, g.target_protein_g, g.target_carbs_g, g.target_fat_g);
  }
  function prefillWeightFromTracker(){
    // Only a convenience default before any goals are saved — never
    // overwrites a value the member already typed or already saved.
    if (goalsCache || ccWeightInput.value) return;
    const entries = window.BNB_WEIGHT && window.BNB_WEIGHT.getEntries ? window.BNB_WEIGHT.getEntries() : [];
    if (entries.length){
      ccWeightInput.value = kgToDisplayWeight(entries[entries.length - 1].kg).toFixed(1);
    }
  }
  async function refreshGoalsFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const { data, error } = await bnbClient.from('nutrition_goals').select('*').eq('user_id', me.id).maybeSingle();
    if (error) { console.error('Supabase load nutrition_goals failed:', error); return; }
    goalsCache = data || null;
    if (goalsCache) populateCalculatorForm(goalsCache);
    else prefillWeightFromTracker();
    renderGoalSummary();
  }
  async function saveGoals(row){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const payload = Object.assign({ user_id: me.id, updated_at: new Date().toISOString() }, row);
    const { error } = await bnbClient.from('nutrition_goals').upsert([payload], { onConflict: 'user_id' });
    if (error) { console.error('Supabase save nutrition_goals failed:', error); return; }
    goalsCache = payload;
    renderGoalSummary();
  }
  function renderGoalSummary(){
    if (!goalsCache){
      goalSummaryBox.style.display = 'none';
      goalEmptyHint.style.display = '';
      return;
    }
    goalSummaryBox.style.display = 'grid';
    goalEmptyHint.style.display = 'none';
    const today = loadEntries().find(e => e.date === todayIso());
    ngsCalories.textContent = (today && today.calories != null ? today.calories : 0) + ' / ' + goalsCache.target_calories + ' kcal';
    ngsProtein.textContent = (today && today.proteinG != null ? today.proteinG : 0) + ' / ' + goalsCache.target_protein_g + 'g';
    ngsCarbs.textContent = (today && today.carbsG != null ? today.carbsG : 0) + ' / ' + goalsCache.target_carbs_g + 'g';
    ngsFat.textContent = (today && today.fatG != null ? today.fatG : 0) + ' / ' + goalsCache.target_fat_g + 'g';
  }
  ccWeightUnitLabel.textContent = getWeightUnit();
  ccCalculateBtn.addEventListener('click', () => {
    const weightDisplay = Number(ccWeightInput.value);
    if (!ccWeightInput.value || !(weightDisplay > 0)){
      const t = document.getElementById('t-toast');
      if (t){ t.textContent = 'Enter your weight first.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
      ccWeightInput.focus();
      return;
    }
    const sex = ccSexSelect.value;
    const age = Math.max(10, Math.min(100, Math.round(Number(ccAgeInput.value)) || 30));
    const heightCm = Math.max(100, Math.min(250, Number(ccHeightInput.value) || 170));
    const weightKg = displayWeightToKg(weightDisplay);
    const activityMultiplier = Number(ccActivitySelect.value);
    const goal = ccGoalSelect.value;
    const targets = calcGoals(sex, weightKg, heightCm, age, activityMultiplier, goal);
    showResults(targets.calories, targets.proteinG, targets.carbsG, targets.fatG);
    saveGoals({
      sex: sex, age: age, height_cm: heightCm, weight_kg: weightKg, activity_multiplier: activityMultiplier, goal: goal,
      target_calories: targets.calories, target_protein_g: targets.proteinG, target_carbs_g: targets.carbsG, target_fat_g: targets.fatG
    });
  });

  let entriesCache = null; // populated by refreshEntriesFromSupabase

  function num(v){ return v === '' || v == null ? null : Number(v); }

  function nutritionRowToEntry(r){
    return {
      date: r.date, calories: r.calories, proteinG: r.protein_g, carbsG: r.carbs_g,
      fatG: r.fat_g, waterMl: r.water_ml, notes: r.notes || ''
    };
  }
  function entryToNutritionRow(e, userId){
    return {
      user_id: userId, date: e.date, calories: e.calories, protein_g: e.proteinG,
      carbs_g: e.carbsG, fat_g: e.fatG, water_ml: e.waterMl, notes: e.notes || null
    };
  }

  function loadEntries(){
    // Instant read from cache; starts empty until the first Supabase
    // fetch resolves (see refreshEntriesFromSupabase below).
    const arr = entriesCache || [];
    return arr.slice().sort((a,b) => a.date.localeCompare(b.date));
  }
  async function refreshEntriesFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // nobody logged in yet — nothing to fetch
    const { data, error } = await bnbClient.from('nutrition_log').select('*').eq('user_id', me.id);
    if (error) { console.error('Supabase load nutrition_log failed:', error); return; }
    entriesCache = (data || []).map(nutritionRowToEntry);
    if (typeof render === 'function') render();
  }
  function saveEntries(entries){
    entriesCache = entries;
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // guest / nobody logged in — local-only for this session
    (async () => {
      try {
        // Same approach as the Weight/Period trackers: no unique constraint
        // to key an upsert off of, and this table is small per user —
        // delete this user's rows, then re-insert the current set.
        await bnbClient.from('nutrition_log').delete().eq('user_id', me.id);
        if (entries.length){
          const rows = entries.map(e => entryToNutritionRow(e, me.id));
          const { error } = await bnbClient.from('nutrition_log').insert(rows);
          if (error) throw error;
        }
      } catch(e){
        console.warn('Supabase save nutrition_log failed:', e);
      }
    })();
  }

  function todayIso(){
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0,10);
  }
  function fmtDate(iso){
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }

  function upsertEntry(entry){
    const entries = loadEntries();
    const idx = entries.findIndex(e => e.date === entry.date);
    if (idx >= 0) entries[idx] = entry; else entries.push(entry);
    entries.sort((a,b) => a.date.localeCompare(b.date));
    saveEntries(entries);
  }
  function deleteEntry(date){
    const entries = loadEntries().filter(e => e.date !== date);
    saveEntries(entries);
  }

  function buildChart(points){
    const W = 700, H = 320, padL = 44, padR = 20, padT = 20, padB = 36;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const dates = points.map(p => new Date(p.date + 'T00:00:00').getTime());
    const values = points.map(p => p.value);
    let minD = Math.min(...dates), maxD = Math.max(...dates);
    if (minD === maxD) { minD -= 86400000; maxD += 86400000; }
    let minV = Math.min(...values), maxV = Math.max(...values);
    if (minV === maxV) { minV -= 2; maxV += 2; }
    const pad = (maxV - minV) * 0.15 || 2;
    minV -= pad; maxV += pad;

    const x = t => padL + ((t - minD) / (maxD - minD)) * innerW;
    const y = v => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;

    let svg = '';
    const bands = 4;
    for (let i = 0; i <= bands; i++){
      const v = minV + (maxV - minV) * (i / bands);
      const yy = y(v);
      svg += `<line class="grid-line" x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}"/>`;
      svg += `<text class="axis-label" x="${padL-8}" y="${yy+3}" text-anchor="end">${v.toFixed(0)}</text>`;
    }
    const labelIdxs = points.length > 2 ? [0, Math.floor((points.length-1)/2), points.length-1] : points.map((_,i)=>i);
    labelIdxs.forEach(i => {
      const p = points[i];
      const xx = x(new Date(p.date + 'T00:00:00').getTime());
      svg += `<text class="axis-label" x="${xx}" y="${H-padB+18}" text-anchor="middle">${fmtDate(p.date)}</text>`;
    });

    if (points.length > 1){
      let dataPath = '';
      points.forEach((p, i) => {
        const xx = x(new Date(p.date + 'T00:00:00').getTime());
        const yy = y(values[i]);
        dataPath += (i === 0 ? 'M' : 'L') + xx.toFixed(1) + ',' + yy.toFixed(1) + ' ';
      });
      svg += `<path class="data-line" d="${dataPath}"/>`;
    }

    points.forEach((p, i) => {
      const xx = x(new Date(p.date + 'T00:00:00').getTime());
      const yy = y(values[i]);
      svg += `<circle class="data-dot" cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.5"><title>${fmtDate(p.date)}: ${values[i]} cal</title></circle>`;
    });

    chartSvg.innerHTML = svg;
  }

  function avg(nums){
    const vals = nums.filter(n => n != null && !isNaN(n));
    if (!vals.length) return null;
    return Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
  }

  function render(){
    const entries = loadEntries();
    const last7 = entries.slice(-7);

    // ---- 7-day average stats ----
    if (!entries.length){
      statsBox.style.display = 'none';
    } else {
      statsBox.style.display = 'grid';
      statCalories.textContent = avg(last7.map(e=>e.calories)) ?? '—';
      statProtein.textContent = (avg(last7.map(e=>e.proteinG)) ?? '—') + (last7.some(e=>e.proteinG!=null) ? 'g' : '');
      statCarbs.textContent = (avg(last7.map(e=>e.carbsG)) ?? '—') + (last7.some(e=>e.carbsG!=null) ? 'g' : '');
      statFat.textContent = (avg(last7.map(e=>e.fatG)) ?? '—') + (last7.some(e=>e.fatG!=null) ? 'g' : '');
    }

    // ---- calories trend chart ----
    const caloriePoints = entries.filter(e => e.calories != null).map(e => ({ date: e.date, value: e.calories }));
    if (caloriePoints.length < 2){
      chartEmpty.style.display = 'block';
      chartSvg.style.display = 'none';
      chartLegend.style.display = 'none';
    } else {
      chartEmpty.style.display = 'none';
      chartSvg.style.display = 'block';
      chartLegend.style.display = 'flex';
      buildChart(caloriePoints);
    }

    // ---- day log (most recent first) ----
    if (entries.length === 0){
      historyTable.style.display = 'none';
      historyEmpty.style.display = 'block';
    } else {
      historyTable.style.display = 'table';
      historyEmpty.style.display = 'none';
      historyBody.innerHTML = entries.slice().reverse().map(e => `<tr>
        <td>${fmtDate(e.date)}</td>
        <td class="mono">${e.calories ?? '—'}</td>
        <td class="mono">${e.proteinG ?? '—'}</td>
        <td class="mono">${e.carbsG ?? '—'}</td>
        <td class="mono">${e.fatG ?? '—'}</td>
        <td class="mono">${e.waterMl ?? '—'}</td>
        <td>${esc(e.notes) || '—'}</td>
        <td><button type="button" class="weight-del-btn nutrition-del-btn" data-date="${escAttr(e.date)}" aria-label="Delete entry">✕</button></td>
      </tr>`).join('');
      historyBody.querySelectorAll('.nutrition-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          deleteEntry(btn.getAttribute('data-date'));
          render();
        });
      });
    }

    renderGoalSummary();
  }

  submitBtn.addEventListener('click', () => {
    const date = dateInput.value || todayIso();
    upsertEntry({
      date,
      calories: num(caloriesInput.value),
      proteinG: num(proteinInput.value),
      carbsG: num(carbsInput.value),
      fatG: num(fatInput.value),
      waterMl: num(waterInput.value),
      notes: notesInput.value.trim()
    });
    caloriesInput.value = '';
    proteinInput.value = '';
    carbsInput.value = '';
    fatInput.value = '';
    waterInput.value = '';
    notesInput.value = '';
    render();
  });
  notesInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });

  clearBtn.addEventListener('click', () => {
    if (loadEntries().length === 0) return;
    if (confirm('Clear all logged nutrition entries? This can\'t be undone.')){
      saveEntries([]);
      render();
    }
  });

  dateInput.value = todayIso();
  dateInput.max = todayIso();
  render();
  refreshEntriesFromSupabase(); // async — replaces empty start once Supabase responds
  refreshGoalsFromSupabase();
})();
