(function(){
  const rootSelect = document.getElementById('track-exercise-select');
  if (!rootSelect) return; // Track tab not present on this page

  const PROTOCOL_EXERCISES = [
    { name:"Incline Barbell Bench Press", min:8, max:10 },
    { name:"Weighted Ring Dips", min:6, max:8 },
    { name:"Weighted Pull-ups", min:6, max:8 },
    { name:"Back Squat", min:4, max:6 },
    { name:"Deadlift", min:3, max:5 },
    { name:"Flat Barbell Bench Press", min:6, max:8 },
    { name:"Decline Barbell Bench Press", min:8, max:10 },
    { name:"Overhead / Military Press", min:6, max:8 },
    { name:"Weighted Chin-ups", min:6, max:8 },
    { name:"Bent Over Row", min:6, max:8 },
  ];
  const CUSTOM_SENTINEL = "__custom__";
  const STORAGE_KEY = "bnb-hepburn-v1";
  const NUM_SETS = 4;
  const LB_PER_KG = 2.20462;

  let state = null;
  let activeId = null;
  let panelMode = "add";
  let panelUnit = "lb";

  function slugId(name){
    return name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") + "-" + Math.random().toString(36).slice(2,7);
  }
  function freshExercise(name, min, max, weight, unit, step){
    return { name, min, max, weight, unit, step, sets: Array(NUM_SETS).fill(min), history: [] };
  }
  function defaultState(){
    const seeds = [
      ["Incline Barbell Bench Press", 8, 10, 135, "lb", 5],
      ["Weighted Ring Dips", 6, 8, 25, "lb", 5],
      ["Weighted Pull-ups", 6, 8, 25, "lb", 5],
    ];
    const exercises = {}; const order = [];
    seeds.forEach(([name,min,max,weight,unit,step])=>{
      const id = slugId(name);
      exercises[id] = freshExercise(name,min,max,weight,unit,step);
      order.push(id);
    });
    return { exercises, order, program: { weeks: 8, startDate: new Date().toISOString().slice(0,10), deload: { active: false, startDate: null } } };
  }
  let hepRowId = null; // the Supabase row id for this user's tracker state, once known

  function loadState(){
    // Instant start with the built-in default; real saved state replaces
    // it once refreshHepStateFromSupabase() responds (see below).
    return defaultState();
  }
  async function refreshHepStateFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // nobody logged in yet
    const { data, error } = await bnbClient.from('hep_progression_store').select('*').eq('owner_id', me.id);
    if (error) { console.error('Supabase load hep_progression_store failed:', error); return; }
    if (data && data.length && data[0].data){
      hepRowId = data[0].id;
      const st = data[0].data;
      if (!st.program) st.program = { weeks: 8, startDate: new Date().toISOString().slice(0,10) };
      if (!st.program.deload) st.program.deload = { active: false, startDate: null };
      state = st;
      if (typeof render === 'function') render();
    }
  }
  function saveState(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) { showToast("Log in to save your progress"); return; }
    (async () => {
      try {
        const row = { owner_id: me.id, data: state, updated_at: new Date().toISOString() };
        if (hepRowId) row.id = hepRowId;
        const { data, error } = await bnbClient.from('hep_progression_store').upsert([row], { onConflict: 'owner_id' }).select();
        if (error) throw error;
        if (data && data[0]) hepRowId = data[0].id;
      } catch(e){
        console.warn('Supabase save hep_progression_store failed:', e);
        showToast("Couldn't save — try again");
      }
    })();
  }

  function showToast(msg){
    const t = document.getElementById("t-toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(()=>t.classList.remove("show"), 2200);
  }

  function nextClimbIndex(sets, max){
    for(let i=0;i<sets.length;i++){ if(sets[i] < max) return i; }
    return -1;
  }
  function convertWeight(val, fromUnit, toUnit){
    if(fromUnit === toUnit) return val;
    const lb = fromUnit === "kg" ? val * LB_PER_KG : val;
    const out = toUnit === "kg" ? lb / LB_PER_KG : lb;
    return Math.round(out * 2) / 2;
  }
  function fmtDate(iso){
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }

  // ---------- program ----------
  function renderProgram(){
    const p = state.program;
    document.querySelectorAll("#track-program-switch button").forEach(btn=>{
      btn.classList.toggle("active", parseInt(btn.dataset.weeks,10) === p.weeks);
    });

    const statusEl = document.getElementById("track-program-status");
    const fillEl = document.getElementById("track-program-fill");
    const deloadBtn = document.getElementById("track-program-deload");

    if(p.deload && p.deload.active){
      const dStart = new Date(p.deload.startDate + "T00:00:00");
      const now = new Date();
      const dElapsed = Math.max(0, Math.floor((now - dStart) / 86400000));
      const dDaysLeft = Math.max(0, 7 - dElapsed);
      const dPct = Math.min(100, Math.round((dElapsed/7)*100));
      const dDone = dElapsed >= 7;

      statusEl.innerHTML = dDone
        ? `<b>Deload week complete.</b> Started ${p.deload.startDate}. Hit "Restart from today" to kick off the next block at full intensity.`
        : `<b>Deload Week</b> — day <b>${dElapsed+1}</b> of 7, <b>${dDaysLeft}</b> day${dDaysLeft===1?'':'s'} left. Cut load roughly 40–50% and stop a few reps shy of failure on everything — the point is to arrive fresh, not to test anything.`;
      fillEl.style.width = dPct + "%";
      fillEl.classList.remove("done");
      fillEl.classList.add("deload");
      deloadBtn.textContent = "End Deload Early";
      return;
    }

    fillEl.classList.remove("deload");
    deloadBtn.textContent = "Start Deload Week";

    const start = new Date(p.startDate + "T00:00:00");
    const now = new Date();
    const daysElapsed = Math.max(0, Math.floor((now - start) / 86400000));
    const totalDays = p.weeks * 7;
    const daysLeft = Math.max(0, totalDays - daysElapsed);
    const weekNum = Math.min(p.weeks, Math.floor(daysElapsed / 7) + 1);
    const pct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
    const done = daysElapsed >= totalDays;

    if(done){
      statusEl.innerHTML = `<b>${p.weeks}-week program complete.</b> Started ${p.startDate}. Consider a deload week before restarting — hit "Start Deload Week" to log one, or "Restart from today" to jump straight into the next block.`;
    } else if(weekNum === p.weeks){
      statusEl.innerHTML = `<b>Week ${weekNum}</b> of ${p.weeks} (final week) — <b>${daysLeft}</b> day${daysLeft===1?'':'s'} left. Started ${p.startDate}. Plan a deload week after this block wraps up.`;
    } else {
      statusEl.innerHTML = `<b>Week ${weekNum}</b> of ${p.weeks} — <b>${daysLeft}</b> day${daysLeft===1?'':'s'} left. Started ${p.startDate}.`;
    }

    fillEl.style.width = pct + "%";
    fillEl.classList.toggle("done", done);
  }

  document.getElementById("track-program-switch").addEventListener("click",(e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const weeks = parseInt(btn.dataset.weeks,10);
    if(weeks === state.program.weeks) return;
    state.program.weeks = weeks;
    saveState();
    renderProgram();
  });
  document.getElementById("track-program-restart").onclick = ()=>{
    if(!confirm("Restart the program timer from today? This only resets the week counter — logged sets and history stay put.")) return;
    state.program.startDate = new Date().toISOString().slice(0,10);
    state.program.deload = { active: false, startDate: null };
    saveState();
    renderProgram();
  };

  document.getElementById("track-program-deload").onclick = ()=>{
    const p = state.program;
    if(p.deload && p.deload.active){
      if(!confirm("End the deload week early? You can always restart the program timer once you're ready.")) return;
      p.deload.active = false;
    } else {
      if(!confirm("Start a 7-day deload week? Cut load roughly 40–50% and stay a few reps shy of failure on every set until it wraps up.")) return;
      p.deload = { active: true, startDate: new Date().toISOString().slice(0,10) };
    }
    saveState();
    renderProgram();
  };

  // ---------- picker ----------
  function renderPicker(){
    const sel = document.getElementById("track-exercise-select");
    sel.innerHTML = "";
    state.order.forEach(id=>{
      const ex = state.exercises[id];
      if(!ex) return;
      const opt = document.createElement("option");
      opt.value = id; opt.textContent = ex.name;
      sel.appendChild(opt);
    });
    if(!activeId || !state.exercises[activeId]){
      activeId = state.order[0] || null;
    }
    sel.value = activeId || "";
    sel.onchange = ()=>{ activeId = sel.value; render(); };

    const hasAny = state.order.length > 0;
    document.getElementById("track-edit-btn").style.visibility = hasAny ? "visible" : "hidden";
    sel.style.display = hasAny ? "" : "none";
  }

  // ---------- ladder card ----------
  function renderLadder(){
    const mount = document.getElementById("track-ladder-mount");
    mount.innerHTML = "";

    if(!activeId || !state.exercises[activeId]){
      mount.innerHTML = `<div style="text-align:center;padding:30px 10px;color:var(--muted-2);font-size:13px;">No exercise selected yet.<br><b style="color:var(--text);">Tap "+" above to add one.</b></div>`;
      return;
    }

    const ex = state.exercises[activeId];
    const climbIdx = nextClimbIndex(ex.sets, ex.max);
    const allMaxed = climbIdx === -1;

    mount.innerHTML = `<div class="t-lift-name">${ex.name}</div>`;

    const wr = document.createElement("div");
    wr.className = "t-weight-row";
    wr.innerHTML = `
      <div>
        <div class="t-weight-label">Current Load</div>
        <div class="t-weight-val-row">
          <input class="t-weight-edit" id="t-weight-input" type="number" step="0.5" value="${ex.weight}">
          <div class="unit-switch" id="t-unit-toggle">
            <button type="button" data-unit="lb" class="${ex.unit==='lb'?'active':''}">LB</button>
            <button type="button" data-unit="kg" class="${ex.unit==='kg'?'active':''}">KG</button>
          </div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="t-weight-label">Target</div>
        <div class="t-target-val">${NUM_SETS} × ${ex.min}–${ex.max}</div>
      </div>`;
    mount.appendChild(wr);

    const ladder = document.createElement("div");
    ladder.className = "t-ladder";
    ex.sets.forEach((reps,i)=>{
      const isClimb = i === climbIdx;
      const target = isClimb ? reps + 1 : reps;
      const pct = Math.round((reps/ex.max)*100);
      const row = document.createElement("div");
      row.className = "t-rung";
      row.innerHTML = `
        <span class="t-rung-label">Set ${i+1}</span>
        <div class="t-rung-track"><div class="t-rung-fill ${reps>=ex.max?'maxed':''}" style="width:${pct}%"></div></div>
        <span class="t-rung-target">→${target}</span>
        <input class="t-rung-input" type="number" data-idx="${i}" value="${target}" min="0" max="${ex.max+2}">
      `;
      ladder.appendChild(row);
    });
    mount.appendChild(ladder);

    const status = document.createElement("div");
    status.className = "t-status-line";
    if(allMaxed){
      status.innerHTML = `All ${NUM_SETS} sets are at the top of the range (<b>${ex.max}</b>). Log this session to add <b>${ex.step} ${ex.unit}</b> and restart the ladder at <b>${ex.min}</b>.`;
    } else {
      status.innerHTML = `Set ${climbIdx+1} is climbing this session — enter what you actually hit on every set below, then log it. Hit the target on Set ${climbIdx+1} and the ladder advances; miss it and the session logs as a hold.`;
    }
    mount.appendChild(status);

    const rpeRow = document.createElement("div");
    rpeRow.className = "t-field";
    rpeRow.style.marginBottom = "14px";
    rpeRow.innerHTML = `
      <label>RPE (optional — how hard did the climbing set feel?)</label>
      <select id="t-rpe-select">
        <option value="">— not logged —</option>
        <option value="6">6 — could do 4+ more reps</option>
        <option value="6.5">6.5</option>
        <option value="7">7 — could do 3 more reps</option>
        <option value="7.5">7.5</option>
        <option value="8">8 — could do 2 more reps</option>
        <option value="8.5">8.5</option>
        <option value="9">9 — could do 1 more rep</option>
        <option value="9.5">9.5 — maybe 1 more</option>
        <option value="10">10 — no reps left, all-out</option>
      </select>`;
    mount.appendChild(rpeRow);

    const actions = document.createElement("div");
    actions.className = "t-actions";
    const logBtn = document.createElement("button");
    logBtn.className = "t-primary"; logBtn.type = "button";
    logBtn.textContent = "Log Session";
    logBtn.onclick = ()=>logSession(activeId);
    const resetBtn = document.createElement("button");
    resetBtn.className = "t-ghost"; resetBtn.type = "button";
    resetBtn.textContent = "Reset Ladder";
    resetBtn.onclick = ()=>resetLift(activeId);
    actions.appendChild(logBtn); actions.appendChild(resetBtn);
    mount.appendChild(actions);

    document.getElementById("t-weight-input").onchange = (e)=>{
      const v = parseFloat(e.target.value);
      if(!isNaN(v)){ ex.weight = v; saveState(); }
    };
    document.getElementById("t-unit-toggle").querySelectorAll("button").forEach(btn=>{
      btn.onclick = ()=>{
        const newUnit = btn.dataset.unit;
        if(newUnit === ex.unit) return;
        ex.weight = convertWeight(ex.weight, ex.unit, newUnit);
        ex.step = convertWeight(ex.step, ex.unit, newUnit);
        ex.unit = newUnit;
        saveState(); render();
      };
    });
  }

  function logSession(id){
    const ex = state.exercises[id];
    const inputs = document.querySelectorAll(".t-rung-input");
    const actual = Array.from(inputs).map(inp => parseInt(inp.value,10) || 0);
    const climbIdx = nextClimbIndex(ex.sets, ex.max);
    const dateStr = new Date().toISOString().slice(0,10);
    const rpeEl = document.getElementById("t-rpe-select");
    const rpe = rpeEl && rpeEl.value ? parseFloat(rpeEl.value) : null;

    if(climbIdx === -1){
      ex.weight = Math.round((ex.weight + ex.step) * 2) / 2;
      ex.sets = Array(NUM_SETS).fill(ex.min);
      ex.history.push({date:dateStr, weight:ex.weight, unit:ex.unit, sets:[...ex.sets], held:false, leveledUp:true, rpe});
      saveState(); render();
      showToast(`Load up to ${ex.weight} ${ex.unit} — ladder reset`);
      return;
    }

    const hitClimb = actual[climbIdx] >= (ex.sets[climbIdx] + 1);
    if(hitClimb){
      ex.sets[climbIdx] += 1;
      const nowAllMaxed = nextClimbIndex(ex.sets, ex.max) === -1;
      ex.history.push({date:dateStr, weight:ex.weight, unit:ex.unit, sets:[...ex.sets], held:false, leveledUp:false, rpe});
      saveState(); render();
      showToast(nowAllMaxed ? `Set ${climbIdx+1} maxed — ladder complete, add load next session` : `Set ${climbIdx+1} advanced to ${ex.sets[climbIdx]}`);
    } else {
      ex.history.push({date:dateStr, weight:ex.weight, unit:ex.unit, sets:[...actual], held:true, leveledUp:false, rpe});
      saveState(); render();
      showToast("Logged as a hold — rep count stays the same next session");
    }
  }

  function resetLift(id){
    const ex = state.exercises[id];
    if(!confirm(`Reset ${ex.name} back to a fresh ladder? This clears its history.`)) return;
    ex.sets = Array(NUM_SETS).fill(ex.min);
    ex.history = [];
    saveState(); render();
  }

  // ---------- chart (reuses the Weight tab's .weight-chart-svg styling) ----------
  function renderChart(){
    const emptyEl = document.getElementById("track-chart-empty");
    const svgEl = document.getElementById("track-chart-svg");
    const legendEl = document.getElementById("track-chart-legend");

    const ex = activeId ? state.exercises[activeId] : null;
    const hist = ex ? ex.history : [];

    if(!ex || hist.length < 2){
      emptyEl.style.display = "block";
      emptyEl.textContent = (!ex || hist.length === 0) ? "Log a session to start the chart." : "Log one more session to see a trend line.";
      svgEl.style.display = "none";
      legendEl.style.display = "none";
      return;
    }
    emptyEl.style.display = "none";
    svgEl.style.display = "block";
    legendEl.style.display = "flex";

    const W = 700, H = 320, padL = 44, padR = 20, padT = 20, padB = 36;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const weights = hist.map(h => h.weight);
    let minV = Math.min(...weights), maxV = Math.max(...weights);
    if(minV === maxV){ minV -= 1; maxV += 1; }
    const pad = (maxV - minV) * 0.15 || 1;
    minV -= pad; maxV += pad;

    const xAt = i => padL + (hist.length > 1 ? (i/(hist.length-1)) * innerW : 0);
    const yAt = w => padT + innerH - ((w - minV)/(maxV - minV)) * innerH;

    let svg = "";
    const bands = 4;
    for(let i=0;i<=bands;i++){
      const v = minV + (maxV - minV) * (i/bands);
      const yy = yAt(v);
      svg += `<line class="grid-line" x1="${padL}" y1="${yy.toFixed(1)}" x2="${W-padR}" y2="${yy.toFixed(1)}"/>`;
      svg += `<text class="axis-label" x="${padL-8}" y="${(yy+3).toFixed(1)}" text-anchor="end">${Math.round(v)}</text>`;
    }
    const labelIdxs = hist.length > 2 ? [0, Math.floor((hist.length-1)/2), hist.length-1] : hist.map((_,i)=>i);
    labelIdxs.forEach(i=>{
      const xx = xAt(i);
      svg += `<text class="axis-label" x="${xx.toFixed(1)}" y="${H-padB+18}" text-anchor="middle">${fmtDate(hist[i].date)}</text>`;
    });

    let dataPath = "";
    hist.forEach((h,i)=>{
      const xx = xAt(i), yy = yAt(h.weight);
      dataPath += (i===0 ? "M" : "L") + xx.toFixed(1) + "," + yy.toFixed(1) + " ";
    });
    svg += `<path class="data-line" d="${dataPath}"/>`;

    hist.forEach((h,i)=>{
      const xx = xAt(i), yy = yAt(h.weight);
      const color = h.held ? "var(--accent-2)" : h.leveledUp ? "var(--accent)" : "var(--accent-3)";
      const r = h.leveledUp ? 4.3 : 3.5;
      svg += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="${r}" fill="${color}" stroke="var(--surface)" stroke-width="1.5"><title>${fmtDate(h.date)}: ${h.weight} ${h.unit}${h.held?' · hold':h.leveledUp?' · level-up':''}${h.rpe!=null?' · RPE '+h.rpe:''}</title></circle>`;
    });

    svgEl.innerHTML = svg;
  }

  // ---------- history table ----------
  function renderHistoryTable(){
    const body = document.getElementById("track-history-body");
    const emptyEl = document.getElementById("track-history-empty");
    const table = document.getElementById("track-history-table");
    body.innerHTML = "";

    const ex = activeId ? state.exercises[activeId] : null;
    const hist = ex ? ex.history : [];

    if(!ex || hist.length === 0){
      table.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }
    table.style.display = "";
    emptyEl.style.display = "none";

    [...hist].reverse().forEach(h=>{
      const tr = document.createElement("tr");
      const resultLabel = h.held ? "Hold" : h.leveledUp ? "Level-up" : "Advance";
      const resultClass = h.held ? "delta-up" : h.leveledUp ? "" : "delta-down";
      tr.innerHTML = `
        <td class="mono">${h.date}</td>
        <td class="mono">${h.weight} ${h.unit}</td>
        <td class="mono">${h.sets.join("/")}</td>
        <td class="mono">${h.rpe != null ? h.rpe : '—'}</td>
        <td class="${resultClass}">${resultLabel}</td>`;
      body.appendChild(tr);
    });
  }

  function render(){
    renderProgram();
    renderPicker();
    renderLadder();
    renderChart();
    renderHistoryTable();
  }

  // ---------- add / edit panel ----------
  function openPanel(mode){
    panelMode = mode;
    const backdrop = document.getElementById("t-panel-backdrop");
    const presetSel = document.getElementById("t-panel-preset");
    presetSel.innerHTML = "";
    PROTOCOL_EXERCISES.forEach(p=>{
      const opt = document.createElement("option");
      opt.value = p.name; opt.textContent = p.name;
      presetSel.appendChild(opt);
    });
    const customOpt = document.createElement("option");
    customOpt.value = CUSTOM_SENTINEL; customOpt.textContent = "Custom exercise…";
    presetSel.appendChild(customOpt);

    document.getElementById("t-panel-title").textContent = mode === "edit" ? "Edit Exercise" : "Add Exercise";

    if(mode === "edit" && activeId && state.exercises[activeId]){
      const ex = state.exercises[activeId];
      const preset = PROTOCOL_EXERCISES.find(p=>p.name===ex.name);
      presetSel.value = preset ? ex.name : CUSTOM_SENTINEL;
      document.getElementById("t-panel-custom-name-field").style.display = preset ? "none" : "block";
      document.getElementById("t-panel-custom-name").value = preset ? "" : ex.name;
      document.getElementById("t-panel-min").value = ex.min;
      document.getElementById("t-panel-max").value = ex.max;
      document.getElementById("t-panel-weight").value = ex.weight;
      document.getElementById("t-panel-step").value = ex.step;
      panelUnit = ex.unit;
    } else {
      presetSel.value = PROTOCOL_EXERCISES[0].name;
      document.getElementById("t-panel-custom-name-field").style.display = "none";
      document.getElementById("t-panel-custom-name").value = "";
      document.getElementById("t-panel-min").value = PROTOCOL_EXERCISES[0].min;
      document.getElementById("t-panel-max").value = PROTOCOL_EXERCISES[0].max;
      document.getElementById("t-panel-weight").value = "";
      document.getElementById("t-panel-step").value = 5;
      panelUnit = "lb";
    }
    syncPanelUnitButtons();
    backdrop.classList.add("open");
  }
  function closePanel(){
    document.getElementById("t-panel-backdrop").classList.remove("open");
  }
  function syncPanelUnitButtons(){
    document.querySelectorAll("#t-panel-unit-toggle button").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.unit === panelUnit);
    });
  }

  document.getElementById("t-panel-preset").addEventListener("change", (e)=>{
    const val = e.target.value;
    const customField = document.getElementById("t-panel-custom-name-field");
    if(val === CUSTOM_SENTINEL){
      customField.style.display = "block";
    } else {
      customField.style.display = "none";
      const preset = PROTOCOL_EXERCISES.find(p=>p.name===val);
      if(preset){
        document.getElementById("t-panel-min").value = preset.min;
        document.getElementById("t-panel-max").value = preset.max;
      }
    }
  });

  document.getElementById("t-panel-unit-toggle").addEventListener("click",(e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const newUnit = btn.dataset.unit;
    if(newUnit === panelUnit) return;
    const weightInput = document.getElementById("t-panel-weight");
    const stepInput = document.getElementById("t-panel-step");
    if(weightInput.value !== ""){
      weightInput.value = convertWeight(parseFloat(weightInput.value)||0, panelUnit, newUnit);
    }
    if(stepInput.value !== ""){
      stepInput.value = convertWeight(parseFloat(stepInput.value)||0, panelUnit, newUnit);
    }
    panelUnit = newUnit;
    syncPanelUnitButtons();
  });

  document.getElementById("track-add-btn").onclick = ()=>openPanel("add");
  document.getElementById("track-edit-btn").onclick = ()=>{ if(activeId) openPanel("edit"); };
  document.getElementById("t-panel-cancel").onclick = closePanel;
  document.getElementById("t-panel-backdrop").addEventListener("click",(e)=>{
    if(e.target.id === "t-panel-backdrop") closePanel();
  });

  document.getElementById("t-panel-save").onclick = ()=>{
    const presetVal = document.getElementById("t-panel-preset").value;
    const isCustom = presetVal === CUSTOM_SENTINEL;
    const name = isCustom ? document.getElementById("t-panel-custom-name").value.trim() : presetVal;
    const min = parseInt(document.getElementById("t-panel-min").value,10);
    const max = parseInt(document.getElementById("t-panel-max").value,10);
    const weight = parseFloat(document.getElementById("t-panel-weight").value);
    const step = parseFloat(document.getElementById("t-panel-step").value);

    if(!name){ showToast("Give the exercise a name"); return; }
    if(isNaN(min) || isNaN(max) || min < 1 || max < min){ showToast("Check the rep range"); return; }
    if(isNaN(weight) || weight < 0){ showToast("Enter a starting weight"); return; }
    if(isNaN(step) || step <= 0){ showToast("Enter a load increase"); return; }

    if(panelMode === "edit" && activeId && state.exercises[activeId]){
      const ex = state.exercises[activeId];
      ex.name = name; ex.min = min; ex.max = max; ex.weight = weight; ex.unit = panelUnit; ex.step = step;
      ex.sets = ex.sets.map(r => Math.min(Math.max(r, min), max));
      saveState(); closePanel(); render();
      showToast("Exercise updated");
    } else {
      const id = slugId(name);
      state.exercises[id] = freshExercise(name, min, max, weight, panelUnit, step);
      state.order.push(id);
      activeId = id;
      saveState(); closePanel(); render();
      showToast(`${name} added`);
    }
  };

  // ---------- init ----------
  state = loadState();
  refreshHepStateFromSupabase(); // async — replaces default start once Supabase responds
  activeId = state.order[0] || null;
  render();
})();
