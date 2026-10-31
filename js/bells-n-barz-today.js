/* =========================================================================
   BELL(E)S N' BARZ — MEMBER TODAY CARD
   One card at the top of the Member page's card screen: today's workout
   from the member's program, check-in (or the check-in code), streak and
   points, and the next class or 1-on-1 they're booked into. Everything
   is read from what's already there; nothing new is stored.
   ========================================================================= */
(function(){
  const esc = s => window.BNB_UI.esc(s);
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function when(date, time){
    const d = new Date(date + 'T' + (time || '00:00'));
    const t = iso(new Date()), tomorrow = iso(new Date(Date.now() + 86400000));
    const day = date === t ? 'Today' : date === tomorrow ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    return day + (time ? ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '');
  }

  // The next confirmed class or 1-on-1 from now (RLS: a member reads their own).
  async function nextBooking(userId){
    const t = iso(new Date()), nowTime = new Date().toTimeString().slice(0, 5);
    const [cls, pt] = await Promise.all([
      bnbClient.from('bookings').select('status, class_sessions(date, start_time, status, classes(name))').eq('user_id', userId).eq('status', 'confirmed'),
      bnbClient.from('pt_bookings').select('status, trainer_id, slots(date, start_time)').eq('user_id', userId).eq('status', 'confirmed')
    ]);
    const items = [];
    (cls.data || []).forEach(b => {
      const s = b.class_sessions;
      if (s && s.status !== 'cancelled') items.push({ date: s.date, time: (s.start_time || '').slice(0, 5), label: (s.classes && s.classes.name) || 'Class' });
    });
    (pt.data || []).forEach(b => {
      const s = b.slots;
      const coach = window.BNB_USERS && window.BNB_USERS.getName(b.trainer_id);
      if (s) items.push({ date: s.date, time: (s.start_time || '').slice(0, 5), pt: true, label: '1-on-1' + (coach ? ' with ' + coach.split(' ')[0] : '') });
    });
    return items.filter(x => x.date > t || (x.date === t && x.time >= nowTime))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] || null;
  }

  let drawing = 0;
  async function render(){
    const box = document.getElementById('member-today');
    if (!box) return;
    const U = window.BNB_USERS, me = U && U.getSelf();
    if (!me){ box.innerHTML = ''; return; }
    const run = ++drawing;
    const t = iso(new Date());
    const w = window.BNB_TRAINING ? window.BNB_TRAINING.today() : { exercises: [] };
    const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' });
    const checkedIn = U.hasCheckinOn && U.hasCheckinOn(me.id, t);
    const streak = U.currentStreak ? U.currentStreak(me.id) : 0;
    const shown = w.exercises.slice(0, 4);
    box.innerHTML = '<div class="today-card">' +
      '<div class="today-hi">Hi ' + esc((me.fullName || '').split(' ')[0]) + ' 👋</div>' +
      '<div class="today-grid">' +
        '<div class="today-cell today-workout"><div class="today-lbl">' + esc(weekday) + '\'s workout</div>' +
          (w.exercises.length
            ? '<div class="today-val">' + shown.map(esc).join(' · ') + (w.exercises.length > shown.length ? ' <span class="field-hint">+' + (w.exercises.length - shown.length) + ' more</span>' : '') + '</div>' +
              '<button type="button" class="btn2 primary small" data-today-go="session">Start logging</button>'
            : '<div class="today-val">Rest day. Walk, stretch, sleep well.</div>') +
        '</div>' +
        '<div class="today-cell"><div class="today-lbl">Check-in</div>' +
          (checkedIn ? '<div class="today-val">✓ Checked in today</div>'
            : '<div class="today-val">Not yet today</div><button type="button" class="btn2 small" data-today-code>Show my code</button>') +
        '</div>' +
        '<div class="today-cell"><div class="today-lbl">Streak · Points</div><div class="today-val"><b>' + streak + '</b> day' + (streak === 1 ? '' : 's') + ' · <b data-today-points>…</b> pts</div></div>' +
        '<div class="today-cell"><div class="today-lbl">Next booking</div><div class="today-val" data-today-next>…</div></div>' +
      '</div></div>';
    box.querySelectorAll('[data-today-go]').forEach(b => b.onclick = () => { if (window.switchTab) window.switchTab(b.dataset.todayGo); });
    const code = box.querySelector('[data-today-code]');
    if (code) code.onclick = () => window.BNB_CHECKIN && window.BNB_CHECKIN.openMyCode(me);

    // Pre-session screening (sql/89): nudge before a 1-on-1 if there isn't one.
    const screeningOn = window.BNB_FEATURES && window.BNB_FEATURES.on('pre-session-screening');
    const [ledger, next, screening] = await Promise.all([
      bnbClient.from('points_ledger').select('delta').eq('user_id', me.id),
      nextBooking(me.id).catch(() => null),
      screeningOn ? bnbClient.from('screenings').select('member_id').eq('member_id', me.id).maybeSingle() : null
    ]);
    if (run !== drawing) return;
    const pts = box.querySelector('[data-today-points]');
    if (pts) pts.textContent = ledger.error ? '—' : (ledger.data || []).reduce((s, r) => s + r.delta, 0);
    const nx = box.querySelector('[data-today-next]');
    if (nx) nx.innerHTML = next ? esc(next.label) + '<div class="field-hint">' + esc(when(next.date, next.time)) + '</div>'
      : 'Nothing booked <button type="button" class="btn2 small" data-today-book>Book</button>';
    if (nx && next && next.pt && screening && !screening.error && !screening.data){
      nx.insertAdjacentHTML('beforeend', '<div class="field-hint">Fill in your screening before this session.</div><button type="button" class="btn2 primary small" data-today-screening>Fill in screening</button>');
      nx.querySelector('[data-today-screening]').onclick = () => {
        if (!window.switchTab) return;
        window.switchTab('me');
        const b = document.querySelector('#me-section-switch [data-me-section="screening"]');
        if (b) b.click();
      };
    }
    const book = box.querySelector('[data-today-book]');
    if (book) book.onclick = () => window.switchTab && window.switchTab('schedule');
  }

  window.bnbMemberTodayRender = render;
  document.addEventListener('bnb-auth-changed', render);
  document.addEventListener('bnb-screening-change', render);
  render();
})();
