(function(){

  // Backgrounds (sql/107-app-backdrops.sql): the pictures behind Home and
  // the sign-in page, and the wallpapers members pick from. The app reads
  // the same table. They start as drawn placeholders in img/backdrops/;
  // Admin > Backgrounds adds, edits, moves, previews and deletes them.
  //
  // The page shows Home's picture on Home and sign-in's on the sign-in page
  // (html[data-scene], set by the site nav), wide on a computer and tall on
  // a phone, darkened so the text stays readable. With no picture the drawn
  // plate shows instead.
  //
  // Members choose a wallpaper under Member > Me > Wallpaper (sql/108); it
  // replaces Home's picture for them, in the app too. Some are earned with
  // training days (unlock_sessions); the database checks that. They can also
  // put up photos of their own (sql/109), private to them.

  const CACHE_KEY = 'bnb-backdrops-v1';
  const MINE_KEY = 'bnb-wallpaper-v2';
  const BUCKET = 'backdrops';
  const OWN_BUCKET = 'member-wallpapers';
  const OWN_MAX = 12;
  const SLOTS = [
    { key: 'home', name: 'Home', desc: 'Behind Home, in the app and on the website. The first one that\'s on is used, unless a member picked a wallpaper.' },
    { key: 'signin', name: 'Sign-in', desc: 'Behind the sign-in screen. Everyone sees it, signed in or not.' },
    { key: 'wallpaper', name: 'Wallpapers', desc: 'Backgrounds members choose from on their Wallpaper page. Set "Unlocks after" to make one a reward for that many sessions.' }
  ];
  const SLOT_NAME = { home: 'Home', signin: 'Sign-in', wallpaper: 'Wallpapers' };

  let rows = readCache();
  let loaded = false, loadError = '';
  const busy = {};
  let adding = null;          // the slot whose Add form is open
  // The signed-in member: { uid, id (gym wallpaper), own (own wallpaper id), sessions, mineList: [{id, name, path, url, exp}] }.
  let mine = readMine();
  let ownEditing = null, ownBusy = false;

  function readCache(){ try { const r = JSON.parse(localStorage.getItem(CACHE_KEY)); return Array.isArray(r) ? r : []; } catch(e){ return []; } }
  function writeCache(){ try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows.filter(r => r.active))); } catch(e){} }
  function readMine(){ try { const m = JSON.parse(localStorage.getItem(MINE_KEY)); return m && m.uid ? m : {}; } catch(e){ return {}; } }
  function writeMine(){ try { localStorage.setItem(MINE_KEY, JSON.stringify(mine)); } catch(e){} }
  function self(){ return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf(); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function isAdmin(){
    const me = self();
    return !!(me && me.roles && me.roles.includes('admin'));
  }
  function toast(msg){
    const el = document.getElementById('t-toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._bdTimer); el._bdTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function first(slot){ return rows.filter(r => r.slot === slot && r.active).sort((a, b) => a.sort - b.sort)[0]; }
  function isMine(){ const me = self(); return !!(me && mine.uid === me.id); }
  function ownList(){ return isMine() ? (mine.mineList || []) : []; }
  function ownShown(){ return isMine() && mine.own ? ownList().find(w => w.id === mine.own && w.url && w.exp > Date.now()) || null : null; }
  // The gym wallpaper the member chose, if it's still on.
  function chosen(){
    if (!isMine() || !mine.id || mine.own) return null;
    return rows.find(r => r.id === mine.id && r.slot === 'wallpaper' && r.active) || null;
  }
  // Home's picture: the member's own photo, or their wallpaper, or the gym's.
  function pic(slot){
    if (slot === 'home'){
      const o = ownShown();
      if (o) return { tall_url: o.url, wide_url: null };
      const c = chosen();
      if (c) return c;
    }
    return first(slot);
  }
  // The file in the backdrops bucket behind a public URL (placeholders in img/ have none).
  function bucketPath(url){
    const mark = '/storage/v1/object/public/' + BUCKET + '/';
    const i = String(url || '').indexOf(mark);
    return i < 0 ? null : decodeURIComponent(String(url).slice(i + mark.length));
  }
  // Removes files nothing points at any more. Failures only leave a stray file.
  async function dropFiles(urls){
    const used = new Set(rows.flatMap(r => [r.tall_url, r.wide_url]));
    const paths = urls.filter(u => u && !used.has(u)).map(bucketPath).filter(Boolean);
    if (paths.length) await bnbClient.storage.from(BUCKET).remove(paths).catch(() => {});
  }

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
    if (error){ loadError = error.message; console.warn('Backgrounds not loaded:', error.message); render(); renderPicker(); return; }
    rows = data || []; loaded = true; loadError = '';
    writeCache(); apply(); render(); renderPicker();
  }

  // ---- uploads ----
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
  function randName(){ return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.jpg'; }
  async function upload(file){
    const blob = await shrink(file, 2200);
    const path = randName();
    const { error } = await bnbClient.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return bnbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  function nameFromFile(file){ return file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 60); }

  // ---- Admin > Backgrounds ----
  async function save(id, patch, okMsg){
    busy[id] = true; render();
    const { error } = await bnbClient.from('app_backdrops').update(patch).eq('id', id);
    busy[id] = false;
    if (error){ toast('Couldn\'t save: ' + error.message); render(); return false; }
    if (okMsg) toast(okMsg);
    await load();
    return true;
  }
  // Puts a slot in the given order, numbered 0, 1, 2… so no two share a place.
  function renumber(list){
    return Promise.all(list.map((x, n) => x.sort === n ? null : bnbClient.from('app_backdrops').update({ sort: n }).eq('id', x.id))).then(load);
  }
  function slotList(slot){ return rows.filter(x => x.slot === slot).sort((a, b) => a.sort - b.sort); }

  function preview(r){
    const old = document.getElementById('bd-preview');
    if (old) old.remove();
    const cards = '<div class="bdp-hi"></div><div class="bdp-card"></div><div class="bdp-card short"></div><div class="bdp-card"></div>';
    const el = document.createElement('div');
    el.id = 'bd-preview'; el.className = 'bd-preview';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Preview');
    el.innerHTML = '<div class="bdp-box"><div class="bdp-head"><b>' + esc(r.name) + '</b><button type="button" class="btn2" data-bdp-close>Close</button></div>' +
      '<div class="bdp-frames">' +
        '<figure><div class="bdp-frame tall" style="--bdp:' + esc(cssUrl(r.tall_url)) + '">' + cards + '</div><figcaption>Phone</figcaption></figure>' +
        '<figure><div class="bdp-frame wide" style="--bdp:' + esc(cssUrl(r.wide_url || r.tall_url)) + '">' + cards + '</div><figcaption>Computer' + (r.wide_url ? '' : ' (uses the phone photo)') + '</figcaption></figure>' +
      '</div><p class="bd-help">Roughly how it sits behind Home: darkened and faded so the cards stay readable.</p></div>';
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-bdp-close]')) el.remove(); });
    document.addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ el.remove(); document.removeEventListener('keydown', k); } });
    document.body.appendChild(el);
    el.querySelector('[data-bdp-close]').focus();
  }

  function card(r, admin){
    const dis = (!admin || busy[r.id]) ? ' disabled' : '';
    const list = slotList(r.slot), i = list.findIndex(x => x.id === r.id);
    return '<div class="bd-card' + (r.active ? '' : ' off') + '" data-bd="' + esc(r.id) + '">' +
      '<div class="bd-pics"><img alt="" loading="lazy" src="' + esc(r.tall_url) + '"><img alt="" loading="lazy" class="wide" src="' + esc(r.wide_url || r.tall_url) + '"></div>' +
      '<div class="bd-body">' +
        '<div class="bd-tags">' + (r.placeholder ? '<span class="bd-tag">Placeholder art</span>' : '') + (r.active ? '' : '<span class="bd-tag">Hidden</span>') +
          (r.slot === 'wallpaper' && r.unlock_sessions ? '<span class="bd-tag">Earned · ' + esc(r.unlock_sessions) + '</span>' : '') + '</div>' +
        '<input type="text" maxlength="60" data-bd-name value="' + esc(r.name) + '" aria-label="Name"' + dis + '>' +
        (r.slot === 'wallpaper' ? '<label class="bd-unlock">Unlocks after <input type="number" min="1" max="10000" data-bd-unlock value="' + esc(r.unlock_sessions || '') + '" placeholder="free"' + dis + '> sessions</label>' : '') +
        '<button type="button" class="btn2 primary" data-bd-save hidden>Save</button>' +
        '<div class="bd-actions">' +
          '<label class="btn2' + (dis ? ' disabled' : '') + '">Replace phone photo<input type="file" accept="image/*" data-bd-file="tall_url" hidden' + dis + '></label>' +
          '<label class="btn2' + (dis ? ' disabled' : '') + '">' + (r.wide_url ? 'Replace' : 'Add') + ' wide photo<input type="file" accept="image/*" data-bd-file="wide_url" hidden' + dis + '></label>' +
          (r.wide_url ? '<button type="button" class="btn2" data-bd-nowide' + dis + '>Remove wide</button>' : '') +
          '<button type="button" class="btn2" data-bd-preview>Preview</button>' +
        '</div>' +
        '<div class="bd-actions">' +
          '<button type="button" class="btn2" data-bd-up' + (dis || (i <= 0 ? ' disabled' : '')) + ' aria-label="Move up">↑</button>' +
          '<button type="button" class="btn2" data-bd-down' + (dis || (i >= list.length - 1 ? ' disabled' : '')) + ' aria-label="Move down">↓</button>' +
          '<select data-bd-move aria-label="Move to"' + dis + '><option value="">Move to…</option>' +
            SLOTS.filter(s => s.key !== r.slot).map(s => '<option value="' + s.key + '">' + esc(s.name) + '</option>').join('') + '</select>' +
          '<button type="button" class="btn2" data-bd-toggle' + dis + '>' + (r.active ? 'Hide' : 'Show') + '</button>' +
          '<button type="button" class="btn2 danger" data-bd-del' + dis + '>Delete</button>' +
        '</div>' +
      '</div></div>';
  }

  function addForm(slot){
    return '<form class="bd-add" data-bd-addform="' + slot + '">' +
      '<label>Name<input type="text" name="name" maxlength="60" placeholder="e.g. Squat rack at dawn"></label>' +
      '<label>Phone photo (portrait)<input type="file" name="tall" accept="image/*" required></label>' +
      '<label>Wide photo, for computers (optional)<input type="file" name="wide" accept="image/*"></label>' +
      (slot === 'wallpaper' ? '<label>Unlocks after (sessions, blank = free)<input type="number" name="unlock" min="1" max="10000"></label>' : '') +
      '<div class="bd-actions"><button type="submit" class="btn2 primary">Add</button><button type="button" class="btn2" data-bd-addcancel>Cancel</button></div>' +
    '</form>';
  }

  function render(){
    const body = document.getElementById('backdrops-body');
    if (!body) return;
    const admin = isAdmin();
    let html = '';
    if (loadError) html += '<div class="admin-notice">Could not load the backgrounds: ' + esc(loadError) + ' — has sql/107-app-backdrops.sql been run?</div>';
    if (!admin) html += '<div class="admin-notice">Only admins can change these.</div>';
    html += '<p class="bd-help">Phone photos work best in portrait with calm space in the top half (the greeting and cards sit there). The wide photo is for computers; without one, the phone photo is used. Photos are shrunk before uploading, and deleting or replacing one removes the old file. Changes reach the app the next time it opens.</p>';
    SLOTS.forEach(s => {
      const list = slotList(s.key);
      html += '<div class="bd-slot"><div class="bd-slot-head"><h3>' + esc(s.name) + '</h3><span>' + esc(s.desc) + '</span>' +
        (admin && adding !== s.key ? '<button type="button" class="btn2 primary" data-bd-add="' + s.key + '">Add a picture</button>' : '') + '</div>' +
        (admin && adding === s.key ? addForm(s.key) : '') +
        (list.length ? '<div class="bd-grid">' + list.map(r => card(r, admin)).join('') + '</div>' : '<p class="wp-muted">Nothing here yet.</p>') + '</div>';
    });
    body.innerHTML = html;
    body.querySelectorAll('[data-bd-preview]').forEach(b => b.onclick = () => preview(rows.find(x => x.id === b.closest('[data-bd]').dataset.bd)));
    if (!admin) return;

    body.querySelectorAll('[data-bd-add]').forEach(b => b.onclick = () => { adding = b.dataset.bdAdd; render(); const f = body.querySelector('[data-bd-addform] input[name=name]'); if (f) f.focus(); });
    body.querySelectorAll('[data-bd-addform]').forEach(form => {
      form.querySelector('[data-bd-addcancel]').onclick = () => { adding = null; render(); };
      form.onsubmit = async e => {
        e.preventDefault();
        const slot = form.dataset.bdAddform, fd = new FormData(form);
        const tall = fd.get('tall'), wide = fd.get('wide');
        if (!tall || !tall.size) return toast('Choose a phone photo.');
        const name = String(fd.get('name') || '').trim() || nameFromFile(tall) || 'New picture';
        const n = parseInt(fd.get('unlock'), 10);
        form.querySelectorAll('button, input').forEach(x => x.disabled = true);
        toast('Uploading…');
        const uploaded = [];
        try {
          const tallUrl = await upload(tall); uploaded.push(tallUrl);
          const wideUrl = wide && wide.size ? await upload(wide) : null; if (wideUrl) uploaded.push(wideUrl);
          const sort = slotList(slot).reduce((m, r) => Math.max(m, r.sort), -1) + 1;
          const { error } = await bnbClient.from('app_backdrops').insert([{ slot, name, tall_url: tallUrl, wide_url: wideUrl, sort, unlock_sessions: slot === 'wallpaper' && n > 0 ? n : null }]);
          if (error) throw error;
          adding = null; toast('Added.'); load();
        } catch(err){
          await dropFiles(uploaded);
          form.querySelectorAll('button, input').forEach(x => x.disabled = false);
          toast('Couldn\'t add: ' + (err.message || err));
        }
      };
    });

    body.querySelectorAll('[data-bd]').forEach(el => {
      const id = el.dataset.bd, r = rows.find(x => x.id === id);
      const name = el.querySelector('[data-bd-name]'), unlock = el.querySelector('[data-bd-unlock]'), saveBtn = el.querySelector('[data-bd-save]');
      const changed = () => name.value.trim() !== r.name || (unlock && (parseInt(unlock.value, 10) || null) !== (r.unlock_sessions || null));
      [name, unlock].forEach(inp => inp && inp.addEventListener('input', () => { saveBtn.hidden = !changed(); }));
      saveBtn.onclick = () => {
        const v = name.value.trim();
        if (!v) return toast('Give it a name.');
        const patch = { name: v };
        if (unlock){ const n = parseInt(unlock.value, 10); patch.unlock_sessions = n > 0 ? n : null; }
        save(id, patch, 'Saved.');
      };
      name.addEventListener('keydown', e => { if (e.key === 'Enter' && !saveBtn.hidden) saveBtn.click(); });

      el.querySelectorAll('[data-bd-file]').forEach(inp => inp.addEventListener('change', async () => {
        const file = inp.files && inp.files[0]; inp.value = '';
        if (!file) return;
        const field = inp.dataset.bdFile, before = r[field];
        busy[id] = true; render(); toast('Uploading…');
        let url = null;
        try {
          url = await upload(file); busy[id] = false;
          if (await save(id, { [field]: url, placeholder: false }, 'Photo replaced.')) dropFiles([before]);
          else dropFiles([url]);
        } catch(e){ busy[id] = false; render(); if (url) dropFiles([url]); toast('Couldn\'t upload: ' + (e.message || e)); }
      }));
      const noWide = el.querySelector('[data-bd-nowide]');
      if (noWide) noWide.onclick = async () => { const before = r.wide_url; if (await save(id, { wide_url: null }, 'Wide photo removed. Computers use the phone photo.')) dropFiles([before]); };

      el.querySelector('[data-bd-toggle]').onclick = () => save(id, { active: !r.active }, r.active ? 'Hidden.' : 'Showing.');
      const shift = d => {
        const list = slotList(r.slot), i = list.findIndex(x => x.id === id), j = i + d;
        if (i < 0 || j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        renumber(list);
      };
      el.querySelector('[data-bd-up]').onclick = () => shift(-1);
      el.querySelector('[data-bd-down]').onclick = () => shift(1);
      el.querySelector('[data-bd-move]').onchange = e => {
        const to = e.target.value;
        if (!to) return;
        const sort = slotList(to).reduce((m, x) => Math.max(m, x.sort), -1) + 1;
        const patch = { slot: to, sort };
        if (to !== 'wallpaper') patch.unlock_sessions = null;
        save(id, patch, 'Moved to ' + SLOT_NAME[to] + '.');
      };
      const del = el.querySelector('[data-bd-del]');
      del.onclick = async () => {
        if (del.dataset.sure !== '1'){ del.dataset.sure = '1'; del.textContent = 'Tap again to delete'; return; }
        const { error } = await bnbClient.from('app_backdrops').delete().eq('id', id);
        if (error) return toast('Couldn\'t delete: ' + error.message);
        rows = rows.filter(x => x.id !== id);
        await dropFiles([r.tall_url, r.wide_url]);
        toast('Deleted.'); load();
      };
    });
  }

  // ---- Member > Me > Wallpaper ----
  async function loadMine(){
    const me = self();
    if (!me || typeof bnbClient === 'undefined') return;
    const [days, pref, own] = await Promise.all([
      bnbClient.rpc('my_session_days'),
      bnbClient.from('member_prefs').select('wallpaper_id, own_wallpaper_id').eq('member_id', me.id).maybeSingle(),
      bnbClient.from('member_wallpapers').select('id, name, path').eq('member_id', me.id).order('created_at')
    ]);
    if (pref.error){ console.warn('Wallpaper not loaded:', pref.error.message); renderPicker(); return; }
    const list = own.error ? [] : (own.data || []);
    const old = (mine.uid === me.id && mine.mineList) || [];
    // Re-sign only what isn't already signed for a while yet.
    const stale = list.filter(w => { const o = old.find(x => x.id === w.id && x.path === w.path); return !o || !o.url || o.exp < Date.now() + 3600e3; });
    const signed = {};
    if (stale.length){
      const { data } = await bnbClient.storage.from(OWN_BUCKET).createSignedUrls(stale.map(w => w.path), 86400);
      (data || []).forEach(s => { if (s.signedUrl) signed[s.path] = s.signedUrl; });
    }
    mine = {
      uid: me.id,
      id: (pref.data && pref.data.wallpaper_id) || null,
      own: (pref.data && pref.data.own_wallpaper_id) || null,
      sessions: days.error ? (mine.uid === me.id ? mine.sessions : null) : (days.data || 0),
      mineList: list.map(w => {
        if (signed[w.path]) return { id: w.id, name: w.name, path: w.path, url: signed[w.path], exp: Date.now() + 86400e3 };
        const o = old.find(x => x.id === w.id && x.path === w.path) || {};
        return { id: w.id, name: w.name, path: w.path, url: o.url || null, exp: o.exp || 0 };
      })
    };
    writeMine(); apply(); renderPicker();
  }

  async function setPrefs(patch, okMsg){
    const me = self();
    if (!me) return;
    const was = { id: mine.id, own: mine.own };
    Object.assign(mine, { uid: me.id, id: patch.wallpaper_id, own: patch.own_wallpaper_id }); apply(); renderPicker();
    const { error } = await bnbClient.from('member_prefs').upsert([Object.assign({ member_id: me.id, updated_at: new Date().toISOString() }, patch)]);
    if (error){ Object.assign(mine, was); apply(); renderPicker(); toast('Couldn\'t change it: ' + error.message); return; }
    writeMine(); toast(okMsg);
  }
  function choose(id){ return setPrefs({ wallpaper_id: id, own_wallpaper_id: null }, id ? 'Wallpaper set. It\'s behind Home in the app too.' : 'Back to the gym\'s picture.'); }
  function chooseOwn(id){ return setPrefs({ wallpaper_id: null, own_wallpaper_id: id }, 'Your photo is behind Home now, in the app too.'); }

  async function ownUpload(file){
    const me = self();
    const blob = await shrink(file, 2200);
    const path = me.id + '/' + randName();
    const { error } = await bnbClient.storage.from(OWN_BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return path;
  }
  async function ownAdd(file){
    const me = self();
    if (ownList().length >= OWN_MAX) return toast('You can keep ' + OWN_MAX + '. Delete one to add another.');
    ownBusy = true; renderPicker(); toast('Uploading…');
    let path = null;
    try {
      path = await ownUpload(file);
      const { data, error } = await bnbClient.from('member_wallpapers').insert([{ member_id: me.id, name: nameFromFile(file) || 'My photo', path }]).select('id').single();
      if (error) throw error;
      ownBusy = false;
      await loadMine();
      await chooseOwn(data.id);
    } catch(e){
      ownBusy = false;
      if (path) bnbClient.storage.from(OWN_BUCKET).remove([path]).catch(() => {});
      renderPicker(); toast('Couldn\'t add it: ' + (e.message || e));
    }
  }
  async function ownReplace(w, file){
    ownBusy = true; renderPicker(); toast('Uploading…');
    let path = null;
    try {
      path = await ownUpload(file);
      const { error } = await bnbClient.from('member_wallpapers').update({ path }).eq('id', w.id);
      if (error) throw error;
      bnbClient.storage.from(OWN_BUCKET).remove([w.path]).catch(() => {});
      ownBusy = false; toast('Photo replaced.'); await loadMine();
    } catch(e){
      ownBusy = false;
      if (path) bnbClient.storage.from(OWN_BUCKET).remove([path]).catch(() => {});
      renderPicker(); toast('Couldn\'t replace it: ' + (e.message || e));
    }
  }
  async function ownRename(w, name){
    const { error } = await bnbClient.from('member_wallpapers').update({ name }).eq('id', w.id);
    if (error) return toast('Couldn\'t rename it: ' + error.message);
    ownEditing = null; toast('Renamed.'); loadMine();
  }
  async function ownDelete(w){
    const { error } = await bnbClient.from('member_wallpapers').delete().eq('id', w.id);
    if (error) return toast('Couldn\'t delete it: ' + error.message);
    bnbClient.storage.from(OWN_BUCKET).remove([w.path]).catch(() => {});
    if (mine.own === w.id) mine.own = null;
    ownEditing = null; toast('Deleted.'); apply(); loadMine();
  }

  function renderPicker(){
    const body = document.getElementById('wallpaper-body');
    if (!body) return;
    const me = self();
    if (!me){ body.innerHTML = '<p class="wp-muted">Sign in to choose a wallpaper.</p>'; return; }
    const walls = rows.filter(r => r.slot === 'wallpaper' && r.active).sort((a, b) => a.sort - b.sort);
    const days = isMine() ? mine.sessions : null;
    const current = chosen(), own = ownList(), ownOn = isMine() && mine.own;
    const gym = first('home');
    const tile = (attrs, src, name, on, locked, hint, extra) =>
      '<div class="wall-tile' + (on ? ' on' : '') + (locked ? ' locked' : '') + '">' +
        '<button type="button" class="wall-pick" ' + attrs + (locked ? ' disabled' : '') + ' aria-pressed="' + on + '">' +
          (src ? '<img alt="" loading="lazy" src="' + esc(src) + '">' : '<span class="wall-none"></span>') +
          (locked ? '<span class="wall-lock" aria-hidden="true">🔒</span>' : '') +
          '<span class="wall-name">' + esc(name) + '</span>' +
          '<span class="wall-hint">' + esc(on ? 'Showing' : hint) + '</span></button>' + (extra || '') + '</div>';
    let html = '<div class="day-head"><h2>Wallpaper</h2><span class="day-sub">The picture behind Home, here and in the app</span></div>';
    if (days != null) html += '<p class="wall-days">You\'ve trained <b>' + days + '</b> ' + (days === 1 ? 'day' : 'days') + ' with a saved Live Session. Some wallpapers open as that number grows.</p>';
    if (loadError) html += '<div class="admin-notice">Could not load the wallpapers: ' + esc(loadError) + '</div>';

    html += '<h3 class="wall-h">The gym\'s</h3><div class="wall-grid">' +
      tile('data-wall=""', gym && gym.tall_url, 'The gym\'s picture', !current && !ownOn, false, 'Default') +
      walls.map(w => {
        const need = w.unlock_sessions, on = !!(current && current.id === w.id);
        const locked = need && (days == null || days < need) && !on;
        const hint = !need ? 'Free' : locked ? (days == null ? 'Train ' + need + ' sessions' : (need - days) + ' more ' + (need - days === 1 ? 'session' : 'sessions')) : 'Earned';
        return tile('data-wall="' + esc(w.id) + '"', w.tall_url, w.name, on, locked, hint);
      }).join('') + '</div>';

    html += '<h3 class="wall-h">Your photos</h3><p class="wall-days">Only you can see these. Portrait photos with calm space at the top work best. Up to ' + OWN_MAX + '.</p><div class="wall-grid">' +
      own.map(w => {
        const on = ownOn === w.id;
        const edit = ownEditing === w.id
          ? '<div class="wall-edit"><input type="text" maxlength="60" value="' + esc(w.name) + '" data-own-name aria-label="Name">' +
              '<div class="wall-edit-row"><button type="button" class="btn2 primary" data-own-save>Save</button><button type="button" class="btn2" data-own-cancel>Cancel</button></div>' +
              '<div class="wall-edit-row"><label class="btn2">Replace photo<input type="file" accept="image/*" data-own-file hidden></label><button type="button" class="btn2 danger" data-own-del>Delete</button></div></div>'
          : '<button type="button" class="wall-editbtn" data-own-edit' + (ownBusy ? ' disabled' : '') + '>Edit</button>';
        return '<div class="wall-own" data-own="' + esc(w.id) + '">' + tile('data-own-pick', w.url, w.name, on, false, 'Yours', edit) + '</div>';
      }).join('') +
      (own.length < OWN_MAX ? '<label class="wall-tile wall-add' + (ownBusy ? ' busy' : '') + '"><span class="wall-none"><span>＋</span></span><span class="wall-name">' + (ownBusy ? 'Uploading…' : 'Add your photo') + '</span>' +
        '<input type="file" accept="image/*" data-own-add hidden' + (ownBusy ? ' disabled' : '') + '></label>' : '') +
      '</div>';
    body.innerHTML = html;

    body.querySelectorAll('[data-wall]').forEach(b => b.onclick = () => choose(b.dataset.wall || null));
    const add = body.querySelector('[data-own-add]');
    if (add) add.onchange = () => { const f = add.files && add.files[0]; add.value = ''; if (f) ownAdd(f); };
    body.querySelectorAll('[data-own]').forEach(el => {
      const w = own.find(x => x.id === el.dataset.own);
      const q = s => el.querySelector(s);
      q('[data-own-pick]').onclick = () => { if (mine.own !== w.id) chooseOwn(w.id); };
      if (q('[data-own-edit]')) q('[data-own-edit]').onclick = () => { ownEditing = w.id; renderPicker(); const i = body.querySelector('[data-own="' + w.id + '"] [data-own-name]'); if (i) i.focus(); };
      if (!q('[data-own-name]')) return;
      q('[data-own-cancel]').onclick = () => { ownEditing = null; renderPicker(); };
      q('[data-own-save]').onclick = () => {
        const v = q('[data-own-name]').value.trim();
        if (!v) return toast('Give it a name.');
        if (v === w.name){ ownEditing = null; renderPicker(); } else ownRename(w, v);
      };
      q('[data-own-name]').onkeydown = e => { if (e.key === 'Enter') q('[data-own-save]').click(); };
      q('[data-own-file]').onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f){ ownEditing = null; ownReplace(w, f); } };
      const del = q('[data-own-del]');
      del.onclick = () => { if (del.dataset.sure !== '1'){ del.dataset.sure = '1'; del.textContent = 'Tap again to delete'; return; } ownDelete(w); };
    });
  }

  window.bnbWallpaperOnShown = function(){ renderPicker(); load().then(loadMine); };
  document.addEventListener('bnb-auth-changed', e => {
    if (e.detail && e.detail.signedIn) loadMine();
    else { mine = {}; ownEditing = null; writeMine(); apply(); }
  });

  window.bnbBackdropsOnTabShown = function(){ render(); load(); };
  window.BNB_BACKDROPS = { rows: () => rows.slice(), first, pic, reload: load };

  try { localStorage.removeItem('bnb-wallpaper-v1'); } catch(e){}
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true }); else load();
})();
