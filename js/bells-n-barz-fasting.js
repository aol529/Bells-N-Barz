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

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  const RING_CIRCUMFERENCE = 2 * Math.PI * 52;
  if (ringProgress) ringProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);

  let settings = { fastHours: 16, eatHours: 8, protocol: '16:8' };
  let logCache = [];
  let activeFast = null; // most recent row with fast_end still null, or null
  let tickTimer = null;

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
      settings = { fastHours: data.fast_hours, eatHours: data.eat_hours, protocol: protocolFor(data.fast_hours, data.eat_hours) };
    }
  }
  async function saveSettings(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const { error } = await bnbClient.from('fasting_settings').upsert([{
      user_id: me.id, fast_hours: settings.fastHours, eat_hours: settings.eatHours, updated_at: new Date().toISOString()
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
    const t = document.getElementById('t-toast');
    if (t){ t.textContent = 'Could not save — check your connection and try again.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
  }

  actionBtn.addEventListener('click', async () => {
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
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
    render();
    if (!tickTimer) tickTimer = setInterval(render, 1000);
  }
  init();
})();
