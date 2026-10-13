/* ---------------- INBOX (open messaging — everyone can message anyone) ----------------
   Separate from Messages (js/bells-n-barz-messages.js), which is a
   pooled member<->"all staff" support thread. This is a general-purpose
   inbox with two kinds of conversation, listed together newest first:
     - direct messages: any signed-in user to any other, through
       dm_threads/dm_messages (sql/14-inbox.sql)
     - group chats: named groups of up to 50, through chat_groups and
       friends (sql/59-group-chats.sql) — hidden until that SQL has run
   Same rendering shape as Messages' staff view (conversation list +
   detail + compose), reusing its .msg-* CSS. Typing, read receipts and
   reactions work in both (window.bnbTyping / bnbReactions, shell). */
(function(){
  const body = document.getElementById('inbox-body');
  if (!body) return;

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }
  function toast(msg){
    const t = document.getElementById('t-toast');
    if (t){ t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
  }
  function selfUser(){ return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf(); }

  // "Alice is typing…" line under the thread (window.bnbTyping, shell).
  function typingLineHtml(id){ return `<div class="msg-typing" id="${id}" hidden aria-live="polite"></div>`; }
  function showTyping(id, text){
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = !text;
    el.innerHTML = text ? esc(text) + '<span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>' : '';
  }
  // Read receipt under my last message (sql/56 for DMs, sql/59 for groups).
  //   DM:    "Sent" / "Seen <when>"
  //   group: "Sent" / "Seen by 2 of 3" / "Seen by everyone"
  // Hidden when the last message isn't mine, or before the SQL has run.
  function receiptLineHtml(id){ return `<div class="msg-receipt" id="${id}" hidden></div>`; }
  function showReceipt(id, state){
    const el = document.getElementById(id);
    if (!el) return;
    if (!state || !state.myLastAt){ el.hidden = true; return; }
    const at = new Date(state.myLastAt);
    let text, seen;
    if (state.kind === 'group'){
      const others = state.readers || [];
      if (!others.length){ el.hidden = true; return; }
      const n = others.filter(r => r.read_at && new Date(r.read_at) >= at).length;
      seen = n > 0;
      text = n === 0 ? 'Sent' : n === others.length ? 'Seen by everyone' : 'Seen by ' + n + ' of ' + others.length;
    } else {
      if (state.otherReadAt === undefined){ el.hidden = true; return; }
      seen = !!state.otherReadAt && new Date(state.otherReadAt) >= at;
      text = seen ? 'Seen ' + fmtWhen(state.otherReadAt) : 'Sent';
    }
    el.hidden = false;
    el.classList.toggle('seen', seen);
    el.textContent = text;
  }
  function wireTypingInput(input, typing, role){
    if (!typing) return;
    input.addEventListener('input', () => { input.value.trim() ? typing.notify(role) : typing.stop(role); });
    input.addEventListener('blur', () => typing.stop(role));
  }
  const typing = window.bnbTyping ? window.bnbTyping() : null;

  function fmtWhen(iso){
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'}) + ' ' +
           d.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
  }

  // nameOf(senderId) gives the label above other people's messages.
  // Messages with no sender are group system notes ("Alice added Bob").
  // reactions: { messageId: [{user_id, emoji}] }, or null when that
  // conversation's reactions table isn't there yet (no ☺ button then).
  function messageListHtml(messages, meId, nameOf, reactions){
    if (!messages.length) return '<div class="empty-msg">No messages yet — say hello.</div>';
    return messages.map(m => {
      if (!m.sender_id) return `<div class="msg-system">${esc(m.body)}</div>`;
      const mine = m.sender_id === meId;
      const who = mine ? 'You' : nameOf(m.sender_id);
      return `<div class="msg-bubble ${mine ? 'mine' : 'theirs'}" data-msg-id="${escAttr(m.id)}">
        <div class="msg-meta">${esc(who)} &middot; ${esc(fmtWhen(m.created_at))}</div>
        ${m.body ? `<div class="msg-body">${esc(m.body)}</div>` : ''}
        ${m.attachment && window.bnbAttach ? window.bnbAttach.bubbleHtml(m.attachment) : ''}
        ${reactions && window.bnbReactions ? window.bnbReactions.bubbleExtrasHtml(reactions[m.id], meId) : ''}
      </div>`;
    }).join('');
  }
  async function loadReactions(table, ids){
    if (!ids.length) return {};
    const { data, error } = await bnbClient.from(table).select('message_id, user_id, emoji').in('message_id', ids);
    if (error) return null;
    const map = {};
    (data || []).forEach(r => { (map[r.message_id] = map[r.message_id] || []).push(r); });
    return map;
  }
  const REACTION_TABLE = { dm: 'dm_message_reactions', group: 'chat_group_reactions' };

  /* ---------------- STATE ---------------- */
  let dmCache = [];            // my_dm_threads()
  let groupCache = [];         // my_chat_groups()
  let groupsAvailable = false; // sql/59 present
  // The open conversation:
  //   { kind: 'dm', userId, name, threadId }   (threadId null until the first message)
  //   { kind: 'group', groupId, name }
  let sel = null;
  let receipt = null;          // see showReceipt()
  let reactions = null;        // reactions for the open conversation
  let members = [];            // open group's members [{user_id, full_name, role, read_at}]
  let groupForm = null;        // { mode: 'create' | 'add', picked: [{id, name}] } while creating/adding
  let renaming = false;        // open group's name is being edited
  const pendingFiles = {};     // conversation key -> picked file not sent yet (survives re-renders)
  const attachState = { get: () => pendingFiles[convKey(sel)] || null,
                        set: v => { const k = convKey(sel); if (v) pendingFiles[k] = v; else delete pendingFiles[k]; } };

  function convKey(s){ return !s ? null : s.kind === 'dm' ? 'dm-user:' + s.userId : 'grp:' + s.groupId; }
  function memberName(id){ const m = members.find(x => x.user_id === id); return m ? m.full_name : 'Former member'; }

  async function loadLists(){
    const [dms, groups] = await Promise.all([bnbClient.rpc('my_dm_threads'), bnbClient.rpc('my_chat_groups')]);
    if (dms.error){ console.error('Supabase load my_dm_threads failed:', dms.error); return false; }
    dmCache = dms.data || [];
    groupsAvailable = !groups.error;
    groupCache = groups.error ? [] : (groups.data || []);
    return true;
  }
  function conversations(){
    const rows = dmCache.map(t => ({ kind: 'dm', key: 'dm-user:' + t.other_user_id, updated_at: t.updated_at, t }))
      .concat(groupCache.map(g => ({ kind: 'group', key: 'grp:' + g.group_id, updated_at: g.updated_at, g })));
    return rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  function isUnread(row, meId){
    if (!window.bnbDmIsUnread) return false;
    return row.kind === 'dm' ? window.bnbDmIsUnread(row.t, meId) : window.bnbDmIsUnread(window.bnbGroupAsThread(row.g), meId);
  }
  function selectRow(row){
    if (!row){ sel = null; return; }
    sel = row.kind === 'dm'
      ? { kind: 'dm', userId: row.t.other_user_id, name: row.t.other_user_name, threadId: row.t.thread_id }
      : { kind: 'group', groupId: row.g.group_id, name: row.g.name };
  }

  /* ---------------- RENDER ----------------
     Re-renders replace the whole Inbox, so remember what was being typed
     (message, search box, group form, rename box) and put it back —
     auto-refresh must never eat a half-written message. */
  let renderSeq = 0;
  async function renderInbox(){
    const seq = ++renderSeq;
    const me = selfUser();
    if (!me){ body.innerHTML = '<div class="empty-msg">Sign in to use your inbox.</div>'; return; }

    const prevInput = document.getElementById('inbox-input');
    const draft = prevInput ? { key: convKey(sel), text: prevInput.value, focused: document.activeElement === prevInput,
      start: prevInput.selectionStart, end: prevInput.selectionEnd } : null;
    const prevSearch = document.getElementById('inbox-search-input');
    const search = prevSearch ? { q: prevSearch.value, focused: document.activeElement === prevSearch } : null;
    const prevGroupName = document.getElementById('grp-name');
    const keepGroupName = prevGroupName ? prevGroupName.value : '';
    const prevRename = document.getElementById('grp-rename-input');
    const keepRename = prevRename ? prevRename.value : null;

    if (!await loadLists()) return;
    if (seq !== renderSeq) return; // a newer render started meanwhile
    lastSignature = signatureOf();

    // Deep link: a "Message" button elsewhere in the app opens a DM with
    // a specific person, new or existing.
    if (window.BNB_INBOX_PENDING_USER){
      const pending = window.BNB_INBOX_PENDING_USER;
      window.BNB_INBOX_PENDING_USER = null;
      const existing = dmCache.find(t => t.other_user_id === pending.id);
      sel = { kind: 'dm', userId: pending.id, name: pending.name, threadId: existing ? existing.thread_id : null };
      groupForm = null;
    }
    // Keep the open conversation in step with the lists (a DM gets its
    // thread id after the first message; a group may have been left or
    // renamed).
    if (sel && sel.kind === 'dm'){
      const t = dmCache.find(x => x.other_user_id === sel.userId);
      if (t) sel.threadId = t.thread_id;
    } else if (sel && sel.kind === 'group'){
      const g = groupCache.find(x => x.group_id === sel.groupId);
      if (g) sel.name = g.name; else sel = null;
    }
    const convs = conversations();
    if (!sel && !groupForm && convs.length) selectRow(convs[0]);

    let detailHtml = '<div class="empty-msg">Select a conversation, or search for someone to message.</div>';
    receipt = null;
    let markedReadAt = undefined; // set when this render marks the open conversation read

    if (groupForm){
      detailHtml = groupFormHtml(keepGroupName);
    } else if (sel && sel.kind === 'dm'){
      let messages = [];
      reactions = null;
      if (sel.threadId){
        const { data, error } = await bnbClient.from('dm_messages').select('*').eq('thread_id', sel.threadId).order('created_at', { ascending: true });
        if (error){ console.error('Supabase load dm_messages failed:', error); return; }
        if (seq !== renderSeq) return;
        messages = data || [];
        reactions = await loadReactions(REACTION_TABLE.dm, messages.map(m => m.id));
        if (seq !== renderSeq) return;
        const open = dmCache.find(x => x.thread_id === sel.threadId);
        const last = messages[messages.length - 1];
        receipt = { kind: 'dm', myLastAt: last && last.sender_id === me.id ? last.created_at : null,
                    otherReadAt: open ? open.other_read_at : undefined };
        if (inboxOnScreen() && window.bnbDmMarkRead){
          window.bnbDmMarkRead(sel.threadId, open && open.updated_at);
          if (open) open.unread = false;
          markedReadAt = open ? open.updated_at : null;
        }
      }
      const otherName = sel.name;
      detailHtml = `
        <div class="msg-thread" id="inbox-thread">${messageListHtml(messages, me.id, () => otherName, reactions)}</div>
        ${receiptLineHtml('inbox-receipt')}
        ${typingLineHtml('inbox-typing')}
        ${composeHtml('Message ' + sel.name + '...')}
      `;
    } else if (sel && sel.kind === 'group'){
      const [msgs, mem] = await Promise.all([
        bnbClient.from('chat_group_messages').select('*').eq('group_id', sel.groupId).order('created_at', { ascending: true }),
        bnbClient.rpc('chat_group_member_list', { p_group_id: sel.groupId })
      ]);
      if (msgs.error){ console.error('Supabase load chat_group_messages failed:', msgs.error); return; }
      if (seq !== renderSeq) return;
      const messages = msgs.data || [];
      members = mem.error ? [] : (mem.data || []);
      reactions = await loadReactions(REACTION_TABLE.group, messages.filter(m => m.sender_id).map(m => m.id));
      if (seq !== renderSeq) return;
      const g = groupCache.find(x => x.group_id === sel.groupId);
      const lastReal = messages.filter(m => m.sender_id).pop();
      receipt = { kind: 'group', myLastAt: lastReal && lastReal.sender_id === me.id ? lastReal.created_at : null,
                  readers: members.filter(m => m.user_id !== me.id) };
      if (inboxOnScreen() && window.bnbDmMarkRead){
        window.bnbDmMarkRead(sel.groupId, g && g.updated_at, 'group');
        if (g) g.unread = false;
        markedReadAt = g ? g.updated_at : null;
      }
      detailHtml = `
        ${groupHeaderHtml(me, keepRename)}
        <div class="msg-thread" id="inbox-thread">${messageListHtml(messages, me.id, memberName, reactions)}</div>
        ${receiptLineHtml('inbox-receipt')}
        ${typingLineHtml('inbox-typing')}
        ${composeHtml('Message ' + sel.name + '...')}
      `;
    }

    const activeKey = groupForm ? null : convKey(sel);
    const listHtml = convs.length ? convs.map(row => {
      const unread = isUnread(row, me.id) ? '<span class="msg-needs-reply">New</span>' : '';
      if (row.kind === 'dm') return `
        <div class="msg-thread-row ${row.key === activeKey ? 'active' : ''}" data-key="${escAttr(row.key)}">
          <span class="msg-thread-name">${esc(row.t.other_user_name)}</span>${unread}
        </div>`;
      return `
        <div class="msg-thread-row group ${row.key === activeKey ? 'active' : ''}" data-key="${escAttr(row.key)}">
          <span class="msg-thread-name"><span aria-hidden="true">👥 </span>${esc(row.g.name)}<span class="msg-thread-sub">${row.g.member_count} people</span></span>${unread}
        </div>`;
    }).join('') : '<div class="empty-msg">No conversations yet — search for someone below to start one.</div>';

    body.innerHTML = `
      <div class="inbox-top">
        <div class="inbox-top-search">
          <p class="field-hint">Search for anyone — a member, trainer, or admin — to start a new conversation.</p>
          <input type="text" id="inbox-search-input" placeholder="Search people by name…" autocomplete="off">
          <div id="inbox-search-results"></div>
        </div>
        ${groupsAvailable ? '<button type="button" class="btn2 primary" id="grp-new-btn">👥 New group</button>' : ''}
      </div>
      <div class="msg-staff-layout">
        <div class="msg-thread-list">${listHtml}</div>
        <div class="msg-thread-detail">${detailHtml}</div>
      </div>
    `;

    wireSearch();
    if (window.bnbInboxSetBadge) window.bnbInboxSetBadge(convs.filter(r => isUnread(r, me.id)).length);
    const newInput = document.getElementById('inbox-input');
    if (draft && newInput && draft.key === convKey(sel) && draft.text){
      newInput.value = draft.text;
      if (draft.focused){ newInput.focus(); newInput.setSelectionRange(draft.start, draft.end); }
    }
    const newSearch = document.getElementById('inbox-search-input');
    if (search && newSearch && search.q){
      newSearch.value = search.q;
      if (search.focused) newSearch.focus();
      runSearch(search.q, document.getElementById('inbox-search-results'));
    }
    body.querySelectorAll('.msg-thread-row').forEach(row => {
      row.addEventListener('click', () => {
        selectRow(convs.find(r => r.key === row.getAttribute('data-key')));
        groupForm = null; renaming = false;
        renderInbox();
      });
    });
    const newGroupBtn = document.getElementById('grp-new-btn');
    if (newGroupBtn) newGroupBtn.addEventListener('click', () => { groupForm = { mode: 'create', picked: [] }; renaming = false; renderInbox(); });
    if (groupForm) wireGroupForm();
    if (sel && sel.kind === 'group' && !groupForm) wireGroupHeader();

    const threadEl = document.getElementById('inbox-thread');
    if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;

    // Live typing / read / reaction signals for the open conversation.
    const liveKey = groupForm || !sel ? null : sel.kind === 'group' ? 'grp:' + sel.groupId : (sel.threadId ? 'dm:' + sel.threadId : null);
    const openSel = sel;
    if (typing) typing.join(liveKey, me.id,
      who => showTyping('inbox-typing', !who ? '' : (openSel.kind === 'group' ? memberName(who.uid) : openSel.name) + ' is typing'),
      payload => {
        if (!receipt) return;
        if (receipt.kind === 'group'){
          const r = (receipt.readers || []).find(x => x.user_id === payload.uid);
          if (r) r.read_at = payload.at;
        } else {
          receipt.otherReadAt = payload.at;
        }
        showReceipt('inbox-receipt', receipt);
      },
      async messageId => {
        const fresh = await loadReactions(REACTION_TABLE[openSel.kind], [messageId]);
        if (!fresh || !reactions) return;
        reactions[messageId] = fresh[messageId] || [];
        window.bnbReactions.redraw(body, messageId, reactions[messageId], me.id);
      });
    showReceipt('inbox-receipt', receipt);
    if (typing && markedReadAt !== undefined) typing.read('user', markedReadAt);
    if (window.bnbAttach) window.bnbAttach.fill(body);

    wireCompose();
  }

  function composeHtml(placeholder){
    const att = window.bnbAttach;
    return `${att ? att.pendingHtml('inbox') : ''}<div class="msg-compose">
      ${att ? att.composeExtrasHtml('inbox') : ''}
      <textarea class="msg-input" id="inbox-input" placeholder="${escAttr(placeholder)}"></textarea>
      <button class="weight-submit" id="inbox-send" type="button">Send</button>
    </div>`;
  }
  function wireCompose(){
    const sendBtn = document.getElementById('inbox-send');
    if (!sendBtn) return;
    const input = document.getElementById('inbox-input');
    if (window.bnbAttach) window.bnbAttach.wire('inbox', attachState);
    sendBtn.addEventListener('click', async () => {
      const text = input.value.trim();
      const pending = attachState.get();
      if ((!text && !pending) || !sel) return;
      sendBtn.disabled = true;
      const label = sendBtn.textContent;
      let attachment = null;
      if (pending){
        sendBtn.textContent = 'Uploading…';
        try { attachment = await window.bnbAttach.upload(pending, selfUser().id); }
        catch(err){
          sendBtn.disabled = false; sendBtn.textContent = label;
          console.error('Upload failed:', err);
          toast((err && err.message) || 'Could not upload that file — check your connection and try again.');
          return;
        }
      }
      const args = sel.kind === 'group' ? { p_group_id: sel.groupId, p_body: text } : { p_recipient_id: sel.userId, p_body: text };
      if (attachment) args.p_attachment = attachment;
      const { error } = await bnbClient.rpc(sel.kind === 'group' ? 'send_group_message' : 'send_direct_message', args);
      sendBtn.disabled = false; sendBtn.textContent = label;
      if (error){
        console.error('Supabase send failed:', error);
        toast(error.message || 'Could not send — check your connection and try again.');
        return;
      }
      attachState.set(null);
      if (typing) typing.stop('user');
      input.value = '';
      renderInbox();
    });
    wireTypingInput(input, typing, 'user');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendBtn.click(); }
    });
  }

  /* ---------------- GROUPS: header (rename / add / leave) ---------------- */
  function groupHeaderHtml(me, keepRename){
    const others = members.filter(m => m.user_id !== me.id).map(m => m.full_name);
    const who = others.length ? 'You, ' + others.join(', ') : 'Just you';
    const nameBlock = renaming
      ? `<div class="grp-rename"><input type="text" id="grp-rename-input" maxlength="60" value="${escAttr(keepRename !== null ? keepRename : sel.name)}" aria-label="Group name">
           <button type="button" class="btn2 primary" id="grp-rename-save">Save</button>
           <button type="button" class="btn2" id="grp-rename-cancel">Cancel</button></div>`
      : `<h3 class="grp-title">👥 ${esc(sel.name)}</h3>`;
    return `<div class="grp-header">
      <div class="grp-header-main">${nameBlock}<div class="grp-members" title="${escAttr(who)}">${esc(who)}</div></div>
      ${renaming ? '' : `<div class="grp-actions">
        <button type="button" class="btn2" id="grp-add-btn">Add people</button>
        <button type="button" class="btn2" id="grp-rename-btn">Rename</button>
        <button type="button" class="btn2 del" id="grp-leave-btn">Leave</button>
      </div>`}
    </div>`;
  }
  function wireGroupHeader(){
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('grp-add-btn', () => { groupForm = { mode: 'add', picked: [] }; renderInbox(); });
    on('grp-rename-btn', () => { renaming = true; renderInbox().then(() => { const i = document.getElementById('grp-rename-input'); if (i){ i.focus(); i.select(); } }); });
    on('grp-rename-cancel', () => { renaming = false; renderInbox(); });
    on('grp-rename-save', async () => {
      const name = document.getElementById('grp-rename-input').value.trim();
      if (!name) return;
      const { error } = await bnbClient.rpc('rename_chat_group', { p_group_id: sel.groupId, p_name: name });
      if (error){ toast(error.message || 'Could not rename the group.'); return; }
      renaming = false; renderInbox();
    });
    const renameInput = document.getElementById('grp-rename-input');
    if (renameInput) renameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter'){ e.preventDefault(); document.getElementById('grp-rename-save').click(); }
      if (e.key === 'Escape'){ document.getElementById('grp-rename-cancel').click(); }
    });
    on('grp-leave-btn', async () => {
      if (!confirm('Leave "' + sel.name + '"? You won\'t see its messages any more unless someone adds you back.')) return;
      const { error } = await bnbClient.rpc('leave_chat_group', { p_group_id: sel.groupId });
      if (error){ toast(error.message || 'Could not leave the group.'); return; }
      sel = null; renderInbox();
    });
  }

  /* ---------------- GROUPS: create / add people ---------------- */
  function groupFormHtml(keepName){
    const creating = groupForm.mode === 'create';
    return `<div class="grp-form">
      <h3>${creating ? 'New group' : 'Add people to ' + esc(sel ? sel.name : 'group')}</h3>
      ${creating ? `<label class="grp-label" for="grp-name">Group name</label>
        <input type="text" id="grp-name" maxlength="60" placeholder="e.g. Morning Crew" value="${escAttr(keepName)}">` : ''}
      <label class="grp-label" for="grp-search">People</label>
      <input type="text" id="grp-search" placeholder="Search people by name…" autocomplete="off">
      <div id="grp-search-results"></div>
      <div class="grp-picked" id="grp-picked"></div>
      <div class="grp-form-actions">
        <button type="button" class="btn2" id="grp-cancel">Cancel</button>
        <button type="button" class="btn2 primary" id="grp-submit">${creating ? 'Create group' : 'Add'}</button>
      </div>
    </div>`;
  }
  function drawPicked(){
    const box = document.getElementById('grp-picked');
    if (!box) return;
    box.innerHTML = groupForm.picked.length
      ? groupForm.picked.map(p => `<span class="grp-chip">${esc(p.name)}<button type="button" data-unpick="${escAttr(p.id)}" aria-label="Remove ${escAttr(p.name)}">×</button></span>`).join('')
      : '<span class="field-hint">No one picked yet.</span>';
    box.querySelectorAll('[data-unpick]').forEach(b => b.addEventListener('click', () => {
      groupForm.picked = groupForm.picked.filter(p => p.id !== b.getAttribute('data-unpick'));
      drawPicked();
    }));
  }
  function wireGroupForm(){
    drawPicked();
    const input = document.getElementById('grp-search');
    const results = document.getElementById('grp-search-results');
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q){ results.innerHTML = ''; return; }
      timer = setTimeout(async () => {
        const { data, error } = await bnbClient.rpc('accountability_search_members', { q });
        if (error){ console.error('Supabase search failed:', error); return; }
        const inGroup = new Set(groupForm.mode === 'add' ? members.map(m => m.user_id) : []);
        const found = (data || []).filter(u => !inGroup.has(u.id) && !groupForm.picked.some(p => p.id === u.id));
        results.innerHTML = found.length
          ? '<ul class="roster-list">' + found.map(u => `<li><span>${esc(u.full_name)}</span>
              <button type="button" class="btn2 primary" data-pick="${escAttr(u.id)}" data-name="${escAttr(u.full_name)}">Add</button></li>`).join('') + '</ul>'
          : '<ul class="roster-list"><li class="empty-row">No one found.</li></ul>';
        results.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
          groupForm.picked.push({ id: b.getAttribute('data-pick'), name: b.getAttribute('data-name') });
          b.closest('li').remove();
          drawPicked();
        }));
      }, 300);
    });
    document.getElementById('grp-cancel').addEventListener('click', () => { groupForm = null; renderInbox(); });
    document.getElementById('grp-submit').addEventListener('click', async e => {
      const btn = e.currentTarget;
      const ids = groupForm.picked.map(p => p.id);
      if (!ids.length){ toast('Pick at least one person.'); return; }
      btn.disabled = true;
      if (groupForm.mode === 'create'){
        const name = document.getElementById('grp-name').value.trim();
        if (!name){ btn.disabled = false; toast('Give the group a name.'); return; }
        const { data, error } = await bnbClient.rpc('create_chat_group', { p_name: name, p_member_ids: ids });
        btn.disabled = false;
        if (error){ toast(error.message || 'Could not create the group.'); return; }
        sel = { kind: 'group', groupId: data, name };
      } else {
        const { error } = await bnbClient.rpc('add_chat_group_members', { p_group_id: sel.groupId, p_member_ids: ids });
        btn.disabled = false;
        if (error){ toast(error.message || 'Could not add those people.'); return; }
      }
      groupForm = null;
      renderInbox();
    });
  }

  /* ---------------- SEARCH: start a new direct message ----------------
     Reuses accountability_search_members() as-is (see sql/14-inbox.sql's
     header comment) — it already searches every user regardless of
     role, excluding self and suspended accounts, which is exactly
     "anyone" here too. */
  let searchTimer = null;
  function wireSearch(){
    const input = document.getElementById('inbox-search-input');
    const results = document.getElementById('inbox-search-results');
    if (!input || !results) return;
    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const q = input.value.trim();
      if (!q){ results.innerHTML = ''; return; }
      searchTimer = setTimeout(() => runSearch(q, results), 300);
    });
  }
  async function runSearch(q, results){
    const { data, error } = await bnbClient.rpc('accountability_search_members', { q });
    if (error) { console.error('Supabase search failed:', error); return; }
    const found = data || [];
    if (!found.length){
      results.innerHTML = '<ul class="roster-list"><li class="empty-row">No one found.</li></ul>';
      return;
    }
    results.innerHTML = '<ul class="roster-list">' + found.map(u => `
      <li>
        <span>${esc(u.full_name)}</span>
        <button class="btn2 primary" data-start-dm="${escAttr(u.id)}" data-name="${escAttr(u.full_name)}">Message</button>
      </li>
    `).join('') + '</ul>';
    results.querySelectorAll('[data-start-dm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-start-dm');
        const match = dmCache.find(t => t.other_user_id === id);
        sel = { kind: 'dm', userId: id, name: btn.getAttribute('data-name'), threadId: match ? match.thread_id : null };
        groupForm = null; renaming = false;
        renderInbox();
      });
    });
  }

  /* ---------------- AUTO-REFRESH ----------------
     While the Inbox is on screen, check for new messages every 15 seconds
     and redraw only if a conversation actually changed (new message, new
     DM or group). Drafts, the search box and a half-filled group form
     survive the redraw (see the top of renderInbox). */
  let lastSignature = '';
  function signatureOf(dms, groups){
    return (dms || dmCache).map(t => t.thread_id + '@' + t.updated_at)
      .concat((groups || groupCache).map(g => g.group_id + '@' + g.updated_at)).join('|');
  }
  function inboxOnScreen(){
    const panel = document.getElementById('tab-inbox');
    return document.visibilityState === 'visible' && !!panel && panel.classList.contains('active');
  }
  setInterval(async () => {
    if (!inboxOnScreen() || !selfUser()) return;
    const [dms, groups] = await Promise.all([bnbClient.rpc('my_dm_threads'), bnbClient.rpc('my_chat_groups')]);
    if (dms.error) return;
    if (signatureOf(dms.data || [], groups.error ? [] : (groups.data || [])) !== lastSignature) renderInbox();
  }, 15 * 1000);

  // Reaction clicks on any bubble (one listener on the Inbox, which stays
  // put across re-renders). The RPC depends on the open conversation.
  if (window.bnbReactions) window.bnbReactions.attach(body, {
    meId: () => { const me = selfUser(); return me ? me.id : null; },
    list: id => (reactions && reactions[id]) || [],
    set: (id, list) => { if (reactions) reactions[id] = list; },
    toggle: (id, emoji) => sel && sel.kind === 'group'
      ? bnbClient.rpc('toggle_group_reaction', { p_message_id: id, p_emoji: emoji })
      : bnbClient.rpc('toggle_dm_reaction', { p_message_id: id, p_emoji: emoji }),
    changed: id => { if (typing) typing.reacted(id); }
  });

  window.bnbInboxOnTabShown = renderInbox;
  renderInbox();
})();
