/* =========================================================================
   BELL(E)S N' BARZ — WORKOUT PLUS
   The member Live Session's gym-floor helpers, matching the Android app (3.1):
     - Last time + a suggested weight and reps for each exercise (double
       progression: reach the top of the rep range, then add weight), the
       plates per side for bar lifts, and a Fill sets button. Ticking an
       empty set logs the suggestion.
     - How-to guides from exercise_guides (sql/105): muscles, cues, the usual
       mistake and a video. Admins and coaches (trainer) edit them in place.
     - Finish workout: time, sets, kg moved, records, and a picture to share.
     - Rest over: a system notification when the tab is in the background,
       and the screen kept awake while logging.
   Loaded after lift-tools.js and before training-core.js, which calls in.
   ========================================================================= */
(function(){
  const UI = window.BNB_UI, L = window.BNB_LIFT;
  const esc = UI.esc;

  /* ---------------- SUGGESTIONS ---------------- */
  const RANGE = /(\d+)\s*[–-]\s*(\d+)/, TIMED = /sec|min|\bs\b/i;
  function step(w){ return w < 10 ? 1 : 2.5; }
  function suggest(last, reps){
    if (!last) return null;
    reps = String(reps || '');
    if (TIMED.test(reps)) return { wt: last.wt, reps: null, why: 'Same weight as last time' };
    const r = reps.match(RANGE), one = reps.match(/\d+/);
    const lo = r ? +r[1] : (one ? +one[0] : null), hi = r ? +r[2] : lo;
    if (lo == null) return { wt: last.wt, reps: last.reps, why: 'Match last time, then beat it' };
    if (last.reps >= hi) return { wt: last.wt + step(last.wt), reps: lo, why: 'You hit ' + hi + ' reps last time. Add weight.' };
    const next = Math.min(hi, Math.max(lo, last.reps + 1));
    return { wt: last.wt, reps: next, why: 'Same weight, go for ' + next + ' reps' };
  }
  const BARBELL = /barbell|bench press|squat|deadlift|overhead press|military press|bent.over row|hip thrust|\bRDL\b/i;
  const NOT_BAR = /dumbbell|\bDB\b|goblet|kettlebell|\bKB\b|machine|smith|cable|band|split squat|cossack|sumo squat|deep squat|landmine|bodyweight|jump/i;
  function onBar(name){ return BARBELL.test(name) && !NOT_BAR.test(name); }
  function platesLine(name, wt){
    if (!onBar(name) || !(wt > 20) || !window.BNB_PLATES) return '';
    const p = window.BNB_PLATES.platesFor(wt, 20, [25, 20, 15, 10, 5, 2.5, 1.25]);
    return p && p.plates.length && !p.left ? 'Each side: ' + p.plates.join(' + ') : '';
  }

  /* The best set of the latest earlier session of this lift. history is the
     member's sessions before today; key() is training-core's liftKey. */
  function lastSession(history, key, name){
    const k = key(name || '');
    if (!k) return null;
    const sorted = history.slice().sort((a, b) => b.dateIso < a.dateIso ? -1 : 1);
    for (const h of sorted){
      const ex = (h.exercises || []).find(e => key(e.name || '') === k);
      if (!ex) continue;
      let best = null, bestScore = -1;
      (ex.sets || []).forEach(s => {
        const wt = L.parseWt(s.wt), reps = L.parseReps(s.reps) || 1;
        if (wt == null || wt <= 0) return;
        const score = wt * (1 + reps / 30);
        if (score > bestScore){ bestScore = score; best = { wt, reps, date: h.dateIso }; }
      });
      if (best) return best;
    }
    return null;
  }

  function prettyDate(iso){
    try { return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }
    catch(e){ return iso; }
  }

  /* Adds "Last time" and "Try …" under an exercise; returns the suggestion
     (or null) so the set rows can show it and log it. */
  function extras(exDiv, name, reps, history, key, onFill){
    const last = lastSession(history, key, name);
    if (!last) return null;
    const s = suggest(last, reps);
    const box = document.createElement('div');
    box.className = 'wp-extras';
    const plates = platesLine(name, s.wt);
    box.innerHTML = '<div class="wp-last">Last time: ' + esc(L.fmtKg(last.wt)) + ' kg × ' + last.reps + ', ' + esc(prettyDate(last.date)) + '</div>' +
      '<div class="wp-try"><div><b>Try ' + esc(L.fmtKg(s.wt)) + ' kg' + (s.reps ? ' × ' + s.reps : '') + '</b>' +
      '<span>' + esc([s.why, plates].filter(Boolean).join(' · ')) + '</span></div>' +
      '<button type="button" class="btn2 wp-fill">Fill sets</button></div>';
    box.querySelector('.wp-fill').onclick = () => onFill(s);
    exDiv.appendChild(box);
    return s;
  }

  /* ---------------- HOW-TO GUIDES ---------------- */
  function guideKey(name){
    return String(name || '').split(' — ')[0].split(' - ')[0].split('(')[0]
      .trim().toLowerCase().replace(/\s+/g, ' ').replace(/s$/, '');
  }
  let guides = null, loading = null;
  const GUIDE_CACHE = 'bnb-exercise-guides-v1';
  try { const c = JSON.parse(localStorage.getItem(GUIDE_CACHE)); if (Array.isArray(c)) guides = index(c); } catch(e){}
  function index(rows){ const m = new Map(); rows.forEach(r => m.set(guideKey(r.name), r)); return m; }
  // Loads once per page, then redraws the logger so the buttons appear.
  function loadGuides(redraw){
    if (loading || typeof bnbClient === 'undefined') return loading;
    loading = bnbClient.from('exercise_guides').select('id,name,muscles,cues,mistakes,video_url,images').order('name').then(({ data, error }) => {
      if (error){ console.warn('Exercise guides not loaded:', error.message); return; }
      guides = index(data || []);
      try { localStorage.setItem(GUIDE_CACHE, JSON.stringify(data || [])); } catch(e){}
      if (redraw) redraw();
    });
    return loading;
  }
  function canEdit(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    return !!(me && me.roles && (me.roles.includes('admin') || me.roles.includes('trainer')));
  }
  function ytSearch(name){
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(String(name).split('(')[0].trim() + ' exercise tutorial');
  }

  // A small "How to" button in the exercise's header.
  function howToButton(exHead, name, redraw){
    if (!String(name || '').trim()) return;
    const g = guides && guides.get(guideKey(name));
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wp-howto';
    b.textContent = g ? 'How to' : (canEdit() ? '+ Guide' : 'How to');
    // The guide's first photo as a thumbnail, so the move is recognisable at a glance.
    const pic = g && (g.images || [])[0];
    if (pic){ const i = document.createElement('img'); i.src = pic; i.alt = ''; i.loading = 'lazy'; b.classList.add('wp-howto-pic'); b.prepend(i); }
    b.onclick = () => openGuide(name, redraw);
    exHead.appendChild(b);
  }

  function openGuide(name, redraw){
    const g = guides && guides.get(guideKey(name));
    if (!g && canEdit()) return editGuide(name, null, redraw);
    let html;
    if (!g){
      html = '<p class="wp-muted">No guide for this one yet. Ask your coach on the floor to show you.</p>' +
        '<p><a class="btn2" target="_blank" rel="noopener" href="' + esc(ytSearch(name)) + '">Search YouTube</a></p>';
    } else {
      const cues = String(g.cues || '').split('\n').map(c => c.trim()).filter(Boolean);
      const pics = (g.images || []).filter(Boolean);
      html = (pics.length ? '<div class="wp-pics">' + pics.map(u => '<img loading="lazy" alt="" src="' + esc(u) + '">').join('') + '</div>' : '') +
        (g.muscles ? '<div class="wp-lbl">Works</div><p><b>' + esc(g.muscles) + '</b></p>' : '') +
        (cues.length ? '<div class="wp-lbl">How to</div><ol class="wp-cues">' + cues.map(c => '<li>' + esc(c) + '</li>').join('') + '</ol>' : '') +
        (g.mistakes ? '<div class="wp-lbl">Watch out for</div><p class="wp-muted">' + esc(g.mistakes) + '</p>' : '') +
        '<p class="wp-actions">' + (g.video_url ? '<a class="btn2 primary" target="_blank" rel="noopener" href="' + esc(g.video_url) + '">Watch the video</a> ' :
          '<a class="btn2" target="_blank" rel="noopener" href="' + esc(ytSearch(g.name)) + '">Search YouTube</a> ') +
        (canEdit() ? '<button type="button" class="btn2" data-wp-edit>Edit guide</button>' : '') + '</p>';
    }
    const m = UI.modal(g ? g.name : name, html);
    const edit = m.body.querySelector('[data-wp-edit]');
    if (edit) edit.onclick = () => { m.close(); editGuide(name, g, redraw); };
  }

  const MAX_PICS = 4, PIC_BUCKET = 'exercise-images';
  // A phone photo, upright and at most 1600 px, as JPEG.
  function shrinkPhoto(file){
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error('Could not read that picture.')), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn\'t a picture.')); };
      img.src = url;
    });
  }

  function editGuide(name, g, redraw){
    const clean = String(name).split(' — ')[0].split('(')[0].trim();
    const m = UI.modal(g ? 'Edit guide' : 'New guide',
      '<div class="wp-form">' +
      '<label>Exercise name<input type="text" data-f="name" maxlength="120"></label>' +
      '<label>Muscles worked<input type="text" data-f="muscles" maxlength="300"></label>' +
      '<label>Cues, one per line<textarea data-f="cues" rows="5" maxlength="2000"></textarea></label>' +
      '<label>Common mistake<textarea data-f="mistakes" rows="2" maxlength="1000"></textarea></label>' +
      '<label>Video link (https://…)<input type="url" data-f="video_url"></label>' +
      '<div class="wp-lbl">Photos (up to ' + MAX_PICS + ')</div><div class="wp-pics wp-pics-edit" data-pics></div>' +
      '<label class="btn2 wp-addpic">Add a photo<input type="file" accept="image/*" data-addpic hidden></label>' +
      '<p class="wp-err" hidden></p>' +
      '<p class="wp-actions"><button type="button" class="btn2 primary" data-wp-save>Save guide</button> ' +
      (g ? '<button type="button" class="btn2 danger" data-wp-del>Delete</button>' : '') + '</p></div>');
    const f = k => m.body.querySelector('[data-f="' + k + '"]');
    f('name').value = g ? g.name : clean;
    ['muscles', 'cues', 'mistakes', 'video_url'].forEach(k => f(k).value = (g && g[k]) || '');
    const err = m.body.querySelector('.wp-err');
    function fail(msg){ err.textContent = msg; err.hidden = false; }
    // Photos: the guide's own, plus any the coach adds here (uploaded straight away, saved with the guide).
    let pics = ((g && g.images) || []).slice();
    const picsEl = m.body.querySelector('[data-pics]'), addEl = m.body.querySelector('[data-addpic]');
    function drawPics(){
      picsEl.innerHTML = pics.map((u, i) => '<span><img alt="" src="' + esc(u) + '"><button type="button" data-rm="' + i + '" aria-label="Remove photo">×</button></span>').join('') ||
        '<p class="wp-muted">No photos yet.</p>';
      picsEl.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { pics.splice(+b.dataset.rm, 1); drawPics(); });
      addEl.parentElement.style.display = pics.length >= MAX_PICS ? 'none' : '';
    }
    drawPics();
    addEl.onchange = async () => {
      const file = addEl.files && addEl.files[0]; addEl.value = '';
      if (!file) return;
      err.hidden = true; addEl.parentElement.firstChild.textContent = 'Uploading…';
      try {
        const blob = await shrinkPhoto(file);
        const path = 'guide/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
        const { error } = await bnbClient.storage.from(PIC_BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
        if (error) throw error;
        pics.push(bnbClient.storage.from(PIC_BUCKET).getPublicUrl(path).data.publicUrl);
        drawPics();
      } catch(e){ fail('Couldn\'t upload: ' + (e.message || e)); }
      addEl.parentElement.firstChild.textContent = 'Add a photo';
    };
    async function done(){ loading = null; await loadGuides(); if (redraw) redraw(); m.close(); }
    m.body.querySelector('[data-wp-save]').onclick = async () => {
      const row = { name: f('name').value.trim(), muscles: f('muscles').value.trim(), cues: f('cues').value.trim(),
        mistakes: f('mistakes').value.trim(), video_url: f('video_url').value.trim() || null, images: pics };
      if (!row.name) return fail('Give the exercise a name.');
      if (row.video_url && !/^https:\/\//i.test(row.video_url)) return fail('The video link must start with https://');
      const q = g ? bnbClient.from('exercise_guides').update(row).eq('id', g.id) : bnbClient.from('exercise_guides').insert([row]);
      const { error } = await q;
      if (error) return fail(/duplicate/i.test(error.message) ? 'There is already a guide with that name.' : 'Couldn\'t save: ' + error.message);
      await done();
    };
    const del = m.body.querySelector('[data-wp-del]');
    if (del) del.onclick = async () => {
      if (del.dataset.sure !== '1'){ del.dataset.sure = '1'; del.textContent = 'Tap again to delete'; return; }
      const { error } = await bnbClient.from('exercise_guides').delete().eq('id', g.id);
      if (error) return fail('Couldn\'t delete: ' + error.message);
      await done();
    };
  }

  /* ---------------- SESSION TIME + SCREEN AWAKE ---------------- */
  function today(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function markStart(day){
    try {
      const k = 'bnb-mls-start-' + day, v = localStorage.getItem(k);
      if (!v || v.split('|')[0] !== today()) localStorage.setItem(k, today() + '|' + Date.now());
    } catch(e){}
    wake();
  }
  function startedAt(day){
    try { const v = (localStorage.getItem('bnb-mls-start-' + day) || '').split('|'); return v[0] === today() ? +v[1] : null; } catch(e){ return null; }
  }
  let lock = null, wanted = false;
  async function wake(){
    wanted = true;
    if (lock || !('wakeLock' in navigator) || document.hidden) return;
    try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch(e){}
  }
  function sleep(){ wanted = false; if (lock) lock.release().catch(() => {}); lock = null; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && wanted) wake(); });

  /* Rest over while the member is in another tab or app: a system
     notification, if they allowed alerts (Profile > Alerts). Phones may
     pause a background page, so this is best effort; the Android app's
     alarm is the reliable one. */
  async function restDone(label){
    if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body: 'Next set' + (label ? ': ' + label : '') + '. Get under the bar.', tag: 'bnb-rest', renotify: true, icon: 'icon-192.png', vibrate: [200, 100, 200] };
    try {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification){ await reg.showNotification('Rest over', opts); return; }
    } catch(e){}
    try { new Notification('Rest over', opts); } catch(e){}
  }

  /* ---------------- FINISH ---------------- */
  function kg(n){ return n >= 1000 ? Math.round(n).toLocaleString('en').replace(/,/g, ' ') : L.fmtKg(n); }

  /* exercises: the day's snapshot ({name, sets:[{done,wt,reps}]}); bests:
     training-core's bestsFrom() before today, keyed by key(). */
  function summarize(exercises, bests, key, started){
    let sets = 0, reps = 0, load = 0, count = 0;
    const tops = [];
    exercises.forEach(ex => {
      let any = false, best = null, bestScore = -1;
      (ex.sets || []).forEach(s => {
        if (!s.done) return;
        any = true; sets++;
        const r = L.parseReps(s.reps) || 0, w = L.parseWt(s.wt) || 0;
        reps += r; load += w * r;
        if (w > 0){ const sc = w * (1 + Math.max(r, 1) / 30); if (sc > bestScore){ bestScore = sc; best = { wt: w, reps: Math.max(r, 1) }; } }
      });
      if (any) count++;
      if (!best) return;
      const prev = bests[key(ex.name || '')];
      const e = L.e1rm(best.wt, best.reps);
      const record = !!prev && (best.wt > prev.wt || (e != null && e > prev.e1 + 0.01));
      tops.push({ name: ex.name, wt: best.wt, reps: best.reps, record, score: bestScore });
    });
    const mins = started ? Math.floor((Date.now() - started) / 60000) : null;
    return { exercises: count, sets, reps, kg: load, minutes: mins >= 1 && mins <= 240 ? mins : null,
      records: tops.filter(t => t.record), tops: tops.sort((a, b) => b.score - a.score) };
  }

  function stats(s){
    return [s.minutes != null ? [Math.floor(s.minutes / 60) + ':' + String(s.minutes % 60).padStart(2, '0'), 'Time'] : null,
      [String(s.exercises), 'Exercises'], [String(s.sets), 'Sets'], [kg(s.kg) + ' kg', 'Moved']].filter(Boolean);
  }

  function finish(s, title, note){
    if (window.BNB_REST) window.BNB_REST.stop();
    sleep();
    if (!s.sets){
      UI.modal('Nothing ticked yet', '<p>Tick each set as you finish it. Then this shows your time, sets, kilos moved and any records.</p>');
      return;
    }
    const line = t => esc(t.name) + ': ' + esc(L.fmtKg(t.wt)) + ' kg × ' + t.reps;
    const others = s.tops.filter(t => !t.record).slice(0, 3);
    const m = UI.modal(s.records.length ? 'Session done. New records.' : 'Session done.',
      '<p class="wp-muted">' + esc(title) + '</p>' +
      '<div class="wp-stats">' + stats(s).map(([v, l]) => '<div><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>').join('') + '</div>' +
      (s.records.length ? '<div class="wp-lbl">Records</div><p>' + s.records.map(line).join('<br>') + '</p>' : '') +
      (others.length ? '<div class="wp-lbl">Top sets</div><p class="wp-muted">' + others.map(line).join('<br>') + '</p>' : '') +
      '<p class="wp-muted">' + esc(note || 'Saved to your history. Eat, sleep, come back stronger.') + '</p>' +
      '<p class="wp-actions"><button type="button" class="btn2 primary" data-wp-share>Share</button></p>');
    m.body.querySelector('[data-wp-share]').onclick = () => share(s, title);
  }

  /* Draws the session as a 1080 × 1350 picture, then the phone's share
     sheet where there is one, otherwise a download. */
  async function share(s, title){
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1350;
    const x = c.getContext('2d');
    const gold = '#E8B923', text = '#F2EFE6', muted = '#9A968C';
    try { await document.fonts.ready; } catch(e){}
    const head = '"Oswald", "Arial Narrow", sans-serif', body = '"IBM Plex Sans", Arial, sans-serif';
    function t(str, px, y, size, color, font, weight){ x.font = (weight || 600) + ' ' + size + 'px ' + font; x.fillStyle = color; x.fillText(str, px, y); }
    x.fillStyle = '#111111'; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = gold; x.fillRect(0, 0, 1080, 14);
    await new Promise(res => {
      const img = new Image();
      img.onload = () => { x.drawImage(img, 80, 90, 120, 120); res(); };
      img.onerror = res;
      img.src = 'icon-192.png';
    });
    t('BELLS N BARZ', 230, 170, 64, text, head);
    t(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), 80, 300, 34, muted, body, 500);
    t(String(title).toUpperCase().slice(0, 28), 80, 380, 72, gold, head);
    stats(s).forEach(([v, l], i) => {
      const px = 80 + (i % 2) * 480, y = 540 + Math.floor(i / 2) * 200;
      t(v, px, y, 96, text, head);
      t(l.toUpperCase(), px, y + 50, 30, muted, body, 500);
    });
    let y = 980;
    const lines = s.records.map(r => ['★ ' + r.name + '  ' + L.fmtKg(r.wt) + ' kg × ' + r.reps, gold])
      .concat(s.tops.filter(r => !r.record).map(r => [r.name + '  ' + L.fmtKg(r.wt) + ' kg × ' + r.reps, text]));
    if (lines.length){ t(s.records.length ? 'NEW RECORDS' : 'TOP SETS', 80, y, 30, muted, body, 500); y += 70; }
    lines.slice(0, 4).forEach(([str, col]) => { t(str.slice(0, 42), 80, y, 44, col, body, 500); y += 66; });

    const caption = 'Session done at Bells n Barz: ' + s.sets + ' sets, ' + kg(s.kg) + ' kg moved' +
      (s.records.length ? ', ' + s.records.length + ' new record' + (s.records.length > 1 ? 's' : '') : '') + '.';
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    if (!blob) return UI.toast('Couldn\'t make the picture on this browser.');
    const file = new File([blob], 'bells-n-barz-session.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })){
      try { await navigator.share({ files: [file], text: caption }); return; } catch(e){ if (e && e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    UI.toast('Picture saved. Share it from your downloads.');
  }

  window.BNB_PLUS = { suggest, onBar, extras, guideKey, loadGuides, howToButton, markStart, startedAt, restDone, summarize, finish };
})();
