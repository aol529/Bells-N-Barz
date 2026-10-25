/* =========================================================================
   BELL(E)S N' BARZ — LEADERBOARD, CHALLENGES & PROGRESS PHOTOS
   Lazy-loaded (see bnbLoadModule) for Member > Leaderboard and Me > Photos.
   - Leaderboard (sql/84): this month's or last month's most check-ins,
     logged sessions or points, from leaderboard() — first name + initial
     only. Members can take themselves off it. Challenges are set up by
     staff here too, each with a board over its own dates.
   - Photos (sql/85): front / side / back progress photos, private to the
     member (signed URLs), shrunk on the phone before upload, with a side
     by side compare.
   ========================================================================= */
(function(){
  const UI = window.BNB_UI;
  const esc = UI.esc;
  const U = () => window.BNB_USERS;
  const isMissing = err => err && (err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST202' || /does not exist|not find the function/i.test(err.message || ''));
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  const today = () => iso(new Date());
  function fmtDate(s){ const d = new Date(s + 'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  function me(){ return U() && U().getSelf(); }
  function isStaff(){ const m = me(); return !!(m && m.roles && m.roles.some(r => ['admin', 'trainer', 'staff'].includes(r))); }
  const METRICS = { checkins: { label: 'Check-ins', unit: 'check-ins', one: 'check-in' }, sessions: { label: 'Sessions logged', unit: 'sessions', one: 'session' }, points: { label: 'Points earned', unit: 'points', one: 'point' } };
  const unitFor = (metric, n) => n === 1 ? METRICS[metric].one : METRICS[metric].unit;

  /* ================= LEADERBOARD ================= */
  let lbMetric = 'checkins', lbMonth = 0; // 0 = this month, -1 = last month
  async function renderLeaderboard(){
    const body = document.getElementById('leaderboard-body');
    if (!body) return;
    const m = me();
    if (!m){ body.innerHTML = '<div class="empty-msg">Sign in to see the leaderboard.</div>'; return; }
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + lbMonth, 1);
    const last = new Date(now.getFullYear(), now.getMonth() + lbMonth + 1, 0);
    const monthName = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    body.innerHTML = '<div class="lb-controls">' +
        '<div class="cs-mode-row">' + Object.keys(METRICS).map(k => '<button type="button" class="cs-mode-btn' + (k === lbMetric ? ' active' : '') + '" data-lb-metric="' + k + '">' + METRICS[k].label + '</button>').join('') + '</div>' +
        '<div class="cs-mode-row"><button type="button" class="cs-mode-btn' + (lbMonth === 0 ? ' active' : '') + '" data-lb-month="0">This month</button><button type="button" class="cs-mode-btn' + (lbMonth === -1 ? ' active' : '') + '" data-lb-month="-1">Last month</button></div>' +
      '</div>' +
      '<h3 class="lb-title">' + esc(METRICS[lbMetric].label) + ' · ' + esc(monthName) + '</h3>' +
      '<div class="lb-board">Loading…</div>' +
      '<label class="lb-optout"><input type="checkbox" data-lb-show> Show me on the leaderboard <span class="field-hint">(first name and initial only)</span></label>' +
      '<div class="lb-challenges"></div>';
    body.querySelectorAll('[data-lb-metric]').forEach(b => b.onclick = () => { lbMetric = b.dataset.lbMetric; renderLeaderboard(); });
    body.querySelectorAll('[data-lb-month]').forEach(b => b.onclick = () => { lbMonth = parseInt(b.dataset.lbMonth, 10); renderLeaderboard(); });

    const { data, error } = await bnbClient.rpc('leaderboard', { p_from: iso(first), p_to: iso(last), p_metric: lbMetric, p_limit: 20 });
    const board = body.querySelector('.lb-board');
    if (error){
      board.innerHTML = isMissing(error) ? '<div class="empty-msg">The leaderboard isn\'t set up yet — staff need to run <code>sql/84-leaderboard-challenges.sql</code>.</div>'
        : '<div class="empty-msg">Could not load the leaderboard: ' + esc(error.message) + '</div>';
      return;
    }
    board.innerHTML = boardHtml(data || [], lbMetric, 'Nobody on the board yet this month — check in and be the first.');

    // Opt-out preference.
    const box = body.querySelector('[data-lb-show]');
    const { data: pref } = await bnbClient.from('member_prefs').select('hide_from_leaderboard').eq('member_id', m.id).maybeSingle();
    box.checked = !(pref && pref.hide_from_leaderboard);
    if (isStaff()) body.querySelector('.lb-optout').style.display = 'none';
    box.onchange = async () => {
      const { error: e } = await bnbClient.from('member_prefs').upsert([{ member_id: m.id, hide_from_leaderboard: !box.checked, updated_at: new Date().toISOString() }]);
      if (e){ UI.toast('Could not save: ' + e.message); box.checked = !box.checked; return; }
      UI.toast(box.checked ? 'You\'re on the leaderboard.' : 'You\'re off the leaderboard — only you see your own row.');
      renderLeaderboard();
    };
    renderChallenges(body.querySelector('.lb-challenges'));
  }

  function boardHtml(rows, metric, emptyMsg, target){
    if (!rows.length) return '<div class="empty-msg">' + esc(emptyMsg) + '</div>';
    let lastPlace = 0;
    return '<ol class="lb-list">' + rows.map(r => {
      const gap = r.place > lastPlace + 1 && lastPlace && r.is_me ? '<li class="lb-gap">…</li>' : '';
      lastPlace = r.place;
      const medal = r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : r.place;
      return gap + '<li class="lb-row' + (r.is_me ? ' me' : '') + '"><span class="lb-place">' + medal + '</span><span class="lb-name">' + esc(r.display_name) + (r.is_me ? ' (you)' : '') + '</span>' +
        (target ? '<span class="lb-bar"><i style="width:' + Math.min(100, Math.round(r.total / target * 100)) + '%"></i></span>' : '') +
        '<span class="lb-total">' + r.total + (target ? '/' + target : '') + ' <small>' + unitFor(metric, r.total) + '</small></span></li>';
    }).join('') + '</ol>';
  }

  async function renderChallenges(box){
    if (!box) return;
    const t = today();
    const { data, error } = await bnbClient.from('challenges').select('*').gte('ends_on', t).order('starts_on');
    if (error){ box.innerHTML = ''; return; }
    let html = '<div class="lb-ch-head"><h3 class="lb-title">Challenges</h3>' + (isStaff() ? '<button type="button" class="btn2 small" data-ch-new>+ New challenge</button>' : '') + '</div>';
    if (!data.length) html += '<div class="field-hint">No challenges running right now' + (isStaff() ? ' — start one with + New challenge.' : '.') + '</div>';
    html += data.map(c => '<div class="lb-challenge" data-ch="' + c.id + '">' +
      '<div class="lb-ch-title">' + esc(c.title) + (c.starts_on > t ? ' <span class="status-pill pending">starts ' + fmtDate(c.starts_on) + '</span>' : '') + '</div>' +
      '<div class="field-hint">' + fmtDate(c.starts_on) + ' – ' + fmtDate(c.ends_on) + ' · ' + METRICS[c.metric].label + (c.target ? ' · goal ' + c.target : '') + '</div>' +
      (c.description ? '<p class="lb-ch-desc">' + esc(c.description) + '</p>' : '') +
      '<div class="lb-ch-board">' + (c.starts_on > t ? '' : 'Loading…') + '</div>' +
      (isStaff() ? '<button type="button" class="btn2 small danger" data-ch-del="' + c.id + '">Delete</button>' : '') +
    '</div>').join('');
    box.innerHTML = html;
    data.filter(c => c.starts_on <= t).forEach(async c => {
      const { data: rows, error: e } = await bnbClient.rpc('leaderboard', { p_from: c.starts_on, p_to: c.ends_on < t ? c.ends_on : t, p_metric: c.metric, p_limit: 10 });
      const el = box.querySelector('[data-ch="' + c.id + '"] .lb-ch-board');
      if (el) el.innerHTML = e ? '' : boardHtml(rows || [], c.metric, 'No one has started yet.', c.target);
    });
    const nb = box.querySelector('[data-ch-new]');
    if (nb) nb.onclick = newChallenge;
    box.querySelectorAll('[data-ch-del]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this challenge? Check-ins and points aren\'t affected.')) return;
      const { error: e } = await bnbClient.from('challenges').delete().eq('id', b.dataset.chDel);
      if (e){ UI.toast(e.message); return; }
      renderLeaderboard();
    });
  }

  function newChallenge(){
    const now = new Date(), t = today();
    const end = iso(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const m = UI.modal('New Challenge',
      '<div class="t-field"><label>Title</label><input type="text" data-c-title maxlength="80" placeholder="e.g. November Check-in Challenge"></div>' +
      '<div class="t-field"><label>What it is (optional)</label><input type="text" data-c-desc maxlength="300" placeholder="e.g. Most check-ins this month wins a free PT session"></div>' +
      '<div class="t-row2"><div class="t-field"><label>Counts</label><select data-c-metric>' + Object.keys(METRICS).map(k => '<option value="' + k + '">' + METRICS[k].label + '</option>').join('') + '</select></div>' +
      '<div class="t-field"><label>Goal (optional)</label><input type="number" min="1" data-c-target placeholder="e.g. 20"></div></div>' +
      '<div class="t-row2"><div class="t-field"><label>Starts</label><input type="date" data-c-from value="' + t + '"></div><div class="t-field"><label>Ends</label><input type="date" data-c-to value="' + end + '"></div></div>' +
      '<button type="button" class="btn2 primary" data-c-save>Start challenge</button> <span class="field-hint" data-c-msg></span>');
    m.body.querySelector('[data-c-save]').onclick = async () => {
      const g = s => m.body.querySelector(s).value.trim();
      const msg = m.body.querySelector('[data-c-msg]');
      if (!g('[data-c-title]')){ msg.textContent = 'Give it a title.'; return; }
      if (!g('[data-c-from]') || !g('[data-c-to]') || g('[data-c-to]') < g('[data-c-from]')){ msg.textContent = 'Check the dates.'; return; }
      const row = { title: g('[data-c-title]'), description: g('[data-c-desc]'), metric: g('[data-c-metric]'),
        target: g('[data-c-target]') ? parseInt(g('[data-c-target]'), 10) : null, starts_on: g('[data-c-from]'), ends_on: g('[data-c-to]'), created_by: me().id };
      const { error } = await bnbClient.from('challenges').insert([row]);
      if (error){ msg.textContent = error.message; return; }
      m.close();
      UI.toast('Challenge started.');
      renderLeaderboard();
    };
  }

  /* ================= PROGRESS PHOTOS ================= */
  const BUCKET = 'progress-photos';
  const POSES = { front: 'Front', side: 'Side', back: 'Back', other: 'Other' };
  let photos = [], urls = {};

  // Phone photos are big: shrink to 1600px on the long side, JPEG.
  function shrink(file){
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error('Could not read that picture.')), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn\'t a picture this browser can open.')); };
      img.src = url;
    });
  }

  async function loadPhotos(){
    const { data, error } = await bnbClient.from('progress_photos').select('*').order('taken_on', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    photos = data || [];
    const need = photos.map(p => p.path).filter(p => !urls[p]);
    if (need.length){
      const { data: signed } = await bnbClient.storage.from(BUCKET).createSignedUrls(need, 3600);
      (signed || []).forEach(s => { if (s.signedUrl) urls[s.path] = s.signedUrl; });
    }
  }

  async function renderPhotos(){
    const body = document.getElementById('photos-body');
    if (!body) return;
    const m = me();
    if (!m){ body.innerHTML = '<div class="empty-msg">Sign in to keep progress photos.</div>'; return; }
    body.innerHTML = '<div class="empty-msg">Loading…</div>';
    try { await loadPhotos(); }
    catch(e){
      body.innerHTML = isMissing(e) ? '<div class="empty-msg">Photos aren\'t set up yet — staff need to run <code>sql/85-progress-photos.sql</code>.</div>'
        : '<div class="empty-msg">Could not load your photos: ' + esc(e.message) + '</div>';
      return;
    }
    const dates = [...new Set(photos.map(p => p.taken_on))];
    body.innerHTML =
      '<div class="photo-add">' +
        '<div class="t-row2"><div class="t-field"><label>Date</label><input type="date" data-ph-date value="' + today() + '" max="' + today() + '"></div>' +
        '<div class="t-field"><label>Pose</label><select data-ph-pose>' + Object.keys(POSES).map(k => '<option value="' + k + '">' + POSES[k] + '</option>').join('') + '</select></div></div>' +
        '<label class="btn2 primary">Add photo <input type="file" accept="image/*" data-ph-file hidden></label> <span class="field-hint" data-ph-msg>Same spot, same light, same time of day makes the comparison fair.</span>' +
      '</div>' +
      (dates.length >= 2 ? '<div class="photo-compare-row"><button type="button" class="btn2" data-ph-compare>Compare two dates</button></div>' : '') +
      (dates.length ? dates.map(d => '<div class="photo-day"><h4>' + fmtDate(d) + '</h4><div class="photo-grid">' +
          photos.filter(p => p.taken_on === d).map(p => '<figure class="photo-tile"><img loading="lazy" src="' + esc(urls[p.path] || '') + '" alt="' + esc(POSES[p.pose]) + ' ' + esc(d) + '">' +
            '<figcaption>' + esc(POSES[p.pose]) + '<button type="button" class="photo-del" data-ph-del="' + p.id + '" aria-label="Delete photo">×</button></figcaption></figure>').join('') +
        '</div></div>').join('')
        : '<div class="empty-msg">No photos yet. Front, side and back once a month is plenty.</div>') +
      '<div class="field-hint" style="margin-top:14px;">Only you can see these: not your coach, not staff.</div>';

    const file = body.querySelector('[data-ph-file]'), msg = body.querySelector('[data-ph-msg]');
    file.onchange = async () => {
      const f = file.files[0];
      file.value = '';
      if (!f) return;
      msg.textContent = 'Uploading…';
      try {
        const blob = await shrink(f);
        const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
        const path = m.id + '/' + id + '.jpg';
        const up = await bnbClient.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        const { error } = await bnbClient.from('progress_photos').insert([{ member_id: m.id, path,
          taken_on: body.querySelector('[data-ph-date]').value || today(), pose: body.querySelector('[data-ph-pose]').value }]);
        if (error){ await bnbClient.storage.from(BUCKET).remove([path]); throw error; }
        UI.toast('Photo saved.');
        renderPhotos();
      } catch(e){ msg.textContent = 'Could not upload: ' + (e.message || e); }
    };
    body.querySelectorAll('[data-ph-del]').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this photo for good?')) return;
      const p = photos.find(x => x.id === b.dataset.phDel);
      const { error } = await bnbClient.from('progress_photos').delete().eq('id', p.id);
      if (error){ UI.toast(error.message); return; }
      await bnbClient.storage.from(BUCKET).remove([p.path]);
      renderPhotos();
    });
    const cmp = body.querySelector('[data-ph-compare]');
    if (cmp) cmp.onclick = () => openCompare(dates);
  }

  function openCompare(dates){
    const opts = sel => dates.map(d => '<option value="' + d + '"' + (d === sel ? ' selected' : '') + '>' + fmtDate(d) + '</option>').join('');
    const m = UI.modal('Compare', '<div class="t-row2"><div class="t-field"><label>Before</label><select data-cmp-a>' + opts(dates[dates.length - 1]) + '</select></div>' +
      '<div class="t-field"><label>After</label><select data-cmp-b>' + opts(dates[0]) + '</select></div>' +
      '<div class="t-field"><label>Pose</label><select data-cmp-pose>' + Object.keys(POSES).map(k => '<option value="' + k + '">' + POSES[k] + '</option>').join('') + '</select></div></div>' +
      '<div class="photo-compare"></div>', { wide: true });
    const draw = () => {
      const a = m.body.querySelector('[data-cmp-a]').value, b = m.body.querySelector('[data-cmp-b]').value, pose = m.body.querySelector('[data-cmp-pose]').value;
      const pick = d => photos.find(p => p.taken_on === d && p.pose === pose);
      m.body.querySelector('.photo-compare').innerHTML = [a, b].map(d => {
        const p = pick(d);
        return '<figure>' + (p ? '<img src="' + esc(urls[p.path] || '') + '" alt="">' : '<div class="photo-none">No ' + POSES[pose].toLowerCase() + ' photo on this date</div>') + '<figcaption>' + fmtDate(d) + '</figcaption></figure>';
      }).join('');
    };
    m.body.querySelectorAll('select').forEach(s => s.onchange = draw);
    draw();
  }

  window.bnbLeaderboardOnTabShown = renderLeaderboard;
  window.bnbPhotosOnShown = renderPhotos;
  // Opened before this file finished loading: draw now.
  const lb = document.getElementById('tab-leaderboard');
  if (lb && lb.classList.contains('active')) renderLeaderboard();
})();
