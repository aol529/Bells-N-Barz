(function(){
  const root = document.getElementById('tab-accountability');
  if (!root) return; // Accountability tab not present on this page

  const pendingBox = document.getElementById('acc-pending-invites');
  const groupsNav = document.getElementById('acc-groups-nav');
  const feedEmpty = document.getElementById('acc-feed-empty');
  const feedGrid = document.getElementById('acc-feed-grid');
  const searchInput = document.getElementById('acc-search-input');
  const searchResults = document.getElementById('acc-search-results');

  const panelBackdrop = document.getElementById('acc-connect-panel-backdrop');
  const panelTitle = document.getElementById('acc-connect-panel-title');
  const panelGroupField = document.getElementById('acc-connect-group-field');
  const panelGroupSelect = document.getElementById('acc-connect-group-select');
  const panelNameField = document.getElementById('acc-connect-name-field');
  const panelNameInput = document.getElementById('acc-connect-name-input');
  const panelCancel = document.getElementById('acc-connect-cancel');
  const panelSave = document.getElementById('acc-connect-save');

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }
  function showToast(msg){
    const el = document.getElementById('t-toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._accTimer);
    el._accTimer = setTimeout(()=> el.classList.remove('show'), 2200);
  }

  // Same Mon..Sun resolution the main file already uses (DAY_ORDER +
  // getDay()) so "today" means the same local-time day everywhere in the
  // app — the RPC only falls back to its own UTC computation if this
  // isn't passed.
  const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
  function todayKey(){
    const idx = new Date().getDay(); // 0=Sun..6=Sat
    return DAY_ORDER[idx === 0 ? 6 : idx - 1];
  }

  let myGroups = []; // from accountability_my_groups()
  let activeGroupId = null; // which of my ACTIVE groups the feed is showing
  let pendingConnectTarget = null; // { id, name } — who Connect was clicked for

  function activeGroups(){ return myGroups.filter(g => g.my_status === 'active'); }
  function pendingGroups(){ return myGroups.filter(g => g.my_status === 'pending'); }

  /* ---------------- PENDING INVITES BANNER ---------------- */
  function renderPendingInvites(){
    const pending = pendingGroups();
    if (!pending.length){ pendingBox.innerHTML = ''; return; }
    pendingBox.innerHTML = pending.map(g => `
      <div class="admin-notice">
        <div><b>${esc(g.group_name)}</b> — ${esc(g.invited_by_name || 'a member')} invited you to join.</div>
        <div style="display:flex; gap:8px;">
          <button class="btn2 primary" data-accept="${escAttr(g.group_id)}">Accept</button>
          <button class="btn2" data-decline="${escAttr(g.group_id)}">Decline</button>
        </div>
      </div>
    `).join('');
    pendingBox.querySelectorAll('[data-accept]').forEach(btn => {
      btn.addEventListener('click', () => respond(btn.getAttribute('data-accept'), true));
    });
    pendingBox.querySelectorAll('[data-decline]').forEach(btn => {
      btn.addEventListener('click', () => respond(btn.getAttribute('data-decline'), false));
    });
  }
  async function respond(groupId, accept){
    const { error } = await bnbClient.rpc('accountability_respond', { p_group_id: groupId, accept });
    if (error){ showToast(error.message || 'Could not respond to invite.'); return; }
    showToast(accept ? 'Joined the group!' : 'Invite declined.');
    await refreshAll();
  }

  /* ---------------- GROUPS NAV (only shown with 2+ active groups) ---------------- */
  function renderGroupsNav(){
    const groups = activeGroups();
    if (groups.length < 2){ groupsNav.style.display = 'none'; groupsNav.innerHTML = ''; return; }
    groupsNav.style.display = '';
    groupsNav.innerHTML = groups.map(g =>
      `<button class="plate${g.group_id === activeGroupId ? ' active' : ''}" data-group="${escAttr(g.group_id)}">${esc(g.group_name)}</button>`
    ).join('');
    groupsNav.querySelectorAll('[data-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeGroupId = btn.getAttribute('data-group');
        renderGroupsNav();
        loadFeed();
      });
    });
  }

  /* ---------------- FEED (today's workout + check-in stats) ---------------- */
  function blockListHtml(blocks){
    if (!Array.isArray(blocks) || !blocks.length) return '';
    return blocks.map(block => {
      const exercises = Array.isArray(block.exercises) ? block.exercises : [];
      const items = exercises.map(ex => {
        const setsReps = [ex.sets, ex.reps].filter(Boolean).join('×');
        return `<li>${esc(ex.name || 'Exercise')}${setsReps ? ' <span class="acc-meta">(' + esc(setsReps) + ')</span>' : ''}</li>`;
      }).join('');
      return `<div class="acc-today-label">${esc(block.name || 'Block')}</div><ul class="acc-today-blocks">${items}</ul>`;
    }).join('');
  }
  function renderFeed(rows){
    if (!rows.length){
      feedGrid.style.display = 'none';
      feedEmpty.style.display = 'block';
      feedEmpty.textContent = 'No active members in this group yet.';
      return;
    }
    feedEmpty.style.display = 'none';
    feedGrid.style.display = '';
    feedGrid.innerHTML = rows.map(r => `
      <div class="acc-card${r.is_me ? ' is-me' : ''}">
        <div class="acc-card-head">
          <img class="acc-avatar" src="${escAttr(r.avatar || '')}" alt="">
          <span class="acc-card-name">${esc(r.full_name)}${r.is_me ? ' (You)' : ''}</span>
          ${r.streak > 0 ? '<span class="acc-streak">\u{1F525} ' + r.streak + '</span>' : ''}
        </div>
        ${r.is_rest_day
          ? '<div class="acc-rest-day">Rest day</div>'
          : (blockListHtml(r.today_blocks) || '<div class="acc-rest-day">No program set.</div>')}
        <div class="acc-meta">Last check-in: ${r.last_checkin ? esc(r.last_checkin) : '—'} · ${r.checkins_last_7_days || 0} check-ins this week</div>
        ${r.is_me ? '<div class="acc-card-actions"><button class="btn2" id="acc-leave-btn">Leave Group</button></div>' : ''}
      </div>
    `).join('');
    const leaveBtn = document.getElementById('acc-leave-btn');
    if (leaveBtn){
      leaveBtn.addEventListener('click', () => {
        if (!confirm('Leave this accountability group?')) return;
        leaveGroup(activeGroupId);
      });
    }
  }
  async function loadFeed(){
    if (!activeGroupId){ renderFeed([]); feedEmpty.textContent = "You're not in an accountability group yet — connect with someone below to start one."; return; }
    const { data, error } = await bnbClient.rpc('accountability_group_feed', { p_group_id: activeGroupId, p_day_key: todayKey() });
    if (error){ showToast(error.message || 'Could not load group feed.'); renderFeed([]); return; }
    renderFeed(data || []);
  }
  async function leaveGroup(groupId){
    const { error } = await bnbClient.rpc('accountability_leave', { p_group_id: groupId });
    if (error){ showToast(error.message || 'Could not leave group.'); return; }
    showToast('Left the group.');
    activeGroupId = null;
    await refreshAll();
  }

  /* ---------------- CONNECT: search ---------------- */
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (!q){ searchResults.innerHTML = ''; return; }
    searchTimer = setTimeout(() => runSearch(q), 300);
  });
  async function runSearch(q){
    const { data, error } = await bnbClient.rpc('accountability_search_members', { q });
    if (error){ showToast(error.message || 'Search failed.'); return; }
    const results = data || [];
    if (!results.length){
      searchResults.innerHTML = '<ul class="roster-list"><li class="empty-row">No members found.</li></ul>';
      return;
    }
    searchResults.innerHTML = '<ul class="roster-list">' + results.map(u => `
      <li>
        <span>${esc(u.full_name)}</span>
        <button class="btn2 primary" data-connect="${escAttr(u.id)}" data-name="${escAttr(u.full_name)}">Connect</button>
      </li>
    `).join('') + '</ul>';
    searchResults.querySelectorAll('[data-connect]').forEach(btn => {
      btn.addEventListener('click', () => startConnect(btn.getAttribute('data-connect'), btn.getAttribute('data-name')));
    });
  }

  /* ---------------- CONNECT: 0/1/2+ group flow ---------------- */
  async function startConnect(targetId, targetName){
    const groups = activeGroups();
    pendingConnectTarget = { id: targetId, name: targetName };

    if (groups.length === 1){
      // Already in exactly one group — invite straight into it, no modal.
      const { error } = await bnbClient.rpc('accountability_connect', {
        target_user_id: targetId, p_group_id: groups[0].group_id, p_group_name: null
      });
      if (error){ showToast(error.message || 'Could not send invite.'); return; }
      showToast('Invite sent to ' + targetName + ' for ' + groups[0].group_name + '.');
      pendingConnectTarget = null;
      await refreshAll();
      return;
    }

    // 0 groups: name-only. 2+ groups: pick a group or start a new one.
    panelTitle.textContent = 'Connect with ' + targetName;
    panelNameInput.value = '';
    if (groups.length === 0){
      panelGroupField.style.display = 'none';
      panelNameField.style.display = '';
    } else {
      panelGroupField.style.display = '';
      panelNameField.style.display = 'none';
      panelGroupSelect.innerHTML = groups.map(g =>
        `<option value="${escAttr(g.group_id)}">${esc(g.group_name)}</option>`
      ).join('') + '<option value="__new__">＋ Start a new group</option>';
      panelGroupSelect.value = groups[0].group_id;
    }
    panelBackdrop.classList.add('show');
  }
  if (panelGroupSelect){
    panelGroupSelect.addEventListener('change', () => {
      panelNameField.style.display = panelGroupSelect.value === '__new__' ? '' : 'none';
    });
  }
  panelCancel.addEventListener('click', () => {
    panelBackdrop.classList.remove('show');
    pendingConnectTarget = null;
  });
  panelSave.addEventListener('click', async () => {
    if (!pendingConnectTarget) return;
    const usingGroupPicker = panelGroupField.style.display !== 'none';
    const pickedExisting = usingGroupPicker && panelGroupSelect.value !== '__new__';
    const groupId = pickedExisting ? panelGroupSelect.value : null;
    const groupName = pickedExisting ? null : panelNameInput.value.trim();

    if (!pickedExisting && !groupName){ showToast('Enter a group name.'); return; }

    const { error } = await bnbClient.rpc('accountability_connect', {
      target_user_id: pendingConnectTarget.id, p_group_id: groupId, p_group_name: groupName
    });
    if (error){ showToast(error.message || 'Could not send invite.'); return; }
    showToast('Invite sent to ' + pendingConnectTarget.name + '.');
    panelBackdrop.classList.remove('show');
    pendingConnectTarget = null;
    await refreshAll();
  });

  /* ---------------- REFRESH ---------------- */
  async function refreshAll(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return; // gated tab — shouldn't happen, but no session means nothing to show

    const { data, error } = await bnbClient.rpc('accountability_my_groups');
    if (error){ showToast(error.message || 'Could not load your groups.'); return; }
    myGroups = data || [];

    renderPendingInvites();

    const active = activeGroups();
    if (!active.length){
      activeGroupId = null;
      groupsNav.style.display = 'none';
      feedGrid.style.display = 'none';
      feedEmpty.style.display = 'block';
      feedEmpty.textContent = "You're not in an accountability group yet — connect with someone below to start one.";
      return;
    }
    if (!activeGroupId || !active.some(g => g.group_id === activeGroupId)){
      activeGroupId = active[0].group_id;
    }
    renderGroupsNav();
    await loadFeed();
  }

  window.bnbAccountabilityOnTabShown = refreshAll;
  refreshAll();
})();
