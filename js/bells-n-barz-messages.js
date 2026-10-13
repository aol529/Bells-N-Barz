(function(){
  const memberBody = document.getElementById('messages-body');
  const staffBody = document.getElementById('coach-messages-body');

  if (!memberBody && !staffBody) return; // Messages not present on this page

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  function isStaffSelf(me){
    return !!(me && me.roles && me.roles.some(r => ['admin','trainer','staff'].includes(r)));
  }

  function fmtWhen(iso){
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'}) + ' ' +
           d.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
  }

  function messageListHtml(messages, meIsStaff){
    if (!messages.length) return '<div class="empty-msg">No messages yet — say hello.</div>';
    return messages.map(m => {
      const mine = m.sender_is_staff === meIsStaff;
      const who = m.sender_is_staff ? 'Staff' : 'Member';
      return `<div class="msg-bubble ${mine ? 'mine' : 'theirs'}">
        <div class="msg-meta">${esc(who)} &middot; ${esc(fmtWhen(m.created_at))}</div>
        <div class="msg-body">${esc(m.body)}</div>
      </div>`;
    }).join('');
  }

  /* ---------------- MEMBER VIEW ---------------- */
  let memberRenderSeq = 0;
  let memberSignature = '';

  async function renderMemberView(){
    if (!memberBody) return;
    const seq = ++memberRenderSeq;
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){ memberBody.innerHTML = '<div class="empty-msg">Sign in to message staff.</div>'; return; }

    // Auto-refresh redraws the view, so keep a half-written message.
    const prevInput = document.getElementById('msg-member-input');
    const draft = prevInput ? { text: prevInput.value, focused: document.activeElement === prevInput,
      start: prevInput.selectionStart, end: prevInput.selectionEnd } : null;

    const { data: thread, error: threadErr } = await bnbClient
      .from('message_threads').select('*').eq('member_id', me.id).maybeSingle();
    if (threadErr) { console.error('Supabase load message_threads failed:', threadErr); return; }
    if (seq !== memberRenderSeq) return; // a newer render started meanwhile
    memberSignature = thread ? thread.id + '@' + thread.updated_at : '';

    let messages = [];
    if (thread){
      const { data, error } = await bnbClient
        .from('messages').select('*').eq('thread_id', thread.id).order('created_at', { ascending: true });
      if (error) { console.error('Supabase load messages failed:', error); return; }
      if (seq !== memberRenderSeq) return;
      messages = data || [];
    }

    memberBody.innerHTML = `
      <div class="day-head"><h2>Messages — Staff</h2></div>
      <div class="day-focus">A direct line to your coaches and admin — any staff member can see and reply here.</div>
      <div class="msg-thread" id="msg-member-thread">${messageListHtml(messages, false)}</div>
      <div class="msg-compose">
        <textarea class="msg-input" id="msg-member-input" placeholder="Write a message to staff..."></textarea>
        <button class="weight-submit" id="msg-member-send" type="button">Send</button>
      </div>
    `;

    const input = document.getElementById('msg-member-input');
    const sendBtn = document.getElementById('msg-member-send');
    const threadEl = document.getElementById('msg-member-thread');
    threadEl.scrollTop = threadEl.scrollHeight;
    if (draft && draft.text){
      input.value = draft.text;
      if (draft.focused){ input.focus(); input.setSelectionRange(draft.start, draft.end); }
    }

    sendBtn.addEventListener('click', async () => {
      const body = input.value.trim();
      if (!body) return;
      sendBtn.disabled = true;
      const { error } = await bnbClient.rpc('send_message', { p_member_id: null, p_body: body });
      sendBtn.disabled = false;
      if (error){
        console.error('Supabase send_message failed:', error);
        const t = document.getElementById('t-toast');
        if (t){ t.textContent = 'Could not send — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
        return;
      }
      input.value = '';
      renderMemberView();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendBtn.click(); }
    });
  }

  /* ---------------- STAFF VIEW ---------------- */
  let selectedMemberId = null;
  let staffRenderSeq = 0;
  let staffSignature = '';

  async function renderStaffView(){
    if (!staffBody) return;
    const seq = ++staffRenderSeq;
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me || !isStaffSelf(me)){ staffBody.innerHTML = ''; return; }

    // Auto-refresh redraws the whole view, so keep a half-written reply
    // (and its caret) for the member it was being written to.
    const prevInput = document.getElementById('msg-staff-input');
    const draft = prevInput ? { memberId: selectedMemberId, text: prevInput.value, focused: document.activeElement === prevInput,
      start: prevInput.selectionStart, end: prevInput.selectionEnd } : null;

    if (window.BNB_MESSAGES_PENDING_MEMBER){
      selectedMemberId = window.BNB_MESSAGES_PENDING_MEMBER;
      window.BNB_MESSAGES_PENDING_MEMBER = null;
    }

    const { data: threads, error: threadsErr } = await bnbClient
      .from('message_threads').select('*').order('updated_at', { ascending: false });
    if (threadsErr) { console.error('Supabase load message_threads failed:', threadsErr); return; }
    if (seq !== staffRenderSeq) return; // a newer render started meanwhile
    staffSignature = threadSignature(threads || []);

    const members = (window.BNB_USERS && window.BNB_USERS.getMembers && window.BNB_USERS.getMembers()) || [];
    const nameFor = (id) => { const u = members.find(x => x.id === id); return u ? u.fullName : 'Unknown member'; };

    if ((threads || []).length && !selectedMemberId){
      selectedMemberId = threads[0].member_id;
    }

    const listHtml = (threads || []).length
      ? threads.map(t => `
        <div class="msg-thread-row ${t.member_id === selectedMemberId ? 'active' : ''}" data-member-id="${escAttr(t.member_id)}">
          <span class="msg-thread-name">${esc(nameFor(t.member_id))}</span>
          ${t.last_sender_is_staff === false ? '<span class="msg-needs-reply">Needs reply</span>' : ''}
        </div>
      `).join('')
      : '<div class="empty-msg">No member messages yet.</div>';

    let detailHtml = '<div class="empty-msg">Select a member to view their thread.</div>';
    let messages = [];
    if (selectedMemberId){
      const selectedThread = (threads || []).find(t => t.member_id === selectedMemberId);
      if (selectedThread){
        const { data, error } = await bnbClient
          .from('messages').select('*').eq('thread_id', selectedThread.id).order('created_at', { ascending: true });
        if (error) { console.error('Supabase load messages failed:', error); return; }
        if (seq !== staffRenderSeq) return;
        messages = data || [];
      }
      // Compose box shows even with no existing thread yet — lets staff
      // proactively start a conversation (e.g. via the Roster "Message"
      // button) rather than only replying to members who already wrote in.
      detailHtml = `
        <div class="msg-thread" id="msg-staff-thread">${messageListHtml(messages, true)}</div>
        <div class="msg-compose">
          <textarea class="msg-input" id="msg-staff-input" placeholder="Message ${escAttr(nameFor(selectedMemberId))}..."></textarea>
          <button class="weight-submit" id="msg-staff-send" type="button">Send</button>
        </div>
      `;
    }

    staffBody.innerHTML = `
      <div class="msg-staff-layout">
        <div class="msg-thread-list">${listHtml}</div>
        <div class="msg-thread-detail">${detailHtml}</div>
      </div>
    `;

    staffBody.querySelectorAll('.msg-thread-row').forEach(row => {
      row.addEventListener('click', () => {
        selectedMemberId = row.getAttribute('data-member-id');
        renderStaffView();
      });
    });

    const threadEl = document.getElementById('msg-staff-thread');
    if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;

    const newInput = document.getElementById('msg-staff-input');
    if (draft && newInput && draft.memberId === selectedMemberId && draft.text){
      newInput.value = draft.text;
      if (draft.focused){ newInput.focus(); newInput.setSelectionRange(draft.start, draft.end); }
    }

    const sendBtn = document.getElementById('msg-staff-send');
    if (sendBtn){
      const input = document.getElementById('msg-staff-input');
      sendBtn.addEventListener('click', async () => {
        const body = input.value.trim();
        if (!body) return;
        sendBtn.disabled = true;
        const { error } = await bnbClient.rpc('send_message', { p_member_id: selectedMemberId, p_body: body });
        sendBtn.disabled = false;
        if (error){
          console.error('Supabase send_message failed:', error);
          const t = document.getElementById('t-toast');
          if (t){ t.textContent = 'Could not send — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
          return;
        }
        input.value = '';
        renderStaffView();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendBtn.click(); }
      });
    }
  }

  /* ---------------- MEMBER AUTO-REFRESH ----------------
     While Member > Messages is on screen, check every 15 seconds whether
     staff have replied (the thread's updated_at moves) and redraw only
     then. */
  if (memberBody){
    setInterval(async () => {
      // offsetParent is null while Messages (or the Member tab) is hidden.
      if (document.visibilityState !== 'visible' || !memberBody.offsetParent) return;
      const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
      if (!me) return;
      const { data, error } = await bnbClient.from('message_threads').select('id, updated_at').eq('member_id', me.id).maybeSingle();
      if (error) return;
      if ((data ? data.id + '@' + data.updated_at : '') !== memberSignature) renderMemberView();
    }, 15 * 1000);
  }

  /* ---------------- STAFF AUTO-REFRESH ----------------
     While Coach > Messages is on screen, check every 15 seconds and redraw
     only if a thread changed (a new message bumps its updated_at, and a
     member writing in for the first time adds a thread). */
  function threadSignature(threads){ return threads.map(t => t.id + '@' + t.updated_at).join('|'); }
  if (staffBody){
    setInterval(async () => {
      // offsetParent is null while the section (or the Coach tab) is hidden.
      if (document.visibilityState !== 'visible' || !staffBody.offsetParent) return;
      const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
      if (!me || !isStaffSelf(me)) return;
      const { data, error } = await bnbClient.from('message_threads').select('id, updated_at').order('updated_at', { ascending: false });
      if (error) return;
      if (threadSignature(data || []) !== staffSignature) renderStaffView();
    }, 15 * 1000);
  }

  window.bnbMessagesOnTabShown = renderMemberView;
  window.bnbMessagesStaffOnTabShown = renderStaffView;

  if (memberBody) renderMemberView();
  if (staffBody) renderStaffView();
})();
