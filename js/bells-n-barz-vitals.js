// Me > Blood Pressure and Me > Steps. Both save to Supabase
// (blood_pressure_log, step_log — sql/50-blood-pressure-and-steps.sql),
// readable by the member's coach. Chart range and the step goal are
// per-device preferences.
(function(){
  const RANGE_KEY = 'bnb-vitals-ranges';
  const GOAL_KEY = 'bnb-steps-goal';
  const DAY = 86400000;

  let ranges = { bp: 30, steps: 30 };
  try { Object.assign(ranges, JSON.parse(localStorage.getItem(RANGE_KEY)) || {}); } catch(e) {}
  function saveRanges(){
    try { localStorage.setItem(RANGE_KEY, JSON.stringify(ranges)); } catch(e) {}
  }

  function self(){
    return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  }
  function todayIso(){
    const d = new Date();
    return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function nowHHMM(){
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  const dayStart = iso => new Date(iso + 'T00:00:00').getTime();
  function fmtDate(t){
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function fmtTime(t){
    return new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const fmtInt = n => Math.round(n).toLocaleString();
  function showStatus(el, text){
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
  }
  function wireRangeSwitch(el, key, render){
    const sync = () => el.querySelectorAll('button').forEach(b =>
      b.classList.toggle('active', Number(b.getAttribute('data-days')) === ranges[key]));
    el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        ranges[key] = Number(btn.getAttribute('data-days'));
        saveRanges(); sync(); render();
      });
    });
    sync();
  }
  // Gridlines + y labels shared by both charts
  function gridSvg(W, padL, padR, minV, maxV, y, label){
    let svg = '';
    for (let i = 0; i <= 4; i++){
      const v = minV + (maxV - minV) * (i / 4);
      const yy = y(v).toFixed(1);
      svg += `<line class="grid-line" x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}"/>`;
      svg += `<text class="axis-label" x="${padL - 8}" y="${+yy + 3}" text-anchor="end">${label(v)}</text>`;
    }
    return svg;
  }
  function xLabelsSvg(minT, maxT, x, yPos){
    return [minT, (minT + maxT) / 2, maxT].map(t =>
      `<text class="axis-label" x="${x(t).toFixed(1)}" y="${yPos}" text-anchor="middle">${fmtDate(t)}</text>`).join('');
  }

  /* ---------------- BLOOD PRESSURE ---------------- */
  // American Heart Association categories. Either number can push a
  // reading up a category.
  function bpCategory(sys, dia){
    if (sys > 180 || dia > 120) return { label: 'Crisis', cls: 'bp-crisis' };
    if (sys >= 140 || dia >= 90) return { label: 'Stage 2', cls: 'bp-stage2' };
    if (sys >= 130 || dia >= 80) return { label: 'Stage 1', cls: 'bp-stage1' };
    if (sys >= 120) return { label: 'Elevated', cls: 'bp-elevated' };
    return { label: 'Normal', cls: 'bp-normal' };
  }

  const bpDate = document.getElementById('bp-date');
  const bpTime = document.getElementById('bp-time');
  const bpSys = document.getElementById('bp-sys');
  const bpDia = document.getElementById('bp-dia');
  const bpPulse = document.getElementById('bp-pulse');
  const bpNote = document.getElementById('bp-note');
  const bpSubmit = document.getElementById('bp-submit');
  const bpStatus = document.getElementById('bp-status');
  const bpChartSvgEl = document.getElementById('bp-chart-svg');

  // [{ id, t (ms), sys, dia, pulse, note }], oldest first
  let bpEntries = [];

  async function refreshBp(){
    const me = self();
    if (!me) return;
    const { data, error } = await bnbClient.from('blood_pressure_log').select('*').eq('user_id', me.id).order('taken_at');
    if (error){ console.error('Supabase load blood_pressure_log failed:', error); return; }
    bpEntries = (data || []).map(r => ({ id: r.id, t: new Date(r.taken_at).getTime(),
      sys: r.systolic, dia: r.diastolic, pulse: r.pulse, note: r.note }));
    renderBp();
  }

  function avgReading(list){
    if (!list.length) return null;
    const s = list.reduce((a, e) => a + e.sys, 0) / list.length;
    const d = list.reduce((a, e) => a + e.dia, 0) / list.length;
    return Math.round(s) + '/' + Math.round(d);
  }

  // SVG markup for a BP chart of `list` (oldest first), `days` back from
  // now (0 = all of it). Shared with Coach > Client Progress.
  function bpChartSvg(list, W, H, days){
    const padL = 44, padR = 20, padT = 16, padB = 36;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    let maxT = Math.max(Date.now(), list[list.length - 1].t);
    let minT = days ? maxT - days * DAY : list[0].t;
    if (maxT - minT < DAY){ minT -= DAY / 2; maxT += DAY / 2; }
    // Always keep the 120/80 guides in view
    let minV = Math.min(70, ...list.map(e => e.dia));
    let maxV = Math.max(130, ...list.map(e => e.sys));
    // Four bands of a round step, so the labels read 60, 80, 100...
    const step = Math.ceil((maxV - minV) * 1.15 / 4 / 10) * 10;
    minV = Math.max(0, Math.floor((minV - step / 3) / 10) * 10);
    maxV = minV + step * 4;

    const x = t => padL + ((t - minT) / (maxT - minT)) * innerW;
    const y = v => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;

    let svg = gridSvg(W, padL, padR, minV, maxV, y, v => Math.round(v));
    svg += xLabelsSvg(minT, maxT, x, H - padB + 18);
    [120, 80].forEach(v => {
      svg += `<line class="target-line" x1="${padL}" y1="${y(v).toFixed(1)}" x2="${W - padR}" y2="${y(v).toFixed(1)}"/>`;
    });
    // A faint bar from diastolic up to systolic for each reading
    list.forEach(e => {
      svg += `<line class="bp-span" x1="${x(e.t).toFixed(1)}" y1="${y(e.sys).toFixed(1)}" x2="${x(e.t).toFixed(1)}" y2="${y(e.dia).toFixed(1)}"/>`;
    });
    [['sys', 'bp-sys-line'], ['dia', 'data-line']].forEach(([k, cls]) => {
      if (list.length > 1){
        const d = list.map((e, i) => (i ? 'L' : 'M') + x(e.t).toFixed(1) + ',' + y(e[k]).toFixed(1)).join(' ');
        svg += `<path class="${cls}" d="${d}"/>`;
      }
    });
    list.forEach(e => {
      const tip = `${fmtDate(e.t)} ${fmtTime(e.t)}: ${e.sys}/${e.dia} (${bpCategory(e.sys, e.dia).label})`;
      svg += `<circle class="bp-sys-dot" cx="${x(e.t).toFixed(1)}" cy="${y(e.sys).toFixed(1)}" r="3.5"><title>${tip}</title></circle>`;
      svg += `<circle class="data-dot" cx="${x(e.t).toFixed(1)}" cy="${y(e.dia).toFixed(1)}" r="3.5"><title>${tip}</title></circle>`;
    });
    return svg;
  }
  function buildBpChart(list){
    const W = bnbChartWidth(bpChartSvgEl), H = 230;
    bpChartSvgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    bpChartSvgEl.innerHTML = bpChartSvg(list, W, H, ranges.bp);
  }

  function renderBp(){
    const now = Date.now();
    const stats = document.getElementById('bp-stats');
    const latest = bpEntries[bpEntries.length - 1];
    if (!latest){
      stats.style.display = 'none';
    } else {
      stats.style.display = 'grid';
      const cat = bpCategory(latest.sys, latest.dia);
      document.getElementById('bp-stat-latest').textContent = latest.sys + '/' + latest.dia;
      const catEl = document.getElementById('bp-stat-cat');
      catEl.textContent = cat.label;
      catEl.className = 'val bp-cat ' + cat.cls;
      document.getElementById('bp-stat-7').textContent = avgReading(bpEntries.filter(e => e.t >= now - 7 * DAY)) || '—';
      document.getElementById('bp-stat-30').textContent = avgReading(bpEntries.filter(e => e.t >= now - 30 * DAY)) || '—';
    }

    const inRange = ranges.bp ? bpEntries.filter(e => e.t >= now - ranges.bp * DAY) : bpEntries;
    const empty = document.getElementById('bp-chart-empty');
    const legend = document.getElementById('bp-chart-legend');
    if (!inRange.length){
      empty.textContent = bpEntries.length ? 'No readings in this range.' : 'No readings yet. Log one to start the chart.';
      empty.style.display = 'block';
      bpChartSvgEl.style.display = 'none';
      legend.style.display = 'none';
    } else {
      empty.style.display = 'none';
      bpChartSvgEl.style.display = 'block';
      legend.style.display = 'flex';
      buildBpChart(inRange);
    }

    const body = document.getElementById('bp-history-body');
    const table = document.getElementById('bp-history-table');
    document.getElementById('bp-history-empty').style.display = bpEntries.length ? 'none' : 'block';
    table.style.display = bpEntries.length ? 'table' : 'none';
    body.innerHTML = bpEntries.slice().reverse().map(e => {
      const cat = bpCategory(e.sys, e.dia);
      const note = e.note ? `<div class="bp-note">${e.note.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])}</div>` : '';
      return `<tr>
        <td>${fmtDate(e.t)} <span class="muted">${fmtTime(e.t)}</span>${note}</td>
        <td class="mono">${e.sys}/${e.dia}</td>
        <td class="mono">${e.pulse || '—'}</td>
        <td class="${cat.cls}">${cat.label}</td>
        <td><button type="button" class="weight-del-btn" data-id="${e.id}" aria-label="Delete reading">✕</button></td>
      </tr>`;
    }).join('');
    body.querySelectorAll('.weight-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (self()){
          const { error } = await bnbClient.from('blood_pressure_log').delete().eq('id', id);
          if (error){ console.error('Supabase delete blood_pressure_log failed:', error); showStatus(bpStatus, 'Couldn\'t delete that reading. Please try again.'); return; }
        }
        bpEntries = bpEntries.filter(e => e.id !== id);
        renderBp();
      });
    });
  }

  async function saveBp(){
    const sys = parseInt(bpSys.value, 10), dia = parseInt(bpDia.value, 10);
    const pulse = parseInt(bpPulse.value, 10);
    if (!(sys >= 50 && sys <= 300)){ bpSys.focus(); showStatus(bpStatus, 'Systolic should be between 50 and 300.'); return; }
    if (!(dia >= 30 && dia <= 200)){ bpDia.focus(); showStatus(bpStatus, 'Diastolic should be between 30 and 200.'); return; }
    if (sys <= dia){ bpSys.focus(); showStatus(bpStatus, 'The top number (systolic) should be higher than the bottom one.'); return; }
    if (bpPulse.value && !(pulse >= 20 && pulse <= 250)){ bpPulse.focus(); showStatus(bpStatus, 'Pulse should be between 20 and 250.'); return; }
    const t = new Date((bpDate.value || todayIso()) + 'T' + (bpTime.value || nowHHMM())).getTime();
    const entry = { id: 'local-' + t, t, sys, dia, pulse: bpPulse.value ? pulse : null, note: bpNote.value.trim() || null };

    const me = self();
    if (me){
      bpSubmit.disabled = true;
      const { data, error } = await bnbClient.from('blood_pressure_log').insert({
        user_id: me.id, taken_at: new Date(t).toISOString(),
        systolic: sys, diastolic: dia, pulse: entry.pulse, note: entry.note
      }).select('id').single();
      bpSubmit.disabled = false;
      if (error){
        console.error('Supabase save blood_pressure_log failed:', error);
        showStatus(bpStatus, 'Couldn\'t save that reading. Please try again.');
        return;
      }
      entry.id = data.id;
    }
    bpEntries = bpEntries.concat([entry]).sort((a, b) => a.t - b.t);
    const cat = bpCategory(sys, dia);
    showStatus(bpStatus, cat.cls === 'bp-crisis'
      ? 'Saved. This reading is very high. Rest a few minutes and measure again. If it\'s still over 180/120, or you feel unwell, get medical help now.'
      : 'Saved ' + sys + '/' + dia + ' (' + cat.label + ').');
    [bpSys, bpDia, bpPulse, bpNote].forEach(i => { i.value = ''; });
    bpTime.value = nowHHMM();
    renderBp();
  }

  if (bpSubmit){
    bpDate.value = todayIso();
    bpDate.max = todayIso();
    bpTime.value = nowHHMM();
    bpSubmit.addEventListener('click', saveBp);
    [bpSys, bpDia, bpPulse, bpNote].forEach(i => {
      i.addEventListener('input', () => showStatus(bpStatus, ''));
      i.addEventListener('keydown', e => { if (e.key === 'Enter') saveBp(); });
    });
    wireRangeSwitch(document.getElementById('bp-range-switch'), 'bp', renderBp);
    renderBp();
    refreshBp();
  }

  /* ---------------- STEPS ---------------- */
  const stDate = document.getElementById('steps-date');
  const stValue = document.getElementById('steps-value');
  const stSubmit = document.getElementById('steps-submit');
  const stStatus = document.getElementById('steps-status');
  const stGoal = document.getElementById('steps-goal');
  const stChartSvg = document.getElementById('steps-chart-svg');

  let goal = 10000;
  try {
    const v = parseInt(localStorage.getItem(GOAL_KEY), 10);
    if (v > 0) goal = v;
  } catch(e) {}

  // [{ date, steps }], oldest first
  let stEntries = [];

  async function refreshSteps(){
    const me = self();
    if (!me) return;
    const { data, error } = await bnbClient.from('step_log').select('date,steps').eq('user_id', me.id).order('date');
    if (error){ console.error('Supabase load step_log failed:', error); return; }
    stEntries = data || [];
    renderSteps();
  }

  // Average of logged days in `list` over the 7 calendar days ending on `iso`
  function trailingAvg(list, iso){
    const end = dayStart(iso), start = end - 6 * DAY;
    const days = list.filter(e => { const t = dayStart(e.date); return t >= start && t <= end; });
    return days.length ? days.reduce((a, e) => a + e.steps, 0) / days.length : null;
  }
  // Consecutive days at or over goal, ending today (or yesterday, so an
  // unlogged today doesn't break the streak before the day is over).
  function goalStreak(){
    const byDate = {};
    stEntries.forEach(e => { byDate[e.date] = e.steps; });
    const iso = t => new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    let t = dayStart(todayIso());
    if (!(byDate[iso(t)] >= goal)) t -= DAY;
    let n = 0;
    while (byDate[iso(t)] >= goal){ n++; t -= DAY; }
    return n;
  }

  // SVG markup for a steps bar chart of the last `days` days. `all` is
  // every logged day (for the rolling average), `list` the ones in range.
  // Shared with Coach > Client Progress.
  function stepsChartSvg(all, list, W, H, days, goal, goalLabel){
    const padL = 44, padR = 20, padT = 16, padB = 36;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const lastT = dayStart(todayIso()), firstT = lastT - (days - 1) * DAY;
    const slot = innerW / days;
    const barW = Math.max(2, Math.min(28, slot * 0.7));
    const stepY = Math.ceil(Math.max(goal, ...list.map(e => e.steps)) * 1.1 / 4 / 1000) * 1000;
    const maxV = stepY * 4;

    const x = t => padL + ((t - firstT) / DAY + 0.5) * slot; // centre of that day's slot
    const y = v => padT + innerH - (v / maxV) * innerH;

    let svg = gridSvg(W, padL, padR, 0, maxV, y, v => v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : Math.round(v));
    svg += xLabelsSvg(firstT, lastT, x, H - padB + 18);
    list.forEach(e => {
      const t = dayStart(e.date), top = y(e.steps);
      svg += `<rect class="${e.steps >= goal ? 'step-bar hit' : 'step-bar'}" x="${(x(t) - barW / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${(padT + innerH - top).toFixed(1)}" rx="1.5"><title>${fmtDate(t)}: ${fmtInt(e.steps)} steps</title></rect>`;
    });
    if (list.length > 1){
      const d = list.map((e, i) => (i ? 'L' : 'M') + x(dayStart(e.date)).toFixed(1) + ',' + y(trailingAvg(all, e.date)).toFixed(1)).join(' ');
      svg += `<path class="trend-line" d="${d}"/>`;
    }
    const gy = y(goal).toFixed(1);
    svg += `<line class="target-line" x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}"/>`;
    svg += `<text class="target-label" x="${W - padR}" y="${gy - 6}" text-anchor="end">${goalLabel}: ${fmtInt(goal)}</text>`;
    return svg;
  }
  function buildStepsChart(list){
    const W = bnbChartWidth(stChartSvg), H = 230;
    stChartSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    stChartSvg.innerHTML = stepsChartSvg(stEntries, list, W, H, ranges.steps, goal, 'Goal');
  }

  function renderSteps(){
    if (document.activeElement !== stGoal) stGoal.value = goal;
    const stats = document.getElementById('steps-stats');
    const latest = stEntries[stEntries.length - 1];
    if (!latest){
      stats.style.display = 'none';
    } else {
      stats.style.display = 'grid';
      document.getElementById('steps-stat-latest').textContent = fmtInt(latest.steps);
      const avg = trailingAvg(stEntries, todayIso());
      document.getElementById('steps-stat-7').textContent = avg == null ? '—' : fmtInt(avg);
      document.getElementById('steps-stat-best').textContent = fmtInt(Math.max(...stEntries.map(e => e.steps)));
      const streak = goalStreak();
      const streakEl = document.getElementById('steps-stat-streak');
      streakEl.textContent = streak + (streak === 1 ? ' day' : ' days');
      streakEl.className = 'val' + (streak ? ' down' : '');
    }

    const firstT = dayStart(todayIso()) - (ranges.steps - 1) * DAY;
    const inRange = stEntries.filter(e => dayStart(e.date) >= firstT);
    const empty = document.getElementById('steps-chart-empty');
    const legend = document.getElementById('steps-chart-legend');
    if (!inRange.length){
      empty.textContent = stEntries.length ? 'No steps logged in this range.' : 'No steps logged yet. Add a day to start the chart.';
      empty.style.display = 'block';
      stChartSvg.style.display = 'none';
      legend.style.display = 'none';
    } else {
      empty.style.display = 'none';
      stChartSvg.style.display = 'block';
      legend.style.display = 'flex';
      buildStepsChart(inRange);
    }

    const body = document.getElementById('steps-history-body');
    document.getElementById('steps-history-empty').style.display = stEntries.length ? 'none' : 'block';
    document.getElementById('steps-history-table').style.display = stEntries.length ? 'table' : 'none';
    body.innerHTML = stEntries.slice().reverse().map(e => {
      const pct = Math.round(e.steps / goal * 100);
      return `<tr>
        <td>${fmtDate(dayStart(e.date))}</td>
        <td class="mono">${fmtInt(e.steps)}</td>
        <td class="mono ${pct >= 100 ? 'delta-down' : 'delta-flat'}">${pct >= 100 ? '✓ ' : ''}${pct}%</td>
        <td><button type="button" class="weight-del-btn" data-date="${e.date}" aria-label="Delete entry">✕</button></td>
      </tr>`;
    }).join('');
    body.querySelectorAll('.weight-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const date = btn.getAttribute('data-date');
        const me = self();
        if (me){
          const { error } = await bnbClient.from('step_log').delete().eq('user_id', me.id).eq('date', date);
          if (error){ console.error('Supabase delete step_log failed:', error); showStatus(stStatus, 'Couldn\'t delete that day. Please try again.'); return; }
        }
        stEntries = stEntries.filter(e => e.date !== date);
        renderSteps();
      });
    });
  }

  async function saveSteps(){
    const steps = parseInt(stValue.value, 10);
    if (!(steps >= 0 && steps <= 200000)){ stValue.focus(); showStatus(stStatus, 'Enter a step count between 0 and 200,000.'); return; }
    const date = stDate.value || todayIso();
    const me = self();
    if (me){
      stSubmit.disabled = true;
      const { error } = await bnbClient.from('step_log').upsert({ user_id: me.id, date, steps }, { onConflict: 'user_id,date' });
      stSubmit.disabled = false;
      if (error){
        console.error('Supabase save step_log failed:', error);
        showStatus(stStatus, 'Couldn\'t save your steps. Please try again.');
        return;
      }
    }
    stEntries = stEntries.filter(e => e.date !== date).concat([{ date, steps }])
      .sort((a, b) => a.date.localeCompare(b.date));
    showStatus(stStatus, 'Saved ' + fmtInt(steps) + ' steps for ' + fmtDate(dayStart(date)) + (steps >= goal ? '. Goal hit!' : '.'));
    stValue.value = '';
    renderSteps();
  }

  if (stSubmit){
    stDate.value = todayIso();
    stDate.max = todayIso();
    stSubmit.addEventListener('click', saveSteps);
    stValue.addEventListener('input', () => showStatus(stStatus, ''));
    stValue.addEventListener('keydown', e => { if (e.key === 'Enter') saveSteps(); });
    stGoal.addEventListener('change', () => {
      const v = parseInt(stGoal.value, 10);
      goal = v > 0 ? v : 10000;
      try { localStorage.setItem(GOAL_KEY, String(goal)); } catch(e) {}
      renderSteps();
    });
    stGoal.addEventListener('keydown', e => { if (e.key === 'Enter') stGoal.blur(); });
    wireRangeSwitch(document.getElementById('steps-range-switch'), 'steps', renderSteps);
    renderSteps();
    refreshSteps();
  }

  window.BNB_VITALS = { bpCategory, bpChartSvg, stepsChartSvg, dayStart, fmtDate, fmtInt };

  // Both sections load with this file, but only one is on screen, and
  // the hidden one's chart can't measure its width. Redraw on show.
  [['bp', renderBp], ['steps', renderSteps]].forEach(([key, render]) => {
    const btn = document.querySelector('#me-section-switch [data-me-section="' + key + '"]');
    if (btn) btn.addEventListener('click', () => requestAnimationFrame(render));
  });
})();
