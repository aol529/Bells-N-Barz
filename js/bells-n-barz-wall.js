/* =========================================================================
   BELL(E)S N' BARZ — THE WALL + PHOTO OF THE WEEK (sql/114-photo-wall.sql)
   Lazy-loaded once someone signs in (shell), and for Member > Wall.
   - Wall: members post a photo and caption; it shows straight away. One
     thumbs up each (tap again to take it back). Newest, or this week's
     top. Report a post; three reports hide it. Admins and coaches hide or
     show any post; the poster and admins delete.
   - Photo of the Week: pops up the first time it's seen after a new one
     goes up, then on the first visit after 8:00 and after 13:00 each day.
     An admin's upload this week wins; otherwise last week's most-liked
     Wall post takes over on Sunday (worked out in photo_of_the_week()).
     The app does the same with the same rules.
   Switchboard: "photo-wall" (the Wall) and "photo-of-the-week" (the popup
   and the strip on Member's card screen).
   ========================================================================= */
(function(){
  const UI = window.BNB_UI;
  const esc = UI.esc;
  const BUCKET = 'wall-photos';
  const SEEN_KEY = 'bnb-potw-seen-v1';
  const PAGE = 30;
  const isMissing = err => err && (err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST202' || /does not exist|not find the function/i.test(err.message || ''));
  const feature = k => !window.BNB_FEATURES || window.BNB_FEATURES.on(k);
  function me(){ return window.BNB_USERS && window.BNB_USERS.getSelf(); }
  function hasRole(...r){ const m = me(); return !!(m && m.roles && m.roles.some(x => r.includes(x))); }
  const isAdmin = () => hasRole('admin');
  const isMod = () => hasRole('admin', 'trainer');
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function ago(ts){
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 7 * 86400) return Math.floor(s / 86400) + ' d ago';
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  // ---- photos ----
  const urls = {};   // path -> { url, exp }
  async function sign(paths){
    const need = [...new Set(paths)].filter(p => p && !(urls[p] && urls[p].exp > Date.now() + 3600e3));
    if (!need.length) return;
    const { data } = await bnbClient.storage.from(BUCKET).createSignedUrls(need, 86400);
    (data || []).forEach(s => { if (s.signedUrl) urls[s.path] = { url: s.signedUrl, exp: Date.now() + 86400e3 }; });
  }
  const urlOf = p => (urls[p] && urls[p].url) || '';
  function shrink(file, max){
    return new Promise((resolve, reject) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(b => b ? resolve(b) : reject(new Error('Could not read that picture.')), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(u); reject(new Error('That file isn\'t a picture.')); };
      img.src = u;
    });
  }
  async function uploadPhoto(file){
    const blob = await shrink(file, 1600);
    const path = me().id + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    const { error } = await bnbClient.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return path;
  }
  const dropFile = path => path && bnbClient.storage.from(BUCKET).remove([path]).catch(() => {});

  /* ================= PHOTO OF THE WEEK ================= */
  let potw = null, potwAt = 0, potwMissing = false;
  async function loadPotw(force){
    if (!me() || typeof bnbClient === 'undefined') return null;
    if (!force && Date.now() - potwAt < 10 * 60e3) return potw;
    const { data, error } = await bnbClient.rpc('photo_of_the_week');
    if (error){ potwAt = Date.now(); potwMissing = isMissing(error); if (!potwMissing) console.warn('Photo of the Week not loaded:', error.message); return potw; }
    potwAt = Date.now(); potwMissing = false;
    potw = (data && data[0]) || null;
    if (potw) await sign([potw.path]);
    renderStrip();
    return potw;
  }

  function readSeen(){ try { const s = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); return s && s.uid === me().id ? s : { uid: me().id, id: null, slots: [] }; } catch(e){ return { uid: me().id, id: null, slots: [] }; } }
  function writeSeen(s){ try { localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch(e){} }
  // '2026-11-09-am' from 8:00, '-pm' from 13:00, nothing before 8.
  function slotNow(){ const d = new Date(), h = d.getHours(); return h >= 13 ? iso(d) + '-pm' : h >= 8 ? iso(d) + '-am' : null; }
  function due(p){
    const s = readSeen();
    if (p.mine){ if (s.id !== p.id){ s.id = p.id; writeSeen(s); } return false; }   // your own upload or win
    if (s.id !== p.id) return true;
    const slot = slotNow();
    return !!slot && !s.slots.includes(slot);
  }
  function markShown(p){
    const s = readSeen(), slot = slotNow();
    s.id = p.id;
    if (slot && !s.slots.includes(slot)) s.slots.push(slot);
    s.slots = s.slots.slice(-6);
    writeSeen(s);
  }

  let popupOpen = false;
  function headline(p){ return p.kind === 'winner' ? 'Last week\'s top photo · ' + p.author : 'Photo of the Week · ' + p.author; }
  function likeLabel(p){ return '👍 ' + p.likes; }
  function openPopup(p){
    if (!p || popupOpen) return;
    popupOpen = true;
    markShown(p);
    const back = document.createElement('div');
    back.className = 'potw-back';
    back.innerHTML = '<div class="potw" role="dialog" aria-modal="true" aria-label="Photo of the Week">' +
      '<button type="button" class="potw-x" aria-label="Close">×</button>' +
      '<div class="potw-kicker">' + esc(headline(p)) + '</div>' +
      '<img class="potw-img" alt="" src="' + esc(urlOf(p.path)) + '">' +
      (p.caption ? '<p class="potw-cap">' + esc(p.caption) + '</p>' : '') +
      '<div class="potw-row"><button type="button" class="wall-like' + (p.liked ? ' on' : '') + '" data-potw-like aria-pressed="' + !!p.liked + '">' + likeLabel(p) + '</button>' +
      (feature('photo-wall') && document.getElementById('tab-wall') ? '<button type="button" class="btn2 small" data-potw-wall>Open the Wall</button>' : '') +
      (isAdmin() ? '<button type="button" class="linkish danger" data-potw-del>Remove</button>' : '') + '</div></div>';
    document.body.appendChild(back);
    const close = () => { popupOpen = false; back.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.onclick = e => { if (e.target === back) close(); };
    back.querySelector('.potw-x').onclick = close;
    const like = back.querySelector('[data-potw-like]');
    like.onclick = async () => {
      const r = await toggleLike(p.id);
      if (!r) return;
      p.likes = r.likes; p.liked = r.liked;
      like.textContent = likeLabel(p); like.classList.toggle('on', p.liked); like.setAttribute('aria-pressed', p.liked);
      renderStrip();
    };
    const wall = back.querySelector('[data-potw-wall]');
    if (wall) wall.onclick = () => { close(); openWall(); };
    // Admins can take it down (an upload set by mistake, or a winner that shouldn't be).
    const del = back.querySelector('[data-potw-del]');
    if (del) del.onclick = async () => {
      if (del.dataset.sure !== '1'){ del.dataset.sure = '1'; del.textContent = 'Tap again to remove it for everyone'; return; }
      const { data, error } = await bnbClient.rpc('wall_delete', { p_post: p.id });
      if (error) return UI.toast('Couldn\'t remove it: ' + error.message);
      dropFile(data); close(); UI.toast('Removed.');
      posts = posts.filter(x => x.id !== p.id);
      await loadPotw(true); renderStrip(); if (isActive('tab-wall')) render();
    };
  }

  let checking = false, lastCheck = 0;
  async function check(){
    if (checking || popupOpen || !me() || !feature('photo-of-the-week') || document.hidden) return;
    if (Date.now() - lastCheck < 30e3) return;
    checking = true; lastCheck = Date.now();
    try {
      const p = await loadPotw(false);
      // Not over another window, and not mid-set in Live Session.
      if (p && due(p) && !document.querySelector('.bnb-modal, .t-panel-backdrop.open') && !isActive('tab-session')) openPopup(p);
    } finally { checking = false; }
  }
  function isActive(id){ const el = document.getElementById(id); return !!(el && el.classList.contains('active')); }

  // The strip on Member's card screen, under the Today card.
  function renderStrip(){
    const today = document.getElementById('member-today');
    if (!today) return;
    let strip = document.getElementById('potw-strip');
    if (!strip){ strip = document.createElement('div'); strip.id = 'potw-strip'; today.insertAdjacentElement('afterend', strip); }
    if (!me() || !potw || !feature('photo-of-the-week')){ strip.innerHTML = ''; return; }
    strip.innerHTML = '<button type="button" class="potw-strip">' +
      '<img alt="" src="' + esc(urlOf(potw.path)) + '"><span class="potw-strip-txt"><span class="today-lbl">' + (potw.kind === 'winner' ? 'Last week\'s top photo' : 'Photo of the Week') + '</span>' +
      '<span class="potw-strip-cap">' + esc(potw.caption || ('by ' + potw.author)) + '</span></span><span class="potw-strip-likes">👍 ' + potw.likes + '</span></button>';
    strip.querySelector('button').onclick = () => openPopup(potw);
  }

  /* ================= THE WALL ================= */
  let sort = 'new', posts = [], more = false, loading = false, wallMissing = false, wallError = '';
  let composing = null;   // { file, preview, weekly }
  let posting = false;

  async function loadWall(append){
    if (!me() || loading) return;
    loading = true;
    if (!append) render();
    const { data, error } = await bnbClient.rpc('wall_feed', { p_sort: sort, p_limit: PAGE, p_offset: append ? posts.length : 0 });
    loading = false;
    if (error){ wallMissing = isMissing(error); wallError = error.message; render(); return; }
    wallMissing = false; wallError = '';
    const rows = data || [];
    await sign(rows.map(r => r.path));
    posts = append ? posts.concat(rows) : rows;
    more = rows.length === PAGE;
    render();
  }

  async function toggleLike(id){
    const { data, error } = await bnbClient.rpc('wall_like', { p_post: id });
    if (error){ UI.toast('Couldn\'t like it: ' + error.message); return null; }
    const r = data && data[0];
    if (!r) return null;
    posts.forEach(p => { if (p.id === id){ p.likes = r.likes; p.liked = r.liked; } });
    if (potw && potw.id === id){ potw.likes = r.likes; potw.liked = r.liked; renderStrip(); }
    return r;
  }

  function composerHtml(){
    if (!composing) return '';
    const w = composing.weekly;
    return '<div class="wall-compose">' +
      '<img class="wall-preview" alt="" src="' + esc(composing.preview) + '">' +
      '<div class="wall-compose-fields">' +
        '<div class="today-lbl">' + (w ? 'New Photo of the Week' : 'New post') + '</div>' +
        '<textarea maxlength="200" rows="3" placeholder="' + (w ? 'Caption, e.g. Member of the week: Achieng, 100 kg deadlift' : 'Say something about it (optional)') + '" data-wall-caption>' + esc(composing.caption || '') + '</textarea>' +
        (w ? '<label class="wall-date">Shows from <input type="date" data-wall-from value="' + esc(composing.from || iso(new Date())) + '"></label>' +
             '<p class="field-hint">It pops up for everyone from that day and wins over the Wall\'s top photo for that week.</p>' : '') +
        '<p class="field-hint">Only post people who are happy to be on it.</p>' +
        '<div class="wall-edit-row"><button type="button" class="btn2 primary" data-wall-send' + (posting ? ' disabled' : '') + '>' + (posting ? 'Posting…' : w ? 'Set as Photo of the Week' : 'Post') + '</button>' +
        '<button type="button" class="btn2" data-wall-cancel' + (posting ? ' disabled' : '') + '>Cancel</button></div>' +
      '</div></div>';
  }

  function postHtml(p){
    const tools = [];
    if (!p.mine) tools.push(p.reported ? '<span class="field-hint">Reported</span>' : '<button type="button" class="linkish" data-wall-report>Report</button>');
    if (isMod()) tools.push('<button type="button" class="linkish" data-wall-hide>' + (p.hidden ? 'Show' : 'Hide') + '</button>');
    if (p.mine || isAdmin()) tools.push('<button type="button" class="linkish danger" data-wall-del>Delete</button>');
    return '<article class="wall-post' + (p.hidden ? ' hidden-post' : '') + '" data-post="' + esc(p.id) + '">' +
      '<button type="button" class="wall-photo" data-wall-big aria-label="Open photo"><img alt="" loading="lazy" src="' + esc(urlOf(p.path)) + '"></button>' +
      '<div class="wall-meta"><b>' + esc(p.author) + '</b> <span class="field-hint">' + esc(ago(p.created_at)) + '</span></div>' +
      (p.caption ? '<p class="wall-cap">' + esc(p.caption) + '</p>' : '') +
      (p.hidden ? '<p class="field-hint wall-flag">Hidden' + (isMod() ? (p.reports ? ' · ' + p.reports + ' report' + (p.reports === 1 ? '' : 's') : '') : ': only you and the coaches see it') + '</p>'
        : (isMod() && p.reports ? '<p class="field-hint wall-flag">' + p.reports + ' report' + (p.reports === 1 ? '' : 's') + '</p>' : '')) +
      '<div class="wall-actions"><button type="button" class="wall-like' + (p.liked ? ' on' : '') + '" data-wall-like aria-pressed="' + !!p.liked + '">👍 ' + p.likes + '</button>' +
      '<span class="wall-tools">' + tools.join(' · ') + '</span></div></article>';
  }

  function render(){
    const body = document.getElementById('wall-body');
    if (!body) return;
    if (!me()){ body.innerHTML = '<div class="empty-msg">Sign in to see the Wall.</div>'; return; }
    if (!feature('photo-wall')){ body.innerHTML = '<div class="empty-msg">The Wall is switched off for now.</div>'; return; }
    if (wallMissing){ body.innerHTML = '<div class="empty-msg">The Wall isn\'t set up yet: staff need to run <code>sql/114-photo-wall.sql</code>.</div>'; return; }
    let html = '';
    if (potw && feature('photo-of-the-week')){
      html += '<button type="button" class="potw-strip potw-strip-wide" data-wall-potw><img alt="" src="' + esc(urlOf(potw.path)) + '"><span class="potw-strip-txt"><span class="today-lbl">' +
        (potw.kind === 'winner' ? 'Last week\'s top photo' : 'Photo of the Week') + ' · ' + esc(potw.author) + '</span><span class="potw-strip-cap">' + esc(potw.caption || '') + '</span></span><span class="potw-strip-likes">👍 ' + potw.likes + '</span></button>';
    }
    html += '<p class="wall-intro">Post a photo from the gym. The one with the most 👍 by Saturday night becomes next week\'s Photo of the Week.</p>';
    html += composing ? composerHtml()
      : '<div class="wall-edit-row"><label class="btn2 primary">＋ Post a photo<input type="file" accept="image/*" data-wall-file hidden></label>' +
        (isAdmin() && feature('photo-of-the-week') ? '<label class="btn2">Set Photo of the Week<input type="file" accept="image/*" data-wall-weekly hidden></label>' : '') + '</div>';
    html += '<div class="sched-sub wall-sort">' +
      '<button type="button" data-wall-sort="new"' + (sort === 'new' ? ' class="active"' : '') + '><span class="plate-title">Newest</span></button>' +
      '<button type="button" data-wall-sort="top"' + (sort === 'top' ? ' class="active"' : '') + '><span class="plate-title">This week\'s top</span></button></div>';
    if (wallError) html += '<div class="admin-notice">Could not load the Wall: ' + esc(wallError) + '</div>';
    if (loading && !posts.length) html += '<div class="empty-msg">Loading…</div>';
    else if (!posts.length) html += '<div class="empty-msg">' + (sort === 'top' ? 'Nothing posted this week yet. Be the first.' : 'Nothing on the Wall yet. Be the first.') + '</div>';
    html += '<div class="wall-grid-posts">' + posts.map(postHtml).join('') + '</div>';
    if (more) html += '<div class="wall-edit-row"><button type="button" class="btn2" data-wall-more' + (loading ? ' disabled' : '') + '>' + (loading ? 'Loading…' : 'Show more') + '</button></div>';
    body.innerHTML = html;
    bind(body);
  }

  function pick(file, weekly){
    if (!file) return;
    if (!/^image\//.test(file.type)) return UI.toast('That file isn\'t a picture.');
    if (composing && composing.preview) URL.revokeObjectURL(composing.preview);
    composing = { file, weekly, preview: URL.createObjectURL(file), caption: '', from: iso(new Date()) };
    render();
  }
  function stopComposing(){ if (composing && composing.preview) URL.revokeObjectURL(composing.preview); composing = null; }

  async function send(body){
    const cap = body.querySelector('[data-wall-caption]');
    const from = body.querySelector('[data-wall-from]');
    composing.caption = cap ? cap.value.trim() : '';
    if (from) composing.from = from.value || iso(new Date());
    posting = true; render();
    let path = null;
    try {
      path = await uploadPhoto(composing.file);
      const { error } = composing.weekly
        ? await bnbClient.rpc('wall_set_weekly', { p_path: path, p_caption: composing.caption, p_from: composing.from })
        : await bnbClient.rpc('wall_post', { p_path: path, p_caption: composing.caption });
      if (error) throw error;
      const weekly = composing.weekly;
      posting = false; stopComposing();
      UI.toast(weekly ? 'Photo of the Week set.' : 'Posted.');
      if (weekly) await loadPotw(true);
      if (!weekly){ sort = 'new'; }
      loadWall(false);
    } catch(e){
      posting = false; dropFile(path);
      UI.toast('Couldn\'t post it: ' + (e.message || e)); render();
    }
  }

  function bind(body){
    const f = body.querySelector('[data-wall-file]');
    if (f) f.onchange = () => { const x = f.files && f.files[0]; f.value = ''; pick(x, false); };
    const wk = body.querySelector('[data-wall-weekly]');
    if (wk) wk.onchange = () => { const x = wk.files && wk.files[0]; wk.value = ''; pick(x, true); };
    const sendBtn = body.querySelector('[data-wall-send]');
    if (sendBtn) sendBtn.onclick = () => send(body);
    const cancel = body.querySelector('[data-wall-cancel]');
    if (cancel) cancel.onclick = () => { stopComposing(); render(); };
    const cap = body.querySelector('[data-wall-caption]');
    if (cap) cap.oninput = () => { composing.caption = cap.value; };
    const top = body.querySelector('[data-wall-potw]');
    if (top) top.onclick = () => openPopup(potw);
    body.querySelectorAll('[data-wall-sort]').forEach(b => b.onclick = () => { if (sort === b.dataset.wallSort) return; sort = b.dataset.wallSort; posts = []; loadWall(false); });
    const moreBtn = body.querySelector('[data-wall-more]');
    if (moreBtn) moreBtn.onclick = () => loadWall(true);
    body.querySelectorAll('[data-post]').forEach(el => {
      const p = posts.find(x => x.id === el.dataset.post);
      if (!p) return;
      const q = s => el.querySelector(s);
      q('[data-wall-like]').onclick = async () => { if (await toggleLike(p.id)) render(); };
      q('[data-wall-big]').onclick = () => UI.modal(p.author, '<img class="wall-big" alt="" src="' + esc(urlOf(p.path)) + '">' + (p.caption ? '<p>' + esc(p.caption) + '</p>' : ''), { wide: true });
      const rep = q('[data-wall-report]');
      if (rep) rep.onclick = () => {
        const m = UI.modal('Report this post', '<p>Tell the coaches what\'s wrong (optional). Three reports hide a post until they look at it.</p><textarea maxlength="200" rows="3" data-rep-why style="width:100%"></textarea><div class="wall-edit-row"><button type="button" class="btn2 danger" data-rep-send>Report</button></div>');
        m.body.querySelector('[data-rep-send]').onclick = async () => {
          const { error } = await bnbClient.rpc('wall_report', { p_post: p.id, p_reason: m.body.querySelector('[data-rep-why]').value.trim() });
          m.close();
          if (error) return UI.toast('Couldn\'t report it: ' + error.message);
          UI.toast('Reported. Thanks, the coaches will take a look.');
          loadWall(false);
        };
      };
      const hide = q('[data-wall-hide]');
      if (hide) hide.onclick = async () => {
        const { error } = await bnbClient.rpc('wall_hide', { p_post: p.id, p_hidden: !p.hidden });
        if (error) return UI.toast('Couldn\'t change it: ' + error.message);
        UI.toast(p.hidden ? 'Showing again.' : 'Hidden from members.');
        loadWall(false); loadPotw(true);
      };
      const del = q('[data-wall-del]');
      if (del) del.onclick = async () => {
        if (del.dataset.sure !== '1'){ del.dataset.sure = '1'; del.textContent = 'Tap again to delete'; return; }
        const { data, error } = await bnbClient.rpc('wall_delete', { p_post: p.id });
        if (error) return UI.toast('Couldn\'t delete it: ' + error.message);
        dropFile(data);
        UI.toast('Deleted.');
        posts = posts.filter(x => x.id !== p.id); render(); loadPotw(true);
      };
    });
  }

  function openWall(){
    if (typeof window.switchSite === 'function') window.switchSite('gym');
    if (typeof window.switchTab === 'function') window.switchTab('wall');
  }

  window.bnbWallOnTabShown = function(){ render(); loadPotw(true).then(render); loadWall(false); };

  // Coming back to the page counts as opening the app.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('focus', check);
  document.addEventListener('bnb-auth-changed', e => {
    potw = null; potwAt = 0; posts = []; stopComposing(); lastCheck = 0;
    renderStrip();
    if (e.detail && e.detail.signedIn) setTimeout(check, 1500);
  });
  document.addEventListener('bnb-features-change', () => { renderStrip(); if (isActive('tab-wall')) render(); });
  setInterval(check, 5 * 60e3);   // crossing 8:00 or 13:00 with the page open

  if (isActive('tab-wall')) window.bnbWallOnTabShown();
  setTimeout(check, 1500);
})();
