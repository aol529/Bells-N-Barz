(function(){
  const dateInput = document.getElementById('period-date');
  const flowSwitch = document.getElementById('period-flow-switch');
  const symptomGroup = document.getElementById('period-symptom-group');
  const notesInput = document.getElementById('period-notes');
  const submitBtn = document.getElementById('period-submit');
  const statsBox = document.getElementById('period-stats');
  const statDay = document.getElementById('period-stat-day');
  const statCycle = document.getElementById('period-stat-cycle');
  const statLength = document.getElementById('period-stat-length');
  const statNext = document.getElementById('period-stat-next');
  const predictCard = document.getElementById('period-predict-card');
  const predictText = document.getElementById('period-predict-text');
  const chartEmpty = document.getElementById('period-chart-empty');
  const chartSvg = document.getElementById('period-chart-svg');
  const chartLegend = document.getElementById('period-chart-legend');
  const cycleTable = document.getElementById('period-cycle-table');
  const cycleBody = document.getElementById('period-cycle-body');
  const cycleEmpty = document.getElementById('period-cycle-empty');
  const historyTable = document.getElementById('period-history-table');
  const historyBody = document.getElementById('period-history-body');
  const historyEmpty = document.getElementById('period-history-empty');
  const clearBtn = document.getElementById('period-clear-btn');

  if (!dateInput) return; // Period tab not present on this page

  const SYMPTOM_LABELS = {
    cramps: 'Cramps', headache: 'Headache', bloating: 'Bloating', fatigue: 'Fatigue',
    mood: 'Mood swings', tender: 'Tender breasts', acne: 'Acne', backache: 'Backache',
    nausea: 'Nausea', insomnia: 'Insomnia'
  };
  const FLOW_LABELS = { spotting: 'Spotting', light: 'Light', medium: 'Medium', heavy: 'Heavy' };

  let selectedFlow = 'light';
  let selectedSymptoms = [];
  let entriesCache = null; // populated by refreshEntriesFromSupabase

  function periodRowToEntry(r){ return { date: r.date, flow: r.flow || null, symptoms: r.symptoms || [], notes: r.notes || '' }; }
  function entryToPeriodRow(e, userId){
    return { user_id: userId, date: e.date, flow: e.flow, symptoms: e.symptoms, notes: e.notes || null };
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
    const { data, error } = await bnbClient.from('period_log').select('*').eq('user_id', me.id);
    if (error) { console.error('Supabase load period_log failed:', error); return; }
    entriesCache = (data || []).map(periodRowToEntry);
    if (typeof render === 'function') render();
  }
  function saveEntries(entries){
    entriesCache = entries;
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // guest / nobody logged in — local-only for this session
    (async () => {
      try {
        // Same approach as the Weight tracker: no unique constraint to key
        // an upsert off of, and this table is small per user — delete this
        // user's rows, then re-insert the current set.
        await bnbClient.from('period_log').delete().eq('user_id', me.id);
        if (entries.length){
          const rows = entries.map(e => entryToPeriodRow(e, me.id));
          const { error } = await bnbClient.from('period_log').insert(rows);
          if (error) throw error;
        }
      } catch(e){
        console.warn('Supabase save period_log failed:', e);
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
  function fmtDateFull(iso){
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
  }
  function daysBetween(isoA, isoB){
    const a = new Date(isoA + 'T00:00:00'), b = new Date(isoB + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }
  function addDays(iso, n){
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    // Local-date serialization (same fix as todayIso above) — toISOString()
    // alone converts to UTC first, which silently shifts the date back a
    // day for anyone in a positive UTC-offset timezone (most of Europe,
    // Africa, Asia, Australia). That would throw off predicted next period,
    // ovulation, and fertile window dates by a day for most of the world.
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0,10);
  }

  function upsertEntry(date, flow, symptoms, notes){
    const entries = loadEntries();
    const idx = entries.findIndex(e => e.date === date);
    const entry = { date, flow, symptoms, notes };
    if (idx >= 0) entries[idx] = entry; else entries.push(entry);
    entries.sort((a,b) => a.date.localeCompare(b.date));
    saveEntries(entries);
  }
  function deleteEntry(date){
    const entries = loadEntries().filter(e => e.date !== date);
    saveEntries(entries);
  }

  // Groups flow-logged dates into periods: consecutive calendar days (gap
  // of 1 day or less) belong to the same period, a gap of 2+ days starts a
  // new one. Symptom-only days (no flow selected) don't count as period
  // days and don't break or extend a streak.
  function computeCycles(entries){
    const periodDates = entries.filter(e => e.flow).map(e => e.date).sort();
    if (!periodDates.length) return [];
    const periods = [];
    let current = [periodDates[0]];
    for (let i = 1; i < periodDates.length; i++){
      if (daysBetween(periodDates[i-1], periodDates[i]) <= 1){
        current.push(periodDates[i]);
      } else {
        periods.push(current);
        current = [periodDates[i]];
      }
    }
    periods.push(current);
    return periods.map((days, i) => {
      const start = days[0], end = days[days.length - 1];
      const cycleLength = i > 0 ? daysBetween(periods[i-1][0], start) : null;
      return { start, end, length: daysBetween(start, end) + 1, cycleLength };
    });
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
      svg += `<circle class="data-dot" cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.5"><title>${fmtDate(p.date)}: ${values[i]}d cycle</title></circle>`;
    });

    chartSvg.innerHTML = svg;
  }

  function render(){
    const entries = loadEntries();
    const cycles = computeCycles(entries);
    const completeCycles = cycles.filter(c => c.cycleLength != null);

    // ---- stats + fertile window estimate ----
    if (!cycles.length){
      statsBox.style.display = 'none';
      predictCard.style.display = 'none';
    } else {
      statsBox.style.display = 'grid';
      const last = cycles[cycles.length - 1];
      const today = todayIso();
      const cycleDay = daysBetween(last.start, today) + 1;
      statDay.textContent = cycleDay >= 1 ? String(cycleDay) : '—';
      statLength.textContent = (completeCycles.length ? Math.round(cycles.slice(-6).reduce((a,c)=>a+c.length,0) / cycles.slice(-6).length) : last.length) + 'd';

      if (completeCycles.length){
        const recentCycles = completeCycles.slice(-6);
        const avgCycle = Math.round(recentCycles.reduce((a,c)=>a+c.cycleLength,0) / recentCycles.length);
        statCycle.textContent = avgCycle + 'd';

        const predictedNext = addDays(last.start, avgCycle);
        const untilNext = daysBetween(today, predictedNext);
        statNext.textContent = untilNext === 0 ? 'Today'
          : untilNext > 0 ? fmtDate(predictedNext) + ` (${untilNext}d)`
          : fmtDate(predictedNext) + ' (late)';

        const ovulation = addDays(predictedNext, -14);
        const fertileStart = addDays(ovulation, -5);
        const fertileEnd = addDays(ovulation, 1);
        predictCard.style.display = 'block';
        predictText.textContent = `Estimated ovulation around ${fmtDateFull(ovulation)} — fertile window ${fmtDateFull(fertileStart)} to ${fmtDateFull(fertileEnd)}.`;
      } else {
        statCycle.textContent = '—';
        statNext.textContent = 'Need 2+ cycles';
        predictCard.style.display = 'none';
      }
    }

    // ---- cycle length trend chart ----
    if (completeCycles.length < 2){
      chartEmpty.style.display = 'block';
      chartSvg.style.display = 'none';
      chartLegend.style.display = 'none';
    } else {
      chartEmpty.style.display = 'none';
      chartSvg.style.display = 'block';
      chartLegend.style.display = 'flex';
      buildChart(completeCycles.map(c => ({ date: c.start, value: c.cycleLength })));
    }

    // ---- cycle summary table (most recent first) ----
    if (!cycles.length){
      cycleTable.style.display = 'none';
      cycleEmpty.style.display = 'block';
    } else {
      cycleTable.style.display = 'table';
      cycleEmpty.style.display = 'none';
      cycleBody.innerHTML = cycles.slice().reverse().map(c => `<tr>
        <td>${fmtDate(c.start)}</td>
        <td class="mono">${c.length}d</td>
        <td class="mono">${c.cycleLength != null ? c.cycleLength + 'd' : '—'}</td>
      </tr>`).join('');
    }

    // ---- day log (most recent first) ----
    if (entries.length === 0){
      historyTable.style.display = 'none';
      historyEmpty.style.display = 'block';
    } else {
      historyTable.style.display = 'table';
      historyEmpty.style.display = 'none';
      historyBody.innerHTML = entries.slice().reverse().map(e => {
        const symptomsText = e.symptoms.length ? e.symptoms.map(s => SYMPTOM_LABELS[s] || s).join(', ') : '—';
        const flowText = e.flow ? (FLOW_LABELS[e.flow] || e.flow) : '—';
        return `<tr>
          <td>${fmtDate(e.date)}</td>
          <td>${flowText}</td>
          <td>${symptomsText}</td>
          <td><button type="button" class="weight-del-btn period-del-btn" data-date="${e.date}" aria-label="Delete entry">✕</button></td>
        </tr>`;
      }).join('');
      historyBody.querySelectorAll('.period-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          deleteEntry(btn.getAttribute('data-date'));
          render();
        });
      });
    }
  }

  flowSwitch.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFlow = btn.getAttribute('data-flow');
      flowSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  symptomGroup.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = btn.getAttribute('data-symptom');
      const idx = selectedSymptoms.indexOf(s);
      if (idx >= 0) selectedSymptoms.splice(idx, 1); else selectedSymptoms.push(s);
      btn.classList.toggle('active', selectedSymptoms.includes(s));
    });
  });

  submitBtn.addEventListener('click', () => {
    const date = dateInput.value || todayIso();
    upsertEntry(date, selectedFlow, selectedSymptoms.slice(), notesInput.value.trim());
    notesInput.value = '';
    selectedSymptoms = [];
    symptomGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    render();
  });
  notesInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });

  clearBtn.addEventListener('click', () => {
    if (loadEntries().length === 0) return;
    if (confirm('Clear all logged period entries? This can\'t be undone.')){
      saveEntries([]);
      render();
    }
  });

  dateInput.value = todayIso();
  dateInput.max = todayIso();
  render();
  refreshEntriesFromSupabase(); // async — replaces empty start once Supabase responds
})();
