/* =========================================================================
   BELL(E)S N' BARZ — QR CHECK-IN & MEMBERSHIP FREEZE
   - My Profile gets "My Check-in Code": a QR code of the member's id to
     show at the front desk.
   - Staff get "Scan Check-in" (Admin > Members, Coach > Dashboard): the
     phone or tablet camera reads the code and logs today's check-in (the
     points trigger in sql/40 does the rest). Typing a name works too, for
     a member without their phone.
   - Membership freeze (sql/83): members ask on My Profile; staff approve,
     decline, freeze directly or end early in Admin > Members.
   - Front door (sql/87, kiosk.html): members check themselves in by
     scanning the kiosk's code ("Check In at the Door" / their phone's own
     camera, which opens the app with ?checkin=…), or by phone number and
     the Check-in PIN they set here. The server decides who gets in.
   QR libraries load from the CDN only when one of these screens opens.
   ========================================================================= */
(function(){
  const QR_GEN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  const QR_READ = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
  const PREFIX = 'BNB-CHECKIN:';
  const UI = () => window.BNB_UI;
  const esc = s => window.BNB_UI.esc(s);
  const users = () => window.BNB_USERS;
  const isUuid = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));
  function today(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(iso){
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const isMissingTable = err => err && (err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST202');
  function staffSelf(){
    const me = users() && users().getSelf();
    return !!(me && me.roles && me.roles.some(r => ['admin', 'trainer', 'staff'].includes(r)));
  }

  /* ---------------- MEMBER: MY CHECK-IN CODE ---------------- */
  async function openMyCode(u){
    const m = UI().modal('My Check-in Code', '<div class="qr-wrap"><div class="qr-code">Loading…</div>' +
      '<div class="qr-name">' + esc(u.fullName) + '</div>' +
      '<div class="field-hint">Show this at the front desk to check in. Turn your screen brightness up if it won\'t scan.</div></div>');
    try {
      await UI().loadScript(QR_GEN);
      const qr = window.qrcode(0, 'M');
      qr.addData(PREFIX + u.id);
      qr.make();
      m.body.querySelector('.qr-code').innerHTML = qr.createSvgTag(8, 2);
    } catch(e){
      m.body.querySelector('.qr-code').textContent = 'Could not make the code — check your connection.';
    }
  }

  /* ---------------- MEMBER: FREEZE ---------------- */
  let myFreezes = null, freezeMissing = false;
  async function loadMyFreezes(u){
    const { data, error } = await bnbClient.from('membership_freezes').select('*')
      .eq('member_id', u.id).order('starts_on', { ascending: false });
    if (error){ freezeMissing = isMissingTable(error); myFreezes = []; return; }
    freezeMissing = false;
    myFreezes = data || [];
  }
  function freezeStatusLine(){
    const t = today();
    const now = (myFreezes || []).find(f => f.status === 'approved' && f.starts_on <= t && f.ends_on >= t);
    const next = (myFreezes || []).find(f => f.status === 'approved' && f.starts_on > t);
    const asked = (myFreezes || []).find(f => f.status === 'requested');
    if (now) return '❄️ Your membership is frozen until ' + fmtDate(now.ends_on) + '.';
    if (next) return '❄️ Freeze booked: ' + fmtDate(next.starts_on) + ' – ' + fmtDate(next.ends_on) + '.';
    if (asked) return '⏳ Freeze requested for ' + fmtDate(asked.starts_on) + ' – ' + fmtDate(asked.ends_on) + ', waiting for staff.';
    return '';
  }

  function openFreeze(u){
    const t = today();
    const m = UI().modal('Freeze Membership',
      '<div class="field-hint" style="margin-bottom:14px;">Going away or injured? Pause your membership instead of cancelling. Staff approve it, and your membership end date moves back by the days you\'re away. Up to three months.</div>' +
      '<div class="freeze-mine"></div>' +
      '<div class="freeze-form">' +
        '<div class="t-row2"><div class="t-field"><label>From</label><input type="date" data-f-from min="' + t + '"></div>' +
        '<div class="t-field"><label>Until (last day away)</label><input type="date" data-f-to min="' + t + '"></div></div>' +
        '<div class="t-field"><label>Reason (optional)</label><input type="text" data-f-reason maxlength="300" placeholder="e.g. Travelling for work"></div>' +
        '<button type="button" class="btn2 primary" data-f-send>Ask for a freeze</button> <span class="field-hint" data-f-msg></span>' +
      '</div>');
    const mine = m.body.querySelector('.freeze-mine');
    function drawMine(){
      const open = (myFreezes || []).filter(f => ['requested', 'approved'].includes(f.status) && f.ends_on >= t);
      mine.innerHTML = open.length ? '<table class="admin-table freeze-table"><tr><th>Dates</th><th>Status</th><th></th></tr>' +
        open.map(f => '<tr><td>' + fmtDate(f.starts_on) + ' – ' + fmtDate(f.ends_on) + '</td><td>' + (f.status === 'requested' ? 'Waiting' : 'Approved') + '</td><td>' +
          (f.status === 'requested' ? '<button type="button" class="btn2 small" data-f-cancel="' + f.id + '">Cancel request</button>' : '') + '</td></tr>').join('') + '</table>' : '';
      mine.querySelectorAll('[data-f-cancel]').forEach(b => b.onclick = async () => {
        const { error } = await bnbClient.rpc('cancel_membership_freeze', { p_id: b.dataset.fCancel });
        if (error){ UI().toast(error.message); return; }
        await loadMyFreezes(u); drawMine(); refreshProfileLine(u);
      });
      m.body.querySelector('.freeze-form').style.display = (myFreezes || []).some(f => f.status === 'requested') ? 'none' : '';
    }
    drawMine();
    const from = m.body.querySelector('[data-f-from]'), to = m.body.querySelector('[data-f-to]');
    from.onchange = () => { to.min = from.value || t; if (to.value && to.value < from.value) to.value = from.value; };
    m.body.querySelector('[data-f-send]').onclick = async () => {
      const msg = m.body.querySelector('[data-f-msg]');
      if (!from.value || !to.value){ msg.textContent = 'Pick both dates.'; return; }
      const { error } = await bnbClient.rpc('request_membership_freeze', {
        p_starts: from.value, p_ends: to.value, p_reason: m.body.querySelector('[data-f-reason]').value.trim()
      });
      if (error){ msg.textContent = error.message; return; }
      UI().toast('Freeze requested — staff will get back to you.');
      await loadMyFreezes(u); drawMine(); refreshProfileLine(u);
    };
  }

  function refreshProfileLine(u){
    const line = document.getElementById('usr-freeze-status');
    if (line){ const txt = freezeStatusLine(); line.textContent = txt; line.style.display = txt ? '' : 'none'; }
    const btn = document.getElementById('usr-freeze-btn');
    if (btn) btn.style.display = freezeMissing ? 'none' : '';
  }

  // Called by users.js each time My Profile is drawn.
  window.bnbProfileExtras = function(u){
    const row = document.querySelector('#usr-profile-card .checkin-btn-row');
    if (!row || !u || row.querySelector('#usr-qr-btn')) return;
    row.insertAdjacentHTML('beforeend',
      '<button class="btn2 small" type="button" id="usr-qr-btn">My Check-in Code</button>' +
      '<button class="btn2 small" type="button" id="usr-pin-btn">Check-in PIN</button>' +
      '<button class="btn2 small" type="button" id="usr-freeze-btn" style="display:none;">Freeze Membership</button>');
    row.insertAdjacentHTML('afterend', '<div class="freeze-status-line" id="usr-freeze-status" style="display:none;"></div>');
    document.getElementById('usr-qr-btn').onclick = () => openMyCode(u);
    document.getElementById('usr-pin-btn').onclick = () => openPin(users().getSelf() || u);
    document.getElementById('usr-freeze-btn').onclick = () => openFreeze(u);
    if (myFreezes) refreshProfileLine(u);
    loadMyFreezes(u).then(() => refreshProfileLine(u));
  };

  /* ---------------- STAFF: SCANNER ---------------- */
  async function checkIn(member){
    const date = today();
    const { error } = await bnbClient.from('checkins').insert([{ user_id: member.id, date }]);
    if (error && error.code !== '23505') throw error;
    if (users().refreshCheckins) await users().refreshCheckins();
    return !error;   // false: already checked in today
  }

  function resultHtml(member, fresh){
    const warnings = [];
    if (member.status === 'suspended') warnings.push('Account suspended');
    if (member.mstatus === 'hold') warnings.push('Membership on hold (frozen)');
    else if (member.mstatus === 'overdue') warnings.push('Membership overdue');
    else if (member.mstatus === 'cancelled') warnings.push('Membership cancelled');
    else if (member.mstatus === 'pending') warnings.push('Membership not set up yet');
    if (member.contractEnd && member.contractEnd < today()) warnings.push('Membership ended ' + fmtDate(member.contractEnd));
    if (Number(member.balance) > 0) warnings.push('Owes ' + (window.BNB_CURRENCY ? window.BNB_CURRENCY.format(member.balance) : member.balance));
    const streak = users().currentStreak ? users().currentStreak(member.id) : 0;
    return '<div class="scan-result ' + (warnings.length ? 'warn' : 'ok') + '">' +
      (member.avatar ? '<img src="' + esc(member.avatar) + '" alt="">' : '') +
      '<div><div class="scan-name">' + (fresh ? '✓ ' : '') + esc(member.fullName) + '</div>' +
      '<div class="scan-sub">' + (fresh ? 'Checked in' : 'Already checked in today') + (streak ? ' · ' + streak + '-day streak' : '') + (member.plan ? ' · ' + esc(member.plan) : '') + '</div>' +
      (warnings.length ? '<div class="scan-warn">⚠ ' + warnings.map(esc).join(' · ') + '</div>' : '') + '</div></div>';
  }

  /* ---------------- CAMERA QR READER ----------------
     Starts the back camera in a .scan-stage (video + .scan-cam-msg) and
     calls onCode(text) for every code it reads. Returns stop(). */
  function startQrCamera(stage, onCode, fallback){
    let stream = null, raf = null, detector = null, stopped = false, busy = false;
    const video = stage.querySelector('video'), camMsg = stage.querySelector('.scan-cam-msg');
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    function stop(){
      stopped = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
    }
    async function frame(){
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (busy || video.readyState < 2) return;
      busy = true;
      try {
        if (detector){
          const codes = await detector.detect(video);
          if (codes.length) onCode(codes[0].rawValue);
        } else if (window.jsQR){
          const w = video.videoWidth, h = video.videoHeight, scale = Math.min(1, 640 / Math.max(w, h));
          canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data) onCode(code.data);
        }
      } catch(e){ /* a bad frame — try the next one */ }
      busy = false;
    }
    (async () => {
      try {
        if ('BarcodeDetector' in window){
          try {
            const formats = await window.BarcodeDetector.getSupportedFormats();
            if (formats.includes('qr_code')) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          } catch(e){ detector = null; }
        }
        if (!detector) await UI().loadScript(QR_READ);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('This browser can\'t use the camera here (it needs HTTPS).');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped){ stream.getTracks().forEach(t => t.stop()); return; }
        video.srcObject = stream;
        await video.play();
        camMsg.style.display = 'none';
        frame();
      } catch(e){
        camMsg.textContent = ((e && e.name === 'NotAllowedError') ? 'Camera blocked — allow camera access for this site.' : (e.message || 'No camera available.')) + ' ' + fallback;
      }
    })();
    return stop;
  }
  const STAGE_HTML = '<div class="scan-stage"><video playsinline muted></video><div class="scan-frame" aria-hidden="true"></div><div class="scan-cam-msg">Starting camera…</div></div>';

  function openScanner(){
    if (!staffSelf()){ UI().toast('Scanning check-ins is for staff accounts.'); return; }
    let paused = false, lastCode = '', lastAt = 0, stop = () => {};
    const m = UI().modal('Scan Check-in', STAGE_HTML +
      '<div class="scan-out" aria-live="polite"></div>' +
      '<div class="t-field" style="margin-top:14px;"><label>No code? Find the member</label><input type="text" data-scan-search placeholder="Type a name…" autocomplete="off"></div>' +
      '<div class="scan-matches"></div>',
      { onClose: () => stop() });
    const out = m.body.querySelector('.scan-out');

    async function handle(member){
      paused = true;
      out.innerHTML = '<div class="field-hint">Checking in ' + esc(member.fullName) + '…</div>';
      try {
        const fresh = await checkIn(member);
        out.innerHTML = resultHtml(member, fresh);
        if (navigator.vibrate) navigator.vibrate(fresh ? 120 : [60, 60, 60]);
      } catch(e){
        out.innerHTML = '<div class="scan-result warn"><div>Could not check in: ' + esc(e.message || e) + '</div></div>';
      }
      setTimeout(() => { paused = false; }, 2000);
    }
    function onCode(text){
      if (paused) return;
      const now = Date.now();
      if (text === lastCode && now - lastAt < 6000) return;
      lastCode = text; lastAt = now;
      const id = String(text || '').startsWith(PREFIX) ? text.slice(PREFIX.length) : '';
      const member = isUuid(id) ? users().getById(id) : null;
      if (!member){ out.innerHTML = '<div class="scan-result warn"><div>That isn\'t a Bells n Barz check-in code.</div></div>'; return; }
      handle(member);
    }

    // Name search fallback.
    const search = m.body.querySelector('[data-scan-search]'), matches = m.body.querySelector('.scan-matches');
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      const list = q.length < 2 ? [] : users().getMembers().filter(u => (u.fullName || '').toLowerCase().includes(q)).slice(0, 8);
      matches.innerHTML = list.map(u => '<button type="button" class="btn2 small" data-scan-id="' + u.id + '">' + esc(u.fullName) +
        (users().hasCheckinOn && users().hasCheckinOn(u.id, today()) ? ' ✓' : '') + '</button>').join(' ');
      matches.querySelectorAll('[data-scan-id]').forEach(b => b.onclick = () => handle(users().getById(b.dataset.scanId)));
    };

    stop = startQrCamera(m.body.querySelector('.scan-stage'), onCode, 'Find the member by name below.');
  }

  /* ---------------- MEMBER: FRONT DOOR (sql/87, kiosk.html) ---------------- */
  const DOOR_PARAM = 'checkin', DOOR_PENDING = 'bnb-door-token';
  function doorTokenFrom(text){
    try { return new URL(text).searchParams.get(DOOR_PARAM) || ''; } catch(e){ return ''; }
  }
  function doorResultHtml(r){
    r = r || {};
    const cls = !r.ok ? 'no' : r.message && !r.already ? 'nudge' : 'ok';
    const title = r.ok ? 'Welcome, ' + (r.name || 'champ') : r.expired ? 'Code expired' : 'Please see the front desk';
    return '<div class="door-result ' + cls + '"><div class="door-icon">' + (r.ok ? '✓' : '✕') + '</div>' +
      '<div class="door-title">' + esc(title) + '</div>' + (r.message ? '<div class="door-msg">' + esc(r.message) + '</div>' : '') + '</div>';
  }
  async function doorCheckin(token, m){
    m = m || UI().modal('Check In', '');
    m.body.innerHTML = '<div class="field-hint">Checking you in…</div>';
    const { data, error } = await bnbClient.rpc('qr_checkin', { p_token: token });
    if (error){
      m.body.innerHTML = doorResultHtml({ ok: false, message: isMissingTable(error) ? 'Front door check-in isn\'t set up yet.' : error.message });
      return;
    }
    m.body.innerHTML = doorResultHtml(data);
    if (navigator.vibrate) navigator.vibrate(data && data.ok ? 120 : [60, 60, 60]);
    if (data && data.ok){
      const btn = document.getElementById('usr-self-checkin-btn');
      if (btn){ btn.disabled = true; btn.textContent = 'Checked In Today ✓'; }
      if (users().refreshCheckins) users().refreshCheckins();
    }
  }
  function openDoorScan(){
    let done = false, stop = () => {};
    const m = UI().modal('Check In at the Door', STAGE_HTML +
      '<div class="field-hint" style="margin-top:10px;">Point your camera at the code on the front door screen.</div>',
      { onClose: () => stop() });
    stop = startQrCamera(m.body.querySelector('.scan-stage'), text => {
      const token = doorTokenFrom(text);
      if (done || !token) return;
      done = true;
      stop();
      doorCheckin(token, m);
    }, 'You can also scan the door code with your phone\'s camera app, or use your number and PIN on the screen.');
  }

  function openPin(u){
    const m = UI().modal('Check-in PIN',
      '<div class="field-hint" style="margin-bottom:14px;">No phone on you? At the front door you can check in with your phone number and this PIN.</div>' +
      (u.phone ? '' : '<div class="scan-warn" style="margin:0 0 12px;">Add your phone number under Edit Details first, or the door won\'t find you.</div>') +
      '<div class="field-hint" data-pin-state></div>' +
      '<div class="t-row2"><div class="t-field"><label>New PIN (4–6 digits)</label><input type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" data-pin1></div>' +
      '<div class="t-field"><label>Type it again</label><input type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" data-pin2></div></div>' +
      '<button type="button" class="btn2 primary" data-pin-save>Save PIN</button> <span class="field-hint" data-pin-msg></span>');
    const state = m.body.querySelector('[data-pin-state]'), msg = m.body.querySelector('[data-pin-msg]');
    bnbClient.rpc('has_checkin_pin').then(({ data, error }) => {
      if (!error) state.textContent = data ? 'You have a PIN. Saving a new one replaces it.' : 'You haven\'t set a PIN yet.';
    });
    m.body.querySelector('[data-pin-save]').onclick = async () => {
      const a = m.body.querySelector('[data-pin1]').value.trim(), b = m.body.querySelector('[data-pin2]').value.trim();
      if (!/^\d{4,6}$/.test(a)){ msg.textContent = 'Use 4 to 6 digits.'; return; }
      if (a !== b){ msg.textContent = 'The two PINs don\'t match.'; return; }
      const { error } = await bnbClient.rpc('set_checkin_pin', { p_pin: a });
      if (error){ msg.textContent = isMissingTable(error) ? 'PINs aren\'t set up yet — ask the front desk.' : error.message; return; }
      m.close();
      UI().toast('Check-in PIN saved.');
    };
  }

  // Scanned the door code with the phone's own camera: the app opened with
  // ?checkin=…. Hold on to it until we know who's signed in.
  try {
    const params = new URLSearchParams(location.search);
    const token = params.get(DOOR_PARAM);
    if (token){
      sessionStorage.setItem(DOOR_PENDING, token);
      params.delete(DOOR_PARAM);
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
      setTimeout(() => { if (!(users() && users().getSelf())) UI().toast('Log in to finish checking in.'); }, 3000);
    }
  } catch(e){ /* storage unavailable — scan from the app instead */ }
  function runPendingDoor(){
    let token = '';
    try { token = sessionStorage.getItem(DOOR_PENDING) || ''; sessionStorage.removeItem(DOOR_PENDING); } catch(e){}
    if (token) doorCheckin(token);
  }

  window.BNB_CHECKIN = { openScanner, openMyCode, openDoorScan };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-open-checkin-scanner]');
    if (b){ e.preventDefault(); openScanner(); }
  });

  /* ---------------- STAFF: FREEZES IN ADMIN > MEMBERS ---------------- */
  let applied = false;
  async function renderFreezeAdmin(){
    const box = document.getElementById('freeze-admin');
    if (!box) return;
    if (!staffSelf()){ box.innerHTML = ''; return; }
    if (!applied){
      applied = true;
      const { data: changed, error } = await bnbClient.rpc('apply_membership_freezes');
      if (error && isMissingTable(error)){ box.innerHTML = ''; return; }
      if (changed && users().refreshUsers) users().refreshUsers();
    }
    const t = today();
    const { data, error } = await bnbClient.from('membership_freezes').select('*')
      .in('status', ['requested', 'approved']).gte('ends_on', t).order('starts_on');
    if (error){ box.innerHTML = isMissingTable(error) ? '' : '<div class="admin-notice">Could not load freezes: ' + esc(error.message) + '</div>'; return; }
    const name = id => (users().getName(id) || 'Unknown member');
    const asked = data.filter(f => f.status === 'requested'), active = data.filter(f => f.status === 'approved');
    let html = '<div class="freeze-admin">';
    html += '<div class="freeze-admin-head"><h3>Membership Freezes</h3><button type="button" class="btn2 small" data-fa-new>+ Freeze a member</button></div>';
    // A list rather than a table: it has to fit a phone at the front desk.
    const item = (f, extra, buttons) => '<div class="freeze-item"><div><b>' + esc(name(f.member_id)) + '</b>' + extra +
      '<div class="field-hint">' + fmtDate(f.starts_on) + ' – ' + fmtDate(f.ends_on) + ' · ' + (daysBetween(f.starts_on, f.ends_on) + 1) + ' days' + (f.reason ? ' · ' + esc(f.reason) : '') + '</div></div>' +
      '<div class="row-actions">' + buttons + '</div></div>';
    if (asked.length){
      html += '<div class="freeze-sub">Waiting for a decision</div>' + asked.map(f => item(f, '',
        '<button data-fa-approve="' + f.id + '">Approve</button><button class="del" data-fa-decline="' + f.id + '">Decline</button>')).join('');
    }
    if (active.length){
      html += '<div class="freeze-sub">Frozen</div>' + active.map(f => item(f, f.starts_on <= t ? ' <span class="status-pill hold">now</span>' : '',
        '<button data-fa-end="' + f.id + '">' + (f.starts_on > t ? 'Cancel' : 'End early') + '</button>')).join('');
    }
    if (!asked.length && !active.length) html += '<div class="field-hint">No freeze requests or frozen memberships right now.</div>';
    html += '</div>';
    box.innerHTML = html;

    const act = async (fn, args, ok) => {
      const { error } = await bnbClient.rpc(fn, args);
      if (error){ UI().toast(error.message); return; }
      UI().toast(ok);
      if (users().refreshUsers) await users().refreshUsers();
      renderFreezeAdmin();
    };
    box.querySelectorAll('[data-fa-approve]').forEach(b => b.onclick = () => act('decide_membership_freeze', { p_id: b.dataset.faApprove, p_approve: true }, 'Freeze approved — the member has been told.'));
    box.querySelectorAll('[data-fa-decline]').forEach(b => b.onclick = () => act('decide_membership_freeze', { p_id: b.dataset.faDecline, p_approve: false }, 'Request declined — the member has been told.'));
    box.querySelectorAll('[data-fa-end]').forEach(b => b.onclick = () => {
      if (confirm('End this freeze now? The unused days come off their membership end date.')) act('end_membership_freeze', { p_id: b.dataset.faEnd }, 'Freeze ended.');
    });
    box.querySelector('[data-fa-new]').onclick = () => {
      const mm = UI().modal('Freeze a Member',
        '<div class="t-field"><label>Member</label><select data-n-member>' +
          users().getMembers().filter(u => isUuid(u.id)).sort((a, b) => a.fullName.localeCompare(b.fullName))
            .map(u => '<option value="' + u.id + '">' + esc(u.fullName) + '</option>').join('') + '</select></div>' +
        '<div class="t-row2"><div class="t-field"><label>From</label><input type="date" data-n-from value="' + t + '"></div>' +
        '<div class="t-field"><label>Until (last day away)</label><input type="date" data-n-to></div></div>' +
        '<div class="t-field"><label>Reason</label><input type="text" data-n-reason maxlength="300"></div>' +
        '<button type="button" class="btn2 primary" data-n-save>Freeze</button> <span class="field-hint" data-n-msg></span>');
      mm.body.querySelector('[data-n-save]').onclick = async () => {
        const g = sel => mm.body.querySelector(sel).value;
        if (!g('[data-n-from]') || !g('[data-n-to]')){ mm.body.querySelector('[data-n-msg]').textContent = 'Pick both dates.'; return; }
        const { error } = await bnbClient.rpc('staff_freeze_member', { p_member: g('[data-n-member]'), p_starts: g('[data-n-from]'), p_ends: g('[data-n-to]'), p_reason: g('[data-n-reason]').trim() });
        if (error){ mm.body.querySelector('[data-n-msg]').textContent = error.message; return; }
        mm.close();
        UI().toast('Membership frozen — the member has been told.');
        if (users().refreshUsers) await users().refreshUsers();
        renderFreezeAdmin();
      };
    };
  }
  function daysBetween(a, b){ return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }

  // Re-draw with Admin > Members (users.js sets usersOnTabShown at load).
  const prevShown = window.usersOnTabShown;
  window.usersOnTabShown = function(){ if (prevShown) prevShown.apply(this, arguments); renderFreezeAdmin(); };
  document.addEventListener('bnb-auth-changed', e => {
    if (e.detail && e.detail.signedIn){
      renderFreezeAdmin();
      const me = users() && users().getSelf();
      if (me) window.bnbProfileExtras(me);
      runPendingDoor();
    }
  });
  // My Profile was first drawn before this file loaded.
  const me = users() && users().getSelf && users().getSelf();
  if (me){ window.bnbProfileExtras(me); runPendingDoor(); }
})();
