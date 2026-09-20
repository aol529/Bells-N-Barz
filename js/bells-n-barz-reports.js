(function(){
  const root = document.getElementById('reports-body');
  if (!root) return; // Reports not present on this page

  // Computed from the local system clock (not toISOString(), which can
  // shift a day depending on timezone) so "today" is genuinely today —
  // same approach used by every other module in this app.
  const TODAY = (function(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })();

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function money(n){
    const v = Math.round((n||0) * 100) / 100;
    const sign = v < 0 ? '-' : '';
    return sign + '$' + Math.abs(v).toFixed(2);
  }
  function daysBetween(d1, d2){
    const a = new Date(d1 + 'T00:00:00'), b = new Date(d2 + 'T00:00:00');
    return Math.round((a - b) / 86400000);
  }
  function addDays(iso, n){
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function fmtShort(iso){
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }

  /* ---------------- SVG CHART BUILDERS (copied from booking-coach.js's
     svgLineChart/svgBarChart — same per-module duplication convention
     used throughout this codebase; both return a string, unlike the
     tracker modules' buildChart(), since this page has several charts
     rather than one fixed DOM node) ---------------- */
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
      svg += '<text class="axis-label" x="'+xAt(i).toFixed(1)+'" y="'+(H-padB+18)+'" text-anchor="middle">'+esc(points[i].label)+'</text>';
    });
    if (points.length>1){
      let d='';
      points.forEach((p,i)=>{ d += (i===0?'M':'L')+xAt(i).toFixed(1)+','+yAt(p.value).toFixed(1)+' '; });
      svg += '<path class="data-line" d="'+d+'"/>';
    }
    points.forEach((p,i)=>{
      svg += '<circle class="data-dot" cx="'+xAt(i).toFixed(1)+'" cy="'+yAt(p.value).toFixed(1)+'" r="4"><title>'+esc(p.label)+': '+p.value+'</title></circle>';
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
      svg += '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+barH.toFixed(1)+'" fill="var(--accent)" rx="2"><title>'+esc(labels[i])+': '+v+'</title></rect>';
      svg += '<text class="axis-label" x="'+(x+barW/2).toFixed(1)+'" y="'+(H-padB+18)+'" text-anchor="middle">'+esc(labels[i])+'</text>';
    });
    return '<svg class="weight-chart-svg" viewBox="0 0 '+W+' '+H+'">'+svg+'</svg>';
  }

  /* ---------------- REVENUE ---------------- */
  // Status is derived, not stored — same logic as invoiceStatus()/
  // paidTowardInvoice() in billing.js, duplicated here since billing.js
  // doesn't export them.
  function paidTowardInvoice(payments, invId){
    return payments.filter(p=>p.invoiceId===invId).reduce((s,p)=>s+Number(p.amount||0),0);
  }
  function invoiceStatus(inv, payments){
    if (inv.voided) return 'void';
    const paid = paidTowardInvoice(payments, inv.id);
    if (paid >= inv.amount) return 'paid';
    if (inv.dueDate && inv.dueDate < TODAY) return 'overdue';
    return 'unpaid';
  }
  function last6MonthKeys(){
    const keys = [];
    const base = new Date(TODAY + 'T00:00:00'); base.setDate(1);
    for (let i = 5; i >= 0; i--){
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      keys.push(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'));
    }
    return keys;
  }
  function monthLabel(key){
    const [y,m] = key.split('-');
    return new Date(Number(y), Number(m)-1, 1).toLocaleDateString(undefined, {month:'short'});
  }
  const TYPE_LABELS = { membership:'Membership', 'pt-session':'1-on-1 Session', comp:'Comp / Adjustment', adjustment:'Adjustment / Fee', package:'Session Package' };

  function revenueSectionHtml(invoices, payments){
    const monthKeys = last6MonthKeys();
    const revenueByMonth = monthKeys.map(k => payments.filter(p => p.date && p.date.slice(0,7) === k).reduce((s,p) => s + Number(p.amount||0), 0));
    const monthLabels = monthKeys.map(monthLabel);
    const thisMonthKey = TODAY.slice(0,7);
    const revenueThisMonth = payments.filter(p => p.date && p.date.slice(0,7) === thisMonthKey).reduce((s,p) => s + Number(p.amount||0), 0);

    const outstanding = invoices.reduce((sum, inv) => {
      if (inv.voided) return sum;
      const st = invoiceStatus(inv, payments);
      if (st !== 'unpaid' && st !== 'overdue') return sum;
      const remaining = inv.amount - paidTowardInvoice(payments, inv.id);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    const windowStart = monthKeys[0] + '-01';
    const byType = {};
    payments.forEach(p => {
      if (!p.date || p.date < windowStart) return;
      const inv = invoices.find(i => i.id === p.invoiceId);
      const type = inv ? inv.type : 'other';
      byType[type] = (byType[type] || 0) + Number(p.amount||0);
    });
    const typeKeys = Object.keys(byType).sort((a,b) => byType[b] - byType[a]);

    return `
      <div class="day-head"><h2>Revenue</h2></div>
      <div class="weight-stats" style="display:grid;">
        <div class="weight-stat"><span class="lbl">Collected This Month</span><span class="val">${money(revenueThisMonth)}</span></div>
        <div class="weight-stat"><span class="lbl">Outstanding Balance</span><span class="val">${money(outstanding)}</span></div>
      </div>
      <div class="weight-chart-card" style="margin-top:22px;">
        <h3>Revenue by Month</h3>
        ${svgBarChart(revenueByMonth.map(v => Math.round(v)), monthLabels)}
      </div>
      <div class="weight-history" style="margin-top:22px;">
        <h3 style="font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.03em;font-size:15px;color:var(--text);margin-bottom:12px;">Revenue by Type (last 6 months)</h3>
        <table class="weight-history-table">
          <thead><tr><th>Type</th><th>Amount</th></tr></thead>
          <tbody>${typeKeys.length ? typeKeys.map(t => `<tr><td>${esc(TYPE_LABELS[t] || t)}</td><td class="mono">${money(byType[t])}</td></tr>`).join('') : '<tr><td colspan="2">No revenue in this window.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  /* ---------------- ATTENDANCE ---------------- */
  function weekStart(dateIso){
    const d = new Date(dateIso + 'T00:00:00');
    const day = d.getDay(); // 0=Sun..6=Sat
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); // back to Monday
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function last8WeekStarts(){
    const thisWeek = weekStart(TODAY);
    const weeks = [];
    for (let i = 7; i >= 0; i--) weeks.push(addDays(thisWeek, -7*i));
    return weeks;
  }

  function attendanceSectionHtml(checkins, bookings, sessions, ptBookings, slots){
    const weeks = last8WeekStarts();
    const checkinsByWeek = weeks.map(wk => checkins.filter(c => weekStart(c.date) === wk).length);
    const points = weeks.map((wk,i) => ({ label: fmtShort(wk), value: checkinsByWeek[i] }));

    const cutoff30 = addDays(TODAY, -30);
    const sessionsById = {}; sessions.forEach(s => sessionsById[s.id] = s);
    const recentBookings = bookings.filter(b => { const s = sessionsById[b.sessionId]; return s && s.date >= cutoff30 && s.date <= TODAY; });
    const noShows = recentBookings.filter(b => b.status === 'no-show').length;
    const classesBooked = recentBookings.length;
    const noShowRate = classesBooked ? Math.round((noShows / classesBooked) * 100) : 0;

    const slotsById = {}; slots.forEach(s => slotsById[s.id] = s);
    const ptCompleted = ptBookings.filter(p => {
      const sl = slotsById[p.slotId];
      return sl && sl.date >= cutoff30 && sl.date <= TODAY && p.status === 'confirmed';
    }).length;

    return `
      <div class="day-head" style="margin-top:32px;"><h2>Attendance</h2></div>
      <div class="weight-chart-card">
        <h3>Check-Ins per Week (last 8 weeks)</h3>
        ${points.some(p => p.value > 0) ? svgLineChart(points) : '<div class="empty-msg">No check-ins logged yet.</div>'}
      </div>
      <div class="weight-stats" style="display:grid;margin-top:22px;">
        <div class="weight-stat"><span class="lbl">Classes Booked (30d)</span><span class="val">${classesBooked}</span></div>
        <div class="weight-stat"><span class="lbl">No-Show Rate (30d)</span><span class="val">${noShowRate}%</span></div>
        <div class="weight-stat"><span class="lbl">PT Sessions Completed (30d)</span><span class="val">${ptCompleted}</span></div>
      </div>
    `;
  }

  /* ---------------- RETENTION ---------------- */
  const MSTATUS_LABELS = { active:'Active', hold:'Hold', overdue:'Overdue', cancelled:'Cancelled', pending:'Pending' };

  function retentionSectionHtml(members, checkins){
    const counts = {};
    members.forEach(m => { const k = m.mstatus || 'unknown'; counts[k] = (counts[k]||0) + 1; });
    const statusKeys = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);

    const lastCheckinByUser = {};
    checkins.forEach(c => { if (!lastCheckinByUser[c.userId] || c.date > lastCheckinByUser[c.userId]) lastCheckinByUser[c.userId] = c.date; });

    const atRisk = members
      .map(m => { const last = lastCheckinByUser[m.id]; return { m, days: last ? daysBetween(TODAY, last) : null }; })
      .filter(x => x.days === null || x.days >= 14)
      .sort((a,b) => (b.days ?? 9999) - (a.days ?? 9999))
      .slice(0, 10);

    const cutoffAhead = addDays(TODAY, 30);
    const expiring = members
      .filter(m => m.contractEnd && m.contractEnd >= TODAY && m.contractEnd <= cutoffAhead)
      .sort((a,b) => a.contractEnd < b.contractEnd ? -1 : 1)
      .slice(0, 10);

    return `
      <div class="day-head" style="margin-top:32px;"><h2>Retention</h2></div>
      <div class="weight-chart-card">
        <h3>Members by Status</h3>
        ${statusKeys.length ? svgBarChart(statusKeys.map(k => counts[k]), statusKeys.map(k => MSTATUS_LABELS[k] || k)) : '<div class="empty-msg">No members yet.</div>'}
      </div>
      <div class="weight-history" style="margin-top:22px;">
        <h3 style="font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.03em;font-size:15px;color:var(--text);margin-bottom:12px;">At Risk — No Check-In in 14+ Days</h3>
        <table class="weight-history-table">
          <thead><tr><th>Member</th><th>Last Check-In</th></tr></thead>
          <tbody>${atRisk.length ? atRisk.map(x => `<tr><td>${esc(x.m.fullName)}</td><td class="mono">${x.days === null ? 'Never' : x.days + 'd ago'}</td></tr>`).join('') : '<tr><td colspan="2">No members at risk.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="weight-history" style="margin-top:22px;">
        <h3 style="font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.03em;font-size:15px;color:var(--text);margin-bottom:12px;">Contracts Expiring in 30 Days</h3>
        <table class="weight-history-table">
          <thead><tr><th>Member</th><th>Contract End</th></tr></thead>
          <tbody>${expiring.length ? expiring.map(m => `<tr><td>${esc(m.fullName)}</td><td class="mono">${fmtShort(m.contractEnd)}</td></tr>`).join('') : '<tr><td colspan="2">Nothing expiring soon.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  /* ---------------- LOAD + RENDER ---------------- */
  async function render(){
    root.innerHTML = '<div class="empty-msg">Loading reports…</div>';

    const [invRes, payRes, ciRes, bkRes, csRes, ptRes, slRes] = await Promise.all([
      bnbClient.from('invoices').select('*'),
      bnbClient.from('payments').select('*'),
      bnbClient.from('checkins').select('*'),
      bnbClient.from('bookings').select('*'),
      bnbClient.from('class_sessions').select('*'),
      bnbClient.from('pt_bookings').select('*'),
      bnbClient.from('slots').select('*')
    ]);
    const errors = [invRes, payRes, ciRes, bkRes, csRes, ptRes, slRes].map(r => r.error).filter(Boolean);
    if (errors.length){
      errors.forEach(e => console.error('Supabase load failed (Reports):', e));
      root.innerHTML = '<div class="empty-msg">Could not load report data — check your connection and try again.</div>';
      return;
    }

    const invoices = invRes.data.map(r => ({ id:r.id, userId:r.user_id, amount:Number(r.amount||0), type:r.type, issuedDate:r.issued_date, dueDate:r.due_date, voided:!!r.voided }));
    const payments = payRes.data.map(r => ({ id:r.id, invoiceId:r.invoice_id, userId:r.user_id, amount:Number(r.amount||0), date:r.date }));
    const checkins = ciRes.data.map(r => ({ id:r.id, userId:r.user_id, date:r.date }));
    const bookings = bkRes.data.map(r => ({ id:r.id, sessionId:r.session_id, userId:r.user_id, status:r.status }));
    const sessions = csRes.data.map(r => ({ id:r.id, classId:r.class_id, date:r.date, status:r.status }));
    const ptBookings = ptRes.data.map(r => ({ id:r.id, slotId:r.slot_id, userId:r.user_id, status:r.status }));
    const slots = slRes.data.map(r => ({ id:r.id, date:r.date }));
    const members = (window.BNB_USERS && window.BNB_USERS.getMembers && window.BNB_USERS.getMembers()) || [];

    root.innerHTML =
      revenueSectionHtml(invoices, payments) +
      attendanceSectionHtml(checkins, bookings, sessions, ptBookings, slots) +
      retentionSectionHtml(members, checkins);
  }

  window.bnbReportsOnTabShown = render;
  render();
})();
