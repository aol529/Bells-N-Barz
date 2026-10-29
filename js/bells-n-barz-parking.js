/* =========================================================================
   BELL(E)S N' BARZ — PARKING (Admin > Parking, sql/88)
   - Car In: the guard types the plate as the car arrives.
   - Car Out: the desk finds the car (type the plate or tap it in the
     Parked Now list), sees the fee (per started hour) and the paybill
     details to read out, then taps Paid by M-Pesa / Paid cash, or Exempt
     for a member who checked in at the door that day (the server checks).
   - Members add their plates on My Profile ("My Car Plates").
   - Admins set the hourly rate and paybill number at the bottom.
   ========================================================================= */
(function(){
  const UI = () => window.BNB_UI;
  const esc = s => window.BNB_UI.esc(s);
  const users = () => window.BNB_USERS;
  const plateOf = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const kes = n => 'KES ' + Math.round(Number(n) || 0).toLocaleString('en-US');
  const isMissing = err => err && (err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST202');
  const time = iso => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  function stay(iso){
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return mins < 60 ? mins + ' min' : Math.floor(mins / 60) + 'h ' + String(mins % 60).padStart(2, '0') + 'm';
  }
  function isAdmin(){
    const me = users() && users().getSelf();
    return !!(me && me.roles && me.roles.includes('admin'));
  }

  /* ---------------- ADMIN > PARKING ---------------- */
  let settings = null, refreshTimer = null;

  async function render(){
    const body = document.getElementById('parking-body');
    if (!body) return;
    if (!body.dataset.ready){
      body.dataset.ready = '1';
      body.innerHTML =
        '<div class="park-grid">' +
          '<div class="park-card"><h3>Car In</h3>' +
            '<form class="park-form" data-park-in><input type="text" class="park-plate" placeholder="KDA 123A" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" aria-label="Number plate coming in">' +
            '<button type="submit" class="btn2 primary">Park In</button></form>' +
            '<div class="park-out-msg" data-park-in-msg aria-live="polite"></div></div>' +
          '<div class="park-card"><h3>Car Out</h3>' +
            '<form class="park-form" data-park-find><input type="text" class="park-plate" placeholder="KDA 123A" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" aria-label="Number plate going out">' +
            '<button type="submit" class="btn2 primary">Check Out</button></form>' +
            '<div class="park-out-msg" data-park-find-msg aria-live="polite"></div></div>' +
        '</div>' +
        '<div class="park-stats" data-park-stats></div>' +
        '<h3 class="park-head">Parked Now</h3><div data-park-list></div>' +
        '<div data-park-settings></div>';
      const inForm = body.querySelector('[data-park-in]'), findForm = body.querySelector('[data-park-find]');
      inForm.onsubmit = async e => {
        e.preventDefault();
        const input = inForm.querySelector('input'), msg = body.querySelector('[data-park-in-msg]');
        if (plateOf(input.value).length < 3){ msg.textContent = 'Type the number plate.'; return; }
        msg.textContent = 'Saving…';
        const { data, error } = await bnbClient.rpc('parking_enter', { p_plate: input.value });
        if (error){ msg.textContent = isMissing(error) ? 'Parking isn\'t set up in the database yet (sql/88-parking.sql).' : error.message; return; }
        msg.innerHTML = data.already
          ? '⚠ ' + esc(data.plate) + ' is already parked (in at ' + time(data.entered_at) + ').'
          : '✓ ' + esc(data.plate) + ' in at ' + time(data.entered_at) + (data.member ? ' · Member: ' + esc(data.member) : '');
        input.value = '';
        input.focus();
        load();
      };
      findForm.onsubmit = async e => {
        e.preventDefault();
        const input = findForm.querySelector('input'), msg = body.querySelector('[data-park-find-msg]');
        if (plateOf(input.value).length < 3){ msg.textContent = 'Type the number plate.'; return; }
        msg.textContent = '';
        const found = await openCheckout({ plate: input.value });
        if (found) input.value = '';
        else msg.textContent = 'No car with that plate is parked. Check the list below.';
      };
    }
    await load();
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => { if (body.offsetParent) load(); else clearInterval(refreshTimer); }, 30000);
  }

  async function load(){
    const body = document.getElementById('parking-body');
    if (!body) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const [open, today, set] = await Promise.all([
      bnbClient.from('parking_sessions').select('*').is('exited_at', null).order('entered_at'),
      bnbClient.from('parking_sessions').select('outcome,fee').gte('entered_at', start.toISOString()),
      bnbClient.from('parking_settings').select('*').eq('id', 1).maybeSingle()
    ]);
    const list = body.querySelector('[data-park-list]');
    if (open.error){
      list.innerHTML = '<div class="field-hint">' + (isMissing(open.error) ? 'Parking isn\'t set up in the database yet. Run sql/88-parking.sql.' : esc(open.error.message)) + '</div>';
      return;
    }
    settings = set.data || settings;
    const rows = open.data || [];
    list.innerHTML = rows.length ? '<div class="park-list">' + rows.map(r =>
      '<button type="button" class="park-row" data-park-id="' + r.id + '"><span class="park-row-plate">' + esc(r.plate) + '</span>' +
      '<span class="park-row-sub">in ' + time(r.entered_at) + ' · ' + stay(r.entered_at) + '</span><span class="park-row-go">Check out ›</span></button>').join('') + '</div>'
      : '<div class="field-hint">No cars parked right now.</div>';
    list.querySelectorAll('[data-park-id]').forEach(b => b.onclick = () => openCheckout({ id: b.dataset.parkId }));

    const t = today.data || [];
    const paid = t.filter(r => r.outcome === 'mpesa' || r.outcome === 'cash');
    body.querySelector('[data-park-stats]').innerHTML =
      '<span><b>' + rows.length + '</b> parked now</span>' +
      '<span><b>' + t.length + '</b> cars today</span>' +
      '<span><b>' + kes(paid.reduce((s, r) => s + Number(r.fee || 0), 0)) + '</b> collected today</span>' +
      '<span><b>' + t.filter(r => r.outcome === 'exempt').length + '</b> member exemptions</span>';
    drawSettings(body.querySelector('[data-park-settings]'));
  }

  function drawSettings(box){
    if (!settings){ box.innerHTML = ''; return; }
    // Once only, so the 30-second refresh never wipes what an admin is typing.
    if (box.dataset.drawn) return;
    const admin = isAdmin();
    box.dataset.drawn = '1';
    box.innerHTML = '<details class="freeze-admin park-settings"' + (settings.paybill ? '' : ' open') + '><summary>Parking settings</summary>' +
      (settings.paybill ? '' : '<div class="scan-warn" style="margin:10px 0;">Add the gym\'s paybill number so the desk can read it out at checkout.</div>') +
      '<div class="t-row2"><div class="t-field"><label>Rate per hour (KES)</label><input type="number" min="0" step="1" data-ps-rate value="' + esc(settings.rate_per_hour) + '"' + (admin ? '' : ' disabled') + '></div>' +
      '<div class="t-field"><label>M-Pesa paybill number</label><input type="text" inputmode="numeric" data-ps-paybill value="' + esc(settings.paybill) + '"' + (admin ? '' : ' disabled') + '></div></div>' +
      (admin ? '<button type="button" class="btn2 primary small" data-ps-save>Save</button> <span class="field-hint" data-ps-msg></span>' : '<div class="field-hint">Only an admin can change these.</div>') +
      '<div class="field-hint" style="margin-top:10px;">Every started hour is charged (1h10m = 2 hours). Members park free when their plate is under My Car Plates on their profile and they checked in at the door that day.</div>' +
      '</details>';
    const save = box.querySelector('[data-ps-save]');
    if (save) save.onclick = async () => {
      const rate = Number(box.querySelector('[data-ps-rate]').value), paybill = box.querySelector('[data-ps-paybill]').value.trim();
      const msg = box.querySelector('[data-ps-msg]');
      if (!(rate >= 0)){ msg.textContent = 'Enter a rate.'; return; }
      const { error } = await bnbClient.from('parking_settings').update({ rate_per_hour: rate, paybill, updated_at: new Date().toISOString() }).eq('id', 1);
      if (error){ msg.textContent = error.message; return; }
      settings = Object.assign({}, settings, { rate_per_hour: rate, paybill });
      msg.textContent = 'Saved.';
    };
  }

  // Returns false when no parked car matches.
  async function openCheckout(q){
    const { data, error } = await bnbClient.rpc('parking_lookup', { p_plate: q.plate || '', p_id: q.id || null });
    if (error){ UI().toast(error.message); return true; }
    if (!data) return false;
    const eligible = data.members.filter(m => m.checked_in), others = data.members.filter(m => !m.checked_in);
    const m = UI().modal('Check Out ' + data.plate,
      '<div class="park-co-plate">' + esc(data.plate) + '</div>' +
      '<div class="park-co-sub">In at ' + time(data.entered_at) + ' · ' + stay(data.entered_at) + '</div>' +
      (eligible.length ? '<div class="park-co-members">' + eligible.map(x =>
        '<button type="button" class="btn2 park-exempt" data-exempt="' + x.id + '">✓ Exempt — ' + esc(x.name) + ' (member, checked in)</button>').join('') + '</div>' : '') +
      (others.length ? '<div class="field-hint">' + others.map(x => esc(x.name)).join(', ') + ' — member' + (others.length > 1 ? 's' : '') + ' with this plate, but not checked in today, so the fee applies. (Staff can check them in with Scan Check-in first.)</div>' : '') +
      '<div class="park-co-fee"><div class="park-co-amount">' + kes(data.fee) + '</div>' +
        (data.paybill ? '<div class="park-co-pay">M-Pesa Paybill <b>' + esc(data.paybill) + '</b> · Account <b>' + esc(data.plate) + '</b></div>'
                      : '<div class="park-co-pay">No paybill number set yet (Parking settings).</div>') + '</div>' +
      '<div class="t-field"><label>M-Pesa code from the SMS (optional)</label><input type="text" data-co-ref autocomplete="off" autocapitalize="characters" maxlength="20" placeholder="e.g. SJK4XXXXXX"></div>' +
      '<div class="park-co-actions"><button type="button" class="btn2 primary" data-co="mpesa">Paid by M-Pesa</button><button type="button" class="btn2" data-co="cash">Paid cash</button></div>' +
      '<div class="field-hint" data-co-msg></div>' +
      '<button type="button" class="park-co-remove" data-co-remove>Typed wrong at the gate? Remove this car</button>');
    const msg = m.body.querySelector('[data-co-msg]');
    async function done(outcome, member){
      m.body.querySelectorAll('button').forEach(b => b.disabled = true);
      const { data: r, error } = await bnbClient.rpc('parking_checkout', {
        p_id: data.id, p_outcome: outcome, p_ref: m.body.querySelector('[data-co-ref]').value, p_member: member || null
      });
      if (error){ msg.textContent = error.message; m.body.querySelectorAll('button').forEach(b => b.disabled = false); return; }
      m.close();
      UI().toast(r.plate + (r.outcome === 'exempt' ? ' checked out free (member).' : ' checked out · ' + kes(r.fee) + ' paid.'));
      load();
    }
    m.body.querySelectorAll('[data-co]').forEach(b => b.onclick = () => done(b.dataset.co));
    m.body.querySelectorAll('[data-exempt]').forEach(b => b.onclick = () => done('exempt', b.dataset.exempt));
    const rm = m.body.querySelector('[data-co-remove]');
    rm.onclick = async () => {
      if (!rm.dataset.sure){ rm.dataset.sure = '1'; rm.textContent = 'Tap again to remove ' + data.plate; return; }
      const { error } = await bnbClient.rpc('parking_cancel', { p_id: data.id });
      if (error){ msg.textContent = error.message; return; }
      m.close();
      load();
    };
    return true;
  }

  window.bnbParkingOnTabShown = render;

  /* ---------------- MEMBER: MY CAR PLATES ---------------- */
  async function openPlates(u){
    const m = UI().modal('My Car Plates',
      '<div class="field-hint" style="margin-bottom:12px;">Add the cars you drive to the gym. Check in at the door and parking is free when you leave: just tell the desk your plate.</div>' +
      '<div data-plates>Loading…</div>' +
      '<form class="park-form" data-plate-add style="margin-top:12px;"><input type="text" class="park-plate" placeholder="KDA 123A" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" aria-label="Number plate"><button type="submit" class="btn2 primary">Add</button></form>' +
      '<div class="field-hint" data-plate-msg></div>');
    const box = m.body.querySelector('[data-plates]'), msg = m.body.querySelector('[data-plate-msg]');
    async function draw(){
      const { data, error } = await bnbClient.from('member_vehicles').select('*').eq('member_id', u.id).order('created_at');
      if (error){ box.textContent = isMissing(error) ? 'Parking isn\'t set up yet.' : error.message; return; }
      box.innerHTML = data.length ? data.map(v => '<div class="freeze-item"><b class="park-row-plate">' + esc(v.plate) + '</b>' +
        '<button type="button" class="btn2 small" data-plate-del="' + v.id + '">Remove</button></div>').join('') : '<div class="field-hint">No plates yet.</div>';
      box.querySelectorAll('[data-plate-del]').forEach(b => b.onclick = async () => {
        const { error } = await bnbClient.from('member_vehicles').delete().eq('id', b.dataset.plateDel);
        if (error){ msg.textContent = error.message; return; }
        draw();
      });
    }
    draw();
    const form = m.body.querySelector('[data-plate-add]');
    form.onsubmit = async e => {
      e.preventDefault();
      const plate = plateOf(form.querySelector('input').value);
      if (plate.length < 3){ msg.textContent = 'Type the number plate.'; return; }
      const { error } = await bnbClient.from('member_vehicles').insert([{ member_id: u.id, plate }]);
      if (error){ msg.textContent = error.code === '23505' ? 'That plate is already on your list.' : error.message; return; }
      form.querySelector('input').value = '';
      msg.textContent = '';
      draw();
    };
  }

  // My Profile button, next to the check-in ones (js/bells-n-barz-checkin.js).
  const prevExtras = window.bnbProfileExtras;
  window.bnbProfileExtras = function(u){
    if (prevExtras) prevExtras.apply(this, arguments);
    const row = document.querySelector('#usr-profile-card .checkin-btn-row');
    if (!row || !u || row.querySelector('#usr-plates-btn')) return;
    row.insertAdjacentHTML('beforeend', '<button class="btn2 small" type="button" id="usr-plates-btn">My Car Plates</button>');
    document.getElementById('usr-plates-btn').onclick = () => openPlates(users().getSelf() || u);
  };
  const me = users() && users().getSelf && users().getSelf();
  if (me) window.bnbProfileExtras(me);
})();
