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
  // Each table remembers what the database last had (bnbTableSync, in
  // the main HTML), so a save only sends rows this tab actually changed
  // and deletes rows it removed. Seed rows (no real UUID yet) are local
  // only and never sent.
  const isReal = x => x.id && x.id.length === 36;
  const classesSync = bnbTableSync('classes');
  const sessionsSync = bnbTableSync('class_sessions');
  const bookingsSync = bnbTableSync('bookings');
  const slotsSync = bnbTableSync('slots');
  const ptBookingsSync = bnbTableSync('pt_bookings');

  function saveClasses(){ return classesSync.save(classes.filter(isReal).map(classToRow)); }
  function saveSessions(){ return sessionsSync.save(sessions.filter(isReal).map(sessionToRow)); }
  function saveBookings(){ return bookingsSync.save(bookings.filter(isReal).map(bookingToRow)); }
  function saveSlots(){ return slotsSync.save(slots.filter(isReal).map(slotToRow)); }
  function savePtBookings(){ return ptBookingsSync.save(ptBookings.filter(isReal).map(ptBookingToRow)); }

  async function refreshClassesFromSupabase(){
    const { data, error } = await bnbClient.from('classes').select('*');
    if (error) { console.error('Supabase load classes failed:', error); return; }
    if (data && data.length) {
      classes = data.map(rowToClass);
      classesSync.reset(classes.filter(isReal).map(classToRow));
      if (typeof renderBody === 'function') renderBody();
    }
  }
  async function refreshSessionsFromSupabase(){
    const { data, error } = await bnbClient.from('class_sessions').select('*');
    if (error) { console.error('Supabase load class_sessions failed:', error); return; }
    if (data && data.length) {
      sessions = data.map(rowToSession);
      sessionsSync.reset(sessions.filter(isReal).map(sessionToRow));
      if (typeof renderBody === 'function') renderBody();
    }
  }
  async function refreshBookingsFromSupabase(){
    const { data, error } = await bnbClient.from('bookings').select('*');
    if (error) { console.error('Supabase load bookings failed:', error); return; }
    if (data && data.length) {
      bookings = data.map(rowToBooking);
      bookingsSync.reset(bookings.filter(isReal).map(bookingToRow));
      if (typeof renderBody === 'function') renderBody();
    }
  }
  // How full each class is. Members can only read their own bookings,
  // so the counts come from class_session_counts() (sql/62), which also
  // gives the signed-in member's place on a waitlist.
  let sessionCounts = null; // sessionId -> { confirmed, waitlisted, myPlace }; null until loaded
  async function refreshSessionCounts(){
    const { data, error } = await bnbClient.rpc('class_session_counts');
    if (error) { console.warn('Supabase class_session_counts failed:', error); return; }
    sessionCounts = {};
    (data || []).forEach(r=>{ sessionCounts[r.session_id] = { confirmed: r.confirmed, waitlisted: r.waitlisted, myPlace: r.my_place }; });
    if (typeof renderBody === 'function') renderBody();
  }
  // Creates recurring classes' upcoming sessions (sql/62). Fails quietly
  // before sign-in.
  async function ensureRecurringSessions(){
    const { data, error } = await bnbClient.rpc('ensure_class_sessions');
    if (error) return;
    if (data) await refreshSessionsFromSupabase();
  }
  // 1-on-1 waitlists (sql/66): how many wait per slot, and your place.
  let ptWaitCounts = {}; // slotId -> { waiting, myPlace }
  async function refreshPtWaitlist(){
    const { data, error } = await bnbClient.rpc('pt_waitlist_counts');
    if (error) return; // before sql/66, or signed out
    ptWaitCounts = {};
    (data || []).forEach(r=>{ ptWaitCounts[r.slot_id] = { waiting: r.waiting, myPlace: r.my_place }; });
    if (typeof renderBody === 'function') renderBody();
  }
  async function afterBookingChange(){
    await Promise.all([refreshBookingsFromSupabase(), refreshSessionCounts(), refreshPtWaitlist()]);
    renderBody();
    if (activeRosterSessionId && document.getElementById('sched-session-panel-backdrop').classList.contains('show')) renderRosterLists();
  }

  async function refreshSlotsFromSupabase(){
    const { data, error } = await bnbClient.from('slots').select('*');
    if (error) { console.error('Supabase load slots failed:', error); return; }
    if (data && data.length) {
      slots = data.map(rowToSlot);
      slotsSync.reset(slots.filter(isReal).map(slotToRow));
      if (typeof renderBody === 'function') renderBody();
    }
  }
  async function refreshPtBookingsFromSupabase(){
    const { data, error } = await bnbClient.from('pt_bookings').select('*');
    if (error) { console.error('Supabase load pt_bookings failed:', error); return; }
    if (data && data.length) {
      ptBookings = data.map(rowToPtBooking);
      ptBookingsSync.reset(ptBookings.filter(isReal).map(ptBookingToRow));
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
    if (sessionCounts) return sessionCounts[sessId] ? sessionCounts[sessId].confirmed : 0;
    return bookings.filter(b=>b.sessionId===sessId && b.status==='confirmed').length;
  }
  function myWaitlistPlace(sessId){
    const c = sessionCounts && sessionCounts[sessId];
    return c && c.myPlace ? c.myPlace : null;
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
  let memberTrainerId = 'any'; // Book a Trainer's selected coach, or 'any'
  let slotDayFilter = 'all';    // Book a Trainer: 'all' or ISO weekday '1'..'7'
  let slotPartFilter = 'all';   // 'all' | 'morning' | 'afternoon' | 'evening'
  let coachProfiles = {};       // coachId -> { bio, specialties } (sql/65)
  let trainerSubTab = 'roster';
  let adminSubTab = 'classes';
  let classFilter = 'all';
  // Each calendar's Monday (YYYY-MM-DD); null = this week.
  const calWeeks = { member: null, coach: null, admin: null };
  // Day, week, month, year, list or timeline view per calendar (remembered on this device), and the
  // month shown (first of the month; null = this month).
  const calViews = (function(){
    const v = { member: 'week', coach: 'week', admin: 'week' };
    try { Object.assign(v, JSON.parse(localStorage.getItem('bnb-cal-views') || '{}')); } catch(e){}
    return v;
  })();
  const calMonths = { member: null, coach: null, admin: null };
  const calDays = { member: null, coach: null, admin: null }; // day view's date; null = today
  const calListDays = { member: 28, coach: 28, admin: 28 };   // list view: how many days ahead
  const calYears = { member: null, coach: null, admin: null };  // year view's year ('YYYY'); null = this year
  let adminCalTrainer = 'all'; // admin calendar's coach filter
  let editingClassId = null;
  let activeSlotFormTrainer = null;
  let activeRosterSessionId = null;
  // Client Progress panel state (Coach Dashboard) — kept as plain variables
  // rather than rebuilt from scratch each render, so the selected client/
  // marker survive a dashboard refresh (e.g. after booking a slot).
  let progressClientId = null; // null = the client grid; an id = that person's charts page
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
    if (addSlotBtn) addSlotBtn.addEventListener('click', ()=> openSlotPanel(''));
    body.querySelectorAll('[data-cal-addslot]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ const [d, t] = btn.getAttribute('data-cal-addslot').split('T'); openSlotPanel(d, t); });
    });
    wireCalNav(body, ()=>{ renderCoachBody(); fillRatingComments(); });
    wireCalDrag(body);
    const profSave = body.querySelector('#coach-prof-save');
    if (profSave) profSave.addEventListener('click', saveCoachProfile);
    const profBio = body.querySelector('#coach-prof-bio');
    if (profBio) profBio.addEventListener('input', ()=>{ const c = body.querySelector('#coach-prof-count'); if (c) c.textContent = profBio.value.length; });
  }
  function openSlotPanel(date, time){
    activeSlotFormTrainer = selfTrainerId;
    document.getElementById('sched-slot-date').value = date || '';
    document.getElementById('sched-slot-time').value = time || '';
    document.getElementById('sched-slot-duration').value = 60;
    document.getElementById('sched-slot-panel-backdrop').classList.add('show');
    if (date) document.getElementById(time ? 'sched-slot-duration' : 'sched-slot-time').focus();
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
    html += subBtn('calendar', memberSubTab, 'Calendar');
    html += subBtn('trainer', memberSubTab, 'Book a Trainer');
    html += subBtn('mine', memberSubTab, 'My Schedule');
    html += subBtn('rate', memberSubTab, 'Rate Coaches');
    html += '</div>';
    if (memberSubTab === 'browse') html += memberBrowseHtml();
    else if (memberSubTab === 'calendar') html += memberCalendarHtml();
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
    activeClasses.forEach(c=> chips += '<button data-filter="'+c.id+'" class="'+(classFilter===c.id?'active':'')+'">'+esc(c.name)+'</button>');
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
        html += '<h5>'+esc(cls.name)+'</h5>';
        html += '<div class="sc-meta">'+esc(trainerName(s.instructorId))+' · '+confirmed+'/'+cap+' booked</div>';
        html += '<div class="cap-meter"><i class="'+(full?'full':'')+'" style="width:'+pct+'%;"></i></div>';
        html += '<div class="sc-actions">';
        if (myBooking){
          const place = myBooking.status==='waitlisted' ? myWaitlistPlace(s.id) : null;
          html += '<span class="status-pill '+myBooking.status+'">'+(myBooking.status==='confirmed'?'Booked':'Waitlisted'+(place?' · #'+place:''))+'</span>';
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

  /* ---------------- CALENDAR (week view) ----------------
     Classes, open 1-on-1 slots and your own 1-on-1s for one week, Monday
     to Sunday. Seven columns on a wide screen; on a phone the days stack.
     Book / Cancel use the same actions as the other member views. */
  function isoDate(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function addDays(iso, n){ const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoDate(d); }
  function mondayOf(iso){ const d = new Date(iso + 'T00:00:00'); return addDays(iso, -((d.getDay() + 6) % 7)); }
  function nowHHMM(){ const d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
  function isPast(date, time){ return date < TODAY || (date === TODAY && String(time).slice(0,5) <= nowHHMM()); }

  function calendarItems(from, to){
    const items = [];
    sessions.filter(s=> s.status==='scheduled' && s.date >= from && s.date <= to).forEach(s=>{
      const cls = getClass(s.classId); if (!cls) return;
      if (classFilter !== 'all' && s.classId !== classFilter) return;
      items.push({ kind:'class', date:s.date, time:s.startTime, s, cls });
    });
    ptBookings.filter(p=> p.userId===selfMemberId && p.status==='confirmed').forEach(p=>{
      const sl = slots.find(x=>x.id===p.slotId);
      if (sl && sl.date >= from && sl.date <= to) items.push({ kind:'mypt', date:sl.date, time:sl.startTime, sl, p });
    });
    slots.filter(sl=> sl.status==='open' && sl.date >= from && sl.date <= to).forEach(sl=>{
      items.push({ kind:'slot', date:sl.date, time:sl.startTime, sl });
    });
    return items.sort((a,b)=> (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  }

  // Member calendar card. Your own upcoming booked class / 1-on-1 can be
  // dragged onto another time of the same class or an open slot (or use
  // Move, then "Move here") — switch_class_booking() / switch_pt_booking()
  // in sql/63/64 move it in one step.
  function calItemHtml(it){
    const past = isPast(it.date, it.time);
    let cls = 'cal-item cal-' + it.kind + (past ? ' past' : '');
    let html = '', attrs = '';
    const moving = memberMoveFrom;
    if (it.kind === 'class'){
      const cap = sessionCapacity(it.s), confirmed = sessionConfirmedCount(it.s.id), full = confirmed >= cap;
      const mine = memberBookingForSession(it.s.id, selfMemberId);
      if (mine) cls += ' mine';
      html += '<div class="cal-time">' + fmtTime(it.time) + ' · ' + it.cls.duration + 'm</div>';
      html += '<div class="cal-title">' + esc(it.cls.name) + '</div>';
      html += '<div class="cal-meta">' + esc(trainerName(it.s.instructorId)) + ' · ' + confirmed + '/' + cap + '</div>';
      const ref = mine ? 'class:' + mine.id + ':' + it.s.classId : '';
      if (mine && !past && mine.status === 'confirmed'){ attrs += ' draggable="true" data-mdrag="' + ref + '"'; cls += ' draggable'; }
      if (!mine && !past && !full) attrs += ' data-mdrop="class:' + it.s.id + ':' + it.s.classId + '"';
      if (moving && moving.ref === ref) cls += ' move-source';
      if (mine){
        const place = mine.status==='waitlisted' ? myWaitlistPlace(it.s.id) : null;
        html += '<div class="cal-actions"><span class="status-pill ' + mine.status + '">' + (mine.status==='confirmed' ? 'Booked' : 'Waitlist' + (place ? ' #' + place : '')) + '</span>';
        if (!past && !moving){
          html += '<button class="cal-link" data-action="member-cancel-booking" data-id="' + mine.id + '">Cancel</button>';
          if (mine.status === 'confirmed') html += '<button class="cal-link" data-mmove="' + ref + '">Move</button>';
        }
        html += '</div>';
      } else if (!past && moving){
        if (moving.kind === 'class' && moving.classId === it.s.classId){
          html += '<div class="cal-actions">' + (full ? '<span class="cal-meta">Full</span>' : '<button class="btn2 primary" data-mmove-here="class:' + it.s.id + '">Move here</button>') + '</div>';
        }
      } else if (!past){
        html += '<div class="cal-actions"><button class="btn2 primary" data-action="member-book-session" data-id="' + it.s.id + '">' + (full ? 'Waitlist' : 'Book') + '</button></div>';
      }
    } else if (it.kind === 'mypt'){
      cls += ' mine';
      const ref = 'pt:' + it.p.id;
      if (!past){ attrs += ' draggable="true" data-mdrag="' + ref + '"'; cls += ' draggable'; }
      if (moving && moving.ref === ref) cls += ' move-source';
      html += '<div class="cal-time">' + fmtTime(it.time) + ' · ' + it.sl.duration + 'm</div>';
      html += '<div class="cal-title">1-on-1</div>';
      html += '<div class="cal-meta">' + esc(trainerName(it.p.trainerId)) + '</div>';
      html += '<div class="cal-actions"><span class="status-pill confirmed">Booked</span>';
      if (!past && !moving){
        html += '<button class="cal-link" data-action="member-cancel-pt" data-id="' + it.p.id + '">Cancel</button>';
        html += '<button class="cal-link" data-mmove="' + ref + '">Move</button>';
      }
      html += '</div>';
    } else {
      if (past) return '';
      attrs += ' data-mdrop="slot:' + it.sl.id + '"';
      html += '<div class="cal-time">' + fmtTime(it.time) + ' · ' + it.sl.duration + 'm</div>';
      html += '<div class="cal-title">1-on-1 open</div>';
      html += '<div class="cal-meta">' + esc(trainerName(it.sl.trainerId)) + '</div>';
      if (moving){
        if (moving.kind === 'pt') html += '<div class="cal-actions"><button class="btn2 primary" data-mmove-here="slot:' + it.sl.id + '">Move here</button></div>';
      } else {
        html += '<div class="cal-actions"><button class="btn2" data-action="member-book-slot" data-id="' + it.sl.id + '">Book</button></div>';
      }
    }
    return '<div class="' + cls + '"' + attrs + '>' + html + '</div>';
  }

  // { ref, kind:'class'|'pt', bookingId, classId } while picking a new time.
  let memberMoveFrom = null;
  function parseMoveRef(ref){
    const [kind, bookingId, classId] = ref.split(':');
    return { ref, kind, bookingId, classId: classId || null };
  }
  function canDropOn(from, dropRef){
    const [kind, , classId] = dropRef.split(':');
    return from.kind === 'class' ? (kind === 'class' && classId === from.classId) : kind === 'slot';
  }
  async function switchBooking(from, dropRef){
    const [kind, targetId] = dropRef.split(':');
    let when = '';
    if (kind === 'class'){ const s2 = getSession(targetId); if (s2) when = fmtDate(s2.date) + ', ' + fmtTime(s2.startTime); }
    else { const sl = slots.find(x=>x.id===targetId); if (sl) when = fmtDate(sl.date) + ', ' + fmtTime(sl.startTime) + ' with ' + trainerName(sl.trainerId); }
    if (!confirm('Move your ' + (from.kind === 'class' ? 'class' : '1-on-1') + ' to ' + when + '?')) return;
    const { error } = from.kind === 'class'
      ? await bnbClient.rpc('switch_class_booking', { p_booking_id: from.bookingId, p_session_id: targetId })
      : await bnbClient.rpc('switch_pt_booking', { p_booking_id: from.bookingId, p_slot_id: targetId });
    memberMoveFrom = null;
    if (error){ toast(error.message || 'Could not move your booking.'); renderBody(); return; }
    toast('Moved to ' + when + '.');
    await Promise.all([refreshSlotsFromSupabase(), refreshPtBookingsFromSupabase()]);
    afterBookingChange();
  }
  function wireMemberCalDrag(root){
    root.querySelectorAll('[data-mmove]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ memberMoveFrom = parseMoveRef(btn.getAttribute('data-mmove')); renderBody(); });
    });
    root.querySelectorAll('[data-mmove-cancel]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ memberMoveFrom = null; renderBody(); });
    });
    root.querySelectorAll('[data-mmove-here]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ if (memberMoveFrom) switchBooking(memberMoveFrom, btn.getAttribute('data-mmove-here')); });
    });
    let dragging = null;
    const targets = () => root.querySelectorAll('[data-mdrop]');
    root.querySelectorAll('[data-mdrag]').forEach(el=>{
      el.addEventListener('dragstart', e=>{
        dragging = parseMoveRef(el.getAttribute('data-mdrag'));
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragging.ref); } catch(err){}
        el.classList.add('dragging');
        targets().forEach(t=>{ if (canDropOn(dragging, t.getAttribute('data-mdrop'))) t.classList.add('drop-target'); });
      });
      el.addEventListener('dragend', ()=>{
        dragging = null;
        el.classList.remove('dragging');
        root.querySelectorAll('.drop-target, .drop-ok').forEach(t=> t.classList.remove('drop-target', 'drop-ok'));
      });
    });
    targets().forEach(t=>{
      const ref = t.getAttribute('data-mdrop');
      t.addEventListener('dragover', e=>{ if (!dragging || !canDropOn(dragging, ref)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; t.classList.add('drop-ok'); });
      t.addEventListener('dragleave', e=>{ if (!t.contains(e.relatedTarget)) t.classList.remove('drop-ok'); });
      t.addEventListener('drop', e=>{
        if (!dragging || !canDropOn(dragging, ref)) return;
        e.preventDefault();
        const from = dragging;
        switchBooking(from, ref);
      });
    });
  }

  // Week header (‹ range › This week + legend) and the 7-day grid, shared
  // by the member and coach calendars. `scope` keeps their weeks apart.
  function monthStartOf(iso){ return iso.slice(0, 8) + '01'; }
  function addMonths(iso, n){ const d = new Date(iso + 'T00:00:00'); d.setDate(1); d.setMonth(d.getMonth() + n); return isoDate(d); }
  // What a calendar is showing: { month, start, from, to } — `start` is the
  // Monday (week) or the 1st (month); from/to is the date range drawn.
  function calRange(scope){
    if (calViews[scope] === 'year'){
      const y = calYears[scope] || TODAY.slice(0, 4);
      return { year: true, start: y + '-01-01', from: y + '-01-01', to: y + '-12-31' };
    }
    if (calViews[scope] === 'list'){
      return { list: true, start: TODAY, from: TODAY, to: addDays(TODAY, calListDays[scope] - 1), days: calListDays[scope] };
    }
    if (calViews[scope] === 'day'){
      const day = calDays[scope] || TODAY;
      return { day: true, start: day, from: day, to: day };
    }
    if (calViews[scope] === 'month'){
      const first = calMonths[scope] || monthStartOf(TODAY);
      const last = addDays(addMonths(first, 1), -1);
      return { month: true, start: first, from: mondayOf(first), to: addDays(mondayOf(last), 6) };
    }
    const start = calWeeks[scope] || mondayOf(TODAY);
    return { month: false, timeline: calViews[scope] === 'timeline', start, from: start, to: addDays(start, 6) };
  }

  // Header: ‹ range › This week/month, Week | Month, legend. Shared by the
  // member, coach and admin calendars; `scope` keeps their state apart.
  function calHeadHtml(range, scope, legend){
    const isNow = range.year ? range.start.slice(0, 4) === TODAY.slice(0, 4) : range.day ? range.start === TODAY : range.month ? range.start === monthStartOf(TODAY) : range.start === mondayOf(TODAY);
    const fmtShort = iso => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' });
    const label = range.year ? range.start.slice(0, 4) : range.day ? new Date(range.start + 'T00:00:00').toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })
      : range.month ? new Date(range.start + 'T00:00:00').toLocaleDateString(undefined, { month:'long', year:'numeric' })
      : fmtShort(range.start) + ' – ' + fmtShort(addDays(range.start, 6));
    const unit = range.year ? 'year' : range.day ? 'day' : range.month ? 'month' : 'week';
    let html = '<div class="cal-head">';
    if (range.list){
      html += '<div class="cal-range">Next ' + (range.days % 7 ? range.days + ' days' : range.days / 7 + ' weeks') + '</div>';
    } else {
    html += '<button class="btn2" data-cal="prev" data-cal-scope="' + scope + '" aria-label="Previous ' + unit + '"' + (isNow ? ' disabled' : '') + '>‹</button>';
    html += '<div class="cal-range">' + label + '</div>';
    html += '<button class="btn2" data-cal="next" data-cal-scope="' + scope + '" aria-label="Next ' + unit + '">›</button>';
    if (!isNow) html += '<button class="btn2" data-cal="today" data-cal-scope="' + scope + '">' + (range.day ? 'Today' : 'This ' + unit) + '</button>';
    }
    html += '<div class="cal-view" role="group" aria-label="Calendar view">';
    ['day', 'week', 'month', 'year', 'list', 'timeline'].forEach(v=> html += '<button class="' + (calViews[scope] === v ? 'active' : '') + '" data-cal-view="' + v + '" data-cal-scope="' + scope + '">' + v.charAt(0).toUpperCase() + v.slice(1) + '</button>');
    html += '</div>';
    html += '<div class="cal-legend">' + legend + '</div>';
    return html + '</div>';
  }

  // Year view: twelve small months, each day shaded by how much is on
  // (classes and 1-on-1s) with a dot where `isMine` (your booking / a
  // booked 1-on-1). A month name opens the month, a day opens the day;
  // upcoming days take drops (moving there, same time).
  function calYearHtml(range, items, isMine){
    const y = Number(range.start.slice(0, 4));
    const byDay = {};
    items.forEach(it=>{ const b = byDay[it.date] = byDay[it.date] || { classes: 0, pt: 0, mine: false }; if (it.kind === 'class') b.classes++; else b.pt++; if (isMine(it)) b.mine = true; });
    const level = n => n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4;
    const initials = []; for (let i = 0; i < 7; i++) initials.push(new Date(addDays(mondayOf(TODAY), i) + 'T00:00:00').toLocaleDateString(undefined, { weekday:'narrow' }));
    let html = '<div class="cal-year">';
    for (let m = 0; m < 12; m++){
      const first = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      const next = addMonths(first, 1);
      const isThis = first === monthStartOf(TODAY);
      html += '<div class="cal-ymonth' + (isThis ? ' this' : '') + (next <= TODAY ? ' past' : '') + '">';
      html += '<button class="cal-ymonth-name" data-cal-openmonth="' + first + '">' + new Date(first + 'T00:00:00').toLocaleDateString(undefined, { month:'long' }) + '</button>';
      html += '<div class="cal-ygrid">' + initials.map(c=> '<span class="cal-ywd">' + c + '</span>').join('');
      for (let pad = (new Date(first + 'T00:00:00').getDay() + 6) % 7; pad > 0; pad--) html += '<span></span>';
      for (let day = first; day < next; day = addDays(day, 1)){
        const b = byDay[day] || { classes: 0, pt: 0, mine: false };
        const n = b.classes + b.pt;
        const tip = fmtDate(day) + (n ? ': ' + [b.classes ? b.classes + ' class' + (b.classes === 1 ? '' : 'es') : '', b.pt ? b.pt + ' 1-on-1' + (b.pt === 1 ? '' : 's') : ''].filter(Boolean).join(', ') : ': nothing on');
        html += '<span class="cal-yday l' + level(n) + (b.mine ? ' mine' : '') + (day === TODAY ? ' today' : '') + (day < TODAY ? ' gone' : '') + '"'
          + ' data-cal-openday="' + day + '"' + (day < TODAY ? '' : ' data-cal-day="' + day + '"') + ' role="button" tabindex="0" title="' + esc(tip) + '" aria-label="' + esc(tip) + '">' + Number(day.slice(8)) + '</span>';
      }
      html += '</div></div>';
    }
    html += '</div>';
    html += '<div class="cal-yleg"><span>Less</span>' + [0, 1, 2, 3, 4].map(l=> '<i class="cal-yday l' + l + '"></i>').join('') + '<span>More</span><i class="cal-yday l2 mine"></i><span>' + 'Booked</span></div>';
    return html;
  }

  // Timeline view: the week as rows (Mon–Sun) on an hour axis; each item
  // is a bar as long as it lasts, overlapping ones stacked in lanes.
  // Bars carry the same drag attributes as the other views; a track
  // takes drops at the time under the pointer (snapped to 15 minutes).
  // Tapping a bar or a day's name opens that day.
  function calTimelineHtml(range, items, chip){
    const mins = t => Number(String(t).slice(0, 2)) * 60 + Number(String(t).slice(3, 5));
    const durOf = it => Number(it.kind === 'class' ? it.cls.duration : it.sl.duration) || 60;
    let lo = 6, hi = 22;
    items.forEach(it=>{ lo = Math.min(lo, Math.floor(mins(it.time) / 60)); hi = Math.max(hi, Math.ceil((mins(it.time) + durOf(it)) / 60)); });
    hi = Math.min(Math.max(hi, lo + 1), 24);
    const span = (hi - lo) * 60;
    const pct = m => ((m - lo * 60) / span * 100).toFixed(3) + '%';
    let html = '<div class="cal-tl" style="--tl-hours:' + (hi - lo) + '"><div class="cal-tl-inner">';
    html += '<div class="cal-tl-axis"><div class="cal-tl-label"></div><div class="cal-tl-ticks">';
    for (let h = lo; h < hi; h++) html += '<span style="left:' + pct(h * 60) + '">' + fmtTime(String(h).padStart(2, '0') + ':00').replace(':00', '').replace(' ', '').toLowerCase() + '</span>';
    html += '</div></div>';
    const now = new Date(), nowMins = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < 7; i++){
      const day = addDays(range.start, i);
      const d = new Date(day + 'T00:00:00');
      const bars = items.filter(it=> it.date === day)
        .map(it=> chip(it, (it2, title, cls, attrs)=> ({ it: it2, title, cls, attrs: attrs || '' })))
        .filter(Boolean)
        .sort((a, b)=> mins(a.it.time) - mins(b.it.time));
      // Greedy lanes: each bar goes in the first lane that's free by its start.
      const laneEnds = [];
      bars.forEach(b=>{
        const start = mins(b.it.time), end = start + durOf(b.it);
        let lane = laneEnds.findIndex(e=> e <= start);
        if (lane === -1){ lane = laneEnds.length; laneEnds.push(end); } else laneEnds[lane] = end;
        b.lane = lane; b.start = start; b.dur = durOf(b.it);
      });
      const lanes = Math.max(1, laneEnds.length);
      html += '<div class="cal-tl-row' + (day === TODAY ? ' today' : '') + (day < TODAY ? ' past' : '') + '">';
      html += '<div class="cal-tl-label" data-cal-openday="' + day + '" role="button" tabindex="0" title="Open this day"><span>' + d.toLocaleDateString(undefined, { weekday:'short' }) + '</span><b>' + d.getDate() + '</b></div>';
      html += '<div class="cal-tl-track" style="height:' + (lanes * 30 + 8) + 'px"' + (day < TODAY ? '' : ' data-cal-day="' + day + '" data-tl-lo="' + lo + '" data-tl-span="' + span + '"') + '>';
      for (let h = lo + 1; h < hi; h++) html += '<i class="cal-tl-grid" style="left:' + pct(h * 60) + '"></i>';
      if (day === TODAY && nowMins >= lo * 60 && nowMins <= hi * 60) html += '<i class="cal-tl-now" style="left:' + pct(nowMins) + '"></i>';
      bars.forEach(b=>{
        const label = b.title; // the bar's position already says when
        html += '<div class="cal-tl-bar cal-chip ' + b.cls + (isPast(b.it.date, b.it.time) ? ' past' : '') + '"' + b.attrs
          + ' data-tl-open="' + day + '" style="left:' + pct(b.start) + ';--bar-w:calc(' + (b.dur / span * 100).toFixed(3) + '% - 2px);width:var(--bar-w);top:' + (b.lane * 30 + 4) + 'px"'
          + ' title="' + esc(fmtTime(b.it.time) + ' · ' + b.dur + ' min · ' + b.title) + '">' + esc(label) + '</div>';
      });
      html += '</div></div>';
    }
    return html + '</div></div>';
  }

  // List view: what's coming up from today, grouped by date (only dates
  // with something on). Rows are the same cards as the week view, so all
  // their buttons and drag/drop work. A date heading opens that day and
  // takes drops (moving there, same time).
  function calListHtml(range, items, render, scope){
    const upcoming = items.filter(it=> !isPast(it.date, it.time));
    let html = '<div class="cal-list">';
    const dates = [...new Set(upcoming.map(it=> it.date))].sort();
    dates.forEach(day=>{
      const rows = upcoming.filter(it=> it.date === day).map(render).filter(Boolean);
      if (!rows.length) return;
      const d = new Date(day + 'T00:00:00');
      const rel = day === TODAY ? 'Today' : day === addDays(TODAY, 1) ? 'Tomorrow' : '';
      html += '<div class="cal-list-day' + (day === TODAY ? ' today' : '') + '" data-cal-day="' + day + '">';
      html += '<div class="cal-list-head" data-cal-openday="' + day + '" role="button" tabindex="0" title="Open this day">'
        + '<b>' + d.toLocaleDateString(undefined, { weekday:'short', day:'numeric', month:'short' }) + '</b>' + (rel ? '<span>' + rel + '</span>' : '') + '</div>';
      html += '<div class="cal-list-rows">' + rows.join('') + '</div></div>';
    });
    if (!dates.length) html += '<div class="cal-none">Nothing coming up in this time.</div>';
    html += '</div>';
    html += '<div class="cal-list-more"><button class="btn2" data-cal-more data-cal-scope="' + scope + '">Show 4 more weeks</button></div>';
    return html;
  }

  // Day view: one row per hour (6 AM–9 PM, stretched to fit), full cards
  // in the hour they start. Rows take drops (moving to that hour) and, for
  // coaches/admins, a + to add something at that hour.
  function calDayHtml(range, items, render, rowExtra){
    const day = range.start;
    const hourOf = t => Number(String(t).slice(0, 2));
    let lo = 6, hi = 21;
    items.forEach(it=>{ lo = Math.min(lo, hourOf(it.time)); hi = Math.max(hi, hourOf(it.time)); });
    const now = new Date(), nowHour = day === TODAY ? now.getHours() : -1;
    let html = '<div class="cal-dayview' + (day < TODAY ? ' past' : '') + '">';
    for (let h = lo; h <= hi; h++){
      const hh = String(h).padStart(2, '0');
      const cards = items.filter(it=> hourOf(it.time) === h).map(render).filter(Boolean);
      const gone = day < TODAY || (day === TODAY && h < nowHour);
      html += '<div class="cal-hour' + (cards.length ? '' : ' empty') + (h === nowHour ? ' now' : '') + (gone ? ' gone' : '') + '"' + (gone ? '' : ' data-cal-day="' + day + '" data-cal-hour="' + hh + '"') + '>';
      html += '<div class="cal-hour-label">' + fmtTime(hh + ':00').replace(':00', '') + '</div>';
      html += '<div class="cal-hour-items">' + cards.join('') + (!gone && rowExtra ? rowExtra(day, hh + ':00') : '') + '</div>';
      html += '</div>';
    }
    return html + '</div>';
  }

  // Month grid: compact chips (up to 3 a day, then "+N more"); tapping a
  // day opens that week, where the full buttons are. Chips keep their
  // drag attributes, so dragging works here too.
  function calMonthHtml(range, items, chip){
    const first = range.start;
    const nextMonth = addMonths(first, 1);
    let html = '<div class="cal-month"><div class="cal-mhead">';
    for (let i = 0; i < 7; i++) html += '<span>' + new Date(addDays(range.from, i) + 'T00:00:00').toLocaleDateString(undefined, { weekday:'short' }) + '</span>';
    html += '</div><div class="cal-mgrid">';
    for (let day = range.from; day <= range.to; day = addDays(day, 1)){
      const out = day < first || day >= nextMonth;
      const chips = items.filter(it=> it.date === day).map(chip).filter(Boolean);
      html += '<div class="cal-mday' + (out ? ' out' : '') + (day === TODAY ? ' today' : '') + (day < TODAY ? ' past' : '') + '" data-cal-day="' + day + '" data-cal-open="' + day + '" role="button" tabindex="0" aria-label="' + fmtDate(day) + (chips.length ? ', ' + chips.length + ' on' : '') + '">';
      html += '<div class="cal-mnum">' + Number(day.slice(8)) + (chips.length ? '<span class="cal-mcount">' + chips.length + '</span>' : '') + '</div>';
      html += chips.slice(0, 3).join('');
      if (chips.length > 3) html += '<div class="cal-more">+' + (chips.length - 3) + ' more</div>';
      html += '</div>';
    }
    return html + '</div></div>';
  }
  // One compact line in the month view.
  function calChipHtml(it, title, kindCls, attrs){
    return '<div class="cal-chip ' + kindCls + (isPast(it.date, it.time) ? ' past' : '') + '"' + (attrs || '') + ' title="' + esc(fmtTime(it.time) + ' ' + title) + '">'
      + '<b>' + fmtTime(it.time).replace(':00', '').replace(' ', '').toLowerCase() + '</b> ' + esc(title) + '</div>';
  }

  function calGridHtml(start, items, render, dayExtra){
    let html = '<div class="cal-grid">';
    for (let i = 0; i < 7; i++){
      const day = addDays(start, i);
      const d = new Date(day + 'T00:00:00');
      const dayItems = items.filter(it=> it.date === day).map(render).filter(Boolean);
      const extra = dayExtra ? dayExtra(day) : '';
      html += '<div class="cal-day' + (day === TODAY ? ' today' : '') + (day < TODAY ? ' past' : '') + (dayItems.length || extra ? '' : ' empty') + '" data-cal-day="' + day + '">';
      html += '<div class="cal-day-head" data-cal-openday="' + day + '" role="button" tabindex="0" title="Open this day"><span>' + d.toLocaleDateString(undefined, { weekday:'short' }) + '</span><b>' + d.getDate() + '</b></div>';
      html += dayItems.length ? dayItems.join('') : '<div class="cal-none">—</div>';
      html += extra + '</div>';
    }
    return html + '</div>';
  }
  // ‹ › / This week, for whichever calendar the buttons belong to.
  // Switch a calendar to `view` showing the day/week/month containing
  // `date` (the current one is stored as null).
  function calGoTo(scope, view, date){
    if (view === 'day') calDays[scope] = date <= TODAY ? null : date;
    else if (view === 'week' || view === 'timeline'){ const w = mondayOf(date); calWeeks[scope] = w <= mondayOf(TODAY) ? null : w; }
    else if (view === 'list'){ /* always from today */ }
    else if (view === 'year'){ const y = date.slice(0, 4); calYears[scope] = y <= TODAY.slice(0, 4) ? null : y; }
    else { const m = monthStartOf(date); calMonths[scope] = m <= monthStartOf(TODAY) ? null : m; }
    calViews[scope] = view;
    try { localStorage.setItem('bnb-cal-views', JSON.stringify(calViews)); } catch(e){}
  }
  function wireCalNav(root, rerender){
    root.querySelectorAll('[data-cal]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const scope = btn.getAttribute('data-cal-scope');
        const v = btn.getAttribute('data-cal');
        if (calViews[scope] === 'year'){
          const y = Number(calYears[scope] || TODAY.slice(0, 4));
          const next = v === 'today' ? null : String(y + (v === 'next' ? 1 : -1));
          calYears[scope] = next && next > TODAY.slice(0, 4) ? next : null;
        } else if (calViews[scope] === 'day'){
          const start = calDays[scope] || TODAY;
          let next = v === 'today' ? null : addDays(start, v === 'next' ? 1 : -1);
          if (next && next <= TODAY) next = null;
          calDays[scope] = next;
        } else if (calViews[scope] === 'month'){
          const start = calMonths[scope] || monthStartOf(TODAY);
          let next = v === 'today' ? null : addMonths(start, v === 'next' ? 1 : -1);
          if (next && next <= monthStartOf(TODAY)) next = null;
          calMonths[scope] = next;
        } else {
          const start = calWeeks[scope] || mondayOf(TODAY);
          let next = v === 'today' ? null : addDays(start, v === 'next' ? 7 : -7);
          if (next && next <= mondayOf(TODAY)) next = null;
          calWeeks[scope] = next;
        }
        rerender();
      });
    });
    root.querySelectorAll('[data-cal-view]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const scope = btn.getAttribute('data-cal-scope');
        const view = btn.getAttribute('data-cal-view');
        if (calViews[scope] === view) return;
        // Keep roughly the same place: the date being looked at now,
        // never earlier than today.
        const cur = calViews[scope];
        let anchor = cur === 'day' ? calDays[scope] : cur === 'month' ? calMonths[scope] : (cur === 'week' || cur === 'timeline') ? calWeeks[scope]
          : cur === 'year' && calYears[scope] ? calYears[scope] + '-01-01' : null;
        if (!anchor || anchor < TODAY) anchor = TODAY;
        calGoTo(scope, view, anchor);
        if (scope === 'member') memberMoveFrom = null;
        rerender();
      });
    });
    root.querySelectorAll('[data-cal-more]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ const scope = btn.getAttribute('data-cal-scope'); calListDays[scope] = Math.min(calListDays[scope] + 28, 364); rerender(); });
    });
    // Year view: a month's name opens that month.
    root.querySelectorAll('[data-cal-openmonth]').forEach(btn=>{
      const scope = root.querySelector('[data-cal-view]') ? root.querySelector('[data-cal-view]').getAttribute('data-cal-scope') : null;
      btn.addEventListener('click', ()=>{ if (!scope) return; calGoTo(scope, 'month', btn.getAttribute('data-cal-openmonth')); rerender(); });
    });
    // Timeline: tapping a bar opens its day.
    root.querySelectorAll('[data-tl-open]').forEach(bar=>{
      const scope = root.querySelector('[data-cal-view]') ? root.querySelector('[data-cal-view]').getAttribute('data-cal-scope') : null;
      bar.addEventListener('click', ()=>{ if (!scope) return; calGoTo(scope, 'day', bar.getAttribute('data-tl-open')); rerender(); });
    });
    // Week, list and year views: a day's heading / cell opens that day.
    root.querySelectorAll('[data-cal-openday]').forEach(head=>{
      const scope = root.querySelector('[data-cal-view]') ? root.querySelector('[data-cal-view]').getAttribute('data-cal-scope') : null;
      const open = ()=>{ if (!scope) return; calGoTo(scope, 'day', head.getAttribute('data-cal-openday')); rerender(); };
      head.addEventListener('click', open);
      head.addEventListener('keydown', e=>{ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
    });
    // Month view: a day opens its week.
    root.querySelectorAll('[data-cal-open]').forEach(cell=>{
      const scope = (root.querySelector('[data-cal-view]') || {}).getAttribute ? root.querySelector('[data-cal-view]').getAttribute('data-cal-scope') : null;
      const open = ()=>{
        if (!scope) return;
        calGoTo(scope, 'week', cell.getAttribute('data-cal-open'));
        rerender();
      };
      cell.addEventListener('click', open);
      cell.addEventListener('keydown', e=>{ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
    });
  }

  function memberCalendarHtml(){
    const range = calRange('member');
    const items = calendarItems(range.from, range.to);
    let html = calHeadHtml(range, 'member', '<span class="cal-key cal-class"></span>Class<span class="cal-key cal-slot"></span>1-on-1 open<span class="cal-key mine"></span>Yours');

    const activeClasses = classes.filter(c=>c.status==='active');
    if (activeClasses.length > 1){
      html += '<div class="chip-filter" id="sched-class-chips"><button data-filter="all" class="'+(classFilter==='all'?'active':'')+'">All classes</button>';
      activeClasses.forEach(c=> html += '<button data-filter="'+c.id+'" class="'+(classFilter===c.id?'active':'')+'">'+esc(c.name)+'</button>');
      html += '</div>';
    }

    if (memberMoveFrom){
      const what = memberMoveFrom.kind === 'class' ? 'class' : '1-on-1';
      html += '<div class="cal-move-banner">Pick a new time for your ' + what + ' — tap <b>Move here</b> on ' + (memberMoveFrom.kind === 'class' ? 'another time of the same class' : 'an open 1-on-1 slot') + '. <button class="cal-link" data-mmove-cancel>Cancel</button></div>';
    } else if (!range.month && items.some(it=> (it.kind === 'mypt' || (it.kind === 'class' && memberBookingForSession(it.s.id, selfMemberId))) && !isPast(it.date, it.time))){
      html += '<div class="field-hint cal-tip">Tip: drag one of your bookings onto another time to move it.</div>';
    }
    if (range.list) return html + calListHtml(range, items, calItemHtml, 'member');
    if (range.timeline) return html + calTimelineHtml(range, items, memberChipHtml);
    if (range.year) return html + calYearHtml(range, items, it=> it.kind === 'mypt' || (it.kind === 'class' && !!memberBookingForSession(it.s.id, selfMemberId)));
    html += range.month ? calMonthHtml(range, items, memberChipHtml) : range.day ? calDayHtml(range, items, calItemHtml) : calGridHtml(range.start, items, calItemHtml);
    if (!items.length) html += '<div class="empty-msg">Nothing on this ' + (range.month ? 'month' : range.day ? 'day' : 'week') + '.</div>';
    return html;
  }

  /* ---------------- COACH CALENDAR ----------------
     The coach's own week: the classes they teach (with how full they
     are and a Roster button) and all their 1-on-1 slots — open, blocked
     or booked (with who) — plus "+ Slot" on each day to add availability. */
  // trainerId 'all' = every coach (admin calendar).
  function coachCalendarItems(from, to, trainerId){
    const mine = id => trainerId === 'all' || id === trainerId;
    const items = [];
    sessions.filter(s=> mine(s.instructorId) && s.status==='scheduled' && s.date >= from && s.date <= to).forEach(s=>{
      const cls = getClass(s.classId);
      if (cls) items.push({ kind:'class', date:s.date, time:s.startTime, s, cls });
    });
    slots.filter(sl=> mine(sl.trainerId) && sl.date >= from && sl.date <= to).forEach(sl=>{
      items.push({ kind:'slot', date:sl.date, time:sl.startTime, sl, pt: ptBookings.find(p=>p.slotId===sl.id && p.status==='confirmed') });
    });
    return items.sort((a,b)=> (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  }
  function coachCalItemHtml(it, showCoach, admin){
    const past = isPast(it.date, it.time);
    const coachLine = who => showCoach ? '<div class="cal-meta">' + esc(trainerName(who)) + '</div>' : '';
    let cls = 'cal-item' + (past ? ' past' : '');
    let html = '';
    if (it.kind === 'class'){
      const cap = sessionCapacity(it.s), confirmed = sessionConfirmedCount(it.s.id);
      const wl = sessionCounts && sessionCounts[it.s.id] ? sessionCounts[it.s.id].waitlisted : sessionWaitlist(it.s.id).length;
      cls += ' cal-class';
      html += '<div class="cal-time">' + fmtTime(it.time) + ' · ' + it.cls.duration + 'm</div>';
      html += '<div class="cal-title">' + esc(it.cls.name) + '</div>';
      html += coachLine(it.s.instructorId);
      html += '<div class="cal-meta">' + confirmed + '/' + cap + ' booked' + (wl ? ' · ' + wl + ' waiting' : '') + '</div>';
      html += '<div class="cal-actions"><button class="btn2" data-action="open-roster" data-id="' + it.s.id + '">Roster</button>';
      if (!past) html += '<button class="cal-link" data-cal-move="class:' + it.s.id + '">Move</button>';
      if (admin && !past) html += '<button class="cal-link" data-action="cancel-session" data-id="' + it.s.id + '">Cancel</button>';
      html += '</div>';
    } else {
      const sl = it.sl;
      const booked = sl.status === 'booked' && it.pt;
      cls += booked ? ' mine' : ' cal-slot' + (sl.status === 'blocked' ? ' blocked' : '');
      html += '<div class="cal-time">' + fmtTime(it.time) + ' · ' + sl.duration + 'm</div>';
      html += '<div class="cal-title">' + (booked ? esc(memberName(it.pt.userId)) : '1-on-1') + '</div>';
      html += coachLine(sl.trainerId);
      if (booked && it.pt.notes) html += '<div class="cal-note" title="' + esc(it.pt.notes) + '">“' + esc(it.pt.notes) + '”</div>';
      if ((ptWaitCounts[sl.id] || {}).waiting) html += '<div class="cal-meta">+' + ptWaitCounts[sl.id].waiting + ' waiting</div>';
      html += '<div class="cal-actions"><span class="status-pill ' + sl.status + '">' + (booked ? '1-on-1' : sl.status) + '</span>';
      if (!past){
        if (sl.status === 'open') html += '<button class="cal-link" data-action="block-slot" data-id="' + sl.id + '">Block</button>';
        if (sl.status === 'blocked') html += '<button class="cal-link" data-action="unblock-slot" data-id="' + sl.id + '">Unblock</button>';
        if (booked) html += '<button class="cal-link" data-action="cancel-pt-trainer" data-id="' + it.pt.id + '">Cancel</button>';
        html += '<button class="cal-link" data-cal-move="slot:' + sl.id + '">Move</button>';
      }
      html += '</div>';
    }
    // Drag to another day to reschedule (or use Move, e.g. on a phone).
    const drag = past ? '' : ' draggable="true" data-drag="' + (it.kind === 'class' ? 'class:' + it.s.id : 'slot:' + it.sl.id) + '"';
    return '<div class="' + cls + (past ? '' : ' draggable') + '"' + drag + '>' + html + '</div>';
  }
  // Month-view chips. Same drag attributes as the week cards.
  // `make` builds the output — a month chip by default, or a timeline bar.
  function memberChipHtml(it, make){
    make = make || calChipHtml;
    const past = isPast(it.date, it.time);
    if (it.kind === 'class'){
      const mine = memberBookingForSession(it.s.id, selfMemberId);
      const full = sessionConfirmedCount(it.s.id) >= sessionCapacity(it.s);
      let attrs = '';
      if (mine && !past && mine.status === 'confirmed') attrs = ' draggable="true" data-mdrag="class:' + mine.id + ':' + it.s.classId + '"';
      else if (!mine && !past && !full) attrs = ' data-mdrop="class:' + it.s.id + ':' + it.s.classId + '"';
      return make(it, it.cls.name, 'cal-class' + (mine ? ' mine' + (mine.status === 'waitlisted' ? ' wait' : '') : '') + (full && !mine ? ' full' : ''), attrs);
    }
    if (it.kind === 'mypt') return make(it, '1-on-1 · ' + trainerName(it.p.trainerId), 'cal-slot mine', past ? '' : ' draggable="true" data-mdrag="pt:' + it.p.id + '"');
    if (past) return '';
    return make(it, '1-on-1 open', 'cal-slot', ' data-mdrop="slot:' + it.sl.id + '"');
  }
  function coachChipHtml(it, showCoach, make){
    make = make || calChipHtml;
    const past = isPast(it.date, it.time);
    const who = id => showCoach ? ' · ' + trainerName(id) : '';
    if (it.kind === 'class'){
      return make(it, it.cls.name + ' ' + sessionConfirmedCount(it.s.id) + '/' + sessionCapacity(it.s) + who(it.s.instructorId), 'cal-class',
        past ? '' : ' draggable="true" data-drag="class:' + it.s.id + '"');
    }
    const booked = it.sl.status === 'booked' && it.pt;
    return make(it, (booked ? memberName(it.pt.userId) : it.sl.status === 'blocked' ? 'Blocked' : 'Open slot') + who(it.sl.trainerId),
      booked ? 'cal-slot mine' : 'cal-slot' + (it.sl.status === 'blocked' ? ' blocked' : ''),
      past ? '' : ' draggable="true" data-drag="slot:' + it.sl.id + '"');
  }

  function trainerCalendarHtml(){
    const range = calRange('coach');
    const items = coachCalendarItems(range.from, range.to, selfTrainerId);
    let html = calHeadHtml(range, 'coach', '<span class="cal-key cal-class"></span>Class<span class="cal-key cal-slot"></span>Open slot<span class="cal-key mine"></span>Booked 1-on-1');
    if (range.list) return html + calListHtml(range, items, it=> coachCalItemHtml(it, false), 'coach');
    if (range.timeline) return html + calTimelineHtml(range, items, (it, make)=> coachChipHtml(it, false, make));
    if (range.year) return html + calYearHtml(range, items, it=> it.kind === 'slot' && !!it.pt);
    if (range.month) return html + calMonthHtml(range, items, it=> coachChipHtml(it, false));
    if (range.day) return html + calDayHtml(range, items, it=> coachCalItemHtml(it, false), (day, t)=> '<button class="cal-add cal-add-hour" data-cal-addslot="' + day + 'T' + t + '" aria-label="Add a slot at ' + fmtTime(t) + '">+ Slot</button>');
    html += calGridHtml(range.start, items, it=> coachCalItemHtml(it, false), day=> day < TODAY ? '' : '<button class="cal-add" data-cal-addslot="' + day + '">+ Slot</button>');
    return html;
  }

  /* ---------------- ADMIN CALENDAR ----------------
     Every coach's classes and 1-on-1 slots for the week, filterable by
     coach. "+ Session" jumps to the Sessions form with that day filled in. */
  function adminCalendarHtml(){
    const trainers = getSchedTrainers();
    if (adminCalTrainer !== 'all' && !trainers.some(t=>t.id===adminCalTrainer)) adminCalTrainer = 'all';
    const range = calRange('admin');
    const items = coachCalendarItems(range.from, range.to, adminCalTrainer);
    let html = calHeadHtml(range, 'admin', '<span class="cal-key cal-class"></span>Class<span class="cal-key cal-slot"></span>Open slot<span class="cal-key mine"></span>Booked 1-on-1');
    html += '<div class="form-inline cal-filter"><div class="field"><label>Coach</label><select id="sched-admin-cal-trainer"><option value="all">All coaches</option>';
    trainers.forEach(t=> html += '<option value="' + t.id + '"' + (t.id===adminCalTrainer ? ' selected' : '') + '>' + esc(t.name) + '</option>');
    html += '</select></div></div>';
    if (range.list) return html + calListHtml(range, items, it=> coachCalItemHtml(it, adminCalTrainer === 'all', true), 'admin');
    if (range.timeline) return html + calTimelineHtml(range, items, (it, make)=> coachChipHtml(it, adminCalTrainer === 'all', make));
    if (range.year) return html + calYearHtml(range, items, it=> it.kind === 'slot' && !!it.pt);
    if (range.month) return html + calMonthHtml(range, items, it=> coachChipHtml(it, adminCalTrainer === 'all'));
    if (range.day) return html + calDayHtml(range, items, it=> coachCalItemHtml(it, adminCalTrainer === 'all', true), (day, t)=> '<button class="cal-add cal-add-hour" data-cal-addsession="' + day + 'T' + t + '" aria-label="Add a session at ' + fmtTime(t) + '">+ Session</button>');
    html += calGridHtml(range.start, items, it=> coachCalItemHtml(it, adminCalTrainer === 'all', true), day=> day < TODAY ? '' : '<button class="cal-add" data-cal-addsession="' + day + '">+ Session</button>');
    return html;
  }

  /* ---------------- RESCHEDULE (drag and drop) ----------------
     Coach and admin calendars: drag a class or 1-on-1 slot onto another
     day (or tap Move), check the time, confirm. reschedule_class_session()
     / reschedule_pt_slot() (sql/63) move it and tell everyone booked. */
  let moveTarget = null; // { kind:'class'|'slot', id }
  // hour (day view): drop row's hour, keeping the item's minutes.
  function openMoveDialog(ref, day, hour, exactTime){
    const [kind, id] = ref.split(':');
    const item = kind === 'class' ? getSession(id) : slots.find(x=>x.id===id);
    if (!item) return;
    moveTarget = { kind, id };
    let title, who;
    if (kind === 'class'){
      const cls = getClass(item.classId);
      title = 'Move ' + (cls ? cls.name : 'class');
      const n = (sessionCounts && sessionCounts[id]) ? sessionCounts[id].confirmed + sessionCounts[id].waitlisted
        : bookings.filter(b=>b.sessionId===id && (b.status==='confirmed' || b.status==='waitlisted')).length;
      who = n ? n + (n === 1 ? ' person is' : ' people are') + ' booked — they\'ll be told it moved.' : 'Nobody is booked yet.';
    } else {
      const pt = ptBookings.find(p=>p.slotId===id && p.status==='confirmed');
      title = 'Move 1-on-1' + (pt ? ' with ' + memberName(pt.userId) : ' slot');
      who = pt ? memberName(pt.userId) + ' will be told it moved.' : 'Nobody has booked this slot yet.';
    }
    document.getElementById('sched-move-title').textContent = title;
    document.getElementById('sched-move-from').textContent = 'Now: ' + fmtDate(item.date) + ', ' + fmtTime(item.startTime);
    document.getElementById('sched-move-who').textContent = who;
    const dateEl = document.getElementById('sched-move-date');
    dateEl.min = TODAY;
    dateEl.value = day || item.date;
    document.getElementById('sched-move-time').value = exactTime ? exactTime : hour ? hour + String(item.startTime).slice(2,5) : String(item.startTime).slice(0,5);
    document.getElementById('sched-move-panel-backdrop').classList.add('show');
    document.getElementById('sched-move-time').focus();
  }
  function closeMoveDialog(){ document.getElementById('sched-move-panel-backdrop').classList.remove('show'); moveTarget = null; }
  async function confirmMove(){
    if (!moveTarget) return;
    const date = document.getElementById('sched-move-date').value, time = document.getElementById('sched-move-time').value;
    if (!date || !time){ toast('Pick a date and time.'); return; }
    const btn = document.getElementById('sched-move-save');
    btn.disabled = true;
    const fn = moveTarget.kind === 'class' ? 'reschedule_class_session' : 'reschedule_pt_slot';
    const args = moveTarget.kind === 'class' ? { p_session_id: moveTarget.id, p_date: date, p_time: time } : { p_slot_id: moveTarget.id, p_date: date, p_time: time };
    const { data: told, error } = await bnbClient.rpc(fn, args);
    btn.disabled = false;
    if (error){ toast(error.message || 'Could not move that.'); return; }
    closeMoveDialog();
    toast('Moved to ' + fmtDate(date) + ', ' + fmtTime(time) + (told ? ' — ' + told + ' booked ' + (told === 1 ? 'person' : 'people') + ' told.' : '.'));
    await Promise.all([refreshSessionsFromSupabase(), refreshSlotsFromSupabase(), refreshPtBookingsFromSupabase()]);
    afterBookingChange();
  }
  function wireCalDrag(root){
    root.querySelectorAll('[data-cal-move]').forEach(btn=>{
      btn.addEventListener('click', ()=> openMoveDialog(btn.getAttribute('data-cal-move')));
    });
    let dragging = null;
    root.querySelectorAll('[data-drag]').forEach(el=>{
      el.addEventListener('dragstart', e=>{
        dragging = el.getAttribute('data-drag');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragging); } catch(err){}
        el.classList.add('dragging');
        root.querySelectorAll('.cal-grid').forEach(g=> g.classList.add('drag-on'));
      });
      el.addEventListener('dragend', ()=>{
        dragging = null;
        el.classList.remove('dragging');
        root.querySelectorAll('.drop-ok').forEach(d=> d.classList.remove('drop-ok'));
        root.querySelectorAll('.drag-on').forEach(g=> g.classList.remove('drag-on'));
      });
    });
    root.querySelectorAll('[data-cal-day]').forEach(dayEl=>{
      const day = dayEl.getAttribute('data-cal-day');
      if (day < TODAY) return;
      dayEl.addEventListener('dragover', e=>{ if (!dragging) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; dayEl.classList.add('drop-ok'); });
      dayEl.addEventListener('dragleave', e=>{ if (!dayEl.contains(e.relatedTarget)) dayEl.classList.remove('drop-ok'); });
      dayEl.addEventListener('drop', e=>{
        if (!dragging) return;
        e.preventDefault();
        dayEl.classList.remove('drop-ok');
        let exact = null;
        if (dayEl.hasAttribute('data-tl-span')){
          const rect = dayEl.getBoundingClientRect();
          const lo = Number(dayEl.getAttribute('data-tl-lo')), span = Number(dayEl.getAttribute('data-tl-span'));
          let m = lo * 60 + Math.round(((e.clientX - rect.left) / rect.width * span) / 15) * 15;
          m = Math.max(lo * 60, Math.min(m, lo * 60 + span - 15));
          exact = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
        }
        openMoveDialog(dragging, day, dayEl.getAttribute('data-cal-hour'), exact);
      });
    });
  }

  /* ---------------- BOOK A TRAINER ----------------
     Pick a coach (or Any coach) from the cards, see their profile, then
     their open 1-on-1 slots — or everyone's, by date — filtered by day
     and time of day. Booking asks what you want to work on (sql/65).
     "Request a time" messages the coach when nothing suits. */
  const DAY_PARTS = { morning: [0, 12], afternoon: [12, 17], evening: [17, 24] };
  function partOf(time){ const h = Number(String(time).slice(0, 2)); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  function isoDow(date){ return ((new Date(date + 'T00:00:00').getDay() + 6) % 7) + 1; }
  function coachAvatarHtml(id, size){
    const u = window.BNB_USERS && window.BNB_USERS.getById ? window.BNB_USERS.getById(id) : null;
    const url = u && u.avatar && /^https:\/\//.test(u.avatar) ? u.avatar : '';
    const name = trainerName(id);
    const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w=> w[0].toUpperCase()).join('');
    return '<span class="coach-avatar" style="--av:' + size + 'px">' + (url ? '<img src="' + esc(url) + '" alt="" loading="lazy">' : esc(ini || '?')) + '</span>';
  }
  async function refreshCoachProfiles(){
    const { data, error } = await bnbClient.from('coach_profiles').select('user_id, bio, specialties');
    if (error) return; // before sql/65, or signed out — profiles just don't show
    coachProfiles = {};
    (data || []).forEach(r=>{ coachProfiles[r.user_id] = { bio: r.bio || '', specialties: r.specialties || [] }; });
    renderBody();
  }
  function coachProfileCardHtml(id){
    const prof = coachProfiles[id] || { bio: '', specialties: [] };
    let html = '<div class="coach-profile">' + coachAvatarHtml(id, 72) + '<div class="coach-profile-body">';
    html += '<h3>' + esc(trainerName(id)) + '</h3>';
    html += '<div class="rating-inline">' + ratingSummaryLineHtml(id) + '</div>';
    if (prof.specialties.length) html += '<div class="coach-tags">' + prof.specialties.map(t=> '<span>' + esc(t) + '</span>').join('') + '</div>';
    html += prof.bio ? '<p class="coach-bio">' + esc(prof.bio) + '</p>' : '<p class="coach-bio field-hint">No bio yet.</p>';
    html += ratingBreakdownHtml(id);
    return html + '</div></div>';
  }
  function memberBookTrainerHtml(){
    const trainers = getSchedTrainers();
    if (memberTrainerId !== 'any' && !trainers.some(t=>t.id===memberTrainerId)) memberTrainerId = 'any';
    const any = memberTrainerId === 'any';

    // Coach picker cards
    let html = '<div class="coach-pick" role="radiogroup" aria-label="Coach">';
    html += '<button class="coach-pick-card' + (any ? ' active' : '') + '" data-pick-coach="any" role="radio" aria-checked="' + any + '"><span class="coach-avatar any" style="--av:40px">★</span><span><b>Any coach</b><small>Every open slot by date</small></span></button>';
    trainers.forEach(t=>{
      const s = ratingSummaries[t.id];
      const on = t.id === memberTrainerId;
      html += '<button class="coach-pick-card' + (on ? ' active' : '') + '" data-pick-coach="' + t.id + '" role="radio" aria-checked="' + on + '">' + coachAvatarHtml(t.id, 40)
        + '<span><b>' + esc(t.name) + '</b><small>' + (s && s.overall != null ? '★ ' + Number(s.overall).toFixed(1) : ((coachProfiles[t.id] || {}).specialties || []).slice(0, 2).map(esc).join(' · ') || '&nbsp;') + '</small></span></button>';
    });
    html += '</div>';
    if (!any) html += coachProfileCardHtml(memberTrainerId);

    // Filters
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    html += '<div class="slot-filters"><div class="chip-filter" id="slot-day-chips"><button data-slot-day="all" class="' + (slotDayFilter==='all'?'active':'') + '">Any day</button>';
    dayNames.forEach((n, i)=> html += '<button data-slot-day="' + (i + 1) + '" class="' + (slotDayFilter===String(i + 1)?'active':'') + '">' + n + '</button>');
    html += '</div><div class="chip-filter" id="slot-part-chips">';
    [['all','Any time'],['morning','Morning'],['afternoon','Afternoon'],['evening','Evening']].forEach(([v, l])=> html += '<button data-slot-part="' + v + '" class="' + (slotPartFilter===v?'active':'') + '">' + l + '</button>');
    html += '</div></div>';

    // Open slots
    // Open slots, plus booked ones (someone else's) you can wait for.
    const mineSlot = id => ptBookings.some(p=> p.slotId===id && p.userId===selfMemberId && p.status==='confirmed');
    const open = slots.filter(sl=> (sl.status==='open' || (sl.status==='booked' && !mineSlot(sl.id))) && !isPast(sl.date, sl.startTime) && (any || sl.trainerId===memberTrainerId)
        && (slotDayFilter==='all' || String(isoDow(sl.date))===slotDayFilter)
        && (slotPartFilter==='all' || partOf(sl.startTime)===slotPartFilter))
      .sort((a,b)=> (a.date+a.startTime) < (b.date+b.startTime) ? -1 : 1);
    const who = any ? 'any coach' : trainerName(memberTrainerId);
    if (!open.length){
      html += '<div class="empty-msg">No open 1-on-1 slots' + (slotDayFilter!=='all' || slotPartFilter!=='all' ? ' match those filters' : ' for ' + esc(who) + ' right now') + '.</div>';
    } else {
      groupByDate(open, 'date').forEach(g=>{
        html += '<div class="slot-day"><h4>' + fmtDate(g.date) + '</h4>';
        g.items.forEach(sl=>{
          const full = sl.status === 'booked';
          const w = ptWaitCounts[sl.id] || { waiting: 0, myPlace: null };
          html += '<div class="slot-row' + (full ? ' full' : '') + '"><span class="slot-time">' + fmtTime(sl.startTime) + '</span><span class="slot-dur">' + sl.duration + ' min</span>';
          if (any) html += '<button class="slot-coach" data-pick-coach="' + sl.trainerId + '">' + coachAvatarHtml(sl.trainerId, 22) + esc(trainerName(sl.trainerId)) + '</button>';
          if (!full) html += '<button class="btn2 primary" data-action="member-book-slot" data-id="' + sl.id + '">Book</button></div>';
          else if (w.myPlace) html += '<span class="slot-wait">On waitlist · #' + w.myPlace + '</span><button class="btn2" data-action="member-leave-ptwait" data-id="' + sl.id + '">Leave</button></div>';
          else html += '<span class="slot-wait">Booked' + (w.waiting ? ' · ' + w.waiting + ' waiting' : '') + '</span><button class="btn2" data-action="member-join-ptwait" data-id="' + sl.id + '">Join waitlist</button></div>';
        });
        html += '</div>';
      });
    }
    html += '<div class="slot-request"><span>Can\'t find a time that suits?</span><button class="btn2" data-request-time="' + (any ? 'any' : memberTrainerId) + '">Request a time</button></div>';
    return html;
  }

  // ---- Book (with a note) ----
  let bookingSlotId = null, editingNoteFor = null, waitingSlotId = null;
  function openWaitPanel(slotId){
    const sl = slots.find(x=>x.id===slotId); if (!sl) return;
    bookingSlotId = null; editingNoteFor = null; waitingSlotId = slotId;
    const w = ptWaitCounts[slotId] || { waiting: 0 };
    const credits = window.BNB_USERS ? window.BNB_USERS.getCredits(selfMemberId) : 0;
    document.getElementById('sched-ptbook-title').textContent = 'Join the waitlist';
    document.getElementById('sched-ptbook-when').textContent = trainerName(sl.trainerId) + ' · ' + fmtDate(sl.date) + ', ' + fmtTime(sl.startTime) + ' · ' + (w.waiting ? w.waiting + ' already waiting' : 'nobody waiting yet');
    document.getElementById('sched-ptbook-credits').textContent = 'If it opens up, you\'re booked in automatically and 1 credit is used'
      + (credits > 0 ? '.' : ' — you have none right now, so you\'d be skipped unless you get one first.') + ' You can leave the waitlist any time.';
    document.getElementById('sched-ptbook-notes').value = '';
    document.getElementById('sched-ptbook-save').textContent = 'Join Waitlist';
    document.getElementById('sched-ptbook-panel-backdrop').classList.add('show');
    document.getElementById('sched-ptbook-notes').focus();
  }
  async function leavePtWaitlist(slotId){
    if (!confirm('Leave the waitlist for this 1-on-1?')) return;
    const { error } = await bnbClient.rpc('leave_pt_waitlist', { p_slot_id: slotId, p_member_id: selfMemberId });
    if (error){ toast(error.message || 'Could not leave the waitlist.'); return; }
    toast('Removed from the waitlist.');
    refreshPtWaitlist();
  }
  function memberBookSlot(slotId){
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
    bookingSlotId = slotId; editingNoteFor = null; waitingSlotId = null;
    document.getElementById('sched-ptbook-title').textContent = 'Book a 1-on-1';
    document.getElementById('sched-ptbook-when').textContent = trainerName(sl.trainerId) + ' · ' + fmtDate(sl.date) + ', ' + fmtTime(sl.startTime) + ' · ' + sl.duration + ' min';
    document.getElementById('sched-ptbook-credits').textContent = 'Uses 1 of your ' + credits + ' credit' + (credits === 1 ? '' : 's') + '. Cancel more than 24 hours before and you get it back.';
    document.getElementById('sched-ptbook-notes').value = '';
    document.getElementById('sched-ptbook-save').textContent = 'Book';
    document.getElementById('sched-ptbook-panel-backdrop').classList.add('show');
    document.getElementById('sched-ptbook-notes').focus();
  }
  function openNoteEditor(ptId){
    const p = ptBookings.find(x=>x.id===ptId); if (!p) return;
    const sl = slots.find(x=>x.id===p.slotId);
    bookingSlotId = null; editingNoteFor = ptId; waitingSlotId = null;
    document.getElementById('sched-ptbook-title').textContent = 'What do you want to work on?';
    document.getElementById('sched-ptbook-when').textContent = trainerName(p.trainerId) + (sl ? ' · ' + fmtDate(sl.date) + ', ' + fmtTime(sl.startTime) : '');
    document.getElementById('sched-ptbook-credits').textContent = 'Your coach sees this before the session.';
    document.getElementById('sched-ptbook-notes').value = p.notes || '';
    document.getElementById('sched-ptbook-save').textContent = 'Save';
    document.getElementById('sched-ptbook-panel-backdrop').classList.add('show');
    document.getElementById('sched-ptbook-notes').focus();
  }
  function closeBookPanel(){ document.getElementById('sched-ptbook-panel-backdrop').classList.remove('show'); bookingSlotId = null; editingNoteFor = null; waitingSlotId = null; }
  async function confirmBookPanel(){
    const notes = document.getElementById('sched-ptbook-notes').value.trim();
    const btn = document.getElementById('sched-ptbook-save');
    if (waitingSlotId){
      btn.disabled = true;
      const { data: place, error } = await bnbClient.rpc('join_pt_waitlist', { p_slot_id: waitingSlotId, p_member_id: selfMemberId, p_notes: notes || null });
      btn.disabled = false;
      if (error){ toast(error.message || 'Could not join the waitlist.'); closeBookPanel(); refreshSlotsFromSupabase(); return; }
      closeBookPanel();
      toast('You\'re on the waitlist — #' + place + '. We\'ll book you in if it opens up.');
      refreshPtWaitlist();
      return;
    }
    if (editingNoteFor){
      btn.disabled = true;
      const { error } = await bnbClient.rpc('set_pt_booking_notes', { p_booking_id: editingNoteFor, p_notes: notes });
      btn.disabled = false;
      if (error){ toast(error.message || 'Could not save that.'); return; }
      closeBookPanel();
      toast('Saved — your coach will see it.');
      await refreshPtBookingsFromSupabase();
      renderBody();
      return;
    }
    const slotId = bookingSlotId; if (!slotId) return;
    const me = window.BNB_USERS ? window.BNB_USERS.getById(selfMemberId) : null;
    if (me && Number(me.balance) > 0){
      if (!confirm('Your account has an outstanding balance of ' + BNB_CURRENCY.format(me.balance) + '. Book this session anyway?')) return;
    }
    btn.disabled = true;
    const { data: left, error } = await bnbClient.rpc('book_pt_slot', { p_slot_id: slotId, p_member_id: selfMemberId, p_notes: notes || null });
    btn.disabled = false;
    if (error){ toast(error.message || 'Could not book that slot.'); closeBookPanel(); refreshSlotsFromSupabase(); return; }
    closeBookPanel();
    if (window.BNB_USERS) window.BNB_USERS.setCreditsFromServer(selfMemberId, left);
    toast('1-on-1 session booked! ' + left + ' credit' + (left===1?'':'s') + ' remaining.');
    await Promise.all([refreshSlotsFromSupabase(), refreshPtBookingsFromSupabase()]);
    renderIdentityRow();
    renderBody();
  }

  // ---- Request a time ----
  function openRequestPanel(coach){
    const sel = document.getElementById('sched-ptreq-coach');
    sel.innerHTML = '<option value="any">Any coach</option>' + getSchedTrainers().map(t=> '<option value="' + t.id + '">' + esc(t.name) + '</option>').join('');
    sel.value = coach && coach !== 'any' ? coach : 'any';
    document.querySelectorAll('#sched-ptreq-days input, #sched-ptreq-parts input').forEach(c=> c.checked = false);
    if (slotDayFilter !== 'all'){ const c = document.querySelector('#sched-ptreq-days input[value="' + slotDayFilter + '"]'); if (c) c.checked = true; }
    if (slotPartFilter !== 'all'){ const c = document.querySelector('#sched-ptreq-parts input[value="' + slotPartFilter + '"]'); if (c) c.checked = true; }
    document.getElementById('sched-ptreq-note').value = '';
    document.getElementById('sched-ptreq-panel-backdrop').classList.add('show');
  }
  function closeRequestPanel(){ document.getElementById('sched-ptreq-panel-backdrop').classList.remove('show'); }
  async function sendRequest(){
    const coach = document.getElementById('sched-ptreq-coach').value;
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const days = [...document.querySelectorAll('#sched-ptreq-days input:checked')].map(c=> dayNames[Number(c.value) - 1]);
    const parts = [...document.querySelectorAll('#sched-ptreq-parts input:checked')].map(c=> c.value.charAt(0).toUpperCase() + c.value.slice(1) + 's');
    const note = document.getElementById('sched-ptreq-note').value.trim();
    if (!days.length && !parts.length && !note){ toast('Pick some days or times, or add a note.'); return; }
    const body = '📅 1-on-1 request' + (coach === 'any' ? ' (any coach)' : '') + '\n'
      + 'Days: ' + (days.length ? days.join(', ') : 'Any') + '\n'
      + 'Times: ' + (parts.length ? parts.join(', ') : 'Any') + (note ? '\n' + note : '');
    const btn = document.getElementById('sched-ptreq-send');
    btn.disabled = true;
    // One coach: a direct message (Inbox). Any coach: the member's
    // thread with the coaching team (Messages).
    const { error } = coach === 'any'
      ? await bnbClient.rpc('send_message', { p_member_id: selfMemberId, p_body: body })
      : await bnbClient.rpc('send_direct_message', { p_recipient_id: coach, p_body: body });
    btn.disabled = false;
    if (error){ toast(error.message || 'Could not send that.'); return; }
    closeRequestPanel();
    toast(coach === 'any' ? 'Request sent to the coaches — they\'ll reply in Messages.' : 'Request sent to ' + trainerName(coach) + ' — they\'ll reply in your Inbox.');
  }

  /* ---------------- COACH: MY PROFILE (sql/65) ---------------- */
  function trainerProfileHtml(){
    const prof = coachProfiles[selfTrainerId] || { bio: '', specialties: [] };
    let html = '<div class="admin-notice">This is what members see when they pick you in Book a Trainer. Your photo is your account photo.</div>';
    html += '<div class="coach-profile-edit"><div class="field"><label for="coach-prof-specialties">Specialties (comma-separated, up to 12)</label><input type="text" id="coach-prof-specialties" maxlength="300" placeholder="e.g. Strength, Mobility, Pre/postnatal" value="' + esc(prof.specialties.join(', ')) + '"></div>';
    html += '<div class="field"><label for="coach-prof-bio">Bio</label><textarea id="coach-prof-bio" rows="5" maxlength="800" placeholder="A few lines about you and how you coach">' + esc(prof.bio) + '</textarea><div class="field-hint"><span id="coach-prof-count">' + prof.bio.length + '</span>/800</div></div>';
    html += '<div class="crud-actions" style="padding:0;"><button class="btn2 primary" id="coach-prof-save">Save Profile</button></div></div>';
    html += '<div class="section-sub-head"><h3>Preview</h3></div>' + coachProfileCardHtml(selfTrainerId);
    return html;
  }
  async function saveCoachProfile(){
    const specialties = document.getElementById('coach-prof-specialties').value.split(',').map(t=> t.trim()).filter(Boolean).slice(0, 12).map(t=> t.slice(0, 40));
    const bio = document.getElementById('coach-prof-bio').value.trim().slice(0, 800);
    const { error } = await bnbClient.from('coach_profiles').upsert([{ user_id: selfTrainerId, bio, specialties, updated_at: new Date().toISOString() }]);
    if (error){ toast(error.message || 'Could not save your profile.'); return; }
    coachProfiles[selfTrainerId] = { bio, specialties };
    toast('Profile saved.');
    renderCoachBody();
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
        html += '<tr><td>'+(cls?esc(cls.name):'—')+'</td><td>'+fmtDate(x.s.date)+'</td><td>'+fmtTime(x.s.startTime)+'</td><td><span class="status-pill '+x.b.status+'">'+x.b.status+(x.b.status==='waitlisted'&&myWaitlistPlace(x.s.id)?' #'+myWaitlistPlace(x.s.id):'')+'</span></td><td><div class="row-actions"><button data-action="member-cancel-booking" data-id="'+x.b.id+'">Cancel</button></div></td></tr>';
      });
      html += '</table>';
    }

    const myWaits = Object.keys(ptWaitCounts).filter(id=> ptWaitCounts[id].myPlace).map(id=> slots.find(sl=> sl.id===id)).filter(Boolean)
      .sort((a,b)=> (a.date+a.startTime) < (b.date+b.startTime) ? -1 : 1);
    if (myWaits.length){
      html += '<div class="section-sub-head"><h3>1-on-1 Waitlists</h3></div>';
      html += '<table class="admin-table"><tr><th>Trainer</th><th>Date</th><th>Time</th><th>Place</th><th></th></tr>';
      myWaits.forEach(sl=>{
        html += '<tr><td>'+esc(trainerName(sl.trainerId))+'</td><td>'+fmtDate(sl.date)+'</td><td>'+fmtTime(sl.startTime)+'</td><td><span class="status-pill waitlisted">#'+ptWaitCounts[sl.id].myPlace+'</span></td><td><div class="row-actions"><button data-action="member-leave-ptwait" data-id="'+sl.id+'">Leave</button></div></td></tr>';
      });
      html += '</table>';
    }
    html += '<div class="section-sub-head"><h3>1-on-1 Sessions</h3></div>';
    if (!myPt.length) html += '<div class="empty-msg">No upcoming 1-on-1 sessions.</div>';
    else {
      html += '<table class="admin-table"><tr><th>Trainer</th><th>Date</th><th>Time</th><th>Working on</th><th></th></tr>';
      myPt.sort((a,b)=> (a.sl.date+a.sl.startTime) < (b.sl.date+b.sl.startTime) ? -1 : 1).forEach(x=>{
        html += '<tr><td>'+esc(trainerName(x.p.trainerId))+'</td><td>'+fmtDate(x.sl.date)+'</td><td>'+fmtTime(x.sl.startTime)+'</td><td>'+(x.p.notes ? esc(x.p.notes) : '<span class="field-hint">—</span>')+'</td><td><div class="row-actions"><button data-action="edit-pt-note" data-id="'+x.p.id+'">'+(x.p.notes ? 'Edit note' : 'Add note')+'</button><button data-action="member-cancel-pt" data-id="'+x.p.id+'">Cancel</button></div></td></tr>';
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
    html += subBtn('calendar', trainerSubTab, 'Calendar');
    html += subBtn('classes', trainerSubTab, 'My Classes');
    html += subBtn('slots', trainerSubTab, 'My 1-on-1 Slots');
    html += subBtn('ratings', trainerSubTab, 'My Ratings');
    html += subBtn('profile', trainerSubTab, 'My Profile');
    html += '</div>';
    if (trainerSubTab === 'roster') html += trainerRosterHtml();
    else if (trainerSubTab === 'classes') html += trainerClassesHtml();
    else if (trainerSubTab === 'calendar') html += trainerCalendarHtml();
    else if (trainerSubTab === 'ratings') html += trainerRatingsHtml();
    else if (trainerSubTab === 'profile') html += trainerProfileHtml();
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
      html += '<tr><td>'+esc(memberName(r.uid))+'</td>' +
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
      html += '<tr><td>'+(cls?esc(cls.name):'—')+'</td><td>'+fmtDate(s.date)+'</td><td>'+fmtTime(s.startTime)+'</td><td>'+confirmed+'/'+cap+' · '+wl+' waitlisted</td><td><div class="row-actions"><button data-action="open-roster" data-id="'+s.id+'">View Roster</button></div></td></tr>';
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
      html += '<tr><td>'+fmtDate(sl.date)+'</td><td>'+fmtTime(sl.startTime)+'</td><td>'+sl.duration+' min</td><td><span class="status-pill '+sl.status+'">'+sl.status+'</span>'+((ptWaitCounts[sl.id]||{}).waiting?'<div class="field-hint">'+ptWaitCounts[sl.id].waiting+' waiting</div>':'')+'</td><td>'+(pt?esc(memberName(pt.userId))+(pt.notes?'<div class="field-hint">“'+esc(pt.notes)+'”</div>':''):'—')+'</td><td><div class="row-actions">';
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
    const W=chartW,H=CHART_H,padL=54,padR=24,padT=20,padB=40;
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
    const W=chartW,H=CHART_H,padL=54,padR=24,padT=20,padB=40;
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

  // Chart size for the client page's card grid. renderCoachDashboard sets
  // chartW from the real card width before building, so the SVG text
  // stays a readable size on phones and on wide screens alike.
  let chartW = 560;
  const CHART_H = 240;

  // Each chart card body: { state: 'ok' | 'empty' | 'loading', html }.
  // Cards with data sort ahead of empty ones on the client page.
  const ok = html => ({ state: 'ok', html });
  const emptyBody = text => ({ state: 'empty', html: '<div class="weight-chart-empty">' + text + '</div>' });
  const loadingBody = text => ({ state: 'loading', html: '<div class="weight-chart-empty">' + text + '</div>' });

  function findUser(id){
    const U = window.BNB_USERS;
    if (!U) return null;
    const self = U.getSelf && U.getSelf();
    if (self && self.id === id) return self;
    return (U.getById && U.getById(id)) || U.getMembers().find(u => u.id === id) || null;
  }

  function assessmentBody(clientId, field){
    const entries = (window.BNB_USERS && window.BNB_USERS.getAssessments) ? window.BNB_USERS.getAssessments(clientId) : [];
    const filtered = entries.filter(a=> a[field] !== '' && a[field] != null && !isNaN(Number(a[field]))).slice().reverse(); // oldest-first
    if (filtered.length < 2){
      return emptyBody('Needs at least two assessments with a ' + (field==='weight'?'weight':'body fat') + ' entry.');
    }
    const points = filtered.map(a=> ({ label: fmtChartDate(a.date), value: Number(a[field]) }));
    const last = points[points.length - 1].value, change = last - points[0].value;
    return ok('<div class="vitals-summary">Latest <b>' + last + (field==='weight'?' kg':'%') + '</b> · change <b>' + (change > 0 ? '+' : '') + change.toFixed(1) + '</b> since ' + points[0].label + '</div>' + svgLineChart(points));
  }

  function exerciseBody(clientId){
    const names = (window.BNB_MLS && window.BNB_MLS.getExerciseNames) ? window.BNB_MLS.getExerciseNames(clientId) : [];
    if (!names.length) return emptyBody('No logged Live Session exercises yet.');
    if (names.indexOf(progressExercise) === -1) progressExercise = names[0];
    let html = '<div class="field cp-card-field"><select id="progress-exercise-select">';
    names.forEach(n=> html += '<option value="'+esc(n)+'"'+(n===progressExercise?' selected':'')+'>'+esc(n)+'</option>');
    html += '</select></div>';
    const points = (window.BNB_MLS && window.BNB_MLS.getExerciseSeries) ? window.BNB_MLS.getExerciseSeries(clientId, progressExercise) : [];
    if (points.length < 2) return ok(html + '<div class="weight-chart-empty">Log at least two sessions with this exercise to see a trend.</div>');
    return ok(html + svgLineChart(points.map(p=> ({ label: fmtChartDate(p.date), value: p.wt }))) +
      '<div class="weight-chart-legend"><span><i class="swatch solid"></i>Top set weight</span></div>');
  }

  function attendanceBody(clientId){
    const counts = (window.BNB_USERS && window.BNB_USERS.getWeeklyVisitCounts) ? window.BNB_USERS.getWeeklyVisitCounts(clientId, 8) : [];
    if (!counts.some(c=>c>0)) return emptyBody('No check-ins logged yet.');
    const labels = counts.map((_,i)=> i===counts.length-1 ? 'Now' : '-' + (counts.length-1-i) + 'w');
    return ok(svgBarChart(counts, labels) + '<div class="weight-chart-legend"><span><i class="swatch solid"></i>Visits per rolling 7-day window</span></div>');
  }

  // Blood pressure and steps the member logs in Me > BP and Me > Steps,
  // drawn with the same chart code they see (js/bells-n-barz-vitals.js).
  function fetchVitals(clientId){
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
      renderCoachDashboard();
    });
  }
  function vitalsBody(clientId, kind){
    if (!(clientId in vitalsCache)) fetchVitals(clientId);
    const data = vitalsCache[clientId];
    if (data === 'loading') return loadingBody('Loading…');
    if (data === null) return emptyBody('Couldn’t load these logs.');
    const V = window.BNB_VITALS;
    const DAY = 86400000, now = Date.now(), days = progressVitalsDays;
    const W = chartW, H = CHART_H;

    if (kind === 'bp'){
      const list = data.bp.filter(e=> e.t >= now - days * DAY);
      if (!list.length){
        return emptyBody(data.bp.length ? 'No readings in the last ' + days + ' days.' : 'No readings yet. They’re logged in Me &gt; BP.');
      }
      const latest = data.bp[data.bp.length - 1];
      const cat = V.bpCategory(latest.sys, latest.dia);
      const avgS = Math.round(list.reduce((a,e)=> a + e.sys, 0) / list.length);
      const avgD = Math.round(list.reduce((a,e)=> a + e.dia, 0) / list.length);
      const avgCat = V.bpCategory(avgS, avgD);
      let html = '<div class="vitals-summary">Latest <b>' + latest.sys + '/' + latest.dia + '</b> <span class="' + cat.cls + '">' + cat.label + '</span>'
        + ' <span class="muted">' + V.fmtDate(latest.t) + '</span>'
        + ' · avg <b>' + avgS + '/' + avgD + '</b> <span class="' + avgCat.cls + '">' + avgCat.label + '</span>'
        + ' · ' + list.length + ' reading' + (list.length === 1 ? '' : 's') + '</div>';
      html += '<svg class="weight-chart-svg" viewBox="0 0 '+W+' '+H+'">' + V.bpChartSvg(list, W, H, days) + '</svg>';
      html += '<div class="weight-chart-legend"><span><i class="swatch solid" style="background:var(--accent-2);"></i>Systolic</span><span><i class="swatch solid"></i>Diastolic</span><span><i class="swatch target"></i>120 / 80</span></div>';
      return ok(html);
    }

    const firstT = V.dayStart(TODAY) - (days - 1) * DAY;
    const list = data.steps.filter(e=> V.dayStart(e.date) >= firstT);
    if (!list.length){
      return emptyBody(data.steps.length ? 'No steps logged in the last ' + days + ' days.' : 'No steps logged yet. They’re logged in Me &gt; Steps.');
    }
    // The member's own goal is a per-device setting, so the coach sees
    // the common 10,000 as a reference instead.
    const ref = 10000;
    const avg = list.reduce((a,e)=> a + e.steps, 0) / list.length;
    const hit = list.filter(e=> e.steps >= ref).length;
    let html = '<div class="vitals-summary">Avg <b>' + V.fmtInt(avg) + '</b> a logged day · ' + list.length + ' of ' + days + ' days logged · '
      + hit + ' at 10k+ · best <b>' + V.fmtInt(Math.max(...list.map(e=> e.steps))) + '</b></div>';
    html += '<svg class="weight-chart-svg coach-steps-chart" viewBox="0 0 '+W+' '+H+'">' + V.stepsChartSvg(data.steps, list, W, H, days, ref, '10k') + '</svg>';
    html += '<div class="weight-chart-legend"><span><i class="swatch bar"></i>10k+</span><span><i class="swatch bar" style="background:var(--accent-dim);"></i>Under 10k</span><span><i class="swatch dash"></i>7-day avg</span></div>';
    return ok(html);
  }

  // Body fat % from the member's own tape measurements (Me > Weight > Body
  // Composition), using the same formulas they see (js/bells-n-barz-bodyfat.js)
  // and the height on their profile.
  function tapeBodyFatBody(clientId){
    if (!(clientId in measurementsCache)){
      measurementsCache[clientId] = 'loading';
      bnbClient.from('body_measurements').select('*').eq('user_id', clientId).order('date').then(({ data, error })=>{
        if (error) console.error('Supabase load body_measurements failed:', error);
        measurementsCache[clientId] = error ? null : (data || []);
        if (progressClientId === clientId) renderCoachDashboard();
      });
    }
    const rows = measurementsCache[clientId];
    if (rows === 'loading') return loadingBody('Loading measurements…');
    if (rows === null) return emptyBody('Couldn’t load the measurements.');
    if (rows.length < 2) return emptyBody('Needs at least two saved measurements in Me &gt; Weight &gt; Body Composition.');
    const member = findUser(clientId);
    const heightCm = member && parseFloat(member.height);
    if (!(heightCm > 0)) return emptyBody('No height on the profile, which the body fat formulas need.');
    const BF = window.BNB_BODYFAT;
    const points = rows.map(r=> ({ label: fmtChartDate(r.date), value: Number(BF.estimate({
      sex: r.sex, waistCm: Number(r.waist_cm),
      neckCm: r.neck_cm == null ? null : Number(r.neck_cm),
      hipCm: r.hip_cm == null ? null : Number(r.hip_cm)
    }, heightCm).pct.toFixed(1)) }));
    return ok(svgLineChart(points) + '<div class="weight-chart-legend"><span><i class="swatch solid"></i>Navy when neck is measured, otherwise RFM</span></div>');
  }

  // Same Mon..Sun resolution used elsewhere in this app (main file lines
  // 5340/5956, js/bells-n-barz-accountability.js) so "today" means the
  // same local-time day everywhere, not recomputed differently here.
  const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
  function todayDayKey(){
    const idx = new Date().getDay(); // 0=Sun..6=Sat
    return DAY_ORDER[idx === 0 ? 6 : idx - 1];
  }

  // "Today's Program": compares a client's assigned exercises for today
  // against what they actually logged (window.BNB_MLS.getLoggedExercisesForDate,
  // in the main file — same closure that owns mls_history). programs isn't
  // preloaded here, so it's fetched once per client and cached in
  // complianceProgramCache; a cache miss kicks off the fetch and re-renders
  // the dashboard once it resolves.
  function complianceBody(clientId){
    if (!(clientId in complianceProgramCache)){
      complianceProgramCache[clientId] = 'loading';
      bnbClient.from('programs').select('data').eq('owner_id', clientId).then(({ data, error })=>{
        complianceProgramCache[clientId] = (!error && data && data.length) ? data[0].data : null;
        if (progressClientId === clientId) renderCoachDashboard();
      });
    }
    const program = complianceProgramCache[clientId];
    if (program === 'loading') return loadingBody('Loading today’s program…');

    const blocks = (program && program[todayDayKey()]) || [];
    if (!blocks.length) return emptyBody('Rest day — nothing assigned today.');

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
    return ok(html);
  }

  /* ---------------- CLIENT GRID (Coach Dashboard landing) ---------------- */
  // The coach first, then every active client. Clicking a card opens that
  // person's page with all their charts side by side.
  function progressPeopleIds(){
    const ids = selfTrainerId ? [selfTrainerId] : [];
    activeClientIdsForTrainer(selfTrainerId).forEach(id=>{ if (ids.indexOf(id) === -1) ids.push(id); });
    return ids;
  }
  function isMe(id){
    const real = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    return !!(real && real.id === id);
  }
  function initials(name){
    return String(name||'?').trim().split(/\s+/).slice(0,2).map(w=> w[0]).join('').toUpperCase();
  }
  // One query per table for everyone on the grid (last 90 days, the
  // longest chart range), so the cards can show BP and steps at a glance.
  let vitalsBatchKey = null;
  function prefetchVitals(ids){
    const missing = ids.filter(id=> !(id in vitalsCache));
    const key = missing.join(',');
    if (!missing.length || key === vitalsBatchKey) return;
    vitalsBatchKey = key;
    missing.forEach(id=> vitalsCache[id] = 'loading');
    const since = new Date(Date.now() - 90 * 86400000);
    Promise.all([
      bnbClient.from('blood_pressure_log').select('user_id,taken_at,systolic,diastolic,pulse').in('user_id', missing).gte('taken_at', since.toISOString()).order('taken_at'),
      bnbClient.from('step_log').select('user_id,date,steps').in('user_id', missing).gte('date', since.toISOString().slice(0,10)).order('date')
    ]).then(([bp, st])=>{
      if (bp.error) console.error('Supabase load blood_pressure_log failed:', bp.error);
      if (st.error) console.error('Supabase load step_log failed:', st.error);
      missing.forEach(id=>{
        vitalsCache[id] = (bp.error || st.error) ? null : {
          bp: (bp.data || []).filter(r=> r.user_id === id).map(r=> ({ t: new Date(r.taken_at).getTime(), sys: r.systolic, dia: r.diastolic, pulse: r.pulse })),
          steps: (st.data || []).filter(r=> r.user_id === id).map(r=> ({ date: r.date, steps: r.steps }))
        };
      });
      renderCoachDashboard();
    });
  }
  // One stat tile on a client card: big number, small label underneath.
  // Missing data shows a dash so every card keeps the same layout.
  function cpStatHtml(value, label, extra, cls){
    const has = value !== null && value !== undefined && value !== '';
    return '<span class="cp-stat"><span class="cp-stat-val' + (has && cls ? ' ' + cls : '') + '">' + (has ? value : '—') + '</span>'
      + '<span class="cp-stat-lbl">' + label + '</span>'
      + (has && extra ? '<span class="cp-stat-extra">' + extra + '</span>' : '') + '</span>';
  }
  function clientCardHtml(id){
    const name = isMe(id) ? (memberName(id) || trainerName(id)) : memberName(id);
    const isSelf = id === selfTrainerId;
    const pt = ptSessionsForTrainer(selfTrainerId);
    let sub;
    if (isSelf){
      sub = isMe(id) ? 'You' : 'Coach';
    } else {
      const sess = pt.filter(x=> x.p.userId === id).map(x=> x.sl.date).sort();
      const next = sess.find(d=> d >= TODAY), last = sess.filter(d=> d < TODAY).pop();
      sub = next ? 'Next 1-on-1 ' + fmtChartDate(next) : last ? 'Last 1-on-1 ' + daysSince(last) + 'd ago' : 'Assigned client';
    }

    // Weight and body fat from Assessments (newest first), with the change
    // since the previous weigh-in.
    const a = (window.BNB_USERS && window.BNB_USERS.getAssessments) ? window.BNB_USERS.getAssessments(id) : [];
    const num = (x, f)=> x[f] !== '' && x[f] != null && !isNaN(Number(x[f]));
    const weights = a.filter(x=> num(x, 'weight'));
    const bf = a.find(x=> num(x, 'bodyfat'));
    let weight = null, weightExtra = '';
    if (weights.length){
      weight = Number(weights[0].weight);
      if (weights.length > 1){
        const d = weight - Number(weights[1].weight);
        weightExtra = (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d).toFixed(1) + ' kg';
      }
    }

    // BP and steps from the batched vitals fetch (see prefetchVitals).
    const V = window.BNB_VITALS, data = vitalsCache[id];
    let bp = null, bpCls = '', steps = null;
    if (V && data && data !== 'loading'){
      const last = data.bp[data.bp.length - 1];
      if (last){ bp = last.sys + '/' + last.dia; bpCls = V.bpCategory(last.sys, last.dia).cls; }
      const weekStart = V.dayStart(TODAY) - 6 * 86400000;
      const wk = data.steps.filter(e=> V.dayStart(e.date) >= weekStart);
      if (wk.length) steps = V.fmtInt(wk.reduce((s,e)=> s + e.steps, 0) / wk.length);
    }

    const visits = (window.BNB_USERS && window.BNB_USERS.getWeeklyVisitCounts) ? window.BNB_USERS.getWeeklyVisitCounts(id, 1)[0] : null;
    // 1-on-1s in the last 30 days: with this client, or all of them on the
    // coach's own card.
    const ptMonth = pt.filter(x=> (isSelf || x.p.userId === id) && daysSince(x.sl.date) >= 0 && daysSince(x.sl.date) <= 30).length;

    return '<button type="button" class="cp-client' + (isSelf ? ' self' : '') + '" data-client="' + esc(id) + '">'
      + '<span class="cp-client-head"><span class="cp-avatar">' + esc(initials(name)) + '</span>'
      + '<span class="cp-client-text"><span class="cp-name">' + esc(name) + '</span><span class="cp-sub">' + esc(sub) + '</span></span>'
      + '<span class="cp-go">›</span></span>'
      + '<span class="cp-stats">'
      + cpStatHtml(weight, 'Weight kg', weightExtra)
      + cpStatHtml(bf ? Number(bf.bodyfat) : null, 'Body fat %')
      + cpStatHtml(bp, 'BP', '', bpCls)
      + cpStatHtml(steps, 'Steps/day · 7d')
      + cpStatHtml(visits, 'Visits · 7d')
      + cpStatHtml(ptMonth, '1-on-1s · 30d')
      + '</span></button>';
  }
  function clientGridHtml(){
    const ids = progressPeopleIds();
    prefetchVitals(ids);
    let html = '<div class="section-sub-head" style="margin-top:0;"><h3>Clients</h3><span class="field-hint">Tap someone to see all their charts</span></div>';
    html += '<div class="cp-grid-clients">' + ids.map(clientCardHtml).join('') + '</div>';
    if (ids.length < 2){
      html += '<div class="field-hint" style="margin:-6px 0 18px;">No active clients yet. They show up here once you have a confirmed 1-on-1 booking with someone or they pick you as their coach.</div>';
    }
    return html;
  }

  /* ---------------- CLIENT PAGE (all charts) ---------------- */
  function clientPageHtml(id){
    const name = memberName(id) || trainerName(id);
    const cards = [
      { title: 'Body Weight', body: assessmentBody(id, 'weight') },
      { title: 'Body Fat %', body: assessmentBody(id, 'bodyfat') },
      { title: 'Tape Body Fat %', body: tapeBodyFatBody(id) },
      { title: 'Blood Pressure', body: vitalsBody(id, 'bp') },
      { title: 'Steps', body: vitalsBody(id, 'steps') },
      { title: 'Exercise Load', body: exerciseBody(id) },
      { title: 'Attendance', body: attendanceBody(id) },
      { title: 'Today\'s Program', body: complianceBody(id) }
    ];
    // Charts with data in the main grid; the empty ones get a compact
    // row of their own underneath so they don't stretch beside a chart.
    const full = cards.filter(c=> c.body.state !== 'empty');
    const empty = cards.filter(c=> c.body.state === 'empty');

    let html = '<div class="cp-page-head">';
    html += '<button type="button" class="btn2" id="cp-back">← All clients</button>';
    html += '<span class="cp-avatar">' + esc(initials(name)) + '</span>';
    html += '<h3>' + esc(name) + (id === selfTrainerId && isMe(id) ? ' <span class="field-hint">(you)</span>' : '') + '</h3>';
    html += '<div class="unit-switch" id="progress-vitals-days" title="Range for Blood Pressure and Steps">';
    [30, 90].forEach(d=> html += '<button type="button" data-days="'+d+'" class="'+(progressVitalsDays===d?'active':'')+'">'+d+' days</button>');
    html += '</div></div>';
    if (full.length){
      html += '<div class="cp-chart-grid">';
      full.forEach(c=> html += '<div class="weight-chart-card cp-card"><h3>' + c.title + '</h3>' + c.body.html + '</div>');
      html += '</div>';
    }
    if (empty.length){
      html += '<div class="section-sub-head" style="margin-top:0;"><h3>No data yet</h3></div>';
      html += '<div class="cp-empty-grid">';
      empty.forEach(c=> html += '<div class="weight-chart-card cp-card empty"><h3>' + c.title + '</h3>' + c.body.html + '</div>');
      html += '</div>';
    }
    return html;
  }

  function wireClientProgressPanel(){
    document.querySelectorAll('#coach-dashboard-body .cp-client').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        progressClientId = btn.getAttribute('data-client');
        progressExercise = null;
        renderCoachDashboard();
        const body = document.getElementById('coach-dashboard-body');
        if (body) body.scrollIntoView({ block: 'start' });
      });
    });
    const back = document.getElementById('cp-back');
    if (back) back.addEventListener('click', ()=>{
      progressClientId = null;
      renderCoachDashboard();
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

    // A person's page replaces the dashboard until "All clients" is hit.
    const people = progressPeopleIds();
    if (progressClientId && people.indexOf(progressClientId) === -1) progressClientId = null;
    if (progressClientId) return clientPageHtml(progressClientId);

    let html = clientGridHtml();

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
        html += '<tr><td>'+fmtTime(row.time)+'</td><td>'+(row.type==='class'?'Class':'1-on-1')+'</td><td>'+esc(row.label)+'</td><td>'+esc(row.meta)+'</td><td>';
        html += row.type==='class' ? '<button class="btn2" data-action="dash-open-roster" data-id="'+row.sessionId+'">View Roster</button>' : '<span class="field-hint">—</span>';
        html += '</td></tr>';
      });
      html += '</table>';
    }

    if (noShows.length || stale.length || unpaid.length){
      html += '<div class="section-sub-head"><h3>Needs Attention</h3></div>';
      if (noShows.length){
        html += '<div class="admin-notice">' + noShows.length + ' no-show' + (noShows.length===1?'':'s') + ' in the last week: ' +
          noShows.map(x=> esc(memberName(x.userId)) + ' (' + fmtDate(x.date) + ', ' + esc(x.className) + ')').join(', ') + '</div>';
      }
      if (stale.length){
        html += '<div class="admin-notice">' + stale.length + ' client' + (stale.length===1?'':'s') + " haven't had a 1-on-1 with you in over two weeks: " +
          stale.map(x=> esc(memberName(x.userId)) + ' (' + x.days + 'd)').join(', ') + '</div>';
      }
      if (unpaid.length){
        const total = unpaid.reduce((sum,i)=> sum + i.amount, 0);
        html += '<div class="admin-notice">' + unpaid.length + ' unpaid invoice' + (unpaid.length===1?'':'s') + ' among your clients, totaling ' + BNB_CURRENCY.html(total) + ': ' +
          unpaid.map(i=> esc(memberName(i.userId)) + ' (' + BNB_CURRENCY.html(i.amount) + ', ' + esc(i.status) + ')').join(', ') + ' ' + BNB_CURRENCY.switchHtml('cur-switch-inline') + '</div>';
      }
    }

    return html;
  }

  function renderCoachDashboard(){
    const body = document.getElementById('coach-dashboard-body');
    if (!body) return;
    // Two chart columns when there's room, one on phones; card padding
    // and border are about 42px.
    const w = body.clientWidth;
    if (w){
      const cols = w >= 860 ? 2 : 1;
      chartW = Math.max(300, Math.round((w - 16 * (cols - 1)) / cols - 42));
    }
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
    html += subBtn('calendar', adminSubTab, 'Calendar');
    html += subBtn('classes', adminSubTab, 'Classes');
    html += subBtn('sessions', adminSubTab, 'Sessions');
    html += subBtn('pt', adminSubTab, '1-on-1 Oversight');
    html += subBtn('load', adminSubTab, 'Trainer Load');
    html += subBtn('ratings', adminSubTab, 'Coach Ratings');
    html += '</div>';
    if (adminSubTab === 'calendar') html += adminCalendarHtml();
    else if (adminSubTab === 'classes') html += adminClassesHtml();
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
      html += '<tr><td>' + esc(t.name) + '</td><td>' + classesWeek + '</td><td>' + ptWeek + '</td><td>' + (classesUpcoming + ptUpcoming) + '</td><td>' + clients + '</td></tr>';
    });
    html += '</table>';
    return html;
  }

  function adminClassesHtml(){
    let html = '<div class="crud-actions" style="padding:0 0 16px;"><button class="btn2 primary" id="sched-add-class-btn">+ Add Class</button></div>';
    if (!classes.length){ html += '<div class="empty-msg">No classes yet.</div>'; return html; }
    html += '<table class="admin-table"><tr><th>Name</th><th>Instructor</th><th>Capacity</th><th>Duration</th><th>Recurring</th><th>Status</th><th></th></tr>';
    classes.forEach(c=>{
      html += '<tr><td>'+esc(c.name)+'</td><td>'+esc(trainerName(c.instructorId))+'</td><td>'+c.capacity+'</td><td>'+c.duration+' min</td><td>'+(c.recurring ? esc(describeRecurring(c.recurring) || c.recurring) : '—')+'</td><td><span class="status-pill '+c.status+'">'+c.status+'</span></td><td><div class="row-actions"><button data-action="edit-class" data-id="'+c.id+'">Edit</button><button data-action="toggle-archive-class" data-id="'+c.id+'">'+(c.status==='active'?'Archive':'Reactivate')+'</button><button class="del" data-action="delete-class" data-id="'+c.id+'">Delete</button></div></td></tr>';
    });
    html += '</table>';
    return html;
  }

  function adminSessionsHtml(){
    let html = '<div class="form-inline">';
    html += '<div class="field"><label>Class</label><select id="sched-new-sess-class">';
    classes.filter(c=>c.status==='active').forEach(c=> html += '<option value="'+c.id+'">'+esc(c.name)+'</option>');
    html += '</select></div>';
    html += '<div class="field"><label>Date</label><input type="date" id="sched-new-sess-date" min="'+TODAY+'"></div>';
    html += '<div class="field"><label>Start time</label><input type="time" id="sched-new-sess-time"></div>';
    html += '<div class="field"><label>Instructor override</label><select id="sched-new-sess-instructor"><option value="">Use class default</option>';
    getSchedTrainers().forEach(t=> html += '<option value="'+t.id+'">'+esc(t.name)+'</option>');
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
        html += '<h5>'+esc(cls.name)+'</h5>';
        html += '<div class="sc-meta">'+esc(trainerName(s.instructorId))+' · '+confirmed+'/'+cap+' booked · '+wl+' waitlisted</div>';
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
      html += '<tr><td>'+esc(trainerName(sl.trainerId))+'</td><td>'+fmtDate(sl.date)+'</td><td>'+fmtTime(sl.startTime)+'</td><td>'+sl.duration+' min</td><td><span class="status-pill '+sl.status+'">'+sl.status+'</span>'+((ptWaitCounts[sl.id]||{}).waiting?'<div class="field-hint">'+ptWaitCounts[sl.id].waiting+' waiting</div>':'')+'</td><td>'+(pt?esc(memberName(pt.userId))+(pt.notes?'<div class="field-hint">“'+esc(pt.notes)+'”</div>':''):'—')+'</td><td><div class="row-actions">';
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
  async function memberBookSession(sessId){
    if (memberBookingForSession(sessId, selfMemberId)){ toast('Already booked into this session.'); return; }
    // Warn, don't block, same "trust the coach's judgment" pattern as the
    // zero-credits check on 1-on-1 booking below — an outstanding balance
    // shouldn't become a wall a member can't get past mid-booking, but
    // they (and staff, via the toast-free path if they override) should
    // still see it plainly.
    const me = window.BNB_USERS ? window.BNB_USERS.getById(selfMemberId) : null;
    if (me && Number(me.balance) > 0){
      if (!confirm('Your account has an outstanding balance of ' + BNB_CURRENCY.format(me.balance) + '. Book this session anyway?')) return;
    }
    // book_class() (sql/62) checks capacity on the server, so two people
    // can't both take the last spot.
    const { data: status, error } = await bnbClient.rpc('book_class', { p_session_id: sessId, p_member_id: selfMemberId });
    if (error){ toast(error.message || 'Could not book that class.'); afterBookingChange(); return; }
    toast(status === 'confirmed' ? 'Booked!' : 'Class full — you\'re on the waitlist. We\'ll book you in if a spot opens.');
    afterBookingChange();
  }
  async function memberCancelBooking(bookingId){
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    if (!confirm(b.status === 'waitlisted' ? 'Leave the waitlist for this class?' : 'Cancel your spot on this class?')) return;
    const { error } = await bnbClient.rpc('cancel_class_booking', { p_booking_id: bookingId });
    if (error){ toast(error.message || 'Could not cancel that booking.'); return; }
    toast(b.status === 'waitlisted' ? 'Removed from the waitlist.' : 'Booking cancelled.');
    afterBookingChange();
  }
  // Booking and cancelling go through book_pt_slot() / cancel_pt_booking()
  // (sql/42), which do the booking row, slot status, and credit change in
  // one server-side transaction — members can't write those directly. The
  // checks below are just for a quicker, friendlier message; the server
  // repeats every one of them.
  async function cancelPtBooking(ptId){
    const p = ptBookings.find(x=>x.id===ptId); if (!p) return;
    const { data: refunded, error } = await bnbClient.rpc('cancel_pt_booking', { p_booking_id: ptId });
    if (error){ toast(error.message || 'Could not cancel that session.'); return; }
    if (refunded && window.BNB_USERS){
      window.BNB_USERS.setCreditsFromServer(p.userId, window.BNB_USERS.getCredits(p.userId) + 1);
    }
    toast(refunded ? '1-on-1 session cancelled — credit refunded.' : '1-on-1 session cancelled. No refund within 24 hours of the session.');
    await Promise.all([refreshSlotsFromSupabase(), refreshPtBookingsFromSupabase(), refreshPtWaitlist()]);
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

  // Reads a class's Recurring text the same way the server does
  // (recurring_slots() in sql/62): comma-separated groups of days then a
  // time — "Mon/Wed/Fri 06:00", "Tue-Thu 5:30pm", "Weekdays 7am, Sat 9am".
  // Returns [{ dow: 1 (Mon)..7 (Sun), time: 'HH:MM' }].
  const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];
  function parseRecurring(text){
    const out = [], seen = {};
    String(text || '').toLowerCase().split(/\s*[,;]\s*/).forEach(grp=>{
      const m = grp.match(/(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?m?\.?\s*$/);
      if (!m) return;
      let hh = Number(m[1]); const mm = Number(m[2] || 0);
      if (m[3] === 'p' && hh < 12) hh += 12;
      if (m[3] === 'a' && hh === 12) hh = 0;
      if (hh > 23 || mm > 59) return;
      let dpart = grp.replace(/\d.*$/, '');
      const days = [];
      if (/(daily|every ?day)/.test(dpart)) days.push(1,2,3,4,5,6,7);
      if (/weekday/.test(dpart)) days.push(1,2,3,4,5);
      if (/weekend/.test(dpart)) days.push(6,7);
      const range = /(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(?:-|–|to)\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*/g;
      let r;
      while ((r = range.exec(dpart))){
        let i = DAY_KEYS.indexOf(r[1]) + 1; const b = DAY_KEYS.indexOf(r[2]) + 1;
        for (;;){ days.push(i); if (i === b) break; i = i % 7 + 1; }
      }
      dpart = dpart.replace(range, ' ');
      (dpart.match(/(mon|tue|wed|thu|fri|sat|sun)/g) || []).forEach(d=> days.push(DAY_KEYS.indexOf(d) + 1));
      const time = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
      days.forEach(d=>{ const k = d + ' ' + time; if (!seen[k]){ seen[k] = 1; out.push({ dow: d, time }); } });
    });
    return out.sort((a,b)=> a.time === b.time ? a.dow - b.dow : (a.time < b.time ? -1 : 1));
  }
  function describeRecurring(text){
    const slots = parseRecurring(text);
    if (!slots.length) return '';
    const names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const byTime = {};
    slots.forEach(s=> (byTime[s.time] = byTime[s.time] || []).push(s.dow));
    return Object.keys(byTime).map(t=> byTime[t].sort().map(d=>names[d-1]).join(', ') + ' at ' + fmtTime(t)).join('; ');
  }
  function renderRecurringPreview(){
    const input = document.getElementById('sched-class-recurring');
    const el = document.getElementById('sched-class-recurring-preview');
    if (!input || !el) return;
    const text = input.value.trim();
    const desc = describeRecurring(text);
    el.classList.toggle('bad', !!text && !desc);
    el.textContent = !text ? 'Leave blank for one-off sessions you add by hand.'
      : desc ? 'Runs ' + desc + '. Sessions are added 3 weeks ahead automatically.'
      : 'Couldn\'t read that — try e.g. "Mon/Wed/Fri 06:00" or "Tue-Thu 5:30pm".';
  }

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
    saveClasses().then(ensureRecurringSessions);
    closeClassPanel();
    toast(parseRecurring(data.recurring).length && data.status === 'active' ? 'Class saved — its sessions for the next 3 weeks are being added.' : 'Class saved.');
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
    renderRecurringPreview();
    document.getElementById('sched-class-description').value = c ? c.description : '';
    document.getElementById('sched-class-panel-backdrop').classList.add('show');
  }
  function closeClassPanel(){ document.getElementById('sched-class-panel-backdrop').classList.remove('show'); editingClassId = null; }
  function toggleArchiveClass(id){ const c = getClass(id); if (c){ c.status = c.status==='active' ? 'archived' : 'active'; saveClasses().then(ensureRecurringSessions); renderBody(); } }
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
    bookings.filter(b=>b.sessionId===id && (b.status==='confirmed' || b.status==='waitlisted')).forEach(b=> b.status='cancelled');
    // Session first: everyone booked is notified as each booking is
    // cancelled, and the message reads right once the class is cancelled.
    saveSessions().then(()=> saveBookings()).then(afterBookingChange);
    toast('Session cancelled — everyone booked has been notified.');
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
      '<li><span>'+esc(memberName(b.userId))+'</span><div class="row-actions"><button data-action="mark-noshow" data-id="'+b.id+'">No-show</button><button class="del" data-action="roster-remove" data-id="'+b.id+'">Remove</button></div></li>'
    ).join('') : '<li class="empty-row">No confirmed bookings.</li>';
    wEl.innerHTML = waitlist.length ? waitlist.map(b=>
      '<li><span>'+esc(memberName(b.userId))+'</span><div class="row-actions"><button data-action="promote-booking" data-id="'+b.id+'">Promote</button><button class="del" data-action="roster-remove" data-id="'+b.id+'">Remove</button></div></li>'
    ).join('') : '<li class="empty-row">No one waitlisted.</li>';
  }
  function promoteBooking(bookingId){
    const s = getSession(activeRosterSessionId); if (!s) return;
    const cap = sessionCapacity(s);
    if (sessionConfirmedCount(activeRosterSessionId) >= cap){ toast('Session is at capacity — cancel or remove a confirmed booking first.'); return; }
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    b.status = 'confirmed';
    saveBookings().then(afterBookingChange);
    toast('Promoted from waitlist.');
    renderRosterLists();
    renderBody();
  }
  function markNoShow(bookingId){
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    b.status = 'no-show';
    saveBookings().then(afterBookingChange);
    renderRosterLists();
    renderBody();
  }
  // Through cancel_class_booking() so a freed spot goes to the waitlist.
  async function rosterRemove(bookingId){
    const b = bookings.find(x=>x.id===bookingId); if (!b) return;
    const { data: moved, error } = await bnbClient.rpc('cancel_class_booking', { p_booking_id: bookingId });
    if (error){ toast(error.message || 'Could not remove that booking.'); return; }
    toast(moved ? 'Removed — the next person on the waitlist is now booked in.' : 'Removed.');
    afterBookingChange();
  }

  /* ---------------- WIRE UP ---------------- */
  function wireBody(body, view){
    if (!body) return;

    body.querySelectorAll('[data-subtab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const v = btn.getAttribute('data-subtab');
        if (view === 'member'){ memberSubTab = v; memberMoveFrom = null; }
        else adminSubTab = v;
        renderBody();
      });
    });

    const chipWrap = body.querySelector('#sched-class-chips');
    if (chipWrap) chipWrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{ classFilter = btn.getAttribute('data-filter'); renderBody(); });
    });

    wireCalNav(body, renderBody);
    if (view === 'admin') wireCalDrag(body);
    else wireMemberCalDrag(body);
    const calTrainer = body.querySelector('#sched-admin-cal-trainer');
    if (calTrainer) calTrainer.addEventListener('change', ()=>{ adminCalTrainer = calTrainer.value; renderBody(); });
    body.querySelectorAll('[data-cal-addsession]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const [day, t] = btn.getAttribute('data-cal-addsession').split('T');
        adminSubTab = 'sessions';
        renderBody();
        const date = document.getElementById('sched-new-sess-date');
        if (date){ date.value = day; date.scrollIntoView({ block:'center' }); }
        const time = document.getElementById('sched-new-sess-time');
        if (time && t) time.value = t;
        const cls = document.getElementById('sched-new-sess-class'); if (cls) cls.focus();
      });
    });

    body.querySelectorAll('[data-pick-coach]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ memberTrainerId = btn.getAttribute('data-pick-coach'); renderBody(); });
    });
    body.querySelectorAll('[data-slot-day]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ slotDayFilter = btn.getAttribute('data-slot-day'); renderBody(); });
    });
    body.querySelectorAll('[data-slot-part]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ slotPartFilter = btn.getAttribute('data-slot-part'); renderBody(); });
    });
    body.querySelectorAll('[data-request-time]').forEach(btn=>{
      btn.addEventListener('click', ()=> openRequestPanel(btn.getAttribute('data-request-time')));
    });

    body.querySelectorAll('[data-action]').forEach(btn=>{
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      btn.addEventListener('click', ()=>{
        if (action === 'member-book-session') memberBookSession(id);
        else if (action === 'member-cancel-booking') memberCancelBooking(id);
        else if (action === 'member-book-slot') memberBookSlot(id);
        else if (action === 'member-cancel-pt') memberCancelPt(id);
        else if (action === 'edit-pt-note') openNoteEditor(id);
        else if (action === 'member-join-ptwait') openWaitPanel(id);
        else if (action === 'member-leave-ptwait') leavePtWaitlist(id);
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
  document.getElementById('sched-class-recurring').addEventListener('input', renderRecurringPreview);
  document.getElementById('sched-class-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='sched-class-panel-backdrop') closeClassPanel(); });

  document.getElementById('sched-ptbook-cancel').addEventListener('click', closeBookPanel);
  document.getElementById('sched-ptbook-save').addEventListener('click', confirmBookPanel);
  document.getElementById('sched-ptbook-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='sched-ptbook-panel-backdrop') closeBookPanel(); });
  document.getElementById('sched-ptreq-cancel').addEventListener('click', closeRequestPanel);
  document.getElementById('sched-ptreq-send').addEventListener('click', sendRequest);
  document.getElementById('sched-ptreq-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='sched-ptreq-panel-backdrop') closeRequestPanel(); });
  document.getElementById('sched-move-cancel').addEventListener('click', closeMoveDialog);
  document.getElementById('sched-move-save').addEventListener('click', confirmMove);
  document.getElementById('sched-move-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='sched-move-panel-backdrop') closeMoveDialog(); });
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
  window.schedOnTabShown = function(){ renderIdentityRow(); renderCoachIdentityRow(); renderBody(); refreshCoachRatings(); ensureRecurringSessions(); refreshSessionCounts(); refreshCoachProfiles(); refreshPtWaitlist(); };
  // A booking notification arrived (shell.js) — pull the latest.
  window.schedRefreshBookings = function(){ refreshSlotsFromSupabase(); refreshPtBookingsFromSupabase(); afterBookingChange(); };
  // Booking/Roster data refreshes on its own whenever a schedule action fires,
  // but Billing invoice changes (e.g. marking one paid) don't call back into
  // this module — so the Dashboard's "unpaid invoices" line can go stale
  // otherwise. Re-render just the dashboard piece whenever the COACH tab
  // itself is opened, which is cheap and catches that case.
  // Chart widths follow the card width, so redraw a person's page when
  // the window changes size enough to matter.
  let lastDashWidth = 0, dashResizeTimer = null;
  window.addEventListener('resize', ()=>{
    clearTimeout(dashResizeTimer);
    dashResizeTimer = setTimeout(()=>{
      const body = document.getElementById('coach-dashboard-body');
      if (!body || !progressClientId || !body.clientWidth) return;
      if (Math.abs(body.clientWidth - lastDashWidth) < 40) return;
      lastDashWidth = body.clientWidth;
      renderCoachDashboard();
    }, 200);
  });
  window.coachOnTabShown = function(){ renderCoachIdentityRow(); renderCoachDashboard(); refreshCoachRatings(); ensureRecurringSessions(); refreshCoachProfiles(); refreshPtWaitlist(); };

})();
