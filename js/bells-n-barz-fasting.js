/* ---------------- INTERMITTENT FASTING TRACKER ----------------
   Same shape as the Weight/Nutrition trackers (per-member CRUD table,
   no RPCs — see sql/16-fasting.sql), plus a live ticking countdown like
   the Ekadashi timer. One protocol setting per member (fasting_settings,
   upserted), and one row per fast in fasting_log — "the active cycle"
   is whichever row (if any) still has fast_end = null. */
(function(){
  const protocolSwitch = document.getElementById('fasting-protocol-switch');
  if (!protocolSwitch) return; // Fasting tab not present on this page

  const customRow = document.getElementById('fasting-custom-row');
  const customFastInput = document.getElementById('fasting-custom-fast');
  const customEatInput = document.getElementById('fasting-custom-eat');
  const customApplyBtn = document.getElementById('fasting-custom-apply');
  const phaseEl = document.getElementById('fasting-phase');
  const countdownEl = document.getElementById('fasting-countdown');
  const metaEl = document.getElementById('fasting-meta');
  const actionBtn = document.getElementById('fasting-action-btn');
  const ringProgress = document.getElementById('fasting-ring-progress');
  const statsBox = document.getElementById('fasting-stats');
  const statCount = document.getElementById('fasting-stat-count');
  const statAvg = document.getElementById('fasting-stat-avg');
  const statLongest = document.getElementById('fasting-stat-longest');
  const statStreak = document.getElementById('fasting-stat-streak');
  const historyBody = document.getElementById('fasting-history-body');
  const historyEmpty = document.getElementById('fasting-history-empty');
  const soundToggleBtn = document.getElementById('fasting-sound-toggle');
  const notifBtn = document.getElementById('fasting-notif-btn');
  const notifNote = document.getElementById('fasting-notif-note');
  const modeSwitchBtns = document.querySelectorAll('#fasting-mode-switch button');
  const dailyPanel = document.getElementById('fasting-daily-panel');
  const panel522 = document.getElementById('fasting-522-panel');
  const days522Buttons = document.querySelectorAll('#fasting-522-days button');
  const warning522 = document.getElementById('fasting-522-warning');
  const cap522Input = document.getElementById('fasting-522-cap');
  const save522Btn = document.getElementById('fasting-522-save');
  const statusPhase522 = document.getElementById('fasting-522-status-phase');
  const statusMeta522 = document.getElementById('fasting-522-status-meta');
  const history522Body = document.getElementById('fasting-522-history-body');
  const history522Empty = document.getElementById('fasting-522-history-empty');

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  const RING_CIRCUMFERENCE = 2 * Math.PI * 52;
  if (ringProgress) ringProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);

  let settings = { fastHours: 16, eatHours: 8, protocol: '16:8', mode: 'daily', weeklyFastDays: [], weeklyCalorieCap: 500 };
  let logCache = [];
  let activeFast = null; // most recent row with fast_end still null, or null
  let tickTimer = null;
  let lastPhase = null; // null until the first render, so page load never fires an alarm

  /* ---------------- ALARMS ----------------
     Fires when the phase actually changes — fast completes (eating
     window opens) or the eating window closes — not on every tick.
     Sound is a plain Web Audio beep, no audio file to host. Browsers
     suspend a fresh AudioContext until a real user gesture, so it's
     created lazily on the first click anywhere in this card (Start
     Fast, the mute toggle, Enable Browser Alerts) rather than at alarm
     time, when there may not have been a recent gesture. Browser
     notifications are the Notification API directly (no service
     worker) — they only fire while this tab is open somewhere, not a
     true background push; same "no real scheduler" ceiling as the
     Ekadashi/birthday reminders elsewhere in this app. */
  const SOUND_MUTED_KEY = 'bnb-fasting-sound-muted';
  let soundMuted = false;
  try { soundMuted = localStorage.getItem(SOUND_MUTED_KEY) === '1'; } catch(e){}
  let audioCtx = null;
  function ensureAudioCtx(){
    if (audioCtx) return audioCtx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    } catch(e){ console.warn('AudioContext unavailable:', e); }
    return audioCtx;
  }
  function playAlarmSound(){
    if (soundMuted) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    try {
      const now = ctx.currentTime;
      [0, 0.22].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    } catch(e){ console.warn('Alarm sound failed:', e); }
  }
  function renderNotifButton(){
    if (!('Notification' in window)){ notifBtn.style.display = 'none'; notifNote.style.display = 'none'; return; }
    if (Notification.permission === 'granted'){
      notifBtn.style.display = 'none';
      notifNote.style.display = '';
      notifNote.textContent = '🔔 Browser alerts on';
    } else if (Notification.permission === 'denied'){
      notifBtn.style.display = 'none';
      notifNote.style.display = '';
      notifNote.textContent = 'Browser alerts blocked — enable them in your browser’s site settings.';
    } else {
      notifBtn.style.display = '';
      notifNote.style.display = 'none';
    }
  }
  function maybeNotify(title, body){
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(title, { body: body }); } catch(e){ console.warn('Notification failed:', e); }
  }
  function toast(msg){
    const t = document.getElementById('t-toast');
    if (t){ t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
  }
  function fireAlarmFor(phase){
    playAlarmSound();
    if (phase === 'eating'){
      toast('Your fast is complete — eating window is open.');
      maybeNotify('Eating window open', 'Your fast is complete. Time to eat!');
    } else if (phase === 'window-closed'){
      toast('Your eating window has closed. Start your next fast when ready.');
      maybeNotify('Eating window closed', 'Start your next fast whenever you’re ready.');
    }
  }
  soundToggleBtn.addEventListener('click', () => {
    ensureAudioCtx();
    soundMuted = !soundMuted;
    try { localStorage.setItem(SOUND_MUTED_KEY, soundMuted ? '1' : '0'); } catch(e){}
    soundToggleBtn.textContent = soundMuted ? '🔕 Sound Off' : '🔔 Sound On';
    soundToggleBtn.classList.toggle('muted', soundMuted);
    if (!soundMuted) playAlarmSound(); // quick confirmation beep
  });
  soundToggleBtn.textContent = soundMuted ? '🔕 Sound Off' : '🔔 Sound On';
  soundToggleBtn.classList.toggle('muted', soundMuted);
  notifBtn.addEventListener('click', () => {
    ensureAudioCtx();
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(renderNotifButton);
  });
  renderNotifButton();

  function fmtCountdown(ms){
    if (ms <= 0) return '0m 0s';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return (h > 0 ? h + 'h ' : '') + m + 'm ' + s + 's';
  }
  function protocolFor(fastHours, eatHours){
    if (fastHours === 16 && eatHours === 8) return '16:8';
    if (fastHours === 18 && eatHours === 6) return '18:6';
    if (fastHours === 20 && eatHours === 4) return '20:4';
    return 'custom';
  }

  async function loadSettings(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const { data, error } = await bnbClient.from('fasting_settings').select('*').eq('user_id', me.id).maybeSingle();
    if (error) { console.error('Supabase load fasting_settings failed:', error); return; }
    if (data){
      settings = {
        fastHours: data.fast_hours, eatHours: data.eat_hours, protocol: protocolFor(data.fast_hours, data.eat_hours),
        mode: data.mode || 'daily',
        weeklyFastDays: data.weekly_fast_days ? data.weekly_fast_days.split(',').filter(Boolean).map(Number) : [],
        weeklyCalorieCap: data.weekly_calorie_cap || 500
      };
    }
  }
  async function saveSettings(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const { error } = await bnbClient.from('fasting_settings').upsert([{
      user_id: me.id, fast_hours: settings.fastHours, eat_hours: settings.eatHours,
      mode: settings.mode, weekly_fast_days: settings.weeklyFastDays.join(','), weekly_calorie_cap: settings.weeklyCalorieCap,
      updated_at: new Date().toISOString()
    }], { onConflict: 'user_id' });
    if (error) console.error('Supabase save fasting_settings failed:', error);
  }
  async function loadLog(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const { data, error } = await bnbClient.from('fasting_log').select('*').eq('user_id', me.id).order('fast_start', { ascending: false });
    if (error) { console.error('Supabase load fasting_log failed:', error); return; }
    logCache = data || [];
    activeFast = logCache.find(r => !r.fast_end) || null;
  }

  function renderProtocolSwitch(){
    protocolSwitch.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-protocol') === settings.protocol);
    });
    customRow.style.display = settings.protocol === 'custom' ? 'flex' : 'none';
    if (settings.protocol === 'custom'){
      customFastInput.value = settings.fastHours;
      customEatInput.value = settings.eatHours;
    }
  }

  protocolSwitch.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const protocol = btn.getAttribute('data-protocol');
      if (protocol === 'custom'){
        settings.protocol = 'custom';
        renderProtocolSwitch();
        return; // saved once they hit Apply below, with actual values
      }
      settings.protocol = protocol;
      settings.fastHours = Number(btn.getAttribute('data-fast'));
      settings.eatHours = Number(btn.getAttribute('data-eat'));
      renderProtocolSwitch();
      render();
      saveSettings();
    });
  });
  customApplyBtn.addEventListener('click', () => {
    const f = Math.max(1, Math.min(23, Math.round(Number(customFastInput.value)) || 16));
    const e = Math.max(1, Math.min(23, Math.round(Number(customEatInput.value)) || 8));
    settings.fastHours = f;
    settings.eatHours = e;
    settings.protocol = 'custom';
    render();
    saveSettings();
  });

  /* ---------------- 5:2 WEEKLY MODE ----------------
     A different shape from the daily ring timer: eat normally 5 days a
     week, cap calories on 2 chosen days. There's no "hours until X" to
     count down to, so this reuses nutrition_log's calories/date instead
     of a live timer — a "fasting day" is just one of the two chosen
     weekdays, checked against that date's logged calories. */
  function renderModeSwitch(){
    const isFiveTwo = settings.mode === '5:2';
    modeSwitchBtns.forEach(btn => {
      btn.classList.toggle('active', (btn.getAttribute('data-fasting-mode') === '522') === isFiveTwo);
    });
    dailyPanel.style.display = isFiveTwo ? 'none' : '';
    panel522.style.display = isFiveTwo ? '' : 'none';
  }
  modeSwitchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      settings.mode = btn.getAttribute('data-fasting-mode') === '522' ? '5:2' : 'daily';
      renderModeSwitch();
      if (settings.mode === '5:2') render522(); else render();
      saveSettings();
    });
  });

  days522Buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const wd = Number(btn.getAttribute('data-weekday'));
      const idx = settings.weeklyFastDays.indexOf(wd);
      if (idx >= 0) settings.weeklyFastDays.splice(idx, 1);
      else settings.weeklyFastDays.push(wd);
      warning522.style.display = 'none';
      render522(); // live preview against the in-progress (not yet saved) selection
    });
  });

  function isConsecutiveDays(days){
    if (days.length !== 2) return false;
    const sorted = days.slice().sort((a,b) => a-b);
    return (sorted[1] - sorted[0] === 1) || (sorted[0] === 0 && sorted[1] === 6); // adjacent, or Sat/Sun wraparound
  }

  save522Btn.addEventListener('click', () => {
    if (settings.weeklyFastDays.length !== 2){
      warning522.textContent = 'Pick exactly 2 fasting days.';
      warning522.style.display = '';
      return;
    }
    if (isConsecutiveDays(settings.weeklyFastDays)){
      warning522.textContent = 'Heads up: those two days are back-to-back — the 5:2 method calls for non-consecutive fasting days. Saved anyway.';
      warning522.style.display = '';
    } else {
      warning522.style.display = 'none';
    }
    settings.weeklyCalorieCap = Math.max(200, Math.min(1000, Math.round(Number(cap522Input.value)) || 500));
    saveSettings();
    render522();
  });

  function fmtDateLocal(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  // The last `count` calendar dates (going backward from today) whose
  // weekday is one of the chosen fasting days — walks back at most 60
  // days as a safety cap, though 2 fasting days/week means `count`
  // dates are found well within the first couple of weeks.
  function recentFastingDates(fastDays, count){
    const dates = [];
    const base = new Date();
    base.setHours(0,0,0,0);
    for (let i = 0; dates.length < count && i < 60; i++){
      const cur = new Date(base);
      cur.setDate(cur.getDate() - i);
      if (fastDays.includes(cur.getDay())) dates.push(fmtDateLocal(cur));
    }
    return dates;
  }

  async function render522(){
    renderModeSwitch();
    days522Buttons.forEach(btn => {
      btn.classList.toggle('active', settings.weeklyFastDays.includes(Number(btn.getAttribute('data-weekday'))));
    });
    cap522Input.value = settings.weeklyCalorieCap;

    if (settings.weeklyFastDays.length !== 2){
      statusPhase522.textContent = 'Choose 2 Fasting Days';
      statusMeta522.textContent = 'Pick two days above, then Save.';
      history522Body.innerHTML = '';
      history522Empty.style.display = '';
      return;
    }

    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const sortedDays = settings.weeklyFastDays.slice().sort((a,b) => a-b);
    const todayWd = new Date().getDay();

    if (settings.weeklyFastDays.includes(todayWd) && me){
      const todayStr = fmtDateLocal(new Date());
      const { data, error } = await bnbClient.from('nutrition_log').select('calories').eq('user_id', me.id).eq('date', todayStr).maybeSingle();
      if (error) console.error('Supabase load today’s nutrition_log failed:', error);
      const cal = data && data.calories != null ? data.calories : null;
      statusPhase522.textContent = 'Today Is a Fasting Day';
      if (cal == null){
        statusMeta522.textContent = 'No calories logged yet today — cap is ' + settings.weeklyCalorieCap + ' cal. Log it in the Nutrition tab.';
      } else if (cal <= settings.weeklyCalorieCap){
        statusMeta522.textContent = cal + ' cal logged — under your ' + settings.weeklyCalorieCap + ' cal cap.';
      } else {
        statusMeta522.textContent = cal + ' cal logged — over your ' + settings.weeklyCalorieCap + ' cal cap by ' + (cal - settings.weeklyCalorieCap) + '.';
      }
    } else {
      statusPhase522.textContent = 'Today Is a Normal Eating Day';
      statusMeta522.textContent = 'Your fasting days are ' + sortedDays.map(d => dayNames[d]).join(' & ') + '.';
    }

    if (!me){ history522Body.innerHTML = ''; history522Empty.style.display = ''; return; }
    const dates = recentFastingDates(settings.weeklyFastDays, 8);
    if (!dates.length){ history522Body.innerHTML = ''; history522Empty.style.display = ''; return; }
    const { data: rows, error: histErr } = await bnbClient.from('nutrition_log').select('date, calories').eq('user_id', me.id).in('date', dates);
    if (histErr) { console.error('Supabase load 5:2 history failed:', histErr); return; }
    const byDate = {};
    (rows || []).forEach(r => { byDate[r.date] = r.calories; });
    history522Empty.style.display = 'none';
    history522Body.innerHTML = dates.map(dt => {
      const cal = byDate[dt];
      const label = new Date(dt + 'T00:00:00').toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
      let result;
      if (cal == null) result = '<span style="color:var(--muted-2);">Not logged</span>';
      else if (cal <= settings.weeklyCalorieCap) result = '<span style="color:var(--accent-3);">Under cap</span>';
      else result = '<span style="color:#e0736a;">Over cap</span>';
      return '<tr><td>' + esc(label) + '</td><td>' + (cal != null ? cal : '—') + '</td><td>' + settings.weeklyCalorieCap + '</td><td>' + result + '</td></tr>';
    }).join('');
  }

  // Where "now" sits relative to the active fast's planned fast-end and
  // (fast-end + current eat_hours) — eat_hours uses the LIVE setting,
  // not a per-row snapshot, so changing your protocol mid-eating-window
  // shifts the displayed window close time; planned_fast_hours (used for
  // the fast itself, and for stats/streak) is always the row's own
  // snapshot, unaffected by later protocol changes.
  function currentPhase(now){
    if (!activeFast) return { phase: 'idle' };
    const start = new Date(activeFast.fast_start).getTime();
    const fastEndAt = start + activeFast.planned_fast_hours * 3600000;
    const eatEndAt = fastEndAt + settings.eatHours * 3600000;
    if (now < fastEndAt) return { phase: 'fasting', phaseStart: start, phaseEnd: fastEndAt };
    if (now < eatEndAt) return { phase: 'eating', phaseStart: fastEndAt, phaseEnd: eatEndAt };
    return { phase: 'window-closed', phaseStart: fastEndAt, phaseEnd: eatEndAt };
  }

  function setRingProgress(fraction){
    if (!ringProgress) return;
    const f = Math.max(0, Math.min(1, fraction));
    ringProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - f));
  }

  function render(){
    renderProtocolSwitch();
    const now = Date.now();
    const state = currentPhase(now);
    if (state.phase === 'idle'){
      phaseEl.textContent = 'Not Fasting';
      countdownEl.textContent = '—';
      metaEl.textContent = 'Goal: ' + settings.fastHours + 'h fast / ' + settings.eatHours + 'h eat. Ready when you are.';
      actionBtn.textContent = 'Start Fast';
      actionBtn.classList.remove('danger');
      setRingProgress(0);
    } else if (state.phase === 'fasting'){
      phaseEl.textContent = 'Fasting';
      countdownEl.textContent = fmtCountdown(state.phaseEnd - now);
      metaEl.textContent = 'Eating window opens at ' + new Date(state.phaseEnd).toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
      actionBtn.textContent = 'End Fast Early';
      actionBtn.classList.add('danger');
      setRingProgress((now - state.phaseStart) / (state.phaseEnd - state.phaseStart));
    } else if (state.phase === 'eating'){
      phaseEl.textContent = 'Eating Window';
      countdownEl.textContent = fmtCountdown(state.phaseEnd - now);
      metaEl.textContent = 'Window closes at ' + new Date(state.phaseEnd).toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'}) + ' — start your next fast any time.';
      actionBtn.textContent = 'Start Next Fast';
      actionBtn.classList.remove('danger');
      setRingProgress((now - state.phaseStart) / (state.phaseEnd - state.phaseStart));
    } else { // window-closed
      phaseEl.textContent = 'Ready for Your Next Fast';
      countdownEl.textContent = '—';
      metaEl.textContent = 'Your eating window closed. Start whenever you’re ready.';
      actionBtn.textContent = 'Start Next Fast';
      actionBtn.classList.remove('danger');
      setRingProgress(1);
    }
    // Alarm on a real phase change only — 'idle' is excluded since that
    // transition only ever happens via the action button itself (the
    // user already knows they just started a fast).
    if (lastPhase !== null && lastPhase !== state.phase && (state.phase === 'eating' || state.phase === 'window-closed')){
      fireAlarmFor(state.phase);
    }
    lastPhase = state.phase;
    renderStats();
    renderHistory();
  }

  function renderStats(){
    const completed = logCache.filter(r => r.fast_end);
    if (!completed.length){ statsBox.style.display = 'none'; return; }
    statsBox.style.display = '';
    const durationsH = completed.map(r => (new Date(r.fast_end).getTime() - new Date(r.fast_start).getTime()) / 3600000);
    const avg = durationsH.reduce((a,b) => a+b, 0) / durationsH.length;
    statCount.textContent = String(completed.length);
    statAvg.textContent = avg.toFixed(1) + 'h';
    statLongest.textContent = Math.max.apply(null, durationsH).toFixed(1) + 'h';
    // completed is already newest-first (logCache is loaded in that
    // order) — count backward until a fast that fell short of its own
    // goal (an early end) breaks the streak.
    let streak = 0;
    for (const r of completed){
      const hrs = (new Date(r.fast_end).getTime() - new Date(r.fast_start).getTime()) / 3600000;
      if (hrs + 0.05 >= r.planned_fast_hours) streak++; else break;
    }
    statStreak.textContent = String(streak);
  }

  function renderHistory(){
    const completed = logCache.filter(r => r.fast_end);
    if (!completed.length){
      historyBody.innerHTML = '';
      historyEmpty.style.display = '';
      return;
    }
    historyEmpty.style.display = 'none';
    historyBody.innerHTML = completed.map(r => {
      const durH = (new Date(r.fast_end).getTime() - new Date(r.fast_start).getTime()) / 3600000;
      const fmt = iso => new Date(iso).toLocaleString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
      return '<tr><td>' + esc(fmt(r.fast_start)) + '</td><td>' + esc(fmt(r.fast_end)) + '</td><td>' +
        durH.toFixed(1) + 'h</td><td>' + r.planned_fast_hours + 'h</td></tr>';
    }).join('');
  }

  function showError(){
    toast('Could not save — check your connection and try again.');
  }

  actionBtn.addEventListener('click', async () => {
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    ensureAudioCtx(); // this click is a real user gesture — the most likely one to unlock audio for later alarms
    actionBtn.disabled = true;
    const now = new Date();
    const state = currentPhase(now.getTime());
    try {
      if (state.phase === 'fasting'){
        // Ending early — the fast stops right now, before its planned length.
        const { error } = await bnbClient.from('fasting_log').update({ fast_end: now.toISOString() }).eq('id', activeFast.id);
        if (error) throw error;
      } else if (state.phase === 'eating' || state.phase === 'window-closed'){
        // The fasting portion already completed naturally at phaseStart
        // (fast_start + planned_fast_hours) — close the row with THAT
        // timestamp, not "now" (which could be hours into the eating
        // window), so the logged duration reflects the actual fast, not
        // fast-plus-however-long-they-waited-to-start-the-next-one.
        const { error: closeErr } = await bnbClient.from('fasting_log').update({ fast_end: new Date(state.phaseStart).toISOString() }).eq('id', activeFast.id);
        if (closeErr) throw closeErr;
        const { error: insertErr } = await bnbClient.from('fasting_log').insert([{
          user_id: me.id, fast_start: now.toISOString(), planned_fast_hours: settings.fastHours
        }]);
        if (insertErr) throw insertErr;
      } else { // idle
        const { error } = await bnbClient.from('fasting_log').insert([{
          user_id: me.id, fast_start: now.toISOString(), planned_fast_hours: settings.fastHours
        }]);
        if (error) throw error;
      }
      await loadLog();
      render();
    } catch(e){
      console.error('Supabase fasting action failed:', e);
      showError();
    }
    actionBtn.disabled = false;
  });

  async function init(){
    await loadSettings();
    await loadLog();
    renderModeSwitch();
    render();
    render522();
    // Only the daily ring/countdown needs a per-second tick — render522()
    // makes a Supabase read, so it's only re-run on explicit user action
    // (switching into 5:2, picking a day, saving), never on a timer.
    if (!tickTimer) tickTimer = setInterval(render, 1000);
  }
  init();
})();
