/* ---------------- INBOX (open messaging — everyone can message anyone) ----------------
   Separate from Messages (js/bells-n-barz-messages.js), which is a
   pooled member<->"all staff" support thread. This is a general-purpose
   inbox: any signed-in user can message any other, resolved through
   dm_threads/dm_messages (see sql/14-inbox.sql) rather than the older
   message_threads/messages tables. Same rendering shape as Messages'
   staff view (thread list + detail + compose), reusing its .msg-* CSS. */
(function(){
  const body = document.getElementById('inbox-body');
  if (!body) return;

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  function fmtWhen(iso){
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'}) + ' ' +
           d.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
  }

  function messageListHtml(messages, meId, otherName){
    if (!messages.length) return '<div class="empty-msg">No messages yet — say hello.</div>';
    return messages.map(m => {
      const mine = m.sender_id === meId;
      const who = mine ? 'You' : otherName;
      return `<div class="msg-bubble ${mine ? 'mine' : 'theirs'}">
        <div class="msg-meta">${esc(who)} &middot; ${esc(fmtWhen(m.created_at))}</div>
        <div class="msg-body">${esc(m.body)}</div>
      </div>`;
    }).join('');
  }

  let threadsCache = [];
  let selectedThreadId = null; // null until a real thread exists with the selected person
  let selectedOtherUserId = null;
  let selectedOtherUserName = null;

  async function renderInbox(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){ body.innerHTML = '<div class="empty-msg">Sign in to use your inbox.</div>'; return; }

    const { data: threads, error } = await bnbClient.rpc('my_dm_threads');
    if (error) { console.error('Supabase load my_dm_threads failed:', error); return; }
    threadsCache = threads || [];

    // Deep-link support (mirrors window.BNB_MESSAGES_PENDING_MEMBER) — lets
    // a "Message" button elsewhere in the app (e.g. a member's profile,
    // the roster) jump straight into a conversation with a specific
    // person, new or existing, instead of only picking from the list.
    if (window.BNB_INBOX_PENDING_USER){
      const pending = window.BNB_INBOX_PENDING_USER;
      window.BNB_INBOX_PENDING_USER = null;
      selectedOtherUserId = pending.id;
      selectedOtherUserName = pending.name;
      const existing = threadsCache.find(t => t.other_user_id === pending.id);
      selectedThreadId = existing ? existing.thread_id : null;
    } else if (!selectedOtherUserId && threadsCache.length){
      selectedThreadId = threadsCache[0].thread_id;
      selectedOtherUserId = threadsCache[0].other_user_id;
      selectedOtherUserName = threadsCache[0].other_user_name;
    }

    const listHtml = threadsCache.length
      ? threadsCache.map(t => `
        <div class="msg-thread-row ${t.other_user_id === selectedOtherUserId ? 'active' : ''}" data-user-id="${escAttr(t.other_user_id)}" data-name="${escAttr(t.other_user_name)}">
          <span class="msg-thread-name">${esc(t.other_user_name)}</span>
          ${t.last_sender_id && t.last_sender_id !== me.id ? '<span class="msg-needs-reply">New</span>' : ''}
        </div>
      `).join('')
      : '<div class="empty-msg">No conversations yet — search for someone below to start one.</div>';

    let detailHtml = '<div class="empty-msg">Select a conversation, or search for someone to message.</div>';
    let messages = [];
    if (selectedOtherUserId){
      if (selectedThreadId){
        const { data, error: msgErr } = await bnbClient
          .from('dm_messages').select('*').eq('thread_id', selectedThreadId).order('created_at', { ascending: true });
        if (msgErr) { console.error('Supabase load dm_messages failed:', msgErr); return; }
        messages = data || [];
      }
      detailHtml = `
        <div class="msg-thread" id="inbox-thread">${messageListHtml(messages, me.id, selectedOtherUserName)}</div>
        <div class="msg-compose">
          <textarea class="msg-input" id="inbox-input" placeholder="Message ${escAttr(selectedOtherUserName)}..."></textarea>
          <button class="weight-submit" id="inbox-send" type="button">Send</button>
        </div>
      `;
    }

    body.innerHTML = `
      <div style="margin-bottom:16px;">
        <p class="field-hint">Search for anyone — a member, trainer, or admin — to start a new conversation.</p>
        <input type="text" id="inbox-search-input" placeholder="Search people by name…" autocomplete="off">
        <div id="inbox-search-results"></div>
      </div>
      <div class="msg-staff-layout">
        <div class="msg-thread-list">${listHtml}</div>
        <div class="msg-thread-detail">${detailHtml}</div>
      </div>
    `;

    wireSearch();

    body.querySelectorAll('.msg-thread-row').forEach(row => {
      row.addEventListener('click', () => {
        const userId = row.getAttribute('data-user-id');
        const match = threadsCache.find(t => t.other_user_id === userId);
        selectedThreadId = match ? match.thread_id : null;
        selectedOtherUserId = userId;
        selectedOtherUserName = row.getAttribute('data-name');
        renderInbox();
      });
    });

    const threadEl = document.getElementById('inbox-thread');
    if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;

    const sendBtn = document.getElementById('inbox-send');
    if (sendBtn){
      const input = document.getElementById('inbox-input');
      sendBtn.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text || !selectedOtherUserId) return;
        sendBtn.disabled = true;
        const { error: sendErr } = await bnbClient.rpc('send_direct_message', { p_recipient_id: selectedOtherUserId, p_body: text });
        sendBtn.disabled = false;
        if (sendErr){
          console.error('Supabase send_direct_message failed:', sendErr);
          const t = document.getElementById('t-toast');
          if (t){ t.textContent = sendErr.message || 'Could not send — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
          return;
        }
        input.value = '';
        renderInbox();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendBtn.click(); }
      });
    }
  }

  /* ---------------- SEARCH: start a new conversation ----------------
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
        const match = threadsCache.find(t => t.other_user_id === btn.getAttribute('data-start-dm'));
        selectedThreadId = match ? match.thread_id : null;
        selectedOtherUserId = btn.getAttribute('data-start-dm');
        selectedOtherUserName = btn.getAttribute('data-name');
        renderInbox();
      });
    });
  }

  window.bnbInboxOnTabShown = renderInbox;
  renderInbox();
})();
