/* =========================================================================
   BELL(E)S N' BARZ — FRONT DOOR KIOSK (kiosk.html, sql/87)
   A tablet at the door. Members check in by:
   - scanning the QR code with their phone (a fresh code every 30 seconds;
     the app sends it to qr_checkin() and this screen picks the result up
     from kiosk_events_since()), or
   - typing their phone number and Check-in PIN on the keypad
     (kiosk_phone_checkin()).
   The server decides who gets in; this page only shows the answer.
   Hold the logo for 3 seconds for full screen / sign out.
   ========================================================================= */
(function(){
  const QR_GEN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  const TOKEN_EVERY = 30000, POLL_EVERY = 2000, IDLE_RESET = 25000;
  const $ = id => document.getElementById(id);
  let tokenTimer = null, pollTimer = null, idleTimer = null, resultTimer = null;
  let lastEvent = 0, polling = false, sending = false;
  let step = 'phone', phone = '', pin = '';

  function loadScript(src){
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }

  /* ---------------- SIGN IN ---------------- */
  function showLogin(msg){
    stopTimers();
    $('k-main').hidden = true;
    $('k-login').hidden = false;
    $('k-login-msg').textContent = msg || '';
  }
  $('k-login-form').onsubmit = async e => {
    e.preventDefault();
    $('k-login-msg').textContent = 'Signing in…';
    const { error } = await bnbClient.auth.signInWithPassword({ email: $('k-email').value.trim(), password: $('k-password').value });
    if (error){ $('k-login-msg').textContent = error.message; return; }
    $('k-password').value = '';
    showKiosk();
  };

  async function showKiosk(){
    $('k-login').hidden = true;
    $('k-main').hidden = false;
    try { await loadScript(QR_GEN); } catch(e){ $('k-qr').textContent = 'Could not load the QR code. Check the connection and reload.'; }
    if (!(await refreshToken())) return;
    // Don't replay check-ins from before this screen opened.
    const { data } = await bnbClient.rpc('kiosk_events_since', { p_after: 0 });
    (data || []).forEach(ev => { lastEvent = Math.max(lastEvent, ev.id); });
    stopTimers();
    tokenTimer = setInterval(refreshToken, TOKEN_EVERY);
    pollTimer = setInterval(poll, POLL_EVERY);
    keepAwake();
  }
  function stopTimers(){ clearInterval(tokenTimer); clearInterval(pollTimer); }

  /* ---------------- QR ---------------- */
  async function refreshToken(){
    const { data, error } = await bnbClient.rpc('kiosk_new_token');
    if (error){
      if (error.code === 'P0001'){ await bnbClient.auth.signOut(); showLogin(error.message); return false; }
      if (error.code === 'PGRST202'){ showLogin('Front door check-in isn\'t set up in the database yet (sql/87-front-door-kiosk.sql).'); return false; }
      $('k-qr-note').textContent = 'Reconnecting…';
      return true;
    }
    $('k-qr-note').innerHTML = 'Use your camera, or tap <b>Check In at the Door</b> in the app.';
    if (!window.qrcode) return true;
    const qr = window.qrcode(0, 'M');
    qr.addData(new URL('./?checkin=' + data, location.href).href);
    qr.make();
    $('k-qr').innerHTML = qr.createSvgTag(6, 2);
    const bar = $('k-bar');
    bar.style.transition = 'none'; bar.style.width = '100%';
    void bar.offsetWidth;
    bar.style.transition = 'width ' + (TOKEN_EVERY / 1000) + 's linear'; bar.style.width = '0%';
    return true;
  }
  async function poll(){
    if (polling) return;
    polling = true;
    try {
      const { data, error } = await bnbClient.rpc('kiosk_events_since', { p_after: lastEvent });
      if (!error && data && data.length){
        data.forEach(ev => { lastEvent = Math.max(lastEvent, ev.id); });
        showResult(data[data.length - 1].result);
      }
    } finally { polling = false; }
  }

  /* ---------------- KEYPAD ---------------- */
  function draw(){
    const val = step === 'phone' ? phone : '•'.repeat(pin.length);
    $('k-display').textContent = val || ' ';
    $('k-step-title').textContent = step === 'phone' ? 'Enter your phone number' : 'Enter your check-in PIN';
    $('k-go').textContent = step === 'phone' ? 'Next' : 'Check in';
    $('k-cancel').hidden = !phone;
  }
  function reset(){
    step = 'phone'; phone = ''; pin = '';
    $('k-msg').textContent = '';
    draw();
  }
  function bumpIdle(){
    clearTimeout(idleTimer);
    idleTimer = setTimeout(reset, IDLE_RESET);
  }
  async function press(key){
    if (sending || !$('k-result').hidden) return;
    bumpIdle();
    $('k-msg').textContent = '';
    if (key === 'back'){
      if (step === 'pin' && !pin){ step = 'phone'; }
      else if (step === 'pin') pin = pin.slice(0, -1);
      else phone = phone.slice(0, -1);
    } else if (key === 'enter'){
      if (step === 'phone'){
        if (phone.length < 7){ $('k-msg').textContent = 'Enter the phone number on your membership.'; return; }
        step = 'pin';
      } else {
        if (pin.length < 4){ $('k-msg').textContent = 'Your PIN is 4 to 6 digits.'; return; }
        await send();
        return;
      }
    } else if (/^\d$/.test(key)){
      if (step === 'phone' && phone.length < 15) phone += key;
      else if (step === 'pin' && pin.length < 6) pin += key;
    }
    draw();
  }
  async function send(){
    sending = true;
    $('k-msg').textContent = 'Checking…';
    try {
      const { data, error } = await bnbClient.rpc('kiosk_phone_checkin', { p_phone: phone, p_pin: pin });
      if (error){ $('k-msg').textContent = error.code === 'P0001' ? error.message : 'Couldn\'t reach the server. Try again.'; return; }
      if (data && data.retry){ pin = ''; draw(); $('k-msg').textContent = data.message; return; }
      reset();
      showResult(data);
    } finally { sending = false; }
  }
  $('k-pad').addEventListener('click', e => {
    const b = e.target.closest('[data-key]');
    if (b) press(b.dataset.key);
  });
  $('k-cancel').onclick = reset;
  document.addEventListener('keydown', e => {
    if ($('k-main').hidden || !$('k-exit').hidden) return;
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('back');
    else if (e.key === 'Enter') press('enter');
    else if (e.key === 'Escape') reset();
  });

  /* ---------------- RESULT ---------------- */
  function showResult(r){
    r = r || {};
    const cls = !r.ok ? 'no' : r.message && !r.already ? 'nudge' : 'ok';
    const box = $('k-result');
    box.className = 'k-result ' + cls;
    $('k-result-icon').textContent = r.ok ? '✓' : '✕';
    $('k-result-title').textContent = r.ok ? 'Welcome, ' + (r.name || 'champ') + '!' : r.name ? 'Sorry, ' + r.name : 'Please see the front desk';
    $('k-result-msg').textContent = r.message || 'Have a great session.';
    box.hidden = false;
    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => { box.hidden = true; }, cls === 'ok' ? 4000 : 9000);
  }
  $('k-result').onclick = () => { $('k-result').hidden = true; };

  /* ---------------- CLOCK, SCREEN, OPTIONS ---------------- */
  function tick(){
    $('k-clock').textContent = new Date().toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  tick();
  setInterval(tick, 15000);

  let wakeLock = null;
  async function keepAwake(){
    try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); if (wakeLock) wakeLock.onrelease = () => { wakeLock = null; }; } catch(e){ /* not allowed here — set the tablet's screen timeout instead */ }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !$('k-main').hidden) keepAwake(); });

  function online(){ $('k-offline').hidden = navigator.onLine; }
  window.addEventListener('online', () => { online(); refreshToken(); });
  window.addEventListener('offline', online);
  online();

  let holdTimer = null;
  const brand = $('k-brand');
  const holdStart = () => { holdTimer = setTimeout(() => { $('k-exit').hidden = false; }, 3000); };
  const holdEnd = () => clearTimeout(holdTimer);
  brand.addEventListener('pointerdown', holdStart);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => brand.addEventListener(ev, holdEnd));
  brand.addEventListener('contextmenu', e => e.preventDefault());
  $('k-exit-close').onclick = () => { $('k-exit').hidden = true; };
  $('k-fullscreen').onclick = () => {
    $('k-exit').hidden = true;
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  };
  $('k-signout').onclick = async () => {
    $('k-exit').hidden = true;
    await bnbClient.auth.signOut();
    showLogin('Signed out.');
  };

  draw();
  bnbClient.auth.getSession().then(({ data }) => { if (data && data.session) showKiosk(); else showLogin(); });
})();
