(function(){

  // Staff portal (staff.html): sends each person to their part once we know
  // who they are. Signed out: the sign-in screen (it's on this page too).
  // Admins: Admin (and Coach). Coaches and staff: Coach. Anyone else gets a
  // short "staff only" note with a link back to the main site. A front door
  // tablet account goes to the kiosk, as on the main site.
  //
  // A link with a #tab (e.g. staff.html#billing) opens that tab instead;
  // the shell's own hash restore handles it.

  const STAFF = ['admin', 'trainer', 'staff'];
  let routedFor = undefined;

  function me(){ return window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf(); }
  function hashTab(){ return (location.hash || '').replace(/^#/, '').split(':')[0]; }

  function route(){
    const m = me();
    const key = m ? m.id + '|' + (m.roles || []).join(',') : null;
    if (key === routedFor) return;
    routedFor = key;
    const adminBtn = document.getElementById('nav-admin-btn');
    if (!m){
      if (adminBtn) adminBtn.hidden = true;
      if (typeof window.switchSite === 'function') window.switchSite('users');
      return;
    }
    const roles = m.roles || [];
    if (roles.length && roles.every(r => r === 'kiosk')){ location.href = 'kiosk.html'; return; }
    const admin = roles.includes('admin');
    const staff = roles.some(r => STAFF.includes(r));
    if (adminBtn) adminBtn.hidden = !admin;
    if (typeof window.switchSite === 'function') window.switchSite('gym');
    if (!staff){ window.switchTab('staff-only'); return; }
    // A deep link (e.g. #billing, #coach:roster) wins if it names a tab on this page.
    const want = hashTab();
    if (want && (document.getElementById('tab-' + want) || want === 'admin' || want === 'coach')){ window.switchTab(want); return; }
    window.switchTab(admin ? 'admin' : 'coach');
  }

  document.addEventListener('bnb-auth-changed', () => setTimeout(route, 0));
  // No saved session: nobody announces "signed out" on load, so check once things have settled.
  window.addEventListener('load', () => setTimeout(route, 1500));
})();
