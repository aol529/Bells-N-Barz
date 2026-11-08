/* =========================================================================
   BELL(E)S N' BARZ — COACH: PROGRAM BUILDER / LIVE SESSION / WORKOUTS TO TRY
   Loaded only on staff.html, after js/bells-n-barz-training-core.js. Uses
   the shared helpers that file puts on window.BNB_TC. Moved out of
   training-core so the main page doesn't download the coach's code.
   ========================================================================= */
(function(){
  const TC = window.BNB_TC;
  if (!TC) return;
  const { DEFAULT_PROGRAM, DAY_META, DAY_ORDER, clone, prescString, metaLine, renderAllPerform, renderTodayProgram, esc, ensureJsPdf, drawPdfStar, drawPdfSetChips, splitAltFromName, freeformFromProgram, buildAltPicker, buildFreeformNameRow, programExName, fillProgramExHead, localIsoDate, startRest, slugify, buildSessionMarkdown, buildSessionText, downloadTextFile, getMlsMode, setMlsMode, getMlsFreeformExercises, saveMlsFreeformExercises, refreshMlsHistoryFromSupabase, renderMlsDayTabs, renderMlsDay, liftKey, memberHistory, bestsFrom, parseWorkoutText, blockToken, structuredExercise, freeformGroupHead, workoutStats } = TC;

  // Preset library: js/bells-n-barz-program-presets.js (staff.html only).
  const PROGRAM_PRESETS = window.BNB_PROGRAM_PRESETS || [];

  document.addEventListener('click', ()=>{
    document.querySelectorAll('.cs-freeform-copy-menu').forEach(m => { m.style.display = 'none'; });
  });

  /* ---------------- PROGRAM BUILDER: PER-CLIENT EDITING ---------------- */
  // A coach editing a specific client's program uses this SEPARATE state,
  // not programData/programRowId in training-core — those stay tied to whoever is
  // actually logged in and drive the public Manual, the Overview preview,
  // and Live Session Log. Without this split, a coach browsing to a
  // different client mid-edit here would also temporarily hijack what
  // the Manual shows in that same browser tab. The one exception: saving
  // your OWN program through this picker (adminOwnerId === your own id)
  // re-syncs programData too, so self-edits still show up immediately
  // elsewhere in the app, same as before this feature existed.
  let adminOwnerId = null;
  let adminProgramData = clone(DEFAULT_PROGRAM); // never null — renderAdminBlocks() runs at init, before any real load
  let adminProgramRowId = null;
  let adminLoading = Promise.resolve();  // the client load in flight (see loadAdminProgramFor)
  let adminNotifiedThisLoad = false; // saveAdminProgram() fires on every keystroke — only notify once per client selected, not once per edit

  function populateAdminClientPicker(){
    const sel = document.getElementById('admin-client-picker');
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!sel || !me) return;
    const members = window.BNB_USERS.getMembers().slice().sort((a,b)=>a.fullName.localeCompare(b.fullName));
    sel.innerHTML = '<option value="' + me.id + '">Myself</option>' +
      members.filter(u=>u.id!==me.id).map(u=>'<option value="'+u.id+'">'+esc(u.fullName)+'</option>').join('');
    sel.value = adminOwnerId || me.id;
    sel.onchange = () => { syncProgramsPicker(); loadAdminProgramFor(sel.value); };
    if (!adminOwnerId) loadAdminProgramFor(me.id);
    syncProgramsPicker();
  }
  // Coach > Programs has its own "Program for" picker: the same list, kept
  // in step with Program Builder's, so a program loads for the client
  // chosen on either page.
  function syncProgramsPicker(){
    const from = document.getElementById('admin-client-picker');
    const to = document.getElementById('programs-client-picker');
    if (!from || !to) return;
    to.innerHTML = from.innerHTML;
    to.value = from.value;
    to.onchange = () => { from.value = to.value; loadAdminProgramFor(to.value); };
  }
  window.bnbProgramsOnShown = populateAdminClientPicker;
  // After a program is loaded on the Programs page: straight to Program Builder.
  function openProgramBuilder(){
    const btn = document.querySelector('#coach-section-switch [data-coach-section="program"]');
    if (btn) btn.click();
  }
  window.bnbOpenProgramBuilder = openProgramBuilder;
  const programsLink = document.getElementById('open-programs-link');
  if (programsLink) programsLink.onclick = (e)=>{
    e.preventDefault();
    const btn = document.querySelector('#coach-section-switch [data-coach-section="programs"]');
    if (btn) btn.click();
  };
  // Exposed so the Coach sub-switcher (a separate <script> block/closure)
  // can refresh the picker's member list each time Program Builder is
  // opened — same cross-closure export pattern already used by
  // mlsOnTabShown/schedOnTabShown/bnbAccountabilityOnTabShown.
  window.bnbProgramBuilderOnShown = function(){
    populateAdminClientPicker();
    // Re-draw once the coach's Workouts to Try are in, for the blocks'
    // "From: …" links and Update buttons.
    fillAdminLoadWorkout().then(renderAdminBlocks);
  };

  // Picking a client loads their program; anything that saves over it
  // (loading a preset or a built program) waits for that to finish, so it
  // never saves onto the previous client's row.
  function loadAdminProgramFor(ownerId){
    adminLoading = fetchAdminProgramFor(ownerId);
    return adminLoading;
  }
  async function fetchAdminProgramFor(ownerId){
    adminOwnerId = ownerId;
    const { data, error } = await bnbClient.from('programs').select('*').eq('owner_id', ownerId);
    if (error) { console.error('Supabase load programs failed:', error); return; }
    if (data && data.length){ adminProgramRowId = data[0].id; adminProgramData = data[0].data; }
    else { adminProgramRowId = null; adminProgramData = clone(DEFAULT_PROGRAM); }
    adminNotifiedThisLoad = false;
    renderAdminDayTabs(); renderAdminBlocks();
  }

  function saveAdminProgram(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me || !adminOwnerId) return;
    (async () => {
      try {
        const row = { owner_id: adminOwnerId, name: 'Default Program', data: adminProgramData, updated_at: new Date().toISOString() };
        if (adminProgramRowId) row.id = adminProgramRowId;
        if (adminOwnerId !== me.id){ row.assigned_by = me.id; row.assigned_at = new Date().toISOString(); }
        const { data, error } = await bnbClient.from('programs').upsert([row], { onConflict: 'owner_id' }).select();
        if (error) throw error;
        if (data && data[0]) adminProgramRowId = data[0].id;
        // Editing your own program through this picker is functionally
        // the same program the Manual/Overview/Live Session Log render —
        // keep them in sync immediately rather than waiting for a reload.
        if (adminOwnerId === me.id){
          TC.programData = adminProgramData;
          renderAllPerform(); renderTodayProgram();
        } else if (!adminNotifiedThisLoad){
          // Once per client selected, not once per edit — saveAdminProgram()
          // fires on every keystroke while editing.
          adminNotifiedThisLoad = true;
          bnbClient.from('notifications').insert([{
            user_id: adminOwnerId, type: 'program_assigned',
            message: 'Your coach updated your training program.', link_tab: 'overview'
          }]).then(({ error: notifErr }) => { if (notifErr) console.warn('Supabase insert notification failed:', notifErr); });
        }
      } catch(e){
        console.warn('Supabase save programs failed:', e);
      }
    })();
  }


  /* ================================ ADMIN ================================ */
  let adminDay = "mon";

  function renderAdminDayTabs(){
    const bar = document.getElementById('admin-day-tabs');
    bar.innerHTML = '';
    // Phone-width stand-in: same day list as the button row below, kept in sync.
    const select = document.createElement('select');
    select.className = 'day-tabs-dropdown';
    select.setAttribute('aria-label', 'Select day to edit');
    DAY_ORDER.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = DAY_META[d].title.split('—')[0].trim();
      if (d===adminDay) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = ()=>{ adminDay = select.value; renderAdminDayTabs(); renderAdminBlocks(); };
    bar.appendChild(select);
    DAY_ORDER.forEach(d=>{
      const b = document.createElement('button');
      b.className = 'subtab-btn' + (d===adminDay ? ' active' : '');
      b.textContent = DAY_META[d].title.split('—')[0].trim();
      b.onclick = ()=>{ adminDay = d; renderAdminDayTabs(); renderAdminBlocks(); };
      bar.appendChild(b);
    });
  }

  function renderAdminBlocks(){
    renderBlockEditor(document.getElementById('admin-blocks'), adminProgramData[adminDay] || [], saveAdminProgram, renderAdminBlocks,
      { blockExtras: blockWorkoutLink, stats: true, onChange: renderAdminDayStats, splitBlocks: true });
    renderAdminDayStats();
  }
  // The whole day's summary, under the blocks.
  function renderAdminDayStats(){
    const el = document.getElementById('admin-day-stats');
    if (!el) return;
    const blocks = adminProgramData[adminDay] || [];
    const all = { exercises: blocks.flatMap(b => b.exercises || []) };
    el.innerHTML = blocks.length > 0 && all.exercises.length
      ? '<div class="admin-day-stats-head">' + esc(DAY_META[adminDay].title.split('—')[0].trim()) + ' total</div>' + workoutStatsHtml(all)
      : '';
  }

  /* Block/exercise editor shared by Program Builder (blocks of one day)
     and Coach > Workouts to Try (versions of one workout). Edits change
     `blocks` in place; save() runs after each one, rerender() after rows
     are added or removed. opts.noun names a block ("Version"). */
  function blankExercise(){
    return { name:'New Exercise', sets:'3', reps:'10', load:'', rest:'', tempo:'', equipment:'', alternates:'' };
  }
  // In a split version, "+ Exercise" adds to the last block.
  function addExerciseRow(exercises){
    const last = exercises[exercises.length - 1];
    exercises.push(Object.assign(blankExercise(), last && last.block ? { block: last.block } : {}));
  }
  // Header where a block starts inside a version: its name (rename it
  // there) and ✕, which merges its rows into the block above — or into the
  // one below for the first block. With one block left, the split goes.
  function subBlockHeader(exercises, start, save, rerender){
    const name = exercises[start].block;
    let end = start;
    while (end + 1 < exercises.length && exercises[end + 1].block === name) end++;
    const head = document.createElement('div');
    head.className = 'crud-sub-head';
    const input = document.createElement('input');
    input.value = name;
    input.setAttribute('aria-label', 'Block name');
    input.onchange = ()=>{
      const v = input.value.trim();
      if (!v){ input.value = name; return; }
      for (let i = start; i <= end; i++) exercises[i].block = v;
      save(); rerender();
    };
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'crud-remove'; del.title = 'Remove this block break'; del.textContent = '✕';
    del.onclick = ()=>{
      const into = start > 0 ? exercises[start - 1].block : (end + 1 < exercises.length ? exercises[end + 1].block : '');
      for (let i = start; i <= end; i++) exercises[i].block = into;
      if (new Set(exercises.map(ex => ex.block || '')).size <= 1) exercises.forEach(ex => { ex.block = ''; });
      save(); rerender();
    };
    head.appendChild(input); head.appendChild(del);
    return head;
  }
  // "+ Insert block here" after row i: opens a small name box with the
  // next free name. The rest of row i's block moves into the new block;
  // after the last row of a block, the new block starts with a blank row.
  // The first break also names the rows above it (Block A / Block 1).
  function insertBlockLine(exercises, i, save, rerender){
    const line = document.createElement('div');
    line.className = 'crud-insert-block';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '+ Insert block here';
    btn.onclick = ()=>{
      line.innerHTML = '';
      line.classList.add('open');
      const input = document.createElement('input');
      input.value = nextBlockName(exercises);
      input.setAttribute('aria-label', 'New block name');
      const ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'btn2 primary'; ok.textContent = 'Add Block';
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn2'; cancel.textContent = 'Cancel';
      const label = document.createElement('span');
      label.textContent = 'Name the new block';
      line.appendChild(label); line.appendChild(input); line.appendChild(ok); line.appendChild(cancel);
      input.focus(); input.select();
      const go = ()=>{
        const name = input.value.trim();
        if (!name){ input.focus(); return; }
        if (!exercises.some(ex => ex.block)){
          const first = /\d/.test(blockToken(name)) ? 'Block 1' : 'Block A';
          exercises.forEach(ex => { ex.block = first; });
        }
        const cur = exercises[i].block;
        let j = i + 1;
        if (j < exercises.length && exercises[j].block === cur){
          for (; j < exercises.length && exercises[j].block === cur; j++) exercises[j].block = name;
        } else {
          exercises.splice(i + 1, 0, Object.assign(blankExercise(), { name: '', block: name }));
        }
        save(); rerender();
      };
      ok.onclick = go;
      input.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } if (e.key === 'Escape') rerender(); };
      cancel.onclick = rerender;
    };
    line.appendChild(btn);
    return line;
  }

  // Program Builder: "✂ Split into a new block here" after row i (not the
  // last) opens a name box. Rows below move into a new block after this
  // one. Names follow the block's own: "Leg day" splits into "Leg day —
  // Block A" and "Leg day — Block B"; a further split takes the next free
  // letter or number. A split block loses its Workouts to Try link (the
  // saved workout no longer matches either half).
  function splitBase(name){
    return String(name || '').replace(/\s*[—–-]?\s*(?:block|superset|circuit|part|section|round)\s+(?:[a-z]|\d{1,2})$/i, '').trim();
  }
  function splitBlockLine(blocks, bIdx, i, save, rerender){
    const block = blocks[bIdx];
    const line = document.createElement('div');
    line.className = 'crud-insert-block';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '\u2702 Split into a new block here';
    btn.onclick = ()=>{
      const base = splitBase(block.name);
      const named = !!blockToken(block.name);
      const siblings = blocks.filter(b => splitBase(b.name) === base && blockToken(b.name)).map(b => ({ block: b.name }));
      const tok = nextBlockName(siblings);
      const join = n => base ? base + ' \u2014 ' + n : n;
      line.innerHTML = '';
      line.classList.add('open');
      const label = document.createElement('span');
      label.textContent = 'Name the new block' + (block.src ? ' (this unlinks it from Workouts to Try)' : '');
      const input = document.createElement('input');
      input.value = join(tok);
      input.setAttribute('aria-label', 'New block name');
      const ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'btn2 primary'; ok.textContent = 'Split';
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn2'; cancel.textContent = 'Cancel';
      line.appendChild(label); line.appendChild(input); line.appendChild(ok); line.appendChild(cancel);
      input.focus(); input.select();
      const go = ()=>{
        const name = input.value.trim();
        if (!name){ input.focus(); return; }
        if (!named) block.name = join(/\d/.test(blockToken(name)) ? 'Block 1' : 'Block A');
        const rest = block.exercises.splice(i + 1);
        delete block.src;
        blocks.splice(bIdx + 1, 0, { name, exercises: rest });
        save(); rerender();
      };
      ok.onclick = go;
      input.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } if (e.key === 'Escape') rerender(); };
      cancel.onclick = rerender;
    };
    line.appendChild(btn);
    return line;
  }

  function renderBlockEditor(wrap, blocks, save, rerender, opts){
    const noun = (opts && opts.noun) || 'Block';
    wrap.innerHTML = '';

    blocks.forEach((block, bIdx)=>{
      const bDiv = document.createElement('div');
      bDiv.className = 'crud-block';

      const head = document.createElement('div');
      head.className = 'crud-block-head';
      const nameInput = document.createElement('input');
      nameInput.value = block.name;
      nameInput.setAttribute('aria-label', noun + ' name');
      nameInput.oninput = ()=>{ block.name = nameInput.value; save(); };
      const headBtns = document.createElement('div');
      headBtns.style.cssText = 'display:flex;gap:6px;';
      const addExBtn = document.createElement('button');
      addExBtn.className = 'btn2'; addExBtn.type = 'button'; addExBtn.textContent = '+ Exercise';
      addExBtn.onclick = ()=>{
        addExerciseRow(block.exercises);
        save(); rerender();
      };
      const delBlockBtn = document.createElement('button');
      delBlockBtn.className = 'crud-remove'; delBlockBtn.type = 'button'; delBlockBtn.title = 'Delete ' + noun.toLowerCase(); delBlockBtn.textContent = '✕';
      delBlockBtn.onclick = ()=>{
        if(!confirm('Delete "' + block.name + '" and all its exercises?')) return;
        blocks.splice(bIdx,1); save(); rerender();
      };
      headBtns.appendChild(addExBtn);
      // Program Builder: undo a split — this block's rows join the one above.
      if (opts && opts.splitBlocks && bIdx > 0){
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'btn2'; mergeBtn.type = 'button'; mergeBtn.textContent = '\u2191 Merge';
        mergeBtn.title = 'Move these exercises into "' + blocks[bIdx - 1].name + '" above';
        mergeBtn.onclick = ()=>{
          const above = blocks[bIdx - 1];
          above.exercises.push(...block.exercises);
          if (above.src || block.src) delete above.src;
          blocks.splice(bIdx, 1); save(); rerender();
        };
        headBtns.appendChild(mergeBtn);
      }
      headBtns.appendChild(delBlockBtn);
      head.appendChild(nameInput); head.appendChild(headBtns);
      bDiv.appendChild(head);
      if (opts && opts.blockExtras) opts.blockExtras(block, bDiv);
      // Per-block summary, redrawn as rows are typed into (opts.stats).
      const statsEl = document.createElement('div');
      const drawBlockStats = ()=>{ statsEl.innerHTML = workoutStatsHtml(block); };
      const changed = ()=>{ save(); if (opts && opts.stats){ drawBlockStats(); if (opts.onChange) opts.onChange(); } };

      // opts.subBlocks (Workouts to Try): rows split into blocks by their
      // `block` field — a header where each block starts, an "Insert block
      // here" line between rows, and A1/A2 labels by the names.
      const sub = !!(opts && opts.subBlocks);
      const labels = sub ? exerciseLabels(block.exercises) : [];
      block.exercises.forEach((ex, eIdx)=>{
        if (sub && ex.block && (eIdx === 0 || block.exercises[eIdx - 1].block !== ex.block)){
          bDiv.appendChild(subBlockHeader(block.exercises, eIdx, save, rerender));
        }
        const row = document.createElement('div');
        row.className = 'crud-ex-row';
        row.innerHTML = `
          <div class="crud-col crud-col-name"><label>Exercise</label><input data-f="name" value="${esc(ex.name)}" placeholder="Exercise name"></div>
          <div class="crud-col"><label>Sets</label><input data-f="sets" value="${esc(ex.sets)}"></div>
          <div class="crud-col"><label>Reps</label><input data-f="reps" value="${esc(ex.reps)}"></div>
          <div class="crud-col"><label>Load</label><input data-f="load" value="${esc(ex.load)}" placeholder="e.g. 80kg"></div>
          <div class="crud-col"><label>Rest</label><input data-f="rest" value="${esc(ex.rest)}" placeholder="e.g. 90s"></div>
          <div class="crud-col"><label>Tempo</label><input data-f="tempo" value="${esc(ex.tempo)}" placeholder="e.g. 3-1-1"></div>
          <div class="crud-col"><label>Equipment</label><input data-f="equipment" value="${esc(ex.equipment)}" placeholder="e.g. Barbell"></div>
          <div class="crud-col"><label>Alternates</label><input data-f="alternates" value="${esc(ex.alternates)}" placeholder="comma, separated"></div>
          <div class="crud-col crud-col-del"><label>&nbsp;</label><button class="crud-remove" type="button" title="Remove exercise">✕</button></div>
        `;
        row.querySelectorAll('input').forEach(inp=>{
          inp.oninput = ()=>{ ex[inp.dataset.f] = inp.value; changed(); };
        });
        row.querySelector('.crud-remove').onclick = ()=>{
          block.exercises.splice(eIdx,1); save(); rerender();
        };
        // ⇄ next to the name: swap this exercise for one of its alternatives
        // (rebuilt when the name or Alternates change, so the list follows).
        const nameInp = row.querySelector('input[data-f="name"]');
        const nameLine = document.createElement('div');
        nameLine.className = 'crud-name-line';
        nameInp.replaceWith(nameLine);
        if (labels[eIdx]){
          const tag = document.createElement('span');
          tag.className = 'crud-ex-label';
          tag.textContent = labels[eIdx];
          nameLine.appendChild(tag);
        }
        nameLine.appendChild(nameInp);
        let picker = null;
        const placePicker = ()=>{
          const next = buildAltPicker({ name: ex.name, baseAlts: ex.alternates }, val => {
            ex.name = val; nameInp.value = val; changed(); placePicker();
          });
          if (picker) picker.remove();
          picker = next;
          if (picker) nameLine.appendChild(picker);
        };
        placePicker();
        nameInp.onchange = placePicker;
        row.querySelector('input[data-f="alternates"]').onchange = placePicker;
        bDiv.appendChild(row);
        if (sub) bDiv.appendChild(insertBlockLine(block.exercises, eIdx, save, rerender));
        if (opts && opts.splitBlocks && eIdx < block.exercises.length - 1) bDiv.appendChild(splitBlockLine(blocks, bIdx, eIdx, save, rerender));
      });

      if (opts && opts.stats && block.exercises.length){
        statsEl.className = 'crud-block-stats';
        drawBlockStats();
        bDiv.appendChild(statsEl);
      }
      wrap.appendChild(bDiv);
    });
  }


  bnbEl('admin-add-block').onclick = ()=>{
    (adminProgramData[adminDay] = adminProgramData[adminDay] || []).push({name:'New Block', exercises:[]});
    saveAdminProgram(); renderAdminBlocks();
  };
  bnbEl('admin-reset-day').onclick = ()=>{
    if(!confirm('Reset ' + DAY_META[adminDay].title + ' back to the manual\u2019s original Perform blocks? This discards your edits for this day.')) return;
    adminProgramData[adminDay] = clone(DEFAULT_PROGRAM[adminDay]);
    saveAdminProgram(); renderAdminBlocks();
  };
  (function(){
    const grid = document.getElementById('admin-preset-grid');
    if (!grid) return;
    grid.innerHTML = PROGRAM_PRESETS.map(p =>
      '<div class="format-card" data-preset-id="' + esc(p.id) + '">' +
        '<div class="format-tag">PRESET</div>' +
        '<h4>' + esc(p.name) + '</h4>' +
        '<p>' + esc(p.description) + '</p>' +
        '<div class="format-setup">' +
          '<button class="format-load-btn" type="button">Load for Client</button>' +
        '</div>' +
      '</div>'
    ).join('');
    grid.querySelectorAll('.format-card').forEach(card => {
      card.querySelector('.format-load-btn').onclick = ()=>{
        const preset = PROGRAM_PRESETS.find(p => p.id === card.dataset.presetId);
        if (!preset) return;
        const picker = document.getElementById('programs-client-picker');
        const who = picker && picker.selectedOptions[0] ? picker.selectedOptions[0].textContent.trim() : 'the client chosen above';
        if (!confirm('Load "' + preset.name + '" for ' + who + '? This replaces every day of their current program.')) return;
        loadProgramForClient(preset.data).then(()=>{ alert('Preset loaded — opening it in Program Builder.'); openProgramBuilder(); });
      };
    });
  })();
  // Replace the selected client's whole program (a preset, or one made by
  // Build a Program in js/bells-n-barz-program-generator.js).
  async function loadProgramForClient(data){
    await adminLoading;
    adminProgramData = clone(data);
    saveAdminProgram(); renderAdminBlocks(); renderMlsDay();
  }
  window.bnbLoadProgramForClient = loadProgramForClient;
  bnbEl('admin-export').onclick = ()=>{
    const blob = new Blob([JSON.stringify(adminProgramData, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bnb-program-export.json'; a.click();
    URL.revokeObjectURL(url);
  };
  bnbEl('admin-import-btn').onclick = ()=> document.getElementById('admin-import-file').click();
  bnbEl('admin-import-file').onchange = (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try {
        const parsed = JSON.parse(reader.result);
        adminProgramData = parsed; saveAdminProgram();
        renderAdminBlocks(); renderMlsDay();
        alert('Program imported.');
      } catch(err){ alert('That file could not be read as valid program JSON.'); }
    };
    reader.readAsText(file);
  };


  /* ========================= COACH — LIVE SESSION ========================= */
  /* Separate from the member-facing Logsheet: own storage key, own day state,
     own "who is this for" field. Nothing here reads from or writes to the
     member's logStore, so a coach's in-session logging never touches (or gets
     touched by) whatever a member has open on their own device.

     Up to 5 independent trainee "slots" live side by side — each keeps its
     own name, sets, weight/reps and notes. The day selector is shared across
     all 5 slots (a coach running back-to-back 1-on-1s is almost always on the
     same day's program each time), so switching slots only changes *whose*
     data you're looking at, not which day is loaded. */
  const SESSION_KEY = "bnb-coach-session-v1";
  const CS_SLOT_COUNT = 5;
  // Was hardcoded to "mon" — always opened on Monday regardless of the
  // actual day. Now detects today the same way Member Live Session already
  // does, so a coach opening this on a Wednesday sees Wednesday by default.
  let csDay = (function(){
    const idx = new Date().getDay(); // 0=Sun..6=Sat
    return DAY_ORDER[idx===0 ? 6 : idx-1];
  })();
  let csSlot = 0;

  function loadSession(){
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}"); }
    catch(e){ return {}; }
  }
  function saveSession(){
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sessionStore)); }
    catch(e){ /* storage unavailable */ }
  }
  let sessionStore = loadSession();

  /* Slot-scoped key helper — mirrors the member Logsheet's fKey() but with a
     slot prefix, so all 5 trainees' data can share one storage object without
     colliding. */
  function csKey(slot, ...rest){ return 's' + slot + ':' + rest.join(':'); }

  function slotTraineeName(slot){ return sessionStore[csKey(slot,'trainee')] || ''; }




  // Anything beyond an untouched program-seeded or blank list?
  function freeformListHasRealData(list){
    return list.some(ex => {
      const name = (ex.name || '').trim();
      const untouched = ex.base ? name === (ex.seed || splitAltFromName(ex.base).name) : !name;
      return !untouched || (ex.sets || []).some(s => s.wt || s.reps || s.done);
    });
  }


  /* ---- Freeform logging (per slot, per day) ----
     A coach running a real 1-on-1 often doesn't follow the written program
     block-for-block — they call out exercises as the session unfolds. Mode is
     stored per slot+day so a coach can mix: e.g. Program for Trainee A's
     Monday, Freeform for Trainee B's same slot when they go off-script. */
  function csModeKey(slot, day){ return csKey(slot, day, 'mode'); }
  function getCsMode(slot, day){ return sessionStore[csModeKey(slot, day)] === 'freeform' ? 'freeform' : 'program'; }
  function setCsMode(slot, day, mode){ sessionStore[csModeKey(slot, day)] = mode; saveSession(); }

  function freeformKey(slot, day){ return csKey(slot, day, 'freeform'); }
  function blankFreeformExercise(){ return { name:'', sets:[{ wt:'', reps:'', done:false }] }; }
  function getFreeformExercises(slot, day){
    try {
      const arr = JSON.parse(sessionStore[freeformKey(slot, day)] || 'null');
      if (Array.isArray(arr) && arr.length) return arr;
    } catch(e){ /* fall through to default below */ }
    const seeded = freeformFromProgram(day, (b, e) => sessionStore[csKey(slot, day, b, e, 'swap')]);
    return seeded.length ? seeded : [ blankFreeformExercise() ];
  }
  function saveFreeformExercises(slot, day, arr){
    sessionStore[freeformKey(slot, day)] = JSON.stringify(arr);
    saveSession();
  }

  /* Whether a slot+day's freeform log has anything a coach would mind
     overwriting — i.e. more than the untouched program-seeded (or blank)
     list getFreeformExercises() hands back by default. */
  function freeformHasRealData(slot, day){
    return freeformListHasRealData(getFreeformExercises(slot, day));
  }

  /* Copies just the exercise names & order from one slot's freeform list to
     another, same day — each landing with fresh blank sets so the receiving
     trainee logs their own weight/reps. Used for back-to-back trainees doing
     the same freeform workout. */
  function copyFreeformToSlot(fromSlot, toSlot, day){
    const source = getFreeformExercises(fromSlot, day).filter(ex => ex.name && ex.name.trim());
    if (!source.length){ showToast('Nothing to copy yet — add exercise names first'); return; }
    if (freeformHasRealData(toSlot, day)){
      const targetLabel = slotTraineeName(toSlot).trim() || ('Slot ' + (toSlot+1));
      if (!confirm("This will overwrite " + targetLabel + "'s existing freeform log for today. Continue?")) return;
    }
    const copied = source.map(ex => ({
      name: ex.name, seed: ex.seed, base: ex.base, baseAlts: ex.baseAlts, from: ex.from, presc: ex.presc,
      group: ex.group || '', label: ex.label || '',
      sets: (ex.sets && ex.sets.length ? ex.sets : [{}]).map(()=> ({ wt:'', reps:'', done:false }))
    }));
    saveFreeformExercises(toSlot, day, copied);
    setCsMode(toSlot, day, 'freeform');
    const targetLabel = slotTraineeName(toSlot).trim() || ('Slot ' + (toSlot+1));
    showToast('Copied ' + source.length + ' exercise' + (source.length===1?'':'s') + ' to ' + targetLabel);
  }

  function renderSlotSwitch(){
    const bar = document.getElementById('cs-slot-switch');
    if (!bar) return;
    bar.innerHTML = '';
    for (let i=0; i<CS_SLOT_COUNT; i++){
      const name = slotTraineeName(i);
      const b = document.createElement('button');
      b.className = 'cs-slot-btn' + (i===csSlot ? ' active' : '') + (name ? '' : ' cs-slot-empty');
      b.innerHTML = `<span class="cs-slot-num">${i+1}</span><span>${esc(name || 'Empty slot')}</span>`;
      b.onclick = ()=>{ csSlot = i; renderSlotSwitch(); renderSessionDay(); };
      bar.appendChild(b);
    }
  }

  function renderSessionDayTabs(){
    const bar = document.getElementById('cs-day-tabs');
    if (!bar) return;
    bar.innerHTML = '';
    const select = document.createElement('select');
    select.className = 'day-tabs-dropdown';
    select.setAttribute('aria-label', 'Select day for this session');
    DAY_ORDER.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = DAY_META[d].title.split('—')[0].trim();
      if (d===csDay) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = ()=>{ csDay = select.value; renderSessionDayTabs(); renderSessionDay(); };
    bar.appendChild(select);
    DAY_ORDER.forEach(d=>{
      const b = document.createElement('button');
      b.className = 'subtab-btn' + (d===csDay ? ' active' : '');
      b.textContent = DAY_META[d].title.split('—')[0].trim();
      b.onclick = ()=>{ csDay = d; renderSessionDayTabs(); renderSessionDay(); };
      bar.appendChild(b);
    });
  }

  function renderSessionDay(){
    const traineeEl = document.getElementById('cs-trainee');
    if (!traineeEl) return;
    fillTraineeList();
    traineeEl.value = slotTraineeName(csSlot);
    document.getElementById('cs-date').value = sessionStore[csKey(csSlot,csDay,'meta','date')] || '';
    document.getElementById('cs-bw').value = sessionStore[csKey(csSlot,csDay,'meta','bw')] || '';
    document.getElementById('cs-notes').value = sessionStore[csKey(csSlot,csDay,'notes')] || '';

    const mode = getCsMode(csSlot, csDay);
    const progBtn = document.getElementById('cs-mode-program');
    const freeBtn = document.getElementById('cs-mode-freeform');
    if (progBtn && freeBtn){
      progBtn.classList.toggle('active', mode === 'program');
      freeBtn.classList.toggle('active', mode === 'freeform');
    }

    const syncBtn = document.getElementById('cs-sync-member');
    if (syncBtn){
      const tName = slotTraineeName(csSlot).trim();
      syncBtn.textContent = tName ? ('Sync to ' + tName + "'s Log") : 'Sync to Member Log';
    }

    const wrap = document.getElementById('cs-blocks');
    wrap.innerHTML = '';

    if (mode === 'freeform'){
      renderFreeformBlocks(wrap);
      return;
    }

    const blocks = TC.programData[csDay] || [];

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
        const swapKey = csKey(csSlot,csDay,bIdx,eIdx,'swap');
        fillProgramExHead(exHead, ex, sessionStore[swapKey], val => {
          if (val) sessionStore[swapKey] = val; else delete sessionStore[swapKey];
          saveSession(); renderSessionDay();
        });
        exDiv.appendChild(exHead);
        const ml = metaLine(ex);
        if (ml){
          const metaDiv = document.createElement('div');
          metaDiv.className = 'ls-ex-meta';
          metaDiv.innerHTML = ml;
          exDiv.appendChild(metaDiv);
        }
        // The trainee's last time, what to try, and the how-to (js/bells-n-barz-workout-plus.js).
        const PLUS = window.BNB_PLUS, exName = programExName(ex, sessionStore[swapKey]);
        if (PLUS) PLUS.howToButton(exHead, exName, renderSessionDay);
        const sug = PLUS ? PLUS.extras(exDiv, exName, ex.reps, csPriorHistory(), liftKey, sg => {
          for (let s = 0; s < nSets; s++) csFillFromSuggestion(sg, csKey(csSlot,csDay,bIdx,eIdx,s,'wt'), csKey(csSlot,csDay,bIdx,eIdx,s,'reps'));
          saveSession(); renderSessionDay();
        }) : null;
        const setsDiv = document.createElement('div');
        setsDiv.className = 'ls-sets';
        for(let s=0; s<nSets; s++){
          const doneKey = csKey(csSlot,csDay,bIdx,eIdx,s,'done');
          const wtKey = csKey(csSlot,csDay,bIdx,eIdx,s,'wt');
          const repsKey = csKey(csSlot,csDay,bIdx,eIdx,s,'reps');
          const setDiv = document.createElement('div');
          setDiv.className = 'ls-set' + (sessionStore[doneKey] ? ' done' : '');
          setDiv.innerHTML = `
            <input type="checkbox" ${sessionStore[doneKey] ? 'checked' : ''}>
            <span class="ls-set-label">S${s+1}</span>
            <input type="text" inputmode="decimal" placeholder="${sug ? esc(window.BNB_LIFT.fmtKg(sug.wt)) : 'wt'}" value="${esc(sessionStore[wtKey]||'')}">
            <span class="ls-slash">/</span>
            <input type="text" inputmode="numeric" placeholder="${sug && sug.reps ? sug.reps : 'reps'}" value="${esc(sessionStore[repsKey]||'')}">
          `;
          const cb = setDiv.querySelector('input[type=checkbox]');
          const inputs = setDiv.querySelectorAll('input[type=text]');
          cb.onchange = ()=>{
            // Ticking an empty set means "did what was suggested".
            if (cb.checked && sug){
              csFillFromSuggestion(sug, wtKey, repsKey);
              inputs[0].value = sessionStore[wtKey] || ''; inputs[1].value = sessionStore[repsKey] || '';
            }
            sessionStore[doneKey]=cb.checked; setDiv.classList.toggle('done', cb.checked); saveSession();
            if (cb.checked){
              if (PLUS) PLUS.markStart(csStartKey());
              startRest(ex, programExName(ex, sessionStore[swapKey]));
            }
          };
          inputs[0].oninput = ()=>{ sessionStore[wtKey]=inputs[0].value; saveSession(); };
          inputs[1].oninput = ()=>{ sessionStore[repsKey]=inputs[1].value; saveSession(); };
          setsDiv.appendChild(setDiv);
        }
        exDiv.appendChild(setsDiv);
        bDiv.appendChild(exDiv);
      });
      wrap.appendChild(bDiv);
    });
  }

  /* Freeform rendering: no program blocks — the coach builds the exercise
     list live. Same ls-block/ls-exercise/ls-sets shell as the program view
     (so it looks and behaves consistently), but exercise name is an editable
     input and exercises/sets can be added or removed on the fly. */
  function renderFreeformBlocks(wrap){
    const list = getFreeformExercises(csSlot, csDay);

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

      buildFreeformNameRow(ex, exHead, ()=> saveFreeformExercises(csSlot, csDay, list));
      const PLUS = window.BNB_PLUS;
      if (PLUS) PLUS.howToButton(exHead, ex.name, renderSessionDay);

      const removeExBtn = document.createElement('button');
      removeExBtn.type = 'button';
      removeExBtn.className = 'cs-freeform-remove-ex';
      removeExBtn.title = 'Remove exercise';
      removeExBtn.textContent = '✕';
      removeExBtn.onclick = ()=>{
        if (list.length <= 1){
          list[eIdx] = blankFreeformExercise();
        } else {
          list.splice(eIdx, 1);
        }
        saveFreeformExercises(csSlot, csDay, list);
        renderSessionDay();
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
      const sug = PLUS ? PLUS.extras(exDiv, ex.name, String(ex.presc || '').split('×')[1] || '', csPriorHistory(), liftKey, sg => {
        ex.sets.forEach(st => fillSet(st, sg));
        saveFreeformExercises(csSlot, csDay, list); renderSessionDay();
      }) : null;

      const setsDiv = document.createElement('div');
      setsDiv.className = 'ls-sets';
      ex.sets.forEach((set, sIdx)=>{
        const setDiv = document.createElement('div');
        setDiv.className = 'ls-set' + (set.done ? ' done' : '');
        setDiv.innerHTML = `
          <input type="checkbox" ${set.done ? 'checked' : ''}>
          <span class="ls-set-label">S${sIdx+1}</span>
          <input type="text" inputmode="decimal" placeholder="${sug ? esc(window.BNB_LIFT.fmtKg(sug.wt)) : 'wt'}" value="${esc(set.wt||'')}">
          <span class="ls-slash">/</span>
          <input type="text" inputmode="numeric" placeholder="${sug && sug.reps ? sug.reps : 'reps'}" value="${esc(set.reps||'')}">
        `;
        const cb = setDiv.querySelector('input[type=checkbox]');
        const inputs = setDiv.querySelectorAll('input[type=text]');
        cb.onchange = ()=>{
          if (cb.checked && sug){ fillSet(set, sug); inputs[0].value = set.wt || ''; inputs[1].value = set.reps || ''; }
          set.done = cb.checked; setDiv.classList.toggle('done', cb.checked); saveFreeformExercises(csSlot, csDay, list);
          if (cb.checked){ if (PLUS) PLUS.markStart(csStartKey()); startRest(null, ex.name); }
        };
        inputs[0].oninput = ()=>{ set.wt = inputs[0].value; saveFreeformExercises(csSlot, csDay, list); };
        inputs[1].oninput = ()=>{ set.reps = inputs[1].value; saveFreeformExercises(csSlot, csDay, list); };

        if (ex.sets.length > 1){
          const rmSetBtn = document.createElement('button');
          rmSetBtn.type = 'button';
          rmSetBtn.className = 'cs-freeform-remove-set';
          rmSetBtn.title = 'Remove this set';
          rmSetBtn.textContent = '−';
          rmSetBtn.onclick = ()=>{
            ex.sets.splice(sIdx, 1);
            saveFreeformExercises(csSlot, csDay, list);
            renderSessionDay();
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
        saveFreeformExercises(csSlot, csDay, list);
        renderSessionDay();
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
      list.push(blankFreeformExercise());
      saveFreeformExercises(csSlot, csDay, list);
      renderSessionDay();
      const names = wrap.querySelectorAll('.cs-freeform-name');
      if (names.length) names[names.length-1].focus();
    };
    wrap.appendChild(addExBtn);

    const copyWrap = document.createElement('div');
    copyWrap.className = 'cs-freeform-copy-wrap';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn2 cs-freeform-copy-btn';
    copyBtn.textContent = 'Copy Exercises To…';
    const copyMenu = document.createElement('div');
    copyMenu.className = 'cs-freeform-copy-menu';
    copyMenu.style.display = 'none';
    for (let i=0; i<CS_SLOT_COUNT; i++){
      if (i === csSlot) continue;
      const name = slotTraineeName(i).trim();
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'cs-freeform-copy-item';
      item.textContent = name || ('Slot ' + (i+1) + ' — Empty');
      item.onclick = ()=>{
        copyMenu.style.display = 'none';
        copyFreeformToSlot(csSlot, i, csDay);
      };
      copyMenu.appendChild(item);
    }
    copyBtn.onclick = (e)=>{
      e.stopPropagation();
      copyMenu.style.display = copyMenu.style.display === 'none' ? 'block' : 'none';
    };
    copyWrap.appendChild(copyBtn);
    copyWrap.appendChild(copyMenu);
    wrap.appendChild(copyWrap);
  }

  /* Sync to Member Log: the active slot's day goes into that member's own
     history (mls_history, which staff can write for any member), so it
     shows in their History, progress graph and personal records. The
     trainee has to be a real member: the Trainee box suggests members'
     names, and the name must match one. Re-syncing the same day replaces
     the coach's entry for that day instead of adding another; it's kept
     apart from the member's own log of the day (mode 'coach'). */
  function memberByName(name){
    const n = String(name || '').trim().toLowerCase();
    if (!n || !window.BNB_USERS) return null;
    return window.BNB_USERS.getMembers().find(u => (u.fullName || '').trim().toLowerCase() === n) || null;
  }
  function fillTraineeList(){
    const dl = document.getElementById('cs-trainee-list');
    if (!dl || !window.BNB_USERS) return;
    dl.innerHTML = window.BNB_USERS.getMembers().filter(u => String(u.id).length === 36)
      .map(u => '<option value="' + esc(u.fullName) + '"></option>').join('');
  }
  async function syncFreeformToMemberLog(slot, day){
    const typed = slotTraineeName(slot).trim();
    const member = memberByName(typed);
    if (!member){
      alert(typed
        ? '"' + typed + '" isn\'t a member account. Pick the trainee from the suggestions in the Trainee box (start typing their name), then sync again.'
        : 'Type the trainee\'s name first (pick it from the suggestions), then sync.');
      return;
    }
    const snap = snapshotSessionDay(slot, day);
    const exercises = snap.blocks.flatMap(b => b.exercises).filter(ex => ex.sets.some(st => st.wt || st.reps || st.done));
    if (!exercises.length){ alert('Nothing logged for ' + member.fullName + ' on this day yet.'); return; }
    const me = window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const btn = document.getElementById('cs-sync-member');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Syncing…';
    try {
      const dateIso = localIsoDate();
      const { data: existing, error: findErr } = await bnbClient.from('mls_history').select('id')
        .eq('member_id', member.id).eq('date_iso', dateIso).eq('day', day).eq('mode', 'coach').limit(1);
      if (findErr) throw findErr;
      const row = {
        member_id: member.id, date_iso: dateIso, display_date: snap.date || '', day, mode: 'coach', bw: snap.bw,
        notes: [snap.notes, me ? 'Logged by ' + me.fullName : 'Logged by your coach'].filter(Boolean).join(' — '),
        exercises
      };
      if (existing && existing.length) row.id = existing[0].id;
      const { error } = await bnbClient.from('mls_history').upsert([row]);
      if (error) throw error;
      refreshMlsHistoryFromSupabase();
      window.BNB_UI.toast('Synced to ' + member.fullName + "'s log — it's in their History and progress graph.");
    } catch(e){
      console.error('Sync to member log failed:', e);
      alert('Could not sync — check your connection and try again. (' + (e.message || e) + ')');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }


  function wireSessionOnce(){
    const traineeEl = document.getElementById('cs-trainee');
    if (!traineeEl || traineeEl.dataset.wired) return;
    traineeEl.dataset.wired = '1';
    // Members load after this first draws: refresh the name suggestions
    // each time the box is used.
    traineeEl.addEventListener('focus', fillTraineeList);
    traineeEl.addEventListener('input', e=>{
      sessionStore[csKey(csSlot,'trainee')]=e.target.value;
      saveSession();
      renderSlotSwitch(); // keep the slot pill label in sync as the coach types
      const syncBtn = document.getElementById('cs-sync-member');
      if (syncBtn){
        const tName = e.target.value.trim();
        syncBtn.textContent = tName ? ('Sync to ' + tName + "'s Log") : 'Sync to Member Log';
      }
    });
    bnbEl('cs-date').addEventListener('input', e=>{ sessionStore[csKey(csSlot,csDay,'meta','date')]=e.target.value; saveSession(); });
    bnbEl('cs-bw').addEventListener('input', e=>{ sessionStore[csKey(csSlot,csDay,'meta','bw')]=e.target.value; saveSession(); });
    bnbEl('cs-notes').addEventListener('input', e=>{ sessionStore[csKey(csSlot,csDay,'notes')]=e.target.value; saveSession(); });

    bnbEl('cs-clear').onclick = ()=>{
      const name = slotTraineeName(csSlot) || ('Slot ' + (csSlot+1));
      if(!confirm("Clear " + name + "'s slot — name, all days' sets, weight, reps and notes for this slot only? The other slots are untouched. Do this once you're done saving a copy for this trainee.")) return;
      const prefix = 's' + csSlot + ':';
      Object.keys(sessionStore).forEach(k=>{ if (k.startsWith(prefix)) delete sessionStore[k]; });
      saveSession();
      renderSlotSwitch();
      renderSessionDay();
    };

    bnbEl('cs-save-pdf').onclick = ()=> saveSessionAs('pdf');
    bnbEl('cs-save-md').onclick = ()=> saveSessionAs('md');
    bnbEl('cs-save-txt').onclick = ()=> saveSessionAs('txt');
    bnbEl('cs-sync-member').onclick = ()=> syncFreeformToMemberLog(csSlot, csDay);
    // A trainee picked or typed in full: their last times and suggestions.
    traineeEl.addEventListener('change', ()=> renderSessionDay());
    const csFinish = document.getElementById('cs-finish');
    if (csFinish && window.BNB_PLUS) csFinish.onclick = ()=>{
      const snap = snapshotSessionDay(csSlot, csDay);
      const tName = slotTraineeName(csSlot).trim();
      const m = memberByName(tName);
      const bests = m ? bestsFrom(memberHistory(m), localIsoDate()) : {};
      const sum = window.BNB_PLUS.summarize(snap.blocks.flatMap(b => b.exercises), bests, liftKey, window.BNB_PLUS.startedAt(csStartKey()));
      window.BNB_PLUS.finish(sum, (tName ? tName + ' · ' : '') + (snap.title || csDay),
        m ? 'Tap Sync to ' + tName + "'s Log to add it to their history." : 'Save a copy with the buttons below.');
    };
    if (window.BNB_PLUS) window.BNB_PLUS.loadGuides(renderSessionDay);

    bnbEl('cs-mode-program').onclick = ()=>{
      setCsMode(csSlot, csDay, 'program');
      renderSessionDay();
    };
    bnbEl('cs-mode-freeform').onclick = ()=>{
      setCsMode(csSlot, csDay, 'freeform');
      renderSessionDay();
    };
  }

  /* Snapshot of the active slot's current-day session — same shape as the
     member Logsheet's snapshotDay(), plus the trainee name, so the PDF/MD/TXT
     builders below can stay close cousins of the existing Logsheet export code. */
  function snapshotSessionDay(slot, day){
    const meta = DAY_META[day];
    const mode = getCsMode(slot, day);
    let blocks;
    if (mode === 'freeform'){
      const list = getFreeformExercises(slot, day).filter(ex => (ex.name||'').trim());
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
      blocks = (TC.programData[day]||[]).map((block,bIdx)=>({
        name: block.name,
        exercises: block.exercises.map((ex,eIdx)=>{
          const nSets = parseInt(ex.sets,10) || 3;
          const sets = [];
          for(let s=0;s<nSets;s++){
            sets.push({
              done: !!sessionStore[csKey(slot,day,bIdx,eIdx,s,'done')],
              wt: sessionStore[csKey(slot,day,bIdx,eIdx,s,'wt')] || '',
              reps: sessionStore[csKey(slot,day,bIdx,eIdx,s,'reps')] || ''
            });
          }
          return { name: programExName(ex, sessionStore[csKey(slot,day,bIdx,eIdx,'swap')]), presc: prescString(ex), meta: metaLine(ex).replace(/&nbsp;/g,' ').replace(/•/g,'|'), sets };
        })
      }));
    }
    return {
      trainee: slotTraineeName(slot),
      title: meta.title, duration: meta.duration, hold: meta.hold,
      date: sessionStore[csKey(slot,day,'meta','date')]||'', bw: sessionStore[csKey(slot,day,'meta','bw')]||'',
      notes: sessionStore[csKey(slot,day,'notes')]||'', blocks
    };
  }


  /* Trainee name is a prominent, expected field — not a hard block. If it's
     empty we just confirm once before saving under a generic label, so a
     coach mid-session can still move fast without losing data. */
  function confirmTraineeName(){
    const name = slotTraineeName(csSlot).trim();
    if (name) return name;
    const proceed = confirm("No trainee name entered for Slot " + (csSlot+1) + " — save this file as 'Unnamed Trainee'?");
    if (!proceed){
      const el = document.getElementById('cs-trainee');
      if (el) el.focus();
      return null;
    }
    return 'Unnamed Trainee';
  }


  async function saveSessionAs(format){
    const traineeName = confirmTraineeName();
    if (!traineeName) return;

    const snap = snapshotSessionDay(csSlot, csDay);
    snap.trainee = traineeName;
    const fileBase = 'BnB_Session_' + slugify(traineeName) + '_' + snap.title.replace(/[^\w]+/g,'_');

    if (format === 'md'){
      downloadTextFile(fileBase + '.md', buildSessionMarkdown(snap), 'text/markdown');
      return;
    }
    if (format === 'txt'){
      downloadTextFile(fileBase + '.txt', buildSessionText(snap), 'text/plain');
      return;
    }

    // PDF — same rendering approach as the member Logsheet's Download PDF,
    // with the trainee's name added to the header.
    const btn = document.getElementById('cs-save-pdf');
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
      y += 16; doc.text('Trainee: ' + snap.trainee, 40, y);
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
      const holdTextX1 = drawPdfStar(doc, 40, y, gold);
      doc.text('Signature Hold: ' + snap.hold, holdTextX1, y);
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
  }


  // Coach Live Session: the trainee named in this slot, if they're a member.
  function csPriorHistory(){
    const m = memberByName(slotTraineeName(csSlot));
    if (!m) return [];
    const todayIso = localIsoDate();
    return memberHistory(m).filter(h => h.dateIso < todayIso);
  }
  function csFillFromSuggestion(sg, wtKey, repsKey){
    if (!String(sessionStore[wtKey] || '').trim()) sessionStore[wtKey] = window.BNB_LIFT.fmtKg(sg.wt);
    if (!String(sessionStore[repsKey] || '').trim() && sg.reps) sessionStore[repsKey] = String(sg.reps);
  }
  function csStartKey(){ return 'cs' + csSlot + '-' + csDay; }

  /* --------------------- COACH: WORKOUTS TO TRY ---------------------------
     A coach's own shelf of workouts they've come across and want to try
     (sql/61, coach_workouts — private to the coach who saved them). Built
     in the same editor as Program Builder: each version is a block of
     exercises with sets, reps, load, rest, tempo, equipment and alternates,
     so the card stats come from real numbers. Pasted text still works as
     a shortcut — it's split into versions at lines ending in ":"
     ("Strength:", "If your goal is Hypertrophy:"), each "Name: 3 x 8" line
     becomes a row to check. Try loads a version into the Live Session's
     current slot and day as Freeform, sets ready and ⇄ alternatives on.
     Workouts saved before the editor hold { name, presc, sets } only;
     structuredExercise() turns those into rows when they're read. */
  function showToast(msg){
    const el = document.getElementById('t-toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._tcTimer);
    el._tcTimer = setTimeout(()=> el.classList.remove('show'), 2400);
  }


  // A1, A2, B1… for each row; 3.1, 3.2 for numbered blocks; '' when its
  // block has no letter or number.
  function exerciseLabels(exercises){
    let prev = null, n = 0;
    return (exercises || []).map(ex => {
      const b = ex.block || '';
      n = b === prev ? n + 1 : 1;
      prev = b;
      const tok = b ? blockToken(b) : '';
      return tok ? tok + (/^\d/.test(tok) ? '.' : '') + n : '';
    });
  }
  // Runs of rows with the same block, in order: [{ name, exercises }].
  function versionBlocks(exercises){
    const runs = [];
    (exercises || []).forEach(ex => {
      const b = ex.block || '';
      if (!runs.length || runs[runs.length - 1].name !== b) runs.push({ name: b, exercises: [] });
      runs[runs.length - 1].exercises.push(ex);
    });
    return runs;
  }
  // The next free block name, in the style already used: Block 1, 2, 3…
  // when every block is numbered, otherwise Block A, B, C….
  function nextBlockName(exercises){
    const toks = [...new Set((exercises || []).map(ex => blockToken(ex.block)).filter(Boolean))];
    if (toks.length && toks.every(t => /^\d+$/.test(t))){
      return 'Block ' + (Math.max(0, ...toks.filter(t => /^\d+$/.test(t)).map(Number)) + 1);
    }
    const letters = toks.filter(t => /^[A-Z]$/.test(t)).map(t => t.charCodeAt(0));
    const next = letters.length ? Math.max(...letters) + 1 : 66; // none named yet: the rows above become A
    return 'Block ' + String.fromCharCode(Math.min(next, 90));
  }


  function structuredVariants(variants){
    return (variants || []).map(v => ({ name: v.name || 'Workout', exercises: (v.exercises || []).map(structuredExercise) }));
  }
  function setsCount(ex){ return Math.min(Math.max(parseInt(ex.sets, 10) || 3, 1), 10); }

  // The plan as one line: "3 × 8 @ 80kg · rest 90s · tempo 3-1-1".
  function planString(ex){
    const main = prescString(ex) + (ex.load ? ' @ ' + ex.load : '');
    return [main, ex.rest ? 'rest ' + ex.rest : '', ex.tempo ? 'tempo ' + ex.tempo : ''].filter(Boolean).join(' · ');
  }

  // Versions back to text in a format parseWorkoutText() reads — kept as
  // the row's source, and what Copy Text copies.
  function workoutVariantsToText(variants){
    const line = ex => {
      const p = [(ex.sets && ex.reps ? ex.sets + ' x ' + ex.reps : ex.reps || (ex.sets ? ex.sets + ' sets' : '')) + (ex.load ? ' @ ' + ex.load : ''),
                 ex.rest ? 'rest ' + ex.rest : ''].filter(Boolean).join(', ');
      return p ? ex.name + ': ' + p : ex.name;
    };
    return variants.map(v => v.name + ':\n' + versionBlocks(v.exercises).map(run =>
      (run.name ? run.name + ':\n' : '') + run.exercises.map(line).join('\n')).join('\n')).join('\n\n');
  }

  // A version as a Freeform list: blank sets to match, the plan under each
  // name, and its own Alternates in the ⇄ dropdown.
  function workoutFreeformList(variant){
    const rows = (variant.exercises || []).map(structuredExercise).filter(ex => ex.name.trim());
    const labels = exerciseLabels(rows);
    return rows.map((ex, i) => ({
      name: ex.name, seed: ex.name, base: ex.name, baseAlts: ex.alternates || '', from: 'workout', presc: planString(ex),
      group: ex.block || '', label: labels[i],
      sets: Array.from({ length: setsCount(ex) }, () => ({ wt:'', reps:'', done:false }))
    }));
  }

  // Loads one variant into the Live Session's current slot + day.
  function tryWorkoutInSession(variant, title){
    const who = slotTraineeName(csSlot).trim() || ('Slot ' + (csSlot+1));
    const dayLabel = DAY_META[csDay].title.split('—')[0].trim();
    if (freeformHasRealData(csSlot, csDay) &&
        !confirm('Replace ' + who + "'s freeform log for " + dayLabel + ' with "' + title + ' — ' + variant.name + '"?')) return;
    saveFreeformExercises(csSlot, csDay, workoutFreeformList(variant));
    setCsMode(csSlot, csDay, 'freeform');
    renderSessionDay();
    const btn = document.querySelector('#coach-section-switch [data-coach-section="session"]');
    if (btn) btn.click();
    showToast('Loaded into ' + who + ' — ' + dayLabel);
  }

  // Loads one variant into the coach's own MEMBER > Live Session as
  // Freeform on the chosen day, so they can do it themselves and it lands
  // in their own history and progress graph.
  function sendWorkoutToMyFreeform(variant, title, day){
    const dayLabel = DAY_META[day].title.split('—')[0].trim();
    if (getMlsMode(day) === 'freeform' && freeformListHasRealData(getMlsFreeformExercises(day)) &&
        !confirm('Replace your own freeform log for ' + dayLabel + ' with "' + title + ' — ' + variant.name + '"?')) return false;
    saveMlsFreeformExercises(day, workoutFreeformList(variant));
    setMlsMode(day, 'freeform');
    TC.mlsDay = day;
    renderMlsDayTabs();
    renderMlsDay();
    if (typeof window.switchTab === 'function') window.switchTab('session');
    showToast('Loaded into your Live Session — ' + dayLabel);
    return true;
  }


  // Coach-side: the four numbers as labelled boxes.
  function workoutStatsHtml(variant){
    const s = workoutStats(variant);
    const box = (label, val, title) => '<div class="cw-stat"' + (title ? ' title="' + esc(title) + '"' : '') + '><span class="cw-stat-label">' + label + '</span><span class="cw-stat-val">' + val + '</span></div>';
    return '<div class="cw-stats">' +
      box('Exercises', s.exercises) + box('Sets', s.sets) +
      box('Time', '≈ ' + s.minutes + ' min', 'Estimate: reps × tempo (about 3 s a rep without one), or the time written in, plus rest') +
      box('Rest', '≈ ' + s.restMinutes + ' min', 'Rest × sets, after every set. With no Rest set: 2½ min for 1–5 reps, 90 s for 6–12, 60 s for 13+') +
      '</div>';
  }

  /* Send to Program Builder: opens Program Builder with a bar on top —
     pick the client (the usual picker) and the day, then add the version
     as a new block or replace that day with it — the rows copy across
     as they are, Load and Alternates included. */
  /* Program Builder blocks and Workouts to Try. A block sent from a saved
     workout keeps src { workoutId, ownerId, version, vIdx }. Edits stay in
     the program; nothing goes back until the coach presses Update, which
     makes that version an exact copy of the block (rows added or removed
     too). The version is found by name — its index may have moved — with
     vIdx breaking ties. Another coach's link shows nothing (their
     workouts are private); a link to a deleted workout or version offers
     Save as New, and a block with no link offers Save to Workouts to Try. */
  function blockSourceIndex(w, src){
    const vs = w.variants || [];
    if (vs[src.vIdx] && vs[src.vIdx].name === src.version) return src.vIdx;
    return vs.findIndex(v => v.name === src.version);
  }
  function blockAsVariantExercises(block){
    return (block.exercises || []).filter(ex => String(ex.name || '').trim())
      .map(ex => { const out = structuredExercise(ex); out.name = String(ex.name).trim(); out.presc = planString(out); return out; });
  }
  function blockWorkoutLink(block, bDiv){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me || coachWorkouts === null) return;
    const src = block.src;
    if (src && src.ownerId && src.ownerId !== me.id) return;
    const w = src && (coachWorkouts || []).find(x => x.id === src.workoutId);
    let idx = w ? blockSourceIndex(w, src) : -1;
    // Sent as one block of a split version: that block must still be there.
    if (idx >= 0 && src.block && !(w.variants[idx].exercises || []).some(ex => ex.block === src.block)) idx = -1;
    const bar = document.createElement('div');
    bar.className = 'crud-src';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn2';
    if (w && idx >= 0){
      const label = w.title + (w.variants.length > 1 || w.variants[idx].name !== 'Workout' ? ' — ' + w.variants[idx].name : '') +
        (src.block ? ' — ' + src.block : '');
      bar.innerHTML = '<span>From Workouts to Try: <b>' + esc(label) + '</b></span>';
      btn.textContent = '↻ Update Workout to Try';
      btn.title = 'Copy this block\u2019s exercises back to the saved workout';
      btn.onclick = ()=> updateWorkoutFromBlock(block, w, idx, label, btn);
    } else if (src){
      bar.innerHTML = '<span>Its saved workout (' + esc([src.version, src.block].filter(Boolean).join(' — ') || 'version') + ') was deleted.</span>';
      btn.textContent = 'Save as New Workout to Try';
      btn.onclick = ()=> saveBlockAsWorkout(block, btn);
    } else {
      bar.classList.add('crud-src-none');
      btn.textContent = 'Save to Workouts to Try';
      btn.title = 'Keep this block as one of your saved workouts';
      btn.onclick = ()=> saveBlockAsWorkout(block, btn);
    }
    bar.appendChild(btn);
    bDiv.appendChild(bar);
  }
  async function updateWorkoutFromBlock(block, w, idx, label, btn){
    const exercises = blockAsVariantExercises(block);
    if (!exercises.length){ showToast('Add an exercise with a name first.'); return; }
    if (!confirm('Replace "' + label + '" in Workouts to Try with this block\u2019s ' + exercises.length + ' exercise' + (exercises.length === 1 ? '' : 's') + '?')) return;
    // A block of a split version replaces just that block's rows, where
    // they were; otherwise the whole version.
    const sb = block.src && block.src.block;
    const variants = (w.variants || []).map((v, i) => {
      if (i !== idx) return v;
      if (!sb) return { name: v.name, exercises };
      const old = v.exercises || [];
      const first = old.findIndex(ex => ex.block === sb);
      const kept = old.filter(ex => ex.block !== sb);
      const at = old.slice(0, first).filter(ex => ex.block !== sb).length;
      kept.splice(at, 0, ...exercises.map(ex => Object.assign(ex, { block: sb })));
      return { name: v.name, exercises: kept };
    });
    btn.disabled = true;
    const { error } = await bnbClient.from('coach_workouts')
      .update({ variants, source: workoutVariantsToText(structuredVariants(variants)), updated_at: new Date().toISOString() })
      .eq('id', w.id);
    btn.disabled = false;
    if (error){ console.error('Supabase update coach_workouts failed:', error); showToast('Couldn\u2019t update — ' + (error.message || 'try again')); return; }
    block.src = Object.assign({}, block.src, { vIdx: idx });
    saveAdminProgram();
    await refreshCoachWorkouts();
    renderAdminBlocks();
    if (cwDraft && cwDraft.forId === w.id) cwDraft = null;
    renderCoachWorkouts();
    showToast('Updated "' + label + '"');
  }
  // The whole day as one new workout: a single version (a version is one
  // complete workout) split into the day's blocks, in order. Named for the
  // day and whose program it is.
  async function saveDayAsWorkout(btn){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){ showToast('Sign in to save workouts.'); return; }
    const blocks = adminProgramData[adminDay] || [];
    const exercises = blocks.flatMap((b, bi) => blockAsVariantExercises(b)
      .map(ex => Object.assign(ex, { block: blocks.length > 1 ? (String(b.name || '').trim() || 'Block ' + (bi + 1)) : '' })));
    const dayName = DAY_META[adminDay].title.split('—')[0].trim();
    if (!exercises.length){ showToast('Nothing on ' + dayName + ' to save yet.'); return; }
    const picker = document.getElementById('admin-client-picker');
    const who = adminOwnerId === me.id ? 'My program' : (picker && picker.selectedOptions[0] ? picker.selectedOptions[0].textContent : 'Client');
    const title = dayName + ' — ' + who;
    if (!confirm('Save ' + dayName + '\u2019s ' + blocks.length + ' block' + (blocks.length === 1 ? '' : 's') + ' (' + exercises.length + ' exercise' + (exercises.length === 1 ? '' : 's') + ') to Workouts to Try as "' + title + '"?')) return;
    const variants = [{ name: 'Workout', exercises }];
    btn.disabled = true;
    const { error } = await bnbClient.from('coach_workouts').insert([{
      owner_id: me.id, title, variants, source: workoutVariantsToText(variants), updated_at: new Date().toISOString()
    }]);
    btn.disabled = false;
    if (error){ console.error('Supabase insert coach_workouts failed:', error); showToast('Couldn\u2019t save — ' + (error.message || 'try again')); return; }
    await refreshCoachWorkouts();
    fillAdminLoadWorkout();
    renderCoachWorkouts();
    showToast('Saved "' + title + '" to Workouts to Try');
  }
  { const b = document.getElementById('admin-save-day-workout'); if (b) b.onclick = ()=> saveDayAsWorkout(b); }

  async function saveBlockAsWorkout(block, btn){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    const exercises = blockAsVariantExercises(block).map(ex => Object.assign(ex, { block: '' }));
    if (!exercises.length){ showToast('Add an exercise with a name first.'); return; }
    const title = String(block.name || '').trim() || 'Untitled workout';
    const variants = [{ name: 'Workout', exercises }];
    btn.disabled = true;
    const { data, error } = await bnbClient.from('coach_workouts').insert([{
      owner_id: me.id, title, variants, source: workoutVariantsToText(variants), updated_at: new Date().toISOString()
    }]).select('id');
    btn.disabled = false;
    if (error){ console.error('Supabase insert coach_workouts failed:', error); showToast('Couldn\u2019t save — ' + (error.message || 'try again')); return; }
    block.src = { workoutId: data[0].id, ownerId: me.id, version: 'Workout', vIdx: 0 };
    saveAdminProgram();
    await refreshCoachWorkouts();
    renderAdminBlocks();
    renderCoachWorkouts();
    showToast('Saved "' + title + '" to Workouts to Try');
  }

  // A version as Program Builder blocks: one per block in it (just one if
  // it isn't split). src remembers the saved workout, version and block
  // each came from, so Program Builder can offer to copy edits back
  // (blockWorkoutLink).
  function workoutVariantToBlocks(variant, title, src){
    const base = variant.name && variant.name !== 'Workout' ? title + ' — ' + variant.name : title;
    const rows = (variant.exercises || []).map(structuredExercise).filter(ex => ex.name.trim());
    return versionBlocks(rows).map(run => {
      const block = {
        name: run.name ? base + ' — ' + run.name : base,
        exercises: run.exercises.map(ex => { const out = Object.assign({}, ex); delete out.block; return out; })
      };
      if (src) block.src = Object.assign({}, src, run.name ? { block: run.name } : {});
      return block;
    });
  }
  function sendWorkoutToProgramBuilder(variants, title, vIdx, workoutId){
    vIdx = vIdx || 0;
    let variant = variants[vIdx];
    const btn = document.querySelector('#coach-section-switch [data-coach-section="program"]');
    if (btn) btn.click();
    const host = document.getElementById('coach-section-program');
    if (!host) return;
    let bar = document.getElementById('admin-incoming');
    if (!bar){
      bar = document.createElement('div');
      bar.id = 'admin-incoming';
      bar.className = 'admin-incoming';
      const picker = document.getElementById('admin-client-picker');
      (picker ? picker.closest('.field') : host.firstChild).after(bar);
    }
    const labelOf = v => v.name && v.name !== 'Workout' ? title + ' — ' + v.name : title;
    const countOf = v => v.exercises.length + ' exercise' + (v.exercises.length === 1 ? '' : 's');
    bar.innerHTML = `
      <div class="admin-incoming-text">${variants.length > 1
        ? `Add <b>${esc(title)}</b> to the program for the client picked above — which version, and on which day?`
        : `Add <b>${esc(labelOf(variant))}</b> (${countOf(variant)}) to the program for the client picked above, on`}</div>
      <div class="admin-incoming-row">
        ${variants.length > 1 ? `<select id="admin-incoming-variant">${variants.map((v, i) => `<option value="${i}"${i === vIdx ? ' selected' : ''}>${esc(v.name)} (${countOf(v)})</option>`).join('')}</select>` : ''}
        <select id="admin-incoming-day">${DAY_ORDER.map(d => `<option value="${d}"${d === adminDay ? ' selected' : ''}>${esc(DAY_META[d].title.split('—')[0].trim())}</option>`).join('')}</select>
        <button class="btn2 primary" type="button" data-inc="add">Add as New Block${variants.some(v => versionBlocks(v.exercises).length > 1) ? 's' : ''}</button>
        <button class="btn2" type="button" data-inc="replace">Replace That Day</button>
        <button class="btn2" type="button" data-inc="cancel">Cancel</button>
      </div>`;
    const daySel = bar.querySelector('#admin-incoming-day');
    const varSel = bar.querySelector('#admin-incoming-variant');
    if (varSel) varSel.onchange = ()=>{ vIdx = +varSel.value; variant = variants[vIdx]; };
    daySel.onchange = ()=>{ adminDay = daySel.value; renderAdminDayTabs(); renderAdminBlocks(); };
    daySel.onchange();
    bar.querySelectorAll('[data-inc]').forEach(b => b.onclick = ()=>{
      const act = b.dataset.inc;
      if (act === 'cancel'){ bar.remove(); return; }
      const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
      if (!me || !adminOwnerId){ showToast('Sign in and pick a client first.'); return; }
      const day = daySel.value;
      const picker = document.getElementById('admin-client-picker');
      const who = picker && picker.selectedOptions[0] ? picker.selectedOptions[0].textContent : 'this client';
      const dayLabel = DAY_META[day].title.split('—')[0].trim();
      const newBlocks = workoutVariantToBlocks(variant, title,
        workoutId ? { workoutId, ownerId: me.id, version: variant.name, vIdx } : null);
      const label = labelOf(variant);
      if (act === 'replace'){
        if ((adminProgramData[day] || []).length &&
            !confirm('Replace everything on ' + who + "'s " + dayLabel + ' with "' + label + '"?')) return;
        adminProgramData[day] = newBlocks;
      } else {
        (adminProgramData[day] = adminProgramData[day] || []).push(...newBlocks);
      }
      adminDay = day;
      saveAdminProgram(); renderAdminDayTabs(); renderAdminBlocks();
      bar.remove();
      showToast((act === 'replace' ? 'Replaced ' : 'Added to ') + who + "'s " + dayLabel);
    });
    bar.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  // Program Builder's "Load a saved workout…" dropdown: every variant of
  // the coach's Workouts to Try, grouped by workout. Picking one opens the
  // same add/replace bar as Send to Program Builder.
  async function fillAdminLoadWorkout(){
    const sel = document.getElementById('admin-load-workout');
    if (!sel) return;
    await refreshCoachWorkouts();
    const list = coachWorkouts || [];
    sel.innerHTML = '<option value="">' + (list.length ? 'Load a saved workout…' : 'No saved workouts yet (Workouts to Try)') + '</option>' +
      list.map((w, wIdx) => '<optgroup label="' + esc(w.title) + '">' +
        (w.variants || []).map((v, vIdx) => '<option value="' + wIdx + ':' + vIdx + '">' + esc(v.name) + ' (' + (v.exercises || []).length + ')</option>').join('') +
        '</optgroup>').join('');
    sel.onchange = ()=>{
      const [wIdx, vIdx] = sel.value.split(':').map(Number);
      const w = list[wIdx];
      sel.value = '';
      if (w && w.variants[vIdx]) sendWorkoutToProgramBuilder(w.variants, w.title, vIdx, w.id);
    };
  }

  let coachWorkouts = null;       // null = not loaded yet
  let coachWorkoutsError = '';
  let coachWorkoutEditing = null; // id being edited, or null for a new one
  async function refreshCoachWorkouts(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){ coachWorkouts = []; coachWorkoutsError = 'Sign in to save workouts.'; return; }
    const { data, error } = await bnbClient.from('coach_workouts').select('*')
      .eq('owner_id', me.id).order('updated_at', { ascending: false });
    if (error){
      console.error('Supabase load coach_workouts failed:', error);
      coachWorkouts = [];
      coachWorkoutsError = /coach_workouts/.test(error.message || '') && /exist|schema cache/.test(error.message || '')
        ? 'Workouts to Try needs sql/61-coach-workouts.sql run in Supabase first.'
        : 'Couldn’t load your saved workouts — check your connection and try again.';
      return;
    }
    coachWorkouts = data || [];
    coachWorkoutsError = '';
  }

  // The form's working copy — kept between renders so adding a row or a
  // version doesn't lose what's typed. forId is the workout being edited
  // (null for a new one); a different forId starts a fresh draft.
  let cwDraft = null;
  function cwDraftFor(editing){
    const forId = editing ? editing.id : null;
    if (!cwDraft || cwDraft.forId !== forId){
      cwDraft = editing
        ? { forId, title: editing.title || '', versions: JSON.parse(JSON.stringify(structuredVariants(editing.variants))) }
        : { forId, title: '', versions: [{ name: 'Workout', exercises: [Object.assign(blankExercise(), { name: '' })] }] };
    }
    return cwDraft;
  }
  function cwDraftHasContent(d){
    return !!(d.title.trim() || d.versions.some(v => v.exercises.some(ex => String(ex.name || '').trim())));
  }
  // The draft as rows to save: unnamed exercises and empty versions
  // dropped, each exercise carrying its plan line for the card.
  function cwDraftVariants(d){
    return d.versions.map(v => ({
      name: String(v.name || '').trim() || 'Workout',
      exercises: v.exercises.filter(ex => String(ex.name || '').trim())
        .map(ex => Object.assign(structuredExercise(ex), { name: String(ex.name).trim(), presc: planString(ex) }))
    })).filter(v => v.exercises.length);
  }

  function renderCoachWorkouts(){
    const body = document.getElementById('coach-workouts-body');
    if (!body) return;
    const editing = coachWorkoutEditing && (coachWorkouts || []).find(w => w.id === coachWorkoutEditing);
    const list = coachWorkouts || [];
    const draft = cwDraftFor(editing);
    body.innerHTML = `
      ${coachWorkoutsError ? `<div class="admin-notice">${esc(coachWorkoutsError)}</div>` : ''}
      <div class="cw-list">
        ${coachWorkouts === null ? '<div class="field-hint">Loading…</div>'
          : !list.length ? '<div class="field-hint">No saved workouts yet — build one below.</div>'
          : list.map(w => `
          <div class="cw-card" data-id="${esc(w.id)}">
            <div class="cw-card-head">
              <div><div class="cw-title">${esc(w.title)}</div><div class="cw-date">Saved ${esc(String(w.updated_at || w.created_at || '').slice(0, 10))}</div></div>
              <div class="cw-card-btns">
                <button class="btn2" data-cw="edit" type="button">Edit</button>
                <button class="crud-remove" data-cw="delete" type="button" title="Delete workout">✕</button>
              </div>
            </div>
            ${structuredVariants(w.variants).map((v, vIdx) => `
              <div class="cw-variant">
                <div class="cw-variant-head"><span>${esc(v.name)}</span>
                  <span class="cw-variant-btns"><button class="btn2 primary cw-try" data-cw="try" data-v="${vIdx}" type="button" title="Loads into the Live Session's current slot and day as Freeform">Try in Live Session</button><button class="btn2 cw-try" data-cw="send" data-v="${vIdx}" type="button" title="Add to a client's program in Program Builder">Send to Program Builder</button><button class="btn2 cw-try" data-cw="mine" data-v="${vIdx}" type="button" title="Loads into your own MEMBER > Live Session as Freeform, on the day you pick">Send to My Freeform</button><button class="crud-remove" data-cw="delvar" data-v="${vIdx}" type="button" title="Delete this version">✕</button></span></div>
                <ul class="cw-ex">${(()=>{ const lb = exerciseLabels(v.exercises); return v.exercises.map((ex, i) => {
                  const plan = planString(ex);
                  const head = ex.block && (i === 0 || v.exercises[i - 1].block !== ex.block) ? `<li class="cw-ex-block">${esc(ex.block)}</li>` : '';
                  return head + `<li>${lb[i] ? `<span class="crud-ex-label">${esc(lb[i])}</span>` : ''}<b>${esc(ex.name)}</b>${plan ? ` <span>${esc(plan)}</span>` : ''}</li>`;
                }).join(''); })()}</ul>
                ${workoutStatsHtml(v)}
              </div>`).join('')}
          </div>`).join('')}
      </div>
      <div class="cw-form">
        <div class="cw-form-head">${editing ? 'Edit workout' : 'Build a workout to try'}</div>
        <div class="field"><label for="cw-title">Title</label><input type="text" id="cw-title" maxlength="120" placeholder="e.g. Zercher leg day" value="${esc(draft.title)}"></div>
        <details class="cw-paste">
          <summary>Paste a workout as text</summary>
          <textarea id="cw-text" rows="7" placeholder="One exercise per line, like&#10;Strength:&#10;Back Squats: 3 x 8 @ 80kg, rest 2 min&#10;Walking Lunges: 3 x 24m"></textarea>
          <div class="cw-paste-row"><button class="btn2" id="cw-fill" type="button">Fill Rows from Text</button><span class="field-hint" id="cw-paste-hint">Lines ending in ":" start a new version. Check the rows after.</span></div>
        </details>
        <div id="cw-editor"></div>
        <div class="crud-actions" style="padding-left:0;">
          <button class="btn2" id="cw-add-version" type="button">+ Add Version</button>
        </div>
        <div id="cw-draft-stats"></div>
        <div class="crud-actions" style="padding-left:0;">
          <button class="btn2 primary" id="cw-save" type="button">${editing ? 'Save Changes' : 'Save Workout'}</button>
          <button class="btn2" id="cw-save-load" type="button">Save &amp; Load to Program Builder</button>
          <button class="btn2" id="cw-copy" type="button" title="Copy the title and workout as text to paste elsewhere">Copy Text</button>
          <button class="btn2" id="cw-cancel" type="button">${editing ? 'Cancel' : 'Clear'}</button>
        </div>
      </div>`;

    const titleEl = body.querySelector('#cw-title');
    titleEl.oninput = ()=>{ draft.title = titleEl.value; };
    const statsEl = body.querySelector('#cw-draft-stats');
    const drawStats = ()=>{
      const vs = cwDraftVariants(draft);
      statsEl.innerHTML = vs.map(v => '<div class="cw-draft-stat">' + (vs.length > 1 ? '<div class="cw-draft-stat-name">' + esc(v.name) + '</div>' : '') + workoutStatsHtml(v) + '</div>').join('');
    };
    const editorEl = body.querySelector('#cw-editor');
    const drawEditor = ()=>{ renderBlockEditor(editorEl, draft.versions, drawStats, drawEditor, { noun: 'Version', subBlocks: true }); drawStats(); };
    drawEditor();
    body.querySelector('#cw-add-version').onclick = ()=>{
      draft.versions.push({ name: 'Version ' + (draft.versions.length + 1), exercises: [Object.assign(blankExercise(), { name: '' })] });
      drawEditor();
    };

    // Paste: text into rows, through the same reader as before.
    body.querySelector('#cw-fill').onclick = ()=>{
      const text = body.querySelector('#cw-text').value;
      const vs = parseWorkoutText(text);
      if (!vs.length){ showToast('No exercises found — one per line, like "Back Squats: 3 x 8".'); return; }
      if (draft.versions.some(v => v.exercises.some(ex => String(ex.name || '').trim())) &&
          !confirm('Replace the rows below with what’s in the text?')) return;
      draft.versions = vs.map(v => ({ name: v.name, exercises: v.exercises.map(structuredExercise) }));
      body.querySelector('#cw-text').value = '';
      body.querySelector('.cw-paste').open = false;
      drawEditor();
      showToast('Filled ' + vs.reduce((n, v) => n + v.exercises.length, 0) + ' rows — check them, then save');
    };

    const saveWorkout = async (btn, thenLoad)=>{
      const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
      if (!me){ showToast('Sign in to save workouts.'); return; }
      const title = draft.title.trim();
      const variants = cwDraftVariants(draft);
      if (!title){ showToast('Give it a title first.'); titleEl.focus(); return; }
      if (!variants.length){ showToast('Add at least one exercise with a name.'); return; }
      const row = { title, source: workoutVariantsToText(variants), variants, updated_at: new Date().toISOString() };
      btn.disabled = true;
      const { data: saved, error } = editing
        ? await bnbClient.from('coach_workouts').update(row).eq('id', editing.id).select('id')
        : await bnbClient.from('coach_workouts').insert([{ ...row, owner_id: me.id }]).select('id');
      btn.disabled = false;
      if (error){ console.error('Supabase save coach_workouts failed:', error); showToast('Couldn’t save — ' + (error.message || 'try again')); return; }
      coachWorkoutEditing = null;
      cwDraft = null;
      await refreshCoachWorkouts();
      renderCoachWorkouts();
      if (thenLoad) sendWorkoutToProgramBuilder(variants, title, 0, saved && saved[0] ? saved[0].id : (editing && editing.id));
      else showToast(editing ? 'Workout updated' : 'Workout saved');
    };
    body.querySelector('#cw-save').onclick = e => saveWorkout(e.currentTarget, false);
    body.querySelector('#cw-save-load').onclick = e => saveWorkout(e.currentTarget, true);
    // Editing: leave without saving. New workout: clear the form.
    body.querySelector('#cw-cancel').onclick = ()=>{
      if (!editing && cwDraftHasContent(draft) && !confirm('Clear this workout without saving?')) return;
      coachWorkoutEditing = null;
      cwDraft = null;
      renderCoachWorkouts();
    };
    // Title + workout as text, e.g. to paste into WhatsApp or a note.
    body.querySelector('#cw-copy').onclick = async ()=>{
      const vs = cwDraftVariants(draft);
      const text = [draft.title.trim(), vs.length ? workoutVariantsToText(vs) : ''].filter(Boolean).join('\n\n');
      if (!text){ showToast('Nothing to copy yet.'); return; }
      try {
        await navigator.clipboard.writeText(text);
      } catch(e){
        // Older browsers / no clipboard permission: copy via a hidden textarea.
        const tmp = document.createElement('textarea');
        tmp.value = text; tmp.setAttribute('readonly', ''); tmp.style.position = 'fixed'; tmp.style.opacity = '0';
        document.body.appendChild(tmp); tmp.select();
        const ok = document.execCommand('copy');
        tmp.remove();
        if (!ok){ showToast('Couldn’t copy — select the text and copy it by hand.'); return; }
      }
      showToast('Workout copied');
    };

    body.querySelectorAll('.cw-card').forEach(card => {
      const w = list.find(x => x.id === card.dataset.id);
      if (!w) return;
      const variants = structuredVariants(w.variants);
      card.querySelectorAll('[data-cw]').forEach(btn => {
        btn.onclick = async ()=>{
          const act = btn.dataset.cw;
          if (act === 'try') return tryWorkoutInSession(variants[+btn.dataset.v], w.title);
          if (act === 'send') return sendWorkoutToProgramBuilder(variants, w.title, +btn.dataset.v, w.id);
          if (act === 'mine'){
            // Pick the day first, in a small row under the version's buttons.
            const variantEl = btn.closest('.cw-variant');
            const open = variantEl.querySelector('.cw-send-day');
            if (open){ open.remove(); return; }
            const row = document.createElement('div');
            row.className = 'cw-send-day';
            row.innerHTML = '<span>Load into your own Live Session (Freeform) on</span>' +
              '<select aria-label="Day">' + DAY_ORDER.map(d => '<option value="' + d + '"' + (d === TC.mlsDay ? ' selected' : '') + '>' + esc(DAY_META[d].title.split('—')[0].trim()) + '</option>').join('') + '</select>' +
              '<button class="btn2 primary cw-try" type="button" data-go>Send</button><button class="btn2 cw-try" type="button" data-cancel>Cancel</button>';
            variantEl.querySelector('.cw-variant-head').after(row);
            row.querySelector('[data-cancel]').onclick = ()=> row.remove();
            row.querySelector('[data-go]').onclick = ()=>{
              if (sendWorkoutToMyFreeform(variants[+btn.dataset.v], w.title, row.querySelector('select').value)) row.remove();
            };
            return;
          }
          if (act === 'edit'){
            if (coachWorkoutEditing !== w.id && cwDraft && cwDraftHasContent(cwDraft) &&
                !confirm('Drop the workout you’re building and edit "' + w.title + '" instead?')) return;
            coachWorkoutEditing = w.id; renderCoachWorkouts();
            body.querySelector('.cw-form').scrollIntoView({ behavior:'smooth', block:'start' });
            body.querySelector('#cw-title').focus({ preventScroll:true });
            return;
          }
          if (act === 'delvar'){
            const v = variants[+btn.dataset.v];
            if (!v) return;
            if (variants.length <= 1){
              if (!confirm('"' + v.name + '" is the only version left — delete the whole "' + w.title + '" workout?')) return;
            } else if (!confirm('Delete "' + v.name + '" from "' + w.title + '"?')) return;
            const rest = variants.filter((_, i) => i !== +btn.dataset.v)
              .map(x => ({ name: x.name, exercises: x.exercises.map(ex => Object.assign({}, ex, { presc: planString(ex) })) }));
            const { error } = rest.length
              ? await bnbClient.from('coach_workouts').update({ variants: rest, source: workoutVariantsToText(rest), updated_at: new Date().toISOString() }).eq('id', w.id)
              : await bnbClient.from('coach_workouts').delete().eq('id', w.id);
            if (error){ console.error('Supabase update coach_workouts failed:', error); showToast('Couldn’t delete — try again'); return; }
            if (coachWorkoutEditing === w.id){ coachWorkoutEditing = null; cwDraft = null; }
            showToast('Deleted "' + v.name + '"');
            await refreshCoachWorkouts();
            renderCoachWorkouts();
            return;
          }
          if (act === 'delete'){
            if (!confirm('Delete "' + w.title + '"?')) return;
            const { error } = await bnbClient.from('coach_workouts').delete().eq('id', w.id);
            if (error){ console.error('Supabase delete coach_workouts failed:', error); showToast('Couldn’t delete — try again'); return; }
            if (coachWorkoutEditing === w.id){ coachWorkoutEditing = null; cwDraft = null; }
            await refreshCoachWorkouts();
            renderCoachWorkouts();
          }
        };
      });
    });
  }

  window.bnbCoachWorkoutsOnShown = async function(){
    renderCoachWorkouts();
    await refreshCoachWorkouts();
    renderCoachWorkouts();
  };

  // training-core's rerenderProgramViews() calls this when the program changes.
  window.bnbCoachRerender = renderSessionDay;

  /* -------------------------------- INIT ---------------------------------- */
  // Program Builder and the coach Live Session, when their panels are here.
  const onPage = id => !!document.getElementById(id);

  if (onPage('admin-day-tabs')){
    populateAdminClientPicker(); // no-op if not signed in yet; the Coach sub-switcher re-calls this (via window.bnbProgramBuilderOnShown) whenever Program Builder is actually opened
    renderAdminDayTabs();
    renderAdminBlocks();
  }
  if (onPage('tab-coach')){
    renderSlotSwitch();
    renderSessionDayTabs();
    renderSessionDay();
    wireSessionOnce();
  }
})();
