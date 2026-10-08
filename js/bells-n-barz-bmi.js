(function(){
  const unitSwitch = document.getElementById('bmi-unit-switch');
  if (!unitSwitch) return; // BMI calculator not present on this page

  const WEIGHT_STORE_KEY = 'bnb-weight-log';   // shared with the Weight Log above
  const HEIGHT_CM_KEY = 'bnb-bmi-height-cm';
  const HEIGHT_UNIT_KEY = 'bnb-bmi-height-unit';
  const KG_PER_LB = 0.45359237;

  const formImperial = document.getElementById('bmi-form-imperial');
  const formMetric = document.getElementById('bmi-form-metric');
  const heightFt = document.getElementById('bmi-height-ft');
  const heightIn = document.getElementById('bmi-height-in');
  const heightCm = document.getElementById('bmi-height-cm');

  const placeholder = document.getElementById('bmi-placeholder');
  const output = document.getElementById('bmi-output');
  const valueEl = document.getElementById('bmi-value');
  const categoryEl = document.getElementById('bmi-category');
  const sourceEl = document.getElementById('bmi-source');
  const markerEl = document.getElementById('bmi-scale-marker');

  const chartEmpty = document.getElementById('bmi-chart-empty');
  const chartSvg = document.getElementById('bmi-chart-svg');
  const chartLegend = document.getElementById('bmi-chart-legend');

  let heightUnit = 'imperial';
  try { heightUnit = localStorage.getItem(HEIGHT_UNIT_KEY) || 'imperial'; } catch(e) {}

  function loadWeightEntries(){
    // Weight Tracker is now Supabase-backed (per logged-in user), not
    // localStorage — read its live in-memory data instead of duplicating
    // storage logic against a key that no longer gets written.
    return (window.BNB_WEIGHT && window.BNB_WEIGHT.getEntries) ? window.BNB_WEIGHT.getEntries() : [];
  }

  function loadHeightCm(){
    // Prefer the real profile height (Supabase, synced across devices) —
    // fall back to this device's local cache only for guests or members
    // who haven't filled in a height on their profile yet. This mirrors
    // the fix already applied to weight above; height was still on its
    // own separate localStorage-only cache that could silently disagree
    // with what's actually saved in My Profile.
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (me && me.height){
      const profileCm = parseFloat(me.height);
      if (isFinite(profileCm) && profileCm > 0) return profileCm;
    }
    try {
      const v = parseFloat(localStorage.getItem(HEIGHT_CM_KEY));
      return isFinite(v) && v > 0 ? v : null;
    } catch(e) { return null; }
  }
  function saveHeightCm(cm){
    try { localStorage.setItem(HEIGHT_CM_KEY, String(cm)); } catch(e) {}
  }

  function fmtDate(iso){
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }

  function categoryFor(bmi){
    if (bmi < 18.5) return {label:'Underweight', cls:'cat-under'};
    if (bmi < 25) return {label:'Normal', cls:'cat-normal'};
    if (bmi < 30) return {label:'Overweight', cls:'cat-over'};
    return {label:'Obese', cls:'cat-obese'};
  }

  function currentHeightCm(){
    if (heightUnit === 'imperial'){
      const ft = parseFloat(heightFt.value) || 0;
      const inch = parseFloat(heightIn.value) || 0;
      const totalIn = ft * 12 + inch;
      return totalIn > 0 ? totalIn * 2.54 : null;
    }
    const cm = parseFloat(heightCm.value);
    return cm > 0 ? cm : null;
  }

  // Populate height fields from saved value on load
  (function populateHeightFields(){
    const savedCm = loadHeightCm();
    unitSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.getAttribute('data-unit') === heightUnit));
    formImperial.style.display = heightUnit === 'imperial' ? 'block' : 'none';
    formMetric.style.display = heightUnit === 'metric' ? 'block' : 'none';
    if (savedCm){
      if (heightUnit === 'imperial'){
        const totalIn = savedCm / 2.54;
        heightFt.value = Math.floor(totalIn / 12);
        heightIn.value = Math.round(totalIn % 12);
      } else {
        heightCm.value = savedCm.toFixed(1);
      }
    }
  })();

  unitSwitch.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmBefore = currentHeightCm() || loadHeightCm();
      heightUnit = btn.getAttribute('data-unit');
      try { localStorage.setItem(HEIGHT_UNIT_KEY, heightUnit); } catch(e) {}
      unitSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
      formImperial.style.display = heightUnit === 'imperial' ? 'block' : 'none';
      formMetric.style.display = heightUnit === 'metric' ? 'block' : 'none';
      if (cmBefore){
        if (heightUnit === 'imperial'){
          const totalIn = cmBefore / 2.54;
          heightFt.value = Math.floor(totalIn / 12);
          heightIn.value = Math.round(totalIn % 12);
        } else {
          heightCm.value = cmBefore.toFixed(1);
        }
      }
      renderBmi();
    });
  });

  // points: [{ date, value }]; tip(value) is the dot's hover text after the date
  function buildLineChart(svgEl, points, tip){
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
      svg += `<text class="axis-label" x="${padL-8}" y="${yy+3}" text-anchor="end">${v.toFixed(1)}</text>`;
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
      svg += `<circle class="data-dot" cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.5"><title>${fmtDate(p.date)}: ${tip(values[i])}</title></circle>`;
    });

    svgEl.innerHTML = svg;
  }

  function renderBmi(){
    const heightNowCm = currentHeightCm();
    if (heightNowCm) saveHeightCm(heightNowCm);
    const effectiveHeightCm = heightNowCm || loadHeightCm();

    const entries = loadWeightEntries();

    // ---- Current result ----
    if (!effectiveHeightCm || entries.length === 0){
      placeholder.textContent = entries.length === 0
        ? 'Log a weight entry above and enter your height to see your BMI.'
        : 'Enter your height to see your BMI.';
      placeholder.style.display = 'block';
      output.style.display = 'none';
    } else {
      const latest = entries[entries.length - 1];
      const m = effectiveHeightCm / 100;
      const bmi = latest.kg / (m * m);
      const cat = categoryFor(bmi);
      valueEl.textContent = bmi.toFixed(1);
      categoryEl.textContent = cat.label;
      categoryEl.className = 'bmi-category ' + cat.cls;
      const lb = latest.kg / KG_PER_LB;
      sourceEl.textContent = `Based on ${lb.toFixed(1)} lb (${latest.kg.toFixed(1)} kg) logged ${fmtDate(latest.date)}`;
      const pct = Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100));
      markerEl.style.left = pct + '%';
      placeholder.style.display = 'none';
      output.style.display = 'block';
    }

    // ---- Trend chart ----
    if (!effectiveHeightCm || entries.length === 0){
      chartEmpty.style.display = 'block';
      chartSvg.style.display = 'none';
      chartLegend.style.display = 'none';
    } else {
      const m = effectiveHeightCm / 100;
      const points = entries.map(e => ({ date: e.date, value: e.kg / (m * m) }));
      chartEmpty.style.display = 'none';
      chartSvg.style.display = 'block';
      chartLegend.style.display = 'flex';
      buildLineChart(chartSvg, points, v => 'BMI ' + v.toFixed(1));
    }

    renderBodyComp();
  }

  /* ---------------- BODY COMPOSITION ---------------- */
  // Tape-measure estimates that work better than BMI for athletes
  // (formulas in js/bells-n-barz-bodyfat.js, shared with the Coach
  // Dashboard). Saved measurements live in Supabase body_measurements,
  // one row per member per day, readable by their coach. The results
  // card follows the inputs live; the trend chart uses saved entries.
  // Sex and the in/cm choice are per-device preferences.
  const BF = window.BNB_BODYFAT;
  const BC_PREFS_KEY = 'bnb-bodycomp-prefs';
  const bcSexSwitch = document.getElementById('bodycomp-sex-switch');
  const bcUnitSwitch = document.getElementById('bodycomp-unit-switch');
  const bcDate = document.getElementById('bodycomp-date');
  const bcWaist = document.getElementById('bodycomp-waist');
  const bcNeck = document.getElementById('bodycomp-neck');
  const bcHip = document.getElementById('bodycomp-hip');
  const bcHipWrap = document.getElementById('bodycomp-hip-wrap');
  const bcSubmit = document.getElementById('bodycomp-submit');
  const bcStatus = document.getElementById('bodycomp-status');
  const bcPlaceholder = document.getElementById('bodycomp-placeholder');
  const bcResults = document.getElementById('bodycomp-results');
  const bcChartEmpty = document.getElementById('bodycomp-chart-empty');
  const bcChartSvg = document.getElementById('bodycomp-chart-svg');
  const bcChartLegend = document.getElementById('bodycomp-chart-legend');

  let bcPrefs = { sex: 'male', unit: 'in' };
  try { Object.assign(bcPrefs, JSON.parse(localStorage.getItem(BC_PREFS_KEY)) || {}); } catch(e) {}
  function savePrefs(){
    try { localStorage.setItem(BC_PREFS_KEY, JSON.stringify(bcPrefs)); } catch(e) {}
  }

  // [{ date, sex, waistCm, neckCm, hipCm }], oldest first
  let bcEntries = [];
  function rowToMeasurement(r){
    return { date: r.date, sex: r.sex, waistCm: Number(r.waist_cm),
      neckCm: r.neck_cm == null ? null : Number(r.neck_cm),
      hipCm: r.hip_cm == null ? null : Number(r.hip_cm) };
  }
  async function refreshMeasurementsFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // guest — nothing saved to load
    const { data, error } = await bnbClient.from('body_measurements').select('*').eq('user_id', me.id).order('date');
    if (error) { console.error('Supabase load body_measurements failed:', error); return; }
    bcEntries = (data || []).map(rowToMeasurement);
    // Start the form from the latest saved entry, unless they've begun typing
    const latest = bcEntries[bcEntries.length - 1];
    if (latest && !bcWaist.value && !bcNeck.value && !bcHip.value){
      bcPrefs.sex = latest.sex;
      fillInputs(latest);
      syncSwitches();
    }
    renderBodyComp();
  }

  function todayIso(){
    const d = new Date();
    return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  const toCm = v => bcPrefs.unit === 'in' ? v * 2.54 : v;
  const fromCm = cm => bcPrefs.unit === 'in' ? cm / 2.54 : cm;
  function readCm(input){
    const v = parseFloat(input.value);
    return v > 0 ? toCm(v) : null;
  }
  // What's in the form right now
  function formMeasurement(){
    return { sex: bcPrefs.sex, waistCm: readCm(bcWaist), neckCm: readCm(bcNeck),
      hipCm: bcPrefs.sex === 'female' ? readCm(bcHip) : null };
  }
  function fillInputs(m){
    [[bcWaist, m.waistCm], [bcNeck, m.neckCm], [bcHip, m.hipCm]].forEach(([input, cm]) => {
      input.value = cm ? fromCm(cm).toFixed(1) : '';
    });
  }
  function syncSwitches(){
    bcSexSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.getAttribute('data-sex') === bcPrefs.sex));
    bcUnitSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.getAttribute('data-unit') === bcPrefs.unit));
    bcHipWrap.style.display = bcPrefs.sex === 'female' ? 'block' : 'none';
    document.getElementById('bc-navy-hip-note').style.display = bcPrefs.sex === 'female' ? 'inline' : 'none';
  }
  function showStatus(text){
    bcStatus.textContent = text;
    bcStatus.style.display = text ? 'block' : 'none';
  }

  function setText(id, text, cls){
    const el = document.getElementById(id);
    el.textContent = text;
    if (cls !== undefined) el.className = cls;
  }

  function renderBodyComp(){
    if (!bcResults) return;
    const heightCmNow = currentHeightCm() || loadHeightCm();
    const entries = loadWeightEntries();
    const latest = entries.length ? entries[entries.length - 1] : null;
    const m = formMeasurement();

    // ---- Results (live from the form) ----
    if (!heightCmNow || !m.waistCm){
      bcPlaceholder.textContent = !heightCmNow
        ? 'Enter your height in the BMI Calculator above to see your results.'
        : 'Enter your waist measurement to see your results.';
      bcPlaceholder.style.display = 'block';
      bcResults.style.display = 'none';
    } else {
      bcPlaceholder.style.display = 'none';
      bcResults.style.display = 'block';

      const ratio = BF.whtr(heightCmNow, m.waistCm);
      const wCat = BF.whtrCategory(ratio);
      setText('bc-whtr', ratio.toFixed(2));
      setText('bc-whtr-cat', wCat.label, wCat.cls);

      setText('bc-rfm', BF.rfm(m.sex, heightCmNow, m.waistCm).toFixed(1) + '%');

      const navyPct = BF.navy(m.sex, heightCmNow, m.waistCm, m.neckCm, m.hipCm);
      if (navyPct !== null){
        setText('bc-navy', navyPct.toFixed(1) + '%');
        setText('bc-navy-sub', 'body fat');
      } else {
        setText('bc-navy', '—');
        setText('bc-navy-sub', m.neckCm && (m.sex === 'male' || m.hipCm) ? 'check measurements'
          : m.sex === 'female' ? 'needs neck + hips' : 'needs neck');
      }

      if (latest){
        const est = BF.estimate(m, heightCmNow);
        setText('bc-ffmi', BF.ffmi(latest.kg, heightCmNow, est.pct).toFixed(1));
        setText('bc-ffmi-sub', 'using ' + est.method + ' body fat');
        setText('bc-absi', BF.absi(latest.kg, heightCmNow, m.waistCm).toFixed(4));
      } else {
        setText('bc-ffmi', '—');
        setText('bc-ffmi-sub', 'needs a weight entry');
        setText('bc-absi', '—');
      }
    }

    renderHowItWorks(heightCmNow, m, latest);

    // ---- Trend (saved entries) ----
    if (!heightCmNow || bcEntries.length === 0){
      bcChartEmpty.style.display = 'block';
      bcChartSvg.style.display = 'none';
      bcChartLegend.style.display = 'none';
    } else {
      const points = bcEntries.map(e => ({ date: e.date, value: BF.estimate(e, heightCmNow).pct }));
      bcChartEmpty.style.display = 'none';
      bcChartSvg.style.display = 'block';
      bcChartLegend.style.display = 'flex';
      buildLineChart(bcChartSvg, points, v => v.toFixed(1) + '% body fat');
    }
  }

  // "How it works" tab: each equation worked through on the member's own
  // numbers, so they can see exactly where every result comes from.
  function renderHowItWorks(heightCmNow, m, latest){
    const yours = {};
    const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
    const female = m.sex === 'female';
    if (heightCmNow && m.waistCm){
      const h = heightCmNow, w = m.waistCm;
      yours.whtr = 'Yours: ' + f1(w) + ' cm ÷ ' + f1(h) + ' cm = <b>' + f2(BF.whtr(h, w)) + '</b> (' + BF.whtrCategory(BF.whtr(h, w)).label.toLowerCase() + ').';
      yours.rfm = 'Yours: ' + (female ? 76 : 64) + ' − (20 × ' + f1(h) + ' ÷ ' + f1(w) + ') = <b>' + f1(BF.rfm(m.sex, h, w)) + '%</b>.';
      const navyPct = BF.navy(m.sex, h, w, m.neckCm, m.hipCm);
      if (navyPct !== null){
        const hi = h / 2.54, wi = w / 2.54, ni = m.neckCm / 2.54;
        yours.navy = female
          ? 'Yours, in inches: 163.205 × log₁₀(' + f1(wi) + ' + ' + f1(m.hipCm / 2.54) + ' − ' + f1(ni) + ') − 97.684 × log₁₀(' + f1(hi) + ') − 78.387 = <b>' + f1(navyPct) + '%</b>.'
          : 'Yours, in inches: 86.010 × log₁₀(' + f1(wi) + ' − ' + f1(ni) + ') − 70.041 × log₁₀(' + f1(hi) + ') + 36.76 = <b>' + f1(navyPct) + '%</b>.';
      } else {
        yours.navy = 'Add your neck' + (female ? ' and hips' : '') + ' on the Calculator tab to see yours.';
      }
      if (latest){
        const est = BF.estimate(m, h);
        const lean = latest.kg * (1 - est.pct / 100);
        const hm = h / 100;
        yours.ffmi = 'Yours: ' + f1(latest.kg) + ' kg × (1 − ' + f1(est.pct) + ' ÷ 100) = ' + f1(lean) + ' kg lean, then ' + f1(lean) + ' ÷ ' + f2(hm) + '² = <b>' + f1(BF.ffmi(latest.kg, h, est.pct)) + '</b> (using ' + est.method + ' body fat).';
        const bmi = latest.kg / (hm * hm);
        yours.absi = 'Yours: ' + f2(w / 100) + ' ÷ (' + f1(bmi) + '<sup>2/3</sup> × ' + f2(hm) + '<sup>1/2</sup>) = <b>' + BF.absi(latest.kg, h, w).toFixed(4) + '</b>.';
      } else {
        yours.ffmi = yours.absi = 'Log a weight in the Weight Log above to see yours.';
      }
    } else {
      const need = !heightCmNow ? 'Enter your height in the BMI Calculator' : 'Enter your waist on the Calculator tab';
      ['whtr', 'rfm', 'navy', 'ffmi', 'absi'].forEach(k => { yours[k] = need + ' to see yours.'; });
    }
    document.querySelectorAll('#bodycomp-page-how [data-bc-yours]').forEach(el => {
      el.innerHTML = yours[el.getAttribute('data-bc-yours')] || '';
    });
  }

  const bcPageTabs = document.getElementById('bodycomp-page-tabs');
  if (bcPageTabs) bcPageTabs.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-bc-page');
      bcPageTabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('bodycomp-page-calc').style.display = page === 'calc' ? 'block' : 'none';
      document.getElementById('bodycomp-page-how').style.display = page === 'how' ? 'block' : 'none';
    });
  });

  async function saveMeasurement(){
    const m = formMeasurement();
    if (!m.waistCm){ bcWaist.focus(); return; }
    if (m.sex === 'female' && m.neckCm && !m.hipCm){ bcHip.focus(); showStatus('Add your hips too, or clear the neck field.'); return; }
    const date = bcDate.value || todayIso();
    const entry = Object.assign({ date }, m);

    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (me){
      bcSubmit.disabled = true;
      const { error } = await bnbClient.from('body_measurements').upsert({
        user_id: me.id, date, sex: m.sex,
        waist_cm: +m.waistCm.toFixed(2),
        neck_cm: m.neckCm ? +m.neckCm.toFixed(2) : null,
        hip_cm: m.hipCm ? +m.hipCm.toFixed(2) : null
      }, { onConflict: 'user_id,date' });
      bcSubmit.disabled = false;
      if (error){
        console.error('Supabase save body_measurements failed:', error);
        showStatus('Couldn\'t save your measurements. Please try again.');
        return;
      }
    }
    bcEntries = bcEntries.filter(e => e.date !== date).concat([entry])
      .sort((a, b) => a.date.localeCompare(b.date));
    showStatus(me ? 'Saved for ' + fmtDate(date) + '.' : 'Saved for this visit only. Sign in to keep your measurements.');
    renderBodyComp();
  }

  if (bcResults){
    syncSwitches();
    bcDate.value = todayIso();
    bcDate.max = todayIso();
    bcSexSwitch.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        bcPrefs.sex = btn.getAttribute('data-sex');
        savePrefs(); syncSwitches(); renderBodyComp();
      });
    });
    bcUnitSwitch.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const before = formMeasurement();
        bcPrefs.unit = btn.getAttribute('data-unit');
        savePrefs(); syncSwitches(); fillInputs(before);
      });
    });
    [bcWaist, bcNeck, bcHip].forEach(input => {
      input.addEventListener('input', () => { showStatus(''); renderBodyComp(); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') saveMeasurement(); });
    });
    bcSubmit.addEventListener('click', saveMeasurement);
    refreshMeasurementsFromSupabase(); // async — fills the form and trend once it responds
  }

  [heightFt, heightIn, heightCm].forEach(input => {
    input.addEventListener('input', renderBmi);
  });
  document.addEventListener('bnb-weight-updated', renderBmi);

  renderBmi();
})();
