/* =========================================================================
   BELL(E)S N' BARZ — LIFT TOOLS
   Small shared pieces for the two live loggers (Member > Live Session and
   Coach > Live Session) and the Tools tab:
     - BNB_UI.modal(): a panel in the same .t-panel style as Track's
       Add Exercise panel, built on the fly.
     - BNB_LIFT: number helpers for set logging (weight, reps, estimated
       one-rep max, rest periods written as "1 min" / "90 sec").
     - BNB_REST: the rest timer — a bar along the bottom that starts when a
       set is ticked, counts down, then beeps and buzzes.
     - BNB_PLATES: the plate calculator — what to load on each side of the
       bar for a target weight.
   Loaded before training-core.js, which calls into it.
   ========================================================================= */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function toast(msg, ms){
    const t = document.getElementById('t-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(()=> t.classList.remove('show'), ms || 3000);
  }

  /* ---------------- MODAL ----------------
     Returns { el, body, close }. Closing removes it from the page; onClose
     runs either way (Close button, backdrop tap, Esc). */
  function modal(title, html, opts){
    opts = opts || {};
    const back = document.createElement('div');
    back.className = 't-panel-backdrop open bnb-modal';
    back.innerHTML = '<div class="t-panel' + (opts.wide ? ' bnb-modal-wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<h2>' + esc(title) + '</h2><div class="bnb-modal-body">' + html + '</div>' +
      '<div class="t-panel-actions"><button type="button" class="btn2" data-modal-close>Close</button></div></div>';
    document.body.appendChild(back);
    let closed = false;
    function close(){
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      back.remove();
      if (opts.onClose) opts.onClose();
    }
    function onKey(e){ if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', e => { if (e.target === back) close(); });
    back.querySelector('[data-modal-close]').onclick = close;
    return { el: back, body: back.querySelector('.bnb-modal-body'), close };
  }

  // Loads a script once (CDN libraries used only by one screen).
  const scripts = {};
  function loadScript(src){
    if (!scripts[src]) scripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = () => { delete scripts[src]; reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
    return scripts[src];
  }

  window.BNB_UI = { modal, toast, esc, loadScript };

  /* ---------------- NUMBERS ----------------
     Weights are typed freely ("60", "62.5kg", "BW", "BW+10"): parseWt
     takes the first number, and bodyweight-only sets ("BW") come back as
     null so they're left out of weight records and charts. */
  function parseWt(s){
    s = String(s == null ? '' : s).trim();
    if (!s || /^bw$/i.test(s)) return null;
    const m = s.replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  function parseReps(s){
    const m = String(s == null ? '' : s).match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  }
  // Epley's formula. Past 12 reps an estimate says little, so those sets
  // don't get one.
  function e1rm(wt, reps){
    if (wt == null || !reps || reps < 1 || reps > 12) return null;
    return reps === 1 ? wt : wt * (1 + reps / 30);
  }
  // "1 min", "90 sec", "60-90s", "2:00", "1.5 min" → seconds (the low end
  // of a range). Unparseable → null.
  function parseRest(s){
    s = String(s == null ? '' : s).trim().toLowerCase();
    if (!s) return null;
    const clock = s.match(/^(\d+):(\d{2})/);
    if (clock) return parseInt(clock[1], 10) * 60 + parseInt(clock[2], 10);
    const m = s.match(/(\d+(\.\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return Math.round(/min|'/.test(s) ? n * 60 : n);
  }
  function fmtKg(n){ return (Math.round(n * 10) / 10).toString(); }

  window.BNB_LIFT = { parseWt, parseReps, e1rm, parseRest, fmtKg };

  /* ---------------- REST TIMER ----------------
     One bar for the whole page, so ticking sets in quick succession just
     restarts it. The default length is remembered on this device; an
     exercise's own Rest (from the program) wins when it has one. */
  const REST_KEY = 'bnb-rest-default-v1';
  const REST_ON_KEY = 'bnb-rest-on-v1';
  let restDefault = 90, restOn = true;
  try {
    restDefault = parseInt(localStorage.getItem(REST_KEY), 10) || 90;
    restOn = localStorage.getItem(REST_ON_KEY) !== 'off';
  } catch(e){}

  let bar = null, endAt = 0, total = 0, tick = null, label = '';
  function ensureBar(){
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'rest-bar';
    bar.setAttribute('role', 'timer');
    bar.innerHTML = '<div class="rest-fill"></div>' +
      '<span class="rest-label"></span><b class="rest-time"></b>' +
      '<button type="button" data-rest="-15" aria-label="15 seconds less">−15</button>' +
      '<button type="button" data-rest="15" aria-label="15 seconds more">+15</button>' +
      '<button type="button" data-rest="skip">Skip</button>';
    document.body.appendChild(bar);
    bar.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => {
      const v = b.dataset.rest;
      if (v === 'skip'){ stop(); return; }
      endAt = Math.max(Date.now() + 1000, endAt + parseInt(v, 10) * 1000);
      total = Math.max(total, Math.ceil((endAt - Date.now()) / 1000));
      render();
    });
    return bar;
  }
  function render(){
    const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    bar.querySelector('.rest-time').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    bar.querySelector('.rest-label').textContent = left ? 'Rest' + (label ? ' · ' + label : '') : 'Go! Next set';
    bar.querySelector('.rest-fill').style.width = (total ? (1 - left / total) * 100 : 100) + '%';
    bar.classList.toggle('done', !left);
    if (!left){
      clearInterval(tick); tick = null;
      beep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => { if (!tick) stop(); }, 6000);
    }
  }
  function start(seconds, what){
    if (!restOn) return;
    total = seconds || restDefault;
    endAt = Date.now() + total * 1000;
    label = what || '';
    ensureBar().classList.add('show');
    document.body.classList.add('rest-showing');
    clearInterval(tick);
    tick = setInterval(render, 250);
    render();
  }
  function stop(){
    clearInterval(tick); tick = null;
    if (bar) bar.classList.remove('show', 'done');
    document.body.classList.remove('rest-showing');
  }
  let audio = null;
  function beep(){
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25].forEach(at => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, audio.currentTime + at);
        g.gain.exponentialRampToValueAtTime(0.3, audio.currentTime + at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + 0.18);
        o.connect(g); g.connect(audio.destination);
        o.start(audio.currentTime + at); o.stop(audio.currentTime + at + 0.2);
      });
    } catch(e){ /* no audio */ }
  }
  function settingsHtml(){
    return '<label class="rest-setting"><input type="checkbox" data-rest-on' + (restOn ? ' checked' : '') + '> Rest timer after each ticked set</label>' +
      '<label class="rest-setting">Default rest <select data-rest-default>' +
      [45, 60, 75, 90, 120, 150, 180, 240, 300].map(s => '<option value="' + s + '"' + (s === restDefault ? ' selected' : '') + '>' +
        (s < 60 ? s + ' sec' : (s / 60) + ' min') + '</option>').join('') + '</select></label>';
  }
  // Wires a settingsHtml() block (used in each logger's toolbar).
  function wireSettings(root){
    const on = root.querySelector('[data-rest-on]'), def = root.querySelector('[data-rest-default]');
    if (on) on.onchange = () => { restOn = on.checked; try { localStorage.setItem(REST_ON_KEY, restOn ? 'on' : 'off'); } catch(e){} if (!restOn) stop(); };
    if (def) def.onchange = () => { restDefault = parseInt(def.value, 10) || 90; try { localStorage.setItem(REST_KEY, restDefault); } catch(e){} };
  }

  window.BNB_REST = { start, stop, settingsHtml, wireSettings };

  /* ---------------- PLATE CALCULATOR ----------------
     Greedy from the heaviest plate down, limited to the pairs the gym
     actually has (all on by default; untick what's missing). Whatever
     can't be made exactly is shown as left over. */
  const PLATES = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] };
  const BARS = { kg: [20, 15, 10, 0], lb: [45, 35, 25, 0] };
  const PLATE_KEY = 'bnb-plates-v1';
  function loadPlatePrefs(){
    try { return JSON.parse(localStorage.getItem(PLATE_KEY)) || {}; } catch(e){ return {}; }
  }
  function savePlatePrefs(p){ try { localStorage.setItem(PLATE_KEY, JSON.stringify(p)); } catch(e){} }

  function platesFor(target, bar, have){
    let side = (target - bar) / 2;
    if (side < 0) return null;
    const out = [];
    have.slice().sort((a, b) => b - a).forEach(p => {
      while (side >= p - 1e-9){ out.push(p); side -= p; }
    });
    return { plates: out, left: Math.round(side * 2 * 100) / 100 };
  }

  function openPlates(startWeight){
    const prefs = loadPlatePrefs();
    let unit = prefs.unit === 'lb' ? 'lb' : 'kg';
    const m = modal('Plate Calculator', '<div class="plates-form"></div><div class="plates-out" aria-live="polite"></div>');
    const form = m.body.querySelector('.plates-form'), out = m.body.querySelector('.plates-out');
    function draw(){
      const have = (prefs['have_' + unit] || PLATES[unit]);
      const bar = prefs['bar_' + unit] != null ? prefs['bar_' + unit] : BARS[unit][0];
      form.innerHTML =
        '<div class="t-row2">' +
          '<div class="t-field"><label>Target weight (' + unit + ')</label><input type="number" inputmode="decimal" step="0.5" min="0" data-p-target value="' + esc(startWeight || prefs['last_' + unit] || '') + '"></div>' +
          '<div class="t-field"><label>Bar</label><select data-p-bar>' + BARS[unit].map(b => '<option value="' + b + '"' + (b === bar ? ' selected' : '') + '>' + (b ? b + ' ' + unit : 'No bar') + '</option>').join('') + '</select></div>' +
        '</div>' +
        '<div class="plates-units"><button type="button" class="cs-mode-btn' + (unit === 'kg' ? ' active' : '') + '" data-p-unit="kg">kg</button><button type="button" class="cs-mode-btn' + (unit === 'lb' ? ' active' : '') + '" data-p-unit="lb">lb</button></div>' +
        '<div class="t-field"><label>Plates you have</label><div class="plates-have">' +
          PLATES[unit].map(p => '<label><input type="checkbox" value="' + p + '"' + (have.indexOf(p) !== -1 ? ' checked' : '') + '> ' + p + '</label>').join('') + '</div></div>';
      const target = form.querySelector('[data-p-target]');
      target.oninput = calc;
      form.querySelector('[data-p-bar]').onchange = e => { prefs['bar_' + unit] = parseFloat(e.target.value); savePlatePrefs(prefs); calc(); };
      form.querySelectorAll('[data-p-unit]').forEach(b => b.onclick = () => { unit = b.dataset.pUnit; prefs.unit = unit; savePlatePrefs(prefs); startWeight = ''; draw(); });
      form.querySelectorAll('.plates-have input').forEach(c => c.onchange = () => {
        prefs['have_' + unit] = [...form.querySelectorAll('.plates-have input:checked')].map(x => parseFloat(x.value));
        savePlatePrefs(prefs); calc();
      });
      calc();
      setTimeout(() => target.focus(), 30);
    }
    function calc(){
      const target = parseFloat(form.querySelector('[data-p-target]').value);
      const bar = parseFloat(form.querySelector('[data-p-bar]').value) || 0;
      const have = [...form.querySelectorAll('.plates-have input:checked')].map(x => parseFloat(x.value));
      if (!target){ out.innerHTML = '<div class="field-hint">Type the weight you want on the bar.</div>'; return; }
      prefs['last_' + unit] = target; savePlatePrefs(prefs);
      const r = platesFor(target, bar, have);
      if (!r){ out.innerHTML = '<div class="field-hint">That\'s lighter than the bar (' + bar + ' ' + unit + ').</div>'; return; }
      const counts = [];
      r.plates.forEach(p => { const c = counts.find(x => x.p === p); if (c) c.n++; else counts.push({ p, n: 1 }); });
      const max = PLATES[unit][0];
      out.innerHTML =
        '<div class="plates-bar" aria-hidden="true"><span class="plates-sleeve"></span>' +
          r.plates.map(p => '<span class="plate" style="height:' + (34 + 66 * p / max).toFixed(0) + 'px">' + p + '</span>').join('') +
        '<span class="plates-collar"></span></div>' +
        '<div class="plates-each"><b>Each side:</b> ' + (counts.length ? counts.map(c => c.n + ' × ' + c.p).join(' + ') : 'nothing, just the bar') + '</div>' +
        (r.left ? '<div class="field-hint">' + r.left + ' ' + unit + ' can\'t be made with these plates; the bar comes to ' + (target - r.left) + ' ' + unit + '.</div>' : '');
    }
    draw();
  }

  window.BNB_PLATES = { open: openPlates, platesFor };

  // The loggers' tool row: rest timer switch and length, plate calculator.
  document.querySelectorAll('[data-ls-tools]').forEach(el => {
    el.innerHTML = settingsHtml() + '<button type="button" class="btn2 small" data-open-plates>Plate calculator</button>';
    wireSettings(el);
  });

  // Any element with data-open-plates opens the calculator (the loggers'
  // toolbars and the Tools tab card).
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-open-plates]');
    if (b){ e.preventDefault(); openPlates(); }
  });
})();
