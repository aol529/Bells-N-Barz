(function(){
  /* ============================================================
     PRE-SESSION SCREENING (sql/89)
     Before their first 1-on-1 a member fills in a health screening
     (PAR-Q style yes/no questions), goals and training history,
     lifestyle, an emergency contact, and signs the waiver by typing
     their name. Me > Screening shows it; booking a 1-on-1 without one
     opens it first (bnb-booking-coach.js). Their coach is notified,
     sees it in Users > Assessment, marks it reviewed, and it pre-fills
     the Initial Assessment. Behind the 'pre-session-screening' switch.

     Who sees what is enforced by RLS: the member, their coach
     (is_coach_for) and admins. parq_yes is worked out on the server.
     ============================================================ */
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function toast(msg){
    const t = document.getElementById('t-toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._scrTimer); t._scrTimer = setTimeout(()=> t.classList.remove('show'), 2600);
  }
  function fmtDate(iso){
    return new Date(iso).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
  }
  function self(){ return window.BNB_USERS && window.BNB_USERS.getSelf ? window.BNB_USERS.getSelf() : null; }
  function on(){ return !window.BNB_FEATURES || window.BNB_FEATURES.on('pre-session-screening'); }

  /* ---------------- QUESTIONS ---------------- */
  // PAR-Q ids start with parq_ — sql/89 counts any 'Yes' among them.
  const YN = ['Yes','No'];
  const QUESTIONS = [
    { section: 'A. Health check', note: 'Answer yes or no to each. A yes doesn’t stop you training — it means your coach plans around it, and you may need a note from your doctor first.' },
    { id:'parq_heart', label:'Has a doctor ever said you have a heart condition or high blood pressure?', type:'radio', options:YN, required:true },
    { id:'parq_chest', label:'Do you get chest pain at rest, during daily activities, or when you exercise?', type:'radio', options:YN, required:true },
    { id:'parq_balance', label:'In the past 12 months, have you lost your balance because of dizziness, or passed out?', type:'radio', options:YN, required:true },
    { id:'parq_condition', label:'Have you been diagnosed with any other long-term medical condition (e.g. diabetes, asthma, arthritis, epilepsy)?', type:'radio', options:YN, required:true },
    { id:'parq_meds', label:'Do you take prescribed medication for a long-term condition?', type:'radio', options:YN, required:true },
    { id:'parq_joint', label:'Do you have a bone, joint, muscle, ligament or tendon problem that could get worse with more activity?', type:'radio', options:YN, required:true },
    { id:'parq_supervised', label:'Has a doctor ever said you should only exercise under medical supervision?', type:'radio', options:YN, required:true },
    { id:'pregnant', label:'Are you pregnant, or have you given birth in the last 12 months?', type:'radio', options:['Yes','No','Prefer to discuss in person'] },
    { id:'parq_details', label:'If you answered yes to anything above, tell us more (what, when, and what your doctor said).', type:'text' },
    { section: 'B. Injuries and medication', note: 'Only you, your coach and the gym admin can see your answers.' },
    { id:'injuries_now', label:'Any pain or injuries right now? Where, and what makes it worse?', type:'text' },
    { id:'injuries_past', label:'Past injuries, surgeries or broken bones', type:'text' },
    { id:'medications', label:'Medication or supplements you take', type:'text' },
    { section: 'C. Goals and training' },
    { id:'goals', label:'What do you want from training? (tick all that apply)', type:'checks', options:['Lose fat','Build muscle','Get stronger','General fitness','Sport performance','Move without pain','Other'] },
    { id:'goal_details', label:'Tell us more — a target and a timeframe, if you have one', type:'text' },
    { id:'experience', label:'How much strength training have you done?', type:'radio', options:['None','Under a year','1–3 years','Over 3 years'] },
    { id:'current_activity', label:'What exercise do you do now? (type, days a week, how long)', type:'text' },
    { id:'avoid', label:'Anything you don’t want to do, or that hasn’t worked for you before?', type:'text' },
    { section: 'D. Lifestyle' },
    { id:'job_activity', label:'How active is your job?', type:'radio', options:['Mostly sitting','Lightly active','On my feet most of the day','Physically demanding'] },
    { id:'sleep', label:'Hours of sleep on a normal night', type:'number', min:0, max:16 },
    { id:'stress', label:'Stress level lately', type:'radio', options:['Low','Moderate','High'] },
    { id:'nutrition', label:'How do you eat on a normal day? (meals, water, anything you avoid)', type:'text' },
    { id:'availability', label:'When can you train? (days, times, how many times a week)', type:'line' },
    { section: 'E. Emergency contact' },
    { id:'ec_name', label:'Name', type:'line', required:true },
    { id:'ec_phone', label:'Phone', type:'line', required:true },
    { id:'ec_relation', label:'Relationship to you', type:'line' }
  ];
  const PARQ_IDS = QUESTIONS.filter(q=> q.id && q.id.indexOf('parq_') === 0 && q.type === 'radio').map(q=> q.id);

  // Bump the version whenever the wording changes — the member is asked
  // to sign again (Me > Screening shows "Sign the new waiver").
  const WAIVER_VERSION = '2026-10-31';
  const WAIVER = [
    'Strength training and exercise carry a risk of injury, including muscle strains, joint injuries and, rarely, heart problems. I take part by choice and accept these risks.',
    'The answers I have given in this screening are true and complete to the best of my knowledge. I will tell my coach straight away if my health changes, if I become pregnant, or if I feel pain, dizziness or chest discomfort while training.',
    'I will follow my coach’s instructions, use equipment as shown, and stop if I feel unwell. I understand my coach is not a doctor, and that I should get medical advice where this screening suggests it.',
    'I release Bells n Barz and its coaches and staff from claims for injury or loss arising from my training, except where caused by their negligence.',
    'In an emergency, I agree that the gym may contact my emergency contact and arrange medical help on my behalf.'
  ];

  function parqYesIds(a){ return PARQ_IDS.filter(id=> a && a[id] === 'Yes'); }
  function needsResign(row){ return !!row && row.waiver_version !== WAIVER_VERSION; }

  /* ---------------- DATA ---------------- */
  const cache = { mine: undefined, byMember: {}, visibleLoaded: false, error: '' };
  function changed(){ document.dispatchEvent(new CustomEvent('bnb-screening-change')); }

  async function loadMine(){
    const me = self();
    if (!me){ cache.mine = null; return null; }
    const { data, error } = await bnbClient.from('screenings').select('*').eq('member_id', me.id).maybeSingle();
    if (error){ console.error('Supabase load screening failed:', error); cache.error = error.message || 'Could not load your screening.'; return cache.mine || null; }
    cache.error = '';
    cache.mine = data || null;
    cache.byMember[me.id] = cache.mine;
    return cache.mine;
  }
  // Every screening this coach/admin may see (RLS filters it).
  async function loadVisible(){
    const { data, error } = await bnbClient.from('screenings').select('*');
    if (error){ console.error('Supabase load screenings failed:', error); return false; }
    cache.byMember = {};
    (data || []).forEach(r=>{ cache.byMember[r.member_id] = r; });
    cache.visibleLoaded = true;
    changed();
    return true;
  }
  async function loadFor(memberId){
    const { data, error } = await bnbClient.from('screenings').select('*').eq('member_id', memberId).maybeSingle();
    if (error){ console.error('Supabase load screening failed:', error); return cache.byMember[memberId] || null; }
    cache.byMember[memberId] = data || null;
    return cache.byMember[memberId];
  }
  async function save(answers, waiverName){
    const me = self();
    if (!me) throw new Error('Not signed in.');
    const { data, error } = await bnbClient.from('screenings')
      .upsert({ member_id: me.id, answers, waiver_name: waiverName, waiver_version: WAIVER_VERSION })
      .select('*').single();
    if (error) throw error;
    cache.mine = data;
    cache.byMember[me.id] = data;
    changed();
    return data;
  }
  async function review(memberId){
    const { error } = await bnbClient.rpc('review_screening', { p_member_id: memberId });
    if (error) throw error;
    await loadFor(memberId);
    changed();
  }

  /* ---------------- FORM ---------------- */
  function formHtml(a, signedName, formId){
    let n = 0;
    let html = '<form class="mp-form scr-form" id="' + formId + '" autocomplete="off" novalidate>';
    QUESTIONS.forEach(q=>{
      if (q.section){
        html += '<div class="mp-section-head">' + esc(q.section) + '</div>';
        if (q.note) html += '<div class="field-hint mp-section-note">' + esc(q.note) + '</div>';
        return;
      }
      n++;
      const fid = formId + '-' + q.id;
      html += '<div class="mp-q" data-scr-q="' + q.id + '"><label class="mp-q-label" for="' + fid + '">' + n + '. ' + esc(q.label) + (q.required ? ' <span class="scr-req" aria-hidden="true">*</span>' : '') + '</label>';
      if (q.type === 'text'){
        html += '<textarea class="mp-input" id="' + fid + '" name="' + q.id + '" rows="2" maxlength="1000">' + esc(a[q.id]) + '</textarea>';
      } else if (q.type === 'line'){
        html += '<input type="text" class="mp-input" id="' + fid + '" name="' + q.id + '" maxlength="200" value="' + esc(a[q.id]) + '">';
      } else if (q.type === 'number'){
        html += '<input type="number" class="mp-input mp-num" id="' + fid + '" name="' + q.id + '" min="' + q.min + '" max="' + q.max + '" step="0.5" value="' + esc(a[q.id]) + '">';
      } else {
        const multi = q.type === 'checks';
        const chosen = multi ? (a[q.id] || []) : [a[q.id]];
        html += '<div class="mp-choices" role="group" aria-label="' + esc(q.label) + '">';
        q.options.forEach(opt=>{
          html += '<label class="mp-choice"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + q.id + '" value="' + esc(opt) + '"' +
            (chosen.indexOf(opt) !== -1 ? ' checked' : '') + '> ' + esc(opt) + '</label>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '<div class="mp-section-head">F. Waiver</div>' +
      '<div class="scr-waiver">' + WAIVER.map(p=> '<p>' + esc(p) + '</p>').join('') + '</div>' +
      '<label class="scr-agree"><input type="checkbox" name="waiver_agree"> I have read and agree to the waiver above.</label>' +
      '<div class="mp-q" data-scr-q="waiver_name"><label class="mp-q-label" for="' + formId + '-waiver-name">Type your full name to sign <span class="scr-req" aria-hidden="true">*</span></label>' +
      '<input type="text" class="mp-input" id="' + formId + '-waiver-name" name="waiver_name" maxlength="120" value="' + esc(signedName) + '"></div>' +
      '<div class="scr-error" role="alert" hidden></div>' +
      '<div class="mp-actions"><button type="submit" class="btn2 primary">Sign and send to my coach</button>' +
      '<span class="field-hint" style="margin:0;">* required</span></div></form>';
    return html;
  }

  function readForm(form){
    const a = {};
    QUESTIONS.forEach(q=>{
      if (!q.id) return;
      if (q.type === 'checks'){
        a[q.id] = Array.from(form.querySelectorAll('input[name="' + q.id + '"]:checked')).map(x=> x.value);
      } else if (q.type === 'radio'){
        const c = form.querySelector('input[name="' + q.id + '"]:checked');
        a[q.id] = c ? c.value : '';
      } else {
        a[q.id] = form.querySelector('[name="' + q.id + '"]').value.trim();
      }
    });
    return a;
  }

  // Returns the first problem, or '' if the form can be sent.
  function validate(form, a){
    form.querySelectorAll('.scr-missing').forEach(el=> el.classList.remove('scr-missing'));
    const missing = QUESTIONS.filter(q=> q.required && !a[q.id]);
    const name = form.querySelector('[name="waiver_name"]').value.trim();
    if (name.length < 2) missing.push({ id:'waiver_name' });
    missing.forEach(q=>{ const el = form.querySelector('[data-scr-q="' + q.id + '"]'); if (el) el.classList.add('scr-missing'); });
    if (missing.length){
      const first = form.querySelector('[data-scr-q="' + missing[0].id + '"]');
      if (first) first.scrollIntoView({ block:'center', behavior:'smooth' });
      return 'Please answer the questions marked in red.';
    }
    if (!form.querySelector('[name="waiver_agree"]').checked) return 'Tick the box to agree to the waiver.';
    return '';
  }

  // Wires a rendered form; onSaved(row) runs after a successful save.
  function wireForm(form, onSaved){
    const err = form.querySelector('.scr-error');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const a = readForm(form);
      const problem = validate(form, a);
      if (problem){ err.textContent = problem; err.hidden = false; return; }
      err.hidden = true;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const row = await save(a, form.querySelector('[name="waiver_name"]').value.trim());
        toast('Screening sent — your coach has been told.');
        onSaved(row);
      } catch(ex){
        console.error('Saving screening failed:', ex);
        err.textContent = 'Could not send it — ' + (ex.message || 'check your connection and try again.');
        err.hidden = false;
      }
      btn.disabled = false;
    });
  }

  function prefill(row){
    if (row) return Object.assign({}, row.answers);
    const me = self() || {};
    return { ec_name: me.ecName || '', ec_phone: me.ecPhone || '', goal_details: me.goals || '', injuries_now: me.injury || '' };
  }

  /* ---------------- ANSWERS (read-only) ---------------- */
  function answersHtml(a){
    let n = 0, html = '<div class="mp-answers">';
    QUESTIONS.forEach(q=>{
      if (q.section){ html += '<div class="mp-section-head">' + esc(q.section) + '</div>'; return; }
      n++;
      const v = Array.isArray(a[q.id]) ? a[q.id].join(', ') : a[q.id];
      const flag = q.id.indexOf('parq_') === 0 && v === 'Yes';
      html += '<div class="mp-a' + (flag ? ' scr-yes' : '') + '"><div class="mp-a-q">' + n + '. ' + esc(q.label) + '</div>' +
        '<div class="mp-a-val' + (v ? '' : ' mp-empty') + '">' + (v ? esc(v) : 'Not answered') + '</div></div>';
    });
    return html + '</div>';
  }
  function signedLine(row){
    return 'Signed “' + esc(row.waiver_name) + '” on ' + esc(fmtDate(row.signed_at)) +
      (needsResign(row) ? ' — an older version of the waiver' : '');
  }
  const PARQ_NOTE = 'You answered yes to at least one health question. Please check with your doctor before you start, and bring any note they give you to your first session. Your coach will go through it with you.';

  /* ---------------- ME > SCREENING ---------------- */
  let memberMode = 'view';
  async function renderMember(){
    const body = document.getElementById('screening-body');
    if (!body) return;
    if (!on()){ body.innerHTML = '<div class="empty-msg">Pre-session screening is switched off.</div>'; return; }
    if (cache.mine === undefined){ body.innerHTML = '<div class="empty-msg">Loading…</div>'; await loadMine(); }
    const row = cache.mine;
    let html = '<div class="day-head"><h2>Pre-Session Screening</h2></div>';
    if (cache.error && !row){
      body.innerHTML = html + '<div class="admin-notice">Could not load your screening: ' + esc(cache.error) + '</div>';
      return;
    }
    if (!row || memberMode === 'edit'){
      html += '<div class="day-focus">' + (row ? 'Update your answers — your coach will be told.' : 'Fill this in before your first 1-on-1. It takes about 5 minutes.') + '</div>';
      html += formHtml(prefill(row), row ? row.waiver_name : ((self() || {}).fullName || ''), 'scr-me-form');
      if (row) html += '<div class="mp-actions"><button type="button" class="btn2" id="scr-me-cancel">Cancel</button></div>';
      body.innerHTML = html;
      wireForm(document.getElementById('scr-me-form'), ()=>{ memberMode = 'view'; renderMember(); window.scrollTo({ top:0 }); });
      const cancel = document.getElementById('scr-me-cancel');
      if (cancel) cancel.addEventListener('click', ()=>{ memberMode = 'view'; renderMember(); });
      return;
    }
    html += '<div class="day-focus">Sent ' + esc(fmtDate(row.submitted_at)) +
      (row.updated_at && fmtDate(row.updated_at) !== fmtDate(row.submitted_at) ? ' · updated ' + esc(fmtDate(row.updated_at)) : '') + '</div>';
    html += '<div class="scr-status">' +
      (row.reviewed_at ? '<span class="scr-badge ok">Reviewed by your coach · ' + esc(fmtDate(row.reviewed_at)) + '</span>'
                       : '<span class="scr-badge">Waiting for your coach to review</span>') +
      '<span class="field-hint" style="margin:0;">' + signedLine(row) + '</span></div>';
    if (row.parq_yes) html += '<div class="admin-notice scr-parq-note">' + PARQ_NOTE + '</div>';
    if (needsResign(row)) html += '<div class="admin-notice">The waiver has changed since you signed it. Please check your answers and sign the new version.</div>';
    html += '<div class="mp-actions"><button type="button" class="btn2' + (needsResign(row) ? ' primary' : '') + '" id="scr-me-edit">' + (needsResign(row) ? 'Sign the new waiver' : 'Update my answers') + '</button></div>';
    html += '<details class="mp-details"><summary>Your answers</summary>' + answersHtml(row.answers) + '</details>';
    body.innerHTML = html;
    document.getElementById('scr-me-edit').addEventListener('click', ()=>{ memberMode = 'edit'; renderMember(); });
  }

  /* ---------------- BOOKING GATE ---------------- */
  // Resolves true once the member has a current screening (already had
  // one, or just sent it), false if they closed the form. Always true
  // while the switch is off, or if the table can't be read (sql/89 not
  // run) — the gate never blocks booking because of our own failure.
  async function ensureBeforeBooking(){
    if (!on()) return true;
    const row = cache.mine === undefined ? await loadMine() : cache.mine;
    if (cache.error && !row) return true;
    if (row && !needsResign(row)) return true;
    return new Promise(resolve=>{
      const backdrop = document.getElementById('scr-panel-backdrop');
      const body = document.getElementById('scr-panel-body');
      if (!backdrop || !body){ resolve(true); return; }
      document.getElementById('scr-panel-sub').textContent = row
        ? 'The waiver has changed since you signed it — check your answers and sign again, then we’ll book your session.'
        : 'Before your first 1-on-1, your coach needs to know about your health, goals and any injuries. It takes about 5 minutes, and then we’ll book your session.';
      body.innerHTML = formHtml(prefill(row), row ? row.waiver_name : ((self() || {}).fullName || ''), 'scr-panel-form');
      let done = false;
      function close(ok){
        if (done) return;
        done = true;
        backdrop.classList.remove('show');
        body.innerHTML = '';
        backdrop.removeEventListener('click', onBackdrop);
        document.getElementById('scr-panel-cancel').removeEventListener('click', onCancel);
        resolve(ok);
      }
      function onBackdrop(e){ if (e.target === backdrop) close(false); }
      function onCancel(){ close(false); }
      wireForm(document.getElementById('scr-panel-form'), ()=>{ close(true); renderMember(); });
      backdrop.addEventListener('click', onBackdrop);
      document.getElementById('scr-panel-cancel').addEventListener('click', onCancel);
      backdrop.classList.add('show');
      backdrop.scrollTop = 0;
    });
  }

  /* ---------------- COACH SIDE ---------------- */
  // Short labels for the coach: PAR-Q yeses, pregnancy, injuries.
  const PARQ_SHORT = {
    parq_heart: 'Heart condition / high BP', parq_chest: 'Chest pain', parq_balance: 'Dizziness or fainting',
    parq_condition: 'Long-term condition', parq_meds: 'Prescribed medication', parq_joint: 'Bone/joint/soft-tissue problem',
    parq_supervised: 'Doctor says supervised only'
  };
  function flags(row){
    if (!row) return [];
    const a = row.answers || {};
    const out = parqYesIds(a).map(id=> PARQ_SHORT[id]);
    if (a.pregnant === 'Yes') out.push('Pregnant or recently gave birth');
    if (a.pregnant === 'Prefer to discuss in person') out.push('Wants to discuss pregnancy in person');
    if ((a.injuries_now || '').trim()) out.push('Current pain or injury');
    return out;
  }
  function get(memberId){ return cache.byMember[memberId] || null; }
  // For lists: 'none' (not sent), 'flag' (needs a look), 'new' (sent,
  // not reviewed), 'ok' (reviewed, nothing flagged).
  function status(memberId){
    const row = get(memberId);
    if (!row) return 'none';
    if (row.parq_yes && !row.reviewed_at) return 'flag';
    return row.reviewed_at ? 'ok' : 'new';
  }

  // The block at the top of Users > Assessment.
  function coachPanelHtml(memberId){
    if (!on()) return '';
    const row = get(memberId);
    if (!row){
      return '<div class="scr-coach"><div class="scr-coach-head"><b>Pre-session screening</b><span class="scr-badge warn">Not sent yet</span></div>' +
        '<div class="field-hint" style="margin:0;">They’ll be asked to fill it in when they book their first 1-on-1, or from Me &gt; Screening.</div></div>';
    }
    const fl = flags(row);
    const reviewer = row.reviewed_by && window.BNB_USERS ? window.BNB_USERS.getName(row.reviewed_by) : '';
    return '<div class="scr-coach">' +
      '<div class="scr-coach-head"><b>Pre-session screening</b>' +
        (row.reviewed_at ? '<span class="scr-badge ok">Reviewed' + (reviewer ? ' by ' + esc(reviewer) : '') + ' · ' + esc(fmtDate(row.reviewed_at)) + '</span>'
                         : '<span class="scr-badge' + (row.parq_yes ? ' warn' : '') + '">Not reviewed</span>') + '</div>' +
      '<div class="field-hint" style="margin:0 0 8px;">Sent ' + esc(fmtDate(row.submitted_at)) + ' · updated ' + esc(fmtDate(row.updated_at)) + ' · ' + signedLine(row) + '</div>' +
      (fl.length ? '<div class="a-flags">' + fl.map(f=> '<span class="a-flag warn">' + esc(f) + '</span>').join('') + '</div>' : '<div class="field-hint" style="margin:0 0 8px;">No health flags.</div>') +
      (row.parq_yes ? '<div class="scr-coach-note">Answered yes to a health question: check whether they need a doctor’s clearance before training hard.</div>' : '') +
      '<div class="scr-coach-actions">' +
        (row.reviewed_at ? '' : '<button type="button" class="btn2 primary small" data-scr-review="' + esc(memberId) + '">Mark reviewed</button>') +
        '<button type="button" class="btn2 small" data-scr-toggle>Show answers</button>' +
      '</div>' +
      '<div class="scr-coach-answers sched-scope" hidden>' + answersHtml(row.answers) + '</div>' +
      '</div>';
  }
  function wireCoachPanel(container, memberId, rerender){
    const t = container.querySelector('[data-scr-toggle]');
    if (t) t.addEventListener('click', ()=>{
      const box = container.querySelector('.scr-coach-answers');
      box.hidden = !box.hidden;
      t.textContent = box.hidden ? 'Show answers' : 'Hide answers';
    });
    const r = container.querySelector('[data-scr-review]');
    if (r) r.addEventListener('click', async ()=>{
      r.disabled = true;
      try { await review(memberId); toast('Screening marked reviewed.'); rerender(); }
      catch(ex){ r.disabled = false; toast(ex.message || 'Could not mark it reviewed.'); }
    });
  }

  // Values for the coach's Log Initial Assessment form (users.js ids).
  const JOB_TO_OCC = { 'Mostly sitting':'sedentary', 'Lightly active':'light', 'On my feet most of the day':'active', 'Physically demanding':'physical' };
  function assessmentPrefill(memberId){
    const row = get(memberId);
    if (!row) return null;
    const a = row.answers || {};
    const yes = parqYesIds(a);
    const lines = (pairs)=> pairs.filter(p=> (p[1] || '').trim()).map(p=> p[0] + ': ' + p[1].trim()).join('\n');
    return {
      parqCardio: yes.some(id=> ['parq_heart','parq_chest','parq_balance'].indexOf(id) !== -1),
      parqJoint: yes.indexOf('parq_joint') !== -1,
      parqClearance: yes.length > 0,
      medical: lines([
        ['Health question yes', yes.map(id=> PARQ_SHORT[id]).join(', ')],
        ['Details', a.parq_details], ['Pregnancy', a.pregnant === 'No' ? '' : a.pregnant],
        ['Current pain/injury', a.injuries_now], ['Past injuries/surgery', a.injuries_past], ['Medication', a.medications]
      ]),
      goals: lines([['Goals', (a.goals || []).join(', ')], ['Details', a.goal_details]]),
      history: lines([['Experience', a.experience], ['Now', a.current_activity], ['Avoid', a.avoid]]),
      occActivity: JOB_TO_OCC[a.job_activity] || '',
      sleep: a.sleep || '',
      stress: (a.stress || '').toLowerCase(),
      nutrition: a.nutrition || '',
      availability: a.availability || '',
      waiver: !needsResign(row)
    };
  }

  // Member pages: re-render when the section is opened or the user changes.
  window.bnbScreeningOnShown = function(){ memberMode = 'view'; cache.mine = undefined; renderMember(); };
  document.addEventListener('bnb-auth-changed', ()=>{ cache.mine = undefined; cache.byMember = {}; cache.visibleLoaded = false; });
  document.addEventListener('bnb-features-change', ()=>{ if (document.getElementById('tab-screening') && document.getElementById('tab-screening').classList.contains('active')) renderMember(); });

  window.BNB_SCREENING = {
    on, loadMine, loadVisible, loadFor, get, status, flags,
    visibleLoaded: ()=> cache.visibleLoaded,
    ensureBeforeBooking, coachPanelHtml, wireCoachPanel, assessmentPrefill
  };
})();
