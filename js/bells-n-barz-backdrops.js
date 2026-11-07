(function(){

  // Backgrounds (sql/107-app-backdrops.sql): the pictures behind Home and
  // the sign-in page, and the wallpapers members will pick from. The app
  // reads the same table. They start as drawn placeholders in
  // img/backdrops/; Admin > Backgrounds replaces them with photos of the gym.
  //
  // The page shows Home's picture on Home and sign-in's on the sign-in page
  // (html[data-scene], set by the site nav), wide on a computer and tall on
  // a phone, darkened so the text stays readable. With no picture the drawn
  // plate shows instead.
  //
  // Members choose a wallpaper under Member > Me > Wallpaper (sql/108); it
  // replaces Home's picture for them, in the app too. Some are earned with
  // training days (unlock_sessions); the database checks that.

  const CACHE_KEY = 'bnb-backdrops-v1';
  const BUCKET = 'backdrops';
  const SLOTS = [
    { key: 'home', name: 'Home', desc: 'Behind Home, in the app and on the website. The first one that\'s on is used.' },
    { key: 'signin', name: 'Sign-in', desc: 'Behind the sign-in screen. Everyone sees it, signed in or not.' },
    { key: 'wallpaper', name: 'Wallpapers', desc: 'Backgrounds members can choose (coming next). Set "Unlocks after" to make one a reward for that many sessions.' }
  ];

  const MINE_KEY = 'bnb-wallpaper-v1';
  let rows = readCache();
  // The signed-in member's choice and training days: { uid, id, sessions }.
  let mine = readMine();
  let loaded = false, loadError = '';
  const busy = {};

  function readCache(){ try { const r = JSON.parse(localStorage.getItem(CACHE_KEY)); return Array.isArray(r) ? r : []; } catch(e){ return []; } }
  function writeCache(){ try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows.filter(r => r.active))); } catch(e){} }
  function readMine(){ try { const m = JSON.parse(localStorage.getItem(MINE_KEY)); return m && m.uid ? m : {}; } catch(e){ return {}; } }
  function writeMine(){ try { localStorage.setItem(MINE_KEY, JSON.stringify(mine)); } catch(e){} }
  function self(){ return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf(); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function isAdmin(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    return !!(me && me.roles && me.roles.includes('admin'));
  }
  function toast(msg){
    const el = document.getElementById('t-toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._bdTimer); el._bdTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function first(slot){ return rows.filter(r => r.slot === slot && r.active).sort((a, b) => a.sort - b.sort)[0]; }
  // Home's picture: the member's wallpaper if they chose one (and it's still on), else the gym's.
  function chosen(){
    const me = self();
    if (!me || mine.uid !== me.id || !mine.id) return null;
    return rows.find(r => r.id === mine.id && r.slot === 'wallpaper' && r.active) || null;
  }
  function pic(slot){ return (slot === 'home' && chosen()) || first(slot); }

  // ---- showing them ----
  function cssUrl(u){ return u ? 'url("' + String(u).replace(/["\\\n]/g, '') + '")' : 'none'; }
  function apply(){
    const root = document.documentElement;
    ['home', 'signin'].forEach(slot => {
      const r = pic(slot);
      root.style.setProperty('--bd-' + slot + '-wide', cssUrl(r && (r.wide_url || r.tall_url)));
      root.style.setProperty('--bd-' + slot + '-tall', cssUrl(r && r.tall_url));
      root.classList.toggle('has-bd-' + slot, !!r);
    });
  }

  async function load(){
    if (typeof bnbClient === 'undefined') return;
    const { data, error } = await bnbClient.from('app_backdrops')
      .select('id, slot, name, tall_url, wide_url, unlock_sessions, sort, active, placeholder, updated_at').order('slot').order('sort');
    if (error){ loadError = error.message; console.warn('Backgrounds not loaded:', error.message); render(); return; }
    rows = data || []; loaded = true; loadError = '';
    writeCache(); apply(); render(); renderPicker();
  }

  // ---- Admin > Backgrounds ----
  function shrink(file, max){
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error('Could not read that picture.')), 'image/jpeg', 0.86);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn\'t a picture.')); };
      img.src = url;
    });
  }
  async function upload(file){
    const blob = await shrink(file, 2200);
    const path = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    const { error } = await bnbClient.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return bnbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  async function save(id, patch, okMsg){
    busy[id] = true; render();
    const { error } = await bnbClient.from('app_backdrops').update(patch).eq('id', id);
    busy[id] = false;
    if (error){ toast('Couldn\'t save: ' + error.message); render(); return; }
    if (okMsg) toast(okMsg);
    await load();
  }

  function card(r, admin){
    const dis = (!admin || busy[r.id]) ? ' disabled' : '';
    return '<div class="bd-card' + (r.active ? '' : ' off') + '" data-bd="' + esc(r.id) + '">' +
      '<div class="bd-pics"><img alt="" loading="lazy" src="' + esc(r.tall_url) + '"><img alt="" loading="lazy" class="wide" src="' + esc(r.wide_url || r.tall_url) + '"></div>' +
      '<div class="bd-body">' +
        '<input type="text" maxlength="60" data-bd-name value="' + esc(r.name) + '" aria-label="Name"' + dis + '>' +
        (r.placeholder ? '<span class="bd-tag">Placeholder art</span>' : '') +
        (r.slot === 'wallpaper' ? '<label class="bd-unlock">Unlocks after <input type="number" min="1" max="10000" data-bd-unlock value="' + esc(r.unlock_sessions || '') + '" placeholder="free"' + dis + '> sessions</label>' : '') +
        '<div class="bd-actions">' +
          '<label class="btn2' + (dis ? ' disabled' : '') + '">Replace phone photo<input type="file" accept="image/*" data-bd-file="tall_url" hidden' + dis + '></label>' +
          '<label class="btn2' + (dis ? ' disabled' : '') + '">Replace wide photo<input type="file" accept="image/*" data-bd-file="wide_url" hidden' + dis + '></label>' +
          '<button type="button" class="btn2" data-bd-up' + dis + ' aria-label="Move up">↑</button>' +
          '<button type="button" class="btn2" data-bd-toggle' + dis + '>' + (r.active ? 'Hide' : 'Show') + '</button>' +
          '<button type="button" class="btn2 danger" data-bd-del' + dis + '>Delete</button>' +
        '</div>' +
      '</div></div>';
  }

  function render(){
    const body = document.getElementById('backdrops-body');
    if (!body) return;
    const admin = isAdmin();
    let html = '';
    if (loadError) html += '<div class="admin-notice">Could not load the backgrounds: ' + esc(loadError) + ' — has sql/107-app-backdrops.sql been run?</div>';
    if (!admin) html += '<div class="admin-notice">Only admins can change these.</div>';
    html += '<p class="bd-help">Phone photos work best in portrait with calm space in the top half (the greeting and cards sit there). The wide photo is for computers; without one, the phone photo is used. Photos are shrunk before uploading. Changes reach the app the next time it opens.</p>';
    SLOTS.forEach(s => {
      const list = rows.filter(r => r.slot === s.key).sort((a, b) => a.sort - b.sort);
      html += '<div class="bd-slot"><div class="bd-slot-head"><h3>' + esc(s.name) + '</h3><span>' + esc(s.desc) + '</span>' +
        (admin ? '<label class="btn2 primary">Add a picture<input type="file" accept="image/*" data-bd-add="' + s.key + '" hidden></label>' : '') + '</div>' +
        (list.length ? '<div class="bd-grid">' + list.map(r => card(r, admin)).join('') + '</div>' : '<p class="wp-muted">Nothing here yet.</p>') + '</div>';
    });
    body.innerHTML = html;
    if (!admin) return;
    body.querySelectorAll('[data-bd]').forEach(el => {
      const id = el.dataset.bd, r = rows.find(x => x.id === id);
      const name = el.querySelector('[data-bd-name]');
      name.addEventListener('change', () => { const v = name.value.trim(); if (v && v !== r.name) save(id, { name: v }, 'Renamed.'); });
      const unlock = el.querySelector('[data-bd-unlock]');
      if (unlock) unlock.addEventListener('change', () => {
        const n = parseInt(unlock.value, 10);
        save(id, { unlock_sessions: n > 0 ? n : null }, n > 0 ? 'Unlocks after ' + n + ' sessions.' : 'Free for everyone.');
      });
      el.querySelectorAll('[data-bd-file]').forEach(inp => inp.addEventListener('change', async () => {
        const file = inp.files && inp.files[0]; inp.value = '';
        if (!file) return;
        busy[id] = true; render(); toast('Uploading…');
        try { const url = await upload(file); busy[id] = false; await save(id, { [inp.dataset.bdFile]: url, placeholder: false }, 'Photo replaced.'); }
        catch(e){ busy[id] = false; render(); toast('Couldn\'t upload: ' + (e.message || e)); }
      }));
      el.querySelector('[data-bd-toggle]').onclick = () => save(id, { active: !r.active }, r.active ? 'Hidden.' : 'Showing.');
      el.querySelector('[data-bd-up]').onclick = () => {
        const list = rows.filter(x => x.slot === r.slot).sort((a, b) => a.sort - b.sort);
        const i = list.findIndex(x => x.id === id);
        if (i <= 0) return;
        // Swap it with the one above, then number the whole slot 0, 1, 2… so no two share a place.
        [list[i - 1], list[i]] = [list[i], list[i - 1]];
        Promise.all(list.map((x, n) => x.sort === n ? null : bnbClient.from('app_backdrops').update({ sort: n }).eq('id', x.id))).then(load);
      };
      const del = el.querySelector('[data-bd-del]');
      del.onclick = async () => {
        if (del.dataset.sure !== '1'){ del.dataset.sure = '1'; del.textContent = 'Tap again to delete'; return; }
        const { error } = await bnbClient.from('app_backdrops').delete().eq('id', id);
        if (error) return toast('Couldn\'t delete: ' + error.message);
        toast('Deleted.'); load();
      };
    });
    body.querySelectorAll('[data-bd-add]').forEach(inp => inp.addEventListener('change', async () => {
      const file = inp.files && inp.files[0]; inp.value = '';
      if (!file) return;
      toast('Uploading…');
      try {
        const url = await upload(file);
        const slot = inp.dataset.bdAdd;
        const sort = rows.filter(r => r.slot === slot).reduce((m, r) => Math.max(m, r.sort), -1) + 1;
        const nm = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 60) || 'New picture';
        const { error } = await bnbClient.from('app_backdrops').insert([{ slot, name: nm, tall_url: url, sort }]);
        if (error) throw error;
        toast('Added.'); load();
      } catch(e){ toast('Couldn\'t add: ' + (e.message || e)); }
    }));
  }

  // ---- Member > Me > Wallpaper ----
  async function loadMine(){
    const me = self();
    if (!me || typeof bnbClient === 'undefined'){ return; }
    const [days, pref] = await Promise.all([
      bnbClient.rpc('my_session_days'),
      bnbClient.from('member_prefs').select('wallpaper_id').eq('member_id', me.id).maybeSingle()
    ]);
    if (days.error && pref.error){ mine.error = days.error.message; renderPicker(); return; }
    mine = { uid: me.id, id: (pref.data && pref.data.wallpaper_id) || null, sessions: days.error ? null : (days.data || 0) };
    writeMine(); apply(); renderPicker();
  }

  async function choose(id){
    const me = self();
    if (!me) return;
    const was = mine.id;
    mine.id = id; mine.uid = me.id; apply(); renderPicker();
    const { error } = await bnbClient.from('member_prefs').upsert([{ member_id: me.id, wallpaper_id: id, updated_at: new Date().toISOString() }]);
    if (error){ mine.id = was; apply(); renderPicker(); toast('Couldn\'t change it: ' + error.message); return; }
    writeMine();
    toast(id ? 'Wallpaper set. It\'s behind Home in the app too.' : 'Back to the gym\'s picture.');
  }

  function renderPicker(){
    const body = document.getElementById('wallpaper-body');
    if (!body) return;
    const me = self();
    if (!me){ body.innerHTML = '<p class="wp-muted">Sign in to choose a wallpaper.</p>'; return; }
    const walls = rows.filter(r => r.slot === 'wallpaper' && r.active).sort((a, b) => a.sort - b.sort);
    const days = mine.uid === me.id ? mine.sessions : null;
    const current = chosen();
    const gym = first('home');
    const tile = (id, src, name, locked, hint) => {
      const on = id ? (current && current.id === id) : !current;
      return '<button type="button" class="wall-tile' + (on ? ' on' : '') + (locked ? ' locked' : '') + '" data-wall="' + esc(id || '') + '"' + (locked ? ' disabled' : '') + '>' +
        (src ? '<img alt="" loading="lazy" src="' + esc(src) + '">' : '<span class="wall-none"></span>') +
        (locked ? '<span class="wall-lock" aria-hidden="true">🔒</span>' : '') +
        '<span class="wall-name">' + esc(name) + '</span>' +
        '<span class="wall-hint">' + esc(on ? 'Showing' : hint) + '</span></button>';
    };
    let html = '<div class="day-head"><h2>Wallpaper</h2><span class="day-sub">The picture behind Home, here and in the app</span></div>';
    if (days != null) html += '<p class="wall-days">You\'ve trained <b>' + days + '</b> ' + (days === 1 ? 'day' : 'days') + ' with a saved Live Session. Some wallpapers open as that number grows.</p>';
    if (loadError) html += '<div class="admin-notice">Could not load the wallpapers: ' + esc(loadError) + '</div>';
    html += '<div class="wall-grid">' + tile(null, gym && gym.tall_url, 'The gym\'s picture', false, 'Default') +
      walls.map(w => {
        const need = w.unlock_sessions;
        const locked = need && (days == null || days < need) && !(current && current.id === w.id);
        const hint = !need ? 'Free' : locked ? (days == null ? 'Train ' + need + ' sessions' : (need - days) + ' more ' + (need - days === 1 ? 'session' : 'sessions')) : 'Earned';
        return tile(w.id, w.tall_url, w.name, locked, hint);
      }).join('') + '</div>';
    if (!walls.length) html += '<p class="wp-muted">No wallpapers yet.</p>';
    body.innerHTML = html;
    body.querySelectorAll('[data-wall]').forEach(b => b.onclick = () => choose(b.dataset.wall || null));
  }

  window.bnbWallpaperOnShown = function(){ renderPicker(); load().then(loadMine); };
  document.addEventListener('bnb-auth-changed', e => {
    if (e.detail && e.detail.signedIn) loadMine();
    else { mine = {}; writeMine(); apply(); }
  });

  window.bnbBackdropsOnTabShown = function(){ render(); load(); };
  window.BNB_BACKDROPS = { rows: () => rows.slice(), first, pic, reload: load };

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true }); else load();
})();
