(function(){
  const STORE_KEY = 'bnb-weight-log';
  const UNIT_KEY = 'bnb-weight-unit';
  const TARGET_KEY = 'bnb-weight-target-kg';
  const KG_PER_LB = 0.45359237;

  const dateInput = document.getElementById('weight-date');
  const valueInput = document.getElementById('weight-value');
  const submitBtn = document.getElementById('weight-submit');
  const unitSwitch = document.getElementById('weight-unit-switch');
  const targetInput = document.getElementById('weight-target');
  const statsBox = document.getElementById('weight-stats');
  const statStart = document.getElementById('stat-start');
  const statCurrent = document.getElementById('stat-current');
  const statChange = document.getElementById('stat-change');
  const statCount = document.getElementById('stat-count');
  const chartEmpty = document.getElementById('weight-chart-empty');
  const chartSvg = document.getElementById('weight-chart-svg');
  const chartLegend = document.getElementById('weight-chart-legend');
  const chartLegendTarget = document.getElementById('weight-chart-legend-target');
  const historyBody = document.getElementById('weight-history-body');
  const historyTable = document.getElementById('weight-history-table');
  const historyEmpty = document.getElementById('weight-history-empty');
  const clearBtn = document.getElementById('weight-clear-btn');

  let unit = 'lb';
  try { unit = localStorage.getItem(UNIT_KEY) || 'lb'; } catch(e) {}

  // Same "saved on this device only" tier as the BMI height field right
  // below this tab — a standing personal preference, not shared/synced
  // data, so no Supabase table for it.
  let targetKg = null;
  try {
    const v = parseFloat(localStorage.getItem(TARGET_KEY));
    if (!isNaN(v) && v > 0) targetKg = v;
  } catch(e){}

  function weightRowToEntry(r){ return { date: r.date, kg: r.weight }; }
  function entryToWeightRow(e, userId){
    return { user_id: userId, date: e.date, weight: e.kg };
  }

  let entriesCache = null; // populated by refreshEntriesFromSupabase

  function loadEntries(){
    // Instant read from cache; starts empty until the first Supabase
    // fetch resolves (see refreshEntriesFromSupabase below).
    const arr = entriesCache || [];
    return arr.slice().sort((a,b) => a.date.localeCompare(b.date));
  }
  async function refreshEntriesFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // nobody logged in yet — nothing to fetch
    const { data, error } = await bnbClient.from('weight_log').select('*').eq('user_id', me.id);
    if (error) { console.error('Supabase load weight_log failed:', error); return; }
    entriesCache = (data || []).map(weightRowToEntry);
    if (typeof render === 'function') render();
  }
  function saveEntries(entries){
    entriesCache = entries;
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // guest / nobody logged in — local-only for this session
    (async () => {
      try {
        // weight_log has no unique constraint on (user_id, date) to key an
        // upsert off of, so this table is small per user — simplest
        // correct approach is: delete this user's rows, then re-insert
        // the current set. Fine at personal-tracker scale (dozens to a
        // few hundred entries), not meant for bulk/shared data.
        await bnbClient.from('weight_log').delete().eq('user_id', me.id);
        if (entries.length){
          const rows = entries.map(e => entryToWeightRow(e, me.id));
          const { error } = await bnbClient.from('weight_log').insert(rows);
          if (error) throw error;
        }
      } catch(e){
        console.warn('Supabase save weight_log failed:', e);
      }
    })();
  }

  function kgToDisplay(kg){ return unit === 'kg' ? kg : kg / KG_PER_LB; }
  function displayToKg(v){ return unit === 'kg' ? v : v * KG_PER_LB; }
  function fmtWeight(kg){ return kgToDisplay(kg).toFixed(1) + ' ' + unit; }
  function fmtDate(iso){
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }
  function todayIso(){
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0,10);
  }

  function upsertEntry(date, kg){
    const entries = loadEntries();
    const idx = entries.findIndex(e => e.date === date);
    if (idx >= 0) entries[idx].kg = kg; else entries.push({date, kg});
    entries.sort((a,b) => a.date.localeCompare(b.date));
    saveEntries(entries);
  }
  function deleteEntry(date){
    const entries = loadEntries().filter(e => e.date !== date);
    saveEntries(entries);
  }

  function buildChart(entries){
    const W = 700, H = 320, padL = 52, padR = 20, padT = 20, padB = 36;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const dates = entries.map(e => new Date(e.date + 'T00:00:00').getTime());
    const values = entries.map(e => kgToDisplay(e.kg));
    let minD = Math.min(...dates), maxD = Math.max(...dates);
    if (minD === maxD) { minD -= 86400000; maxD += 86400000; }
    let minV = Math.min(...values), maxV = Math.max(...values);
    // Folded into the raw min/max BEFORE padding, not after — so the
    // target line gets the same breathing room as the real data instead
    // of landing flush against the chart edge.
    const targetDisplay = targetKg != null ? kgToDisplay(targetKg) : null;
    if (targetDisplay != null){
      minV = Math.min(minV, targetDisplay);
      maxV = Math.max(maxV, targetDisplay);
    }
    if (minV === maxV) { minV -= 2; maxV += 2; }
    const pad = (maxV - minV) * 0.12 || 2;
    minV -= pad; maxV += pad;

    const x = t => padL + ((t - minD) / (maxD - minD)) * innerW;
    const y = v => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;

    // 7-entry trailing rolling average (index-based, tracks trend not calendar days)
    const trend = entries.map((e, i) => {
      const start = Math.max(0, i - 6);
      const slice = values.slice(start, i + 1);
      return slice.reduce((a,b) => a+b, 0) / slice.length;
    });

    let svg = '';
    // gridlines + y labels (4 bands)
    const bands = 4;
    for (let i = 0; i <= bands; i++){
      const v = minV + (maxV - minV) * (i / bands);
      const yy = y(v);
      svg += `<line class="grid-line" x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}"/>`;
      svg += `<text class="axis-label" x="${padL-8}" y="${yy+3}" text-anchor="end">${v.toFixed(1)}</text>`;
    }
    // x labels: first, middle, last date
    const labelIdxs = entries.length > 2 ? [0, Math.floor((entries.length-1)/2), entries.length-1] : entries.map((_,i)=>i);
    labelIdxs.forEach(i => {
      const e = entries[i];
      const xx = x(new Date(e.date + 'T00:00:00').getTime());
      svg += `<text class="axis-label" x="${xx}" y="${H-padB+18}" text-anchor="middle">${fmtDate(e.date)}</text>`;
    });

    // trend line (only if 2+ points)
    if (entries.length > 1){
      let trendPath = '';
      entries.forEach((e, i) => {
        const xx = x(new Date(e.date + 'T00:00:00').getTime());
        const yy = y(trend[i]);
        trendPath += (i === 0 ? 'M' : 'L') + xx.toFixed(1) + ',' + yy.toFixed(1) + ' ';
      });
      svg += `<path class="trend-line" d="${trendPath}"/>`;

      let dataPath = '';
      entries.forEach((e, i) => {
        const xx = x(new Date(e.date + 'T00:00:00').getTime());
        const yy = y(values[i]);
        dataPath += (i === 0 ? 'M' : 'L') + xx.toFixed(1) + ',' + yy.toFixed(1) + ' ';
      });
      svg += `<path class="data-line" d="${dataPath}"/>`;
    }

    // dots (always, even single point)
    entries.forEach((e, i) => {
      const xx = x(new Date(e.date + 'T00:00:00').getTime());
      const yy = y(values[i]);
      svg += `<circle class="data-dot" cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.5"><title>${fmtDate(e.date)}: ${values[i].toFixed(1)} ${unit}</title></circle>`;
    });

    // target line — drawn last, on top of everything else, so it's never
    // hidden behind the data/trend lines
    if (targetDisplay != null){
      const yy = y(targetDisplay);
      svg += `<line class="target-line" x1="${padL}" y1="${yy.toFixed(1)}" x2="${W-padR}" y2="${yy.toFixed(1)}"/>`;
      svg += `<text class="target-label" x="${W-padR}" y="${(yy-6).toFixed(1)}" text-anchor="end">Target: ${targetDisplay.toFixed(1)} ${unit}</text>`;
    }

    chartSvg.innerHTML = svg;
  }

  function render(){
    const entries = loadEntries();

    // unit switch UI
    unitSwitch.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.getAttribute('data-unit') === unit));
    valueInput.placeholder = unit === 'kg' ? 'e.g. 78.2' : 'e.g. 172.4';
    targetInput.placeholder = unit === 'kg' ? 'e.g. 75' : 'e.g. 165';
    // Only refreshed here, not on every keystroke — the field commits via
    // its own 'change' listener below, which is what updates targetKg.
    if (document.activeElement !== targetInput){
      targetInput.value = targetKg != null ? kgToDisplay(targetKg).toFixed(1) : '';
    }

    // stats
    if (entries.length === 0){
      statsBox.style.display = 'none';
    } else {
      statsBox.style.display = 'grid';
      const start = entries[0].kg, current = entries[entries.length-1].kg;
      const diffDisplay = kgToDisplay(current) - kgToDisplay(start);
      statStart.textContent = fmtWeight(start);
      statCurrent.textContent = fmtWeight(current);
      statChange.textContent = (diffDisplay > 0 ? '+' : '') + diffDisplay.toFixed(1) + ' ' + unit;
      statChange.className = 'val ' + (diffDisplay > 0.05 ? 'up' : diffDisplay < -0.05 ? 'down' : '');
      statCount.textContent = String(entries.length);
    }

    // chart
    if (entries.length === 0){
      chartEmpty.style.display = 'block';
      chartSvg.style.display = 'none';
      chartLegend.style.display = 'none';
    } else {
      chartEmpty.style.display = 'none';
      chartSvg.style.display = 'block';
      chartLegend.style.display = (entries.length > 1 || targetKg != null) ? 'flex' : 'none';
      chartLegendTarget.style.display = targetKg != null ? '' : 'none';
      buildChart(entries);
    }

    // history (most recent first)
    if (entries.length === 0){
      historyTable.style.display = 'none';
      historyEmpty.style.display = 'block';
    } else {
      historyTable.style.display = 'table';
      historyEmpty.style.display = 'none';
      const rev = entries.slice().reverse();
      historyBody.innerHTML = rev.map((e, i) => {
        const prev = rev[i+1]; // previous chronologically = next in reversed array
        let deltaHtml = '<span class="delta-flat">—</span>';
        if (prev){
          const d = kgToDisplay(e.kg) - kgToDisplay(prev.kg);
          const cls = d > 0.05 ? 'delta-up' : d < -0.05 ? 'delta-down' : 'delta-flat';
          deltaHtml = `<span class="${cls}">${d > 0 ? '+' : ''}${d.toFixed(1)} ${unit}</span>`;
        }
        return `<tr>
          <td>${fmtDate(e.date)}</td>
          <td class="mono">${fmtWeight(e.kg)}</td>
          <td class="mono">${deltaHtml}</td>
          <td><button type="button" class="weight-del-btn" data-date="${e.date}" aria-label="Delete entry">✕</button></td>
        </tr>`;
      }).join('');
      historyBody.querySelectorAll('.weight-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          deleteEntry(btn.getAttribute('data-date'));
          render();
        });
      });
    }

    document.dispatchEvent(new CustomEvent('bnb-weight-updated'));
  }

  unitSwitch.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      unit = btn.getAttribute('data-unit');
      try { localStorage.setItem(UNIT_KEY, unit); } catch(e) {}
      render();
    });
  });

  targetInput.addEventListener('change', () => {
    const raw = parseFloat(targetInput.value);
    targetKg = (!isNaN(raw) && raw > 0) ? displayToKg(raw) : null;
    try {
      if (targetKg != null) localStorage.setItem(TARGET_KEY, String(targetKg));
      else localStorage.removeItem(TARGET_KEY);
    } catch(e){}
    render();
  });
  targetInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') targetInput.blur(); });

  submitBtn.addEventListener('click', () => {
    const date = dateInput.value || todayIso();
    const raw = parseFloat(valueInput.value);
    if (isNaN(raw) || raw <= 0){
      valueInput.focus();
      return;
    }
    upsertEntry(date, displayToKg(raw));
    valueInput.value = '';
    render();
  });
  valueInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });

  clearBtn.addEventListener('click', () => {
    if (loadEntries().length === 0) return;
    if (confirm('Clear all logged weight entries? This can\'t be undone.')){
      saveEntries([]);
      render();
    }
  });

  dateInput.value = todayIso();
  dateInput.max = todayIso();
  render();
  refreshEntriesFromSupabase(); // async — replaces empty start once Supabase responds

  // Let other modules (BMI) read the same real weight data instead of
  // duplicating storage logic against a localStorage key that no longer
  // exists now that this is Supabase-backed.
  window.BNB_WEIGHT = {
    getEntries: function(){ return loadEntries(); }
  };
})();
