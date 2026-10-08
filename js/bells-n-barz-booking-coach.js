(function(){

  // Computed from the local system clock (not toISOString(), which can
  // shift a day depending on timezone) so "today" is genuinely today,
  // not a frozen demo-data date.
  const TODAY = (function(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })();

  // Trainer/member rosters are read live from the Users CRUD store (window.BNB_USERS,
  // exposed by the Users module) instead of a standalone list. This keeps Schedule in
  // sync with adds/edits/deletes made in Admin > Users. A tiny fallback list covers the
  // (unexpected) case where the Users module hasn't loaded.
  const SCHED_TRAINERS_FALLBACK = [{ id:'u2', name:'Coach KA' }];
  const SCHED_MEMBERS_FALLBACK = [{ id:'u1', name:'Achol Deng' }];
  function getSchedTrainers(){
    if (window.BNB_USERS) return window.BNB_USERS.getTrainers().map(u=>({ id:u.id, name:u.fullName }));
    return SCHED_TRAINERS_FALLBACK;
  }
  function getSchedMembers(){
    if (window.BNB_USERS) return window.BNB_USERS.getMembers().map(u=>({ id:u.id, name:u.fullName }));
    return SCHED_MEMBERS_FALLBACK;
  }
  function trainerName(id){
    if (window.BNB_USERS){ const n = window.BNB_USERS.getName(id); if (n) return n; }
    const t = getSchedTrainers().find(x=>x.id===id); return t ? t.name : 'Unassigned';
  }
  // Keeps selfTrainerId honest against the live trainer list. If the trainer
  // currently being "viewed as" loses the trainer role (or gets deleted) in
  // Admin > Users, fall back to the first remaining trainer rather than
  // silently rendering empty panels under a stale id. Returns false when
  // there are no trainer accounts at all, so callers can show that plainly.
  function ensureValidSelfTrainer(){
    const trainers = getSchedTrainers();
    if (!trainers.length){ selfTrainerId = null; return false; }
    if (!trainers.some(t=>t.id===selfTrainerId)){
      selfTrainerId = trainers[0].id;
      try{ localStorage.setItem('bnb-sched-self-trainer', selfTrainerId); }catch(e){}
    }
    return true;
  }
  // Confirmed 1-on-1 bookings for a trainer, joined with their slot for date/time.
  // Shared by the trainer's own "My Roster" tab and Admin's cross-trainer load summary.
  function ptSessionsForTrainer(trainerId){
    return ptBookings.filter(p=>p.trainerId===trainerId && p.status==='confirmed')
      .map(p=>({ p, sl: slots.find(x=>x.id===p.slotId) }))
      .filter(x=>x.sl);
  }
  function memberName(id){
    if (window.BNB_USERS){ const n = window.BNB_USERS.getName(id); if (n) return n; }
    const m = getSchedMembers().find(x=>x.id===id); return m ? m.name : 'Unknown Member';
  }

  const CLASSES_KEY = 'bnb-sched-classes-v1';
  const SESSIONS_KEY = 'bnb-sched-sessions-v1';
  const BOOKINGS_KEY = 'bnb-sched-bookings-v1';
  const SLOTS_KEY = 'bnb-sched-slots-v1';
  const PTBOOKINGS_KEY = 'bnb-sched-ptbookings-v1';

  const SEED_CLASSES = [
    { id:'c1', name:'Sunrise HIIT', instructorId:'u2', capacity:12, duration:45, description:'High-intensity interval circuit to start the day.', recurring:'Mon/Wed/Fri 06:00', status:'active' },
    { id:'c2', name:'Strength Foundations', instructorId:'t2', capacity:8, duration:60, description:'Barbell fundamentals — squat, hinge, press.', recurring:'Tue/Thu 17:30', status:'active' },
    { id:'c3', name:'Mobility & Core', instructorId:'u2', capacity:15, duration:40, description:'Movement prep, joint mobility and core bracing work.', recurring:'Sat 09:00', status:'active' }
  ];
  const SEED_SESSIONS = [
    { id:'s1', classId:'c1', date:'2026-08-27', startTime:'06:00', instructorId:'u2', capacityOverride:null, status:'scheduled' },
    { id:'s2', classId:'c1', date:'2026-08-29', startTime:'06:00', instructorId:'u2', capacityOverride:null, status:'scheduled' },
    { id:'s3', classId:'c2', date:'2026-08-27', startTime:'17:30', instructorId:'t2', capacityOverride:null, status:'scheduled' },
    { id:'s4', classId:'c3', date:'2026-08-30', startTime:'09:00', instructorId:'u2', capacityOverride:6, status:'scheduled' }
  ];
  const SEED_BOOKINGS = [
    { id:'b1', sessionId:'s1', userId:'u1', status:'confirmed', bookedAt:'2026-08-25T10:00:00' },
    { id:'b2', sessionId:'s1', userId:'u3', status:'confirmed', bookedAt:'2026-08-25T11:00:00' },
    { id:'b3', sessionId:'s3', userId:'u4', status:'confirmed', bookedAt:'2026-08-24T09:00:00' },
    { id:'b4', sessionId:'s4', userId:'u1', status:'confirmed', bookedAt:'2026-08-24T09:00:00' },
    { id:'b5', sessionId:'s4', userId:'u3', status:'confirmed', bookedAt:'2026-08-24T09:05:00' },
    { id:'b6', sessionId:'s4', userId:'u4', status:'confirmed', bookedAt:'2026-08-24T09:06:00' },
    { id:'b7', sessionId:'s4', userId:'u5', status:'confirmed', bookedAt:'2026-08-24T09:07:00' },
    { id:'b8', sessionId:'s4', userId:'u2', status:'confirmed', bookedAt:'2026-08-24T09:08:00' },
    { id:'b9', sessionId:'s4', userId:'u1', status:'waitlisted', bookedAt:'2026-08-26T08:00:00' }
  ];
  const SEED_SLOTS = [
    { id:'sl1', trainerId:'u2', date:'2026-08-28', startTime:'07:00', duration:60, status:'open' },
    { id:'sl2', trainerId:'u2', date:'2026-08-28', startTime:'08:00', duration:60, status:'booked' },
    { id:'sl3', trainerId:'t2', date:'2026-08-29', startTime:'12:00', duration:45, status:'open' },
    { id:'sl4', trainerId:'t2', date:'2026-08-29', startTime:'13:00', duration:45, status:'blocked' }
  ];
  const SEED_PTBOOKINGS = [
    { id:'pt1', slotId:'sl2', trainerId:'u2', userId:'u1', status:'confirmed', bookedAt:'2026-08-24T09:00:00', notes:'Focus: deadlift form' }
  ];

  // ---- Supabase field mapping (JS camelCase <-> Postgres snake_case) ----
  function classToRow(c){
    return {
      id: (c.id && c.id.length === 36) ? c.id : undefined,
      name: c.name, instructor_id: c.instructorId, capacity: c.capacity,
      duration: c.duration, description: c.description, recurring: c.recurring,
      status: c.status
    };
  }
  function rowToClass(r){
    return {
      id: r.id, name: r.name, instructorId: r.instructor_id, capacity: r.capacity,
      duration: r.duration, description: r.description||'', recurring: r.recurring||'',
      status: r.status
    };
  }
  function sessionToRow(s){
    return {
      id: (s.id && s.id.length === 36) ? s.id : undefined,
      class_id: s.classId, date: s.date, start_time: s.startTime,
      instructor_id: s.instructorId, capacity_override: s.capacityOverride,
      status: s.status
    };
  }
  function rowToSession(r){
    return {
      id: r.id, classId: r.class_id, date: r.date, startTime: r.start_time,
      instructorId: r.instructor_id, capacityOverride: r.capacity_override,
      status: r.status
    };
  }
  function bookingToRow(b){
    return {
      id: (b.id && b.id.length === 36) ? b.id : undefined,
      session_id: b.sessionId, user_id: b.userId, status: b.status,
      booked_at: b.bookedAt
    };
  }
  function rowToBooking(r){
    return {
      id: r.id, sessionId: r.session_id, userId: r.user_id, status: r.status,
      bookedAt: r.booked_at
    };
  }
  function slotToRow(s){
    return {
      id: (s.id && s.id.length === 36) ? s.id : undefined,
      trainer_id: s.trainerId, date: s.date, start_time: s.startTime,
      duration: s.duration, status: s.status
    };
  }
  function rowToSlot(r){
    return {
      id: r.id, trainerId: r.trainer_id, date: r.date, startTime: r.start_time,
      duration: r.duration, status: r.status
    };
  }
  function ptBookingToRow(p){
    return {
      id: (p.id && p.id.length === 36) ? p.id : undefined,
      slot_id: p.slotId, trainer_id: p.trainerId, user_id: p.userId,
      status: p.status, booked_at: p.bookedAt, notes: p.notes
    };
  }
  function rowToPtBooking(r){
    return {
      id: r.id, slotId: r.slot_id, trainerId: r.trainer_id, userId: r.user_id,
      status: r.status, bookedAt: r.booked_at, notes: r.notes||''
    };
  }

  async function migrateSeedScheduling(userIdMap){
    const classIdMap = {}, sessionIdMap = {}, slotIdMap = {};
    let counts = { classes:0, sessions:0, bookings:0, slots:0, ptBookings:0 };

    for (const c of SEED_CLASSES){
      const row = classToRow(c);
      delete row.id;
      row.instructor_id = userIdMap[c.instructorId] || null; // null if seed referenced a nonexistent trainer (e.g. 't2')
      const { data, error } = await bnbClient.from('classes').insert([row]).select();
      if (error){ console.warn('Seed migration: class failed', c.id, error); continue; }
      classIdMap[c.id] = data[0].id; counts.classes++;
    }
    for (const s of SEED_SESSIONS){
      const newClassId = classIdMap[s.classId];
      if (!newClassId) continue;
      const row = sessionToRow(s);
      delete row.id;
      row.class_id = newClassId;
      row.instructor_id = userIdMap[s.instructorId] || null;
      const { data, error } = await bnbClient.from('class_sessions').insert([row]).select();
      if (error){ console.warn('Seed migration: session failed', s.id, error); continue; }
      sessionIdMap[s.id] = data[0].id; counts.sessions++;
    }
    for (const b of SEED_BOOKINGS){
      const newSessionId = sessionIdMap[b.sessionId];
      const newUserId = userIdMap[b.userId];
      if (!newSessionId || !newUserId) continue;
      const row = bookingToRow(b);
      delete row.id;
      row.session_id = newSessionId; row.user_id = newUserId;
      const { error } = await bnbClient.from('bookings').insert([row]);
      if (!error) counts.bookings++;
    }
    for (const sl of SEED_SLOTS){
      const row = slotToRow(sl);
      delete row.id;
      row.trainer_id = userIdMap[sl.trainerId] || null;
      const { data, error } = await bnbClient.from('slots').insert([row]).select();
      if (error){ console.warn('Seed migration: slot failed', sl.id, error); continue; }
      slotIdMap[sl.id] = data[0].id; counts.slots++;
    }
    for (const pt of SEED_PTBOOKINGS){
      const newSlotId = slotIdMap[pt.slotId];
      const newTrainerId = userIdMap[pt.trainerId];
      const newUserId = userIdMap[pt.userId];
      if (!newSlotId || !newTrainerId || !newUserId) continue;
      const row = ptBookingToRow(pt);
      delete row.id;
      row.slot_id = newSlotId; row.trainer_id = newTrainerId; row.user_id = newUserId;
      const { error } = await bnbClient.from('pt_bookings').insert([row]);
      if (!error) counts.ptBookings++;
    }
    return counts;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.scheduling = migrateSeedScheduling;

  // Generic per-row upsert (see saveUsers() elsewhere for why not batch) —
  // shared by all five scheduling tables below.
  async function upsertRows(table, rows){
    const results = await Promise.allSettled(rows.map(row => bnbClient.from(table).upsert([row])));
    let successCount = 0;
    results.forEach((r, i) => {
      const failed = r.status === 'rejected' || (r.value && r.value.error);
      if (!failed) { successCount++; return; }
      console.warn('Supabase: could not save row in', table, rows[i].id, r.status === 'rejected' ? r.reason : r.value.error);
    });
    if (successCount === 0 && rows.length > 0){
      alert('Could not save to database — check your connection or Supabase setup.');
    }
  }
  // Diff-based delete support, for the two tables (classes, slots) whose
  // arrays actually shrink via filter() rather than only changing status.
  function deleteRemoved(table, oldArr, newArr){
    const oldIds = new Set((oldArr||[]).map(x=>x.id));
    const newIds = new Set(newArr.map(x=>x.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    removedIds.forEach(id => {
      bnbClient.from(table).delete().eq('id', id).then(({error})=>{
        if (error) console.warn('Supabase: could not delete row in', table, id, error);
      });
    });
  }

  function loadStore(key, seed){
    // Instant first paint using seed data; real rows replace each store
    // once its matching refresh*FromSupabase() call responds.
    return seed.map(x=>Object.assign({}, x));
  }
  function saveStore(){ /* superseded — each table now has its own save*() below */ }

  let classes = loadStore(CLASSES_KEY, SEED_CLASSES);
  let sessions = loadStore(SESSIONS_KEY, SEED_SESSIONS);
  let bookings = loadStore(BOOKINGS_KEY, SEED_BOOKINGS);
  let slots = loadStore(SLOTS_KEY, SEED_SLOTS);
  let ptBookings = loadStore(PTBOOKINGS_KEY, SEED_PTBOOKINGS);
  // Snapshots for diff-based delete detection — only classes and slots
  // ever actually shrink via filter() (deleteSlot, deleteClass); sessions,
  // bookings, and PT bookings only ever change status in place, so they
  // don't need delete-diffing, just upsert.
  let classesSnapshot = classes.slice();
  let slotsSnapshot = slots.slice();

  function saveClasses(){
    deleteRemoved('classes', classesSnapshot, classes);
    classesSnapshot = classes.slice();
    const realRows = classes.filter(c => c.id && c.id.length === 36);
    upsertRows('classes', realRows.map(classToRow));
  }
  function saveSessions(){
    const realRows = sessions.filter(s => s.id && s.id.length === 36);
    upsertRows('class_sessions', realRows.map(sessionToRow));
  }
  function saveBookings(){
    const realRows = bookings.filter(b => b.id && b.id.length === 36);
    upsertRows('bookings', realRows.map(bookingToRow));
  }
  function saveSlots(){
    deleteRemoved('slots', slotsSnapshot, slots);
    slotsSnapshot = slots.slice();
    const realRows = slots.filter(s => s.id && s.id.length === 36);
    upsertRows('slots', realRows.map(slotToRow));
  }
  function savePtBookings(){
    const realRows = ptBookings.filter(p => p.id && p.id.length === 36);
    upsertRows('pt_bookings', realRows.map(ptBookingToRow));
  }

  async function refreshClassesFromSupabase(){
    const { data, error } = await bnbClient.from('classes').select('*');
    if (error) { console.error('Supabase load classes failed:', error); return; }
    if (data && data.length) {
      classes = data.map(rowToClass);
      classesSnapshot = classes.slice();
      if (typeof renderBody === 'function') renderBody();
    }
  }
  async function refreshSessionsFromSupabase(){
    const { data, error } = await bnbClient.from('class_sessions').select('*');
    if (error) { console.error('Supabase load class_sessions failed:', error); return; }
    if (data && data.length) {
      sessions = data.map(rowToSession);
      if (typeof renderBody === 'function') renderBody();
    }
  }
  async function refreshBookingsFromSupabase(){
    const { data, error } = await bnbClient.from('bookings').select('*');
    if (error) { console.error('Supabase load bookings failed:', error); return; }
    if (data && data.length) {
      bookings = data.map(rowToBooking);
      if (typeof renderBody === 'function') renderBody();
    }
  }
  async function refreshSlotsFromSupabase(){
    const { data, error } = await bnbClient.from('slots').select('*');
    if (error) { console.error('Supabase load slots failed:', error); return; }
    if (data && data.length) {
      slots = data.map(rowToSlot);
      slotsSnapshot = slots.slice();
      if (typeof renderBody === 'function') renderBody();
    }
  }
  async function refreshPtBookingsFromSupabase(){
    const { data, error } = await bnbClient.from('pt_bookings').select('*');
    if (error) { console.error('Supabase load pt_bookings failed:', error); return; }
    if (data && data.length) {
      ptBookings = data.map(rowToPtBooking);
      if (typeof renderBody === 'function') renderBody();
    }
  }

  // Kick off all five loads — each replaces its seed-based instant-paint
  // array once Supabase responds, same hybrid pattern used throughout.
  refreshClassesFromSupabase();
  refreshSessionsFromSupabase();
  refreshBookingsFromSupabase();
  refreshSlotsFromSupabase();
  refreshPtBookingsFromSupabase();

  function uid(prefix){ return window.BNB_UUID(); } // real UUID now — prefix kept as a param for call-site compatibility, but unused

  function getClass(id){ return classes.find(c=>c.id===id); }
  function getSession(id){ return sessions.find(s=>s.id===id); }
  function sessionCapacity(sess){
    const cls = getClass(sess.classId);
    return (sess.capacityOverride != null && sess.capacityOverride !== '') ? Number(sess.capacityOverride) : (cls ? cls.capacity : 0);
  }
  function sessionConfirmedCount(sessId){
    return bookings.filter(b=>b.sessionId===sessId && b.status==='confirmed').length;
  }
  function sessionWaitlist(sessId){
    return bookings.filter(b=>b.sessionId===sessId && b.status==='waitlisted').sort((a,b)=> a.bookedAt < b.bookedAt ? -1 : 1);
  }
  function memberBookingForSession(sessId, userId){
    return bookings.find(b=>b.sessionId===sessId && b.userId===userId && (b.status==='confirmed' || b.status==='waitlisted'));
  }

  function fmtDate(d){
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
    } catch(e){ return d; }
  }
  function fmtTime(t){
    if (!t) return '';
    const [h,m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = ((h+11)%12)+1;
    return h12 + ':' + String(m).padStart(2,'0') + ' ' + ampm;
  }
  function timeToMinutes(t){ const [h,m] = t.split(':').map(Number); return h*60+m; }

  function toast(msg){
    const el = document.getElementById('t-toast');
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._schedTimer);
    el._schedTimer = setTimeout(()=> el.classList.remove('show'), 2200);
  }

  /* ---------------- STATE ---------------- */
  let selfMemberId = (function(){
    // Prefer the real logged-in identity (Supabase Auth) if they're a
    // member; falls back to the old manual "Viewing as" selection for
    // staff previewing a member, or guests before anyone logs in.
    var real = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (real && real.roles && real.roles.indexOf('member') !== -1) return real.id;
    try { return localStorage.getItem('bnb-sched-self-member') || (getSchedMembers()[0]||{}).id; }
    catch(e){ return (getSchedMembers()[0]||{}).id; }
  })();
  // Same pattern as selfMemberId above: a real logged-in trainer is always
  // themselves, never something to "view as" — the localStorage/first-
  // trainer fallback below only applies to admin/staff accounts without
  // the trainer role, who legitimately need to pick whose roster to view.
  let selfTrainerId = (function(){
    var real = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (real && real.roles && real.roles.indexOf('trainer') !== -1) return real.id;
    try { return localStorage.getItem('bnb-sched-self-trainer') || (getSchedTrainers()[0]||{}).id; }
    catch(e){ return (getSchedTrainers()[0]||{}).id; }
  })();
  let memberSubTab = 'browse';
  let memberTrainerId = null; // Book a Trainer's selected trainer
  let trainerSubTab = 'roster';
  let adminSubTab = 'classes';
  let classFilter = 'all';
  let editingClassId = null;
  let activeSlotFormTrainer = null;
  let activeRosterSessionId = null;
  // Client Progress panel state (Coach Dashboard) — kept as plain variables
  // rather than rebuilt from scratch each render, so the selected client/
  // marker survive a dashboard refresh (e.g. after booking a slot).
  let progressClientId = null;
  let progressMarker = 'assessment'; // 'assessment' | 'exercise' | 'attendance' | 'compliance'
  let progressAssessmentField = 'weight'; // 'weight' | 'bodyfat' | 'tapefat'
  let progressExercise = null;
  // "Today's Program" marker: programs isn't preloaded in this file's
  // closure (Program Builder's data lives in the main file's own separate
  // script), so each selected client's today's-program blob is fetched
  // once on demand and cached here, keyed by client id.
  let complianceProgramCache = {};
  // "Tape Body Fat %": a client's saved body_measurements rows, fetched
  // once per client on demand, same pattern as complianceProgramCache.
  let measurementsCache = {};
  // "Blood Pressure" / "Steps": a client's blood_pressure_log and step_log
  // rows, fetched together once per client, same pattern again.
  let vitalsCache = {};
  let progressVitalsDays = 30; // 30 | 90

  /* ---------------- IDENTITY ROW ---------------- */
  // Booking is member-only now — the old Admin view (class/session
  // management) moved to the ADMIN tab's Sessions sub-tab, so this row no
  // longer needs to branch on a view toggle.
  function renderIdentityRow(){
    const row = document.getElementById('sched-identity-row');
    if (!row) return;
    row.innerHTML = '<label>Booking as</label><select id="sched-self-member"></select><span id="sched-self-credits" class="field-hint" style="margin-left:10px;"></span>';
    const sel = document.getElementById('sched-self-member');
    getSchedMembers().forEach(m=>{ const o = document.createElement('option'); o.value=m.id; o.textContent=m.name; sel.appendChild(o); });
    sel.value = selfMemberId;
    const renderCreditsLabel = ()=>{
      const c = window.BNB_USERS ? window.BNB_USERS.getCredits(selfMemberId) : 0;
      document.getElementById('sched-self-credits').textContent = c + ' session credit' + (c===1?'':'s');
    };
    renderCreditsLabel();
    sel.addEventListener('change', ()=>{ selfMemberId = sel.value; try{ localStorage.setItem('bnb-sched-self-member', selfMemberId); }catch(e){} renderCreditsLabel(); renderBody(); });
  }

  /* ---------------- COACH IDENTITY ROW (own tab now, was Schedule > Trainer) ---------------- */
  function renderCoachIdentityRow(){
    const row = document.getElementById('coach-identity-row');
    if (!row) return;
    // A logged-in trainer always sees their own roster — no "viewing as"
    // switch, so they can't casually browse another trainer's clients.
    // Admin/staff accounts without the trainer role keep the switcher,
    // a legitimate oversight/coverage convenience.
    const real = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const isTrainer = !!(real && real.roles && real.roles.indexOf('trainer') !== -1);
    if (isTrainer){
      selfTrainerId = real.id;
      row.innerHTML = '<label>Viewing</label><span class="status-pill">' + esc(real.fullName) + ' (you)</span>';
      return;
    }
    if (!ensureValidSelfTrainer()){
      row.innerHTML = '<label>Viewing as</label><span class="status-pill blocked">No trainer accounts</span>';
      return;
    }
    row.innerHTML = '<label>Viewing as</label><select id="coach-self-trainer"></select>';
    const sel = document.getElementById('coach-self-trainer');
    getSchedTrainers().forEach(t=>{ const o = document.createElement('option'); o.value=t.id; o.textContent=t.name; sel.appendChild(o); });
    sel.value = selfTrainerId;
    sel.addEventListener('change', ()=>{ selfTrainerId = sel.value; try{ localStorage.setItem('bnb-sched-self-trainer', selfTrainerId); }catch(e){} renderBody(); });
  }

  function renderBody(){
    const memberBody = document.getElementById('sched-view-body');
    if (memberBody){
      memberBody.innerHTML = memberViewHtml();
      wireBody(memberBody, 'member');
    }
    // Admin (class/session management) now lives in its own permanently
    // rendered container under ADMIN > Sessions, rather than being toggled
    // in and out of the same spot as the member view above.
    const adminBody = document.getElementById('admin-sessions-body');
    if (adminBody){
      adminBody.innerHTML = adminViewHtml();
      wireBody(adminBody, 'admin');
    }
    renderCoachBody();
    fillRatingComments();
  }

  /* ---------------- COACH BODY (own tab now, was Schedule > Trainer) ---------------- */
  function renderCoachBody(){
    const body = document.getElementById('coach-view-body');
    if (body){
      body.innerHTML = trainerViewHtml();
      wireCoachBody();
    }
    renderCoachDashboard();
  }
  function wireCoachBody(){
    const body = document.getElementById('coach-view-body');
    if (!body) return;
    body.querySelectorAll('[data-subtab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        trainerSubTab = btn.getAttribute('data-subtab');
        renderCoachBody();
        fillRatingComments();
      });
    });
    body.querySelectorAll('[data-action]').forEach(btn=>{
      const action = btn.getAttribute('data-action'), id = btn.getAttribute('data-id');
      btn.addEventListener('click', ()=>{
        if (action === 'open-roster') openRoster(id);
        else if (action === 'block-slot') blockSlot(id);
        else if (action === 'unblock-slot') unblockSlot(id);
        else if (action === 'delete-slot') deleteSlot(id);
        else if (action === 'cancel-pt-trainer') cancelPtTrainer(id);
        else if (action === 'message-client'){
          window.BNB_MESSAGES_PENDING_MEMBER = id;
          const messagesBtn = document.querySelector('#coach-section-switch [data-coach-section="messages"]');
          if (messagesBtn) messagesBtn.click();
        }
      });
    });
    const addSlotBtn = body.querySelector('#sched-add-slot-btn');
    if (addSlotBtn) addSlotBtn.addEventListener('click', ()=>{
      activeSlotFormTrainer = selfTrainerId;
      document.getElementById('sched-slot-date').value = '';
      document.getElementById('sched-slot-time').value = '';
      document.getElementById('sched-slot-duration').value = 60;
      document.getElementById('sched-slot-panel-backdrop').classList.add('show');
    });
  }

  /* ============================================================
     MEMBER VIEW
     ============================================================ */
  function upcomingSessions(){
    return sessions.filter(s=> s.status==='scheduled' && s.date >= TODAY).sort((a,b)=> (a.date+a.startTime) < (b.date+b.startTime) ? -1 : 1);
  }
  function groupByDate(list, dateKey){
    const groups = {};
    list.forEach(item=>{ const d = item[dateKey]; (groups[d] = groups[d] || []).push(item); });
    return Object.keys(groups).sort().map(d=>({ date:d, items:groups[d] }));
  }

  function memberViewHtml(){
    let html = '<div class="sched-sub">';
    html += subBtn('browse', memberSubTab, 'Browse & Book');
    html += subBtn('trainer', memberSubTab, 'Book a Trainer');
    html += subBtn('mine', memberSubTab, 'My Schedule');
    html += subBtn('rate', memberSubTab, 'Rate Coaches');
    html += '</div>';
    if (memberSubTab === 'browse') html += memberBrowseHtml();
    else if (memberSubTab === 'trainer') html += memberBookTrainerHtml();
    else if (memberSubTab === 'rate') html += memberRateHtml();
    else html += memberMineHtml();
    return html;
  }
  function subBtn(val, current, label){
    return '<button data-subtab="'+val+'" class="'+(val===current?'active':'')+'">'+label+'</button>';
  }

  function memberBrowseHtml(){
    const activeClasses = classes.filter(c=>c.status==='active');
    let chips = '<div class="chip-filter" id="sched-class-chips"><button data-filter="all" class="'+(classFilter==='all'?'active':'')+'">All</button>';
    activeClasses.forEach(c=> chips += '<button data-filter="'+c.id+'" class="'+(classFilter===c.id?'active':'')+'">'+c.name+'</button>');
    chips += '</div>';

    let sess = upcomingSessions();
    if (classFilter !== 'all') sess = sess.filter(s=>s.classId===classFilter);
    if (!sess.length) return chips + '<div class="empty-msg">No upcoming sessions match this filter.</div>';

    let html = chips;
    groupByDate(sess, 'date').forEach(group=>{
      html += '<div class="day-group"><h4>'+fmtDate(group.date)+'</h4><div class="sess-grid">';
      group.items.forEach(s=>{
        const cls = getClass(s.classId);
        if (!cls) return;
        const cap = sessionCapacity(s);
        const confirmed = sessionConfirmedCount(s.id);
        const pct = cap ? Math.min(100, Math.round(confirmed/cap*100)) : 0;
        const full = confirmed >= cap;
        const myBooking = memberBookingForSession(s.id, selfMemberId);
        html += '<div class="sess-card">';
        html += '<div class="sc-time">'+fmtTime(s.startTime)+' · '+cls.duration+' min</div>';
        html += '<h5>'+cls.name+'</h5>';
        html += '<div class="sc-meta">'+trainerName(s.instructorId)+' · '+confirmed+'/'+cap+' booked</div>';
        html += '<div class="cap-meter"><i class="'+(full?'full':'')+'" style="width:'+pct+'%;"></i></div>';
        html += '<div class="sc-actions">';
        if (myBooking){
          html += '<span class="status-pill '+myBooking.status+'">'+(myBooking.status==='confirmed'?'Booked':'Waitlisted')+'</span>';
          html += '<button class="row-actions" data-action="member-cancel-booking" data-id="'+myBooking.id+'" style="all:unset;cursor:pointer;color:var(--muted);font-size:11.5px;font-family:\'IBM Plex Mono\',monospace;text-decoration:underline;">Cancel</button>';
        } else {
          html += '<button class="btn2 primary" data-action="member-book-session" data-id="'+s.id+'">'+(full?'Join Waitlist':'Book')+'</button>';
        }
        html += '</div></div>';
      });
      html += '</div></div>';
    });
    return html;
  }

  function memberBookTrainerHtml(){
    // The chosen trainer lives in memberTrainerId rather than being read
    // back off the old <select> — every change re-renders this whole
    // view, and a rebuilt <select> with no `selected` option would show
    // the first trainer's name above a different trainer's slots.
    const trainers = getSchedTrainers();
    if (!trainers.some(t=>t.id===memberTrainerId)) memberTrainerId = (trainers[0]||{}).id;
    const trainerId = memberTrainerId;
    let html = '<div class="form-inline"><div class="field"><label>Trainer</label><select id="sched-mbt-trainer">';
    trainers.forEach(t=> html += '<option value="'+t.id+'"'+(t.id===trainerId?' selected':'')+'>'+esc(t.name)+'</option>');
    html += '</select></div></div>';
    html += '<div class="rating-inline">' + ratingSummaryLineHtml(trainerId) + '</div>';
    const openSlots = slots.filter(sl=>sl.trainerId===trainerId && sl.status==='open' && sl.date >= TODAY).sort((a,b)=> (a.date+a.startTime) < (b.date+b.startTime) ? -1 : 1);
    if (!openSlots.length){ html += '<div class="empty-msg">No open 1-on-1 slots for this trainer right now.</div>'; return html; }
    html += '<table class="admin-table"><tr><th>Date</th><th>Time</th><th>Duration</th><th></th></tr>';
    openSlots.forEach(sl=>{
      html += '<tr><td>'+fmtDate(sl.date)+'</td><td>'+fmtTime(sl.startTime)+'</td><td>'+sl.duration+' min</td><td><button class="btn2 primary" data-action="member-book-slot" data-id="'+sl.id+'">Book</button></td></tr>';
    });
    html += '</table>';
    return html;
  }

  function memberMineHtml(){
    const myClassBookings = bookings.filter(b=>b.userId===selfMemberId && (b.status==='confirmed' || b.status==='waitlisted'))
      .map(b=>({ b, s:getSession(b.sessionId) })).filter(x=>x.s);
    const myPt = ptBookings.filter(p=>p.userId===selfMemberId && p.status==='confirmed')
      .map(p=>({ p, sl:slots.find(sl=>sl.id===p.slotId) })).filter(x=>x.sl);

    let html = '<div class="section-sub-head" style="margin-top:0;"><h3>Class Bookings</h3></div>';
    if (!myClassBookings.length) html += '<div class="empty-msg">No upcoming class bookings.</div>';
    else {
      html += '<table class="admin-table"><tr><th>Class</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr>';
      myClassBookings.sort((a,b)=> (a.s.date+a.s.startTime) < (b.s.date+b.s.startTime) ? -1 : 1).forEach(x=>{
        const cls = getClass(x.s.classId);
        html += '<tr><td>'+(cls?cls.name:'—')+'</td><td>'+fmtDate(x.s.date)+'</td><td>'+fmtTime(x.s.startTime)+'</td><td><span class="status-pill '+x.b.status+'">'+x.b.status+'</span></td><td><div class="row-actions"><button data-action="member-cancel-booking" data-id="'+x.b.id+'">Cancel</button></div></td></tr>';
      });
      html += '</table>';
    }

    html += '<div class="section-sub-head"><h3>1-on-1 Sessions</h3></div>';
    if (!myPt.length) html += '<div class="empty-msg">No upcoming 1-on-1 sessions.</div>';
    else {
      html += '<table class="admin-table"><tr><th>Trainer</th><th>Date</th><th>Time</th><th></th></tr>';
      myPt.sort((a,b)=> (a.sl.date+a.sl.startTime) < (b.sl.date+b.sl.startTime) ? -1 : 1).forEach(x=>{
        html += '<tr><td>'+trainerName(x.p.trainerId)+'</td><td>'+fmtDate(x.sl.date)+'</td><td>'+fmtTime(x.sl.startTime)+'</td><td><div class="row-actions"><button data-action="member-cancel-pt" data-id="'+x.p.id+'">Cancel</button></div></td></tr>';
      });
      html += '</table>';
    }
    return html;
  }

  /* ============================================================
     COACH RATINGS (sql/41)
     Members rate coaches they've had a past 1-on-1 with, across five
     categories; the overall score is just the average of the five.
     Individual rows are only ever readable by the member who wrote
     them and by admins — coaches and other members get aggregates and
     anonymous comments through RPCs, and only once a coach has 3+
     ratings (enforced server-side, mirrored here only for wording).
     ============================================================ */
  const RATING_CATEGORIES = [
    { key:'knowledge', label:'Knowledge' },
    { key:'motivation', label:'Motivation' },
    { key:'punctuality', label:'Punctuality' },
    { key:'hygiene', label:'Hygiene' },
    { key:'attire', label:'Attire' }
  ];
  const MIN_RATINGS_SHOWN = 3;
  let ratingSummaries = {};   // coachId -> row from coach_rating_summaries()
  let myRatings = {};         // coachId -> the logged-in member's own coach_ratings row
  let adminRatings = null;    // every coach_ratings row (admins only); null until loaded
  let ratingCommentsCache = {}; // coachId -> rows from coach_rating_comments()

  function realSelf(){
    return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  }
  function selfIsAdmin(){
    const me = realSelf();
    return !!(me && me.roles && me.roles.indexOf('admin') !== -1);
  }

  async function refreshCoachRatings(){
    const me = realSelf();
    if (!me) return;
    const summaryRes = await bnbClient.rpc('coach_rating_summaries');
    if (summaryRes.error) console.error('Supabase load coach_rating_summaries failed:', summaryRes.error);
    else { ratingSummaries = {}; (summaryRes.data || []).forEach(r=> ratingSummaries[r.coach_id] = r); }

    // Admins can read every row under RLS, so filter to their own here
    // rather than relying on the policy to do it.
    const mineRes = await bnbClient.from('coach_ratings').select('*').eq('client_id', me.id);
    if (mineRes.error) console.error('Supabase load own coach_ratings failed:', mineRes.error);
    else { myRatings = {}; (mineRes.data || []).forEach(r=> myRatings[r.coach_id] = r); }

    if (selfIsAdmin()){
      const allRes = await bnbClient.from('coach_ratings').select('*').order('updated_at', { ascending: false });
      if (allRes.error) console.error('Supabase load all coach_ratings failed:', allRes.error);
      else adminRatings = allRes.data || [];
    }
    ratingCommentsCache = {};
    renderBody();
  }

  function overallOf(r){
    return RATING_CATEGORIES.reduce((sum, c)=> sum + Number(r[c.key]), 0) / RATING_CATEGORIES.length;
  }
  function starsHtml(value){
    const full = Math.round(Number(value) || 0);
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= full ? '★' : '☆';
    return '<span class="rating-stars">' + s + '</span>';
  }
  function ratingSummaryLineHtml(coachId){
    const s = ratingSummaries[coachId];
    if (!s || !s.rating_count) return '<span class="field-hint">No ratings yet</span>';
    if (s.overall === null) return '<span class="field-hint">' + s.rating_count + ' rating' + (s.rating_count===1?'':'s') + ' so far — averages show from ' + MIN_RATINGS_SHOWN + '</span>';
    return starsHtml(s.overall) + ' <b>' + Number(s.overall).toFixed(1) + '</b> <span class="field-hint">(' + s.rating_count + ' ratings)</span>';
  }
  function ratingBreakdownHtml(coachId){
    const s = ratingSummaries[coachId];
    if (!s || s.overall === null) return '';
    let html = '<div class="rating-breakdown">';
    RATING_CATEGORIES.forEach(c=>{
      const v = Number(s[c.key]);
      html += '<div class="rating-bar-row"><span class="rating-bar-label">' + c.label + '</span>' +
        '<span class="rating-bar"><span style="width:' + (v / 5 * 100) + '%"></span></span>' +
        '<span class="rating-bar-num">' + v.toFixed(1) + '</span></div>';
    });
    return html + '</div>';
  }

  // Coaches this member can rate — a past, confirmed 1-on-1. Same rule as has_trained_with() in sql/41, which is the real
  // check; this just decides which forms to show.
  function coachesTrainedWith(memberId){
    const ids = {};
    ptBookings.forEach(p=>{
      if (p.userId !== memberId || p.status !== 'confirmed') return;
      const sl = slots.find(x=>x.id===p.slotId);
      if (sl && sl.trainerId === p.trainerId && sl.date <= TODAY) ids[p.trainerId] = true;
    });
    return Object.keys(ids);
  }

  function memberRateHtml(){
    const me = realSelf();
    let html = '<div class="section-sub-head"><h3>Your Coaches</h3></div>';
    html += '<div class="field-hint" style="margin:-6px 0 14px;">Coaches see the averages and comments, never who wrote them. One rating per coach — come back and update it any time.</div>';

    if (!me || me.id !== selfMemberId){
      html += '<div class="empty-msg">Ratings can only be given by the member themselves, from their own login.</div>';
    } else {
      const coachIds = coachesTrainedWith(selfMemberId);
      if (!coachIds.length){
        html += '<div class="empty-msg">After your first 1-on-1 session with a coach, you can rate them here.</div>';
      } else {
        html += '<div class="rate-grid">';
        coachIds.forEach(cid=>{
          const mine = myRatings[cid];
          html += '<div class="rate-card" data-coach="' + cid + '"' +
            RATING_CATEGORIES.map(c=> ' data-' + c.key + '="' + (mine ? mine[c.key] : '') + '"').join('') + '>';
          html += '<div class="rate-card-head"><b>' + esc(trainerName(cid)) + '</b><span class="field-hint">' +
            (mine ? 'Last updated ' + fmtDate(mine.updated_at.slice(0, 10)) : 'Not rated yet') + '</span></div>';
          RATING_CATEGORIES.forEach(c=>{
            const v = mine ? mine[c.key] : 0;
            html += '<div class="rate-row"><span class="rate-label">' + c.label + '</span><span class="rate-stars-input">';
            for (let i = 1; i <= 5; i++){
              html += '<button type="button" class="rate-star' + (i <= v ? ' on' : '') + '" data-cat="' + c.key + '" data-val="' + i + '" aria-label="' + c.label + ' ' + i + ' of 5">★</button>';
            }
            html += '</span></div>';
          });
          html += '<div class="field"><label>Comment (optional)</label><textarea rows="2" maxlength="500" placeholder="What stands out — good or bad?">' + esc(mine && mine.comment) + '</textarea></div>';
          if (mine && mine.comment_hidden) html += '<div class="field-hint">Your comment was hidden by staff. Editing it will resubmit it.</div>';
          html += '<button class="btn2 primary" data-action="save-rating" data-id="' + cid + '">' + (mine ? 'Update Rating' : 'Submit Rating') + '</button>';
          html += '</div>';
        });
        html += '</div>';
      }
    }

    html += '<div class="section-sub-head"><h3>All Coaches</h3></div>';
    const trainers = getSchedTrainers();
    if (!trainers.length) return html + '<div class="empty-msg">No coaches yet.</div>';
    html += '<div class="rate-grid">';
    trainers.forEach(t=>{
      html += '<div class="rate-card"><div class="rate-card-head"><b>' + esc(t.name) + '</b><span>' + ratingSummaryLineHtml(t.id) + '</span></div>' +
        ratingBreakdownHtml(t.id) + '<div class="rating-comments" data-comments-for="' + t.id + '"></div></div>';
    });
    return html + '</div>';
  }

  function trainerRatingsHtml(){
    const s = ratingSummaries[selfTrainerId];
    let html = '<div class="field-hint" style="margin-bottom:14px;">Ratings are anonymous — you see averages and comments, never who left them. Averages and comments appear once you have ' + MIN_RATINGS_SHOWN + ' ratings.</div>';
    if (!s || !s.rating_count) return html + '<div class="empty-msg">No ratings yet. Clients can rate you after a 1-on-1 session.</div>';
    html += '<div class="rate-card"><div class="rate-card-head"><b>Overall</b><span>' + ratingSummaryLineHtml(selfTrainerId) + '</span></div>' +
      ratingBreakdownHtml(selfTrainerId) + '<div class="rating-comments" data-comments-for="' + selfTrainerId + '"></div></div>';
    return html;
  }

  function adminRatingsHtml(){
    if (!selfIsAdmin()) return '<div class="empty-msg">Only admins can see individual ratings.</div>';
    if (adminRatings === null) return '<div class="empty-msg">Loading ratings…</div>';
    if (!adminRatings.length) return '<div class="empty-msg">No ratings yet.</div>';
    let html = '<div class="field-hint" style="margin-bottom:14px;">Admin-only view — client names are never shown to coaches. Hiding a comment removes it from what coaches and members see; the stars still count.</div>';
    html += '<table class="admin-table"><tr><th>Coach</th><th>Client</th>' +
      RATING_CATEGORIES.map(c=> '<th>' + c.label.slice(0, 5) + '</th>').join('') +
      '<th>Overall</th><th>Comment</th><th>Updated</th><th></th></tr>';
    adminRatings.forEach(r=>{
      html += '<tr><td>' + esc(trainerName(r.coach_id)) + '</td><td>' + esc(memberName(r.client_id)) + '</td>' +
        RATING_CATEGORIES.map(c=> '<td>' + r[c.key] + '</td>').join('') +
        '<td>' + overallOf(r).toFixed(1) + '</td>' +
        '<td class="' + (r.comment_hidden ? 'rating-comment-hidden' : '') + '">' + (r.comment ? esc(r.comment) : '—') + '</td>' +
        '<td>' + fmtDate(r.updated_at.slice(0, 10)) + '</td><td>' +
        (r.comment ? '<div class="row-actions"><button data-action="toggle-rating-hidden" data-id="' + r.id + '">' + (r.comment_hidden ? 'Unhide' : 'Hide') + '</button></div>' : '') +
        '</td></tr>';
    });
    return html + '</table>';
  }

  // Comments come from a separate RPC per coach, so they're filled in
  // after the surrounding HTML renders rather than blocking it.
  function fillRatingComments(){
    document.querySelectorAll('[data-comments-for]').forEach(async el=>{
      const coachId = el.getAttribute('data-comments-for');
      const s = ratingSummaries[coachId];
      if (!s || s.overall === null) return;
      if (!ratingCommentsCache[coachId]){
        const { data, error } = await bnbClient.rpc('coach_rating_comments', { p_coach_id: coachId });
        if (error){ console.error('Supabase load coach_rating_comments failed:', error); return; }
        ratingCommentsCache[coachId] = data || [];
      }
      const rows = ratingCommentsCache[coachId];
      el.innerHTML = rows.length ? rows.map(r=>
        '<div class="rating-comment">' + starsHtml(r.overall) + ' <span class="field-hint">' + esc(fmtMonth(r.month)) + '</span><div>' + esc(r.comment) + '</div></div>'
      ).join('') : '';
    });
  }
  function fmtMonth(d){
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month:'short', year:'numeric' });
  }

  async function saveCoachRating(coachId, card){
    const params = { p_coach_id: coachId };
    for (const c of RATING_CATEGORIES){
      const v = Number(card.getAttribute('data-' + c.key));
      if (!v){ toast('Rate all five categories first.'); return; }
      params['p_' + c.key] = v;
    }
    params.p_comment = card.querySelector('textarea').value;
    const { error } = await bnbClient.rpc('rate_coach', params);
    if (error){ toast(error.message || 'Could not save rating.'); return; }
    toast('Rating saved — thank you!');
    refreshCoachRatings();
  }
  async function toggleRatingHidden(ratingId){
    const r = (adminRatings || []).find(x=>x.id===ratingId);
    if (!r) return;
    const { error } = await bnbClient.rpc('admin_set_rating_hidden', { p_rating_id: ratingId, p_hidden: !r.comment_hidden });
    if (error){ toast(error.message || 'Could not update comment.'); return; }
    toast(r.comment_hidden ? 'Comment visible again' : 'Comment hidden');
    refreshCoachRatings();
  }

  /* ============================================================
     TRAINER VIEW
     ============================================================ */
  function trainerViewHtml(){
    if (!ensureValidSelfTrainer()){
      return '<div class="empty-msg">No trainer accounts exist yet — add one in Admin &gt; Users and tag it with the Trainer role.</div>';
    }
    let html = '<div class="sched-sub">';
    html += subBtn('roster', trainerSubTab, 'My Roster');
    html += subBtn('classes', trainerSubTab, 'My Classes');
    html += subBtn('slots', trainerSubTab, 'My 1-on-1 Slots');
    html += subBtn('ratings', trainerSubTab, 'My Ratings');
    html += '</div>';
    if (trainerSubTab === 'roster') html += trainerRosterHtml();
    else if (trainerSubTab === 'classes') html += trainerClassesHtml();
    else if (trainerSubTab === 'ratings') html += trainerRatingsHtml();
    else html += trainerSlotsHtml();
    return html;
  }

  function trainerRosterHtml(){
    // Roster = the union of (a) members formally assigned to this trainer
    // (users.trainer_id) and (b) members with at least one confirmed 1-on-1
    // booking with them (bnb-sched-ptbookings-v1), each resolved against
    // their slot for date/time. (a) means an assigned client shows up
    // immediately, before their first session; (b) keeps a one-off/drop-in
    // PT client visible even without a formal assignment. Paired with a
    // quick load summary (upcoming 1-on-1s + upcoming class sessions) so a
    // trainer can see "who's mine" and "how full is my week" in one place,
    // instead of digging through the raw slot list.
    const mine = ptSessionsForTrainer(selfTrainerId);
    const clientMap = {};
    mine.forEach(x=>{
      (clientMap[x.p.userId] = clientMap[x.p.userId] || []).push(x);
    });
    const assignedIds = (window.BNB_USERS ? window.BNB_USERS.getMembers() : [])
      .filter(u => u.trainerId === selfTrainerId)
      .map(u => u.id);
    const clientIds = Array.from(new Set([...Object.keys(clientMap), ...assignedIds]));
    const upcomingPt = mine.filter(x=> x.sl.date >= TODAY).length;
    const upcomingClasses = sessions.filter(s=>s.instructorId===selfTrainerId && s.status==='scheduled' && s.date >= TODAY).length;

    let html = '<div class="field-hint" style="margin-bottom:14px;">' +
      clientIds.length + ' active client' + (clientIds.length===1?'':'s') + ' · ' +
      upcomingPt + ' upcoming 1-on-1 session' + (upcomingPt===1?'':'s') + ' · ' +
      upcomingClasses + ' upcoming class session' + (upcomingClasses===1?'':'s') + '</div>';

    if (!clientIds.length) return html + '<div class="empty-msg">No clients yet — assign one in Admin &gt; Users, or a booked session will show up here.</div>';

    const rows = clientIds.map(uid=>{
      const entries = (clientMap[uid] || []).slice().sort((a,b)=> (a.sl.date+a.sl.startTime) < (b.sl.date+b.sl.startTime) ? -1 : 1);
      const upcoming = entries.filter(x=> x.sl.date >= TODAY);
      const past = entries.filter(x=> x.sl.date < TODAY);
      return { uid, total: entries.length, next: upcoming[0] || null, last: past.length ? past[past.length-1] : null };
    }).sort((a,b)=>{
      if (a.next && b.next) return (a.next.sl.date+a.next.sl.startTime) < (b.next.sl.date+b.next.sl.startTime) ? -1 : 1;
      if (a.next) return -1;
      if (b.next) return 1;
      return memberName(a.uid) < memberName(b.uid) ? -1 : 1;
    });

    html += '<table class="admin-table"><tr><th>Client</th><th>Next Session</th><th>Last Session</th><th>Total Sessions</th><th></th></tr>';
    rows.forEach(r=>{
      html += '<tr><td>'+memberName(r.uid)+'</td>' +
        '<td>'+(r.next ? fmtDate(r.next.sl.date)+' '+fmtTime(r.next.sl.startTime) : '—')+'</td>' +
        '<td>'+(r.last ? fmtDate(r.last.sl.date) : '—')+'</td>' +
        '<td>'+r.total+'</td>' +
        '<td><button class="btn2" data-action="message-client" data-id="'+r.uid+'">Message</button></td></tr>';
    });
    html += '</table>';
    return html;
  }

  function trainerClassesHtml(){
    const mySessions = sessions.filter(s=>s.instructorId===selfTrainerId && s.status==='scheduled' && s.date >= TODAY)
      .sort((a,b)=> (a.date+a.startTime) < (b.date+b.startTime) ? -1 : 1);
    if (!mySessions.length) return '<div class="empty-msg">No upcoming class sessions assigned to you.</div>';
    let html = '<table class="admin-table"><tr><th>Class</th><th>Date</th><th>Time</th><th>Roster</th><th></th></tr>';
    mySessions.forEach(s=>{
      const cls = getClass(s.classId);
      const cap = sessionCapacity(s);
      const confirmed = sessionConfirmedCount(s.id);
      const wl = sessionWaitlist(s.id).length;
      html += '<tr><td>'+(cls?cls.name:'—')+'</td><td>'+fmtDate(s.date)+'</td><td>'+fmtTime(s.startTime)+'</td><td>'+confirmed+'/'+cap+' · '+wl+' waitlisted</td><td><div class="row-actions"><button data-action="open-roster" data-id="'+s.id+'">View Roster</button></div></td></tr>';
    });
    html += '</table>';
    return html;
  }

  function trainerSlotsHtml(){
    let html = '<div class="crud-actions" style="padding:0 0 16px;"><button class="btn2 primary" id="sched-add-slot-btn">+ Add Availability Slot</button></div>';
    const mySlots = slots.filter(sl=>sl.trainerId===selfTrainerId && sl.date >= TODAY).sort((a,b)=> (a.date+a.startTime) < (b.date+b.startTime) ? -1 : 1);
    if (!mySlots.length){ html += '<div class="empty-msg">No upcoming slots. Add one above.</div>'; return html; }
    html += '<table class="admin-table"><tr><th>Date</th><th>Time</th><th>Duration</th><th>Status</th><th>Booked by</th><th></th></tr>';
    mySlots.forEach(sl=>{
      const pt = ptBookings.find(p=>p.slotId===sl.id && p.status==='confirmed');
      html += '<tr><td>'+fmtDate(sl.date)+'</td><td>'+fmtTime(sl.startTime)+'</td><td>'+sl.duration+' min</td><td><span class="status-pill '+sl.status+'">'+sl.status+'</span></td><td>'+(pt?memberName(pt.userId):'—')+'</td><td><div class="row-actions">';
      if (sl.status === 'open') html += '<button data-action="block-slot" data-id="'+sl.id+'">Block</button>';
      if (sl.status === 'blocked') html += '<button data-action="unblock-slot" data-id="'+sl.id+'">Unblock</button>';
      if (sl.status === 'booked' && pt) html += '<button class="del" data-action="cancel-pt-trainer" data-id="'+pt.id+'">Cancel Session</button>';
      if (sl.status !== 'booked') html += '<button class="del" data-action="delete-slot" data-id="'+sl.id+'">Delete</button>';
      html += '</div></td></tr>';
    });
    html += '</table>';
    return html;
  }

  /* ============================================================
     COACH DASHBOARD
     Pulls together what's already tracked elsewhere (roster, classes,
     slots, and — via window.BNB_BILLING — invoices) into one landing
     view, rather than a trainer having to check three sub-tabs plus
     Billing separately just to see "what does today look like."
     ============================================================ */
  function daysSince(dateStr){
    const a = new Date(TODAY + 'T00:00:00'), b = new Date(dateStr + 'T00:00:00');
    return Math.round((a - b) / 86400000);
  }
  // Same union as trainerRosterHtml() above: formally assigned (trainer_id)
  // plus anyone with a confirmed 1-on-1 booking, so the Dashboard's "Active
  // Clients" count matches what the Roster tab actually shows.
  function activeClientIdsForTrainer(trainerId){
    const seen = {};
    ptSessionsForTrainer(trainerId).forEach(x=> seen[x.p.userId] = true);
    (window.BNB_USERS ? window.BNB_USERS.getMembers() : [])
      .filter(u => u.trainerId === trainerId)
      .forEach(u => seen[u.id] = true);
    return Object.keys(seen);
  }
  function todaysAgendaForTrainer(trainerId){
    const classRows = sessions.filter(s=>s.instructorId===trainerId && s.status==='scheduled' && s.date===TODAY)
      .map(s=>{
        const cls = getClass(s.classId);
        return { type:'class', time:s.startTime, sessionId:s.id,
          label: cls ? cls.name : 'Class',
          meta: sessionConfirmedCount(s.id) + '/' + sessionCapacity(s) + ' booked' };
      });
    const ptRows = ptSessionsForTrainer(trainerId).filter(x=> x.sl.date===TODAY)
      .map(x=> ({ type:'pt', time:x.sl.startTime, label: memberName(x.p.userId), meta: x.sl.duration + ' min · 1-on-1' }));
    return classRows.concat(ptRows).sort((a,b)=> a.time < b.time ? -1 : (a.time > b.time ? 1 : 0));
  }
  function weeklyStatsForTrainer(trainerId){
    const wk = weekRange(TODAY);
    const classesWeek = sessions.filter(s=>s.instructorId===trainerId && s.status==='scheduled' && s.date>=wk.start && s.date<=wk.end).length;
    const ptWeek = ptSessionsForTrainer(trainerId).filter(x=> x.sl.date>=wk.start && x.sl.date<=wk.end).length;
    const openSlotsWeek = slots.filter(sl=>sl.trainerId===trainerId && sl.status==='open' && sl.date>=wk.start && sl.date<=wk.end).length;
    return { totalWeek: classesWeek + ptWeek, openSlotsWeek };
  }
  // No-shows this trainer's own class sessions logged in the last 7 days —
  // a nudge to follow up, not a permanent flag (Users > Admin Notes is where
  // a longer-term behavioral flag would live).
  function recentNoShowsForTrainer(trainerId){
    const mySessIds = {};
    sessions.filter(s=>s.instructorId===trainerId).forEach(s=> mySessIds[s.id]=true);
    return bookings.filter(b=> mySessIds[b.sessionId] && b.status==='no-show')
      .map(b=>{ const s = getSession(b.sessionId); return s ? { userId:b.userId, date:s.date, className:(getClass(s.classId)||{}).name||'Class' } : null; })
      .filter(x=> x && daysSince(x.date) >= 0 && daysSince(x.date) <= 7)
      .sort((a,b)=> a.date < b.date ? 1 : -1);
  }
  // Same "days since last visit" thresholding Users > Activity already uses
  // (fresh ≤3, ok ≤14, stale >14) — reused here as a plain >14 check since
  // that helper lives in a different module's closure.
  function staleClientsForTrainer(trainerId){
    const lastByClient = {};
    ptSessionsForTrainer(trainerId).forEach(x=>{
      const uid = x.p.userId, d = x.sl.date;
      if (!lastByClient[uid] || d > lastByClient[uid]) lastByClient[uid] = d;
    });
    return Object.keys(lastByClient).map(uid=> ({ userId:uid, days: daysSince(lastByClient[uid]) }))
      .filter(x=> x.days > 14)
      .sort((a,b)=> b.days - a.days);
  }
  function unpaidForTrainerClients(trainerId){
    if (!window.BNB_BILLING || !window.BNB_BILLING.getOutstandingForUsers) return [];
    const clientIds = activeClientIdsForTrainer(trainerId);
    if (!clientIds.length) return [];
    return window.BNB_BILLING.getOutstandingForUsers(clientIds);
  }
  function statCardHtml(num, label){
    return '<div class="stat-card"><div class="num">'+num+'</div><div class="lbl">'+label+'</div></div>';
  }

  /* ---------------- CLIENT PROGRESS PANEL (Coach Dashboard) ---------------- */
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmtChartDate(iso){
    try { return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' }); }
    catch(e){ return iso; }
  }
  // Small shared SVG builders in the same visual language as the Weight tab's
  // .weight-chart-svg (grid lines, axis labels, gold data line/dots) — sized
  // a bit larger (900×340 vs 700×320) since this is meant to read as the
  // dashboard's focal graphic, not a tucked-away widget.
  function svgLineChart(points){
    const W=900,H=260,padL=54,padR=24,padT=20,padB=40;
    const innerW=W-padL-padR, innerH=H-padT-padB;
    const values = points.map(p=>p.value);
    let minV=Math.min(...values), maxV=Math.max(...values);
    if (minV===maxV){ minV-=1; maxV+=1; }
    const pad=(maxV-minV)*0.15||1; minV-=pad; maxV+=pad;
    const xAt = i => points.length>1 ? padL + (i/(points.length-1))*innerW : padL+innerW/2;
    const yAt = v => padT+innerH-((v-minV)/(maxV-minV))*innerH;
    let svg='';
    for(let i=0;i<=4;i++){
      const v=minV+(maxV-minV)*(i/4), yy=yAt(v);
      svg += '<line class="grid-line" x1="'+padL+'" y1="'+yy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+yy.toFixed(1)+'"/>';
      svg += '<text class="axis-label" x="'+(padL-8)+'" y="'+(yy+3).toFixed(1)+'" text-anchor="end">'+v.toFixed(1)+'</text>';
    }
    const labelIdxs = points.length>2 ? [0, Math.floor((points.length-1)/2), points.length-1] : points.map((_,i)=>i);
    labelIdxs.forEach(i=>{
      svg += '<text class="axis-label" x="'+xAt(i).toFixed(1)+'" y="'+(H-padB+18)+'" text-anchor="middle">'+points[i].label+'</text>';
    });
    if (points.length>1){
      let d='';
      points.forEach((p,i)=>{ d += (i===0?'M':'L')+xAt(i).toFixed(1)+','+yAt(p.value).toFixed(1)+' '; });
      svg += '<path class="data-line" d="'+d+'"/>';
    }
    points.forEach((p,i)=>{
      svg += '<circle class="data-dot" cx="'+xAt(i).toFixed(1)+'" cy="'+yAt(p.value).toFixed(1)+'" r="4"><title>'+p.label+': '+p.value+'</title></circle>';
    });
    return '<svg class="weight-chart-svg" viewBox="0 0 '+W+' '+H+'">'+svg+'</svg>';
  }
  function svgBarChart(values, labels){
    const W=900,H=260,padL=54,padR=24,padT=20,padB=40;
    const innerW=W-padL-padR, innerH=H-padT-padB;
    const maxV = Math.max(1, Math.max.apply(null, values));
    const n = values.length, gap = 10;
    const barW = (innerW - gap*(n-1)) / n;
    let svg='';
    for(let i=0;i<=4;i++){
      const v = maxV*(i/4);
      const yy = padT+innerH-(v/maxV)*innerH;
      svg += '<line class="grid-line" x1="'+padL+'" y1="'+yy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+yy.toFixed(1)+'"/>';
      svg += '<text class="axis-label" x="'+(padL-8)+'" y="'+(yy+3).toFixed(1)+'" text-anchor="end">'+Math.round(v)+'</text>';
    }
    values.forEach((v,i)=>{
      const x = padL + i*(barW+gap);
      const barH = (v/maxV)*innerH;
      const y = padT+innerH-barH;
      svg += '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+barH.toFixed(1)+'" fill="var(--accent)" rx="2"><title>'+labels[i]+': '+v+'</title></rect>';
      svg += '<text class="axis-label" x="'+(x+barW/2).toFixed(1)+'" y="'+(H-padB+18)+'" text-anchor="middle">'+labels[i]+'</text>';
    });
    return '<svg class="weight-chart-svg" viewBox="0 0 '+W+' '+H+'">'+svg+'</svg>';
  }

  function clientProgressGraphHtml(clientId){
    if (progressMarker === 'assessment' && progressAssessmentField === 'tapefat'){
      return tapeBodyFatHtml(clientId);
    }
    if (progressMarker === 'assessment'){
      const field = progressAssessmentField;
      const label = field === 'weight' ? 'Body Weight (kg)' : 'Body Fat (%)';
      const entries = (window.BNB_USERS && window.BNB_USERS.getAssessments) ? window.BNB_USERS.getAssessments(clientId) : [];
      const filtered = entries.filter(a=> a[field] !== '' && a[field] != null && !isNaN(Number(a[field]))).slice().reverse(); // oldest-first
      if (filtered.length < 2){
        return '<div class="weight-chart-empty">Not enough assessment data yet — log at least two assessments with a ' + (field==='weight'?'weight':'body fat') + ' entry to see a trend.</div>';
      }
      const points = filtered.map(a=> ({ label: fmtChartDate(a.date), value: Number(a[field]) }));
      return svgLineChart(points) + '<div class="weight-chart-legend"><span><i class="swatch solid"></i>' + label + '</span></div>';
    }
    if (progressMarker === 'exercise'){
      if (!progressExercise) return '<div class="weight-chart-empty">This client has no logged Live Session exercises yet.</div>';
      const points = (window.BNB_MLS && window.BNB_MLS.getExerciseSeries) ? window.BNB_MLS.getExerciseSeries(clientId, progressExercise) : [];
      if (points.length < 2){
        return '<div class="weight-chart-empty">Log at least two sessions with this exercise to see a trend.</div>';
      }
      const chartPoints = points.map(p=> ({ label: fmtChartDate(p.date), value: p.wt }));
      return svgLineChart(chartPoints) + '<div class="weight-chart-legend"><span><i class="swatch solid"></i>' + progressExercise + ' — top set weight</span></div>';
    }
    if (progressMarker === 'attendance'){
      const counts = (window.BNB_USERS && window.BNB_USERS.getWeeklyVisitCounts) ? window.BNB_USERS.getWeeklyVisitCounts(clientId, 8) : [];
      if (!counts.some(c=>c>0)){
        return '<div class="weight-chart-empty">No check-ins logged for this client yet.</div>';
      }
      const labels = counts.map((_,i)=> i===counts.length-1 ? 'This wk' : (counts.length-1-i) + 'wk ago');
      return svgBarChart(counts, labels) + '<div class="weight-chart-legend"><span><i class="swatch solid"></i>Visits per rolling 7-day window</span></div>';
    }
    if (progressMarker === 'compliance'){
      return complianceHtml(clientId);
    }
    if (progressMarker === 'bp' || progressMarker === 'steps'){
      return vitalsHtml(clientId);
    }
    return '';
  }

  // Blood pressure and steps the member logs in Me > BP and Me > Steps,
  // drawn with the same chart code they see (js/bells-n-barz-vitals.js).
  function vitalsHtml(clientId){
    if (!(clientId in vitalsCache)){
      vitalsCache[clientId] = 'loading';
      Promise.all([
        bnbClient.from('blood_pressure_log').select('taken_at,systolic,diastolic,pulse').eq('user_id', clientId).order('taken_at'),
        bnbClient.from('step_log').select('date,steps').eq('user_id', clientId).order('date')
      ]).then(([bp, st])=>{
        if (bp.error) console.error('Supabase load blood_pressure_log failed:', bp.error);
        if (st.error) console.error('Supabase load step_log failed:', st.error);
        vitalsCache[clientId] = (bp.error || st.error) ? null : {
          bp: (bp.data || []).map(r=> ({ t: new Date(r.taken_at).getTime(), sys: r.systolic, dia: r.diastolic, pulse: r.pulse })),
          steps: st.data || []
        };
        if (progressClientId === clientId && (progressMarker === 'bp' || progressMarker === 'steps')) renderCoachDashboard();
      });
    }
    const data = vitalsCache[clientId];
    if (data === 'loading') return '<div class="weight-chart-empty">Loading…</div>';
    if (data === null) return '<div class="weight-chart-empty">Couldn’t load this client’s logs.</div>';
    const V = window.BNB_VITALS;
    const DAY = 86400000, now = Date.now(), days = progressVitalsDays;
    const W = 900, H = 260;

    if (progressMarker === 'bp'){
      const list = data.bp.filter(e=> e.t >= now - days * DAY);
      if (!list.length){
        return '<div class="weight-chart-empty">' + (data.bp.length ? 'No readings in the last ' + days + ' days.' : 'No blood pressure readings yet. The client logs them in Me &gt; BP.') + '</div>';
      }
      const latest = data.bp[data.bp.length - 1];
      const cat = V.bpCategory(latest.sys, latest.dia);
      const avgS = Math.round(list.reduce((a,e)=> a + e.sys, 0) / list.length);
      const avgD = Math.round(list.reduce((a,e)=> a + e.dia, 0) / list.length);
      let html = '<div class="vitals-summary">Latest <b>' + latest.sys + '/' + latest.dia + '</b> <span class="' + cat.cls + '">' + cat.label + '</span>'
        + ' <span class="muted">' + V.fmtDate(latest.t) + '</span>'
        + ' · ' + days + '-day avg <b>' + avgS + '/' + avgD + '</b> <span class="' + V.bpCategory(avgS, avgD).cls + '">' + V.bpCategory(avgS, avgD).label + '</span>'
        + ' · ' + list.length + ' reading' + (list.length === 1 ? '' : 's') + '</div>';
      html += '<svg class="weight-chart-svg" viewBox="0 0 '+W+' '+H+'">' + V.bpChartSvg(list, W, H, days) + '</svg>';
      html += '<div class="weight-chart-legend"><span><i class="swatch solid" style="background:var(--accent-2);"></i>Systolic</span><span><i class="swatch solid"></i>Diastolic</span><span><i class="swatch target"></i>120 / 80</span></div>';
      return html;
    }

    const firstT = V.dayStart(new Date(now - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10)) - (days - 1) * DAY;
    const list = data.steps.filter(e=> V.dayStart(e.date) >= firstT);
    if (!list.length){
      return '<div class="weight-chart-empty">' + (data.steps.length ? 'No steps logged in the last ' + days + ' days.' : 'No steps logged yet. The client logs them in Me &gt; Steps.') + '</div>';
    }
    // The member's own goal is a per-device setting, so the coach sees
    // the common 10,000 as a reference instead.
    const ref = 10000;
    const avg = list.reduce((a,e)=> a + e.steps, 0) / list.length;
    const hit = list.filter(e=> e.steps >= ref).length;
    let html = '<div class="vitals-summary">Avg <b>' + V.fmtInt(avg) + '</b> a logged day · ' + list.length + ' of ' + days + ' days logged · '
      + hit + ' at 10k+ · best <b>' + V.fmtInt(Math.max(...list.map(e=> e.steps))) + '</b></div>';
    html += '<svg class="weight-chart-svg" id="coach-steps-chart" viewBox="0 0 '+W+' '+H+'">' + V.stepsChartSvg(data.steps, list, W, H, days, ref, '10k reference') + '</svg>';
    html += '<div class="weight-chart-legend"><span><i class="swatch bar"></i>10k+</span><span><i class="swatch bar" style="background:var(--accent-dim);"></i>Under 10k</span><span><i class="swatch dash"></i>7-day avg</span></div>';
    return html;
  }

  // Body fat % from the member's own tape measurements (Me > Weight > Body
  // Composition), using the same formulas they see (js/bells-n-barz-bodyfat.js)
  // and the height on their profile.
  function tapeBodyFatHtml(clientId){
    if (!(clientId in measurementsCache)){
      measurementsCache[clientId] = 'loading';
      bnbClient.from('body_measurements').select('*').eq('user_id', clientId).order('date').then(({ data, error })=>{
        if (error) console.error('Supabase load body_measurements failed:', error);
        measurementsCache[clientId] = error ? null : (data || []);
        if (progressClientId === clientId && progressAssessmentField === 'tapefat') renderCoachDashboard();
      });
    }
    const rows = measurementsCache[clientId];
    if (rows === 'loading') return '<div class="weight-chart-empty">Loading measurements…</div>';
    if (rows === null) return '<div class="weight-chart-empty">Couldn’t load this client’s measurements.</div>';
    const member = (window.BNB_USERS ? window.BNB_USERS.getMembers() : []).find(u => u.id === clientId);
    const heightCm = member && parseFloat(member.height);
    if (!(heightCm > 0)) return '<div class="weight-chart-empty">This client has no height on their profile, which the body fat formulas need.</div>';
    if (rows.length < 2){
      return '<div class="weight-chart-empty">Not enough measurements yet — the client needs to save at least two in Me &gt; Weight &gt; Body Composition to see a trend.</div>';
    }
    const BF = window.BNB_BODYFAT;
    const points = rows.map(r=> ({ label: fmtChartDate(r.date), value: Number(BF.estimate({
      sex: r.sex, waistCm: Number(r.waist_cm),
      neckCm: r.neck_cm == null ? null : Number(r.neck_cm),
      hipCm: r.hip_cm == null ? null : Number(r.hip_cm)
    }, heightCm).pct.toFixed(1)) }));
    return svgLineChart(points) + '<div class="weight-chart-legend"><span><i class="swatch solid"></i>Body Fat (%) from tape measurements (Navy when neck is measured, otherwise RFM)</span></div>';
  }

  // Same Mon..Sun resolution used elsewhere in this app (main file lines
  // 5340/5956, js/bells-n-barz-accountability.js) so "today" means the
  // same local-time day everywhere, not recomputed differently here.
  const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
  function todayDayKey(){
    const idx = new Date().getDay(); // 0=Sun..6=Sat
    return DAY_ORDER[idx === 0 ? 6 : idx - 1];
  }

  // "Today's Program" marker: compares a client's assigned exercises for
  // today against what they actually logged (window.BNB_MLS.getLoggedExercisesForDate,
  // in the main file — same closure that owns mls_history). programs isn't
  // preloaded here, so it's fetched once per client and cached in
  // complianceProgramCache; a cache miss kicks off the fetch and re-renders
  // the dashboard once it resolves, same fetch-then-rerender pattern used
  // elsewhere in this file (e.g. refreshPtBookingsFromSupabase -> renderCoachDashboard).
  function complianceHtml(clientId){
    if (!(clientId in complianceProgramCache)){
      complianceProgramCache[clientId] = 'loading';
      bnbClient.from('programs').select('data').eq('owner_id', clientId).then(({ data, error })=>{
        complianceProgramCache[clientId] = (!error && data && data.length) ? data[0].data : null;
        if (progressClientId === clientId && progressMarker === 'compliance') renderCoachDashboard();
      });
      return '<div class="weight-chart-empty">Loading today’s program…</div>';
    }
    const program = complianceProgramCache[clientId];
    if (program === 'loading') return '<div class="weight-chart-empty">Loading today’s program…</div>';

    const dayKey = todayDayKey();
    const blocks = (program && program[dayKey]) || [];
    if (!blocks.length){
      return '<div class="weight-chart-empty">Rest day — nothing assigned today.</div>';
    }

    const logged = (window.BNB_MLS && window.BNB_MLS.getLoggedExercisesForDate) ? window.BNB_MLS.getLoggedExercisesForDate(clientId, TODAY) : null;
    const isFreeform = logged && logged.mode === 'freeform';
    const loggedNames = (logged && !isFreeform) ? (logged.exercises||[])
      .filter(ex => (ex.sets||[]).some(s=>s.done))
      .map(ex => (ex.name||'').trim().toLowerCase()) : [];

    let html = '';
    if (!logged){
      html += '<div class="admin-notice">Nothing logged yet today.</div>';
    } else if (isFreeform){
      html += '<div class="admin-notice">Logged freeform today — not matched against the assigned list below.</div>';
    }

    html += '<table class="admin-table"><tr><th></th><th>Exercise</th><th>Prescribed</th></tr>';
    blocks.forEach(block=>{
      (block.exercises||[]).forEach(ex=>{
        const done = !isFreeform && loggedNames.indexOf((ex.name||'').trim().toLowerCase()) !== -1;
        const presc = [ex.sets, ex.reps].filter(Boolean).join(' × ');
        html += '<tr><td>' + (done ? '✓' : '○') + '</td><td>' + esc(ex.name) + '</td><td class="mono">' + esc(presc) + '</td></tr>';
      });
    });
    html += '</table>';
    return html;
  }

  function clientProgressHtml(){
    const clientIds = activeClientIdsForTrainer(selfTrainerId);
    if (!clientIds.length){
      return '<div class="weight-card" style="margin-bottom:24px;"><h3>Client Progress</h3><div class="empty-msg">No active clients yet — progress charts show up here once you have a confirmed 1-on-1 booking with someone.</div></div>';
    }
    if (!progressClientId || clientIds.indexOf(progressClientId) === -1) progressClientId = clientIds[0];
    if (progressMarker === 'exercise' && !progressExercise){
      const names = (window.BNB_MLS && window.BNB_MLS.getExerciseNames) ? window.BNB_MLS.getExerciseNames(progressClientId) : [];
      if (names.length) progressExercise = names[0];
    }

    let html = '<div class="weight-card" style="margin-bottom:24px;">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px;">';
    html += '<h3 style="margin:0;">Client Progress</h3>';
    html += '<div class="field" style="margin:0;min-width:200px;"><select id="progress-client-select">';
    clientIds.forEach(id=> html += '<option value="'+id+'"'+(id===progressClientId?' selected':'')+'>'+esc(memberName(id))+'</option>');
    html += '</select></div>';
    html += '</div>';

    html += '<div class="weight-chart-card" style="margin-bottom:14px;">' + clientProgressGraphHtml(progressClientId) + '</div>';

    html += '<div class="subtab-bar" id="progress-marker-tabs">';
    html += '<button type="button" class="subtab-btn'+(progressMarker==='assessment'?' active':'')+'" data-marker="assessment">Body Weight &amp; Fat %</button>';
    html += '<button type="button" class="subtab-btn'+(progressMarker==='exercise'?' active':'')+'" data-marker="exercise">Exercise Load</button>';
    html += '<button type="button" class="subtab-btn'+(progressMarker==='attendance'?' active':'')+'" data-marker="attendance">Attendance</button>';
    html += '<button type="button" class="subtab-btn'+(progressMarker==='compliance'?' active':'')+'" data-marker="compliance">Today\'s Program</button>';
    html += '<button type="button" class="subtab-btn'+(progressMarker==='bp'?' active':'')+'" data-marker="bp">Blood Pressure</button>';
    html += '<button type="button" class="subtab-btn'+(progressMarker==='steps'?' active':'')+'" data-marker="steps">Steps</button>';
    html += '</div>';

    if (progressMarker === 'assessment'){
      html += '<div class="unit-switch" id="progress-assessment-toggle" style="margin-top:2px;">';
      html += '<button type="button" data-field="weight" class="'+(progressAssessmentField==='weight'?'active':'')+'">Weight</button>';
      html += '<button type="button" data-field="bodyfat" class="'+(progressAssessmentField==='bodyfat'?'active':'')+'">Body Fat %</button>';
      html += '<button type="button" data-field="tapefat" class="'+(progressAssessmentField==='tapefat'?'active':'')+'">Tape Body Fat %</button>';
      html += '</div>';
    } else if (progressMarker === 'bp' || progressMarker === 'steps'){
      html += '<div class="unit-switch" id="progress-vitals-days" style="margin-top:2px;">';
      [30, 90].forEach(d=> html += '<button type="button" data-days="'+d+'" class="'+(progressVitalsDays===d?'active':'')+'">'+d+' days</button>');
      html += '</div>';
    } else if (progressMarker === 'exercise'){
      const names = (window.BNB_MLS && window.BNB_MLS.getExerciseNames) ? window.BNB_MLS.getExerciseNames(progressClientId) : [];
      if (names.length){
        html += '<div class="field" style="max-width:280px;margin-top:14px;"><label>Exercise</label><select id="progress-exercise-select">';
        names.forEach(n=> html += '<option value="'+esc(n)+'"'+(n===progressExercise?' selected':'')+'>'+esc(n)+'</option>');
        html += '</select></div>';
      }
    }

    html += '</div>';
    return html;
  }

  function wireClientProgressPanel(){
    const clientSel = document.getElementById('progress-client-select');
    if (clientSel) clientSel.addEventListener('change', ()=>{
      progressClientId = clientSel.value;
      progressExercise = null;
      renderCoachDashboard();
    });
    const markerTabs = document.getElementById('progress-marker-tabs');
    if (markerTabs) markerTabs.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        progressMarker = btn.getAttribute('data-marker');
        renderCoachDashboard();
      });
    });
    const assessToggle = document.getElementById('progress-assessment-toggle');
    if (assessToggle) assessToggle.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        progressAssessmentField = btn.getAttribute('data-field');
        renderCoachDashboard();
      });
    });
    const vitalsDays = document.getElementById('progress-vitals-days');
    if (vitalsDays) vitalsDays.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        progressVitalsDays = Number(btn.getAttribute('data-days'));
        renderCoachDashboard();
      });
    });
    const exSel = document.getElementById('progress-exercise-select');
    if (exSel) exSel.addEventListener('change', ()=>{
      progressExercise = exSel.value;
      renderCoachDashboard();
    });
  }

  function coachDashboardHtml(){
    if (!ensureValidSelfTrainer()){
      return '<div class="empty-msg">No trainer accounts exist yet — add one in Admin &gt; Users and tag it with the Trainer role.</div>';
    }
    const agenda = todaysAgendaForTrainer(selfTrainerId);
    const stats = weeklyStatsForTrainer(selfTrainerId);
    const clientCount = activeClientIdsForTrainer(selfTrainerId).length;
    const noShows = recentNoShowsForTrainer(selfTrainerId);
    const stale = staleClientsForTrainer(selfTrainerId);
    const unpaid = unpaidForTrainerClients(selfTrainerId);

    let html = clientProgressHtml();

    html += '<div class="stat-block">';
    html += statCardHtml(agenda.length, 'Sessions Today');
    html += statCardHtml(clientCount, 'Active Clients');
    html += statCardHtml(stats.totalWeek, 'Sessions This Week');
    html += statCardHtml(stats.openSlotsWeek, 'Open Slots This Week');
    html += '</div>';

    html += '<div class="crud-actions" style="padding:0 0 20px;">';
    html += '<button class="btn2 primary" id="dash-add-slot-btn" type="button">+ Add Availability Slot</button>';
    html += '<button class="btn2" id="dash-start-session-btn" type="button">Start Live Session</button>';
    html += '</div>';

    html += '<div class="section-sub-head" style="margin-top:0;"><h3>Today\'s Schedule</h3></div>';
    if (!agenda.length){
      html += '<div class="empty-msg">Nothing on the books for today.</div>';
    } else {
      html += '<table class="admin-table"><tr><th>Time</th><th>Type</th><th>With</th><th>Detail</th><th></th></tr>';
      agenda.forEach(row=>{
        html += '<tr><td>'+fmtTime(row.time)+'</td><td>'+(row.type==='class'?'Class':'1-on-1')+'</td><td>'+row.label+'</td><td>'+row.meta+'</td><td>';
        html += row.type==='class' ? '<button class="btn2" data-action="dash-open-roster" data-id="'+row.sessionId+'">View Roster</button>' : '<span class="field-hint">—</span>';
        html += '</td></tr>';
      });
      html += '</table>';
    }

    if (noShows.length || stale.length || unpaid.length){
      html += '<div class="section-sub-head"><h3>Needs Attention</h3></div>';
      if (noShows.length){
        html += '<div class="admin-notice">' + noShows.length + ' no-show' + (noShows.length===1?'':'s') + ' in the last week: ' +
          noShows.map(x=> memberName(x.userId) + ' (' + fmtDate(x.date) + ', ' + x.className + ')').join(', ') + '</div>';
      }
      if (stale.length){
        html += '<div class="admin-notice">' + stale.length + ' client' + (stale.length===1?'':'s') + " haven't had a 1-on-1 with you in over two weeks: " +
          stale.map(x=> memberName(x.userId) + ' (' + x.days + 'd)').join(', ') + '</div>';
      }
      if (unpaid.length){
        const total = unpaid.reduce((sum,i)=> sum + i.amount, 0);
        html += '<div class="admin-notice">' + unpaid.length + ' unpaid invoice' + (unpaid.length===1?'':'s') + ' among your clients, totaling $' + total.toFixed(2) + ': ' +
          unpaid.map(i=> memberName(i.userId) + ' ($' + i.amount.toFixed(2) + ', ' + i.status + ')').join(', ') + '</div>';
      }
    }

    return html;
  }

  function renderCoachDashboard(){
    const body = document.getElementById('coach-dashboard-body');
    if (!body) return;
    body.innerHTML = coachDashboardHtml();

    wireClientProgressPanel();
    const addSlotBtn = document.getElementById('dash-add-slot-btn');
    if (addSlotBtn) addSlotBtn.addEventListener('click', ()=>{
      activeSlotFormTrainer = selfTrainerId;
      document.getElementById('sched-slot-date').value = '';
      document.getElementById('sched-slot-time').value = '';
      document.getElementById('sched-slot-duration').value = 60;
      document.getElementById('sched-slot-panel-backdrop').classList.add('show');
    });
    const startSessionBtn = document.getElementById('dash-start-session-btn');
    if (startSessionBtn) startSessionBtn.addEventListener('click', ()=>{
      const btn = document.querySelector('#coach-section-switch [data-coach-section="session"]');
      if (btn) btn.click();
    });
    body.querySelectorAll('[data-action="dash-open-roster"]').forEach(btn=>{
      btn.addEventListener('click', ()=> openRoster(btn.getAttribute('data-id')));
    });
  }

  /* ============================================================
     ADMIN VIEW
     ============================================================ */
  function adminViewHtml(){
    let html = '<div class="sched-sub">';
    html += subBtn('classes', adminSubTab, 'Classes');
    html += subBtn('sessions', adminSubTab, 'Sessions');
    html += subBtn('pt', adminSubTab, '1-on-1 Oversight');
    html += subBtn('load', adminSubTab, 'Trainer Load');
    html += subBtn('ratings', adminSubTab, 'Coach Ratings');
    html += '</div>';
    if (adminSubTab === 'classes') html += adminClassesHtml();
    else if (adminSubTab === 'sessions') html += adminSessionsHtml();
    else if (adminSubTab === 'pt') html += adminPtHtml();
    else if (adminSubTab === 'ratings') html += adminRatingsHtml();
    else html += adminTrainerLoadHtml();
    return html;
  }

  // Monday–Sunday range containing dateStr, as 'YYYY-MM-DD' strings.
  function weekRange(dateStr){
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(d); monday.setDate(d.getDate() + diffToMonday);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    // Local-date serialization (same fix as TODAY above) — plain
    // toISOString() converts to UTC first, which silently shifts the date
    // back a day for anyone in a positive UTC-offset timezone. That would
    // throw off the Monday/Sunday boundary used by Trainer Load and the
    // Coach Dashboard's "Sessions This Week" stat.
    const fmt = x => { const tz = x.getTimezoneOffset() * 60000; return new Date(x - tz).toISOString().slice(0, 10); };
    return { start: fmt(monday), end: fmt(sunday) };
  }

  function adminTrainerLoadHtml(){
    const trainers = getSchedTrainers();
    if (!trainers.length) return '<div class="empty-msg">No trainer accounts yet.</div>';
    const wk = weekRange(TODAY);
    let html = '<div class="field-hint" style="margin-bottom:14px;">Week of ' + fmtDate(wk.start) + ' – ' + fmtDate(wk.end) + '</div>';
    html += '<table class="admin-table"><tr><th>Trainer</th><th>Classes This Week</th><th>1-on-1s This Week</th><th>Upcoming Total</th><th>Active Clients</th></tr>';
    trainers.forEach(t=>{
      const classesWeek = sessions.filter(s=>s.instructorId===t.id && s.status==='scheduled' && s.date >= wk.start && s.date <= wk.end).length;
      const ptAll = ptSessionsForTrainer(t.id);
      const ptWeek = ptAll.filter(x=> x.sl.date >= wk.start && x.sl.date <= wk.end).length;
      const classesUpcoming = sessions.filter(s=>s.instructorId===t.id && s.status==='scheduled' && s.date >= TODAY).length;
      const ptUpcoming = ptAll.filter(x=> x.sl.date >= TODAY).length;
      const clients = new Set(ptAll.map(x=>x.p.userId)).size;
      html += '<tr><td>' + t.name + '</td><td>' + classesWeek + '</td><td>' + ptWeek + '</td><td>' + (classesUpcoming + ptUpcoming) + '</td><td>' + clients + '</td></tr>';
    });
    html += '</table>';
    return html;
  }

  function adminClassesHtml(){
    let html = '<div class="crud-actions" style="padding:0 0 16px;"><button class="btn2 primary" id="sched-add-class-btn">+ Add Class</button></div>';
    if (!classes.length){ html += '<div class="empty-msg">No classes yet.</div>'; return html; }
    html += '<table class="admin-table"><tr><th>Name</th><th>Instructor</th><th>Capacity</th><th>Duration</th><th>Recurring</th><th>Status</th><th></th></tr>';
    classes.forEach(c=>{
      html += '<tr><td>'+c.name+'</td><td>'+trainerName(c.instructorId)+'</td><td>'+c.capacity+'</td><td>'+c.duration+' min</td><td>'+(c.recurring||'—')+'</td><td><span class="status-pill '+c.status+'">'+c.status+'</span></td><td><div class="row-actions"><button data-action="edit-class" data-id="'+c.id+'">Edit</button><button data-action="toggle-archive-class" data-id="'+c.id+'">'+(c.status==='active'?'Archive':'Reactivate')+'</button><button class="del" data-action="delete-class" data-id="'+c.id+'">Delete</button></div></td></tr>';
    });
    html += '</table>';
    return html;
  }

  function adminSessionsHtml(){
    let html = '<div class="form-inline">';
    html += '<div class="field"><label>Class</label><select id="sched-new-sess-class">';
    classes.filter(c=>c.status==='active').forEach(c=> html += '<option value="'+c.id+'">'+c.name+'</option>');
    html += '</select></div>';
    html += '<div class="field"><label>Date</label><input type="date" id="sched-new-sess-date" min="'+TODAY+'"></div>';
    html += '<div class="field"><label>Start time</label><input type="time" id="sched-new-sess-time"></div>';
    html += '<div class="field"><label>Instructor override</label><select id="sched-new-sess-instructor"><option value="">Use class default</option>';
    getSchedTrainers().forEach(t=> html += '<option value="'+t.id+'">'+t.name+'</option>');
    html += '</select></div>';
    html += '<div class="field"><label>Capacity override</label><input type="number" min="1" id="sched-new-sess-cap" placeholder="optional"></div>';
    html += '<div class="field"><button class="btn2 primary" id="sched-add-session-btn">+ Create Session</button></div>';
    html += '</div>';

    const upcoming = upcomingSessions();
    if (!upcoming.length){ html += '<div class="empty-msg">No sessions scheduled yet — create one above.</div>'; return html; }
    groupByDate(upcoming, 'date').forEach(group=>{
      html += '<div class="day-group"><h4>'+fmtDate(group.date)+'</h4><div class="sess-grid">';
      group.items.forEach(s=>{
        const cls = getClass(s.classId);
        if (!cls) return;
        const cap = sessionCapacity(s);
        const confirmed = sessionConfirmedCount(s.id);
        const wl = sessionWaitlist(s.id).length;
        const pct = cap ? Math.min(100, Math.round(confirmed/cap*100)) : 0;
        html += '<div class="sess-card">';
        html += '<div class="sc-time">'+fmtTime(s.startTime)+' · '+cls.duration+' min</div>';
        html += '<h5>'+cls.name+'</h5>';
        html += '<div class="sc-meta">'+trainerName(s.instructorId)+' · '+confirmed+'/'+cap+' booked · '+wl+' waitlisted</div>';
        html += '<div class="cap-meter"><i class="'+(confirmed>=cap?'full':'')+'" style="width:'+pct+'%;"></i></div>';
        html += '<div class="sc-actions"><button class="btn2" data-action="open-roster" data-id="'+s.id+'">Roster</button><button class="btn2 danger" data-action="cancel-session" data-id="'+s.id+'">Cancel Session</button></div>';
        html += '</div>';
      });
      html += '</div></div>';
    });
    return html;
  }

  function adminPtHtml(){
    const all = slots.slice().sort((a,b)=> (a.date+a.startTime) < (b.date+b.startTime) ? -1 : 1);
    if (!all.length) return '<div class="empty-msg">No 1-on-1 slots on record.</div>';
    let html = '<table class="admin-table"><tr><th>Trainer</th><th>Date</th><th>Time</th><th>Duration</th><th>Status</th><th>Booked by</th><th></th></tr>';
    all.forEach(sl=>{
      const pt = ptBookings.find(p=>p.slotId===sl.id && p.status==='confirmed');
      html += '<tr><td>'+trainerName(sl.trainerId)+'</td><td>'+fmtDate(sl.date)+'</td><td>'+fmtTime(sl.startTime)+'</td><td>'+sl.duration+' min</td><td><span class="status-pill '+sl.status+'">'+sl.status+'</span></td><td>'+(pt?memberName(pt.userId):'—')+'</td><td><div class="row-actions">';
      if (sl.status === 'open') html += '<button data-action="block-slot" data-id="'+sl.id+'">Block</button>';
      if (sl.status === 'blocked') html += '<button data-action="unblock-slot" data-id="'+sl.id+'">Unblock</button>';
      if (sl.status === 'booked' && pt) html += '<button class="del" data-action="cancel-pt-trainer" data-id="'+pt.id+'">Cancel Session</button>';
      html += '</div></td></tr>';
    });
    html += '</table>';
    return html;
  }

  /* ============================================================
     ACTIONS
     ============================================================ */
  function memberBookSession(sessId){
    if (memberBookingForSession(sessId, selfMemberId)){ toast('Already booked into this session.'); return; }
    // Warn, don't block, same "trust the coach's judgment" pattern as the
    // zero-credits check on 1-on-1 booking below — an outstanding balance
    // shouldn't become a wall a member can't get past mid-booking, but
    // they (and staff, via the toast-free path if they override) should
    // still see it plainly.
    const me = window.BNB_USERS ? window.BNB_USERS.getById(selfMemberId) : null;
    if (me && Number(me.balance) > 0){
      if (!confirm('Your account has an outstanding balance of ' + Number(me.balance).toFixed(2) + '. Book this session anyway?')) return;
    }
    const sess = getSession(sessId); if (!sess) return;
    const cap = sessionCapacity(sess);
    const confirmed = sessionConfirmedCount(sessId);
    const status = confirmed < cap ? 'confirmed' : 'waitlisted';
    bookings.push({ id: uid('b'), sessionId: sessId, userId: selfMemberId, status, bookedAt: new Date().toISOString() });
    saveBookings();
    toast(status === 'confirmed' ? 'Booked!' : 'Session full — added to waitlist.');
    renderBody();
  }
  function memberCancelBooking(bookingId){
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    b.status = 'cancelled';
    saveBookings();
    toast('Booking cancelled.');
    renderBody();
  }
  // Booking and cancelling go through book_pt_slot() / cancel_pt_booking()
  // (sql/42), which do the booking row, slot status, and credit change in
  // one server-side transaction — members can't write those directly. The
  // checks below are just for a quicker, friendlier message; the server
  // repeats every one of them.
  async function memberBookSlot(slotId){
    const sl = slots.find(x=>x.id===slotId); if (!sl || sl.status !== 'open') { toast('That slot is no longer available.'); return; }
    const start = timeToMinutes(sl.startTime), end = start + Number(sl.duration);
    const overlap = ptBookings.some(p=>{
      if (p.userId !== selfMemberId || p.status !== 'confirmed') return false;
      const otherSlot = slots.find(x=>x.id===p.slotId);
      if (!otherSlot || otherSlot.date !== sl.date) return false;
      const oStart = timeToMinutes(otherSlot.startTime), oEnd = oStart + Number(otherSlot.duration);
      return start < oEnd && oStart < end;
    });
    if (overlap){ toast('You already have a 1-on-1 session that overlaps this time.'); return; }

    const credits = window.BNB_USERS ? window.BNB_USERS.getCredits(selfMemberId) : 0;
    if (credits <= 0){ toast('No session credits left. Buy a package or redeem points to book.'); return; }

    const me = window.BNB_USERS ? window.BNB_USERS.getById(selfMemberId) : null;
    if (me && Number(me.balance) > 0){
      if (!confirm('Your account has an outstanding balance of ' + Number(me.balance).toFixed(2) + '. Book this session anyway?')) return;
    }

    const { data: left, error } = await bnbClient.rpc('book_pt_slot', { p_slot_id: slotId, p_member_id: selfMemberId });
    if (error){ toast(error.message || 'Could not book that slot.'); refreshSlotsFromSupabase(); return; }
    if (window.BNB_USERS) window.BNB_USERS.setCreditsFromServer(selfMemberId, left);
    toast('1-on-1 session booked! ' + left + ' credit' + (left===1?'':'s') + ' remaining.');
    await Promise.all([refreshSlotsFromSupabase(), refreshPtBookingsFromSupabase()]);
    renderIdentityRow();
    renderBody();
  }
  async function cancelPtBooking(ptId){
    const p = ptBookings.find(x=>x.id===ptId); if (!p) return;
    const { data: refunded, error } = await bnbClient.rpc('cancel_pt_booking', { p_booking_id: ptId });
    if (error){ toast(error.message || 'Could not cancel that session.'); return; }
    if (refunded && window.BNB_USERS){
      window.BNB_USERS.setCreditsFromServer(p.userId, window.BNB_USERS.getCredits(p.userId) + 1);
    }
    toast(refunded ? '1-on-1 session cancelled — credit refunded.' : '1-on-1 session cancelled. No refund within 24 hours of the session.');
    await Promise.all([refreshSlotsFromSupabase(), refreshPtBookingsFromSupabase()]);
    renderIdentityRow();
    renderBody();
  }
  function memberCancelPt(ptId){
    const p = ptBookings.find(x=>x.id===ptId); if (!p) return;
    const sl = slots.find(x=>x.id===p.slotId);
    const hoursAhead = sl ? (new Date(sl.date + 'T' + sl.startTime) - Date.now()) / 3600000 : Infinity;
    if (hoursAhead <= 24 && !confirm('This session is less than 24 hours away, so your credit won\'t be refunded. Cancel anyway?')) return;
    cancelPtBooking(ptId);
  }

  function addSlot(trainerId, date, startTime, duration){
    if (!date || !startTime || !duration){ toast('Fill in date, time, and duration.'); return; }
    const overlap = slots.some(sl=> sl.trainerId===trainerId && sl.date===date && sl.status !== 'blocked' &&
      timeToMinutes(startTime) < (timeToMinutes(sl.startTime)+Number(sl.duration)) && timeToMinutes(sl.startTime) < (timeToMinutes(startTime)+Number(duration)));
    if (overlap){ toast('This overlaps an existing slot for this trainer.'); return; }
    slots.push({ id: uid('sl'), trainerId, date, startTime, duration:Number(duration), status:'open' });
    saveSlots();
    toast('Slot added.');
    renderBody();
  }
  function blockSlot(id){ const sl = slots.find(x=>x.id===id); if (sl){ sl.status='blocked'; saveSlots(); renderBody(); } }
  function unblockSlot(id){ const sl = slots.find(x=>x.id===id); if (sl){ sl.status='open'; saveSlots(); renderBody(); } }
  function deleteSlot(id){ slots = slots.filter(x=>x.id!==id); saveSlots(); renderBody(); }
  // A coach/staff cancel always refunds a spent credit (sql/42).
  function cancelPtTrainer(ptId){ cancelPtBooking(ptId); }

  function saveClass(){
    const name = document.getElementById('sched-class-name').value.trim();
    if (!name){ toast('Give the class a name.'); return; }
    const data = {
      name,
      instructorId: document.getElementById('sched-class-instructor').value,
      status: document.getElementById('sched-class-status').value,
      capacity: Math.max(1, Number(document.getElementById('sched-class-capacity').value) || 1),
      duration: Math.max(5, Number(document.getElementById('sched-class-duration').value) || 30),
      recurring: document.getElementById('sched-class-recurring').value.trim(),
      description: document.getElementById('sched-class-description').value.trim()
    };
    if (editingClassId){
      const idx = classes.findIndex(c=>c.id===editingClassId);
      classes[idx] = Object.assign({ id: editingClassId }, data);
    } else {
      classes.push(Object.assign({ id: uid('c') }, data));
    }
    saveClasses();
    closeClassPanel();
    toast('Class saved.');
    renderBody();
  }
  function openClassPanel(id){
    editingClassId = id || null;
    const c = id ? getClass(id) : null;
    document.getElementById('sched-class-panel-title').textContent = c ? 'Edit Class' : 'Add Class';
    const instrSel = document.getElementById('sched-class-instructor');
    instrSel.innerHTML = '';
    getSchedTrainers().forEach(t=>{ const o = document.createElement('option'); o.value=t.id; o.textContent=t.name; instrSel.appendChild(o); });
    document.getElementById('sched-class-name').value = c ? c.name : '';
    instrSel.value = c ? c.instructorId : (getSchedTrainers()[0]||{}).id;
    document.getElementById('sched-class-status').value = c ? c.status : 'active';
    document.getElementById('sched-class-capacity').value = c ? c.capacity : 10;
    document.getElementById('sched-class-duration').value = c ? c.duration : 45;
    document.getElementById('sched-class-recurring').value = c ? c.recurring : '';
    document.getElementById('sched-class-description').value = c ? c.description : '';
    document.getElementById('sched-class-panel-backdrop').classList.add('show');
  }
  function closeClassPanel(){ document.getElementById('sched-class-panel-backdrop').classList.remove('show'); editingClassId = null; }
  function toggleArchiveClass(id){ const c = getClass(id); if (c){ c.status = c.status==='active' ? 'archived' : 'active'; saveClasses(); renderBody(); } }
  function deleteClass(id){
    if (!confirm('Delete this class? Existing sessions referencing it will remain but show as orphaned.')) return;
    classes = classes.filter(c=>c.id!==id); saveClasses(); renderBody();
  }

  function addSession(){
    const classId = document.getElementById('sched-new-sess-class').value;
    const date = document.getElementById('sched-new-sess-date').value;
    const startTime = document.getElementById('sched-new-sess-time').value;
    const instructorOverride = document.getElementById('sched-new-sess-instructor').value;
    const capOverride = document.getElementById('sched-new-sess-cap').value;
    if (!classId || !date || !startTime){ toast('Pick a class, date, and start time.'); return; }
    const cls = getClass(classId);
    sessions.push({
      id: uid('s'), classId, date, startTime,
      instructorId: instructorOverride || (cls ? cls.instructorId : ''),
      capacityOverride: capOverride ? Number(capOverride) : null,
      status: 'scheduled'
    });
    saveSessions();
    toast('Session created.');
    renderBody();
  }
  function cancelSession(id){
    if (!confirm('Cancel this session? All bookings for it will be cancelled too.')) return;
    const s = getSession(id); if (!s) return;
    s.status = 'cancelled';
    bookings.filter(b=>b.sessionId===id).forEach(b=> b.status='cancelled');
    saveSessions(); saveBookings();
    toast('Session cancelled.');
    renderBody();
  }

  function openRoster(sessId){
    activeRosterSessionId = sessId;
    const s = getSession(sessId); if (!s) return;
    const cls = getClass(s.classId);
    const cap = sessionCapacity(s);
    document.getElementById('sched-roster-header').textContent = (cls?cls.name:'Session') + ' — ' + fmtDate(s.date) + ' ' + fmtTime(s.startTime) + ' · capacity ' + cap;
    renderRosterLists();
    document.getElementById('sched-session-panel-backdrop').classList.add('show');
  }
  function renderRosterLists(){
    const s = getSession(activeRosterSessionId); if (!s) return;
    const cap = sessionCapacity(s);
    const confirmedList = bookings.filter(b=>b.sessionId===activeRosterSessionId && b.status==='confirmed');
    const waitlist = sessionWaitlist(activeRosterSessionId);
    const cEl = document.getElementById('sched-roster-confirmed');
    const wEl = document.getElementById('sched-roster-waitlisted');
    cEl.innerHTML = confirmedList.length ? confirmedList.map(b=>
      '<li><span>'+memberName(b.userId)+'</span><div class="row-actions"><button data-action="mark-noshow" data-id="'+b.id+'">No-show</button><button class="del" data-action="roster-remove" data-id="'+b.id+'">Remove</button></div></li>'
    ).join('') : '<li class="empty-row">No confirmed bookings.</li>';
    wEl.innerHTML = waitlist.length ? waitlist.map(b=>
      '<li><span>'+memberName(b.userId)+'</span><div class="row-actions"><button data-action="promote-booking" data-id="'+b.id+'">Promote</button><button class="del" data-action="roster-remove" data-id="'+b.id+'">Remove</button></div></li>'
    ).join('') : '<li class="empty-row">No one waitlisted.</li>';
  }
  function promoteBooking(bookingId){
    const s = getSession(activeRosterSessionId); if (!s) return;
    const cap = sessionCapacity(s);
    if (sessionConfirmedCount(activeRosterSessionId) >= cap){ toast('Session is at capacity — cancel or remove a confirmed booking first.'); return; }
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    b.status = 'confirmed';
    saveBookings();
    toast('Promoted from waitlist.');
    renderRosterLists();
    renderBody();
  }
  function markNoShow(bookingId){
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    b.status = 'no-show';
    saveBookings();
    renderRosterLists();
    renderBody();
  }
  function rosterRemove(bookingId){
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    b.status = 'cancelled';
    saveBookings();
    renderRosterLists();
    renderBody();
  }

  /* ---------------- WIRE UP ---------------- */
  function wireBody(body, view){
    if (!body) return;

    body.querySelectorAll('[data-subtab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const v = btn.getAttribute('data-subtab');
        if (view === 'member') memberSubTab = v;
        else adminSubTab = v;
        renderBody();
      });
    });

    const chipWrap = body.querySelector('#sched-class-chips');
    if (chipWrap) chipWrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{ classFilter = btn.getAttribute('data-filter'); renderBody(); });
    });

    const mbtSel = body.querySelector('#sched-mbt-trainer');
    if (mbtSel) mbtSel.addEventListener('change', ()=>{ memberTrainerId = mbtSel.value; renderBody(); });

    body.querySelectorAll('[data-action]').forEach(btn=>{
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      btn.addEventListener('click', ()=>{
        if (action === 'member-book-session') memberBookSession(id);
        else if (action === 'member-cancel-booking') memberCancelBooking(id);
        else if (action === 'member-book-slot') memberBookSlot(id);
        else if (action === 'member-cancel-pt') memberCancelPt(id);
        else if (action === 'open-roster') openRoster(id);
        else if (action === 'cancel-session') cancelSession(id);
        else if (action === 'edit-class') openClassPanel(id);
        else if (action === 'toggle-archive-class') toggleArchiveClass(id);
        else if (action === 'delete-class') deleteClass(id);
        else if (action === 'block-slot') blockSlot(id);
        else if (action === 'unblock-slot') unblockSlot(id);
        else if (action === 'delete-slot') deleteSlot(id);
        else if (action === 'cancel-pt-trainer') cancelPtTrainer(id);
        else if (action === 'save-rating') saveCoachRating(id, btn.closest('.rate-card'));
        else if (action === 'toggle-rating-hidden') toggleRatingHidden(id);
      });
    });

    // Star inputs only update the card's data-* attributes and the lit
    // stars in place — no re-render, so a half-typed comment survives.
    body.querySelectorAll('.rate-star').forEach(star=>{
      star.addEventListener('click', ()=>{
        const card = star.closest('.rate-card');
        const cat = star.getAttribute('data-cat'), val = Number(star.getAttribute('data-val'));
        card.setAttribute('data-' + cat, val);
        card.querySelectorAll('.rate-star[data-cat="' + cat + '"]').forEach(s=>{
          s.classList.toggle('on', Number(s.getAttribute('data-val')) <= val);
        });
      });
    });

    const addClassBtn = body.querySelector('#sched-add-class-btn');
    if (addClassBtn) addClassBtn.addEventListener('click', ()=> openClassPanel(null));

    const addSessionBtn = body.querySelector('#sched-add-session-btn');
    if (addSessionBtn) addSessionBtn.addEventListener('click', addSession);

    const addSlotBtn = body.querySelector('#sched-add-slot-btn');
    if (addSlotBtn) addSlotBtn.addEventListener('click', ()=>{
      activeSlotFormTrainer = selfTrainerId;
      document.getElementById('sched-slot-date').value = '';
      document.getElementById('sched-slot-time').value = '';
      document.getElementById('sched-slot-duration').value = 60;
      document.getElementById('sched-slot-panel-backdrop').classList.add('show');
    });
  }

  /* ---------------- STATIC PANEL WIRING (once) ---------------- */
  document.getElementById('sched-class-cancel').addEventListener('click', closeClassPanel);
  document.getElementById('sched-class-save').addEventListener('click', saveClass);
  document.getElementById('sched-class-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='sched-class-panel-backdrop') closeClassPanel(); });

  document.getElementById('sched-slot-cancel').addEventListener('click', ()=> document.getElementById('sched-slot-panel-backdrop').classList.remove('show'));
  document.getElementById('sched-slot-save').addEventListener('click', ()=>{
    addSlot(activeSlotFormTrainer, document.getElementById('sched-slot-date').value, document.getElementById('sched-slot-time').value, document.getElementById('sched-slot-duration').value);
    document.getElementById('sched-slot-panel-backdrop').classList.remove('show');
  });
  document.getElementById('sched-slot-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='sched-slot-panel-backdrop') document.getElementById('sched-slot-panel-backdrop').classList.remove('show'); });

  document.getElementById('sched-roster-close').addEventListener('click', ()=> document.getElementById('sched-session-panel-backdrop').classList.remove('show'));
  document.getElementById('sched-session-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='sched-session-panel-backdrop') document.getElementById('sched-session-panel-backdrop').classList.remove('show'); });
  document.getElementById('sched-roster-confirmed').addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const action = btn.getAttribute('data-action'), id = btn.getAttribute('data-id');
    if (action === 'mark-noshow') markNoShow(id);
    else if (action === 'roster-remove') rosterRemove(id);
  });
  document.getElementById('sched-roster-waitlisted').addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const action = btn.getAttribute('data-action'), id = btn.getAttribute('data-id');
    if (action === 'promote-booking') promoteBooking(id);
    else if (action === 'roster-remove') rosterRemove(id);
  });

  /* ---------------- INIT ---------------- */
  renderIdentityRow();
  renderCoachIdentityRow();
  renderBody();
  refreshCoachRatings();

  // Ratings are refetched on every tab open (not just page load) since
  // the module loads before sign-in, when there's no one to fetch for.
  window.schedOnTabShown = function(){ renderIdentityRow(); renderCoachIdentityRow(); renderBody(); refreshCoachRatings(); };
  // Booking/Roster data refreshes on its own whenever a schedule action fires,
  // but Billing invoice changes (e.g. marking one paid) don't call back into
  // this module — so the Dashboard's "unpaid invoices" line can go stale
  // otherwise. Re-render just the dashboard piece whenever the COACH tab
  // itself is opened, which is cheap and catches that case.
  window.coachOnTabShown = function(){ renderCoachIdentityRow(); renderCoachDashboard(); refreshCoachRatings(); };

})();
