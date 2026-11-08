
/* =========================================================================
   BELL(E)S N' BARZ — PROGRAM DATA / ADMIN CRUD / LOGSHEET / PDF+ODT EXPORT
   ========================================================================= */
(function(){

  const DEFAULT_PROGRAM = {"mon": [{"name": "Block A", "exercises": [{"name": "Incline Barbell Bench Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}, {"name": "Chest Supported Dumbbell Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}]}, {"name": "Block B", "exercises": [{"name": "Decline Dumbbell Bench Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10"}, {"name": "T-Bar Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10"}]}, {"name": "Block C", "exercises": [{"name": "Flat Dumbbell Bench Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10"}, {"name": "Barbell Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "8\u201310"}]}, {"name": "Block D", "exercises": [{"name": "Cable Flyes", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Single-Arm Dumbbell Row", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /side"}]}], "tue": [{"name": "Block A", "exercises": [{"name": "Heel Elevated Goblet Squats (later Zercher Squats)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}, {"name": "Sumo Squats", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block B", "exercises": [{"name": "Landmine Static Split Squats (or Walking Lunges)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}, {"name": "Leg Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block C", "exercises": [{"name": "Pendulum Leg Press", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Cossack Squats", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}]}, {"name": "Block DNew \u2014 v2.8", "exercises": [{"name": "Seated Dumbbell Hip Adduction", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}, {"name": "Standing Cable Hip Flexion", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block E", "exercises": [{"name": "Copenhagen Plank", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "20\u201330 sec /side"}, {"name": "Lying Leg Curls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "12\u201315"}]}, {"name": "Block F \u2014 Accessory", "exercises": [{"name": "Standing Calf Raises", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15\u201320"}]}], "wed": [], "thu": [{"name": "Block A", "exercises": [{"name": "Military Press (alt: Arnold Press)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "6\u20138"}, {"name": "Curls \u2014 E-Z Bar Standing / Incline Bench (alternate variations)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block B", "exercises": [{"name": "Shrugs", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block C", "exercises": [{"name": "Lateral Flyes", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Front Raises (alt: High Rows)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block D", "exercises": [{"name": "Weighted Pull-ups (alt: Weighted Chin-ups)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "6\u20138"}, {"name": "Lateral Raises", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block E", "exercises": [{"name": "Wide Cable Lat Pulldowns", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}, {"name": "Rear Delt Flyes", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block F", "exercises": [{"name": "Pullovers (alt: Straight-arm Pulldowns)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}, {"name": "Face Pulls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}], "fri": [{"name": "Block A", "exercises": [{"name": "Romanian Deadlifts", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "8\u201310"}, {"name": "Reverse Lunges (alt: Bulgarian Split Squats)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}]}, {"name": "Block B", "exercises": [{"name": "Hip Thrusts (alt: Stiff Leg Deadlifts)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "10"}, {"name": "Leg Curls \u2014 Lying / Standing / Seated (alternate variations)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}, {"name": "Block C", "exercises": [{"name": "Step Ups", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10 /leg"}, {"name": "Hip Abductions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}]}, {"name": "Block D", "exercises": [{"name": "Nordic Curls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "4", "reps": "3\u20135"}, {"name": "Seated Calf Raises", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15\u201320"}]}, {"name": "Block E", "exercises": [{"name": "Back Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12\u201315"}]}], "sat": [{"name": "Block A", "exercises": [{"name": "Push-ups", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15\u201320"}, {"name": "Dips (alt: Bench Dips)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block B", "exercises": [{"name": "Overhead Tricep Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "12"}, {"name": "Spider Curls (alt: Preacher Curls)", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}, {"name": "Block C", "exercises": [{"name": "Cable Tricep Kickbacks", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "15"}, {"name": "Incline Bench Curls", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "3", "reps": "10\u201312"}]}], "sun": [{"name": "Movement Practice", "exercises": [{"name": "Deep Squat Hold", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "", "reps": "90 sec"}, {"name": "Dead Hang", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "", "reps": "60\u201390 sec"}]}, {"name": "Core Finisher (New \u2014 v1.6.1)", "exercises": [{"name": "Cable Crunches", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "10\u201312"}, {"name": "Back Extensions", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "10\u201312"}, {"name": "Cable Side Bends", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "2", "reps": "10\u201312 /side"}]}, {"name": "Breath Work", "exercises": [{"name": "Box Breathing", "rest": "", "tempo": "", "equipment": "", "alternates": "", "sets": "", "reps": "\u2014"}]}]};
  const DAY_META = {"mon": {"title": "Monday \u2014 Rows & Bench Presses", "duration": "~80 min", "hold": "Dead Hang"}, "tue": {"title": "Tuesday \u2014 Quads, Adductors & Hip Flexors", "duration": "~80 min", "hold": "Horse Stance"}, "wed": {"title": "Wednesday \u2014 Rest", "duration": "Rest Day", "hold": "\u2014"}, "thu": {"title": "Thursday \u2014 Vertical Push & Pull", "duration": "~65 min", "hold": "Scapular Hang"}, "fri": {"title": "Friday \u2014 Glutes, Hamstrings & Low Back", "duration": "~60 min", "hold": "Single-Leg Glute Bridge Hold"}, "sat": {"title": "Saturday \u2014 Chest & Arms", "duration": "~50 min", "hold": "Push-up Plank Hold"}, "sun": {"title": "Sunday \u2014 Recovery", "duration": "~35 min", "hold": "Box Breathing"}};
  const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"];
  const PROGRAM_KEY = "bnb-perform-program-v1";

  function clone(o){ return JSON.parse(JSON.stringify(o)); }

  let programRowId = null; // the Supabase row id for this user's program, once known

  function loadProgram(){
    // Instant start with the built-in default; real saved program replaces
    // it once refreshProgramFromSupabase() responds (see below).
    return clone(DEFAULT_PROGRAM);
  }
  // Runs at load and again on every sign-in / sign-out ('bnb-auth-changed'
  // from js/bells-n-barz-users.js): at load the signed-in person usually
  // isn't known yet, so that first call alone would leave the default
  // program showing. Signed out: back to the default.
  async function refreshProgramFromSupabase(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){
      if (programRowId){ programRowId = null; programData = clone(DEFAULT_PROGRAM); rerenderProgramViews(); }
      return;
    }
    const { data, error } = await bnbClient.from('programs').select('*').eq('owner_id', me.id);
    if (error) { console.error('Supabase load programs failed:', error); return; }
    if (data && data.length){
      programRowId = data[0].id;
      programData = data[0].data;
      rerenderProgramViews();
    }
  }
  // Everything drawn from programData: the Manual's day pages, Today's
  // Program, and both Live Sessions.
  function rerenderProgramViews(){
    renderAllPerform();
    renderTodayProgram();
    renderMlsDay();
    if (typeof window.bnbCoachRerender === 'function') window.bnbCoachRerender(); // coach Live Session (staff.html)
    if (typeof window.bnbMemberTodayRender === 'function') window.bnbMemberTodayRender();
  }
  document.addEventListener('bnb-auth-changed', refreshProgramFromSupabase);
  function saveProgram(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // guest / nobody logged in — local-only for this session
    (async () => {
      try {
        const row = { owner_id: me.id, name: 'Default Program', data: programData, updated_at: new Date().toISOString() };
        if (programRowId) row.id = programRowId;
        const { data, error } = await bnbClient.from('programs').upsert([row], { onConflict: 'owner_id' }).select();
        if (error) throw error;
        if (data && data[0]) programRowId = data[0].id;
      } catch(e){
        console.warn('Supabase save programs failed:', e);
      }
    })();
  }

  let programData = loadProgram();
  refreshProgramFromSupabase(); // async — replaces default start once Supabase responds

  function ytLink(name){
    const clean = name.split('(')[0].trim();
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(clean + ' exercise tutorial');
  }

  function prescString(ex){
    if (ex.sets && ex.reps) return ex.sets + ' × ' + ex.reps;
    if (ex.reps) return ex.reps;
    if (ex.sets) return ex.sets + ' sets';
    return '';
  }

  function metaLine(ex){
    const parts = [];
    if (ex.load) parts.push('Load ' + ex.load);
    if (ex.rest) parts.push('Rest ' + ex.rest);
    if (ex.tempo) parts.push('Tempo ' + ex.tempo);
    if (ex.equipment) parts.push('Equip: ' + ex.equipment);
    if (ex.alternates) parts.push('Alt: ' + ex.alternates);
    return parts.join(' &nbsp;•&nbsp; ');
  }

  /* ---------------- RENDER: PERFORM BLOCKS (Mon–Sun tabs) ---------------- */
  function renderPerform(day){
    const container = document.querySelector('.perform-render[data-day="' + day + '"]');
    if (!container) return;
    container.innerHTML = dayStatsLine(programData[day]);
    const blocks = (programData[day] || []);
    blocks.forEach(block => {
      const table = document.createElement('table');
      table.className = 'block';
      const cap = document.createElement('caption');
      cap.textContent = block.name;
      table.appendChild(cap);
      block.exercises.forEach(ex => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        const a = document.createElement('a');
        a.href = ytLink(ex.name);
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = ex.name;
        tdName.appendChild(a);
        const ml = metaLine(ex);
        if (ml){
          const small = document.createElement('div');
          small.className = 'mono';
          small.style.cssText = 'font-size:11px;color:var(--muted);margin-top:3px;';
          small.innerHTML = ml;
          tdName.appendChild(small);
        }
        const tdPresc = document.createElement('td');
        tdPresc.textContent = prescString(ex);
        tr.appendChild(tdName); tr.appendChild(tdPresc);
        table.appendChild(tr);
      });
      container.appendChild(table);
    });
  }
  function renderAllPerform(){ DAY_ORDER.forEach(renderPerform); }

  // Today's Program preview on Overview (phone-width only, see CSS) — the
  // same block/exercise data and rendering the weekday tabs use via
  // renderPerform, just targeting a dedicated container instead of the
  // per-weekday .perform-render element (renderPerform's own querySelector
  // only ever finds the first match for a given day, so a second copy of
  // that same [data-day] element couldn't coexist with the real one).
  function renderTodayProgram(){
    const titleEl = document.getElementById('overview-today-title');
    const blocksEl = document.getElementById('overview-today-blocks');
    const viewFullEl = document.getElementById('overview-today-viewfull');
    if (!titleEl || !blocksEl) return;

    const idx = new Date().getDay(); // 0=Sun..6=Sat
    const todayKey = DAY_ORDER[idx === 0 ? 6 : idx - 1];
    const meta = DAY_META[todayKey];

    titleEl.textContent = 'Today — ' + meta.title.split('—')[1].trim() + ' (' + meta.duration + ')';
    if (viewFullEl) viewFullEl.onclick = (e) => { e.preventDefault(); if (typeof switchTab === 'function') switchTab(todayKey); };

    const blocks = programData[todayKey] || [];
    blocksEl.innerHTML = dayStatsLine(blocks);
    if (!blocks.length){
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--muted);font-size:14px;';
      p.textContent = 'Rest day — no Perform blocks scheduled.';
      blocksEl.appendChild(p);
      return;
    }
    blocks.forEach(block => {
      const table = document.createElement('table');
      table.className = 'block';
      const cap = document.createElement('caption');
      cap.textContent = block.name;
      table.appendChild(cap);
      block.exercises.forEach(ex => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        const a = document.createElement('a');
        a.href = ytLink(ex.name);
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = ex.name;
        tdName.appendChild(a);
        const tdPresc = document.createElement('td');
        tdPresc.textContent = prescString(ex);
        tr.appendChild(tdName); tr.appendChild(tdPresc);
        table.appendChild(tr);
      });
      blocksEl.appendChild(table);
    });
  }

  function esc(s){
    return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  /* ============================== LOGSHEET =============================== */
  /* ------------------------------- PDF EXPORT ------------------------------ */
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  let jsPdfLoaded = false;
  async function ensureJsPdf(){
    if (jsPdfLoaded || (window.jspdf && window.jspdf.jsPDF)) { jsPdfLoaded = true; return; }
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    jsPdfLoaded = true;
  }

  /* jsPDF's built-in fonts (Helvetica/Courier/Times) only support WinAnsi
     encoding — there's no ★ glyph, so doc.text('★ ...') silently substitutes
     the wrong character (renders as '&'). Draw an actual 5-point star as a
     small filled vector instead, so it's guaranteed correct regardless of
     font/encoding. Returns the x-position where text should resume. */
  function drawPdfStar(doc, x, yBaseline, color, size){
    size = size || 5;
    const cx = x + size, cy = yBaseline - size*0.62;
    const outerR = size, innerR = size * 0.42;
    const pts = [];
    for (let i=0;i<10;i++){
      const angle = (Math.PI/5)*i - Math.PI/2;
      const r = i%2===0 ? outerR : innerR;
      pts.push([cx + r*Math.cos(angle), cy + r*Math.sin(angle)]);
    }
    const deltas = [];
    for (let i=1;i<pts.length;i++) deltas.push([pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]]);
    doc.setFillColor(...color);
    doc.lines(deltas, pts[0][0], pts[0][1], [1,1], 'F', true);
    return x + size*2 + 6;
  }

  /* Renders one exercise's sets as a row of small chips instead of a single
     monospace bracket string. Each chip is a dot (filled = logged, hollow =
     not done) plus a wt × reps label. A set that's checked done but is
     missing weight or reps gets a rust underline so it reads as flagged at a
     glance, rather than looking identical to a fully-logged set. Wraps to a
     new line if it would run past the right margin. Returns the y position
     after the row. */
  function drawPdfSetChips(doc, sets, startX, startY, rightEdge, colors){
    const dotR = 2.6;
    let sx = startX, y = startY;
    sets.forEach(s=>{
      const notDone = !s.done;
      const flagged = s.done && (!s.wt || !s.reps);
      const color = notDone ? colors.muted : (flagged ? colors.rust : colors.green);
      const label = (s.wt || '\u2014') + ' \u00d7 ' + (s.reps || '\u2014');
      doc.setFont('helvetica', flagged ? 'bold' : 'normal'); doc.setFontSize(9);
      const w = doc.getTextWidth(label);
      const chipW = dotR*2 + 4 + w + 14;
      if (sx + chipW - 14 > rightEdge){ sx = startX; y += 15; }
      doc.setFillColor(...color); doc.setDrawColor(...color);
      doc.circle(sx + dotR, y - dotR*0.9, dotR, notDone ? 'S' : 'F');
      sx += dotR*2 + 4;
      doc.setTextColor(...color);
      doc.text(label, sx, y);
      if (flagged){
        doc.setDrawColor(...colors.rust); doc.setLineWidth(0.6);
        doc.line(sx, y+2, sx+w, y+2);
      }
      sx += w + 14;
    });
    return y;
  }

  /* ------------------------------- ODT EXPORT ------------------------------ */
  let jsZipLoaded = false;
  async function ensureJsZip(){
    if (jsZipLoaded || window.JSZip) { jsZipLoaded = true; return; }
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    jsZipLoaded = true;
  }

  function xmlEsc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function buildOdtContentXml(snap){
    let body = '';
    body += `<text:h text:style-name="Title">${xmlEsc(snap.title)}</text:h>`;
    body += `<text:p text:style-name="Sub">${xmlEsc(snap.duration)}  ·  Date: ${xmlEsc(snap.date||'____________')}  ·  Bodyweight: ${xmlEsc(snap.bw||'______')}</text:p>`;
    snap.blocks.forEach(block=>{
      body += `<text:h text:style-name="BlockHead">${xmlEsc(block.name.toUpperCase())}</text:h>`;
      block.exercises.forEach(ex=>{
        body += `<text:p text:style-name="ExName">${xmlEsc(ex.name)}  —  ${xmlEsc(ex.presc)}</text:p>`;
        if (ex.meta) body += `<text:p text:style-name="ExMeta">${xmlEsc(ex.meta)}</text:p>`;
        const line = ex.sets.map((s,i)=> 'Set '+(i+1)+' ['+(s.done?'X':' ')+']  Wt: '+(s.wt||'____')+'  Reps: '+(s.reps||'____')).join('   |   ');
        body += `<text:p text:style-name="SetLine">${xmlEsc(line)}</text:p>`;
      });
    });
    body += `<text:h text:style-name="BlockHead">SIGNATURE HOLD</text:h>`;
    body += `<text:p text:style-name="ExName">${xmlEsc(snap.hold)}</text:p>`;
    body += `<text:h text:style-name="BlockHead">SESSION NOTES / RPE</text:h>`;
    body += `<text:p text:style-name="ExMeta">${xmlEsc(snap.notes || '(none logged)')}</text:p>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="Title" style:family="paragraph"><style:text-properties fo:font-weight="bold" fo:font-size="20pt"/></style:style>
    <style:style style:name="Sub" style:family="paragraph"><style:text-properties fo:font-size="10pt" fo:color="#6b6355"/></style:style>
    <style:style style:name="BlockHead" style:family="paragraph"><style:text-properties fo:font-weight="bold" fo:font-size="12pt" fo:color="#8a7350"/></style:style>
    <style:style style:name="ExName" style:family="paragraph"><style:text-properties fo:font-weight="bold" fo:font-size="11pt"/></style:style>
    <style:style style:name="ExMeta" style:family="paragraph"><style:text-properties fo:font-style="italic" fo:font-size="9pt" fo:color="#6b6355"/></style:style>
    <style:style style:name="SetLine" style:family="paragraph"><style:text-properties fo:font-family="Courier New" fo:font-size="9pt"/></style:style>
  </office:automatic-styles>
  <office:body><office:text>${body}</office:text></office:body>
</office:document-content>`;
  }

  /* ---- Freeform: start from the program, swap via alternatives ----
     Freeform opens with the day's program exercises already listed (the
     "general idea"), each with blank sets matching its prescription. Next to
     every name is a small ⇄ dropdown: the program exercise first, then its
     known alternatives — the program's own Alternates field, any "(alt: …)"
     in the name, and the movement family below. Families are checked in
     order, so the more specific ones (decline press, leg curl, split squat)
     sit above the general ones (bench press, curl, squat). */
  const EXERCISE_FAMILIES = [
    [/decline[\w\s-]*\b(bench|press)\b/, ['Decline Barbell Bench Press', 'Decline Dumbbell Press', 'Decline Smith Machine Press', 'Decline Machine Press', 'Chest Dips', 'High-to-Low Cable Fly']],
    [/incline[\w\s-]*\bpress\b/, ['Incline Barbell Bench Press', 'Incline Dumbbell Press', 'Incline Smith Machine Press', 'Incline Machine Press', 'Low-to-High Cable Fly', 'Landmine Press']],
    [/close.?grip/, ['Close-Grip Bench Press', 'Close-Grip Smith Machine Press', 'JM Press', 'Diamond Push-up', 'Parallel Bar Dips']],
    [/bench press|chest press|floor press/, ['Barbell Bench Press', 'Dumbbell Bench Press', 'Smith Machine Bench Press', 'Machine Chest Press', 'Floor Press', 'Push-up']],
    [/rear delt|reverse fl|face pull|pull.?apart/, ['Rear Delt Dumbbell Fly', 'Reverse Pec Deck', 'Cable Rear Delt Fly', 'Face Pull', 'Band Pull-Apart']],
    [/lateral (raise|fl)/, ['Dumbbell Lateral Raise', 'Cable Lateral Raise', 'Machine Lateral Raise', 'Lean-Away Lateral Raise']],
    [/\bfl(y|ies|yes)\b|cross ?over|pec deck/, ['Cable Fly', 'Dumbbell Fly', 'Pec Deck', 'Cable Crossover', 'Svend Press']],
    [/push.?ups?\b/, ['Push-up', 'Knee Push-up', 'Incline Push-up', 'Decline Push-up', 'Weighted Push-up']],
    [/\bdips?\b/, ['Parallel Bar Dips', 'Assisted Dip Machine', 'Bench Dips', 'Weighted Dips']],
    [/upright row/, ['Barbell Upright Row', 'Cable Upright Row', 'Dumbbell Upright Row', 'Dumbbell Lateral Raise']],
    [/(single|one).?arm[\w\s-]*row/, ['Single-Arm Dumbbell Row', 'Single-Arm Cable Row', 'Kroc Row', 'Meadows Row']],
    [/\brows?\b/, ['Barbell Row', 'Dumbbell Row', 'Chest-Supported Dumbbell Row', 'Seated Cable Row', 'T-Bar Row', 'Machine Row', 'Pendlay Row', 'Inverted Row']],
    [/pullover|straight.?arm/, ['Dumbbell Pullover', 'Straight-Arm Cable Pulldown', 'Machine Pullover', 'Rope Pullover']],
    [/pull.?ups?\b|chin.?ups?\b|chinups|pulldown/, ['Pull-up', 'Chin-up', 'Weighted Pull-up', 'Assisted Pull-up', 'Wide-Grip Lat Pulldown', 'Close-Grip Lat Pulldown', 'Single-Arm Lat Pulldown']],
    [/military press|overhead press|shoulder press|arnold|behind the neck|scott press|vertical push/, ['Standing Military Press', 'Seated Dumbbell Shoulder Press', 'Arnold Press', 'Machine Shoulder Press', 'Landmine Press', 'Push Press']],
    [/front raise/, ['Dumbbell Front Raise', 'Cable Front Raise', 'Plate Front Raise', 'Barbell Front Raise']],
    [/shrug/, ['Barbell Shrug', 'Dumbbell Shrug', 'Trap Bar Shrug', 'Cable Shrug', 'Smith Machine Shrug']],
    [/leg curl|hamstring curl|nordic/, ['Lying Leg Curl', 'Seated Leg Curl', 'Standing Leg Curl', 'Nordic Curl', 'Stability Ball Leg Curl', 'Sliding Leg Curl']],
    [/wrist curl|wrist roller/, ['Barbell Wrist Curl', 'Dumbbell Wrist Curl', 'Reverse Wrist Curl', 'Wrist Roller']],
    [/hammer|reverse curl/, ['Hammer Curl', 'Rope Hammer Curl', 'Cross-Body Hammer Curl', 'Reverse EZ-Bar Curl']],
    [/preacher|spider|concentration/, ['Preacher Curl', 'Machine Preacher Curl', 'Spider Curl', 'Concentration Curl']],
    [/\bcurls?\b/, ['Barbell Curl', 'EZ-Bar Curl', 'Dumbbell Curl', 'Incline Dumbbell Curl', 'Cable Curl', 'Preacher Curl', 'Hammer Curl']],
    [/skull|french press|extension.*tricep|tricep.*extension|overhead[\w\s-]*extension/, ['Overhead Dumbbell Extension', 'Overhead Cable Extension', 'EZ-Bar Skull Crusher', 'Dumbbell Skull Crusher', 'French Press']],
    [/pushdown|kickback/, ['Rope Pushdown', 'Straight-Bar Pushdown', 'Reverse-Grip Pushdown', 'Cable Kickback', 'Dumbbell Kickback']],
    [/split squat|lunge|step.?ups?\b|stepup/, ['Bulgarian Split Squat', 'Static Split Squat', 'Walking Lunge', 'Reverse Lunge', 'Step-up', 'Landmine Split Squat']],
    [/leg press/, ['Leg Press', 'Pendulum Squat', 'Hack Squat', 'Belt Squat', 'Smith Machine Squat']],
    [/squat/, ['Back Squat', 'Front Squat', 'Goblet Squat', 'Hack Squat', 'Smith Machine Squat', 'Zercher Squat', 'Leg Press']],
    [/leg extension/, ['Leg Extension', 'Single-Leg Extension', 'Sissy Squat', 'Reverse Nordic', 'Spanish Squat']],
    [/romanian|stiff.?leg|straight.?leg deadlift|good morning|\brdl\b/, ['Romanian Deadlift', 'Dumbbell Romanian Deadlift', 'Stiff-Leg Deadlift', 'Single-Leg Romanian Deadlift', 'Good Morning', 'Cable Pull-Through']],
    [/deadlift/, ['Conventional Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift', 'Rack Pull', 'Deficit Deadlift']],
    [/hip thrust|glute bridge|hip raise/, ['Barbell Hip Thrust', 'Smith Machine Hip Thrust', 'Machine Hip Thrust', 'Single-Leg Hip Thrust', 'Glute Bridge', 'Cable Pull-Through']],
    [/abduct/, ['Machine Hip Abduction', 'Cable Hip Abduction', 'Banded Lateral Walk', 'Side-Lying Leg Raise']],
    [/adduct|copenhagen/, ['Machine Hip Adduction', 'Seated Dumbbell Hip Adduction', 'Cable Hip Adduction', 'Copenhagen Plank']],
    [/calf|calves/, ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise', 'Smith Machine Calf Raise', 'Single-Leg Calf Raise', 'Donkey Calf Raise']],
    [/back extension|hyperextension/, ['45° Back Extension', 'Reverse Hyperextension', 'Good Morning', 'Bird Dog']],
    [/crunch/, ['Cable Crunch', 'Machine Crunch', 'Decline Crunch', 'Ab Wheel Rollout']],
    [/leg raise|knee.?ups?\b|knee raise/, ['Hanging Leg Raise', 'Hanging Knee Raise', "Captain's Chair Knee Raise", 'Lying Leg Raise', 'Reverse Crunch']],
    [/side bend/, ['Cable Side Bend', 'Dumbbell Side Bend', 'Suitcase Carry', 'Pallof Press']],
    [/plank/, ['Front Plank', 'Side Plank', 'RKC Plank', 'Ab Wheel Rollout', 'Dead Bug']],
    [/hip flex/, ['Standing Cable Hip Flexion', 'Hanging Knee Raise', 'Banded Psoas March', 'Lying Leg Raise']]
  ];
  const ALT_IN_NAME = /\s*\((?:alt|or)[:.]?\s+([^)]+)\)/i;

  // "Military Press (alt: Arnold Press)" → name "Military Press", alts ["Arnold Press"].
  function splitAltFromName(name){
    const m = String(name || '').match(ALT_IN_NAME);
    if (!m) return { name: String(name || '').trim(), alts: [] };
    return { name: String(name).replace(ALT_IN_NAME, '').trim(), alts: m[1].split(/\s*[\/,]\s*/).filter(Boolean) };
  }

  // The program's free-text Alternates field, when it's a list of named
  // exercises (not "Coach picks any …" guidance).
  function namedAlternates(text){
    const t = String(text || '').trim();
    if (!t || /\b(any|coach|choose|picks?)\b/i.test(t)) return [];
    return t.split(/\s*,\s*/).filter(s => s && s.length <= 60);
  }
  function exerciseAlternatives(base, programAlts){
    const { name, alts } = splitAltFromName(base);
    const plain = name.toLowerCase().replace(/\([^)]*\)/g, ' ');
    const family = (/\b(hold|hang|breath|breathing|stretch|mobility)\b/.test(plain) ? null
      : EXERCISE_FAMILIES.find(([re]) => re.test(plain)));
    const out = [], seen = new Set();
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e?s$/, '');
    [name, ...alts, ...namedAlternates(programAlts), ...(family ? family[1] : [])].forEach(n => {
      const k = norm(n);
      if (n && k && !seen.has(k)){ seen.add(k); out.push(n); }
    });
    return out;
  }

  // A day's program as a freeform list: one entry per exercise, sets left
  // blank to match the prescription. base/baseAlts keep the dropdown's list
  // fixed to the program exercise even after it's been swapped. swapOf(b, e)
  // returns any swap already picked in Program mode for that log, so a
  // switch to Freeform keeps it; seed is the name it started with.
  function freeformFromProgram(day, swapOf){
    const list = [];
    (programData[day] || []).forEach((block, bIdx) => (block.exercises || []).forEach((ex, eIdx) => {
      if (!ex || !String(ex.name || '').trim()) return;
      const nSets = Math.min(parseInt(ex.sets, 10) || 3, 10);
      const start = (swapOf && swapOf(bIdx, eIdx)) || splitAltFromName(ex.name).name;
      const tok = blockToken(block.name);
      const sep = /^\d/.test(tok) ? '.' : '';
      list.push({
        name: start, seed: start,
        base: ex.name, baseAlts: ex.alternates || '', presc: prescString(ex),
        group: block.name || '', label: tok ? tok + sep + (eIdx + 1) : '',
        sets: Array.from({ length: nSets }, () => ({ wt:'', reps:'', done:false }))
      });
    }));
    return list;
  }

  /* The ⇄ dropdown: a compact icon with a native <select> laid over it, so
     phones get their own picker. Returns null when there's nothing to pick. */
  function buildAltPicker(ex, onPick){
    const opts = exerciseAlternatives(ex.base || ex.name, ex.baseAlts);
    if (opts.length < 2) return null;
    const wrap = document.createElement('label');
    wrap.className = 'ff-alt';
    wrap.title = 'Swap for an alternative';
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Alternatives for ' + (ex.name || 'this exercise'));
    const cur = (ex.name || '').trim();
    if (cur && !opts.some(o => o.toLowerCase() === cur.toLowerCase())){
      sel.add(new Option(cur + ' (current)', cur, true, true));
    }
    opts.forEach((o, i) => {
      const opt = new Option(i === 0 && ex.base ? o + (ex.from === 'workout' ? ' — original' : ' — program') : o, o);
      if (o.toLowerCase() === cur.toLowerCase()) opt.selected = true;
      sel.add(opt);
    });
    sel.onchange = () => onPick(sel.value);
    const icon = document.createElement('span');
    icon.className = 'ff-alt-icon';
    icon.textContent = '⇄';
    wrap.appendChild(icon);
    wrap.appendChild(sel);
    return wrap;
  }

  /* Name row for one freeform exercise: name input, ⇄ alternatives, and
     the prescription underneath when it came from the program. A typed-in
     exercise with no program base gets its dropdown once the name is set. */
  function buildFreeformNameRow(ex, exHead, save){
    if (ex.label){
      const tag = document.createElement('span');
      tag.className = 'crud-ex-label';
      tag.textContent = ex.label;
      exHead.appendChild(tag);
    }
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'cs-freeform-name';
    nameInput.placeholder = 'Exercise name…';
    nameInput.value = ex.name || '';
    nameInput.oninput = ()=>{ ex.name = nameInput.value; save(); };
    exHead.appendChild(nameInput);
    let picker = null;
    const placePicker = ()=>{
      const next = buildAltPicker(ex, val => { ex.name = val; nameInput.value = val; save(); placePicker(); });
      if (picker) picker.remove();
      picker = next;
      if (picker) nameInput.after(picker);
    };
    placePicker();
    if (!ex.base) nameInput.onchange = placePicker;
    return nameInput;
  }

  /* Program mode: same ⇄ dropdown, but the program itself never changes —
     the pick is stored per day/exercise in that log (swapKey) and shows as
     the exercise's name there, in exports and in history. Picking the
     program exercise again clears it. */
  function programExName(ex, swapped){ return swapped || ex.name; }
  function fillProgramExHead(exHead, ex, swapped, onPick){
    const cur = swapped || splitAltFromName(ex.name).name;
    exHead.innerHTML = `<div class="ls-ex-name">${esc(programExName(ex, swapped))}${swapped ? `<span class="ls-ex-swapped">swapped from ${esc(splitAltFromName(ex.name).name)}</span>` : ''}</div>`;
    const picker = buildAltPicker({ name: cur, base: ex.name, baseAlts: ex.alternates }, val => {
      onPick(val.toLowerCase() === splitAltFromName(ex.name).name.toLowerCase() ? '' : val);
    });
    if (picker) exHead.appendChild(picker);
    const presc = document.createElement('div');
    presc.className = 'ls-ex-presc';
    presc.textContent = prescString(ex);
    exHead.appendChild(presc);
  }

  // Local date as YYYY-MM-DD (toISOString would give the UTC date).
  function localIsoDate(d){
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* Rest timer after a ticked set: the exercise's own Rest from the
     program when it has one, otherwise the default (js/bells-n-barz-lift-tools.js). */
  function startRest(ex, name){
    if (!window.BNB_REST) return;
    window.BNB_REST.start(ex ? window.BNB_LIFT.parseRest(ex.rest) : null, name ? splitAltFromName(name).name || name : '');
  }

  function slugify(s){ return String(s||'').trim().replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'') || 'Unnamed_Trainee'; }

  function buildSessionMarkdown(snap){
    let out = `# ${snap.title}\n\n`;
    out += `**Trainee:** ${snap.trainee}  \n`;
    out += `**Date:** ${snap.date || '____________'}  \n`;
    out += `**Bodyweight:** ${snap.bw || '______'}  \n`;
    out += `**Duration:** ${snap.duration}\n\n`;
    snap.blocks.forEach(block=>{
      out += `## ${block.name}\n\n`;
      block.exercises.forEach(ex=>{
        out += `**${ex.name}**`;
        if (ex.presc) out += ` — _${ex.presc}_`;
        if (ex.meta) out += `  \n${ex.meta}`;
        out += '\n\n';
        out += '| Set | Done | Weight | Reps |\n|---|---|---|---|\n';
        ex.sets.forEach((s,i)=>{
          out += `| S${i+1} | ${s.done?'x':' '} | ${s.wt||'—'} | ${s.reps||'—'} |\n`;
        });
        out += '\n';
      });
    });
    out += `**Signature Hold:** ${snap.hold}\n\n`;
    out += `## Session Notes / RPE\n\n${snap.notes || '_(none logged)_'}\n`;
    return out;
  }

  function buildSessionText(snap){
    let out = "BELL(E)S N' BARZ — LIVE SESSION LOG\n";
    out += "===================================\n\n";
    out += `Trainee:     ${snap.trainee}\n`;
    out += `Day:         ${snap.title}\n`;
    out += `Date:        ${snap.date || '____________'}\n`;
    out += `Bodyweight:  ${snap.bw || '______'}\n`;
    out += `Duration:    ${snap.duration}\n\n`;
    snap.blocks.forEach(block=>{
      out += `-- ${block.name.toUpperCase()} --\n`;
      block.exercises.forEach(ex=>{
        out += ex.presc ? `${ex.name}  (${ex.presc})\n` : `${ex.name}\n`;
        if (ex.meta) out += `  ${ex.meta}\n`;
        ex.sets.forEach((s,i)=>{
          out += `  S${i+1} [${s.done?'x':' '}] ${s.wt||'__'} / ${s.reps||'__'}\n`;
        });
        out += '\n';
      });
    });
    out += `Signature Hold: ${snap.hold}\n\n`;
    out += `SESSION NOTES / RPE\n${snap.notes || '(none logged)'}\n`;
    return out;
  }

  function downloadTextFile(filename, content, mime){
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  /* ========================= MEMBER — LIVE SESSION LOG ========================= */
  /* Replaces the old flat Session Log ("Sesh"). Shares the same mode toggle
     (Day's Program / Freeform), dynamic set add/remove, and PDF/md/txt export
     as the Coach Live Session above — same live-logging tool, single member
     instead of 5 trainee slots. No slot switcher, no trainee field.

     "Signed in" is silent and inferred, not asked for: this app has no real
     login, so we reuse the same self-member selection Schedule/Billing/Coach
     already rely on (window.BNB_USERS.getSignedInMember). If a real member
     record is selected, sets saved here can also be committed to a
     date-stamped history + progress graph for that member. If there's no
     member to be signed in as, the live logger still works fully — it just
     behaves like the coach's model: one live slot per day-of-week, overwritten
     each week, export-to-file if you want a copy — nothing is retained as
     long-term history for a guest. */
  const MLS_KEY = "bnb-member-livesession-v1";
  const MLS_PENDING_KEY = "bnb-member-livesession-pending-v1";
  let mlsDay = (function(){
    const idx = new Date().getDay(); // 0=Sun..6=Sat
    return DAY_ORDER[idx===0 ? 6 : idx-1];
  })();

  /* Resilience buffer: every edit is written to localStorage synchronously
     (see saveMlsStore below), so typed-but-unsynced data survives a reload
     or a dropped connection instead of vanishing with whatever was still
     in-flight to Supabase. MLS_PENDING_KEY tracks whether the local copy
     has edits Supabase hasn't confirmed yet, so a refresh from the server
     never clobbers data the member just typed. */
  function loadMlsStore(){
    try {
      const raw = localStorage.getItem(MLS_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){ /* corrupt/unavailable — start fresh */ }
    return {};
  }
  function persistMlsStoreLocal(){
    try { localStorage.setItem(MLS_KEY, JSON.stringify(mlsStore)); }
    catch(e){ /* storage unavailable (private mode, full, etc.) */ }
  }
  function isMlsPending(){
    try { return localStorage.getItem(MLS_PENDING_KEY) === '1'; }
    catch(e){ return false; }
  }
  function setMlsPending(flag){
    try {
      if (flag) localStorage.setItem(MLS_PENDING_KEY, '1');
      else localStorage.removeItem(MLS_PENDING_KEY);
    } catch(e){ /* storage unavailable */ }
  }

  let mlsSaveStatus = isMlsPending() ? 'offline' : 'idle'; // idle|saving|saved|offline
  function setMlsSaveStatus(status){
    mlsSaveStatus = status;
    renderMlsSaveStatus();
  }
  function renderMlsSaveStatus(){
    const el = document.getElementById('mls-save-status');
    if (!el) return;
    const label = { saving: 'Saving…', saved: 'All changes saved', offline: 'Not synced yet — saved on this device', idle: '' }[mlsSaveStatus] || '';
    el.textContent = label;
    el.className = 'mls-save-status' + (mlsSaveStatus ? ' is-' + mlsSaveStatus : '');
  }

  async function refreshMlsStoreFromSupabase(){
    const owner = mlsSignedInMember();
    // Nothing to load until someone is signed in — and not for a seed
    // placeholder ('u1') still standing in before the real users load.
    if (!owner || String(owner.id).length !== 36) return;
    const { data, error } = await bnbClient.from('mls_live_store').select('*').eq('owner_id', owner.id);
    if (error) { console.error('Supabase load mls_live_store failed:', error); return; }
    if (isMlsPending()){
      // This device has edits Supabase hasn't confirmed yet (e.g. it was
      // offline when they were made) — push those instead of overwriting
      // them with what might be stale server data.
      pushMlsStoreToSupabase(owner);
      return;
    }
    if (data && data.length && data[0].data) {
      mlsStore = data[0].data;
      persistMlsStoreLocal();
      if (typeof renderMlsDay === 'function') renderMlsDay();
    }
  }

  let mlsSyncTimer = null;
  let mlsHistoryAutoTimer = null;
  function saveMlsStore(){
    persistMlsStoreLocal(); // instant, always succeeds — the sticky buffer
    const owner = mlsSignedInMember();
    if (!owner) { setMlsSaveStatus('idle'); return; } // guest — local-only, nothing to sync
    setMlsPending(true);
    setMlsSaveStatus('saving');
    clearTimeout(mlsSyncTimer);
    mlsSyncTimer = setTimeout(() => pushMlsStoreToSupabase(owner), 600);
    clearTimeout(mlsHistoryAutoTimer);
    mlsHistoryAutoTimer = setTimeout(() => autoCommitMlsDayToHistory(), 2500);
  }
  async function pushMlsStoreToSupabase(owner){
    try {
      const { error } = await bnbClient.from('mls_live_store')
        .upsert([{ owner_id: owner.id, data: mlsStore, updated_at: new Date().toISOString() }], { onConflict: 'owner_id' });
      if (error) throw error;
      setMlsPending(false);
      setMlsSaveStatus('saved');
    } catch(e){
      console.warn('Supabase save mls_live_store failed:', e);
      setMlsSaveStatus('offline');
    }
  }
  let mlsStore = loadMlsStore();
  refreshMlsStoreFromSupabase(); // async — reconciles with the server once it responds
  // That first call usually runs before the Supabase session is restored
  // and fails; try again once sign-in has finished (and on every later
  // sign-in), same as the program (refreshProgramFromSupabase).
  document.addEventListener('bnb-auth-changed', e => { if (e.detail && e.detail.signedIn) refreshMlsStoreFromSupabase(); });
  // Logged with no signal (the gym floor): the sets wait on this device,
  // and go up as soon as the connection is back rather than at the next edit.
  window.addEventListener('online', () => {
    const owner = mlsSignedInMember();
    if (owner && isMlsPending()) pushMlsStoreToSupabase(owner);
  });
  function mlsKey(...rest){ return rest.join(':'); }

  /* One-time migration: LOGSHEET used to be a separate tab/store with the
     identical day:block:exercise:set:field key shape. Fold any legacy data
     into the merged Live Session store (without overwriting anything already
     there) so nobody's previously-logged sets disappear when LOGSHEET goes
     away, then retire the old key. */
  (function migrateLegacyLogsheet(){
    const OLD_LOG_KEY = "bnb-logsheet-v1";
    try {
      const raw = localStorage.getItem(OLD_LOG_KEY);
      if (!raw) return;
      const legacy = JSON.parse(raw);
      let changed = false;
      Object.keys(legacy).forEach(k=>{
        if (!(k in mlsStore)) { mlsStore[k] = legacy[k]; changed = true; }
      });
      if (changed) saveMlsStore();
      localStorage.removeItem(OLD_LOG_KEY);
    } catch(e){ /* nothing to migrate */ }
  })();

  function mlsSignedInMember(){
    return (window.BNB_USERS && window.BNB_USERS.getSignedInMember) ? window.BNB_USERS.getSignedInMember() : null;
  }

  function mlsModeKey(day){ return mlsKey(day, 'mode'); }
  function getMlsMode(day){ return mlsStore[mlsModeKey(day)] === 'freeform' ? 'freeform' : 'program'; }
  function setMlsMode(day, mode){ mlsStore[mlsModeKey(day)] = mode; saveMlsStore(); }

  function mlsFreeformKey(day){ return mlsKey(day, 'freeform'); }
  function blankMlsFreeformExercise(){ return { name:'', sets:[{ wt:'', reps:'', done:false }] }; }
  function getMlsFreeformExercises(day){
    try {
      const arr = JSON.parse(mlsStore[mlsFreeformKey(day)] || 'null');
      if (Array.isArray(arr) && arr.length) return arr;
    } catch(e){ /* fall through to default below */ }
    const seeded = freeformFromProgram(day, (b, e) => mlsStore[mlsKey(day, b, e, 'swap')]);
    return seeded.length ? seeded : [ blankMlsFreeformExercise() ];
  }
  function saveMlsFreeformExercises(day, arr){
    mlsStore[mlsFreeformKey(day)] = JSON.stringify(arr);
    saveMlsStore();
  }

  function mlsHistoryToRow(h){
    return {
      id: (h.id && h.id.length === 36) ? h.id : undefined,
      member_id: h.memberId, date_iso: h.dateIso, display_date: h.displayDate,
      day: h.day, mode: h.mode, bw: h.bw, notes: h.notes, exercises: h.exercises || []
    };
  }
  function rowToMlsHistory(r){
    return {
      id: r.id, memberId: r.member_id, dateIso: r.date_iso, displayDate: r.display_date||'',
      day: r.day, mode: r.mode, bw: r.bw||'', notes: r.notes||'', exercises: r.exercises || []
    };
  }

  let mlsHistoryCache = null; // populated by refreshMlsHistoryFromSupabase
  refreshMlsHistoryFromSupabase(); // async — populates cache once Supabase responds

  function loadMlsHistory(){
    // Synchronous read for existing call sites — served from cache once
    // refreshMlsHistoryFromSupabase() has run at least once. Starts empty.
    return mlsHistoryCache ? mlsHistoryCache.slice() : [];
  }
  async function refreshMlsHistoryFromSupabase(){
    const { data, error } = await bnbClient.from('mls_history').select('*');
    if (error) { console.error('Supabase load mls_history failed:', error); return; }
    mlsHistoryCache = (data || []).map(rowToMlsHistory);
    if (typeof renderMlsHistoryTable === 'function') renderMlsHistoryTable();
    if (typeof renderMlsGraphOptions === 'function') renderMlsGraphOptions();
    if (typeof renderMlsGraph === 'function') renderMlsGraph();
  }
  function saveMlsHistoryArr(arr){
    // Diff against the previous cache so entries removed from the array
    // (via the per-row delete button or "Clear History") actually get
    // deleted from Supabase too — upsert alone would leave them behind.
    const oldIds = new Set((mlsHistoryCache || []).map(h => h.id));
    const newIds = new Set(arr.map(h => h.id));
    const removedIds = [...oldIds].filter(id => !newIds.has(id));

    mlsHistoryCache = arr;
    (async () => {
      const rows = arr.map(mlsHistoryToRow);
      await Promise.allSettled(rows.map(row => bnbClient.from('mls_history').upsert([row])));
      await Promise.allSettled(removedIds.map(id => bnbClient.from('mls_history').delete().eq('id', id)));
    })();
  }

  function renderMlsDayTabs(){
    const bar = document.getElementById('mls-day-tabs');
    if (!bar) return;
    bar.innerHTML = '';
    const select = document.createElement('select');
    select.className = 'day-tabs-dropdown';
    select.setAttribute('aria-label', 'Select day for this session');
    DAY_ORDER.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = DAY_META[d].title.split('—')[0].trim();
      if (d===mlsDay) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = ()=>{ mlsDay = select.value; renderMlsDayTabs(); renderMlsDay(); };
    bar.appendChild(select);
    DAY_ORDER.forEach(d=>{
      const b = document.createElement('button');
      b.className = 'subtab-btn' + (d===mlsDay ? ' active' : '');
      b.textContent = DAY_META[d].title.split('—')[0].trim();
      b.onclick = ()=>{ mlsDay = d; renderMlsDayTabs(); renderMlsDay(); };
      bar.appendChild(b);
    });
  }

  function renderMlsProgramBlocks(wrap, day){
    const blocks = programData[day] || [];
    wrap.insertAdjacentHTML('beforeend', dayStatsLine(blocks));
    blocks.forEach((block, bIdx)=>{
      const bDiv = document.createElement('div');
      bDiv.className = 'ls-block';
      const head = document.createElement('div');
      head.className = 'ls-block-head';
      head.textContent = block.name;
      bDiv.appendChild(head);

      block.exercises.forEach((ex, eIdx)=>{
        const nSets = parseInt(ex.sets, 10) || 3;
        const exDiv = document.createElement('div');
        exDiv.className = 'ls-exercise';
        const exHead = document.createElement('div');
        exHead.className = 'ls-ex-head';
        const swapKey = mlsKey(day,bIdx,eIdx,'swap');
        fillProgramExHead(exHead, ex, mlsStore[swapKey], val => {
          if (val) mlsStore[swapKey] = val; else delete mlsStore[swapKey];
          saveMlsStore(); renderMlsDay();
        });
        exDiv.appendChild(exHead);
        const ml = metaLine(ex);
        if (ml){
          const metaDiv = document.createElement('div');
          metaDiv.className = 'ls-ex-meta';
          metaDiv.innerHTML = ml;
          exDiv.appendChild(metaDiv);
        }
        // Last time, what to try today, and the how-to (js/bells-n-barz-workout-plus.js).
        const PLUS = window.BNB_PLUS, exName = programExName(ex, mlsStore[swapKey]);
        if (PLUS) PLUS.howToButton(exHead, exName, renderMlsDay);
        const sug = PLUS ? PLUS.extras(exDiv, exName, ex.reps, mlsPriorHistory(), liftKey, sg => {
          for (let s = 0; s < nSets; s++) fillFromSuggestion(sg, mlsKey(day,bIdx,eIdx,s,'wt'), mlsKey(day,bIdx,eIdx,s,'reps'));
          saveMlsStore(); renderMlsDay();
        }) : null;
        const setsDiv = document.createElement('div');
        setsDiv.className = 'ls-sets';
        for(let s=0; s<nSets; s++){
          const doneKey = mlsKey(day,bIdx,eIdx,s,'done');
          const wtKey = mlsKey(day,bIdx,eIdx,s,'wt');
          const repsKey = mlsKey(day,bIdx,eIdx,s,'reps');
          const setDiv = document.createElement('div');
          setDiv.className = 'ls-set' + (mlsStore[doneKey] ? ' done' : '');
          setDiv.innerHTML = `
            <input type="checkbox" ${mlsStore[doneKey] ? 'checked' : ''}>
            <span class="ls-set-label">S${s+1}</span>
            <input type="text" inputmode="decimal" placeholder="${sug ? esc(window.BNB_LIFT.fmtKg(sug.wt)) : 'wt or BW'}" value="${esc(mlsStore[wtKey]||'')}">
            <span class="ls-slash">/</span>
            <input type="text" inputmode="numeric" placeholder="${sug && sug.reps ? sug.reps : 'reps'}" value="${esc(mlsStore[repsKey]||'')}">
          `;
          const cb = setDiv.querySelector('input[type=checkbox]');
          const inputs = setDiv.querySelectorAll('input[type=text]');
          cb.onchange = ()=>{
            // Ticking an empty set means "did what was suggested".
            if (cb.checked && sug){
              fillFromSuggestion(sug, wtKey, repsKey);
              inputs[0].value = mlsStore[wtKey] || ''; inputs[1].value = mlsStore[repsKey] || '';
            }
            mlsStore[doneKey]=cb.checked; setDiv.classList.toggle('done', cb.checked); saveMlsStore();
            if (cb.checked){
              if (window.BNB_PLUS) window.BNB_PLUS.markStart(mlsDay);
              const name = programExName(ex, mlsStore[swapKey]);
              startRest(ex, name);
              checkForPr(name, mlsStore[wtKey], mlsStore[repsKey]);
            }
          };
          inputs[0].oninput = ()=>{ mlsStore[wtKey]=inputs[0].value; saveMlsStore(); };
          inputs[1].oninput = ()=>{ mlsStore[repsKey]=inputs[1].value; saveMlsStore(); };
          setsDiv.appendChild(setDiv);
        }
        exDiv.appendChild(setsDiv);
        bDiv.appendChild(exDiv);
      });
      wrap.appendChild(bDiv);
    });
  }

  function renderMlsFreeformBlocks(wrap, day){
    const list = getMlsFreeformExercises(day);

    const bDiv = document.createElement('div');
    bDiv.className = 'ls-block';
    const head = document.createElement('div');
    head.className = 'ls-block-head';
    head.textContent = 'Freeform';
    bDiv.appendChild(head);

    list.forEach((ex, eIdx)=>{
      if (!ex.sets || !ex.sets.length) ex.sets = [{ wt:'', reps:'', done:false }];
      const groupHead = freeformGroupHead(list, eIdx);
      if (groupHead) bDiv.appendChild(groupHead);
      const exDiv = document.createElement('div');
      exDiv.className = 'ls-exercise cs-freeform-exercise';

      const exHead = document.createElement('div');
      exHead.className = 'ls-ex-head cs-freeform-ex-head';

      buildFreeformNameRow(ex, exHead, ()=> saveMlsFreeformExercises(day, list));
      const PLUS = window.BNB_PLUS;
      if (PLUS) PLUS.howToButton(exHead, ex.name, renderMlsDay);

      const removeExBtn = document.createElement('button');
      removeExBtn.type = 'button';
      removeExBtn.className = 'cs-freeform-remove-ex';
      removeExBtn.title = 'Remove exercise';
      removeExBtn.textContent = '✕';
      removeExBtn.onclick = ()=>{
        if (list.length <= 1){
          list[eIdx] = blankMlsFreeformExercise();
        } else {
          list.splice(eIdx, 1);
        }
        saveMlsFreeformExercises(day, list);
        renderMlsDay();
      };
      exHead.appendChild(removeExBtn);
      exDiv.appendChild(exHead);
      if (ex.presc){
        const prescDiv = document.createElement('div');
        prescDiv.className = 'ls-ex-presc cs-freeform-presc';
        prescDiv.textContent = (ex.from === 'workout' ? 'Plan: ' : 'Program: ') + ex.presc;
        exDiv.appendChild(prescDiv);
      }
      function fillSet(set, sg){
        if (!String(set.wt || '').trim()) set.wt = window.BNB_LIFT.fmtKg(sg.wt);
        if (!String(set.reps || '').trim() && sg.reps) set.reps = String(sg.reps);
      }
      const sug = PLUS ? PLUS.extras(exDiv, ex.name, String(ex.presc || '').split('×')[1] || '', mlsPriorHistory(), liftKey, sg => {
        ex.sets.forEach(st => fillSet(st, sg));
        saveMlsFreeformExercises(day, list); renderMlsDay();
      }) : null;

      const setsDiv = document.createElement('div');
      setsDiv.className = 'ls-sets';
      ex.sets.forEach((set, sIdx)=>{
        const setDiv = document.createElement('div');
        setDiv.className = 'ls-set' + (set.done ? ' done' : '');
        setDiv.innerHTML = `
          <input type="checkbox" ${set.done ? 'checked' : ''}>
          <span class="ls-set-label">S${sIdx+1}</span>
          <input type="text" inputmode="decimal" placeholder="${sug ? esc(window.BNB_LIFT.fmtKg(sug.wt)) : 'wt or BW'}" value="${esc(set.wt||'')}">
          <span class="ls-slash">/</span>
          <input type="text" inputmode="numeric" placeholder="${sug && sug.reps ? sug.reps : 'reps'}" value="${esc(set.reps||'')}">
        `;
        const cb = setDiv.querySelector('input[type=checkbox]');
        const inputs = setDiv.querySelectorAll('input[type=text]');
        cb.onchange = ()=>{
          if (cb.checked && sug){ fillSet(set, sug); inputs[0].value = set.wt || ''; inputs[1].value = set.reps || ''; }
          set.done = cb.checked; setDiv.classList.toggle('done', cb.checked); saveMlsFreeformExercises(day, list);
          if (cb.checked){ if (PLUS) PLUS.markStart(mlsDay); startRest(null, ex.name); checkForPr(ex.name, set.wt, set.reps); }
        };
        inputs[0].oninput = ()=>{ set.wt = inputs[0].value; saveMlsFreeformExercises(day, list); };
        inputs[1].oninput = ()=>{ set.reps = inputs[1].value; saveMlsFreeformExercises(day, list); };

        if (ex.sets.length > 1){
          const rmSetBtn = document.createElement('button');
          rmSetBtn.type = 'button';
          rmSetBtn.className = 'cs-freeform-remove-set';
          rmSetBtn.title = 'Remove this set';
          rmSetBtn.textContent = '−';
          rmSetBtn.onclick = ()=>{
            ex.sets.splice(sIdx, 1);
            saveMlsFreeformExercises(day, list);
            renderMlsDay();
          };
          setDiv.appendChild(rmSetBtn);
        }
        setsDiv.appendChild(setDiv);
      });
      exDiv.appendChild(setsDiv);

      const addSetBtn = document.createElement('button');
      addSetBtn.type = 'button';
      addSetBtn.className = 'btn2 cs-freeform-add-set';
      addSetBtn.textContent = '+ Add Set';
      addSetBtn.onclick = ()=>{
        ex.sets.push({ wt:'', reps:'', done:false });
        saveMlsFreeformExercises(day, list);
        renderMlsDay();
      };
      exDiv.appendChild(addSetBtn);

      bDiv.appendChild(exDiv);
    });

    wrap.appendChild(bDiv);

    const addExBtn = document.createElement('button');
    addExBtn.type = 'button';
    addExBtn.className = 'btn2 primary cs-freeform-add-ex';
    addExBtn.textContent = '+ Add Exercise';
    addExBtn.onclick = ()=>{
      list.push(blankMlsFreeformExercise());
      saveMlsFreeformExercises(day, list);
      renderMlsDay();
      const names = wrap.querySelectorAll('.cs-freeform-name');
      if (names.length) names[names.length-1].focus();
    };
    wrap.appendChild(addExBtn);
  }

  /* Guest vs signed-in only changes what's shown below the logger — the
     logger itself (mode toggle, sets, export) is identical either way. */
  function updateMlsIdentityUI(){
    const guestNotice = document.getElementById('mls-guest-notice');
    const signedInNotice = document.getElementById('mls-signedin-notice');
    const historySection = document.getElementById('mls-history-section');
    const graphSection = document.getElementById('mls-graph-section');
    if (!guestNotice) return;
    const member = mlsSignedInMember();
    guestNotice.style.display = member ? 'none' : 'block';
    signedInNotice.style.display = member ? 'block' : 'none';
    if (member) document.getElementById('mls-signedin-name').textContent = member.name;
    historySection.style.display = member ? '' : 'none';
    graphSection.style.display = member ? '' : 'none';
    renderMlsSaveStatus();
    if (member){
      renderMlsHistoryTable();
      renderMlsGraphOptions();
      renderMlsGraph();
    }
  }
  window.mlsOnTabShown = updateMlsIdentityUI;

  function renderMlsDay(){
    const dateEl = document.getElementById('mls-date');
    if (!dateEl) return;
    dateEl.value = mlsStore[mlsKey(mlsDay,'meta','date')] || '';
    document.getElementById('mls-bw').value = mlsStore[mlsKey(mlsDay,'meta','bw')] || '';
    document.getElementById('mls-notes').value = mlsStore[mlsKey(mlsDay,'notes')] || '';

    const mode = getMlsMode(mlsDay);
    document.getElementById('mls-mode-program').classList.toggle('active', mode === 'program');
    document.getElementById('mls-mode-freeform').classList.toggle('active', mode === 'freeform');

    const wrap = document.getElementById('mls-blocks');
    wrap.innerHTML = '';
    if (mode === 'freeform') renderMlsFreeformBlocks(wrap, mlsDay);
    else renderMlsProgramBlocks(wrap, mlsDay);

    updateMlsIdentityUI();
  }

  /* Same shape as the Coach Live Session's snapshotSessionDay(), minus the
     trainee/slot concept, so it can reuse the same md/txt export builders. */
  function snapshotMlsDay(day){
    const meta = DAY_META[day];
    const mode = getMlsMode(day);
    let blocks;
    if (mode === 'freeform'){
      const list = getMlsFreeformExercises(day).filter(ex => (ex.name||'').trim());
      blocks = [{
        name: 'Freeform',
        exercises: list.map(ex => ({
          name: ex.name,
          presc: '',
          meta: '',
          sets: (ex.sets||[]).map(s => ({ done: !!s.done, wt: s.wt||'', reps: s.reps||'' }))
        }))
      }];
    } else {
      blocks = (programData[day]||[]).map((block,bIdx)=>({
        name: block.name,
        exercises: block.exercises.map((ex,eIdx)=>{
          const nSets = parseInt(ex.sets,10) || 3;
          const sets = [];
          for(let s=0;s<nSets;s++){
            sets.push({
              done: !!mlsStore[mlsKey(day,bIdx,eIdx,s,'done')],
              wt: mlsStore[mlsKey(day,bIdx,eIdx,s,'wt')] || '',
              reps: mlsStore[mlsKey(day,bIdx,eIdx,s,'reps')] || ''
            });
          }
          return { name: programExName(ex, mlsStore[mlsKey(day,bIdx,eIdx,'swap')]), presc: prescString(ex), meta: metaLine(ex).replace(/&nbsp;/g,' ').replace(/•/g,'|'), sets };
        })
      }));
    }
    return {
      title: meta.title, duration: meta.duration, hold: meta.hold,
      date: mlsStore[mlsKey(day,'meta','date')]||'', bw: mlsStore[mlsKey(day,'meta','bw')]||'',
      notes: mlsStore[mlsKey(day,'notes')]||'', mode, blocks
    };
  }

  /* Guests: export-to-file only, nothing retained beyond this device's live
     slot. Signed-in members: committing to history is automatic, not an
     extra step — every time saveMlsStore settles (see the debounce there),
     the current day's live log is upserted into that member's history for
     today's date. Re-running this for the same member+day+date updates the
     existing row instead of appending a new one, so editing a set after the
     first auto-commit corrects today's entry rather than duplicating it. */
  function mlsUuid(){
    return crypto.randomUUID ? crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
        const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
      });
  }
  function autoCommitMlsDayToHistory(){
    const member = mlsSignedInMember();
    if (!member) return; // guests: nothing server-side to commit to
    const day = mlsDay;
    const snap = snapshotMlsDay(day);
    const exercises = snap.blocks.flatMap(b => b.exercises).filter(ex => ex.sets.some(s => s.wt || s.reps || s.done));
    if (!exercises.length) return; // nothing logged yet — don't create an empty history row
    const dateIso = localIsoDate();
    const history = loadMlsHistory();
    const existing = history.find(h => h.memberId === member.id && h.day === day && h.dateIso === dateIso && h.mode !== 'coach');
    const entry = {
      id: existing ? existing.id : mlsUuid(),
      memberId: member.id, dateIso, displayDate: snap.date || '',
      day, mode: snap.mode, bw: snap.bw, notes: snap.notes, exercises
    };
    const nextHistory = existing
      ? history.map(h => h.id === entry.id ? entry : h)
      : history.concat([entry]);
    saveMlsHistoryArr(nextHistory);
    renderMlsHistoryTable();
    renderMlsGraphOptions();
    renderMlsGraph();
  }

  function mlsHistoryRowHtml(h){
    const exList = (h.exercises||[]).map(ex=>ex.name).filter(Boolean).join(', ') || '—';
    const dayTitle = (DAY_META[h.day]||{}).title ? DAY_META[h.day].title.split('—')[0].trim() : (h.day||'');
    return `<tr>
      <td class="mono">${esc(h.displayDate || h.dateIso)}</td>
      <td>${esc(dayTitle)}</td>
      <td>${h.mode==='coach' ? 'With coach' : h.mode==='freeform' ? 'Freeform' : "Day's Program"}</td>
      <td>${esc(exList)}</td>
      <td>${h.notes ? esc(h.notes) : '—'}</td>
      <td><button type="button" class="sesh-del-btn" data-id="${h.id}" title="Delete">×</button></td>
    </tr>`;
  }

  function renderMlsHistoryTable(){
    const member = mlsSignedInMember();
    const table = document.getElementById('mls-history-table');
    const empty = document.getElementById('mls-history-empty');
    const body = document.getElementById('mls-history-body');
    if (!table) return;
    body.innerHTML = '';
    if (!member){ table.style.display='none'; empty.style.display='none'; return; }
    const history = loadMlsHistory().filter(h=>h.memberId===member.id).sort((a,b)=> b.dateIso.localeCompare(a.dateIso));
    if (!history.length){ table.style.display='none'; empty.style.display='block'; return; }
    table.style.display=''; empty.style.display='none';
    history.forEach(h => body.insertAdjacentHTML('beforeend', mlsHistoryRowHtml(h)));
    body.querySelectorAll('.sesh-del-btn').forEach(btn=>{
      btn.onclick = ()=>{
        const remaining = loadMlsHistory().filter(x=>x.id!==btn.dataset.id);
        saveMlsHistoryArr(remaining);
        renderMlsHistoryTable();
        renderMlsGraphOptions();
        renderMlsGraph();
      };
    });
  }

  function renderMlsGraphOptions(){
    const exSel = document.getElementById('mls-graph-exercise');
    if (!exSel) return;
    const member = mlsSignedInMember();
    const prevVal = exSel.value;
    exSel.innerHTML = '';
    if (!member) return;
    // One entry per lift (see liftKey), labelled without its "(alt: …)".
    const names = new Map();
    loadMlsHistory().filter(h=>h.memberId===member.id).forEach(h=>(h.exercises||[]).forEach(ex=>{
      const key = liftKey(ex.name||'');
      if (key && !names.has(key)) names.set(key, splitAltFromName(ex.name).name);
    }));
    [...names.values()].sort().forEach(n=>{
      const o = document.createElement('option'); o.value = n; o.textContent = n; exSel.appendChild(o);
    });
    if ([...names.values()].includes(prevVal)) exSel.value = prevVal;
  }

  /* ---------------- PERSONAL RECORDS ----------------
     Worked out from the member's saved history: per exercise, the heaviest
     set and the best estimated one-rep max (Epley, sets of 1–12 reps).
     Names are matched without their "(alt: …)" part and case, so a
     program exercise and the same lift typed in Freeform count together.
     Sets logged as BW have no number and don't count. */
  function liftKey(name){ return splitAltFromName(name).name.toLowerCase().replace(/\s+/g, ' ').trim(); }
  function memberHistory(member){ return loadMlsHistory().filter(h => h.memberId === member.id); }
  // The signed-in member's sessions before today, for "Last time" and suggestions.
  function mlsPriorHistory(){
    const member = mlsSignedInMember();
    if (!member) return [];
    const todayIso = localIsoDate();
    return memberHistory(member).filter(h => h.dateIso < todayIso);
  }
  function fillFromSuggestion(sg, wtKey, repsKey){
    if (!String(mlsStore[wtKey] || '').trim()) mlsStore[wtKey] = window.BNB_LIFT.fmtKg(sg.wt);
    if (!String(mlsStore[repsKey] || '').trim() && sg.reps) mlsStore[repsKey] = String(sg.reps);
  }
  function bestsFrom(history, beforeIso){
    const L = window.BNB_LIFT, bests = {};
    history.forEach(h => {
      if (beforeIso && h.dateIso >= beforeIso) return;
      (h.exercises || []).forEach(ex => {
        const key = liftKey(ex.name || '');
        if (!key) return;
        (ex.sets || []).forEach(st => {
          const wt = L.parseWt(st.wt), reps = L.parseReps(st.reps);
          if (wt == null || !reps) return;
          const b = bests[key] || (bests[key] = { name: splitAltFromName(ex.name).name, wt: -Infinity, wtReps: 0, e1: -Infinity });
          if (wt > b.wt || (wt === b.wt && reps > b.wtReps)){ b.wt = wt; b.wtReps = reps; b.wtDate = h.dateIso; }
          const e = L.e1rm(wt, reps);
          if (e != null && e > b.e1){ b.e1 = e; b.e1Wt = wt; b.e1Reps = reps; b.e1Date = h.dateIso; }
        });
      });
    });
    return bests;
  }

  /* A ticked set that beats everything before today gets a toast. The
     first time an exercise is logged there's nothing to beat, so no toast;
     each record is celebrated once per visit. */
  const prAnnounced = {};
  function checkForPr(name, wtStr, repsStr){
    const member = mlsSignedInMember(), L = window.BNB_LIFT;
    if (!member || !L) return;
    const key = liftKey(name || ''), wt = L.parseWt(wtStr), reps = L.parseReps(repsStr);
    if (!key || wt == null || !reps) return;
    const prev = bestsFrom(memberHistory(member), localIsoDate())[key];
    if (!prev) return;
    const seen = prAnnounced[key] || { wt: prev.wt, e1: prev.e1 };
    const e = L.e1rm(wt, reps);
    let msg = '';
    if (wt > seen.wt) msg = '🏆 New PR! ' + prev.name + ' ' + L.fmtKg(wt) + ' × ' + reps + ' (best was ' + L.fmtKg(prev.wt) + ')';
    else if (e != null && e > seen.e1 + 0.01) msg = '🏆 New PR! ' + prev.name + ' ' + L.fmtKg(wt) + ' × ' + reps + ', est. 1RM ' + L.fmtKg(e);
    if (!msg) return;
    prAnnounced[key] = { wt: Math.max(seen.wt, wt), e1: Math.max(seen.e1, e == null ? -Infinity : e) };
    window.BNB_UI.toast(msg, 5000);
    if (navigator.vibrate) navigator.vibrate(80);
  }

  function renderMlsPrBoard(){
    const el = document.getElementById('mls-pr-board');
    if (!el) return;
    const member = mlsSignedInMember(), L = window.BNB_LIFT;
    const bests = member && L ? Object.values(bestsFrom(memberHistory(member))) : [];
    if (!bests.length){ el.innerHTML = ''; return; }
    bests.sort((a, b) => a.name.localeCompare(b.name));
    const day = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(2, 4) : '';
    el.innerHTML = '<h3 class="pr-head">Personal Records</h3>' +
      '<table class="weight-history-table pr-table"><thead><tr><th>Exercise</th><th>Heaviest set</th><th>Best est. 1RM</th></tr></thead><tbody>' +
      bests.map(b => '<tr><td>' + esc(b.name) + '</td>' +
        '<td class="mono">' + L.fmtKg(b.wt) + ' × ' + b.wtReps + ' <span class="field-hint">' + day(b.wtDate) + '</span></td>' +
        '<td class="mono">' + (b.e1 > 0 ? L.fmtKg(b.e1) + ' <span class="field-hint">' + L.fmtKg(b.e1Wt) + ' × ' + b.e1Reps + ', ' + day(b.e1Date) + '</span>' : '—') + '</td></tr>').join('') +
      '</tbody></table><div class="field-hint">Est. 1RM is a guide (Epley formula, from sets of 12 reps or fewer), not a max to test.</div>';
  }

  /* Line chart in the same visual language as the Weight tab's
     .weight-chart-svg. Per saved session, for the chosen exercise:
       top    — the heaviest set
       e1rm   — the best estimated one-rep max
       volume — total weight × reps across its sets
     Sets logged as BW have no number, so they're left out rather than
     counted as 0. */
  const GRAPH_METRICS = { top: 'Heaviest set', e1rm: 'Estimated 1RM', volume: 'Volume (weight × reps)' };
  function renderMlsGraph(){
    renderMlsPrBoard();
    const svg = document.getElementById('mls-graph-svg');
    const empty = document.getElementById('mls-graph-empty');
    const exSel = document.getElementById('mls-graph-exercise');
    if (!svg || !exSel) return;
    const metricSel = document.getElementById('mls-graph-metric');
    if (metricSel && !metricSel.options.length){
      metricSel.innerHTML = Object.keys(GRAPH_METRICS).map(k => '<option value="' + k + '">' + GRAPH_METRICS[k] + '</option>').join('');
      metricSel.onchange = renderMlsGraph;
    }
    const metric = metricSel ? metricSel.value : 'top';
    const exName = exSel.value;
    const member = mlsSignedInMember();
    if (!member || !exName){ svg.style.display='none'; empty.style.display='block'; return; }

    const L = window.BNB_LIFT, key = liftKey(exName);
    const history = memberHistory(member).sort((a,b)=> a.dateIso.localeCompare(b.dateIso));
    const byDate = {};
    history.forEach(h=>{
      (h.exercises||[]).forEach(ex=>{
        if (liftKey(ex.name||'') !== key) return;
        let v = null;
        (ex.sets||[]).forEach(st=>{
          const wt = L.parseWt(st.wt), reps = L.parseReps(st.reps);
          if (wt == null) return;
          const val = metric === 'e1rm' ? L.e1rm(wt, reps) : metric === 'volume' ? (reps ? wt * reps : null) : wt;
          if (val == null) return;
          v = metric === 'volume' ? (v || 0) + val : (v === null || val > v ? val : v);
        });
        // Two entries on one day (your own log and a coach's) make one point.
        if (v !== null) byDate[h.dateIso] = metric === 'volume' ? (byDate[h.dateIso] || 0) + v : Math.max(byDate[h.dateIso] == null ? -Infinity : byDate[h.dateIso], v);
      });
    });
    const points = Object.keys(byDate).sort().map(d => ({ date: d, wt: byDate[d] }));

    if (points.length < 2){ svg.style.display='none'; empty.style.display='block'; return; }
    empty.style.display='none'; svg.style.display='block';

    const W=bnbChartWidth(svg),H=230,padL=50,padR=20,padT=20,padB=36;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const ys = points.map(p=>p.wt);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const yRange = (maxY - minY) || 1;
    const xStep = (W-padL-padR) / Math.max(points.length-1,1);
    const xAt = i => padL + i*xStep;
    const yAt = v => H-padB - ((v-minY)/yRange)*(H-padT-padB);
    const fmt = v => metric === 'volume' ? Math.round(v).toLocaleString() : v.toFixed(1);

    let gridSvg = '';
    for(let i=0;i<=4;i++){
      const gy = padT + i*((H-padT-padB)/4);
      gridSvg += `<line class="grid-line" x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}"></line>`;
      const val = maxY - i*(yRange/4);
      gridSvg += `<text class="axis-label" x="${padL-8}" y="${gy+3}" text-anchor="end">${fmt(val)}</text>`;
    }
    const pathD = points.map((p,i)=> (i===0?'M':'L') + xAt(i).toFixed(1) + ',' + yAt(p.wt).toFixed(1)).join(' ');
    const dots = points.map((p,i)=> `<circle class="data-dot" cx="${xAt(i).toFixed(1)}" cy="${yAt(p.wt).toFixed(1)}" r="3.5"><title>${esc(p.date)}: ${fmt(p.wt)}</title></circle>`).join('');
    const xLabels = points.map((p,i)=> (i===0 || i===points.length-1 || i===Math.floor(points.length/2))
      ? `<text class="axis-label" x="${xAt(i).toFixed(1)}" y="${H-12}" text-anchor="middle">${esc(p.date.slice(5))}</text>`
      : '').join('');

    svg.innerHTML = gridSvg + `<path class="data-line" d="${pathD}"></path>` + dots + xLabels;
  }

  function saveMlsAs(format){
    const snap = snapshotMlsDay(mlsDay);
    const member = mlsSignedInMember();
    snap.trainee = member ? member.name : 'Guest';
    const fileBase = 'BnB_Session_' + slugify(snap.trainee) + '_' + snap.title.replace(/[^\w]+/g,'_');

    if (format === 'md'){
      downloadTextFile(fileBase + '.md', buildSessionMarkdown(snap), 'text/markdown');
      return;
    }
    if (format === 'txt'){
      downloadTextFile(fileBase + '.txt', buildSessionText(snap), 'text/plain');
      return;
    }

    // PDF — same rendering approach as the Coach Live Session's export.
    (async ()=>{
      const btn = document.getElementById('mls-save-pdf');
      const orig = btn.textContent; btn.textContent = 'Building PDF…'; btn.disabled = true;
      try {
        await ensureJsPdf();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit:'pt', format:'letter' });
        const gold = [201,169,79], ink = [20,18,16], muted = [110,102,88];
        const green = [15,110,86], rust = [153,60,29];
        const pageW = doc.internal.pageSize.getWidth();
        let y = 40;

        doc.setProperties({ title: "Bell(e)s N' Barz \u2014 " + snap.title + ' \u2014 ' + (snap.trainee || 'Session') });

        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...gold);
        doc.text("BELL(E)S N' BARZ  •  LIVE SESSION LOG", 40, y);
        doc.setFontSize(20); doc.setTextColor(...ink);
        y += 26; doc.text(snap.title, 40, y);
        doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...muted);
        y += 16; doc.text('Logged by: ' + snap.trainee, 40, y);
        y += 14; doc.text(snap.duration + '   ·   Date: ' + (snap.date||'____________') + '   ·   Bodyweight: ' + (snap.bw||'______'), 40, y);
        y += 10; doc.setDrawColor(...gold); doc.line(40, y, pageW-40, y);
        y += 20;

        snap.blocks.forEach(block=>{
          if (y > 700){ doc.addPage(); y = 40; }
          doc.setFillColor(20,18,16); doc.rect(40, y-12, pageW-80, 18, 'F');
          doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(255,255,255);
          doc.text(block.name.toUpperCase(), 46, y+1);
          y += 20;
          block.exercises.forEach(ex=>{
            if (y > 700){ doc.addPage(); y = 40; }
            doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(...ink);
            doc.text(ex.name, 44, y);
            if (ex.presc){
              doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(...muted);
              doc.text(ex.presc, pageW-44, y, {align:'right'});
            }
            y += 12;
            if (ex.meta){
              doc.setFont('helvetica','italic'); doc.setFontSize(7.5); doc.setTextColor(...muted);
              doc.text(ex.meta, 44, y);
              y += 11;
            }
            y = drawPdfSetChips(doc, ex.sets, 44, y, pageW-44, { green, rust, muted });
            y += 16;
          });
          y += 6;
        });

        if (y > 680){ doc.addPage(); y = 40; }
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...ink);
        const holdTextX2 = drawPdfStar(doc, 40, y, gold);
        doc.text('Signature Hold: ' + snap.hold, holdTextX2, y);
        y += 20;
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...muted);
        doc.text('SESSION NOTES / RPE', 40, y);
        y += 14;
        doc.setDrawColor(200,195,180); doc.rect(40, y-10, pageW-80, 50);
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...ink);
        doc.text(doc.splitTextToSize(snap.notes || '', pageW-96), 46, y+2);

        doc.save(fileBase + '.pdf');
      } catch(err){
        alert('PDF export needs an internet connection the first time (to load the PDF library). Please check your connection and try again.');
        console.error(err);
      } finally {
        btn.textContent = orig; btn.disabled = false;
      }
    })();
  }

  function wireMlsOnce(){
    const dateEl = document.getElementById('mls-date');
    if (!dateEl || dateEl.dataset.wired) return;
    dateEl.dataset.wired = '1';
    dateEl.addEventListener('input', e=>{ mlsStore[mlsKey(mlsDay,'meta','date')]=e.target.value; saveMlsStore(); });
    document.getElementById('mls-bw').addEventListener('input', e=>{ mlsStore[mlsKey(mlsDay,'meta','bw')]=e.target.value; saveMlsStore(); });
    document.getElementById('mls-notes').addEventListener('input', e=>{ mlsStore[mlsKey(mlsDay,'notes')]=e.target.value; saveMlsStore(); });

    document.getElementById('mls-clear').onclick = ()=>{
      const dayTitle = DAY_META[mlsDay].title.split('—')[0].trim();
      if(!confirm("Clear this day's live log — sets, weight, reps and notes for " + dayTitle + "? Anything already saved to History is untouched.")) return;
      const prefix = mlsDay + ':';
      Object.keys(mlsStore).forEach(k=>{ if (k.startsWith(prefix)) delete mlsStore[k]; });
      saveMlsStore();
      renderMlsDay();
    };

    document.getElementById('mls-save-pdf').onclick = ()=> saveMlsAs('pdf');
    const finishBtn = document.getElementById('mls-finish');
    if (finishBtn && window.BNB_PLUS) finishBtn.onclick = ()=>{
      const snap = snapshotMlsDay(mlsDay);
      const member = mlsSignedInMember();
      const bests = member ? bestsFrom(memberHistory(member), localIsoDate()) : {};
      const sum = window.BNB_PLUS.summarize(snap.blocks.flatMap(b => b.exercises), bests, liftKey, window.BNB_PLUS.startedAt(mlsDay));
      window.BNB_PLUS.finish(sum, snap.title || mlsDay, member ? null : 'Save a copy with the buttons below, or sign in to keep a history.');
    };
    if (window.BNB_PLUS) window.BNB_PLUS.loadGuides(renderMlsDay);
    document.getElementById('mls-save-md').onclick = ()=> saveMlsAs('md');
    document.getElementById('mls-save-txt').onclick = ()=> saveMlsAs('txt');

    document.getElementById('mls-print').onclick = ()=>{
      document.querySelectorAll('.tab-panel').forEach(sec=>sec.classList.remove('active'));
      document.getElementById('tab-session').classList.add('active');
      window.print();
    };

    document.getElementById('mls-save-odt').onclick = async ()=>{
      const btn = document.getElementById('mls-save-odt');
      const orig = btn.textContent; btn.textContent = 'Building ODT…'; btn.disabled = true;
      try {
        await ensureJsZip();
        const snap = snapshotMlsDay(mlsDay);
        const member = mlsSignedInMember();
        const fileBase = 'BnB_Session_' + slugify(member ? member.name : 'Guest') + '_' + snap.title.replace(/[^\w]+/g,'_');
        const zip = new JSZip();
        zip.file('mimetype', 'application/vnd.oasis.opendocument.text', {compression:"STORE"});
        zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`);
        zip.file('content.xml', buildOdtContentXml(snap));
        const blob = await zip.generateAsync({type:'blob', mimeType:'application/vnd.oasis.opendocument.text'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileBase + '.odt'; a.click();
        URL.revokeObjectURL(url);
      } catch(err){
        alert('ODT export needs an internet connection the first time (to load the zip library). Please check your connection and try again.');
        console.error(err);
      } finally {
        btn.textContent = orig; btn.disabled = false;
      }
    };

    document.getElementById('mls-mode-program').onclick = ()=>{ setMlsMode(mlsDay, 'program'); renderMlsDay(); };
    document.getElementById('mls-mode-freeform').onclick = ()=>{ setMlsMode(mlsDay, 'freeform'); renderMlsDay(); };

    document.getElementById('mls-history-clear-btn').addEventListener('click', ()=>{
      const member = mlsSignedInMember();
      if (!member) return;
      if (!confirm("Clear all of your saved session history? This can't be undone.")) return;
      saveMlsHistoryArr(loadMlsHistory().filter(h=>h.memberId!==member.id));
      renderMlsHistoryTable();
      renderMlsGraphOptions();
      renderMlsGraph();
    });

    document.getElementById('mls-graph-exercise').addEventListener('change', renderMlsGraph);
  }

  // Read-only cross-module export — lets the Coach Dashboard's Client
  // Progress panel chart a specific member's logged exercise loads without
  // duplicating the history storage or its parsing logic. Mirrors exactly
  // what renderMlsGraph() already computes for the member's own view above.
  window.BNB_MLS = {
    getExerciseNames: function(memberId){
      const names = {};
      loadMlsHistory().filter(h=>h.memberId===memberId).forEach(h=>{
        (h.exercises||[]).forEach(ex=>{ if ((ex.name||'').trim()) names[ex.name.trim()] = true; });
      });
      return Object.keys(names).sort();
    },
    getExerciseSeries: function(memberId, exerciseName){
      const history = loadMlsHistory().filter(h=>h.memberId===memberId).sort((a,b)=> a.dateIso.localeCompare(b.dateIso));
      const points = [];
      history.forEach(h=>{
        (h.exercises||[]).forEach(ex=>{
          if ((ex.name||'').trim().toLowerCase() !== (exerciseName||'').trim().toLowerCase()) return;
          let maxWt = null;
          (ex.sets||[]).forEach(s=>{
            const n = parseFloat(s.wt);
            if (!isNaN(n) && (maxWt===null || n>maxWt)) maxWt = n;
          });
          if (maxWt !== null) points.push({ date: h.dateIso, wt: maxWt });
        });
      });
      return points;
    },
    // Read-only — used by the Coach Dashboard's "Today's Program" marker
    // to compare a member's assigned exercises for a given date against
    // what they actually logged. Returns null if nothing was logged that
    // day; otherwise the session's mode ('program' or 'freeform') plus
    // its exercises, so the caller can tell a real name-match apart from
    // a freeform entry that was never tied to the assigned program.
    getLoggedExercisesForDate: function(memberId, dateIso){
      const row = loadMlsHistory().find(h => h.memberId === memberId && h.dateIso === dateIso);
      return row ? { mode: row.mode, exercises: row.exercises || [] } : null;
    }
  };

  function parseWorkoutText(text){
    const variants = [];
    let cur = null;
    const tidyHeading = h => {
      const t = h.replace(/:\s*$/, '').replace(/^i?f\s+your\s+goal\s+is\s+/i, '').trim();
      return t.charAt(0).toUpperCase() + t.slice(1);
    };
    let block = '';
    String(text || '').split(/\r?\n/).forEach(raw => {
      let line = raw.replace(/^\s*(?:[-*•▪◦]|\d+[.)])\s*/, '').trim();
      if (!line) return;
      if (/:\s*$/.test(line)){
        // "Block A:", "A:", "Superset 1:", "Circuit 2:" start a block in
        // the current version; any other heading starts a new version.
        const bn = blockHeadingName(line.replace(/:\s*$/, ''));
        if (bn){
          if (!cur){ cur = { name: 'Workout', exercises: [] }; variants.push(cur); }
          block = bn;
          return;
        }
        cur = { name: tidyHeading(line), exercises: [] }; variants.push(cur); block = ''; return;
      }
      // "A1. Back Squat" / "B2) RDL": Block A / Block B, prefix dropped.
      const ab = line.match(/^([A-Z])(\d{1,2})\s*[.):-]\s*(.+)$/);
      if (ab){ block = 'Block ' + ab[1]; line = ab[3].trim(); }
      let name = line, presc = '';
      const colon = line.match(/^(.+?)\s*(?::|\s[–—-]\s)\s*(.+)$/);
      const inline = line.match(/^(.*?[a-z)])\s+(\d+\s*[x×*]\s*\S.*)$/i);
      if (colon){ name = colon[1]; presc = colon[2]; }
      else if (inline){ name = inline[1]; presc = inline[2]; }
      const m = presc.match(/(\d+)\s*[x×*]\s*\d/) || presc.match(/(\d+)\s*sets?\b/i);
      const sets = Math.min(Math.max(m ? parseInt(m[1], 10) : 3, 1), 10);
      if (!cur){ cur = { name: 'Workout', exercises: [] }; variants.push(cur); }
      cur.exercises.push({ name: name.trim().slice(0, 120), presc: presc.trim().slice(0, 200), sets, block });
    });
    return variants.filter(v => v.exercises.length);
  }

  /* Blocks inside a version: each exercise row carries `block` (its block's
     name, '' when the version isn't split). Consecutive rows with the same
     name make one block — the "Insert block here" breaks in the editor.
     Names like "Block A", "B", "Superset 2" give the A1, A2… labels. */
  function blockHeadingName(text){
    const t = String(text || '').trim();
    const m = t.match(/^(block|superset|circuit|part|section|round)\s*([a-z]|\d{1,2})$/i);
    if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() + ' ' + m[2].toUpperCase();
    if (/^[a-z]$/i.test(t)) return 'Block ' + t.toUpperCase();
    // Named sections of one workout, not alternative versions of it.
    if (/^(warm[\s-]?up|cool[\s-]?down|finisher|core|conditioning|mobility|activation|accessor(y|ies)|main( lifts?| sets?)?|metcon|wod|cardio|abs)$/i.test(t)){
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return '';
  }
  // "Block A", "B", "Superset 2", or a longer name ending in one of those
  // ("Leg day — Block A") → "A" / "B" / "2".
  function blockToken(name){
    const t = String(name || '').trim();
    const m = t.match(/^(?:(?:block|superset|circuit|part|section|round)\s*)?([a-z]|\d{1,2})$/i) ||
              t.match(/(?:^|\s)(?:block|superset|circuit|part|section|round)\s+([a-z]|\d{1,2})$/i);
    return m ? m[1].toUpperCase() : '';
  }
  // One exercise as editor fields. Already structured: filled out with any
  // missing fields. Saved from text ({ name, presc, sets }): "3 x 8 @ 80kg,
  // rest 90s" splits into Sets 3 / Reps 8 / Load 80kg / Rest 90s, anything
  // else stays in Reps. A line whose "3 * 15" ended up in the name (saved
  // before "*" was understood) is split back out first.
  function structuredExercise(ex){
    const base = { name:'', sets:'', reps:'', load:'', rest:'', tempo:'', equipment:'', alternates:'', block:'' };
    if (ex && 'reps' in ex){
      const out = Object.assign(base, ex);
      delete out.presc;
      return out;
    }
    let name = String((ex && ex.name) || '').trim(), presc = String((ex && ex.presc) || '').trim();
    if (!presc){
      const re = parseWorkoutText(name)[0];
      if (re && re.exercises[0] && re.exercises[0].presc){ name = re.exercises[0].name; presc = re.exercises[0].presc; }
    }
    const out = Object.assign(base, { name, block: (ex && ex.block) || '' });
    let rest = presc;
    const restM = rest.match(/,?\s*rest\s*:?\s*(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+)?\s*(?:s|secs?|seconds?|m|mins?|minutes?)\b)/i) ||
                  rest.match(/,?\s*(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+)?\s*(?:s|secs?|seconds?|mins?|minutes?))\s+rest\b/i);
    if (restM){ out.rest = restM[1].trim(); rest = rest.replace(restM[0], ''); }
    const loadM = rest.match(/\s*@\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|lbs?|%)?)/i) || rest.match(/\s+(\d+(?:\.\d+)?\s*(?:kg|kgs|lbs?))\b/i);
    if (loadM){ out.load = loadM[1].trim(); rest = rest.replace(loadM[0], ''); }
    const sx = rest.match(/^\s*(\d+)\s*[x×*]\s*(.+)$/i);
    if (sx){ out.sets = sx[1]; out.reps = sx[2].trim(); }
    else {
      const sm = rest.match(/(\d+)\s*sets?\b/i);
      out.sets = sm ? sm[1] : String((ex && ex.sets) || '');
      out.reps = rest.trim();
    }
    out.reps = out.reps.replace(/[,;]\s*$/, '').replace(/^\((.*)\)$/, '$1').trim();
    return out;
  }
  // Freeform: a heading where a block starts (group set by a split workout
  // or the program's blocks).
  function freeformGroupHead(list, eIdx){
    const g = list[eIdx].group;
    if (!g || (eIdx > 0 && list[eIdx - 1].group === g)) return null;
    const h = document.createElement('div');
    h.className = 'ff-group-head';
    h.textContent = g;
    return h;
  }

  /* Summary for a list of rows (a version, a block, a day):
       exercises — rows with a name.
       sets      — the Sets fields added up (blank, e.g. a hold, is 1).
       rest      — each row's Rest × its sets, counting the rest after the
                   last set too (the move to the next exercise). With no
                   Rest set: 2½ min for 1–5 reps, 90 s for 6–12, 60 s for
                   13+ or timed/distance work.
       minutes   — work + rest. Work per set is reps × the tempo's seconds
                   (3-1-1 or 3010 = 5 s / 4 s; X = 1 s) or ~3 s a rep, the
                   time written in for timed work ("60s"), or ~45 s for
                   distance ("24m"). A rep counts for 20 s at most. */
  function workoutStats(variant){
    let exercises = 0, sets = 0, restSec = 0, seconds = 0;
    const secs = (num, unit) => num * (/^m/i.test(unit) ? 60 : 1);
    (variant.exercises || []).map(structuredExercise).forEach(ex => {
      if (!String(ex.name).trim()) return;
      exercises++;
      const n = Math.min(parseInt(ex.sets, 10) || 1, 10);
      sets += n;
      const r = String(ex.reps || '').toLowerCase().trim();
      const timeM = r.match(/^(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(s|secs?|seconds?|mins?|minutes?)\b/);
      const distM = r.match(/^(\d+(?:\.\d+)?)\s*(m|meters?|metres?|yd|yards?|km)\b/);
      const repM = r.match(/^(\d+)(?:\s*[-–]\s*(\d+))?/);
      const tempoText = String(ex.tempo || '').trim();
      const phases = /^[\dx]{3,4}$/i.test(tempoText) ? tempoText.split('') : tempoText.split(/[-–\/\s]+/);
      const tempoSec = Math.min(phases.map(t => /^x$/i.test(t.trim()) ? 1 : parseFloat(t)).filter(x => x >= 0).reduce((a, b) => a + b, 0), 20);
      let repsPerSet = null, workSec;
      if (timeM) workSec = secs(timeM[2] ? (parseFloat(timeM[1]) + parseFloat(timeM[2])) / 2 : parseFloat(timeM[1]), timeM[3]);
      else if (distM) workSec = 45;
      else if (repM){
        repsPerSet = repM[2] ? (parseInt(repM[1], 10) + parseInt(repM[2], 10)) / 2 : parseInt(repM[1], 10);
        workSec = repsPerSet * (tempoSec || 3);
      } else workSec = 30;
      const restM = String(ex.rest || '').toLowerCase().match(/(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(s|secs?|seconds?|m|mins?|minutes?|'|")?/);
      const rest = restM ? secs(restM[2] ? (parseFloat(restM[1]) + parseFloat(restM[2])) / 2 : parseFloat(restM[1]), restM[3] === "'" ? 'm' : (restM[3] || (parseFloat(restM[1]) <= 5 ? 'm' : 's')))
        : repsPerSet === null ? 60 : repsPerSet <= 5 ? 150 : repsPerSet <= 12 ? 90 : 60;
      restSec += n * rest;
      seconds += n * (workSec + rest);
    });
    return { exercises, sets, restMinutes: Math.round(restSec / 60), minutes: Math.round(seconds / 60) };
  }
  // "9 exercises · 29 sets · ≈ 57 min · ≈ 31 min rest"
  function workoutStatsText(st){
    return st.exercises + ' exercise' + (st.exercises === 1 ? '' : 's') + ' · ' + st.sets + ' set' + (st.sets === 1 ? '' : 's') +
      ' · ≈ ' + st.minutes + ' min · ≈ ' + st.restMinutes + ' min rest';
  }
  // One short line for client-facing day views; nothing on a rest day.
  function dayStatsLine(blocks){
    const st = workoutStats({ exercises: (blocks || []).flatMap(b => b.exercises || []) });
    return st.exercises ? '<div class="day-stats-line">' + workoutStatsText(st) + '</div>' : '';
  }
  // Today's workout from the program, for the member Today card
  // (js/bells-n-barz-today.js).
  window.BNB_TRAINING = {
    today(){
      const idx = new Date().getDay();
      const day = DAY_ORDER[idx === 0 ? 6 : idx - 1];
      const blocks = programData[day] || [];
      const meta = DAY_META[day] || {};
      return { day, title: meta.title || '', duration: meta.duration || '',
        exercises: blocks.flatMap(b => (b.exercises || []).map(e => splitAltFromName(e.name).name)).filter(Boolean) };
    }
  };

  // Shared with js/bells-n-barz-coach.js (staff.html only), which runs after
  // this file. programData and mlsDay change, so they're getters/setters.
  window.BNB_TC = {
    DEFAULT_PROGRAM, DAY_META, DAY_ORDER, clone, prescString, metaLine, renderAllPerform, renderTodayProgram, esc, ensureJsPdf, drawPdfStar, drawPdfSetChips, splitAltFromName, freeformFromProgram, buildAltPicker, buildFreeformNameRow, programExName, fillProgramExHead, localIsoDate, startRest, slugify, buildSessionMarkdown, buildSessionText, downloadTextFile, getMlsMode, setMlsMode, getMlsFreeformExercises, saveMlsFreeformExercises, refreshMlsHistoryFromSupabase, renderMlsDayTabs, renderMlsDay, liftKey, memberHistory, bestsFrom, parseWorkoutText, blockToken, structuredExercise, freeformGroupHead, workoutStats,
    get programData(){ return programData; }, set programData(v){ programData = v; },
    get mlsDay(){ return mlsDay; }, set mlsDay(v){ mlsDay = v; }
  };

  /* -------------------------------- INIT ---------------------------------- */
  // The coach's parts (Program Builder, coach Live Session, Workouts to Try)
  // are in js/bells-n-barz-coach.js, loaded on staff.html only.
  renderAllPerform();
  renderTodayProgram();
  renderMlsDayTabs();
  renderMlsDay();
  wireMlsOnce();

})();

