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
  let selfTrainerId = (function(){ try { return localStorage.getItem('bnb-sched-self-trainer') || (getSchedTrainers()[0]||{}).id; } catch(e){ return (getSchedTrainers()[0]||{}).id; } })();
  let memberSubTab = 'browse';
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
  let progressMarker = 'assessment'; // 'assessment' | 'exercise' | 'attendance'
  let progressAssessmentField = 'weight'; // 'weight' | 'bodyfat'
  let progressExercise = null;

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
    html += '</div>';
    if (memberSubTab === 'browse') html += memberBrowseHtml();
    else if (memberSubTab === 'trainer') html += memberBookTrainerHtml();
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
    let html = '<div class="form-inline"><div class="field"><label>Trainer</label><select id="sched-mbt-trainer">';
    getSchedTrainers().forEach(t=> html += '<option value="'+t.id+'">'+t.name+'</option>');
    html += '</select></div></div>';
    const trainerId = document.getElementById('sched-mbt-trainer') ? document.getElementById('sched-mbt-trainer').value : (getSchedTrainers()[0]||{}).id;
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
    html += '</div>';
    if (trainerSubTab === 'roster') html += trainerRosterHtml();
    else if (trainerSubTab === 'classes') html += trainerClassesHtml();
    else html += trainerSlotsHtml();
    return html;
  }

  function trainerRosterHtml(){
    // Roster = distinct members with at least one confirmed 1-on-1 booking with
    // this trainer (bnb-sched-ptbookings-v1), each resolved against their slot
    // for date/time. Paired with a quick load summary (upcoming 1-on-1s + upcoming
    // class sessions) so a trainer can see "who's mine" and "how full is my week"
    // in one place, instead of digging through the raw slot list.
    const mine = ptSessionsForTrainer(selfTrainerId);
    const clientMap = {};
    mine.forEach(x=>{
      (clientMap[x.p.userId] = clientMap[x.p.userId] || []).push(x);
    });
    const clientIds = Object.keys(clientMap);
    const upcomingPt = mine.filter(x=> x.sl.date >= TODAY).length;
    const upcomingClasses = sessions.filter(s=>s.instructorId===selfTrainerId && s.status==='scheduled' && s.date >= TODAY).length;

    let html = '<div class="field-hint" style="margin-bottom:14px;">' +
      clientIds.length + ' active client' + (clientIds.length===1?'':'s') + ' · ' +
      upcomingPt + ' upcoming 1-on-1 session' + (upcomingPt===1?'':'s') + ' · ' +
      upcomingClasses + ' upcoming class session' + (upcomingClasses===1?'':'s') + '</div>';

    if (!clientIds.length) return html + '<div class="empty-msg">No 1-on-1 clients yet — booked sessions will show up here.</div>';

    const rows = clientIds.map(uid=>{
      const entries = clientMap[uid].slice().sort((a,b)=> (a.sl.date+a.sl.startTime) < (b.sl.date+b.sl.startTime) ? -1 : 1);
      const upcoming = entries.filter(x=> x.sl.date >= TODAY);
      const past = entries.filter(x=> x.sl.date < TODAY);
      return { uid, total: entries.length, next: upcoming[0] || null, last: past.length ? past[past.length-1] : null };
    }).sort((a,b)=>{
      if (a.next && b.next) return (a.next.sl.date+a.next.sl.startTime) < (b.next.sl.date+b.next.sl.startTime) ? -1 : 1;
      if (a.next) return -1;
      if (b.next) return 1;
      return memberName(a.uid) < memberName(b.uid) ? -1 : 1;
    });

    html += '<table class="admin-table"><tr><th>Client</th><th>Next Session</th><th>Last Session</th><th>Total Sessions</th></tr>';
    rows.forEach(r=>{
      html += '<tr><td>'+memberName(r.uid)+'</td>' +
        '<td>'+(r.next ? fmtDate(r.next.sl.date)+' '+fmtTime(r.next.sl.startTime) : '—')+'</td>' +
        '<td>'+(r.last ? fmtDate(r.last.sl.date) : '—')+'</td>' +
        '<td>'+r.total+'</td></tr>';
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
  function activeClientIdsForTrainer(trainerId){
    const seen = {};
    ptSessionsForTrainer(trainerId).forEach(x=> seen[x.p.userId] = true);
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
    const W=900,H=340,padL=54,padR=24,padT=20,padB=40;
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
    const W=900,H=340,padL=54,padR=24,padT=20,padB=40;
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
    return '';
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
    html += '</div>';

    if (progressMarker === 'assessment'){
      html += '<div class="unit-switch" id="progress-assessment-toggle" style="margin-top:2px;">';
      html += '<button type="button" data-field="weight" class="'+(progressAssessmentField==='weight'?'active':'')+'">Weight</button>';
      html += '<button type="button" data-field="bodyfat" class="'+(progressAssessmentField==='bodyfat'?'active':'')+'">Body Fat %</button>';
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
    html += '</div>';
    if (adminSubTab === 'classes') html += adminClassesHtml();
    else if (adminSubTab === 'sessions') html += adminSessionsHtml();
    else if (adminSubTab === 'pt') html += adminPtHtml();
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

    // Warn, don't block, on zero credits — same "trust the coach's judgment"
    // pattern the rest of this app uses (nothing else here hard-enforces
    // money or inventory either). A comped session or a sync issue shouldn't
    // become a wall you have to fight through mid-booking.
    const credits = window.BNB_USERS ? window.BNB_USERS.getCredits(selfMemberId) : 0;
    if (credits <= 0){
      if (!confirm('You have 0 session credits. Book this session anyway?')) return;
    }

    sl.status = 'booked';
    saveSlots();
    ptBookings.push({ id: uid('pt'), slotId, trainerId: sl.trainerId, userId: selfMemberId, status:'confirmed', bookedAt: new Date().toISOString(), notes:'' });
    savePtBookings();

    if (credits > 0 && window.BNB_USERS){
      window.BNB_USERS.deductCredit(selfMemberId);
      const left = credits - 1;
      toast('1-on-1 session booked! ' + left + ' credit' + (left===1?'':'s') + ' remaining.');
    } else {
      toast('1-on-1 session booked!');
    }
    renderIdentityRow();
    renderBody();
  }
  function memberCancelPt(ptId){
    const p = ptBookings.find(x=>x.id===ptId); if (!p) return;
    p.status = 'cancelled';
    savePtBookings();
    const sl = slots.find(x=>x.id===p.slotId);
    if (sl) { sl.status = 'open'; saveSlots(); }
    toast('1-on-1 session cancelled.');
    renderBody();
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
  function cancelPtTrainer(ptId){
    const p = ptBookings.find(x=>x.id===ptId); if (!p) return;
    p.status = 'cancelled'; savePtBookings();
    const sl = slots.find(x=>x.id===p.slotId);
    if (sl){ sl.status='open'; saveSlots(); }
    toast('1-on-1 session cancelled.');
    renderBody();
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
    if (mbtSel) mbtSel.addEventListener('change', renderBody);

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

  window.schedOnTabShown = function(){ renderIdentityRow(); renderCoachIdentityRow(); renderBody(); };
  // Booking/Roster data refreshes on its own whenever a schedule action fires,
  // but Billing invoice changes (e.g. marking one paid) don't call back into
  // this module — so the Dashboard's "unpaid invoices" line can go stale
  // otherwise. Re-render just the dashboard piece whenever the COACH tab
  // itself is opened, which is cheap and catches that case.
  window.coachOnTabShown = function(){ renderCoachIdentityRow(); renderCoachDashboard(); };

})();
