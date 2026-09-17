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

  function buildBmiChart(points){
    const W = 700, H = 320, padL = 44, padR = 20, padT = 20, padB = 36;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const dates = points.map(p => new Date(p.date + 'T00:00:00').getTime());
    const values = points.map(p => p.bmi);
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
      svg += `<circle class="data-dot" cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.5"><title>${fmtDate(p.date)}: BMI ${values[i].toFixed(1)}</title></circle>`;
    });

    chartSvg.innerHTML = svg;
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
      const points = entries.map(e => ({ date: e.date, bmi: e.kg / (m * m) }));
      chartEmpty.style.display = 'none';
      chartSvg.style.display = 'block';
      chartLegend.style.display = 'flex';
      buildBmiChart(points);
    }
  }

  [heightFt, heightIn, heightCm].forEach(input => {
    input.addEventListener('input', renderBmi);
  });
  document.addEventListener('bnb-weight-updated', renderBmi);

  renderBmi();
})();
