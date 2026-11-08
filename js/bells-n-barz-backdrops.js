(function(){

  // Backgrounds (sql/107-app-backdrops.sql): the pictures behind the site
  // and the app. They start as drawn placeholders in img/backdrops/;
  // Admin > Backgrounds adds, edits, moves, previews and deletes them, and
  // sets the gym's default for members (sql/110).
  //
  // Members choose under Member > Me > Wallpaper: where it shows (Home only,
  // everywhere, or page by page), whether it changes on its own, and how
  // strong it is (sql/110). Some wallpapers are earned with training days
  // (sql/108), and members can put up photos of their own, private to them
  // (sql/109). The app reads the same settings and works out the same
  // picture, so a timed rotation matches on both.
  //
  // A gym picture can carry a short looping clip (sql/111). It plays only on
  // Home, only for people following the gym's default (and visitors), and not
  // for anyone who asks the browser for less motion or less data; the photo
  // is the still underneath.
  //
  // Pages here map to the app's tabs: the site's Home is Home; in Gym, the
  // manual and Live Session are Workout, Booking is Book, Messages and
  // Notifications are Chat; everything else is More. The sign-in page
  // always shows the gym's sign-in picture.

  const CACHE_KEY = 'bnb-backdrops-v1';
  const DEF_KEY = 'bnb-backdrop-default-v1';
  const MINE_KEY = 'bnb-wallpaper-v3';
  const OPENS_KEY = 'bnb-wallpaper-opens';
  const BUCKET = 'backdrops';
  const OWN_BUCKET = 'member-wallpapers';
  const OWN_MAX = 12;
  const VIDEO_MB = 20, VIDEO_SECS = 20;
  const SLOTS = [
    { key: 'home', name: 'Home', desc: 'The gym\'s Home picture. The first one that\'s on is used, unless a member (or the default below) picks something else.' },
    { key: 'signin', name: 'Sign-in', desc: 'Behind the sign-in screen. Everyone sees it, signed in or not.' },
    { key: 'wallpaper', name: 'Wallpapers', desc: 'Backgrounds members choose from on their Wallpaper page. Set "Unlocks after" to make one a reward for that many sessions.' }
  ];
  const SLOT_NAME = { home: 'Home', signin: 'Sign-in', wallpaper: 'Wallpapers' };
  const PAGES = [['home', 'Home'], ['workout', 'Workout'], ['book', 'Book'], ['chat', 'Chat'], ['more', 'More']];
  const PAGE_I = { home: 0, workout: 1, book: 2, chat: 3, more: 4 };
  const STRENGTH = { subtle: 0.6, normal: 1, bold: 1.35 };
  const EVERY = [['open', 'Each visit'], ['hour', 'Hourly'], ['day', 'Daily'], ['week', 'Weekly']];
  const BUILTIN = { where: 'home', strength: 'normal', main: { mode: 'default' } };
  const WORKOUT_TABS = ['tab-session', 'tab-overview', 'tab-mon', 'tab-tue', 'tab-wed', 'tab-thu', 'tab-fri', 'tab-sat', 'tab-sun', 'tab-appendix', 'tab-log'];

  let rows = readJSON(CACHE_KEY, []);
  if (!Array.isArray(rows)) rows = [];
  let defaults = readJSON(DEF_KEY, null);      // the gym's default settings
  let loaded = false, loadError = '';
  const busy = {};
  let adding = null;          // the slot whose Add form is open
  // The signed-in member: { uid, settings, sessions, mineList: [{id, name, path, url, exp}] }.
  let mine = readJSON(MINE_KEY, {}) || {};
  if (!mine.uid) mine = {};
  let ownEditing = null, ownBusy = false, ownProgress = '';
  const ui = { member: 'home', admin: 'home' };   // which page each editor is showing
  // Each visit counts once, for "each visit" rotation. Per device, like the app's.
  let opens = 0;
  try { opens = (parseInt(localStorage.getItem(OPENS_KEY), 10) || 0) + 1; localStorage.setItem(OPENS_KEY, String(opens)); } catch(e){}

  function readJSON(k, dflt){ try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? dflt : v; } catch(e){ return dflt; } }
  function writeJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function writeCache(){ writeJSON(CACHE_KEY, rows.filter(r => r.active)); }
  function writeMine(){ writeJSON(MINE_KEY, mine); }
  function self(){ return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf(); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
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
  function days(){ return isMine() ? (mine.sessions || 0) : 0; }
  function walls(){ return rows.filter(r => r.slot === 'wallpaper' && r.active).sort((a, b) => a.sort - b.sort); }
  function earned(w){ return !w.unlock_sessions || days() >= w.unlock_sessions; }

  // ---- working out the picture ----
  // A picture by its ref: "home" (the gym's Home picture), "g:<id>" (a gym wallpaper), "o:<id>" (their own photo).
  function refPic(ref, ownOk){
    if (ref === 'home'){ const r = first('home'); return r ? { tall: r.tall_url, wide: r.wide_url, video: r.video_url } : null; }
    if (typeof ref !== 'string') return null;
    if (ref.startsWith('g:')){ const r = walls().find(x => x.id === ref.slice(2)); return r ? { tall: r.tall_url, wide: r.wide_url, video: r.video_url } : null; }
    if (ref.startsWith('o:') && ownOk){ const o = ownList().find(x => x.id === ref.slice(2) && x.url && x.exp > Date.now()); return o ? { tall: o.url, wide: null } : null; }
    return null;
  }
  // Everything a rotation with nothing ticked goes through: what they've earned, and their own photos.
  function everything(ownOk){
    return walls().filter(earned).map(w => 'g:' + w.id).concat(ownOk ? ownList().map(o => 'o:' + o.id) : []);
  }
  function tick(every, page, perPage){
    const local = Date.now() - new Date().getTimezoneOffset() * 60000;
    const day = Math.floor(local / 86400000);
    const n = every === 'hour' ? Math.floor(local / 3600000) : every === 'day' ? day : every === 'week' ? Math.floor((day + 3) / 7) : opens;
    return n + (perPage ? PAGE_I[page] : 0);
  }
  function pickOf(s, page){
    if (!s) return null;
    if (s.where === 'all') return s.main || { mode: 'default' };
    if (s.where === 'pages') return (s.pages && s.pages[page]) || { mode: 'default' };
    return page === 'home' ? (s.main || { mode: 'default' }) : { mode: 'none' };
  }
  // undefined = "not decided here, ask the next layer".
  function resolvePick(p, page, s, ownOk){
    if (!p || p.mode === 'default') return undefined;
    if (p.mode === 'none') return null;
    if (p.mode === 'fixed') return refPic(p.ref, ownOk) || undefined;
    if (p.mode === 'rotate'){
      const list = (p.set && p.set.length ? p.set : everything(ownOk)).filter(r => refPic(r, ownOk));
      if (!list.length) return undefined;
      return refPic(list[tick(p.every, page, s.where === 'pages') % list.length], ownOk);
    }
    return undefined;
  }
  // The member's settings first. Where they leave a page on "the gym's choice", that's the gym's
  // picture for the page (whatever the gym's own "where" says), and failing that the Home picture.
  // Members following the gym get the gym's default as it stands.
  function effective(){ return (isMine() && mine.settings) || defaults || BUILTIN; }
  function resolve(page){
    if (isMine() && mine.settings){
      const m = mine.settings;
      const r = resolvePick(pickOf(m, page), page, m, true);
      if (r !== undefined) return r;
      if (defaults){
        const g = defaults.where === 'pages' ? (defaults.pages || {})[page] : defaults.main;
        const r2 = resolvePick(g, page, defaults, false);
        if (r2 !== undefined) return r2;
      }
      return refPic('home');
    }
    const s = defaults || BUILTIN;
    const r = resolvePick(pickOf(s, page), page, s, false);
    return r !== undefined ? r : refPic('home');
  }

  function pageKey(){
    const s = document.documentElement.dataset.scene;
    if (s === 'users') return 'signin';
    if (s === 'home') return 'home';
    if (s !== 'gym') return 'more';
    const on = id => { const el = document.getElementById(id); return !!(el && el.classList.contains('active') && el.offsetParent !== null); };
    if (on('tab-schedule')) return 'book';
    if (on('tab-messages') || on('tab-inbox')) return 'chat';
    if (WORKOUT_TABS.some(on)) return 'workout';
    return 'more';
  }

  // ---- showing it ----
  function cssUrl(u){ return u ? 'url("' + String(u).replace(/["\\\n]/g, '') + '")' : 'none'; }
  let lastApplied = '';
  function apply(){
    const root = document.documentElement;
    const page = pageKey();
    let pic, op;
    if (page === 'signin'){ const r = first('signin'); pic = r && { tall: r.tall_url, wide: r.wide_url }; op = 0.55; }
    else {
      pic = resolve(page);
      // Busy pages get a fainter picture so lists stay readable.
      op = 0.55 * (STRENGTH[effective().strength] || 1) * (page === 'home' ? 1 : 0.6);
    }
    // "Living photos": a slow drift and zoom (css: html.bd-motion; still under reduce-motion).
    const motion = page !== 'signin' && effective().motion === 'gentle';
    // A clip plays on Home for people following the gym, unless they want less motion or data.
    const following = !(isMine() && mine.settings);
    const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches || !!(navigator.connection && navigator.connection.saveData);
    const video = page === 'home' && following && !quiet && pic && pic.video ? pic.video : '';
    setVideo(video);
    const sig = page + '|' + (pic ? pic.tall + '|' + pic.wide : '') + '|' + op + '|' + motion + '|' + video;
    if (sig === lastApplied) return;
    lastApplied = sig;
    root.style.setProperty('--bd-wide', cssUrl(pic && (pic.wide || pic.tall)));
    root.style.setProperty('--bd-tall', cssUrl(pic && pic.tall));
    root.style.setProperty('--bd-op', String(Math.min(0.85, op).toFixed(3)));
    root.classList.toggle('has-bd', !!pic);
    root.classList.toggle('bd-motion', !!pic && motion && !video);
  }
  // The clip layer, made when first needed; it sits over the photo, which shows until it plays.
  function setVideo(url){
    let v = document.querySelector('body > .site-backdrop-video');
    if (!url){ if (v){ v.pause(); v.removeAttribute('src'); v.load(); v.remove(); } document.documentElement.classList.remove('has-bdv'); return; }
    if (!document.body) return;
    if (!v){
      v = document.createElement('video');
      v.className = 'site-backdrop-video'; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute('aria-hidden', 'true'); v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'auto';
      v.addEventListener('playing', () => document.documentElement.classList.add('has-bdv'));
      v.addEventListener('error', () => document.documentElement.classList.remove('has-bdv'));
      document.body.insertBefore(v, document.body.firstChild);
    }
    if (v.getAttribute('src') !== url){ document.documentElement.classList.remove('has-bdv'); v.src = url; }
    if (!document.hidden) v.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', () => {
    const v = document.querySelector('body > .site-backdrop-video');
    if (v){ if (document.hidden) v.pause(); else v.play().catch(() => {}); }
  });
  let applyQueued = false;
  function applySoon(){ if (applyQueued) return; applyQueued = true; requestAnimationFrame(() => { applyQueued = false; apply(); }); }

  async function load(){
    if (typeof bnbClient === 'undefined') return;
    const [res, def] = await Promise.all([
      bnbClient.from('app_backdrops').select('id, slot, name, tall_url, wide_url, video_url, unlock_sessions, sort, active, placeholder, updated_at').order('slot').order('sort'),
      bnbClient.from('app_backdrop_defaults').select('settings').eq('id', 1).maybeSingle()
    ]);
    if (!def.error){ defaults = (def.data && def.data.settings) || null; writeJSON(DEF_KEY, defaults); }
    if (res.error){ loadError = res.error.message; console.warn('Backgrounds not loaded:', res.error.message); render(); renderPicker(); return; }
    rows = res.data || []; loaded = true; loadError = '';
    writeCache(); lastApplied = ''; apply(); render(); renderPicker();
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
  function bucketPath(url){
    const mark = '/storage/v1/object/public/' + BUCKET + '/';
    const i = String(url || '').indexOf(mark);
    return i < 0 ? null : decodeURIComponent(String(url).slice(i + mark.length));
  }
  // Removes files nothing points at any more. Failures only leave a stray file.
  async function dropFiles(urls){
    const used = new Set(rows.flatMap(r => [r.tall_url, r.wide_url, r.video_url]));
    const paths = urls.filter(u => u && !used.has(u)).map(bucketPath).filter(Boolean);
    if (paths.length) await bnbClient.storage.from(BUCKET).remove(paths).catch(() => {});
  }

  // ---- clips ----
  // Reads a clip's length and shape before it goes up, so a too-long or too-big one is refused here.
  function clipInfo(file){
    return new Promise((resolve, reject) => {
      const v = document.createElement('video'), url = URL.createObjectURL(file);
      v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = () => { const r = { secs: v.duration, w: v.videoWidth, h: v.videoHeight }; URL.revokeObjectURL(url); resolve(r); };
      v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn\'t a video this browser can play. Use MP4.')); };
      v.src = url;
    });
  }
  async function checkClip(file){
    if (!/^video\/(mp4|webm)$/.test(file.type)) throw new Error('Use an MP4 (or WebM) video.');
    const mb = file.size / 1048576;
    if (mb > VIDEO_MB) throw new Error('That clip is ' + mb.toFixed(1) + ' MB. Keep it under ' + VIDEO_MB + ' MB: trim it shorter or save it at 720p/HD, not 4K.');
    const info = await clipInfo(file);
    if (!isFinite(info.secs) || info.secs > VIDEO_SECS) throw new Error('That clip is ' + Math.round(info.secs) + ' seconds. Keep it to ' + VIDEO_SECS + ' or less (6–12 is best).');
    return info;
  }
  async function uploadClip(file){
    const path = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + (file.type === 'video/webm' ? '.webm' : '.mp4');
    const { error } = await bnbClient.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw error;
    return bnbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  // A still from about a second in, for a picture added with only a clip.
  function frameFrom(file){
    return new Promise((resolve, reject) => {
      const v = document.createElement('video'), url = URL.createObjectURL(file);
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); };
      v.onseeked = () => {
        const k = Math.min(1, 2200 / Math.max(v.videoWidth, v.videoHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(new File([b], 'still.jpg', { type: 'image/jpeg' })) : reject(new Error('Could not take a still from that clip.')), 'image/jpeg', 0.86);
      };
      v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn\'t a video this browser can play. Use MP4.')); };
      v.src = url;
    });
  }
  const CLIP_HELP = '<details class="bd-cliphelp"><summary>Video clips: how to make a good one</summary><ul>' +
    '<li><b>Short:</b> 6 to 12 seconds, up to ' + VIDEO_SECS + '. It loops, so a clip that ends where it starts looks best.</li>' +
    '<li><b>Small:</b> under ' + VIDEO_MB + ' MB, ideally 3 to 8. On the phone, trim it in Gallery (Edit &gt; trim) and save at 720p or HD, never 4K.</li>' +
    '<li><b>Upright:</b> filmed in portrait for phones. Hold still or use a stand; let the movement come from the scene.</li>' +
    '<li><b>Slow:</b> chalk drifting, a bar being racked, a rope swaying, light through a window. Nothing fast or flashing: it sits behind text.</li>' +
    '<li><b>Calm at the top:</b> the greeting and cards sit over the top half.</li>' +
    '<li><b>No faces</b> unless the person has agreed. Sound is never played.</li>' +
    '<li>It plays only on Home, for members following the gym default (set it above) and website visitors. Phones download it on Wi-Fi only; until then, and on battery saver, the photo shows.</li>' +
    '</ul></details>';

  // ---- the settings editor (members' page and the admin default) ----
  // ctx: { who: 'member' | 'admin', s: settings }
  function pickLabel(p, who){
    if (!p || p.mode === 'default') return who === 'admin' ? 'Standard' : 'The gym\'s choice';
    if (p.mode === 'none') return 'No picture';
    if (p.mode === 'fixed') return 'One picture';
    return 'Changes ' + ((EVERY.find(e => e[0] === p.every) || EVERY[2])[1]).toLowerCase();
  }
  function seg(name, opts, cur, attr){
    return '<div class="wall-seg" role="group" aria-label="' + esc(name) + '">' +
      opts.map(([v, l]) => '<button type="button" ' + attr + '="' + v + '" aria-pressed="' + (v === cur) + '"' + (v === cur ? ' class="on"' : '') + '>' + esc(l) + '</button>').join('') + '</div>';
  }
  function tileHtml(ref, src, name, state, hint, locked){
    // state: 'on' | 'tick' | ''
    return '<div class="wall-tile' + (state === 'on' ? ' on' : '') + (state === 'tick' ? ' ticked' : '') + (locked ? ' locked' : '') + '">' +
      '<button type="button" class="wall-pick" data-ed-ref="' + esc(ref) + '"' + (locked ? ' disabled' : '') + ' aria-pressed="' + (state !== '') + '">' +
        (src ? '<img alt="" loading="lazy" src="' + esc(src) + '">' : '<span class="wall-none"></span>') +
        (locked ? '<span class="wall-lock" aria-hidden="true">🔒</span>' : '') +
        (state === 'tick' ? '<span class="wall-check" aria-hidden="true">✓</span>' : '') +
        '<span class="wall-name">' + esc(name) + '</span>' +
        '<span class="wall-hint">' + esc(hint) + '</span></button></div>';
  }
  function editorHtml(ctx){
    const s = ctx.s, who = ctx.who, admin = who === 'admin';
    const page = ui[who];
    const target = s.where === 'pages' ? (s.pages && s.pages[page]) || { mode: 'default' } : s.main || { mode: 'default' };
    let h = '<div class="wall-ed" data-ed="' + who + '">';
    h += '<h4>Where it shows</h4>' + seg('Where', [['home', 'Home only'], ['all', 'Everywhere'], ['pages', 'Page by page']], s.where || 'home', 'data-ed-where');
    h += '<h4>How strong</h4>' + seg('Strength', [['subtle', 'Subtle'], ['normal', 'Normal'], ['bold', 'Bold']], s.strength || 'normal', 'data-ed-strength');
    h += '<h4>Motion</h4>' + seg('Motion', [['off', 'Still'], ['gentle', 'Gentle drift']], s.motion || 'off', 'data-ed-motion');
    if (s.where === 'pages'){
      h += '<h4>Page</h4><div class="wall-seg wall-pages">' + PAGES.map(([k, l]) => {
        const p = (s.pages && s.pages[k]) || { mode: 'default' };
        return '<button type="button" data-ed-page="' + k + '"' + (k === page ? ' class="on"' : '') + ' aria-pressed="' + (k === page) + '">' + esc(l) + '<small>' + esc(pickLabel(p, who)) + '</small></button>';
      }).join('') + '</div>';
    }
    h += '<h4>' + (s.where === 'pages' ? esc(PAGES.find(p => p[0] === page)[1]) + ' shows' : 'Picture') + '</h4>';
    const modes = [['default', admin ? 'Standard' : 'The gym\'s choice'], ['fixed', 'One picture'], ['rotate', 'Changes on its own']];
    if (s.where !== 'home') modes.splice(1, 0, ['none', 'No picture']);
    h += seg('Mode', modes, target.mode || 'default', 'data-ed-mode');
    if (target.mode === 'default') h += '<p class="wall-days">' + (admin ? 'The gym\'s Home picture (Admin > Backgrounds, Home).' : 'The gym\'s picture for this page. It changes if the gym changes it.') + '</p>';
    if (target.mode === 'none') h += '<p class="wall-days">The plain texture and colour, no picture.</p>';
    if (target.mode === 'fixed' || target.mode === 'rotate'){
      const rot = target.mode === 'rotate';
      if (rot){
        h += '<h4>How often</h4>' + seg('How often', EVERY, target.every || 'day', 'data-ed-every');
        h += '<p class="wall-days">' + (target.set && target.set.length ? 'Going through the ' + target.set.length + ' ticked. <button type="button" class="linkish" data-ed-clear>Use everything instead</button>'
          : 'Going through everything' + (admin ? ' that isn\'t locked' : ' you\'ve unlocked' + (who === 'member' ? ', your photos included' : '')) + '. Tick some to choose.') + '</p>';
      }
      const set = rot ? (target.set || []) : [];
      const st = ref => rot ? (set.includes(ref) ? 'tick' : '') : (target.ref === ref ? 'on' : '');
      const gym = first('home');
      h += '<div class="wall-grid">';
      if (!rot) h += tileHtml('home', gym && gym.tall_url, 'The gym\'s Home picture', st('home'), st('home') ? 'Chosen' : 'Gym', false);
      walls().forEach(w => {
        const ref = 'g:' + w.id, need = w.unlock_sessions;
        const locked = !admin && need && days() < need && !st(ref);
        const hint = st(ref) ? (rot ? 'In the mix' : 'Chosen') : !need ? 'Free' : admin ? 'Earned · ' + need : locked ? (need - days()) + ' more ' + (need - days() === 1 ? 'session' : 'sessions') : 'Earned';
        h += tileHtml(ref, w.tall_url, w.name, st(ref), hint + (admin && w.video_url ? ' · Video' : ''), locked);
      });
      if (!admin) ownList().forEach(o => { const ref = 'o:' + o.id; h += tileHtml(ref, o.url, o.name, st(ref), st(ref) ? (rot ? 'In the mix' : 'Chosen') : 'Yours', false); });
      h += '</div>';
    }
    return h + '</div>';
  }
  function bindEditor(root, ctx, save){
    const s = ctx.s, who = ctx.who;
    const el = root.querySelector('[data-ed="' + who + '"]');
    if (!el) return;
    const target = () => {
      if (s.where === 'pages'){ s.pages = s.pages || {}; return (s.pages[ui[who]] = s.pages[ui[who]] || { mode: 'default' }); }
      return (s.main = s.main || { mode: 'default' });
    };
    el.querySelectorAll('[data-ed-where]').forEach(b => b.onclick = () => {
      s.where = b.dataset.edWhere;
      if (s.where === 'home' && s.main && s.main.mode === 'none') s.main = { mode: 'default' };
      save(s);
    });
    el.querySelectorAll('[data-ed-strength]').forEach(b => b.onclick = () => { s.strength = b.dataset.edStrength; save(s); });
    el.querySelectorAll('[data-ed-motion]').forEach(b => b.onclick = () => { s.motion = b.dataset.edMotion; save(s); });
    el.querySelectorAll('[data-ed-page]').forEach(b => b.onclick = () => { ui[who] = b.dataset.edPage; who === 'admin' ? render() : renderPicker(); });
    el.querySelectorAll('[data-ed-mode]').forEach(b => b.onclick = () => {
      const t = target(), m = b.dataset.edMode;
      if (t.mode === m) return;
      t.mode = m;
      if (m === 'rotate'){ t.every = t.every || 'day'; t.set = t.set || []; delete t.ref; }
      // Starts on the gym's Home picture; they tap another to change it.
      if (m === 'fixed'){ delete t.set; delete t.every; t.ref = t.ref || 'home'; }
      if (m === 'default' || m === 'none'){ delete t.ref; delete t.set; delete t.every; }
      save(s);
    });
    el.querySelectorAll('[data-ed-every]').forEach(b => b.onclick = () => { target().every = b.dataset.edEvery; save(s); });
    const clr = el.querySelector('[data-ed-clear]');
    if (clr) clr.onclick = () => { target().set = []; save(s); };
    el.querySelectorAll('[data-ed-ref]').forEach(b => b.onclick = () => {
      const t = target(), ref = b.dataset.edRef;
      if (t.mode === 'rotate'){
        t.set = t.set || [];
        t.set = t.set.includes(ref) ? t.set.filter(x => x !== ref) : t.set.concat([ref]);
      } else { if (t.ref === ref) return; t.mode = 'fixed'; t.ref = ref; }
      save(s);
    });
  }
  // A fresh start for a member: the gym's layout and strength, every picture following the gym.
  function startFrom(d){ return { where: (d && d.where) || 'home', strength: (d && d.strength) || 'normal', motion: (d && d.motion) || 'off', main: { mode: 'default' }, pages: {} }; }

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
  async function saveDefault(s){
    const was = defaults;
    defaults = clone(s); lastApplied = ''; apply(); render();
    const { error } = await bnbClient.from('app_backdrop_defaults').update({ settings: defaults }).eq('id', 1);
    if (error){ defaults = was; lastApplied = ''; apply(); render(); toast('Couldn\'t save the default: ' + error.message); return; }
    writeJSON(DEF_KEY, defaults); toast('Gym default saved. Members who haven\'t set their own see it next time they open.');
  }

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
      '</div><p class="bd-help">Roughly how it sits behind Home: darkened and faded so the cards stay readable. Other pages show it fainter.</p></div>';
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
          (r.slot === 'wallpaper' && r.unlock_sessions ? '<span class="bd-tag">Earned · ' + esc(r.unlock_sessions) + '</span>' : '') +
          (r.video_url ? '<span class="bd-tag">Video</span>' : '') + '</div>' +
        (r.video_url ? '<video class="bd-clip" src="' + esc(r.video_url) + '" muted loop playsinline preload="metadata"></video>' : '') +
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
          '<label class="btn2' + (dis ? ' disabled' : '') + '">' + (r.video_url ? 'Replace video' : 'Add video') + '<input type="file" accept="video/mp4,video/webm" data-bd-video hidden' + dis + '></label>' +
          (r.video_url ? '<button type="button" class="btn2" data-bd-novideo' + dis + '>Remove video</button>' : '') +
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
      '<label>Phone photo (portrait)<input type="file" name="tall" accept="image/*"></label>' +
      '<label>Wide photo, for computers (optional)<input type="file" name="wide" accept="image/*"></label>' +
      (slot === 'wallpaper' ? '<label>Unlocks after (sessions, blank = free)<input type="number" name="unlock" min="1" max="10000"></label>' : '') +
      '<label>Video clip (optional; with no photo, a still is taken from it)<input type="file" name="video" accept="video/mp4,video/webm"></label>' +
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
    if (admin){
      html += '<div class="bd-slot"><div class="bd-slot-head"><h3>Gym default for members</h3><span>What members see until they set their own on their Wallpaper page, and what visitors see on the website. Locked wallpapers chosen here show to everyone; a rotation through "everything" skips the ones a member hasn\'t earned.</span></div>' +
        editorHtml({ who: 'admin', s: clone(defaults || BUILTIN) }) + '</div>';
    }
    html += '<p class="bd-help">Phone photos work best in portrait with calm space in the top half (the greeting and cards sit there). The wide photo is for computers; without one, the phone photo is used. Photos are shrunk before uploading, and deleting or replacing one removes the old file. Changes reach the app the next time it opens.</p>' + (admin ? CLIP_HELP : '');
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
    bindEditor(body, { who: 'admin', s: clone(defaults || BUILTIN) }, saveDefault);

    body.querySelectorAll('[data-bd-add]').forEach(b => b.onclick = () => { adding = b.dataset.bdAdd; render(); const f = body.querySelector('[data-bd-addform] input[name=name]'); if (f) f.focus(); });
    body.querySelectorAll('[data-bd-addform]').forEach(form => {
      form.querySelector('[data-bd-addcancel]').onclick = () => { adding = null; render(); };
      form.onsubmit = async e => {
        e.preventDefault();
        const slot = form.dataset.bdAddform, fd = new FormData(form);
        let tall = fd.get('tall');
        const wide = fd.get('wide'), clip = fd.get('video');
        const hasClip = clip && clip.size;
        if ((!tall || !tall.size) && !hasClip) return toast('Choose a phone photo, or a video clip.');
        const name = String(fd.get('name') || '').trim() || nameFromFile(tall && tall.size ? tall : clip) || 'New picture';
        const n = parseInt(fd.get('unlock'), 10);
        form.querySelectorAll('button, input').forEach(x => x.disabled = true);
        toast('Uploading…');
        const uploaded = [];
        try {
          if (hasClip) await checkClip(clip);
          if (!tall || !tall.size) tall = await frameFrom(clip);
          const tallUrl = await upload(tall); uploaded.push(tallUrl);
          const wideUrl = wide && wide.size ? await upload(wide) : null; if (wideUrl) uploaded.push(wideUrl);
          if (hasClip) toast('Uploading the video…');
          const videoUrl = hasClip ? await uploadClip(clip) : null; if (videoUrl) uploaded.push(videoUrl);
          const sort = slotList(slot).reduce((m, r) => Math.max(m, r.sort), -1) + 1;
          const { error } = await bnbClient.from('app_backdrops').insert([{ slot, name, tall_url: tallUrl, wide_url: wideUrl, video_url: videoUrl, sort, unlock_sessions: slot === 'wallpaper' && n > 0 ? n : null }]);
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
      const vin = el.querySelector('[data-bd-video]');
      vin.addEventListener('change', async () => {
        const file = vin.files && vin.files[0]; vin.value = '';
        if (!file) return;
        const before = r.video_url;
        let url = null;
        try {
          await checkClip(file);
          busy[id] = true; render(); toast('Uploading the video…');
          url = await uploadClip(file); busy[id] = false;
          if (await save(id, { video_url: url }, before ? 'Video replaced.' : 'Video added. It plays on Home for members following the gym default.')) dropFiles([before]);
          else dropFiles([url]);
        } catch(e){ busy[id] = false; render(); if (url) dropFiles([url]); toast('Couldn\'t add the video: ' + (e.message || e)); }
      });
      const noVid = el.querySelector('[data-bd-novideo]');
      if (noVid) noVid.onclick = async () => { const before = r.video_url; if (await save(id, { video_url: null }, 'Video removed. The photo shows instead.')) dropFiles([before]); };
      const clipEl = el.querySelector('.bd-clip');
      if (clipEl){ clipEl.onmouseenter = () => clipEl.play().catch(() => {}); clipEl.onmouseleave = () => clipEl.pause(); clipEl.onclick = () => clipEl.paused ? clipEl.play().catch(() => {}) : clipEl.pause(); }

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
        await dropFiles([r.tall_url, r.wide_url, r.video_url]);
        toast('Deleted.'); load();
      };
    });
  }

  // ---- Member > Me > Wallpaper ----
  async function loadMine(){
    const me = self();
    if (!me || typeof bnbClient === 'undefined') return;
    const [dayRes, pref, own] = await Promise.all([
      bnbClient.rpc('my_session_days'),
      bnbClient.from('member_prefs').select('wallpaper_settings').eq('member_id', me.id).maybeSingle(),
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
      settings: (pref.data && pref.data.wallpaper_settings) || null,
      sessions: dayRes.error ? (mine.uid === me.id ? mine.sessions : 0) : (dayRes.data || 0),
      mineList: list.map(w => {
        if (signed[w.path]) return { id: w.id, name: w.name, path: w.path, url: signed[w.path], exp: Date.now() + 86400e3 };
        const o = old.find(x => x.id === w.id && x.path === w.path) || {};
        return { id: w.id, name: w.name, path: w.path, url: o.url || null, exp: o.exp || 0 };
      })
    };
    writeMine(); lastApplied = ''; apply(); renderPicker();
  }

  async function saveMine(s){
    const me = self();
    if (!me) return;
    const was = mine.settings;
    mine.uid = me.id; mine.settings = s ? clone(s) : null; lastApplied = ''; apply(); renderPicker();
    const { error } = await bnbClient.from('member_prefs').upsert([{ member_id: me.id, wallpaper_settings: mine.settings, updated_at: new Date().toISOString() }]);
    if (error){ mine.settings = was; lastApplied = ''; apply(); renderPicker(); toast('Couldn\'t change it: ' + error.message); return; }
    writeMine();
  }
  // Points the setting being edited at a photo they just added, so it shows straight away.
  function showOwn(id){
    const s = clone(mine.settings || startFrom(defaults));
    const t = s.where === 'pages' ? ((s.pages = s.pages || {})[ui.member] = {}) : (s.main = {});
    t.mode = 'fixed'; t.ref = 'o:' + id;
    return saveMine(s);
  }

  async function ownUpload(file){
    const me = self();
    const blob = await shrink(file, 2200);
    const path = me.id + '/' + randName();
    const { error } = await bnbClient.storage.from(OWN_BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return path;
  }
  // One photo goes straight up; several just join "Your photos" for them to tick or pick.
  async function ownAdd(files){
    const me = self();
    const room = OWN_MAX - ownList().length;
    if (room <= 0) return toast('You can keep ' + OWN_MAX + '. Delete one to add another.');
    const take = files.slice(0, room), skipped = files.length - take.length;
    ownBusy = true;
    let added = 0, lastId = null, failed = '';
    for (const file of take){
      ownProgress = take.length > 1 ? 'Uploading ' + (added + 1) + ' of ' + take.length + '…' : 'Uploading…';
      renderPicker();
      let path = null;
      try {
        path = await ownUpload(file);
        const { data, error } = await bnbClient.from('member_wallpapers').insert([{ member_id: me.id, name: nameFromFile(file) || 'My photo', path }]).select('id').single();
        if (error) throw error;
        added++; lastId = data.id;
      } catch(e){
        if (path) bnbClient.storage.from(OWN_BUCKET).remove([path]).catch(() => {});
        failed = (e.message || String(e)); break;
      }
    }
    ownBusy = false; ownProgress = '';
    await loadMine();
    if (added === 1 && take.length === 1) await showOwn(lastId);
    const extra = (skipped > 0 ? ' ' + skipped + ' left out: you can keep ' + OWN_MAX + '.' : '') + (failed ? ' Stopped: ' + failed : '');
    if (!added) return toast('Couldn\'t add it: ' + failed);
    toast((added === 1 && take.length === 1 ? 'Added, and showing now.' : 'Added ' + added + '. Tick them under "Changes on its own" to rotate them, or pick one.') + extra);
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
    ownEditing = null; toast('Deleted.'); loadMine();
  }

  function renderPicker(){
    const body = document.getElementById('wallpaper-body');
    if (!body) return;
    const me = self();
    if (!me){ body.innerHTML = '<p class="wp-muted">Sign in to choose a wallpaper.</p>'; return; }
    const own = ownList(), mineSet = isMine() && mine.settings;
    const s = clone(mineSet || startFrom(defaults));
    let html = '<div class="day-head"><h2>Wallpaper</h2><span class="day-sub">The picture behind the pages, here and in the app</span></div>';
    if (isMine()) html += '<p class="wall-days">You\'ve trained <b>' + days() + '</b> ' + (days() === 1 ? 'day' : 'days') + ' with a saved Live Session. Locked wallpapers open as that number grows.</p>';
    if (loadError) html += '<div class="admin-notice">Could not load the wallpapers: ' + esc(loadError) + '</div>';
    html += '<p class="wall-follow">' + (mineSet ? 'You\'re using your own setting. <button type="button" class="linkish" data-wall-reset>Go back to the gym\'s</button>'
      : 'You\'re following the gym\'s setting. Change anything below to make it yours.') + '</p>';
    html += editorHtml({ who: 'member', s });

    html += '<h3 class="wall-h">Your photos</h3><p class="wall-days">Only you can see these. Portrait photos with calm space at the top work best. Add several at once if you like. Up to ' + OWN_MAX + '.</p><div class="wall-grid">' +
      own.map(w => {
        const edit = ownEditing === w.id
          ? '<div class="wall-edit"><input type="text" maxlength="60" value="' + esc(w.name) + '" data-own-name aria-label="Name">' +
              '<div class="wall-edit-row"><button type="button" class="btn2 primary" data-own-save>Save</button><button type="button" class="btn2" data-own-cancel>Cancel</button></div>' +
              '<div class="wall-edit-row"><label class="btn2">Replace photo<input type="file" accept="image/*" data-own-file hidden></label><button type="button" class="btn2 danger" data-own-del>Delete</button></div></div>'
          : '<button type="button" class="wall-editbtn" data-own-edit' + (ownBusy ? ' disabled' : '') + '>Edit</button>';
        return '<div class="wall-own wall-tile" data-own="' + esc(w.id) + '">' +
          (w.url ? '<img alt="" loading="lazy" src="' + esc(w.url) + '">' : '<span class="wall-none"></span>') +
          '<span class="wall-name">' + esc(w.name) + '</span>' + edit + '</div>';
      }).join('') +
      (own.length < OWN_MAX ? '<label class="wall-tile wall-add' + (ownBusy ? ' busy' : '') + '"><span class="wall-none"><span>＋</span></span><span class="wall-name">' + (ownBusy ? esc(ownProgress || 'Uploading…') : 'Add photos') + '</span>' +
        '<input type="file" accept="image/*" multiple data-own-add hidden' + (ownBusy ? ' disabled' : '') + '></label>' : '') +
      '</div>';
    body.innerHTML = html;

    bindEditor(body, { who: 'member', s }, saveMine);
    const reset = body.querySelector('[data-wall-reset]');
    if (reset) reset.onclick = () => { saveMine(null); toast('Following the gym\'s setting again.'); };
    const add = body.querySelector('[data-own-add]');
    if (add) add.onchange = () => { const fs = Array.from(add.files || []); add.value = ''; if (fs.length) ownAdd(fs); };
    body.querySelectorAll('[data-own]').forEach(el => {
      const w = own.find(x => x.id === el.dataset.own);
      const q = sel => el.querySelector(sel);
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
    else { mine = {}; ownEditing = null; writeMine(); lastApplied = ''; apply(); }
  });

  window.bnbBackdropsOnTabShown = function(){ render(); load(); };
  window.BNB_BACKDROPS = { rows: () => rows.slice(), first, resolve, pageKey, reload: load };

  // Follow the visitor around: the section (data-scene), the Gym tab they're on, and the clock.
  new MutationObserver(applySoon).observe(document.documentElement, { attributes: true, attributeFilter: ['data-scene'] });
  const watchTabs = () => new MutationObserver(applySoon).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  if (document.body) watchTabs(); else document.addEventListener('DOMContentLoaded', watchTabs, { once: true });
  setInterval(() => { lastApplied = ''; apply(); }, 60000);

  try { localStorage.removeItem('bnb-wallpaper-v1'); localStorage.removeItem('bnb-wallpaper-v2'); } catch(e){}
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true }); else load();
})();
