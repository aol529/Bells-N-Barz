// Tools > Body Calculators and Calories & Macros: free, no account needed.
// Nothing here is saved anywhere. Results use the same shared formulas as
// Me > Weight (js/bells-n-barz-bodyfat.js) and Me > Food Log
// (js/bells-n-barz-targets.js), so the numbers always match. Signed-in
// members get a shortcut to the saved version in Me; guests get Sign Up.
(function(){
  const bodyMount = document.getElementById('tools-body-mount');
  const calMount = document.getElementById('tools-cal-mount');
  if (!bodyMount || !calMount) return;

  const BF = window.BNB_BODYFAT;
  const T = window.BNB_TARGETS;
  const KG_PER_LB = 0.45359237;
  let unit = 'metric'; // 'metric' | 'us' — shared by both calculators
  let sex = 'male';

  const signedIn = () => !!(window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf());
  const $ = id => document.getElementById(id);
  const num = id => { const v = parseFloat($(id).value); return v > 0 ? v : null; };
  const f1 = v => v.toFixed(1);

  function switches(prefix){
    return '<div class="tools-switches">' +
      '<div class="unit-switch" data-tools-sex>' +
        '<button type="button" data-sex="male">MEN</button><button type="button" data-sex="female">WOMEN</button></div>' +
      '<div class="unit-switch" data-tools-unit>' +
        '<button type="button" data-unit="metric">METRIC</button><button type="button" data-unit="us">US</button></div>' +
    '</div>';
  }
  // Height field: cm, or ft + in
  function heightFields(prefix){
    return '<label>Height <span class="tools-hunit"></span></label>' +
      '<div class="tools-metric"><input id="' + prefix + '-cm" type="number" min="0" step="0.1" placeholder="cm"/></div>' +
      '<div class="tools-us bmi-field-row"><div><input id="' + prefix + '-ft" type="number" min="0" step="1" placeholder="ft"/></div>' +
      '<div><input id="' + prefix + '-in" type="number" min="0" max="11" step="1" placeholder="in"/></div></div>';
  }
  function heightCm(prefix){
    if (unit === 'metric') return num(prefix + '-cm');
    const ft = parseFloat($(prefix + '-ft').value) || 0, inch = parseFloat($(prefix + '-in').value) || 0;
    const total = ft * 12 + inch;
    return total > 0 ? total * 2.54 : null;
  }
  function weightKg(id){ const v = num(id); return v == null ? null : (unit === 'metric' ? v : v * KG_PER_LB); }
  function lengthCm(id){ const v = num(id); return v == null ? null : (unit === 'metric' ? v : v * 2.54); }

  // Signed-in: shortcut to the saved version in Me. Guest: sign up.
  // A placeholder here; renderSaveNotes() fills it, and re-runs whenever
  // sign-in state changes (BNB_TOOLS.refresh, called from the shell).
  const SAVE_TEXT = {
    weight: ['Saved measurements, a body fat trend chart and a goal line live in Me › Weight.',
             'Want to track these over time, with trend charts your coach can see? Create a free account.'],
    nutrition: ['Set these as your daily goals, and log what you eat against them, in Me › Food Log.',
                'Want to log meals against these targets, or get a meal plan built by a coach? Create a free account.']
  };
  function saveNote(meSection){
    return '<div class="weight-chart-card tools-save" data-tools-save="' + meSection + '"></div>';
  }
  function renderSaveNotes(){
    const member = signedIn();
    document.querySelectorAll('#tab-tools [data-tools-save]').forEach(box => {
      const key = box.getAttribute('data-tools-save');
      box.innerHTML = member
        ? '<p>' + SAVE_TEXT[key][0] + '</p><button type="button" class="weight-clear-btn" data-tools-open-me="' + key + '">Open in Me →</button>'
        : '<p>' + SAVE_TEXT[key][1] + '</p><button type="button" class="weight-clear-btn" data-tools-auth="signup">Sign Up free</button>' +
          '<button type="button" class="weight-clear-btn" data-tools-auth="login">Log In</button>';
    });
  }

  /* ---------------- Body Calculators ---------------- */
  function bodyHtml(){
    return '<div class="bmi-grid">' +
      '<div class="weight-card"><h3>Your Numbers</h3>' + switches() +
        '<div class="weight-form">' + heightFields('tb-h') +
          '<label for="tb-weight">Weight (<span class="tools-wunit"></span>)</label><input id="tb-weight" type="number" min="0" step="0.1"/>' +
          '<label for="tb-waist">Waist <span class="tools-lunit"></span> <span class="tools-hint">at the navel</span></label><input id="tb-waist" type="number" min="0" step="0.1"/>' +
          '<label for="tb-neck">Neck <span class="tools-lunit"></span> <span class="tools-hint">below the Adam’s apple</span></label><input id="tb-neck" type="number" min="0" step="0.1"/>' +
          '<div class="tools-female"><label for="tb-hip">Hips <span class="tools-lunit"></span> <span class="tools-hint">widest point</span></label><input id="tb-hip" type="number" min="0" step="0.1"/></div>' +
        '</div>' +
        '<p class="weight-hint">Height and weight give you BMI. Add your waist for the rest, and your neck' +
        ' (plus hips for women) for the Navy body fat estimate. Nothing here is saved.</p>' +
      '</div>' +
      '<div class="side-col">' +
        '<div class="weight-chart-card"><h3>Results</h3>' +
          '<div class="bmi-placeholder" id="tb-placeholder">Enter your height and weight to see your results.</div>' +
          '<div class="bodycomp-results" id="tb-results" style="display:none;">' +
            row('BMI', 'Weight ÷ height². A rough screening number that can’t tell muscle from fat.', 'tb-bmi') +
            row('Waist-to-Height Ratio', 'Waist ÷ height. Under 0.5 is the usual healthy target.', 'tb-whtr') +
            row('Relative Fat Mass (RFM)', 'Body fat % from height and waist.', 'tb-rfm') +
            row('U.S. Navy Body Fat', 'Body fat % from neck, waist (and hips for women).', 'tb-navy') +
            row('Fat-Free Mass Index (FFMI)', 'Lean mass ÷ height². Untrained men about 18–20, well-trained 22–25; women about 3–4 lower.', 'tb-ffmi') +
            row('A Body Shape Index (ABSI)', 'Flags belly fat independent of BMI. Compare against your own readings.', 'tb-absi') +
          '</div>' +
        '</div>' +
        saveNote('weight') +
      '</div>' +
    '</div>' +
    '<details class="updated tools-how"><summary>How the formulas work</summary><div class="body" id="tb-how"></div></details>';
  }
  function row(name, desc, id){
    return '<div class="bodycomp-row"><div class="bodycomp-name">' + name + '<span>' + desc + '</span></div>' +
      '<div class="bodycomp-val"><b id="' + id + '">—</b><i id="' + id + '-sub"></i></div></div>';
  }
  function bmiCategory(b){
    if (b < 18.5) return {label:'Underweight', cls:''};
    if (b < 25) return {label:'Normal', cls:'cat-normal'};
    if (b < 30) return {label:'Overweight', cls:'cat-over'};
    return {label:'Obese', cls:'cat-obese'};
  }
  function set(id, text, sub, cls){
    $(id).textContent = text;
    const s = $(id + '-sub'); s.textContent = sub || ''; s.className = cls || '';
  }
  function renderBody(){
    const h = heightCm('tb-h'), w = weightKg('tb-weight');
    const waist = lengthCm('tb-waist'), neck = lengthCm('tb-neck'), hip = sex === 'female' ? lengthCm('tb-hip') : null;
    if (!h || !w){ $('tb-placeholder').style.display = 'block'; $('tb-results').style.display = 'none'; return; }
    $('tb-placeholder').style.display = 'none'; $('tb-results').style.display = 'block';
    const m = h / 100, bmi = w / (m * m), cat = bmiCategory(bmi);
    set('tb-bmi', f1(bmi), cat.label, cat.cls);
    if (!waist){
      ['tb-whtr','tb-rfm','tb-navy','tb-ffmi','tb-absi'].forEach(id => set(id, '—', 'needs waist'));
      return;
    }
    const r = BF.whtr(h, waist), rc = BF.whtrCategory(r);
    set('tb-whtr', r.toFixed(2), rc.label, rc.cls);
    set('tb-rfm', f1(BF.rfm(sex, h, waist)) + '%', 'body fat');
    const navy = BF.navy(sex, h, waist, neck, hip);
    set('tb-navy', navy !== null ? f1(navy) + '%' : '—',
      navy !== null ? 'body fat' : (neck && (sex === 'male' || hip) ? 'check measurements' : sex === 'female' ? 'needs neck + hips' : 'needs neck'));
    const est = BF.estimate({ sex, waistCm: waist, neckCm: neck, hipCm: hip }, h);
    set('tb-ffmi', f1(BF.ffmi(w, h, est.pct)), 'using ' + est.method + ' body fat');
    set('tb-absi', BF.absi(w, h, waist).toFixed(4), '');
  }
  // Same explanations as Me > Weight > Body Composition > How it works,
  // copied from that page so they're written in one place only. The
  // "Yours:" worked examples are left out (they read Me's own inputs).
  function fillHow(){
    const src = document.getElementById('bodycomp-page-how');
    const box = $('tb-how');
    if (!src || !box) return;
    const copy = src.cloneNode(true);
    copy.removeAttribute('id'); copy.style.display = '';
    copy.querySelectorAll('.bc-yours, .mp-how-lede').forEach(el => el.remove());
    box.appendChild(copy);
  }

  /* ---------------- Calories & Macros ---------------- */
  const ACTIVITY = [
    [1.2, 'Sedentary (little/no exercise)'],
    [1.375, 'Lightly active (1–3 days/wk)'],
    [1.55, 'Moderately active (3–5 days/wk)'],
    [1.725, 'Very active (6–7 days/wk)'],
    [1.9, 'Extra active (physical job + training)']
  ];
  function calHtml(){
    return '<div class="bmi-grid">' +
      '<div class="weight-card"><h3>Your Details</h3>' + switches() +
        '<div class="weight-form">' +
          '<label for="tc-age">Age</label><input id="tc-age" type="number" min="10" max="100" step="1"/>' +
          heightFields('tc-h') +
          '<label for="tc-weight">Weight (<span class="tools-wunit"></span>)</label><input id="tc-weight" type="number" min="0" step="0.1"/>' +
          '<label for="tc-activity">Activity</label><select id="tc-activity">' +
            ACTIVITY.map(a => '<option value="' + a[0] + '"' + (a[0] === 1.375 ? ' selected' : '') + '>' + a[1] + '</option>').join('') + '</select>' +
          '<label for="tc-goal">Goal</label><select id="tc-goal">' +
            '<option value="lose">Lose weight</option><option value="maintain" selected>Maintain</option><option value="gain">Gain muscle</option></select>' +
        '</div>' +
        '<p class="weight-hint">Mifflin-St Jeor: your resting burn from weight, height, age and sex, times your activity, then adjusted for your goal. A starting point; how your body responds over 2–3 weeks matters more. Nothing here is saved.</p>' +
      '</div>' +
      '<div class="side-col">' +
        '<div class="weight-chart-card"><h3>Daily Targets</h3>' +
          '<div class="bmi-placeholder" id="tc-placeholder">Enter your age, height and weight to see your targets.</div>' +
          '<div id="tc-results" style="display:none;">' +
            '<div class="weight-stats">' +
              '<div class="weight-stat"><span class="lbl">Calories</span><span class="val" id="tc-cal">—</span></div>' +
              '<div class="weight-stat"><span class="lbl">Protein</span><span class="val" id="tc-pro">—</span></div>' +
              '<div class="weight-stat"><span class="lbl">Carbs</span><span class="val" id="tc-carb">—</span></div>' +
              '<div class="weight-stat"><span class="lbl">Fat</span><span class="val" id="tc-fat">—</span></div>' +
            '</div>' +
            '<p class="weight-hint" id="tc-note"></p>' +
          '</div>' +
        '</div>' +
        saveNote('nutrition') +
      '</div>' +
    '</div>';
  }
  function renderCal(){
    const age = num('tc-age'), h = heightCm('tc-h'), w = weightKg('tc-weight');
    if (!age || !h || !w){ $('tc-placeholder').style.display = 'block'; $('tc-results').style.display = 'none'; return; }
    const t = T.calc({ sex, age, heightCm: h, weightKg: w, factor: parseFloat($('tc-activity').value), goal: $('tc-goal').value });
    $('tc-placeholder').style.display = 'none'; $('tc-results').style.display = 'block';
    $('tc-cal').textContent = t.calories.toLocaleString();
    $('tc-pro').textContent = t.protein_g + ' g';
    $('tc-carb').textContent = t.carbs_g + ' g';
    $('tc-fat').textContent = t.fat_g + ' g';
    $('tc-note').textContent = 'About ' + t.maintenance.toLocaleString() + ' kcal a day keeps your weight steady.' + (t.note ? ' ' + t.note : '');
  }

  /* ---------------- Shared wiring ---------------- */
  function syncSwitches(){
    document.querySelectorAll('#tab-tools [data-tools-sex] button').forEach(b => b.classList.toggle('active', b.getAttribute('data-sex') === sex));
    document.querySelectorAll('#tab-tools [data-tools-unit] button').forEach(b => b.classList.toggle('active', b.getAttribute('data-unit') === unit));
    document.querySelectorAll('#tab-tools .tools-metric').forEach(el => { el.style.display = unit === 'metric' ? '' : 'none'; });
    document.querySelectorAll('#tab-tools .tools-us').forEach(el => { el.style.display = unit === 'us' ? '' : 'none'; });
    document.querySelectorAll('#tab-tools .tools-female').forEach(el => { el.style.display = sex === 'female' ? '' : 'none'; });
    document.querySelectorAll('#tab-tools .tools-wunit').forEach(el => { el.textContent = unit === 'metric' ? 'kg' : 'lb'; });
    document.querySelectorAll('#tab-tools .tools-lunit').forEach(el => { el.textContent = unit === 'metric' ? '(cm)' : '(in)'; });
    document.querySelectorAll('#tab-tools .tools-hunit').forEach(el => { el.textContent = unit === 'metric' ? '(cm)' : '(ft / in)'; });
  }
  function renderAll(){ renderBody(); renderCal(); }

  bodyMount.innerHTML = bodyHtml();
  calMount.innerHTML = calHtml();
  fillHow();
  syncSwitches();
  renderSaveNotes();
  window.BNB_TOOLS = { refresh: renderSaveNotes };

  const toolsTab = document.getElementById('tab-tools');
  toolsTab.addEventListener('input', e => { if (e.target.closest('#tools-body-mount, #tools-cal-mount')) renderAll(); });
  toolsTab.addEventListener('change', e => { if (e.target.closest('#tools-cal-mount')) renderCal(); });
  toolsTab.addEventListener('click', e => {
    const sb = e.target.closest('[data-tools-sex] button');
    const ub = e.target.closest('[data-tools-unit] button');
    const auth = e.target.closest('[data-tools-auth]');
    const me = e.target.closest('[data-tools-open-me]');
    if (sb){ sex = sb.getAttribute('data-sex'); syncSwitches(); renderAll(); }
    if (ub){
      // keep what was typed, converted to the new unit
      const keep = {
        h: { tb: heightCm('tb-h'), tc: heightCm('tc-h') },
        w: { 'tb-weight': weightKg('tb-weight'), 'tc-weight': weightKg('tc-weight') },
        l: { 'tb-waist': lengthCm('tb-waist'), 'tb-neck': lengthCm('tb-neck'), 'tb-hip': lengthCm('tb-hip') }
      };
      unit = ub.getAttribute('data-unit');
      Object.entries(keep.h).forEach(([p, cm]) => {
        $(p + '-h-cm').value = ''; $(p + '-h-ft').value = ''; $(p + '-h-in').value = '';
        if (!cm) return;
        if (unit === 'metric') $(p + '-h-cm').value = f1(cm);
        else { const inches = cm / 2.54; $(p + '-h-ft').value = Math.floor(inches / 12); $(p + '-h-in').value = Math.round(inches % 12); }
      });
      Object.entries(keep.w).forEach(([id, kg]) => { $(id).value = kg ? f1(unit === 'metric' ? kg : kg / KG_PER_LB) : ''; });
      Object.entries(keep.l).forEach(([id, cm]) => { $(id).value = cm ? f1(unit === 'metric' ? cm : cm / 2.54) : ''; });
      syncSwitches(); renderAll();
    }
    if (auth && typeof window.bnbEnterGym === 'function') window.bnbEnterGym(auth.getAttribute('data-tools-auth'));
    if (me){
      switchTab('me');
      const btn = document.querySelector('#me-section-switch [data-me-section="' + me.getAttribute('data-tools-open-me') + '"]');
      if (btn) btn.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();
