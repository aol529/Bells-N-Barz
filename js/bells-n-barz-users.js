(function(){

  const STORE_KEY = 'bnb-users-v1';
  const CHECKIN_STORE_KEY = 'bnb-checkins-v1';
  const ASSESSMENT_STORE_KEY = 'bnb-assessments-v1';
  const SELF_KEY = 'bnb-current-user-id';

  /* ---- Session cookie: keeps a logged-in member signed in for 30 minutes
     of inactivity, independent of Supabase's own (indefinitely-refreshing)
     auth token. The cookie marks "when does this session expire" — the
     real Supabase session is still what restoreSession() checks, but it's
     ignored/torn down once this cookie is gone or stale. Any tracked user
     activity pushes the expiry back out another 30 minutes (see
     wireActivityTracking below), so it's a rolling window, not a fixed
     one-and-done hour from login.

     "Keep me signed in" (the login form checkbox) swaps that 30-minute
     window for a 14-day one instead — same rolling-window cookie
     mechanism, just a far longer lifetime, remembered via REMEMBER_KEY in
     localStorage so it survives a browser restart. It's a per-login
     opt-in, not a permanent setting: performLogout() clears it, so the
     next login defaults back to the short 30-minute window unless the
     box is checked again. ---- */
  const SESSION_COOKIE = 'bnb-session-exp';
  const SESSION_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes since last activity
  const REMEMBER_KEY = 'bnb-remember-me';
  const REMEMBER_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000; // 14 days, when "Keep me signed in" is checked
  const ACTIVITY_THROTTLE_MS = 60 * 1000; // don't rewrite the cookie more than once/minute
  let sessionExpiryTimer = null;
  let lastActivityRefresh = 0;

  function isRememberMe(){
    try { return localStorage.getItem(REMEMBER_KEY) === '1'; } catch(e){ return false; }
  }
  function setRememberMe(on){
    try {
      if (on) localStorage.setItem(REMEMBER_KEY, '1');
      else localStorage.removeItem(REMEMBER_KEY);
    } catch(e){}
  }
  function currentSessionLifetimeMs(){
    return isRememberMe() ? REMEMBER_LIFETIME_MS : SESSION_LIFETIME_MS;
  }

  function setCookie(name, value, maxAgeSeconds){
    try {
      document.cookie = name + '=' + encodeURIComponent(value) +
        '; max-age=' + maxAgeSeconds + '; path=/; SameSite=Lax';
    } catch(e){}
  }
  function getCookie(name){
    try {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch(e){ return null; }
  }
  function clearCookie(name){
    try { document.cookie = name + '=; max-age=0; path=/; SameSite=Lax'; } catch(e){}
  }

  // Starts (or restarts) the 30-minute session clock: stamps a fresh
  // expiry cookie and arms a timer to force a logout if there's no
  // further activity before it lapses. Call this on every successful
  // sign-in, and again on each throttled activity tick while signed in.
  function startSessionClock(){
    const lifetimeMs = currentSessionLifetimeMs();
    const expiresAt = Date.now() + lifetimeMs;
    setCookie(SESSION_COOKIE, String(expiresAt), lifetimeMs / 1000);
    armSessionExpiryTimer(lifetimeMs);
  }
  function armSessionExpiryTimer(ms){
    if (sessionExpiryTimer) clearTimeout(sessionExpiryTimer);
    sessionExpiryTimer = setTimeout(expireSessionNow, Math.min(ms, 2147483647));
  }
  // True if there's a still-valid (unexpired) session cookie.
  function hasValidSessionCookie(){
    const raw = getCookie(SESSION_COOKIE);
    if (!raw) return false;
    const expiresAt = Number(raw);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }
  async function expireSessionNow(){
    clearCookie(SESSION_COOKIE);
    if (sessionExpiryTimer) { clearTimeout(sessionExpiryTimer); sessionExpiryTimer = null; }
    const wasSignedIn = !!selfId;
    try { await bnbClient.auth.signOut(); } catch(e){}
    selfId = null;
    saveSelfId('');
    if (wasSignedIn){
      showToast('You were logged out after 30 minutes of inactivity — please log in again.');
      const loginBtn = document.querySelector('#usr-mode-switch button[data-mode="login"]');
      if (loginBtn) loginBtn.click();
    }
  }

  // Any real interaction while signed in pushes the 30-minute window back
  // out. Throttled to at most one cookie/timer rewrite per minute so a
  // held-down scroll or a busy click session doesn't hammer document.cookie.
  function wireActivityTracking(){
    const onActivity = function(){
      if (!selfId) return; // no one signed in — nothing to keep alive
      if (!hasValidSessionCookie()) return; // already expired/logged out
      const now = Date.now();
      if (now - lastActivityRefresh < ACTIVITY_THROTTLE_MS) return;
      lastActivityRefresh = now;
      startSessionClock();
    };
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(function(evt){
      document.addEventListener(evt, onActivity, { passive: true, capture: true });
    });
  }
  wireActivityTracking();
  // Computed from the local system clock (not toISOString(), which can
  // shift a day depending on timezone) so "today" is genuinely today,
  // not a frozen demo-data date.
  const TODAY = (function(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })();

  const SEED_CHECKINS = [
    { userId:'u1', date:'2026-08-24' }, { userId:'u1', date:'2026-08-23' }, { userId:'u1', date:'2026-08-22' },
    { userId:'u1', date:'2026-08-21' }, { userId:'u1', date:'2026-08-20' }, { userId:'u1', date:'2026-08-17' },
    { userId:'u1', date:'2026-08-15' }, { userId:'u1', date:'2026-07-30' }, { userId:'u1', date:'2026-07-28' },
    { userId:'u2', date:'2026-08-25' }, { userId:'u2', date:'2026-08-24' }, { userId:'u2', date:'2026-08-23' },
    { userId:'u2', date:'2026-08-22' }, { userId:'u2', date:'2026-08-21' }, { userId:'u2', date:'2026-08-20' },
    { userId:'u3', date:'2026-08-15' }, { userId:'u3', date:'2026-08-08' }, { userId:'u3', date:'2026-08-01' },
    { userId:'u4', date:'2026-07-28' }, { userId:'u4', date:'2026-07-25' }
  ];

  const SEED_ASSESSMENTS = [
    { id:'a1', userId:'u1', date:'2026-02-10', type:'Initial Assessment', conductor:'Coach KA',
      parqCardio:false, parqJoint:false, parqClearance:false,
      medical:'No significant history. Reports occasional mild lower back tightness after long desk days.',
      weight:71, bodyfat:24, restingHr:74, bp:'118/78', movement:'Slight anterior pelvic tilt, tight hip flexors.',
      goals:'Lose ~5kg and build general strength over 4 months. First time training consistently.',
      history:'No structured training background — some casual jogging.',
      occActivity:'sedentary', sleep:6, stress:'moderate',
      nutrition:'Skips breakfast most days, eats out for lunch, moderate water intake.',
      availability:'Weekday evenings, 3x/week', waiver:true },
    { id:'a2', userId:'u1', date:'2026-05-12', type:'Reassessment', conductor:'Coach KA',
      parqCardio:false, parqJoint:false, parqClearance:false,
      medical:'Lower back tightness much improved with consistent training.',
      weight:68.5, bodyfat:21, restingHr:68, bp:'116/76', movement:'Pelvic tilt improved, still monitoring hip flexor tightness.',
      goals:'On track — shift focus toward strength progression on deadlift and press.',
      history:'3 months of consistent 3x/week training.',
      occActivity:'sedentary', sleep:6.5, stress:'moderate',
      nutrition:'Now eating a consistent breakfast, tracking meals loosely.',
      availability:'Weekday evenings, 3x/week', waiver:true }
  ];

  const SEED_USERS = [
    { id:'u1', fullName:'Achol Deng', email:'achol.deng@example.com', roles:['member'], status:'active',
      password:'••••••••', avatar:'https://i.pravatar.cc/150?img=47', createdAt:'2026-02-10', lastLogin:'2026-08-24',
      dob:'1996-04-12', phone:'+254712345601', address:'Kilimani, Nairobi',
      height:172, weight:68, experience:'intermediate',
      goals:'Fat loss, general conditioning, improve deadlift form.',
      injury:'Mild lower back sensitivity — avoid heavy axial loading without a belt.',
      ecName:'Nyandeng Deng', ecPhone:'+254712345699', prefTime:'Weekday evenings', trainer:'Coach KA',
      plan:'Monthly Unlimited', mstatus:'active', contractEnd:'2027-02-10', balance:0, comp:'', lastCheckin:'2026-08-24', autoRenew:true,
      flag:'green', leadSource:'Instagram Ads', internalNotes:'Prefers evening sessions, responds well to progressive overload cues.' },
    { id:'u2', fullName:'Coach KA', email:'ka.coach@example.com', roles:['trainer','member'], status:'active',
      password:'••••••••', avatar:'https://i.pravatar.cc/150?img=12', createdAt:'2025-11-02', lastLogin:'2026-08-25',
      dob:'1990-01-22', phone:'+254712345602', address:'Lavington, Nairobi',
      height:180, weight:82, experience:'advanced',
      goals:'', injury:'', ecName:'', ecPhone:'', prefTime:'', trainer:'',
      plan:'Staff', mstatus:'active', contractEnd:'', balance:0, comp:'staff', lastCheckin:'2026-08-25', autoRenew:false,
      flag:'green', leadSource:'Hired', internalNotes:'Certified strength coach, leads Saturday group sessions. Also trains as a member himself.' },
    { id:'u3', fullName:'J. Malith', email:'j.malith@example.com', roles:['member'], status:'active',
      password:'••••••••', avatar:'https://i.pravatar.cc/150?img=33', createdAt:'2026-05-18', lastLogin:'2026-08-20',
      dob:'1999-09-03', phone:'+254712345603', address:'South B, Nairobi',
      height:178, weight:75, experience:'beginner',
      goals:'Build general strength, 12-week transformation plan.', injury:'',
      ecName:'Bol Malith', ecPhone:'+254712345698', prefTime:'Saturday mornings', trainer:'Coach KA',
      plan:'Monthly Unlimited', mstatus:'overdue', contractEnd:'2026-11-18', balance:45, comp:'', lastCheckin:'2026-08-15', autoRenew:true,
      flag:'yellow', leadSource:'Referral', internalNotes:'Payment failed twice this month — follow up before next session.' },
    { id:'u4', fullName:'R. Aketch', email:'r.aketch@example.com', roles:['member'], status:'suspended',
      password:'••••••••', avatar:'https://i.pravatar.cc/150?img=25', createdAt:'2026-01-05', lastLogin:'2026-07-30',
      dob:'1993-06-30', phone:'+254712345604', address:'Ngara, Nairobi',
      height:165, weight:60, experience:'intermediate',
      goals:'', injury:'', ecName:'', ecPhone:'', prefTime:'', trainer:'',
      plan:'Monthly Unlimited', mstatus:'cancelled', contractEnd:'2026-07-05', balance:120, comp:'', lastCheckin:'2026-07-28', autoRenew:false,
      flag:'red', leadSource:'Walk-in', internalNotes:'Suspended pending dispute over damaged equipment — do not re-admit without manager sign-off.' },
    { id:'t2', fullName:'Coach Bravo', email:'bravo.coach@example.com', roles:['trainer'], status:'active',
      password:'••••••••', avatar:'https://i.pravatar.cc/150?img=59', createdAt:'2026-03-01', lastLogin:'2026-08-23',
      dob:'1988-07-14', phone:'+254712345605', address:'Westlands, Nairobi',
      height:176, weight:78, experience:'advanced',
      goals:'', injury:'', ecName:'', ecPhone:'', prefTime:'', trainer:'',
      plan:'Staff', mstatus:'active', contractEnd:'', balance:0, comp:'staff', lastCheckin:'2026-08-23', autoRenew:false,
      flag:'green', leadSource:'Hired', internalNotes:'Leads Strength Foundations, barbell specialist.' },
    { id:'u5', fullName:'N. Otieno', email:'n.otieno@example.com', roles:['member'], status:'active',
      password:'••••••••', avatar:'https://i.pravatar.cc/150?img=68', createdAt:'2026-04-22', lastLogin:'2026-08-19',
      dob:'1997-11-05', phone:'+254712345606', address:'Kileleshwa, Nairobi',
      height:170, weight:64, experience:'beginner',
      goals:'General fitness, weight training basics.', injury:'',
      ecName:'', ecPhone:'', prefTime:'Weekend mornings', trainer:'Coach Bravo',
      plan:'Monthly Unlimited', mstatus:'active', contractEnd:'2027-04-22', balance:0, comp:'', lastCheckin:'2026-08-19', autoRenew:true,
      flag:'green', leadSource:'Walk-in', internalNotes:'' }
  ];

  // ---- Supabase field mapping (JS camelCase <-> Postgres snake_case) ----
  function userToRow(u){
    return {
      id: (u.id && u.id.length === 36) ? u.id : undefined, // only pass real UUIDs; let Supabase generate new ones
      auth_id: u.authId || null,
      full_name: u.fullName, email: u.email, roles: u.roles, status: u.status,
      avatar: u.avatar, dob: u.dob || null, phone: u.phone, address: u.address,
      height: u.height || null, weight: u.weight || null, experience: u.experience,
      goals: u.goals, injury: u.injury, ec_name: u.ecName, ec_phone: u.ecPhone,
      pref_time: u.prefTime, trainer: u.trainer, trainer_id: u.trainerId || null, plan: u.plan, mstatus: u.mstatus,
      contract_end: u.contractEnd || null, balance: u.balance || 0, comp: u.comp,
      last_checkin: u.lastCheckin || null, auto_renew: !!u.autoRenew, flag: u.flag,
      lead_source: u.leadSource, internal_notes: u.internalNotes, credits: u.credits || 0
    };
  }
  function rowToUser(r){
    return {
      id: r.id, authId: r.auth_id, fullName: r.full_name, email: r.email, roles: r.roles, status: r.status,
      avatar: r.avatar, createdAt: (r.created_at||'').slice(0,10), lastLogin: r.last_login||'',
      dob: r.dob||'', phone: r.phone||'', address: r.address||'',
      height: r.height, weight: r.weight, experience: r.experience,
      goals: r.goals, injury: r.injury, ecName: r.ec_name, ecPhone: r.ec_phone,
      prefTime: r.pref_time, trainer: r.trainer, trainerId: r.trainer_id || '', plan: r.plan, mstatus: r.mstatus,
      contractEnd: r.contract_end||'', balance: r.balance||0, comp: r.comp,
      lastCheckin: r.last_checkin||'', autoRenew: r.auto_renew, flag: r.flag,
      leadSource: r.lead_source, internalNotes: r.internal_notes, credits: r.credits||0
    };
  }

  function loadUsers(){
    // Instant first paint using seed data; real data replaces it moments
    // later once Supabase responds (see refreshUsersFromSupabase below).
    // Mirrors the hybrid auto-load + freeform pattern used in Live Session.
    return SEED_USERS.slice();
  }

  async function refreshUsersFromSupabase(){
    const { data, error } = await bnbClient.from('users').select('*');
    if (error) { console.error('Supabase load users failed:', error); return; }
    if (data && data.length) {
      users = data.map(rowToUser);
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }

  /* ---- Points (sql/40) — the ledger IS the balance, so reading it is
     just summing delta. Earning (check-in, streak bonus) and redeeming
     both happen server-side; the client only ever reads the ledger and
     calls redeem_points_for_credit(), never writes a balance directly. ---- */
  async function fetchPointsLedger(userId){
    const { data, error } = await bnbClient.from('points_ledger')
      .select('delta, reason, created_at').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Supabase load points_ledger failed:', error); return []; }
    return data || [];
  }
  async function redeemPointsForCredit(){
    const { data, error } = await bnbClient.rpc('redeem_points_for_credit');
    if (error) throw error;
    return data; // new balance
  }
  async function adjustPointsAsStaff(userId, delta, reason){
    const { error } = await bnbClient.rpc('admin_adjust_points', { p_user_id: userId, p_delta: delta, p_reason: reason });
    if (error) throw error;
  }

  // A plain member's RLS read access is "own row only" (see gym.sql), so
  // the `users` array above never contains anyone else — including
  // trainers — for a member session. This directory (sql/39) fills that
  // gap with just enough to pick a coach: id/name/photo/active-status,
  // via a SECURITY DEFINER function rather than opening up direct table
  // access to trainer rows. getTrainers() below merges it in.
  let coachesDirectory = [];
  async function refreshCoachesDirectory(){
    const { data, error } = await bnbClient.rpc('available_coaches');
    if (error) { console.error('Supabase load available_coaches failed:', error); return; }
    if (data) coachesDirectory = data.map(r => ({ id: r.id, fullName: r.full_name, avatar: r.avatar, status: r.status, roles: ['trainer'] }));
  }
  refreshCoachesDirectory();

  function saveUsers(){
    // Upsert rows ONE AT A TIME, not as a single batch. Under Row Level
    // Security, a batch upsert containing even one row the current session
    // isn't allowed to write (e.g. someone else's profile, or a seed row
    // with no real linked account yet) fails the ENTIRE batch — that's
    // normal Postgres transaction behavior, not an RLS bug. Per-row upserts
    // mean a blocked row for someone else's data doesn't stop your own
    // legitimate save from going through.
    //
    // Records without a real UUID id yet (unmigrated seed data — 'u1',
    // 't2', etc.) are skipped from the Supabase write entirely here: since
    // userToRow() omits `id` for non-UUID ids, Postgres has nothing to
    // match on and would INSERT a fresh duplicate row every single save
    // instead of updating the existing one. Run the seed migration tool
    // (window.BNB_MIGRATE.runAll()) to give these real ids — until then,
    // their changes stay local-only rather than silently piling up
    // duplicate rows in the database.
    (async () => {
      const realRows = users.filter(u => u.id && u.id.length === 36);
      const skippedCount = users.length - realRows.length;
      if (skippedCount > 0){
        console.warn('saveUsers: skipping ' + skippedCount + ' unmigrated seed user(s) — run window.BNB_MIGRATE.runAll() to fix.');
      }
      const rows = realRows.map(userToRow);
      const results = await Promise.allSettled(
        rows.map(row => bnbClient.from('users').upsert([row]))
      );
      let successCount = 0;
      results.forEach((r, i) => {
        const failed = r.status === 'rejected' || (r.value && r.value.error);
        if (!failed) { successCount++; return; }
        const err = r.status === 'rejected' ? r.reason : r.value.error;
        // Expected/noisy for rows this session has no permission to touch
        // (e.g. other members' seed data) — log quietly rather than alert.
        console.warn('Supabase: could not save user', rows[i].email || rows[i].id, err);
      });
      // Only alert if literally nothing went through — that points at a
      // real problem (bad URL/key, network down, RLS misconfigured
      // entirely) rather than expected per-row permission differences.
      if (successCount === 0 && rows.length > 0){
        console.error('Supabase save users failed for all rows.');
        alert('Could not save to database — check your connection or Supabase setup.');
      }
    })();
  }

  function checkinToRow(c){
    return { id: (c.id && c.id.length === 36) ? c.id : undefined, user_id: c.userId, date: c.date };
  }
  function rowToCheckin(r){ return { id: r.id, userId: r.user_id, date: r.date }; }

  let checkinsSnapshot = [];
  function loadCheckins(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshCheckinsFromSupabase below).
    return SEED_CHECKINS.slice();
  }
  async function refreshCheckinsFromSupabase(){
    const { data, error } = await bnbClient.from('checkins').select('*');
    if (error) { console.error('Supabase load checkins failed:', error); return; }
    if (data && data.length) {
      checkins = data.map(rowToCheckin);
      checkinsSnapshot = checkins.slice();
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }
  function saveCheckins(){
    const oldIds = new Set(checkinsSnapshot.map(x=>x.id).filter(Boolean));
    const newIds = new Set(checkins.map(x=>x.id).filter(Boolean));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    checkinsSnapshot = checkins.slice();
    (async () => {
      try {
        const realRows = checkins.filter(c => c.id && c.id.length === 36);
        const rows = realRows.map(checkinToRow);
        await Promise.allSettled(rows.map(row => bnbClient.from('checkins').upsert([row])));
        await Promise.allSettled(removedIds.map(id => bnbClient.from('checkins').delete().eq('id', id)));
      } catch(e){ console.warn('Supabase save checkins failed:', e); }
    })();
  }

  function assessmentToRow(a){
    return {
      id: (a.id && a.id.length === 36) ? a.id : undefined,
      user_id: a.userId, date: a.date, type: a.type, conductor: a.conductor,
      parq_cardio: !!a.parqCardio, parq_joint: !!a.parqJoint, parq_clearance: !!a.parqClearance,
      medical: a.medical, weight: a.weight, bodyfat: a.bodyfat, resting_hr: a.restingHr, bp: a.bp,
      movement: a.movement, goals: a.goals, history: a.history, occ_activity: a.occActivity,
      sleep: a.sleep, stress: a.stress, nutrition: a.nutrition, availability: a.availability,
      waiver: !!a.waiver
    };
  }
  function rowToAssessment(r){
    return {
      id: r.id, userId: r.user_id, date: r.date, type: r.type, conductor: r.conductor,
      parqCardio: r.parq_cardio, parqJoint: r.parq_joint, parqClearance: r.parq_clearance,
      medical: r.medical, weight: r.weight, bodyfat: r.bodyfat, restingHr: r.resting_hr, bp: r.bp,
      movement: r.movement, goals: r.goals, history: r.history, occActivity: r.occ_activity,
      sleep: r.sleep, stress: r.stress, nutrition: r.nutrition, availability: r.availability,
      waiver: r.waiver
    };
  }

  let assessmentsSnapshot = [];
  function loadAssessments(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshAssessmentsFromSupabase below).
    return SEED_ASSESSMENTS.slice();
  }
  async function refreshAssessmentsFromSupabase(){
    const { data, error } = await bnbClient.from('assessments').select('*');
    if (error) { console.error('Supabase load assessments failed:', error); return; }
    if (data && data.length) {
      assessments = data.map(rowToAssessment);
      assessmentsSnapshot = assessments.slice();
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }
  function saveAssessments(){
    const oldIds = new Set(assessmentsSnapshot.map(x=>x.id).filter(Boolean));
    const newIds = new Set(assessments.map(x=>x.id).filter(Boolean));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));
    assessmentsSnapshot = assessments.slice();
    (async () => {
      try {
        const realRows = assessments.filter(a => a.id && a.id.length === 36);
        const rows = realRows.map(assessmentToRow);
        await Promise.allSettled(rows.map(row => bnbClient.from('assessments').upsert([row])));
        await Promise.allSettled(removedIds.map(id => bnbClient.from('assessments').delete().eq('id', id)));
      } catch(e){ console.warn('Supabase save assessments failed:', e); }
    })();
  }
  function userAssessments(userId){
    return assessments.filter(a=>a.userId===userId).sort((a,b)=> b.date.localeCompare(a.date)); // newest first
  }

  let users = loadUsers();
  refreshUsersFromSupabase(); // async — replaces seed data with real rows once Supabase responds
  let checkins = loadCheckins();
  checkinsSnapshot = checkins.slice();
  refreshCheckinsFromSupabase(); // async — replaces seed data once Supabase responds
  let assessments = loadAssessments();
  assessmentsSnapshot = assessments.slice();
  refreshAssessmentsFromSupabase(); // async — replaces seed data once Supabase responds
  let editingId = null;
  let activeRole = 'all';
  let searchTerm = '';
  let adminLayout = 'directory'; // 'table' or 'directory'
  function loadSelfId(){
    // No fallback to a seeded demo user — a fresh browser with no real
    // login should read as signed-out (getSelf() returns null), which is
    // what the nav auth gate, guest MANUAL default, etc. all depend on.
    try { return localStorage.getItem(SELF_KEY) || null; } catch(e){ return null; }
  }
  function saveSelfId(id){
    try { localStorage.setItem(SELF_KEY, id); } catch(e){}
  }
  let selfId = loadSelfId();

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }
  function fmtDate(d){
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  }
  const ROLE_PRIORITY = ['admin','trainer','staff','member'];
  function primaryRole(roles){
    if (!Array.isArray(roles) || !roles.length) return 'member';
    return ROLE_PRIORITY.find(r=>roles.includes(r)) || roles[0];
  }
  function roleLabel(r){
    return {member:'Member', trainer:'Trainer/Coach', staff:'Staff', admin:'Admin'}[r] || r;
  }
  function rolePillsHtml(roles){
    const list = Array.isArray(roles) && roles.length ? roles : ['member'];
    const primary = primaryRole(list);
    return '<div class="role-pills">' + list.map(r =>
      `<span class="role-pill${r===primary ? ' primary' : ''}">${esc(roleLabel(r))}</span>`
    ).join('') + '</div>';
  }
  /* ---------------- CHECK-IN / ACTIVITY HELPERS ---------------- */
  function userCheckins(userId){
    return checkins.filter(c=>c.userId===userId).map(c=>c.date).sort().reverse(); // newest first
  }
  function daysBetween(d1, d2){
    const a = new Date(d1 + 'T00:00:00'), b = new Date(d2 + 'T00:00:00');
    return Math.round((a - b) / 86400000);
  }
  function daysSinceLastVisit(userId){
    const dates = userCheckins(userId);
    if (!dates.length) return null;
    return daysBetween(TODAY, dates[0]);
  }
  function currentStreak(userId){
    // Streak rule: a 1-day rest gap is always fine. A 2-day rest gap is only
    // fine if the rest immediately before it was a 1-day rest — no two
    // consecutive 2-day rests. A gap of 3+ rest days always breaks it.
    const dates = userCheckins(userId); // newest first
    if (!dates.length) return 0;
    let streak = 1;
    let prevGap = null; // gap (in days) between the two most-recently-counted visits
    for (let i=0; i<dates.length-1; i++){
      const gap = daysBetween(dates[i], dates[i+1]); // 1=daily, 2=1-day rest, 3=2-day rest
      if (gap === 1 || gap === 2){
        streak++;
        prevGap = gap;
      } else if (gap === 3 && prevGap !== 3){
        streak++;
        prevGap = gap;
      } else {
        break;
      }
    }
    return streak;
  }
  function visitsThisMonth(userId){
    const prefix = TODAY.slice(0,7); // YYYY-MM
    return userCheckins(userId).filter(d=>d.startsWith(prefix)).length;
  }
  function daysSinceBadgeCls(days){
    if (days === null) return 'ok';
    if (days <= 3) return 'fresh';
    if (days <= 14) return 'ok';
    return 'stale';
  }
  function logCheckin(userId, date){
    if (checkins.some(c=>c.userId===userId && c.date===date)) return false; // already checked in that day
    checkins.push({ id: window.BNB_UUID(), userId, date });
    saveCheckins();
    return true;
  }

  let toastTimer = null;
  function showToast(msg){
    const t = document.getElementById('usr-u-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 2200);
  }

  /* ---------------- PASSWORD SHOW/HIDE TOGGLES ---------------- */
  document.querySelectorAll('#site-users .pw-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = document.getElementById(btn.getAttribute('data-target'));
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.querySelector('.pw-eye-on').hidden = !showing;
      btn.querySelector('.pw-eye-off').hidden = showing;
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });

  /* ---------------- VIEW SWITCH ---------------- */
  function switchView(view){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('usr-view-' + view).classList.add('active');
    document.querySelectorAll('#usr-mode-switch button').forEach(b=>{
      b.classList.toggle('active', b.dataset.mode === view);
    });
  }
  document.querySelectorAll('#usr-mode-switch button').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (b.dataset.mode === 'signup'){ switchView('signup'); }
      else if (b.dataset.mode === 'login'){ switchView('login'); }
      else { switchView('profile'); renderProfile(); }
    });
  });

  /* ---- Log In / Sign Up are dead weight once you're already authenticated
     — hide them from the mode-switch instead of leaving them clickable.
     Called on every auth transition (login, signup, logout, session
     restore) so it never falls out of sync with who's actually signed in. ---- */
  function refreshModeSwitchVisibility(){
    const signedIn = !!selfId;
    document.querySelectorAll('#usr-mode-switch button').forEach(b=>{
      if (b.dataset.mode === 'login' || b.dataset.mode === 'signup'){
        b.style.display = signedIn ? 'none' : '';
      }
    });
  }
  function onAuthStateChanged(){
    refreshModeSwitchVisibility();
    if (window.bnbRefreshNavAuthGate) window.bnbRefreshNavAuthGate();
    // The very first refreshUsersFromSupabase()/etc. calls (fired at script
    // parse time, before restoreSession() has finished) can lose a race
    // against auth actually restoring: querying under RLS as "signed out"
    // returns a thin/empty result that never gets retried, leaving things
    // like the Program Builder client picker stuck showing stale seed data.
    // Re-running them here — on every real auth transition — guarantees at
    // least one fetch happens once we know who's actually signed in.
    if (selfId){
      refreshUsersFromSupabase();
      refreshCoachesDirectory();
      refreshCheckinsFromSupabase();
      refreshAssessmentsFromSupabase();
    }
  }

  /* ================= MEMBER: SIGN UP ================= */
  function showSignupError(msg){
    const el = document.getElementById('usr-su-error');
    el.textContent = msg;
    el.style.display = 'block';
  }
  document.getElementById('usr-su-goto-profile').addEventListener('click', (e)=>{
    e.preventDefault();
    document.querySelector('#usr-mode-switch button[data-mode="login"]').click();
  });
  document.getElementById('usr-signup-btn').addEventListener('click', async ()=>{
    const fullName = document.getElementById('usr-su-fullname').value.trim();
    const email = document.getElementById('usr-su-email').value.trim();
    const email2 = document.getElementById('usr-su-email2').value.trim();
    const password = document.getElementById('usr-su-password').value;
    const password2 = document.getElementById('usr-su-password2').value;
    const phone = document.getElementById('usr-su-phone').value.trim();
    document.getElementById('usr-su-error').style.display = 'none';

    if (!fullName){ showSignupError('Give your account a name first.'); return; }
    if (!email){ showSignupError('An email is required to sign up.'); return; }
    if (!email2){ showSignupError('Retype your email to confirm it.'); return; }
    if (email.toLowerCase() !== email2.toLowerCase()){ showSignupError('Emails do not match.'); return; }
    if (users.some(u=>u.email.toLowerCase() === email.toLowerCase())){
      showSignupError('An account with that email already exists.');
      return;
    }
    if (!password){ showSignupError('Choose a password first.'); return; }
    if (password.length < 6){ showSignupError('Password must be at least 6 characters.'); return; }
    if (!password2){ showSignupError('Retype your password to confirm it.'); return; }
    if (password !== password2){ showSignupError('Passwords do not match.'); return; }

    const btn = document.getElementById('usr-signup-btn');
    btn.disabled = true; btn.textContent = 'Creating account…';

    // Real Supabase Auth account first — this is what makes login work later.
    const { data: authData, error: authError } = await bnbClient.auth.signUp({ email, password });
    btn.disabled = false; btn.textContent = 'Create Account';

    if (authError){
      showSignupError(authError.message || 'Could not create account — please try again.');
      return;
    }
    if (!authData.user){
      showSignupError('Check your email to confirm your account, then log in.');
      return;
    }

    // Use a real UUID for the profile row's id (matches Supabase's uuid
    // primary key) rather than the old 'u'+timestamp local-only id scheme.
    const id = (crypto.randomUUID ? crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
        const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
      }));
    const newUser = {
      id, authId: authData.user.id, fullName, email, roles:['member'], status:'active',
      avatar:'https://i.pravatar.cc/150?img=' + (10 + Math.floor(Math.random()*60)),
      createdAt: TODAY, lastLogin: TODAY,
      dob:'', phone, address:'',
      height:'', weight:'', experience:'beginner',
      goals:'', injury:'', ecName:'', ecPhone:'', prefTime:'', trainer:'',
      plan:'', mstatus:'pending', contractEnd:'', balance:0, comp:'', lastCheckin:'', autoRenew:false,
      flag:'green', leadSource:'Sign-up form', internalNotes:''
    };
    users.push(newUser);
    saveUsers();
    selfId = id;
    saveSelfId(id);
    startSessionClock();

    document.getElementById('usr-su-fullname').value = '';
    document.getElementById('usr-su-email').value = '';
    document.getElementById('usr-su-email2').value = '';
    document.getElementById('usr-su-password').value = '';
    document.getElementById('usr-su-password2').value = '';
    document.getElementById('usr-su-phone').value = '';

    showToast('Account created — welcome!');
    routeAfterAuth(newUser);
  });

  /* ================= MEMBER: LOG IN ================= */
  function showLoginError(msg){
    const el = document.getElementById('usr-li-error');
    el.textContent = msg;
    el.style.display = 'block';
  }
  document.getElementById('usr-li-goto-signup').addEventListener('click', (e)=>{
    e.preventDefault();
    document.querySelector('#usr-mode-switch button[data-mode="signup"]').click();
  });
  /* ---- Shared: given an authenticated Supabase user, find their profile
     row, sign them in locally, and route to the right landing view.
     Used by Login, session restore, and after a password reset. ---- */
  async function signInLocallyAs(authUser){
    let matched = users.find(u => u.authId === authUser.id);
    if (!matched){
      const { data: rows } = await bnbClient.from('users').select('*').eq('auth_id', authUser.id);
      if (rows && rows.length){
        matched = rowToUser(rows[0]);
        users.push(matched);
      }
    }
    if (!matched) return null;
    selfId = matched.id;
    saveSelfId(matched.id);
    // Keep the older "Viewing as" key (still read by Schedule/Billing at
    // their own init time) in sync with the real login, so a page reload
    // has them agree with who's actually authenticated. Only do this for
    // members — staff logins shouldn't silently hijack a member's
    // "viewing as" selection.
    if (matched.roles && matched.roles.includes('member')){
      try { localStorage.setItem('bnb-sched-self-member', matched.id); } catch(e){}
    }
    return matched;
  }
  function routeAfterAuth(matched){
    const staff = ['admin','trainer','staff'];
    onAuthStateChanged();
    if (typeof window.switchSite === 'function') window.switchSite('gym');
    if (typeof window.switchTab === 'function'){
      const isStaff = matched.roles && matched.roles.some(r => staff.includes(r));
      window.switchTab(isStaff ? 'coach' : 'session');
    }
  }

  /* ---- Login attempt throttle (client-side UX deterrent only — NOT real
     security, since anyone hitting the Supabase endpoint directly skips
     this entirely. The actual protection has to be CAPTCHA + rate limits
     configured in the Supabase dashboard. This just stops someone from
     mashing the Log In button by hand and gives a clearer message than
     letting Supabase's own (currently unreliable) rate limiting kick in
     mid-request. ---- */
  const LOGIN_ATTEMPTS_KEY = 'bnb-login-attempts';
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOGIN_LOCKOUT_MS = 60 * 1000;
  function loadLoginAttemptState(){
    try {
      const raw = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || 'null');
      if (raw && typeof raw.count === 'number') return raw;
    } catch(e){}
    return { count: 0, lockedUntil: 0 };
  }
  function saveLoginAttemptState(state){
    try { localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(state)); } catch(e){}
  }
  function recordFailedLogin(){
    const state = loadLoginAttemptState();
    state.count = (state.count || 0) + 1;
    if (state.count >= MAX_LOGIN_ATTEMPTS){
      state.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
      state.count = 0; // reset the counter for the next window once this lockout clears
    }
    saveLoginAttemptState(state);
  }
  function clearLoginAttempts(){
    saveLoginAttemptState({ count: 0, lockedUntil: 0 });
  }
  function loginLockoutSecondsRemaining(){
    const state = loadLoginAttemptState();
    const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  async function attemptLogin(){
    const email = document.getElementById('usr-li-email').value.trim();
    const password = document.getElementById('usr-li-password').value;
    document.getElementById('usr-li-error').style.display = 'none';

    const lockedFor = loginLockoutSecondsRemaining();
    if (lockedFor > 0){
      showLoginError('Too many failed attempts. Try again in ' + lockedFor + ' second' + (lockedFor===1?'':'s') + '.');
      return;
    }

    if (!email){ showLoginError('Enter your email.'); return; }
    if (!password){ showLoginError('Enter your password.'); return; }

    const btn = document.getElementById('usr-login-btn');
    btn.disabled = true; btn.textContent = 'Logging in…';

    const { data, error } = await bnbClient.auth.signInWithPassword({ email, password });

    btn.disabled = false; btn.textContent = 'Log In';

    if (error){
      recordFailedLogin();
      const stillLocked = loginLockoutSecondsRemaining();
      showLoginError(stillLocked > 0
        ? 'Too many failed attempts. Try again in ' + stillLocked + ' second' + (stillLocked===1?'':'s') + '.'
        : (error.message || 'Incorrect email or password.'));
      return;
    }

    const matched = await signInLocallyAs(data.user);
    if (!matched){
      showLoginError('Logged in, but no matching member profile was found. Contact your coach.');
      return;
    }

    clearLoginAttempts();
    setRememberMe(document.getElementById('usr-li-remember').checked);
    document.getElementById('usr-li-email').value = '';
    document.getElementById('usr-li-password').value = '';
    startSessionClock();
    showToast('Welcome back, ' + matched.fullName.split(' ')[0] + '!');
    routeAfterAuth(matched);
  }
  document.getElementById('usr-login-btn').addEventListener('click', attemptLogin);
  document.getElementById('usr-li-password').addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') attemptLogin();
  });

  /* ---- Log Out — shared by the profile card's button and the top-nav
     account menu, so there's exactly one place this logic lives. ---- */
  async function performLogout(){
    await bnbClient.auth.signOut();
    selfId = null;
    saveSelfId('');
    setRememberMe(false);
    clearCookie(SESSION_COOKIE);
    if (sessionExpiryTimer) { clearTimeout(sessionExpiryTimer); sessionExpiryTimer = null; }
    showToast('Logged out.');
    switchView('login');
    onAuthStateChanged();
    if (typeof window.switchSite === 'function') window.switchSite('gym');
    if (typeof window.switchTab === 'function') window.switchTab('overview');
  }
  window.bnbLogout = performLogout;

  /* ---- Log Out (delegated, since the button is rebuilt on every
     renderProfile() call along with the rest of the profile card) ---- */
  document.getElementById('usr-profile-card').addEventListener('click', (e)=>{
    if (e.target.id !== 'usr-logout-btn') return;
    performLogout();
  });

  /* ================= MEMBER: FORGOT / RESET PASSWORD ================= */
  document.getElementById('usr-li-goto-forgot').addEventListener('click', (e)=>{
    e.preventDefault();
    switchView('forgot');
  });
  document.getElementById('usr-fp-goto-login').addEventListener('click', (e)=>{
    e.preventDefault();
    switchView('login');
  });
  document.getElementById('usr-fp-send-btn').addEventListener('click', async ()=>{
    const email = document.getElementById('usr-fp-email').value.trim();
    const errEl = document.getElementById('usr-fp-error');
    const okEl = document.getElementById('usr-fp-success');
    errEl.style.display = 'none'; okEl.style.display = 'none';

    if (!email){ errEl.textContent = 'Enter your email.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('usr-fp-send-btn');
    btn.disabled = true; btn.textContent = 'Sending…';

    // redirectTo points back at this same page — Supabase appends a
    // #access_token=...&type=recovery fragment, which we detect on load
    // (see checkForPasswordRecovery below) to show the "set new password" view.
    const { error } = await bnbClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    btn.disabled = false; btn.textContent = 'Send Reset Link';

    if (error){
      errEl.textContent = error.message || 'Could not send reset email — try again.';
      errEl.style.display = 'block';
      return;
    }
    okEl.textContent = 'Check your email for a reset link.';
    okEl.style.display = 'block';
  });

  /* ---- Admin: send a real password reset email for whichever member is
     currently open in the edit panel, instead of the old fake text field
     that just wrote a cosmetic string and never touched real auth. ---- */
  document.getElementById('usr-f-password-reset-btn').addEventListener('click', async ()=>{
    const email = document.getElementById('usr-f-email').value.trim();
    const statusEl = document.getElementById('usr-f-password-reset-status');
    if (!email){ statusEl.textContent = 'Enter an email for this member first.'; statusEl.style.color = '#e0736a'; return; }

    const btn = document.getElementById('usr-f-password-reset-btn');
    btn.disabled = true; btn.textContent = 'Sending…';
    statusEl.textContent = '';

    const { error } = await bnbClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    btn.disabled = false; btn.textContent = 'Send Password Reset Email';

    if (error){
      statusEl.textContent = error.message || 'Could not send reset email — try again.';
      statusEl.style.color = '#e0736a';
      return;
    }
    statusEl.textContent = 'Reset link sent to ' + email + '.';
    statusEl.style.color = 'var(--accent)';
  });

  document.getElementById('usr-rs-save-btn').addEventListener('click', async ()=>{
    const p1 = document.getElementById('usr-rs-password').value;
    const p2 = document.getElementById('usr-rs-password2').value;
    const errEl = document.getElementById('usr-rs-error');
    errEl.style.display = 'none';

    if (!p1 || p1.length < 6){ errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
    if (p1 !== p2){ errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('usr-rs-save-btn');
    btn.disabled = true; btn.textContent = 'Saving…';

    const { data, error } = await bnbClient.auth.updateUser({ password: p1 });

    btn.disabled = false; btn.textContent = 'Save New Password';

    if (error){
      errEl.textContent = error.message || 'Could not update password — the reset link may have expired.';
      errEl.style.display = 'block';
      return;
    }

    document.getElementById('usr-rs-password').value = '';
    document.getElementById('usr-rs-password2').value = '';
    showToast('Password updated.');

    // The recovery link already leaves us signed in — go straight to the
    // right landing view instead of asking for the new password again.
    const matched = await signInLocallyAs(data.user);
    if (matched) { startSessionClock(); routeAfterAuth(matched); }
    else document.querySelector('#usr-mode-switch button[data-mode="login"]').click();
  });

  /* Detect a password-recovery redirect (Supabase appends
     #access_token=...&type=recovery to the URL after the emailed link is
     clicked) and land the user straight on the "set new password" view. */
  function checkForPasswordRecovery(){
    if (window.location.hash.includes('type=recovery')){
      switchSite('users');
      switchView('reset');
      return true;
    }
    return false;
  }

  /* ---- selfId is read from localStorage synchronously at script init
     (see loadSelfId above), long before this async check runs — so on a
     refresh where the visitor is NOT actually still signed in (expired
     inactivity cookie, or the Supabase session itself is gone), that
     leftover selfId would otherwise keep the nav/account menu painted as
     "signed in" until some gated action quietly fails against a dead
     session and forces a re-login. Clearing it here keeps the visible UI
     honest about auth state the moment we know better. ---- */
  function clearLocalSignIn(){
    selfId = null;
    saveSelfId('');
    if (sessionExpiryTimer) { clearTimeout(sessionExpiryTimer); sessionExpiryTimer = null; }
    onAuthStateChanged();
  }

  /* ---- Restore session on page load, so a refresh doesn't log you out —
     but only within the 30-minute inactivity window. Supabase's own client
     will happily keep refreshing its auth token forever, so the expiry
     cookie is what actually caps how long an idle login lasts: no cookie
     (missing or past its window) means we tear down any lingering
     Supabase session instead of restoring it. ---- */
  window.bnbSessionReady = (async function restoreSession(){
    if (checkForPasswordRecovery()) return; // reset view handles its own flow
    if (!hasValidSessionCookie()){
      try { await bnbClient.auth.signOut(); } catch(e){}
      clearCookie(SESSION_COOKIE);
      clearLocalSignIn();
      return;
    }
    const { data } = await bnbClient.auth.getSession();
    const session = data && data.session;
    if (!session) { clearCookie(SESSION_COOKIE); clearLocalSignIn(); return; }
    const matched = await signInLocallyAs(session.user);
    if (matched){
      const remaining = Number(getCookie(SESSION_COOKIE)) - Date.now();
      armSessionExpiryTimer(Math.max(remaining, 0));
      onAuthStateChanged();
    } else {
      clearLocalSignIn();
    }
  })();


  /* ================= MEMBER: MY PROFILE ================= */
  function renderProfile(){
    const u = users.find(x=>x.id===selfId);
    const card = document.getElementById('usr-profile-card');
    if (!u){ card.innerHTML = '<div class="empty-msg">Member not found.</div>'; return; }
    card.innerHTML = `
      <div class="profile-header">
        <img class="avatar-lg" src="${escAttr(u.avatar)}" alt="">
        <div class="who">
          <h2>${esc(u.fullName)}</h2>
          <div class="sub">${esc(u.email)}</div>
        </div>
        <button class="btn2 small" id="usr-logout-btn" style="margin-left:auto;">Log Out</button>
      </div>
      <div class="readonly-strip">
        <span class="ro-pill">Plan: <b>${esc(u.plan||'—')}</b></span>
        <span class="ro-pill">Status: <span class="status-pill ${esc(u.mstatus)}">${esc(u.mstatus)}</span></span>
        <span class="ro-pill coach-pill">Your Coach: <select id="usr-p-trainer-id"></select></span>
        <span class="ro-pill">Member since: <b>${fmtDate(u.createdAt)}</b></span>
      </div>
      <div class="field-hint" style="margin-bottom:18px;">Plan, status, and billing are managed by staff and shown here read-only. Pick or change your own coach any time from the list above. Everything below is yours to edit.</div>

      <div class="stat-block" id="usr-profile-stats"></div>
      <div class="checkin-btn-row">
        <button class="btn2 primary small" id="usr-self-checkin-btn">Check In Today</button>
      </div>

      <div class="points-block" id="usr-points-block">
        <div class="points-head">
          <div class="points-balance"><span id="usr-points-balance">…</span> <span class="lbl">points</span></div>
          <button class="btn2 small" id="usr-points-redeem-btn" disabled>Redeem 500 for a free PT session</button>
        </div>
        <div class="field-hint" style="margin:6px 0 0;">Earn 10 for every check-in, plus bonuses at 7/30/90-day streaks. <a href="#" id="usr-points-explainer-link">How it works</a></div>
        <div class="points-history" id="usr-points-history"></div>
      </div>

      <details class="profile-accordion" id="usr-profile-accordion">
        <summary>Personal, Fitness &amp; Emergency Contact Details</summary>
        <div class="accordion-body">

        <div class="tab-bar" id="usr-profile-tab-bar">
          <button class="active" data-ptab="personal" type="button">Personal</button>
          <button data-ptab="fitness" type="button">Fitness</button>
          <button data-ptab="emergency" type="button">Emergency Contact</button>
        </div>

        <div class="tab-pane active" id="usr-profile-tab-personal">
        <div class="field-row2">
          <div class="field"><label>Full Name</label><input type="text" id="usr-p-fullname" value="${escAttr(u.fullName)}"></div>
          <div class="field"><label>Phone</label><input type="tel" id="usr-p-phone" value="${escAttr(u.phone)}"></div>
        </div>
        <div class="field-row2">
          <div class="field"><label>Date of Birth</label><input type="date" id="usr-p-dob" value="${escAttr(u.dob)}"></div>
          <div class="field"><label>Address</label><input type="text" id="usr-p-address" value="${escAttr(u.address)}"></div>
        </div>
        <div class="field"><label>Avatar URL</label><input type="text" id="usr-p-avatar" value="${escAttr(u.avatar)}"></div>
        </div>

        <div class="tab-pane" id="usr-profile-tab-fitness">
        <div class="field-row3">
          <div class="field"><label>Height (cm)</label><input type="number" id="usr-p-height" value="${escAttr(u.height||'')}"></div>
          <div class="field"><label>Weight (kg)</label><input type="number" id="usr-p-weight" value="${escAttr(u.weight||'')}"></div>
          <div class="field">
            <label>Experience Level</label>
            <select id="usr-p-experience">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Fitness Goals</label><textarea id="usr-p-goals" rows="2">${esc(u.goals)}</textarea></div>
        <div class="field"><label>Injury / Medical Notes (shared with your trainer)</label><textarea id="usr-p-injury" rows="2">${esc(u.injury)}</textarea></div>
        <div class="field"><label>Preferred Workout Time</label><input type="text" id="usr-p-preftime" value="${escAttr(u.prefTime)}"></div>
        </div>

        <div class="tab-pane" id="usr-profile-tab-emergency">
        <div class="field-row2">
          <div class="field"><label>Name</label><input type="text" id="usr-p-ec-name" value="${escAttr(u.ecName)}"></div>
          <div class="field"><label>Phone</label><input type="tel" id="usr-p-ec-phone" value="${escAttr(u.ecPhone)}"></div>
        </div>
        </div>

        <div class="save-row">
          <button class="btn2 primary" id="usr-profile-save-btn">Save Profile</button>
        </div>
        </div>
      </details>
    `;
    document.getElementById('usr-p-experience').value = u.experience || 'beginner';

    // Your Coach — a member picks any active trainer-role account
    // straight from this dropdown; the server (sql/38) still enforces
    // that the value can only be an actual active coach or blank, so
    // this list is a convenience, not the real security boundary.
    const trainerSel = document.getElementById('usr-p-trainer-id');
    const trainers = window.BNB_USERS ? window.BNB_USERS.getTrainers() : [];
    trainerSel.innerHTML = '<option value="">Unassigned</option>' +
      trainers.map(t => `<option value="${escAttr(t.id)}">${esc(t.fullName)}</option>`).join('');
    trainerSel.value = u.trainerId || '';
    trainerSel.addEventListener('change', ()=>{
      u.trainerId = trainerSel.value || null;
      saveUsers();
      showToast(u.trainerId ? 'Coach updated' : 'Coach unassigned');
    });
    document.querySelectorAll('#usr-profile-tab-bar button').forEach(b=>{
      b.addEventListener('click', ()=>{
        document.querySelectorAll('#usr-profile-tab-bar button').forEach(x=>x.classList.toggle('active', x===b));
        document.querySelectorAll('#usr-profile-accordion .tab-pane').forEach(pane=>{
          pane.classList.toggle('active', pane.id === 'usr-profile-tab-' + b.dataset.ptab);
        });
      });
    });

    const streak = currentStreak(u.id);
    const visits = visitsThisMonth(u.id);
    const dsl = daysSinceLastVisit(u.id);
    document.getElementById('usr-profile-stats').innerHTML = `
      <div class="stat-card"><div class="num">${streak}</div><div class="lbl">Day Streak</div></div>
      <div class="stat-card"><div class="num">${visits}</div><div class="lbl">Visits This Month</div></div>
      <div class="stat-card"><div class="num">${dsl===null?'—':dsl}</div><div class="lbl">${dsl===1?'Day Since Last Visit':'Days Since Last Visit'}</div></div>
    `;
    const selfCheckinBtn = document.getElementById('usr-self-checkin-btn');
    const alreadyToday = checkins.some(c=>c.userId===u.id && c.date===TODAY);
    selfCheckinBtn.disabled = alreadyToday;
    selfCheckinBtn.textContent = alreadyToday ? 'Checked In Today ✓' : 'Check In Today';
    selfCheckinBtn.onclick = ()=>{
      if (logCheckin(u.id, TODAY)){ showToast('Checked in — see you on the floor!'); renderProfile(); }
    };

    // Points (sql/40) — balance and history come from the ledger itself,
    // fetched fresh each time so a just-earned or just-redeemed change
    // always shows up, not from anything computed/cached client-side.
    const POINTS_REDEEM_COST = 500;
    const pointsBalanceEl = document.getElementById('usr-points-balance');
    const pointsRedeemBtn = document.getElementById('usr-points-redeem-btn');
    const pointsHistoryEl = document.getElementById('usr-points-history');
    fetchPointsLedger(u.id).then(entries => {
      const balance = entries.reduce((sum, e) => sum + e.delta, 0);
      if (pointsBalanceEl) pointsBalanceEl.textContent = balance;
      if (pointsRedeemBtn) pointsRedeemBtn.disabled = balance < POINTS_REDEEM_COST;
      if (pointsHistoryEl){
        pointsHistoryEl.innerHTML = entries.length ? entries.slice(0, 5).map(e =>
          `<div class="points-row"><span>${esc(e.reason)}</span><span class="${e.delta<0?'neg':'pos'}">${e.delta>0?'+':''}${e.delta}</span></div>`
        ).join('') : '<div class="empty-msg">No activity yet — check in to start earning.</div>';
      }
    });
    const pointsExplainerLink = document.getElementById('usr-points-explainer-link');
    if (pointsExplainerLink){
      pointsExplainerLink.onclick = (e) => {
        e.preventDefault();
        if (typeof window.switchTab === 'function') window.switchTab('points');
      };
    }
    if (pointsRedeemBtn){
      pointsRedeemBtn.onclick = async () => {
        pointsRedeemBtn.disabled = true;
        try {
          await redeemPointsForCredit();
          showToast('Redeemed! +1 PT session credit');
          renderProfile();
        } catch (err) {
          showToast(err.message || 'Could not redeem right now.');
          pointsRedeemBtn.disabled = false;
        }
      };
    }

    document.getElementById('usr-profile-save-btn').addEventListener('click', ()=>{
      u.fullName = document.getElementById('usr-p-fullname').value.trim() || u.fullName;
      u.phone = document.getElementById('usr-p-phone').value.trim();
      u.dob = document.getElementById('usr-p-dob').value;
      u.address = document.getElementById('usr-p-address').value.trim();
      u.avatar = document.getElementById('usr-p-avatar').value.trim();
      u.height = document.getElementById('usr-p-height').value;
      u.weight = document.getElementById('usr-p-weight').value;
      u.experience = document.getElementById('usr-p-experience').value;
      u.goals = document.getElementById('usr-p-goals').value.trim();
      u.injury = document.getElementById('usr-p-injury').value.trim();
      u.prefTime = document.getElementById('usr-p-preftime').value.trim();
      u.ecName = document.getElementById('usr-p-ec-name').value.trim();
      u.ecPhone = document.getElementById('usr-p-ec-phone').value.trim();
      saveUsers();
      showToast('Profile saved');
      renderProfile();
    });
  }

  /* ================= ADMIN: USERS TABLE ================= */
  function renderRoleChips(){
    const roles = ['all', 'member', 'trainer', 'staff', 'admin'];
    const bar = document.getElementById('usr-role-filter');
    bar.innerHTML = '';
    roles.forEach(r=>{
      const btn = document.createElement('button');
      btn.textContent = r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1);
      btn.className = r === activeRole ? 'active' : '';
      btn.onclick = ()=>{ activeRole = r; renderAdmin(); };
      bar.appendChild(btn);
    });
  }

  document.querySelectorAll('#usr-layout-toggle button').forEach(b=>{
    b.addEventListener('click', ()=>{
      adminLayout = b.dataset.layout;
      document.querySelectorAll('#usr-layout-toggle button').forEach(x=>x.classList.toggle('active', x===b));
      document.getElementById('usr-layout-table').classList.toggle('active', adminLayout==='table');
      document.getElementById('usr-layout-directory').classList.toggle('active', adminLayout==='directory');
      renderAdmin();
    });
  });

  function visibleUsers(){
    let visible = users.slice();
    if (activeRole !== 'all') visible = visible.filter(u=>Array.isArray(u.roles) && u.roles.includes(activeRole));
    if (searchTerm){
      const q = searchTerm.toLowerCase();
      visible = visible.filter(u => (u.fullName||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
    }
    visible.sort((a,b)=> (a.fullName||'').localeCompare(b.fullName||''));
    return visible;
  }

  let usrSort = { key: 'fullName', dir: 'asc' };
  function usrSortValue(u, key){
    if (key === 'roles') return (u.roles||[]).slice().sort().join(',');
    if (key === 'balance') return u.balance || 0;
    if (key === 'lastVisit'){ const d = userCheckins(u.id); return d.length ? d[0] : ''; }
    if (key === 'streak') return currentStreak(u.id);
    return (u[key]||'').toString().toLowerCase();
  }
  function applyUsrSort(list, sort){
    return list.slice().sort((a,b)=>{
      const av = usrSortValue(a, sort.key);
      const bv = usrSortValue(b, sort.key);
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  function updateUsrSortHeaderUI(rowEl, sort){
    rowEl.querySelectorAll('th[data-sort]').forEach(th=>{
      const active = th.dataset.sort === sort.key;
      th.classList.toggle('sort-active', active);
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = active ? (sort.dir === 'asc' ? '▴' : '▾') : '▾';
    });
  }
  document.querySelectorAll('#usr-admin-thead-row th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if (usrSort.key === key) usrSort.dir = usrSort.dir === 'asc' ? 'desc' : 'asc';
      else { usrSort.key = key; usrSort.dir = 'asc'; }
      renderAdmin();
    });
  });

  function renderDirectoryGrid(visible){
    const grid = document.getElementById('usr-member-grid');
    grid.innerHTML = visible.map(u=>`
      <div class="member-card">
        <img class="member-avatar" src="${escAttr(u.avatar)}" alt="">
        <div class="member-body">
          <div class="member-name">${esc(u.fullName)}</div>
          <div class="member-email">${esc(u.email)}</div>
          <div class="member-meta">
            ${rolePillsHtml(u.roles)}
            <span class="status-pill ${esc(u.mstatus||u.status)}">${esc(u.mstatus||u.status)}</span>
            <span class="plan-pill">${esc(u.plan||'—')}</span>
          </div>
          <div class="member-joined">Joined ${fmtDate(u.createdAt)}</div>
        </div>
        <div class="card-actions">
          <button class="edit-btn" title="Edit" aria-label="Edit">✎</button>
          <button class="del del-btn" title="Delete" aria-label="Delete">✕</button>
        </div>
      </div>
    `).join('');
    grid.querySelectorAll('.member-card').forEach((card, i)=>{
      const u = visible[i];
      card.querySelector('.edit-btn').onclick = ()=> openEditor(u.id);
      card.querySelector('.del-btn').onclick = ()=>{
        if (!confirm('Delete "' + u.fullName + '"? This cannot be undone.')) return;
        users = users.filter(x=>x.id!==u.id);
        checkins = checkins.filter(c=>c.userId!==u.id);
        assessments = assessments.filter(a=>a.userId!==u.id);
        saveUsers(); saveCheckins(); saveAssessments(); renderAdmin();
      };
    });
  }

  function renderAdmin(){
    renderRoleChips();
    const tbody = document.getElementById('usr-admin-tbody');
    const emptyMsg = document.getElementById('usr-admin-empty');
    tbody.innerHTML = '';

    const visible = visibleUsers();

    document.getElementById('usr-result-count').textContent = visible.length + (visible.length===1 ? ' member' : ' members');

    if (visible.length === 0){
      emptyMsg.style.display='block';
      document.getElementById('usr-member-grid').innerHTML = '';
      return;
    }
    emptyMsg.style.display = 'none';

    if (adminLayout === 'directory'){ renderDirectoryGrid(visible); return; }

    updateUsrSortHeaderUI(document.getElementById('usr-admin-thead-row'), usrSort);
    const sortedVisible = applyUsrSort(visible, usrSort);
    sortedVisible.forEach(u=>{
      const tr = document.createElement('tr');
      const balanceCls = u.balance > 0 ? 'balance-neg' : '';
      const dsl = daysSinceLastVisit(u.id);
      const dslCls = daysSinceBadgeCls(dsl);
      const dates = userCheckins(u.id);
      const lastVisitDate = dates.length ? fmtDate(dates[0]) : '—';
      const dslLabel = dsl === null ? 'No visits yet' : (dsl === 0 ? 'Today' : dsl + 'd ago');
      tr.innerHTML = `
        <td><img class="avatar-sm" src="${escAttr(u.avatar)}" alt=""></td>
        <td><div class="who-cell"><div><div class="name">${esc(u.fullName)}</div><div class="email">${esc(u.email)}</div></div></div></td>
        <td class="mono">${rolePillsHtml(u.roles)}</td>
        <td><span class="status-pill ${esc(u.status)}">${esc(u.status)}</span></td>
        <td>${esc(u.plan||'—')}</td>
        <td class="mono ${balanceCls}">${u.balance ? '$' + u.balance : '$0'}</td>
        <td><div class="visit-cell"><span class="mono">${lastVisitDate}</span><span class="days-since ${dslCls}">${dslLabel}</span></div></td>
        <td class="mono">${currentStreak(u.id)}d</td>
        <td><div class="row-actions">
          <button class="edit-btn">Edit</button>
          <button class="del del-btn">Delete</button>
        </div></td>
      `;
      tr.querySelector('.edit-btn').onclick = ()=> openEditor(u.id);
      tr.querySelector('.del-btn').onclick = ()=>{
        if (!confirm('Delete "' + u.fullName + '"? This cannot be undone.')) return;
        users = users.filter(x=>x.id!==u.id);
        checkins = checkins.filter(c=>c.userId!==u.id);
        assessments = assessments.filter(a=>a.userId!==u.id);
        saveUsers(); saveCheckins(); saveAssessments(); renderAdmin();
      };
      tbody.appendChild(tr);
    });
  }

  document.getElementById('usr-search-input').addEventListener('input', (e)=>{
    searchTerm = e.target.value.trim();
    renderAdmin();
  });

  /* ---------------- ADMIN EDITOR PANEL ---------------- */
  const backdrop = document.getElementById('usr-panel-backdrop');

  document.querySelectorAll('#usr-tab-bar button').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('#usr-tab-bar button').forEach(x=>x.classList.toggle('active', x===b));
      document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
      document.getElementById('usr-tab-' + b.dataset.tab).classList.add('active');
    });
  });

  function openEditor(id){
    editingId = id || null;
    const u = id ? users.find(x=>x.id===id) : null;
    document.getElementById('usr-panel-title').textContent = u ? 'Edit Member' : 'Add Member';
    document.getElementById('usr-panel-sub').textContent = u ? ('ID: ' + u.id + ' · Joined ' + fmtDate(u.createdAt)) : 'New account';

    document.getElementById('usr-tab-bar').querySelector('[data-tab="account"]').click();

    document.getElementById('usr-f-fullname').value = u ? u.fullName : '';
    document.getElementById('usr-f-email').value = u ? u.email : '';
    const checkedRoles = u && Array.isArray(u.roles) ? u.roles : ['member'];
    document.querySelectorAll('#usr-f-roles input[type=checkbox]').forEach(cb=>{
      cb.checked = checkedRoles.includes(cb.value);
    });
    document.getElementById('usr-f-status').value = u ? u.status : 'pending';
    document.getElementById('usr-f-password-reset-status').textContent = '';
    document.getElementById('usr-f-avatar').value = u ? u.avatar : '';

    document.getElementById('usr-f-dob').value = u ? u.dob : '';
    document.getElementById('usr-f-phone').value = u ? u.phone : '';
    document.getElementById('usr-f-address').value = u ? u.address : '';
    document.getElementById('usr-f-height').value = u ? u.height : '';
    document.getElementById('usr-f-weight').value = u ? u.weight : '';
    document.getElementById('usr-f-experience').value = u ? (u.experience||'beginner') : 'beginner';
    document.getElementById('usr-f-goals').value = u ? u.goals : '';
    document.getElementById('usr-f-injury').value = u ? u.injury : '';
    document.getElementById('usr-f-ec-name').value = u ? u.ecName : '';
    document.getElementById('usr-f-ec-phone').value = u ? u.ecPhone : '';
    document.getElementById('usr-f-preftime').value = u ? u.prefTime : '';
    (function(){
      const sel = document.getElementById('usr-f-trainer-id');
      const trainers = window.BNB_USERS ? window.BNB_USERS.getTrainers() : [];
      sel.innerHTML = '<option value="">Unassigned</option>' +
        trainers.map(t => '<option value="'+t.id+'">'+esc(t.fullName)+'</option>').join('');
      sel.value = (u && u.trainerId) || '';
    })();

    (function(){
      const balanceEl = document.getElementById('usr-f-points-balance');
      const deltaInput = document.getElementById('usr-f-points-delta');
      const reasonInput = document.getElementById('usr-f-points-reason');
      const applyBtn = document.getElementById('usr-f-points-apply');
      deltaInput.value = ''; reasonInput.value = '';
      if (!u){ balanceEl.textContent = '—'; applyBtn.disabled = true; return; }
      applyBtn.disabled = false;
      balanceEl.textContent = '…';
      fetchPointsLedger(u.id).then(entries => {
        balanceEl.textContent = entries.reduce((sum, e) => sum + e.delta, 0);
      });
      applyBtn.onclick = async () => {
        const delta = parseInt(deltaInput.value, 10);
        if (!delta){ showToast('Enter a non-zero amount first.'); return; }
        applyBtn.disabled = true;
        try {
          await adjustPointsAsStaff(u.id, delta, reasonInput.value.trim());
          showToast('Points adjusted');
          deltaInput.value = ''; reasonInput.value = '';
          fetchPointsLedger(u.id).then(entries => {
            balanceEl.textContent = entries.reduce((sum, e) => sum + e.delta, 0);
          });
        } catch (err) {
          showToast(err.message || 'Could not adjust points.');
        }
        applyBtn.disabled = false;
      };
    })();

    document.getElementById('usr-f-plan').value = u ? u.plan : '';
    document.getElementById('usr-f-mstatus').value = u ? (u.mstatus||'active') : 'active';
    document.getElementById('usr-f-contract-end').value = u ? u.contractEnd : '';
    document.getElementById('usr-f-balance').value = u ? u.balance : 0;
    document.getElementById('usr-f-comp').value = u ? (u.comp||'') : '';
    document.getElementById('usr-f-autorenew').checked = u ? !!u.autoRenew : false;

    document.getElementById('usr-f-flag').value = u ? (u.flag||'green') : 'green';
    document.getElementById('usr-f-leadsource').value = u ? u.leadSource : '';
    document.getElementById('usr-f-internal-notes').value = u ? u.internalNotes : '';

    renderActivityTab();
    renderAssessmentTab();
    backdrop.classList.add('show');
  }

  function renderActivityTab(){
    const summary = document.getElementById('usr-activity-summary');
    const list = document.getElementById('usr-activity-list');
    const logBtn = document.getElementById('usr-log-checkin-btn');
    if (!editingId){
      summary.innerHTML = '<div class="field-hint">Save this new member first — check-ins can be logged once the account exists.</div>';
      list.innerHTML = '';
      logBtn.disabled = true;
      return;
    }
    logBtn.disabled = false;
    const streak = currentStreak(editingId);
    const visits = visitsThisMonth(editingId);
    const dsl = daysSinceLastVisit(editingId);
    summary.innerHTML = `
      <span class="ro-pill">Streak: <b>${streak}d</b></span>
      <span class="ro-pill">This month: <b>${visits}</b></span>
      <span class="ro-pill">Last visit: <b class="days-since ${daysSinceBadgeCls(dsl)}">${dsl===null?'never':(dsl+'d ago')}</b></span>
    `;
    const dates = userCheckins(editingId);
    list.innerHTML = dates.length
      ? dates.map(d=>`<li><span>${esc(fmtDate(d))}</span><span class="mono">${d===TODAY?'Today':''}</span></li>`).join('')
      : '<li class="empty-row">No check-ins logged yet.</li>';
  }

  document.getElementById('usr-log-checkin-btn').addEventListener('click', ()=>{
    if (!editingId) return;
    if (logCheckin(editingId, TODAY)){ showToast('Check-in logged'); renderActivityTab(); }
    else showToast('Already checked in today');
  });

  /* ---------------- ASSESSMENT LOG ---------------- */
  function renderAssessmentTab(){
    const list = document.getElementById('usr-assessment-list');
    const newBtn = document.getElementById('usr-new-assessment-btn');
    if (!editingId){
      list.innerHTML = '<div class="field-hint">Save this new member first — assessments can be logged once the account exists.</div>';
      newBtn.disabled = true;
      return;
    }
    newBtn.disabled = false;
    const entries = userAssessments(editingId);
    if (!entries.length){
      list.innerHTML = '<div class="empty-msg" style="padding:24px;">No assessments logged yet — the first one will be marked Initial Assessment.</div>';
      return;
    }
    list.innerHTML = entries.map(a=>{
      const typeCls = a.type === 'Initial Assessment' ? 'initial' : 'reassessment';
      const flags = [];
      if (a.parqCardio) flags.push('<span class="a-flag warn">Cardio risk</span>');
      if (a.parqJoint) flags.push('<span class="a-flag warn">Joint/bone issue</span>');
      if (a.parqClearance) flags.push('<span class="a-flag warn">Needs MD clearance</span>');
      if (a.waiver) flags.push('<span class="a-flag">Waiver signed</span>');
      return `
        <div class="assessment-card">
          <div class="a-head">
            <span class="assessment-type ${typeCls}">${esc(a.type)}</span>
            <span class="a-date">${esc(fmtDate(a.date))} · ${esc(a.conductor||'—')}</span>
          </div>
          <div class="a-row"><b>Goals:</b> ${esc(a.goals||'—')}</div>
          <div class="a-row"><b>Baseline:</b> ${esc(a.weight||'—')}kg · ${esc(a.bodyfat||'—')}% BF · RHR ${esc(a.restingHr||'—')} · BP ${esc(a.bp||'—')}</div>
          ${a.medical ? `<div class="a-row"><b>Medical:</b> ${esc(a.medical)}</div>` : ''}
          ${flags.length ? `<div class="a-flags">${flags.join('')}</div>` : ''}
        </div>`;
    }).join('');
  }

  const assessmentBackdrop = document.getElementById('usr-assessment-backdrop');
  document.getElementById('usr-new-assessment-btn').addEventListener('click', ()=>{
    if (!editingId) return;
    const priorCount = userAssessments(editingId).length;
    const nextType = priorCount === 0 ? 'Initial Assessment' : 'Reassessment';
    document.getElementById('usr-assessment-panel-title').textContent = 'Log ' + nextType;
    document.getElementById('usr-assessment-panel-sub').textContent = priorCount === 0
      ? 'First assessment on file for this client.'
      : priorCount + ' prior assessment(s) on file.';
    document.getElementById('usr-a-date').value = TODAY;
    document.getElementById('usr-a-conductor').value = '';
    document.getElementById('usr-a-parq-cardio').checked = false;
    document.getElementById('usr-a-parq-joint').checked = false;
    document.getElementById('usr-a-parq-clearance').checked = false;
    document.getElementById('usr-a-medical').value = '';
    document.getElementById('usr-a-weight').value = '';
    document.getElementById('usr-a-bodyfat').value = '';
    document.getElementById('usr-a-restinghr').value = '';
    document.getElementById('usr-a-bp').value = '';
    document.getElementById('usr-a-movement').value = '';
    document.getElementById('usr-a-goals').value = '';
    document.getElementById('usr-a-history').value = '';
    document.getElementById('usr-a-occ-activity').value = 'sedentary';
    document.getElementById('usr-a-sleep').value = '';
    document.getElementById('usr-a-stress').value = 'moderate';
    document.getElementById('usr-a-nutrition').value = '';
    document.getElementById('usr-a-availability').value = '';
    document.getElementById('usr-a-waiver').checked = false;
    assessmentBackdrop.classList.add('show');
  });
  document.getElementById('usr-assessment-cancel').addEventListener('click', ()=> assessmentBackdrop.classList.remove('show'));
  assessmentBackdrop.addEventListener('click', (e)=>{ if (e.target === assessmentBackdrop) assessmentBackdrop.classList.remove('show'); });

  document.getElementById('usr-assessment-save').addEventListener('click', ()=>{
    if (!editingId) return;
    const priorCount = userAssessments(editingId).length;
    const entry = {
      id: window.BNB_UUID(),
      userId: editingId,
      date: document.getElementById('usr-a-date').value || TODAY,
      type: priorCount === 0 ? 'Initial Assessment' : 'Reassessment',
      conductor: document.getElementById('usr-a-conductor').value.trim(),
      parqCardio: document.getElementById('usr-a-parq-cardio').checked,
      parqJoint: document.getElementById('usr-a-parq-joint').checked,
      parqClearance: document.getElementById('usr-a-parq-clearance').checked,
      medical: document.getElementById('usr-a-medical').value.trim(),
      weight: document.getElementById('usr-a-weight').value,
      bodyfat: document.getElementById('usr-a-bodyfat').value,
      restingHr: document.getElementById('usr-a-restinghr').value,
      bp: document.getElementById('usr-a-bp').value.trim(),
      movement: document.getElementById('usr-a-movement').value.trim(),
      goals: document.getElementById('usr-a-goals').value.trim(),
      history: document.getElementById('usr-a-history').value.trim(),
      occActivity: document.getElementById('usr-a-occ-activity').value,
      sleep: document.getElementById('usr-a-sleep').value,
      stress: document.getElementById('usr-a-stress').value,
      nutrition: document.getElementById('usr-a-nutrition').value.trim(),
      availability: document.getElementById('usr-a-availability').value.trim(),
      waiver: document.getElementById('usr-a-waiver').checked
    };
    assessments.push(entry);
    saveAssessments();
    assessmentBackdrop.classList.remove('show');
    showToast(entry.type + ' saved');
    renderAssessmentTab();
  });
  document.getElementById('usr-new-user-btn').addEventListener('click', ()=> openEditor(null));
  document.getElementById('usr-panel-cancel').addEventListener('click', ()=> backdrop.classList.remove('show'));
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) backdrop.classList.remove('show'); });

  document.getElementById('usr-panel-save').addEventListener('click', ()=>{
    const fullName = document.getElementById('usr-f-fullname').value.trim();
    const email = document.getElementById('usr-f-email').value.trim();
    if (!fullName){ alert('Give the member a name first.'); return; }
    if (!email){ alert('Give the member an email first.'); return; }

    let selectedRoles = Array.from(document.querySelectorAll('#usr-f-roles input[type=checkbox]:checked')).map(cb=>cb.value);
    if (!selectedRoles.length) selectedRoles = ['member']; // always at least Member, matching sign-up default

    const data = {
      fullName, email,
      roles: selectedRoles,
      status: document.getElementById('usr-f-status').value,
      password: '••••••••', // display-only placeholder — real auth lives in Supabase Auth, not this row; see the reset-email button above
      avatar: document.getElementById('usr-f-avatar').value.trim() || 'https://i.pravatar.cc/150?u=' + encodeURIComponent(email),
      dob: document.getElementById('usr-f-dob').value,
      phone: document.getElementById('usr-f-phone').value.trim(),
      address: document.getElementById('usr-f-address').value.trim(),
      height: document.getElementById('usr-f-height').value,
      weight: document.getElementById('usr-f-weight').value,
      experience: document.getElementById('usr-f-experience').value,
      goals: document.getElementById('usr-f-goals').value.trim(),
      injury: document.getElementById('usr-f-injury').value.trim(),
      ecName: document.getElementById('usr-f-ec-name').value.trim(),
      ecPhone: document.getElementById('usr-f-ec-phone').value.trim(),
      prefTime: document.getElementById('usr-f-preftime').value.trim(),
      trainerId: document.getElementById('usr-f-trainer-id').value || null,
      plan: document.getElementById('usr-f-plan').value.trim(),
      mstatus: document.getElementById('usr-f-mstatus').value,
      contractEnd: document.getElementById('usr-f-contract-end').value,
      balance: Number(document.getElementById('usr-f-balance').value) || 0,
      comp: document.getElementById('usr-f-comp').value,
      autoRenew: document.getElementById('usr-f-autorenew').checked,
      flag: document.getElementById('usr-f-flag').value,
      leadSource: document.getElementById('usr-f-leadsource').value.trim(),
      internalNotes: document.getElementById('usr-f-internal-notes').value.trim()
    };

    if (editingId){
      const idx = users.findIndex(x=>x.id===editingId);
      // authId links this row to the member's real Supabase Auth account —
      // the edit form has no field for it (nothing to edit), so it must be
      // carried over explicitly here, the same as createdAt/lastLogin
      // already are. Without this, editing ANY field on an existing member
      // silently wipes auth_id on save, and that member can no longer log
      // in — the app looks up their profile by auth_id after auth succeeds,
      // finds nothing, and shows "no matching member profile was found."
      users[idx] = Object.assign({id: editingId, authId: users[idx].authId, createdAt: users[idx].createdAt, lastLogin: users[idx].lastLogin}, data);
    } else {
      data.id = window.BNB_UUID();
      data.createdAt = new Date().toISOString().slice(0,10);
      data.lastLogin = '';
      users.push(data);
    }
    saveUsers();
    backdrop.classList.remove('show');
    showToast('Member saved');
    renderAdmin();
  });

  /* ---------------- IMPORT / EXPORT ---------------- */
  document.getElementById('usr-export-btn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(users, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wkab-users-export.json'; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('usr-import-btn').addEventListener('click', ()=> document.getElementById('usr-import-file').click());
  document.getElementById('usr-import-file').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        users = parsed; saveUsers(); renderAdmin();
        alert('Members imported.');
      } catch(err){ alert('That file could not be read as a valid users JSON export.'); }
    };
    reader.readAsText(file);
  });

  /* ---------------- PUBLIC READ/WRITE API (for other modules, e.g. Schedule, Billing) ---------------- */
  async function migrateSeedUsers(){
    const idMap = {};
    for (const u of SEED_USERS){
      const { data: existing } = await bnbClient.from('users').select('id').eq('email', u.email);
      if (existing && existing.length){ idMap[u.id] = existing[0].id; continue; }
      const row = userToRow(u);
      delete row.id; // force Supabase to generate a real UUID
      const { data, error } = await bnbClient.from('users').insert([row]).select();
      if (error){ console.warn('Seed migration: user failed', u.email, error); continue; }
      idMap[u.id] = data[0].id;
    }
    return idMap;
  }
  async function migrateSeedCheckins(userIdMap){
    let ok = 0;
    for (const c of SEED_CHECKINS){
      const newUserId = userIdMap[c.userId];
      if (!newUserId) continue;
      const { error } = await bnbClient.from('checkins').insert([{ user_id: newUserId, date: c.date }]);
      if (!error) ok++;
    }
    return ok;
  }
  async function migrateSeedAssessments(userIdMap){
    let ok = 0;
    for (const a of SEED_ASSESSMENTS){
      const newUserId = userIdMap[a.userId];
      if (!newUserId) continue;
      const row = assessmentToRow(a);
      row.user_id = newUserId;
      delete row.id;
      const { error } = await bnbClient.from('assessments').insert([row]);
      if (!error) ok++;
    }
    return ok;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.users = migrateSeedUsers;
  window.BNB_MIGRATE.checkins = migrateSeedCheckins;
  window.BNB_MIGRATE.assessments = migrateSeedAssessments;

  window.BNB_USERS = {
    getAll: function(){ return users.slice(); },
    // Own-array trainers (full rows — populated whenever this session can
    // see them, e.g. staff) plus anything from the coaches directory
    // (sql/39) not already present, so a plain member sees the same
    // active-trainer list a staff session does, without ever needing
    // direct row access to trainer accounts. Restricted to real UUIDs
    // (length 36) — SEED_USERS' placeholder trainer rows ('u2', 't2', ...)
    // use short fake ids that never match a real account's id, so during
    // the brief window before refreshUsersFromSupabase() replaces seed
    // data, they'd otherwise show up as duplicates alongside the same
    // coach's real entry from the directory.
    getTrainers: function(){
      const own = users.filter(function(u){ return u.id && u.id.length === 36 && u.status!=='suspended' && u.roles && u.roles.indexOf('trainer')!==-1; });
      const ownIds = own.reduce(function(set, u){ set[u.id] = true; return set; }, {});
      const extra = coachesDirectory.filter(function(c){ return !ownIds[c.id]; });
      return own.concat(extra);
    },
    getMembers: function(){ return users.filter(function(u){ return u.status!=='suspended' && u.roles && u.roles.indexOf('member')!==-1; }); },
    getById: function(id){ return users.find(function(u){ return u.id===id; }); },
    getName: function(id){ var u = users.find(function(x){ return x.id===id; }); return u ? u.fullName : null; },
    // Case-insensitive email lookup — used by Shop checkout to find a
    // returning buyer's existing account rather than creating a duplicate.
    getByEmail: function(email){
      if (!email) return null;
      var e = String(email).trim().toLowerCase();
      return users.find(function(u){ return u.email && u.email.toLowerCase()===e; }) || null;
    },
    // Minimal account creation for a public Shop buyer who doesn't have one
    // yet — deliberately skips password/onboarding fields the full Sign Up
    // form asks for, since forcing that at checkout is unnecessary friction
    // for someone just buying a session pack. Mirrors the shape the real
    // signup handler produces so nothing elsewhere breaks on a missing field.
    createLead: function(data){
      var id = window.BNB_UUID();
      var newUser = {
        id: id, fullName: data.fullName, email: data.email, roles:['member'], status:'active',
        password:'', avatar:'https://i.pravatar.cc/150?img=' + (10 + Math.floor(Math.random()*60)),
        createdAt: new Date().toISOString().slice(0,10), lastLogin:'',
        dob:'', phone: data.phone||'', address:'',
        height:'', weight:'', experience:'beginner',
        goals:'', injury:'', ecName:'', ecPhone:'', prefTime:'', trainer:'',
        plan:'', mstatus:'pending', contractEnd:'', balance:0, comp:'', lastCheckin:'', autoRenew:false,
        flag:'green', leadSource:'Shop checkout', internalNotes:'', credits:0
      };
      users.push(newUser);
      saveUsers();
      if (typeof renderAdmin === 'function') renderAdmin();
      return newUser;
    },
    getCredits: function(id){
      var u = users.find(function(x){ return x.id===id; });
      return u ? Number(u.credits||0) : 0;
    },
    // Adds session credits to a member — called once a Session Package
    // invoice is confirmed paid in Billing, never at time of purchase.
    addCredits: function(id, n){
      var idx = users.findIndex(function(u){ return u.id===id; });
      if (idx === -1) return false;
      users[idx].credits = Math.max(0, Number(users[idx].credits||0) + Number(n||0));
      saveUsers();
      if (typeof renderAdmin === 'function') renderAdmin();
      return true;
    },
    // Deducts one session credit when a 1-on-1 is booked. Returns false (and
    // deducts nothing) if the member has none — Booking then just warns
    // instead of blocking, rather than going negative.
    deductCredit: function(id){
      var idx = users.findIndex(function(u){ return u.id===id; });
      if (idx === -1) return false;
      var cur = Number(users[idx].credits||0);
      if (cur <= 0) return false;
      users[idx].credits = cur - 1;
      saveUsers();
      if (typeof renderAdmin === 'function') renderAdmin();
      return true;
    },
    // Used by the Billing module to keep each member's "Outstanding Balance" field
    // in sync with the derived total from the invoice/payment log, instead of that
    // number being hand-edited in two places.
    setBalance: function(id, amount){
      var idx = users.findIndex(function(u){ return u.id===id; });
      if (idx === -1) return false;
      users[idx].balance = Math.round(amount * 100) / 100;
      saveUsers();
      if (typeof renderAdmin === 'function') renderAdmin();
      return true;
    },
    // "Who is using this device" lookup. Now that real login exists
    // (Supabase Auth, selfId), that's the source of truth when someone is
    // actually logged in. Falls back to the old manual "Viewing as"
    // dropdown (bnb-sched-self-member) for two legitimate remaining
    // cases: staff previewing a specific member's view, and guests
    // browsing before anyone has logged in — same as before.
    getSignedInMember: function(){
      var members = this.getMembers().map(function(u){ return { id: u.id, name: u.fullName }; });
      if (!members.length) return null;
      if (typeof selfId !== 'undefined' && selfId){
        var real = members.find(function(m){ return m.id === selfId; });
        if (real) return real;
      }
      var storedId;
      try { storedId = localStorage.getItem('bnb-sched-self-member'); } catch(e){ storedId = null; }
      var match = members.find(function(m){ return m.id === storedId; });
      return match || members[0];
    },
    // Real logged-in identity, regardless of role (coach or member) — use
    // this when you specifically need "who is actually authenticated right
    // now," as opposed to getSignedInMember()'s broader legacy fallback.
    getSelf: function(){
      return users.find(function(u){ return u.id === selfId; }) || null;
    },
    // Read-only — used by the Coach Dashboard's Client Progress panel to
    // chart a member's logged weight/body-fat over their Assessment history.
    // Newest-first, same order the Assessment tab itself already uses.
    getAssessments: function(userId){ return userAssessments(userId); },
    // Read-only — buckets a member's check-ins into rolling 7-day windows
    // (not calendar weeks, to keep the math simple) for the Coach
    // Dashboard's Attendance marker. Returns oldest-first.
    getWeeklyVisitCounts: function(userId, numWeeks){
      numWeeks = numWeeks || 8;
      var dates = userCheckins(userId); // newest first
      var counts = new Array(numWeeks).fill(0);
      dates.forEach(function(d){
        var days = daysBetween(TODAY, d);
        if (days < 0) return;
        var bucket = Math.floor(days / 7);
        if (bucket < numWeeks) counts[numWeeks - 1 - bucket] += 1;
      });
      return counts;
    }
  };

  /* ---------------- INIT ---------------- */
  renderProfile();
  renderAdmin();
  refreshModeSwitchVisibility();
  // Members — Admin now lives inside the gym app's ADMIN tab (moved off
  // the old site-users Admin mode) — hook into the same onTabShown pattern
  // Schedule/Coach/Live Session already use so it re-renders on open.
  window.usersOnTabShown = renderAdmin;

})();
