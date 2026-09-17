(function(){

  // Computed from the local system clock (not toISOString(), which can
  // shift a day depending on timezone) so "today" is genuinely today,
  // not a frozen demo-data date.
  const TODAY = (function(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })();
  const INVOICES_KEY = 'bnb-billing-invoices-v1';
  const PAYMENTS_KEY = 'bnb-billing-payments-v1';

  const SEED_INVOICES = [
    { id:'inv1', userId:'u1', amount:60, type:'membership', issuedDate:'2026-08-01', dueDate:'2026-08-05', notes:'August membership', voided:false },
    { id:'inv2', userId:'u3', amount:45, type:'membership', issuedDate:'2026-08-01', dueDate:'2026-08-05', notes:'August membership — card declined, retry needed', voided:false },
    { id:'inv3', userId:'u4', amount:120, type:'adjustment', issuedDate:'2026-07-01', dueDate:'2026-07-05', notes:'Equipment damage charge — pending dispute', voided:false },
    { id:'inv4', userId:'u5', amount:60, type:'membership', issuedDate:'2026-08-01', dueDate:'2026-08-05', notes:'August membership', voided:false }
  ];
  const SEED_PAYMENTS = [
    { id:'pay1', invoiceId:'inv1', userId:'u1', amount:60, date:'2026-08-03', method:'card', notes:'' },
    { id:'pay2', invoiceId:'inv4', userId:'u5', amount:60, date:'2026-08-02', method:'transfer', notes:'' }
  ];

  // ---- Supabase field mapping (JS camelCase <-> Postgres snake_case) ----
  function invoiceToRow(i){
    return {
      id: (i.id && i.id.length === 36) ? i.id : undefined,
      user_id: i.userId, amount: i.amount, type: i.type,
      issued_date: i.issuedDate, due_date: i.dueDate || null,
      notes: i.notes, voided: !!i.voided, status: i.status || 'unpaid'
    };
  }
  function rowToInvoice(r){
    return {
      id: r.id, userId: r.user_id, amount: r.amount, type: r.type,
      issuedDate: r.issued_date, dueDate: r.due_date||'',
      notes: r.notes||'', voided: !!r.voided, status: r.status
    };
  }
  function paymentToRow(p){
    return {
      id: (p.id && p.id.length === 36) ? p.id : undefined,
      invoice_id: p.invoiceId, user_id: p.userId, amount: p.amount,
      date: p.date, method: p.method, notes: p.notes
    };
  }
  function rowToPayment(r){
    return {
      id: r.id, invoiceId: r.invoice_id, userId: r.user_id,
      amount: r.amount, date: r.date, method: r.method, notes: r.notes||''
    };
  }

  async function migrateSeedInvoices(userIdMap){
    const idMap = {};
    for (const inv of SEED_INVOICES){
      const newUserId = userIdMap[inv.userId];
      if (!newUserId) continue;
      const row = invoiceToRow(inv);
      row.user_id = newUserId;
      delete row.id;
      const { data, error } = await bnbClient.from('invoices').insert([row]).select();
      if (error){ console.warn('Seed migration: invoice failed', inv.id, error); continue; }
      idMap[inv.id] = data[0].id;
    }
    return idMap;
  }
  async function migrateSeedPayments(userIdMap, invoiceIdMap){
    let ok = 0;
    for (const p of SEED_PAYMENTS){
      const newUserId = userIdMap[p.userId];
      const newInvoiceId = invoiceIdMap[p.invoiceId];
      if (!newUserId || !newInvoiceId) continue;
      const row = paymentToRow(p);
      row.user_id = newUserId; row.invoice_id = newInvoiceId;
      delete row.id;
      const { error } = await bnbClient.from('payments').insert([row]);
      if (!error) ok++;
    }
    return ok;
  }
  window.BNB_MIGRATE = window.BNB_MIGRATE || {};
  window.BNB_MIGRATE.invoices = migrateSeedInvoices;
  window.BNB_MIGRATE.payments = migrateSeedPayments;

  function loadInvoices(){
    // Instant first paint using seed data; real rows replace it once
    // Supabase responds (see refreshInvoicesFromSupabase below).
    return SEED_INVOICES.slice();
  }
  function loadPayments(){
    return SEED_PAYMENTS.slice();
  }

  async function refreshInvoicesFromSupabase(){
    const { data, error } = await bnbClient.from('invoices').select('*');
    if (error) { console.error('Supabase load invoices failed:', error); return; }
    if (data && data.length) {
      invoices = data.map(rowToInvoice);
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }
  async function refreshPaymentsFromSupabase(){
    const { data, error } = await bnbClient.from('payments').select('*');
    if (error) { console.error('Supabase load payments failed:', error); return; }
    if (data && data.length) {
      payments = data.map(rowToPayment);
      if (typeof renderAdmin === 'function') renderAdmin();
    }
  }

  function saveInvoices(){
    // Per-row upsert — see saveUsers() for why: a batch upsert fails
    // entirely if RLS blocks even one row in it.
    (async () => {
      const realRows = invoices.filter(i => i.id && i.id.length === 36);
      const rows = realRows.map(invoiceToRow);
      const results = await Promise.allSettled(
        rows.map(row => bnbClient.from('invoices').upsert([row]))
      );
      let successCount = 0;
      results.forEach((r, i) => {
        const failed = r.status === 'rejected' || (r.value && r.value.error);
        if (!failed) { successCount++; return; }
        console.warn('Supabase: could not save invoice', rows[i].id, r.status === 'rejected' ? r.reason : r.value.error);
      });
      if (successCount === 0 && rows.length > 0){
        alert('Could not save to database — check your connection or Supabase setup.');
      }
    })();
  }
  function savePayments(){
    (async () => {
      const realRows = payments.filter(p => p.id && p.id.length === 36);
      const rows = realRows.map(paymentToRow);
      const results = await Promise.allSettled(
        rows.map(row => bnbClient.from('payments').upsert([row]))
      );
      let successCount = 0;
      results.forEach((r, i) => {
        const failed = r.status === 'rejected' || (r.value && r.value.error);
        if (!failed) { successCount++; return; }
        console.warn('Supabase: could not save payment', rows[i].id, r.status === 'rejected' ? r.reason : r.value.error);
      });
      if (successCount === 0 && rows.length > 0){
        alert('Could not save to database — check your connection or Supabase setup.');
      }
    })();
  }

  let invoices = loadInvoices();
  refreshInvoicesFromSupabase(); // async — replaces seed data once Supabase responds
  let payments = loadPayments();
  refreshPaymentsFromSupabase(); // async — replaces seed data once Supabase responds

  const TYPE_LABELS = { membership:'Membership', 'pt-session':'1-on-1 Session', comp:'Comp / Adjustment (credit)', adjustment:'Adjustment / Fee', package:'Session Package' };
  const METHOD_LABELS = { cash:'Cash', card:'Card', transfer:'Bank Transfer', comp:'Comp / Waived' };

  /* ---------------- MEMBER ROSTER (reads the real Users CRUD store, same pattern as Schedule) ---------------- */
  function getBillMembers(){
    if (window.BNB_USERS) return window.BNB_USERS.getMembers().map(u=>({ id:u.id, name:u.fullName }));
    return [];
  }
  function memberName(id){
    if (window.BNB_USERS){ const n = window.BNB_USERS.getName(id); if (n) return n; }
    return 'Unknown Member';
  }
  function money(n){
    const v = Math.round((n||0) * 100) / 100;
    const sign = v < 0 ? '-' : '';
    return sign + '$' + Math.abs(v).toFixed(2);
  }

  /* ---------------- DERIVED CALCULATIONS ---------------- */
  function paidTowardInvoice(invId){
    return payments.filter(p=> p.invoiceId===invId).reduce((sum,p)=> sum + Number(p.amount||0), 0);
  }
  function invoiceStatus(inv){
    if (inv.voided) return 'void';
    const paid = paidTowardInvoice(inv.id);
    if (paid >= inv.amount) return 'paid';
    if (inv.dueDate < TODAY) return 'overdue';
    return 'unpaid';
  }
  function invoicesForUser(userId){
    return invoices.filter(i=> i.userId===userId).sort((a,b)=> a.issuedDate < b.issuedDate ? 1 : -1);
  }
  function paymentsForUser(userId){
    return payments.filter(p=> p.userId===userId).sort((a,b)=> a.date < b.date ? 1 : -1);
  }
  function userBalance(userId){
    return invoicesForUser(userId).reduce((sum,inv)=>{
      if (inv.voided) return sum;
      const remaining = inv.amount - paidTowardInvoice(inv.id);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);
  }
  // Recompute every member's balance from the invoice/payment log and push it into
  // the Users CRUD store, so Admin > Users always reflects what's logged here rather
  // than a hand-typed number that can drift.
  function syncAllBalances(){
    if (!window.BNB_USERS) return;
    const seen = {};
    invoices.forEach(inv=> seen[inv.userId] = true);
    Object.keys(seen).forEach(uid=> window.BNB_USERS.setBalance(uid, userBalance(uid)));
  }

  function statusPillHtml(status){
    // .sched-scope only defines pill color classes for: confirmed/active/open/scheduled (green),
    // waitlisted/pending (yellow), cancelled/no-show/blocked/archived (red), booked (grey).
    // Map billing's own status vocabulary onto those rather than introducing new ones.
    const cls = status==='paid' ? 'active' : status==='overdue' ? 'cancelled' : status==='void' ? 'booked' : 'pending';
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return '<span class="status-pill ' + cls + '">' + label + '</span>';
  }

  function showToast(msg){
    const el = document.getElementById('t-toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._billTimer);
    el._billTimer = setTimeout(()=> el.classList.remove('show'), 2200);
  }

  /* ---------------- STATE ---------------- */
  // Shares the same "who am I" identity as the Schedule module's member view, so
  // switching identity there also carries over here.
  let currentView = (function(){ try { return localStorage.getItem('bnb-billing-view') || 'member'; } catch(e){ return 'member'; } })();
  let selfMemberId = (function(){
    // Prefer the real logged-in identity (Supabase Auth) if they're a
    // member; falls back to the old manual "Viewing as" selection for
    // staff previewing a member, or guests before anyone logs in.
    var real = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (real && real.roles && real.roles.indexOf('member') !== -1) return real.id;
    try { return localStorage.getItem('bnb-sched-self-member') || (getBillMembers()[0]||{}).id; }
    catch(e){ return (getBillMembers()[0]||{}).id; }
  })();
  let memberFilter = 'all';
  let statusFilter = 'all';
  let editingInvoiceId = null;
  let payingInvoiceId = null;
  let statementUserId = null;

  function setView(v){
    currentView = v;
    try { localStorage.setItem('bnb-billing-view', v); } catch(e){}
    document.querySelectorAll('#bill-view-switch button').forEach(b=> b.classList.toggle('active', b.getAttribute('data-view')===v));
    renderIdentityRow();
    renderBody();
  }

  function renderIdentityRow(){
    const row = document.getElementById('bill-identity-row');
    if (!row) return;
    if (currentView === 'member'){
      row.innerHTML = '<label>Viewing as</label><select id="bill-self-member"></select>';
      const sel = document.getElementById('bill-self-member');
      getBillMembers().forEach(m=>{ const o = document.createElement('option'); o.value=m.id; o.textContent=m.name; sel.appendChild(o); });
      sel.value = selfMemberId;
      sel.addEventListener('change', ()=>{ selfMemberId = sel.value; try{ localStorage.setItem('bnb-sched-self-member', selfMemberId); }catch(e){} renderBody(); });
    } else {
      row.innerHTML = '<label>Role</label><span class="status-pill confirmed">Full Admin Access</span>';
    }
  }

  function renderBody(){
    const body = document.getElementById('bill-view-body');
    if (!body) return;
    body.innerHTML = currentView === 'member' ? memberViewHtml() : adminViewHtml();
    wireBody();
  }

  /* ============================================================
     MEMBER VIEW — read-only statement for whoever's selected above
     ============================================================ */
  function memberViewHtml(){
    const uid = selfMemberId;
    if (!uid) return '<p class="field-hint">No members found.</p>';
    const bal = userBalance(uid);
    const inv = invoicesForUser(uid);
    const pay = paymentsForUser(uid);
    let html = '<div class="weight-card" style="margin-bottom:20px;">';
    html += '<h3>Current Balance</h3>';
    html += '<div style="font-family:\'Oswald\',sans-serif; font-size:32px; margin:8px 0;" class="' + (bal>0?'balance-neg':'') + '">' + money(bal) + '</div>';
    html += bal > 0 ? '<div class="field-hint">This is the total owed across unpaid and overdue invoices below.</div>' : '<div class="field-hint">No balance owed.</div>';
    html += '</div>';

    html += '<h3 style="font-family:\'Oswald\',sans-serif;text-transform:uppercase;letter-spacing:0.03em;font-size:15px;color:var(--text);margin-bottom:12px;">Invoices</h3>';
    if (!inv.length){
      html += '<div class="weight-chart-empty">No invoices on file.</div>';
    } else {
      html += '<table class="weight-history-table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead><tbody>';
      inv.forEach(i=>{
        html += '<tr><td>' + i.issuedDate + '</td><td>' + (TYPE_LABELS[i.type]||i.type) + '</td><td class="mono">' + money(i.amount) + '</td><td>' + i.dueDate + '</td><td>' + statusPillHtml(invoiceStatus(i)) + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    html += '<h3 style="font-family:\'Oswald\',sans-serif;text-transform:uppercase;letter-spacing:0.03em;font-size:15px;color:var(--text);margin:22px 0 12px;">Payment History</h3>';
    if (!pay.length){
      html += '<div class="weight-chart-empty">No payments logged yet.</div>';
    } else {
      html += '<table class="weight-history-table"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Notes</th></tr></thead><tbody>';
      pay.forEach(p=>{
        html += '<tr><td>' + p.date + '</td><td class="mono">' + money(p.amount) + '</td><td>' + (METHOD_LABELS[p.method]||p.method) + '</td><td>' + escapeHtml(p.notes||'') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    return html;
  }

  /* ============================================================
     ADMIN VIEW
     ============================================================ */
  function adminViewHtml(){
    let html = '<div class="form-inline" style="margin-bottom:16px; display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">';
    html += '<button class="btn2 primary" id="bill-add-invoice-btn" type="button">+ Add Invoice</button>';
    html += '<div class="field" style="margin-bottom:0;"><label>Member</label><select id="bill-filter-member"><option value="all">All members</option>';
    getBillMembers().forEach(m=> html += '<option value="' + m.id + '"' + (memberFilter===m.id?' selected':'') + '>' + escapeHtml(m.name) + '</option>');
    html += '</select></div>';
    html += '<div class="field" style="margin-bottom:0;"><label>Status</label><select id="bill-filter-status">';
    ['all','unpaid','overdue','paid','void'].forEach(s=> html += '<option value="' + s + '"' + (statusFilter===s?' selected':'') + '>' + (s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)) + '</option>');
    html += '</select></div>';
    html += '</div>';

    let list = invoices.slice();
    if (memberFilter !== 'all') list = list.filter(i=> i.userId === memberFilter);
    if (statusFilter !== 'all') list = list.filter(i=> invoiceStatus(i) === statusFilter);
    list.sort((a,b)=> a.issuedDate < b.issuedDate ? 1 : -1);

    if (!list.length){
      html += '<div class="weight-chart-empty">No invoices match that filter.</div>';
      return html;
    }

    html += '<table class="admin-table"><thead><tr><th>Member</th><th>Type</th><th>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>';
    list.forEach(i=>{
      const st = invoiceStatus(i);
      html += '<tr>';
      html += '<td>' + escapeHtml(memberName(i.userId)) + '</td>';
      html += '<td>' + (TYPE_LABELS[i.type]||i.type) + '</td>';
      html += '<td class="mono">' + money(i.amount) + '</td>';
      html += '<td>' + i.issuedDate + '</td>';
      html += '<td>' + i.dueDate + '</td>';
      html += '<td>' + statusPillHtml(st) + '</td>';
      html += '<td class="row-actions">';
      if (st !== 'paid' && st !== 'void') html += '<button data-action="pay" data-id="' + i.id + '">Log Payment</button>';
      html += '<button data-action="statement" data-id="' + i.userId + '">Statement</button>';
      html += '<button data-action="edit" data-id="' + i.id + '">Edit</button>';
      if (!i.voided) html += '<button data-action="void" data-id="' + i.id + '">Void</button>';
      html += '<button data-action="delete" class="del" data-id="' + i.id + '">Delete</button>';
      html += '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function wireBody(){
    const addBtn = document.getElementById('bill-add-invoice-btn');
    if (addBtn) addBtn.addEventListener('click', ()=> openInvoicePanel(null));
    const memFilter = document.getElementById('bill-filter-member');
    if (memFilter) memFilter.addEventListener('change', ()=>{ memberFilter = memFilter.value; renderBody(); });
    const stFilter = document.getElementById('bill-filter-status');
    if (stFilter) stFilter.addEventListener('change', ()=>{ statusFilter = stFilter.value; renderBody(); });

    const body = document.getElementById('bill-view-body');
    if (!body) return;
    body.addEventListener('click', bodyClickHandler);
  }
  function bodyClickHandler(e){
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const action = btn.getAttribute('data-action'), id = btn.getAttribute('data-id');
    if (action === 'edit') openInvoicePanel(id);
    else if (action === 'pay') openPaymentPanel(id);
    else if (action === 'statement') openStatement(id);
    else if (action === 'void') voidInvoice(id);
    else if (action === 'delete') deleteInvoice(id);
  }

  /* ---------------- INVOICE PANEL ---------------- */
  function openInvoicePanel(id){
    editingInvoiceId = id;
    const inv = id ? invoices.find(i=> i.id===id) : null;
    document.getElementById('bill-invoice-panel-title').textContent = inv ? 'Edit Invoice' : 'Add Invoice';
    const memSel = document.getElementById('bill-inv-member');
    memSel.innerHTML = '';
    getBillMembers().forEach(m=>{ const o = document.createElement('option'); o.value=m.id; o.textContent=m.name; memSel.appendChild(o); });
    memSel.value = inv ? inv.userId : (getBillMembers()[0]||{}).id;
    document.getElementById('bill-inv-type').value = inv ? inv.type : 'membership';
    document.getElementById('bill-inv-amount').value = inv ? inv.amount : '';
    document.getElementById('bill-inv-issued').value = inv ? inv.issuedDate : TODAY;
    document.getElementById('bill-inv-due').value = inv ? inv.dueDate : TODAY;
    document.getElementById('bill-inv-notes').value = inv ? (inv.notes||'') : '';
    document.getElementById('bill-invoice-panel-backdrop').classList.add('show');
  }
  function closeInvoicePanel(){ document.getElementById('bill-invoice-panel-backdrop').classList.remove('show'); editingInvoiceId = null; }
  function saveInvoice(){
    const userId = document.getElementById('bill-inv-member').value;
    const amount = Number(document.getElementById('bill-inv-amount').value);
    if (!userId || !amount || amount <= 0){ alert('Pick a member and enter an amount greater than 0.'); return; }
    const data = {
      userId: userId,
      type: document.getElementById('bill-inv-type').value,
      amount: Math.round(amount * 100) / 100,
      issuedDate: document.getElementById('bill-inv-issued').value || TODAY,
      dueDate: document.getElementById('bill-inv-due').value || TODAY,
      notes: document.getElementById('bill-inv-notes').value.trim(),
      voided: false
    };
    if (editingInvoiceId){
      const idx = invoices.findIndex(i=> i.id===editingInvoiceId);
      if (idx !== -1) invoices[idx] = Object.assign({id: editingInvoiceId, voided: invoices[idx].voided}, data);
    } else {
      data.id = window.BNB_UUID();
      invoices.push(data);
    }
    saveInvoices();
    syncAllBalances();
    closeInvoicePanel();
    showToast('Invoice saved');
    renderBody();
  }
  function voidInvoice(id){
    if (!confirm('Void this invoice? It will no longer count toward the member\'s balance.')) return;
    const idx = invoices.findIndex(i=> i.id===id);
    if (idx === -1) return;
    invoices[idx].voided = true;
    saveInvoices();
    syncAllBalances();
    showToast('Invoice voided');
    renderBody();
  }
  function deleteInvoice(id){
    if (!confirm('Delete this invoice and any payments logged against it? This cannot be undone.')) return;
    invoices = invoices.filter(i=> i.id !== id);
    payments = payments.filter(p=> p.invoiceId !== id);
    saveInvoices(); savePayments();
    syncAllBalances();
    showToast('Invoice deleted');
    renderBody();
  }

  /* ---------------- PAYMENT PANEL ---------------- */
  function openPaymentPanel(invoiceId){
    payingInvoiceId = invoiceId;
    const inv = invoices.find(i=> i.id===invoiceId);
    if (!inv) return;
    const remaining = inv.amount - paidTowardInvoice(inv.id);
    document.getElementById('bill-pay-invoice-summary').textContent =
      memberName(inv.userId) + ' — ' + (TYPE_LABELS[inv.type]||inv.type) + ' — ' + money(inv.amount) + ' invoice, ' + money(remaining) + ' remaining';
    document.getElementById('bill-pay-amount').value = remaining > 0 ? remaining : '';
    document.getElementById('bill-pay-date').value = TODAY;
    document.getElementById('bill-pay-method').value = 'cash';
    document.getElementById('bill-pay-notes').value = '';
    document.getElementById('bill-payment-panel-backdrop').classList.add('show');
  }
  function closePaymentPanel(){ document.getElementById('bill-payment-panel-backdrop').classList.remove('show'); payingInvoiceId = null; }
  function savePayment(){
    const inv = invoices.find(i=> i.id===payingInvoiceId);
    if (!inv) return;
    const amount = Number(document.getElementById('bill-pay-amount').value);
    if (!amount || amount <= 0){ alert('Enter a payment amount greater than 0.'); return; }
    payments.push({
      id: window.BNB_UUID(),
      invoiceId: inv.id,
      userId: inv.userId,
      amount: Math.round(amount * 100) / 100,
      date: document.getElementById('bill-pay-date').value || TODAY,
      method: document.getElementById('bill-pay-method').value,
      notes: document.getElementById('bill-pay-notes').value.trim()
    });
    savePayments();
    syncAllBalances();

    // Session Package invoices carry a credits count. The moment one crosses
    // fully-paid (which may take more than one partial payment), award the
    // credits — but only once, ever, per invoice, tracked by creditsAwarded.
    let creditMsg = '';
    if (inv.type === 'package' && inv.credits && !inv.creditsAwarded && invoiceStatus(inv) === 'paid'){
      if (window.BNB_USERS && window.BNB_USERS.addCredits(inv.userId, inv.credits)){
        inv.creditsAwarded = true;
        saveInvoices();
        creditMsg = ' — ' + inv.credits + ' credit' + (inv.credits===1?'':'s') + ' added to ' + memberName(inv.userId);
      }
    }

    closePaymentPanel();
    showToast('Payment logged' + creditMsg);
    renderBody();
  }

  /* ---------------- STATEMENT PANEL ---------------- */
  function openStatement(userId){
    statementUserId = userId;
    document.getElementById('bill-statement-title').textContent = memberName(userId) + ' — Statement';
    document.getElementById('bill-statement-body').innerHTML = statementHtml(userId);
    document.getElementById('bill-statement-panel-backdrop').classList.add('show');
  }
  function statementHtml(userId){
    const bal = userBalance(userId);
    const inv = invoicesForUser(userId);
    const pay = paymentsForUser(userId);
    let html = '<div class="field-hint" style="margin-bottom:14px;">Balance: <b class="mono ' + (bal>0?'balance-neg':'') + '">' + money(bal) + '</b></div>';
    html += '<h3 style="font-size:12.5px;">Invoices</h3>';
    if (!inv.length) html += '<div class="weight-chart-empty">None.</div>';
    else {
      html += '<table class="weight-history-table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
      inv.forEach(i=> html += '<tr><td>' + i.issuedDate + '</td><td>' + (TYPE_LABELS[i.type]||i.type) + '</td><td class="mono">' + money(i.amount) + '</td><td>' + statusPillHtml(invoiceStatus(i)) + '</td></tr>');
      html += '</tbody></table>';
    }
    html += '<h3 style="font-size:12.5px;margin-top:16px;">Payments</h3>';
    if (!pay.length) html += '<div class="weight-chart-empty">None.</div>';
    else {
      html += '<table class="weight-history-table"><thead><tr><th>Date</th><th>Amount</th><th>Method</th></tr></thead><tbody>';
      pay.forEach(p=> html += '<tr><td>' + p.date + '</td><td class="mono">' + money(p.amount) + '</td><td>' + (METHOD_LABELS[p.method]||p.method) + '</td></tr>');
      html += '</tbody></table>';
    }
    return html;
  }
  function closeStatement(){ document.getElementById('bill-statement-panel-backdrop').classList.remove('show'); statementUserId = null; }
  function exportStatement(){
    if (!statementUserId) return;
    const data = { member: memberName(statementUserId), balance: userBalance(statementUserId), invoices: invoicesForUser(statementUserId), payments: paymentsForUser(statementUserId) };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'statement-' + statementUserId + '.json'; a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------- WIRING ---------------- */
  document.getElementById('bill-view-switch').querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=> setView(btn.getAttribute('data-view')));
  });
  document.getElementById('bill-inv-cancel').addEventListener('click', closeInvoicePanel);
  document.getElementById('bill-inv-save').addEventListener('click', saveInvoice);
  document.getElementById('bill-invoice-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='bill-invoice-panel-backdrop') closeInvoicePanel(); });

  document.getElementById('bill-pay-cancel').addEventListener('click', closePaymentPanel);
  document.getElementById('bill-pay-save').addEventListener('click', savePayment);
  document.getElementById('bill-payment-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='bill-payment-panel-backdrop') closePaymentPanel(); });

  document.getElementById('bill-statement-close').addEventListener('click', closeStatement);
  document.getElementById('bill-statement-print').addEventListener('click', ()=> window.print());
  document.getElementById('bill-statement-export').addEventListener('click', exportStatement);
  document.getElementById('bill-statement-panel-backdrop').addEventListener('click', (e)=>{ if (e.target.id==='bill-statement-panel-backdrop') closeStatement(); });

  // Cross-module invoice creation, same pattern as window.BNB_USERS /
  // window.BNB_PRODUCTS — lets Shop's package checkout create a real
  // unpaid invoice through the same engine Billing itself uses, rather
  // than poking the invoices store directly from another module.
  window.BNB_BILLING = {
    createInvoice: function(data){
      const inv = {
        id: window.BNB_UUID(),
        userId: data.userId,
        amount: Number(data.amount) || 0,
        type: data.type || 'adjustment',
        issuedDate: TODAY,
        dueDate: data.dueDate || TODAY,
        notes: data.notes || '',
        voided: false
      };
      if (data.credits) { inv.credits = Number(data.credits); inv.creditsAwarded = false; }
      if (data.productId) inv.productId = data.productId;
      invoices.push(inv);
      saveInvoices();
      syncAllBalances();
      if (typeof renderBody === 'function') renderBody();
      return inv;
    },
    // Read-only cross-module lookup — used by the Coach Dashboard to flag
    // unpaid/overdue invoices among a trainer's own clients without Billing
    // needing to know anything about trainers or rosters itself.
    getOutstandingForUsers: function(userIds){
      const idSet = {};
      (userIds||[]).forEach(function(id){ idSet[id] = true; });
      return invoices.filter(function(inv){
        if (!idSet[inv.userId]) return false;
        const st = invoiceStatus(inv);
        return st === 'unpaid' || st === 'overdue';
      }).map(function(inv){
        return { id: inv.id, userId: inv.userId, amount: inv.amount, status: invoiceStatus(inv), dueDate: inv.dueDate, type: inv.type };
      });
    }
  };

  /* ---------------- INIT ---------------- */
  syncAllBalances();
  renderIdentityRow();
  renderBody();

})();
