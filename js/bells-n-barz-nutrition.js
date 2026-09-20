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

  if (!dateInput) return; // Nutrition tab not present on this page

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

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
})();
