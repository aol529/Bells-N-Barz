/* ---------------- THEME TOGGLE ---------------- */
(function(){
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const label = document.getElementById('theme-toggle-label');
  const icon = document.getElementById('theme-toggle-icon');

  // 'dark' has no data-theme attribute at all (matches the CSS :root default),
  // so it's first in the cycle and also what an empty/missing attribute means.
  // 'red' and 'pink' are pickable here too, but also apply themselves
  // automatically on their own days regardless of what's saved (see
  // specialThemeForToday below) without overwriting that saved choice.
  const THEMES = ['dark', 'light', 'royal', 'red', 'pink', 'green', 'blue'];
  const THEME_META = {
    dark:  { icon: '☾', label: 'Dark' },
    light: { icon: '☀', label: 'Light' },
    royal: { icon: '♛', label: 'Royal' },
    red:   { icon: '❤', label: 'Red' },
    pink:  { icon: '🎗', label: 'Pink' },
    green: { icon: '❦', label: 'Green' },
    blue:  { icon: '◆', label: 'Blue' }
  };

  // Valentine's Day (Feb 14) and Mother's Day (2nd Sunday of May — the
  // convention most countries share; adjust here if this business observes
  // a different date, e.g. the UK's movable Mothering Sunday) go red.
  // World Breast Cancer Day (Oct 15, fixed every year) goes pink.
  function mothersDay(year){
    const d = new Date(year, 4, 1); // May 1
    const firstSunday = 1 + ((7 - d.getDay()) % 7);
    return new Date(year, 4, firstSunday + 7);
  }
  function specialThemeForToday(){
    const now = new Date();
    if (now.getMonth() === 1 && now.getDate() === 14) return 'red'; // Feb 14
    if (now.getMonth() === 9 && now.getDate() === 15) return 'pink'; // Oct 15
    const md = mothersDay(now.getFullYear());
    if (now.getMonth() === md.getMonth() && now.getDate() === md.getDate()) return 'red';
    return null;
  }

  function currentTheme(){
    return html.getAttribute('data-theme') || 'dark';
  }
  function applyTheme(theme, persist){
    if (theme === 'dark') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', theme);
    const meta = THEME_META[theme];
    label.textContent = meta.label;
    icon.textContent = meta.icon;
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    btn.setAttribute('aria-label', 'Switch to ' + THEME_META[next].label + ' theme');
    if (persist !== false){
      try { localStorage.setItem('bnb-theme', theme); } catch(e) { /* storage unavailable */ }
    }
  }

  // The seasonal theme is a display-only override for today's visit — it
  // never overwrites the member's saved preference, so it quietly goes back
  // to normal the day after without them having to switch back manually.
  const special = specialThemeForToday();
  applyTheme(special || currentTheme(), /* persist */ !special);

  btn.addEventListener('click', () => {
    const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
    applyTheme(next);
  });
})();

/* ---------------- RESPONSIVE TABLE WRAP ---------------- */
// Wrap every table in a scrollable container so wide tables on the appendix
// pages don't force horizontal overflow on narrow phone screens.
document.querySelectorAll('table').forEach(t => {
  if (t.parentElement && t.parentElement.classList.contains('table-scroll')) return;
  const wrap = document.createElement('div');
  wrap.className = 'table-scroll';
  t.parentNode.insertBefore(wrap, t);
  wrap.appendChild(t);
});

/* ---------------- OUTER SITE NAV ---------------- */
(function(){
  const links = document.querySelectorAll('.outer-link');
  const pages = document.querySelectorAll('.site-page');
  const toggle = document.getElementById('outer-nav-toggle');
  const nav = document.getElementById('outer-nav');

  function switchSite(key){
    // Blog/Gallery/Shop each have their own module — load it the first
    // time someone actually navigates there.
    const SITE_TO_MODULE = { blog: 'blog', gallery: 'gallery', shop: 'shop' };
    if (SITE_TO_MODULE[key] && typeof bnbLoadModule === 'function'){
      bnbLoadModule(SITE_TO_MODULE[key]).catch(err => console.error(err));
    }
    links.forEach(l => l.classList.toggle('active', l.dataset.site === key));
    pages.forEach(p => p.classList.toggle('active', p.id === 'site-' + key));
    // Shop always opens on its category cards (no-op until its module loads,
    // and a fresh load starts on the cards anyway).
    if (key === 'shop' && typeof window.bnbShopShowCards === 'function') window.bnbShopShowCards();
    nav.classList.remove('open');
    window.scrollTo({top:0, behavior:'smooth'});
  }
  window.switchSite = switchSite;
  links.forEach(l => l.addEventListener('click', () => switchSite(l.dataset.site)));
  document.querySelectorAll('[data-site-jump]').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (b.dataset.siteJump === 'gym'){
        // "Go to the Gym app" now drops straight into guest view — no
        // dialog in between. The entry gate is reserved for the reactive
        // case: clicking a members-only nav tab while signed out.
        switchSite('gym');
        if (typeof window.switchTab === 'function') window.switchTab('overview');
      } else {
        switchSite(b.dataset.siteJump);
        // e.g. Contacts > Session Packages: open that Shop category directly.
        if (b.dataset.shopFilter && typeof bnbLoadModule === 'function'){
          bnbLoadModule('shop').then(() => { if (window.bnbShopOpen) window.bnbShopOpen(b.dataset.shopFilter); }).catch(err => console.error(err));
        }
      }
    });
  });

  /* ---- Gym entry gate: login / sign up ----
     Deferred to DOMContentLoaded: the gate markup lives near the end of
     <body>, but this script block runs earlier (inline scripts execute as
     the parser reaches them), so the elements don't exist yet if we wire
     them up immediately here.
     No longer opened from "Go to the Gym app" — it now opens reactively
     when a signed-out visitor clicks a locked nav tab (MEMBER/COACH/
     BOOKING/ADMIN), via goToLoginPrompt() in the tab-switching script. */
  document.addEventListener('DOMContentLoaded', function(){
    function closeGate(){ document.getElementById('gate-backdrop').classList.remove('show'); }
    function enterGym(mode){
      // mode: 'login' | 'signup'
      closeGate();
      // Login and Sign Up both live on the separate "Members" page
      // (site-users), which has its own internal view switcher.
      switchSite('users');
      const modeBtn = document.querySelector(
        '#usr-mode-switch [data-mode="' + mode + '"]'  // 'login' or 'signup'
      );
      if (modeBtn) modeBtn.click();
    }
    // Also used by the Member preview page and the Tools calculators.
    window.bnbEnterGym = enterGym;
    document.getElementById('gate-login-btn').addEventListener('click', ()=> enterGym('login'));
    document.getElementById('gate-signup-btn').addEventListener('click', ()=> enterGym('signup'));
    document.getElementById('gate-close-btn').addEventListener('click', closeGate);
    document.getElementById('gate-backdrop').addEventListener('click', (e)=>{
      if (e.target.id === 'gate-backdrop') closeGate();
    });
  });
  toggle.addEventListener('click', ()=> nav.classList.toggle('open'));
})();

/* ---------------- TAB SWITCHING ---------------- */
const plates = document.querySelectorAll('.plate');
const tabLabels = {overview:'Overview', mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday', appendix:'Appendix', log:'Log', tools:'Tools', session:'Session Log', glance:'Exercise Glance', coach:'Coach', schedule:'Booking', billing:'Billing', me:'Me', accountability:'My Teams', messages:'Messages', reports:'Reports', switchboard:'Switchboard'};

/* ---------------- MANUAL SECTION HIGHLIGHT ---------------- */
// The top-level MANUAL button shares data-tab="overview" with the side-rack's own
// OVERVIEW plate, so the generic plates.forEach match below only lights it up when
// you're on Overview itself. Keep it lit for the whole Manual section (Overview,
// any weekday, Appendix, Glance) so the top pill still shows where you are.
const navManualBtn = document.getElementById('nav-manual-btn');
const manualTabs = ['overview','mon','tue','wed','thu','fri','sat','sun','appendix','glance'];

/* ---------------- MEMBER / ADMIN NESTED PAGES ---------------- */
// LIVE SESH/TIME/WEIGHT/TRACK live inside one MEMBER page (and BILLING inside
// one ADMIN page), each with its own flat, always-visible sub-tab row —
// same pattern as Coach's Program Builder/Roster/Live Session switcher —
// rather than a top-level pill per item or a hidden toggle-reveal.
const navMemberBtn = document.getElementById('nav-member-btn');
const navAdminBtn = document.getElementById('nav-admin-btn');
const memberSectionTabs = ['session','me','accountability','messages','schedule'];
const adminSectionTabs = ['billing', 'users', 'sessions', 'reports', 'switchboard'];
// Clicking the rack's MEMBER/ADMIN pill should land on that page's default
// sub-tab, not a page of its own — so 'member'/'admin' are aliases, resolved
// before anything else runs.
const TAB_ALIASES = { member: 'session', admin: 'billing' };
const NESTED_TAB_PARENT = { session: 'tab-member', me: 'tab-member', accountability: 'tab-member', messages: 'tab-member', schedule: 'tab-member', billing: 'tab-admin', users: 'tab-admin', sessions: 'tab-admin', reports: 'tab-admin', switchboard: 'tab-admin' };

/* ---------------- WEEKDAY DROPDOWN (phone-width stand-in for the Mon–Sun plates) ---------------- */
const weekdayDropdown = document.getElementById('weekday-dropdown');
const weekdayTabs = ['mon','tue','wed','thu','fri','sat','sun'];
if (weekdayDropdown){
  weekdayDropdown.addEventListener('change', () => { hideBackPill(); switchTab(weekdayDropdown.value); });
}

/* ---------------- PROGRAM AUDIT (footer link) ---------------- */
// Both audit tables (Current Program Audit, Program Design Audit) are
// hidden by default in the Appendix — refreshed content, but not
// something a browsing member/guest needs surfaced by default. This link
// reveals them and scrolls to them, without moving them off the Appendix
// page they logically belong on.
const auditFooterLink = document.getElementById('audit-footer-link');
if (auditFooterLink){
  auditFooterLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('appendix', false);
    const coverage = document.getElementById('appendix-audit-coverage');
    const design = document.getElementById('appendix-audit-design');
    if (coverage) coverage.style.display = '';
    if (design) design.style.display = '';
    if (coverage) { try { coverage.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e){} }
  });
}

/* ---------------- REVISION LOG (footer link) ---------------- */
// Small, tucked-into-the-footer entry point, replacing the old
// prominent bottom-strip ticker/badge/Changelog button — the page
// itself (#tab-log) is real, substantial content, just no longer
// surfaced front-and-center.
const logFooterLink = document.getElementById('log-footer-link');
if (logFooterLink){
  logFooterLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('log');
  });
}

/* ---------------- SOURCES & CREDITS (footer link) ---------------- */
// Same small-footer-link pattern as Revision Log above.
const creditsFooterLink = document.getElementById('credits-footer-link');
if (creditsFooterLink){
  creditsFooterLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('credits');
  });
}

/* ---------------- HOW POINTS WORK (footer link) ---------------- */
// Same small-footer-link pattern as Revision Log/Credits above.
const pointsFooterLink = document.getElementById('points-footer-link');
if (pointsFooterLink){
  pointsFooterLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('points');
  });
}

const TAB_TITLES = {
  overview: 'Training Manual', mon: 'Training Manual', tue: 'Training Manual',
  wed: 'Training Manual', thu: 'Training Manual', fri: 'Training Manual', sun: 'Training Manual', sat: 'Training Manual',
  appendix: 'Appendix', glance: 'At a Glance', points: 'How Points Work',
  schedule: 'Booking', coach: 'Coach', billing: 'Billing', users: 'Members — Admin', sessions: 'Sessions — Admin', reports: 'Reports — Admin', switchboard: 'Switchboard — Admin',
  session: 'Live Session Log', tools: 'Tools', 'member-preview': 'Member Area', me: 'Me', accountability: 'My Teams', messages: 'Messages', inbox: 'Inbox'
};

// Resolves the precise current tab key — checking for an active nested
// .member-section/.admin-section first, since the outer .tab-panel.active
// alone (tab-member/tab-admin) only tells you which page, not which sub-tab.
function getCurrentTab(){
  const activePanel = document.querySelector('.tab-panel.active');
  if (!activePanel) return 'overview';
  const nestedActive = activePanel.querySelector(':scope > .sched-scope > .member-section.active, :scope > .sched-scope > .admin-section.active');
  if (nestedActive) return nestedActive.id.replace('tab-', '');
  return activePanel.id.replace('tab-', '');
}

function switchTab(rawTab, scrollTop){
  // 'member'/'admin' (the rack pills themselves) resolve to their default
  // sub-tab — everything downstream operates on the resolved tab.
  const tab = TAB_ALIASES[rawTab] || rawTab;
  // Kick off loading this tab's module (if it has one) as early as
  // possible — before the visual switch below, not after — since it's
  // a network fetch and every bit of head start helps. Modules already
  // loaded resolve instantly (see bnbLoadModule's cache check).
  const TAB_TO_MODULE = {
    me: 'bmi', // "Me" defaults to its Weight sub-section; loads bmi.js, which pulls in weight.js first via deps. Period/Track load lazily from the inner me-section-switch instead, once actually selected.
    accountability: 'accountability',
    messages: 'messages',
    inbox: 'inbox',
    schedule: 'bookingCoach',
    coach: 'bookingCoach',
    sessions: 'bookingCoach',
    billing: 'billing',
    users: 'migrate',
    reports: 'reports',
    tools: 'tools'
  };
  if (TAB_TO_MODULE[tab] && typeof bnbLoadModule === 'function'){
    bnbLoadModule(TAB_TO_MODULE[tab]).catch(err => {
      console.error(err);
      const t = document.getElementById('t-toast');
      if (t){ t.textContent = 'Failed to load this section — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
    });
  }
  const nestedParent = NESTED_TAB_PARENT[tab];
  const targetPanelId = nestedParent || ('tab-' + tab);
  const panel = document.getElementById(targetPanelId);
  if (!panel) return;
  document.title = (TAB_TITLES[tab] || 'Training Manual') + " \u2014 Bell(e)s N' Barz";
  plates.forEach(x => x.classList.toggle('active', x.getAttribute('data-tab') === tab));
  if (navManualBtn) navManualBtn.classList.toggle('active', manualTabs.includes(tab));
  // The day sidebar only belongs to the Manual; Member/Coach/Admin/Inbox
  // get the full width (see "REDESIGN" in the stylesheet).
  const gymPage = document.getElementById('site-gym');
  if (gymPage) gymPage.classList.toggle('gym-manual-mode', manualTabs.includes(tab));
  if (navMemberBtn) navMemberBtn.classList.toggle('active', memberSectionTabs.includes(tab) || tab === 'member-preview');
  if (navAdminBtn) navAdminBtn.classList.toggle('active', adminSectionTabs.includes(tab));
  document.querySelectorAll('.tab-panel').forEach(sec => sec.classList.remove('active'));
  panel.classList.add('active');
  // Nested tab (lives inside the MEMBER or ADMIN page): also show the right
  // inner .member-section/.admin-section — the outer panel alone has no
  // visible content otherwise, since each nested section defaults to hidden.
  if (nestedParent){
    panel.querySelectorAll(':scope > .sched-scope > .member-section, :scope > .sched-scope > .admin-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === 'tab-' + tab);
    });
  }
  // Member lands on its card screen instead of defaulting into Live
  // Session, at every width — rawTab === 'member' means the top-nav pill
  // (or a restored #member hash) was used, as opposed to a specific
  // card/deep link, which should still open straight into its content.
  if (nestedParent === 'tab-member'){
    panel.classList.toggle('member-content-mode', rawTab !== 'member');
    // Landing on the tile screen itself: no tile should look pre-selected
    // (the resolved sub-tab, e.g. Live Session, is still the .active
    // .member-section underneath — only its tile's highlight is cleared).
    if (rawTab === 'member'){
      document.querySelectorAll('#member-section-switch .plate').forEach(b => b.classList.remove('active'));
    }
    // Me is the only Member tile with its own nested tile row
    // (me-section-switch: Weight/Period/Track/Nutrition/Fasting) — on
    // every width, not just mobile, show that row in place of the outer
    // Member tile row instead of stacking both. The MEMBER nav pill (or
    // any other tile) clears this the same way it already clears
    // member-content-mode above.
    panel.classList.toggle('me-content-mode', tab === 'me');
    // Me opens on its own cards too: me-section-mode is only set once a
    // Me card is clicked (ME SUB-SWITCHER below), so entering Me by any
    // route resets to the cards first. Deep links click their card next.
    panel.classList.remove('me-section-mode');
    if (tab === 'me') document.querySelectorAll('#me-section-switch button').forEach(b => b.classList.remove('active'));
  }
  // Same card-screen treatment for Admin — landing via the top-nav
  // ADMIN pill (or a restored #admin hash) shows the Billing/Users/
  // Sessions/Reports cards instead of jumping straight into Billing.
  if (nestedParent === 'tab-admin'){
    panel.classList.toggle('admin-content-mode', rawTab !== 'admin');
    if (rawTab === 'admin'){
      document.querySelectorAll('#admin-section-switch .plate').forEach(b => b.classList.remove('active'));
    }
  }
  // Same card-screen treatment for Coach — landing via the top-nav COACH
  // pill always resets to the section cards (the client cards live inside
  // Dashboard), even if a section was previously open. Entering a
  // specific section (card click, or a restored #coach:key hash) is
  // handled separately in the COACH SUB-SWITCHER IIFE below, since
  // Coach's inner navigation never goes through switchTab() at all.
  // Tools opens on its page cards too, whichever way it was reached.
  if (tab === 'tools' && typeof showToolsCards === 'function') showToolsCards();
  if (tab === 'coach'){
    const coachPanel = document.getElementById('tab-coach');
    if (coachPanel){
      coachPanel.classList.remove('coach-content-mode');
      document.querySelectorAll('#coach-section-switch button').forEach(b => b.classList.remove('active'));
    }
  }
  if (weekdayDropdown && weekdayTabs.includes(tab)) weekdayDropdown.value = tab;
  // Live Session Log's guest/signed-in state can change elsewhere (e.g. the
  // "Booking as" member picker) without this tab re-rendering on its own —
  // refresh it silently whenever the member lands on it.
  if (tab === 'session' && typeof window.mlsOnTabShown === 'function') window.mlsOnTabShown();
  // Same problem as Live Session above, one door down: Shop's package
  // checkout can create a brand-new member after this page already loaded.
  // Booking's roster dropdown was built once at init and never refreshed on
  // its own, so a member created mid-session wouldn't show up until reload.
  if ((tab === 'schedule' || tab === 'sessions') && typeof window.schedOnTabShown === 'function') window.schedOnTabShown();
  // Members — Admin (moved from the old site-users Admin mode): re-render
  // the roster whenever this sub-tab is opened, same reasoning as Schedule
  // above — a member created elsewhere (Shop checkout, Sign Up) wouldn't
  // otherwise show up until a full reload.
  if (tab === 'users' && typeof window.usersOnTabShown === 'function') window.usersOnTabShown();
  // My Teams' roster/feed can go stale if a group changed elsewhere (a
  // pending invite responded to in another tab, a member signing up
  // mid-session) — refresh on tab-open, same pattern as the others above.
  if (tab === 'accountability' && typeof window.bnbAccountabilityOnTabShown === 'function') window.bnbAccountabilityOnTabShown();
  // Messages: same reasoning as My Teams above — refresh on tab-open so a
  // reply sent from elsewhere (or by staff) doesn't sit stale in the DOM.
  if (tab === 'messages' && typeof window.bnbMessagesOnTabShown === 'function') window.bnbMessagesOnTabShown();
  // Inbox: same reasoning as Messages above.
  if (tab === 'inbox' && typeof window.bnbInboxOnTabShown === 'function') window.bnbInboxOnTabShown();
  // Reports reads from invoices/payments/checkins/bookings, all of which can
  // change elsewhere while staff isn't looking — always refetch on tab-open
  // rather than showing whatever numbers happened to load the first time.
  if (tab === 'reports' && typeof window.bnbReportsOnTabShown === 'function') window.bnbReportsOnTabShown();
  // Switchboard: a switch may have been flipped on another device.
  if (tab === 'switchboard' && typeof window.bnbSwitchboardOnTabShown === 'function') window.bnbSwitchboardOnTabShown();
  // Coach Dashboard's "unpaid invoices" line reads from Billing, which lives
  // in a separate module that doesn't call back here when a payment is
  // logged — refresh on tab-open so that line doesn't go stale.
  if (tab === 'coach' && typeof window.coachOnTabShown === 'function') window.coachOnTabShown();
  const glanceInlineSearch = document.getElementById('glance-inline-search');
  if (glanceInlineSearch) glanceInlineSearch.classList.toggle('show', tab === 'glance');
  if (scrollTop !== false) window.scrollTo({top: 0, behavior:'smooth'});
  // Landing via the generic 'member'/'admin' pill (mobile tile screen, no
  // section pre-selected) writes '#member'/'#admin' instead of the resolved
  // sub-tab — a refresh must restore the tile screen, not jump straight
  // into whichever section the alias happens to resolve to.
  history.replaceState(null, '', '#' + (rawTab === 'member' || rawTab === 'admin' ? rawTab : tab));
}

const backPill = document.getElementById('back-pill');
const backPillLabel = document.getElementById('back-pill-label');
let previousLocation = null;

/* ---------------- COACH SUB-SWITCHER (Program Builder / Roster & Availability) ---------------- */
(function(){
  const switchEl = document.getElementById('coach-section-switch');
  if (!switchEl) return;
  const btns = switchEl.querySelectorAll('button');
  const sections = {
    dashboard: document.getElementById('coach-section-dashboard'),
    program: document.getElementById('coach-section-program'),
    roster: document.getElementById('coach-section-roster'),
    session: document.getElementById('coach-section-session'),
    workouts: document.getElementById('coach-section-workouts'),
    messages: document.getElementById('coach-section-messages'),
    mealplans: document.getElementById('coach-section-mealplans')
  };
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.getAttribute('data-coach-section');
      btns.forEach(b=> b.classList.toggle('active', b===btn));
      Object.keys(sections).forEach(k=> sections[k].classList.toggle('active', k===key));
      // Card screen: selecting any section here (card click, or a
      // restored #coach:key hash) enters content mode — hides the cards,
      // shows the Back button.
      document.getElementById('tab-coach').classList.add('coach-content-mode');
      // Encode which sub-section is active in the hash too (as coach:<key>),
      // so a refresh restores it — switchTab() only ever wrote the outer
      // 'coach' tab, leaving every reload stuck back on Dashboard.
      history.replaceState(null, '', '#coach:' + key);
      if (key === 'program' && typeof window.bnbProgramBuilderOnShown === 'function') window.bnbProgramBuilderOnShown();
      if (key === 'workouts' && typeof window.bnbCoachWorkoutsOnShown === 'function') window.bnbCoachWorkoutsOnShown();
      if (key === 'mealplans' && typeof bnbLoadModule === 'function'){
        bnbLoadModule('mealplan').then(() => {
          if (typeof window.bnbMealPlanCoachOnShown === 'function') window.bnbMealPlanCoachOnShown();
        }).catch(err => {
          console.error(err);
          const t = document.getElementById('t-toast');
          if (t){ t.textContent = 'Failed to load this section — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
        });
      }
      if (key === 'messages'){
        if (typeof bnbLoadModule === 'function'){
          bnbLoadModule('messages').then(() => {
            if (typeof window.bnbMessagesStaffOnTabShown === 'function') window.bnbMessagesStaffOnTabShown();
          }).catch(err => {
            console.error(err);
            const t = document.getElementById('t-toast');
            if (t){ t.textContent = 'Failed to load this section — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
          });
        }
      }
    });
  });
})();

/* ---------------- ME SUB-SWITCHER (Weight / Period / Track) ---------------- */
// Personal trackers, nested one level under the MEMBER page's own "Me"
// tab — same pattern as the Coach sub-switcher above, except each
// section also needs its module lazy-loaded (weight/period/track used
// to be top-level MEMBER tabs, each with their own TAB_TO_MODULE entry;
// now that they're inner sections instead, that same lazy-load has to
// happen here on first click).
(function(){
  const switchEl = document.getElementById('me-section-switch');
  if (!switchEl) return;
  const btns = switchEl.querySelectorAll('button');
  const sections = {
    weight: document.getElementById('tab-weight'),
    bp: document.getElementById('tab-bp'),
    steps: document.getElementById('tab-steps'),
    period: document.getElementById('tab-period'),
    track: document.getElementById('tab-track'),
    nutrition: document.getElementById('tab-nutrition'),
    fasting: document.getElementById('tab-fasting'),
    mealplan: document.getElementById('tab-mealplan'),
    recipes: document.getElementById('tab-recipes')
  };
  const ME_SECTION_TO_MODULE = { weight: 'bmi', bp: 'vitals', steps: 'vitals', period: 'period', track: 'track', nutrition: 'nutrition', fasting: 'fasting', mealplan: 'mealplan' };
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.getAttribute('data-me-section');
      if (ME_SECTION_TO_MODULE[key] && typeof bnbLoadModule === 'function'){
        bnbLoadModule(ME_SECTION_TO_MODULE[key]).then(() => {
          // Meal Plan refetches every time it's opened, so a plan the
          // coach just saved shows up without a reload.
          if (key === 'mealplan' && typeof window.bnbMealPlanOnTabShown === 'function') window.bnbMealPlanOnTabShown();
        }).catch(err => {
          console.error(err);
          const t = document.getElementById('t-toast');
          if (t){ t.textContent = 'Failed to load this section — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
        });
      }
      btns.forEach(b=> b.classList.toggle('active', b===btn));
      Object.keys(sections).forEach(k=> sections[k].classList.toggle('active', k===key));
      // Leave Me's card screen for this section (Back to Me returns).
      document.getElementById('tab-member').classList.add('me-section-mode');
      // Same fix as the Coach sub-switcher above (as me:<key>) — otherwise
      // a refresh on Period/Track/Nutrition silently drops back to Weight.
      history.replaceState(null, '', '#me:' + key);
    });
  });
})();

/* ---------------- RECIPES (Me sub-tab) ----------------
   Static guides (Smoothie / Trail Mix / Porridge / Soup), one panel
   visible at a time — no module, no data, so it's wired here directly.
   The last-opened guide is remembered on this device. */
(function(){
  const switchEl = document.getElementById('recipe-switch');
  if (!switchEl) return;
  const btns = switchEl.querySelectorAll('button');
  function show(key){
    btns.forEach(b=> b.classList.toggle('active', b.getAttribute('data-recipe') === key));
    document.querySelectorAll('#tab-recipes .recipe-panel').forEach(p=> p.classList.toggle('active', p.id === 'recipe-' + key));
  }
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.getAttribute('data-recipe');
      show(key);
      try { localStorage.setItem('bnb-recipe-view', key); } catch(e){}
    });
  });
  let saved = null;
  try { saved = localStorage.getItem('bnb-recipe-view'); } catch(e){}
  if (saved && document.getElementById('recipe-' + saved)) show(saved);
  // Home page shortcut card — same route as the #me:recipes deep link.
  const homeLink = document.getElementById('home-recipes-link');
  if (homeLink) homeLink.addEventListener('click', ()=>{
    if (typeof window.switchSite === 'function') window.switchSite('gym');
    // Recipes live in Member > Me, so guests get the membership preview.
    if (!isSignedIn()){ const pill = document.getElementById('nav-member-btn'); if (pill) pill.click(); return; }
    if (typeof window.switchTab === 'function') window.switchTab('me');
    const meBtn = document.querySelector('#me-section-switch [data-me-section="recipes"]');
    if (meBtn) meBtn.click();
  });
})();

/* ---------------- MOON PHASE (Me sub-tab) ----------------
   Pure client-side calculation from the current date — no logging, no
   Supabase table, so unlike Weight/Period/Track/Nutrition it renders
   once, synchronously, with no lazy module and no ME_SECTION_TO_MODULE
   entry (undefined there is already a no-op, see above). Standard
   synodic-month approximation (~29.53059 days), anchored to a known
   new moon (2000-01-06 18:14 UTC) — accurate to within a few hours,
   plenty for a "what phase is it, roughly" widget. */
const MOON_SYNODIC_DAYS = 29.53058867;
const MOON_KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const MOON_PHASES = [
  { name: 'New Moon', icon: '🌑' },
  { name: 'Waxing Crescent', icon: '🌒' },
  { name: 'First Quarter', icon: '🌓' },
  { name: 'Waxing Gibbous', icon: '🌔' },
  { name: 'Full Moon', icon: '🌕' },
  { name: 'Waning Gibbous', icon: '🌖' },
  { name: 'Last Quarter', icon: '🌗' },
  { name: 'Waning Crescent', icon: '🌘' }
];
function moonPhaseFor(date){
  const diffDays = (date.getTime() - MOON_KNOWN_NEW_MOON) / 86400000;
  let age = diffDays % MOON_SYNODIC_DAYS;
  if (age < 0) age += MOON_SYNODIC_DAYS;
  const frac = age / MOON_SYNODIC_DAYS; // 0 = new moon, 0.5 = full moon
  const idx = Math.floor(frac * 8 + 0.5) % 8; // nearest of 8 named phases, boundaries centered on each
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * frac)) / 2 * 100);
  return { name: MOON_PHASES[idx].name, icon: MOON_PHASES[idx].icon, illumination: illumination, age: age };
}
function renderMoonPhase(){
  const iconEl = document.getElementById('moon-today-icon');
  if (!iconEl) return;
  const today = new Date();
  const phase = moonPhaseFor(today);
  iconEl.textContent = phase.icon;
  document.getElementById('moon-today-name').textContent = phase.name;
  document.getElementById('moon-today-illum').textContent = phase.illumination + '% illuminated';

  const half = MOON_SYNODIC_DAYS / 2;
  const daysToFullMoon = Math.ceil(phase.age < half ? half - phase.age : MOON_SYNODIC_DAYS - phase.age + half);
  const daysToNewMoon = Math.ceil(MOON_SYNODIC_DAYS - phase.age);
  document.getElementById('moon-today-next').textContent =
    'Next full moon in ' + daysToFullMoon + ' day' + (daysToFullMoon===1?'':'s') +
    ' · Next new moon in ' + daysToNewMoon + ' day' + (daysToNewMoon===1?'':'s');

  const strip = document.getElementById('moon-strip');
  if (strip){
    let html = '';
    for (let i = 0; i < 14; i++){
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const p = moonPhaseFor(d);
      html += '<div class="moon-day' + (i===0 ? ' today' : '') + '">' +
        '<div class="moon-day-icon">' + p.icon + '</div>' +
        '<div class="moon-day-label">' + d.toLocaleDateString(undefined, {month:'short', day:'numeric'}) + '</div>' +
      '</div>';
    }
    strip.innerHTML = html;
  }
}
renderMoonPhase();

/* ---------------- EKADASHI TIMER (Moon Phase companion) ----------------
   Ekadashi is the 11th tithi (lunar day) of each of the two lunar
   fortnights — tithi 11 in the waxing Shukla Paksha, tithi 26 (15+11)
   in the waning Krishna Paksha. A tithi is defined by the Moon-Sun
   ecliptic longitude difference crossing each 12° boundary, which needs
   real solar/lunar position, not just the fixed-period sinusoid used
   for the moon-phase visual above — that's accurate enough for "what
   phase, roughly" but nowhere near precise enough for a tithi boundary.
   sunLongitude/moonLongitude below are Meeus' abridged low-precision
   series (Astronomical Algorithms ch.25 for the Sun, the ~20 largest
   ELP2000-82 terms for the Moon) — good to roughly arcminute level,
   i.e. within a few minutes of the true tithi boundary. What this still
   doesn't account for: which tithi is present at LOCAL sunrise (the
   actual rule most traditions use to decide the observed calendar day,
   which can shift by a day from the raw astronomical boundary) — that
   needs the viewer's location, which isn't collected anywhere in this
   app. Labeled as approximate in the UI for exactly this reason. */
function toJulianDate(date){ return date.getTime() / 86400000 + 2440587.5; }
function normalizeDeg(x){ x = x % 360; return x < 0 ? x + 360 : x; }
function sunLongitude(date){
  const T = (toJulianDate(date) - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T;
  const M = (357.52911 + 35999.05029*T - 0.0001537*T*T) * Math.PI/180;
  const C = (1.914602 - 0.004817*T - 0.000014*T*T)*Math.sin(M)
          + (0.019993 - 0.000101*T)*Math.sin(2*M)
          + 0.000289*Math.sin(3*M);
  return normalizeDeg(L0 + C);
}
function moonLongitude(date){
  const T = (toJulianDate(date) - 2451545.0) / 36525;
  const d2r = Math.PI/180;
  const Lp = normalizeDeg(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - T*T*T*T/65194000);
  const D  = (297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868 - T*T*T*T/113065000) * d2r;
  const M  = (357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000) * d2r;
  const Mp = (134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699 - T*T*T*T/14712000) * d2r;
  const F  = (93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000 + T*T*T*T/863310000) * d2r;
  const dL =
      6.288774*Math.sin(Mp) + 1.274027*Math.sin(2*D - Mp) + 0.658314*Math.sin(2*D)
    + 0.213618*Math.sin(2*Mp) - 0.185116*Math.sin(M) - 0.114332*Math.sin(2*F)
    + 0.058793*Math.sin(2*D - 2*Mp) + 0.057066*Math.sin(2*D - M - Mp) + 0.053322*Math.sin(2*D + Mp)
    + 0.045758*Math.sin(2*D - M) - 0.040923*Math.sin(M - Mp) - 0.034720*Math.sin(D)
    - 0.030383*Math.sin(M + Mp) + 0.015327*Math.sin(2*D - 2*F) - 0.012528*Math.sin(Mp + 2*F)
    + 0.010980*Math.sin(Mp - 2*F) + 0.010675*Math.sin(4*D - Mp) + 0.010034*Math.sin(3*Mp)
    + 0.008548*Math.sin(4*D - 2*Mp) - 0.007888*Math.sin(2*D + M - Mp) - 0.006766*Math.sin(2*D + M);
  return normalizeDeg(Lp + dL);
}
function tithiAt(date){
  const diff = normalizeDeg(moonLongitude(date) - sunLongitude(date));
  return Math.floor(diff / 12) + 1; // 1..30 (15 = Purnima/full moon, 30 = Amavasya/new moon)
}
// Coarse 3-hour sweep (max 50 days — Ekadashi never goes longer than
// ~16 days between occurrences) then a binary-search refinement down to
// sub-minute precision, rather than assuming a fixed tithi length —
// real tithi durations vary (~19-26 hours) with the Moon's orbital speed.
function findTithiTransition(fromDate, matches, initialMatches){
  const stepMs = 3 * 60 * 60 * 1000;
  let t = fromDate.getTime();
  for (let i = 0; i < 400; i++){
    t += stepMs;
    if (matches(tithiAt(new Date(t))) !== initialMatches){
      let lo = t - stepMs, hi = t;
      for (let b = 0; b < 25; b++){
        const mid = (lo + hi) / 2;
        if (matches(tithiAt(new Date(mid))) === initialMatches) lo = mid; else hi = mid;
      }
      return new Date(hi);
    }
  }
  return null;
}
function nextEkadashi(fromDate){
  const cur = tithiAt(fromDate);
  if (cur === 11 || cur === 26){
    const end = findTithiTransition(fromDate, t => t === cur, true);
    return { ongoing: true, paksha: cur === 11 ? 'Shukla' : 'Krishna', start: null, end: end };
  }
  const shuklaStart = findTithiTransition(fromDate, t => t === 11, false);
  const krishnaStart = findTithiTransition(fromDate, t => t === 26, false);
  const useShukla = shuklaStart && (!krishnaStart || shuklaStart < krishnaStart);
  const target = useShukla ? 11 : 26;
  const start = useShukla ? shuklaStart : krishnaStart;
  const end = start ? findTithiTransition(start, t => t === target, true) : null;
  return { ongoing: false, paksha: useShukla ? 'Shukla' : 'Krishna', start: start, end: end };
}
function fmtCountdown(ms){
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
  if (h > 0) return h + 'h ' + m + 'm ' + s + 's';
  return m + 'm ' + s + 's';
}
/* ---- Hourglass visual: a decorative approximation, not tied to the
   exact (variable, ~19-26h) length of the real tithi cycle — it drains
   over a nominal half-synodic-month (~14.77 days), which is close
   enough that the sand level always looks "about right" relative to
   the precise countdown text next to it, without the complexity of
   also computing the previous Ekadashi's boundary just to measure a
   fill percentage. Geometry: two mirrored triangles (apex-to-apex,
   base 20..80, apex/neck around y=78-82 in a 0 0 100 160 viewBox);
   "sand" is drawn as a smaller similar triangle for the draining top
   half and a growing trapezoid for the accumulating bottom half, each
   recomputed from the same top-triangle taper. ---- */
const MOON_HALF_SYNODIC_MS = 29.53058867 / 2 * 86400000;
function updateHourglassSand(progress){
  const topEl = document.getElementById('eg-sand-top');
  const bottomEl = document.getElementById('eg-sand-bottom');
  if (!topEl || !bottomEl) return;
  const p = Math.max(0, Math.min(1, progress));
  const topBaseY = 18, topApexY = 78, bottomApexY = 82, bottomBaseY = 142, halfBaseWidth = 30;

  const topSurfaceY = topBaseY + p * (topApexY - topBaseY);
  const topHalfWidth = halfBaseWidth * (topApexY - topSurfaceY) / (topApexY - topBaseY);
  topEl.setAttribute('points',
    (50 - topHalfWidth) + ',' + topSurfaceY + ' ' +
    (50 + topHalfWidth) + ',' + topSurfaceY + ' ' +
    '50,' + topApexY
  );

  const bottomSurfaceY = bottomBaseY - p * (bottomBaseY - bottomApexY);
  const bottomHalfWidth = halfBaseWidth * (bottomSurfaceY - bottomApexY) / (bottomBaseY - bottomApexY);
  bottomEl.setAttribute('points',
    '20,' + bottomBaseY + ' 80,' + bottomBaseY + ' ' +
    (50 + bottomHalfWidth) + ',' + bottomSurfaceY + ' ' +
    (50 - bottomHalfWidth) + ',' + bottomSurfaceY
  );
}

let ekadashiInfo = null;
let ekadashiRefreshAt = 0;
let ekadashiWasOngoing = null; // null until the first render, so page load never "turns" the glass
function renderEkadashi(){
  const statusEl = document.getElementById('ekadashi-status');
  const countdownEl = document.getElementById('ekadashi-countdown');
  if (!statusEl || !countdownEl) return;
  const now = Date.now();
  // Recompute the underlying tithi search at most once a minute (it's a
  // few hundred trig calls, cheap but pointless to redo every tick) —
  // the 1-second ticker below just re-formats the countdown in between.
  if (!ekadashiInfo || now >= ekadashiRefreshAt){
    ekadashiInfo = nextEkadashi(new Date(now));
    ekadashiRefreshAt = now + 60000;
  }
  const info = ekadashiInfo;
  if (info.ongoing){
    statusEl.textContent = 'Today is Ekadashi (' + info.paksha + ' Paksha)';
    countdownEl.textContent = info.end ? ('Ends in ' + fmtCountdown(info.end.getTime() - now)) : '—';
    updateHourglassSand(1);
  } else if (info.start){
    statusEl.textContent = 'Next Ekadashi: ' + info.paksha + ' Paksha, ' +
      info.start.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
    countdownEl.textContent = 'Starts in ' + fmtCountdown(info.start.getTime() - now);
    updateHourglassSand(1 - Math.min(1, (info.start.getTime() - now) / MOON_HALF_SYNODIC_MS));
  } else {
    statusEl.textContent = 'Could not calculate — try reloading.';
    countdownEl.textContent = '';
  }
  // The hourglass "turns" once, right as Ekadashi arrives (the moment
  // the countdown-to-next hits zero) — not on the way out the other
  // side, so it turns once per occurrence, not twice.
  if (ekadashiWasOngoing === false && info.ongoing === true){
    const hourglass = document.getElementById('ekadashi-hourglass');
    if (hourglass){
      hourglass.classList.remove('turning');
      void hourglass.offsetWidth; // restart the animation if it's somehow already mid-run
      hourglass.classList.add('turning');
      setTimeout(() => hourglass.classList.remove('turning'), 1400);
    }
  }
  ekadashiWasOngoing = info.ongoing;
}
renderEkadashi();
setInterval(renderEkadashi, 1000);

function hideBackPill(){
  backPill.classList.remove('show');
  previousLocation = null;
}

/* ---------------- NAV AUTH GATE ---------------- */
// MEMBER / COACH / BOOKING / ADMIN all require a real login. Logged out,
// they're shown greyed but stay clickable — clicking opens the entry gate
// (Log In / Sign Up) instead of switching tabs. MANUAL stays open to
// guests always.
// COACH and ADMIN additionally require a staff role (admin/trainer/staff)
// — a signed-in plain member sees them greyed too, and clicking shows a
// brief "staff only" toast rather than the login prompt, since logging in
// again wouldn't change anything. INBOX requires sign-in like the rest,
// but no staff role — everyone signed in can use it.
const GATED_TABS = ['member', 'coach', 'schedule', 'admin', 'inbox'];
const STAFF_ROLES = ['admin', 'trainer', 'staff'];
const STAFF_ONLY_TABS = ['coach', 'admin'];
function isSignedIn(){
  return !!(window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf());
}
function isStaff(){
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  return !!(me && me.roles && me.roles.some(r => STAFF_ROLES.includes(r)));
}
function goToLoginPrompt(){
  const gate = document.getElementById('gate-backdrop');
  if (gate) gate.classList.add('show');
}
function showStaffOnlyToast(){
  const el = document.getElementById('t-toast');
  if (!el) return;
  el.textContent = 'That area is for staff accounts.';
  el.classList.add('show');
  clearTimeout(el._navGateTimer);
  el._navGateTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
function refreshNavAuthGate(){
  const signedIn = isSignedIn();
  const staff = isStaff();
  plates.forEach(p => {
    const tab = p.getAttribute('data-tab');
    if (!GATED_TABS.includes(tab)) return;
    const locked = !signedIn || (STAFF_ONLY_TABS.includes(tab) && !staff);
    p.classList.toggle('locked', locked);
  });
  refreshAccountMenu(signedIn);
  refreshNotificationBell(signedIn);
  if (window.bnbInboxRefreshBadge) window.bnbInboxRefreshBadge();
  if (window.bnbLiveAlertsResubscribe) window.bnbLiveAlertsResubscribe();
  // Tools' "save this" boxes switch between Sign Up and Open in Me.
  if (window.BNB_TOOLS) window.BNB_TOOLS.refresh();
  // Signed in while looking at the Member preview: go straight into Member.
  const preview = document.getElementById('tab-member-preview');
  if (signedIn && preview && preview.classList.contains('active')) switchTab('member');
}

/* ---------------- NOTIFICATION BELL (top-right, signed-in only) ---------------- */
// In-app only, not real push/email — this project has no service worker,
// VAPID keys, email API, or Edge Functions, so that would be a separate,
// bigger project. Follows the exact same show/hide-on-signedIn and
// open/close-dropdown pattern as the Account Menu right below it.
function escNotif(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
const notifBell = document.getElementById('notif-bell');
const notifBellBtn = document.getElementById('notif-bell-btn');
const notifBellCount = document.getElementById('notif-bell-count');
const notifBellList = document.getElementById('notif-bell-list');
let notifPollTimer = null;

/* ---- Birthday notifications (staff, computed on open) ----
   Not a real scheduled push — same limitation as the bell generally
   (no service worker/Edge Functions here): this only fires for a staff
   member whose app happens to be open, or who opens it, on the day
   itself. Runs through refreshNotificationBell() below, which already
   fires on every real auth transition (login, signup, session restore)
   — so it's checked at least once per staff session without polling.
   Scoped to getMembers() (anyone with the 'member' role) since that's
   the roster Admin > Users/Billing already manage. Inserts one combined
   notification per staff member per day (deduped by checking for an
   existing 'birthday_today' row from today before inserting) rather
   than one row per birthday, so reloading/re-logging-in same-day never
   spams the bell. */
async function checkBirthdaysAndNotify(){
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  if (!me || !isStaff()) return;
  const members = (window.BNB_USERS.getMembers && window.BNB_USERS.getMembers()) || [];
  const now = new Date();
  const todayMD = String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  const birthdays = members.filter(u => u.dob && u.dob.length >= 10 && u.dob.slice(5,10) === todayMD);
  if (!birthdays.length) return;

  // Compares the existing row's created_at against local "today" in JS
  // (new Date() converts the timestamptz to the browser's own timezone)
  // rather than sending a naive local time string for Postgres to filter
  // on — that would get interpreted in the DB's timezone, not the
  // browser's, silently shifting the "today" boundary by the UTC offset
  // (the same class of bug the Coach Dashboard's weekRange() comment
  // calls out for date math like this).
  const { data: existing, error: existErr } = await bnbClient
    .from('notifications').select('id, created_at')
    .eq('user_id', me.id).eq('type', 'birthday_today')
    .order('created_at', { ascending: false }).limit(1);
  if (existErr) { console.warn('Supabase check birthday notifications failed:', existErr); return; }
  if (existing && existing.length){
    const last = new Date(existing[0].created_at);
    if (last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate()){
      return; // already notified this staff member today
    }
  }

  const names = birthdays.map(u => u.fullName);
  const who = names.length === 1 ? names[0]
    : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
  const message = "It's " + who + (names.length === 1 ? "'s birthday today!" : "'s birthdays today!");

  const { error: insertErr } = await bnbClient.from('notifications').insert([{
    user_id: me.id, type: 'birthday_today', message: message, link_tab: 'users'
  }]);
  if (insertErr) { console.warn('Supabase insert birthday notification failed:', insertErr); return; }
  refreshUnreadCount();
}

/* ---- Lunar reminders: Ekadashi, New Moon, Full Moon (computed on open) ----
   No real scheduler exists here (same limitation as
   checkBirthdaysAndNotify() above), so whoever opens the app inside the
   24 hours before an event sends its reminder through
   send_lunar_reminders() (sql/43, full moon added in sql/44): a staff session reminds every active
   member, a member session reminds just themselves. Each reminder shows
   in the bell with its own text and lands in the Inbox as a message.
   The server claims one slot per member/event, so it never matters how
   many sessions — or whose — get here first. */
function nextNewMoon(fromDate){
  // New moon = the Moon-Sun conjunction, i.e. the end of tithi 30
  // (Amavasya) — same Meeus-based tithi math the Ekadashi timer uses,
  // far more precise than the moon-phase widget's synodic approximation.
  const amavasyaStart = tithiAt(fromDate) === 30 ? fromDate : findTithiTransition(fromDate, t => t === 30, false);
  return amavasyaStart ? findTithiTransition(amavasyaStart, t => t === 30, true) : null;
}
function nextFullMoon(fromDate){
  // Full moon = the Moon-Sun opposition, i.e. the end of tithi 15
  // (Purnima) — the same approach as nextNewMoon() above.
  const purnimaStart = tithiAt(fromDate) === 15 ? fromDate : findTithiTransition(fromDate, t => t === 15, false);
  return purnimaStart ? findTithiTransition(purnimaStart, t => t === 15, true) : null;
}
function fmtReminderWhen(date){
  return date.toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' }) +
    ' at ' + date.toLocaleTimeString(undefined, { hour:'numeric', minute:'2-digit' });
}
async function checkLunarRemindersAndNotify(){
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  if (!me) return;
  const now = new Date();
  const events = [];

  const ek = nextEkadashi(now);
  if (!ek.ongoing && ek.start){
    events.push({ kind: 'ekadashi', start: ek.start,
      message: 'Reminder: ' + ek.paksha + ' Paksha Ekadashi begins ' + fmtReminderWhen(ek.start) + '.' });
  }
  const newMoon = nextNewMoon(now);
  if (newMoon){
    events.push({ kind: 'new_moon', start: newMoon,
      message: 'Reminder: New moon (Amavasya) is ' + fmtReminderWhen(newMoon) + '.' });
  }
  const fullMoon = nextFullMoon(now);
  if (fullMoon){
    events.push({ kind: 'full_moon', start: fullMoon,
      message: 'Reminder: Full moon (Purnima) is ' + fmtReminderWhen(fullMoon) + '.' });
  }

  let sentAny = false;
  for (const ev of events){
    const msUntil = ev.start.getTime() - now.getTime();
    if (msUntil <= 0 || msUntil > 24 * 60 * 60 * 1000) continue;
    const { data, error } = await bnbClient.rpc('send_lunar_reminders', {
      p_kind: ev.kind, p_event_start: ev.start.toISOString(), p_message: ev.message
    });
    if (error) { console.warn('Supabase send ' + ev.kind + ' reminder failed:', error); continue; }
    if (data > 0) sentAny = true;
  }
  if (sentAny) refreshUnreadCount();
}

async function refreshUnreadCount(){
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  if (!me || !notifBellCount) return;
  const { count, error } = await bnbClient.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', me.id).eq('read', false);
  if (error) { console.warn('Supabase load notification count failed:', error); return; }
  if (count > 0){ notifBellCount.textContent = count > 99 ? '99+' : String(count); notifBellCount.style.display = ''; }
  else { notifBellCount.style.display = 'none'; }
}

async function loadNotificationList(){
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  if (!me || !notifBellList) return;
  const { data, error } = await bnbClient.from('notifications').select('*').eq('user_id', me.id).order('created_at', { ascending: false }).limit(20);
  if (error) { console.warn('Supabase load notifications failed:', error); return; }
  const rows = data || [];
  if (!rows.length){
    notifBellList.innerHTML = '<div class="notif-bell-empty">No notifications yet.</div>';
    return;
  }
  notifBellList.innerHTML = rows.map(n => `
    <div class="notif-bell-item${n.read ? '' : ' unread'}" data-id="${n.id}" data-link="${escNotif(n.link_tab || '')}">
      ${escNotif(n.message)}
    </div>
  `).join('');
  notifBellList.querySelectorAll('.notif-bell-item').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.getAttribute('data-id');
      const link = el.getAttribute('data-link');
      await bnbClient.from('notifications').update({ read: true }).eq('id', id);
      notifBell.classList.remove('open');
      notifBellBtn.setAttribute('aria-expanded', 'false');
      await refreshUnreadCount();
      if (link && typeof window.switchSite === 'function' && typeof window.switchTab === 'function'){
        window.switchSite('gym');
        // A few links point at a sub-section inside a tab rather than a
        // tab of its own — e.g. Meal Plan lives inside Me (sql/45's
        // notifications use link_tab 'mealplan').
        const SUB_SECTION_LINKS = {
          mealplan: ['me', '#me-section-switch [data-me-section="mealplan"]'],
          roster: ['coach', '#coach-section-switch [data-coach-section="roster"]']
        };
        const sub = SUB_SECTION_LINKS[link];
        window.switchTab(sub ? sub[0] : link);
        if (sub){ const b = document.querySelector(sub[1]); if (b) b.click(); }
      }
    });
  });
}

/* ---- Coach rating nudge (members, computed on open) ----
   Same "no real scheduler" approach as the checks above, but all the
   logic — who's due, and the 30-day cooldown — lives server-side in
   nudge_coach_ratings() (sql/41), since notifications are otherwise
   staff-insert-only. */
async function checkCoachRatingNudge(){
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  if (!me || !me.roles || me.roles.indexOf('member') === -1) return;
  const { error } = await bnbClient.rpc('nudge_coach_ratings');
  if (error) { console.warn('Supabase coach rating nudge failed:', error); return; }
  refreshUnreadCount();
}

/* ---- Booking reminders (sql/62) ----
   Reminders for classes and 1-on-1s within the next 24 hours. pg_cron
   sends these every 15 minutes where it's switched on; this covers it
   where it isn't. Safe for anyone to call — it only tells each person
   about their own bookings, and only once. */
async function checkBookingReminders(){
  const { data, error } = await bnbClient.rpc('send_booking_reminders');
  if (error) { console.warn('Supabase booking reminders failed:', error); return; }
  if (data) refreshUnreadCount();
}

function refreshNotificationBell(signedIn){
  if (!notifBell) return;
  notifBell.style.display = signedIn ? '' : 'none';
  if (!signedIn){
    notifBell.classList.remove('open');
    if (notifBellBtn) notifBellBtn.setAttribute('aria-expanded', 'false');
    if (notifPollTimer){ clearInterval(notifPollTimer); notifPollTimer = null; }
    return;
  }
  refreshUnreadCount();
  checkBirthdaysAndNotify();
  checkLunarRemindersAndNotify();
  checkCoachRatingNudge();
  checkBookingReminders();
  // Only real polling loop in this codebase (confirmed none existed
  // before) — justified because a notification feature that only
  // updates on login/logout would feel broken while just sitting open.
  // Opening the bell always does its own fresh fetch regardless.
  if (!notifPollTimer) notifPollTimer = setInterval(refreshUnreadCount, 90000);
}

if (notifBellBtn){
  notifBellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = notifBell.classList.toggle('open');
    notifBellBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) loadNotificationList();
  });
  document.addEventListener('click', (e) => {
    if (notifBell.classList.contains('open') && !notifBell.contains(e.target)){
      notifBell.classList.remove('open');
      notifBellBtn.setAttribute('aria-expanded', 'false');
    }
  });
  const markAllBtn = document.getElementById('notif-mark-all-btn');
  if (markAllBtn) markAllBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me) return;
    await bnbClient.from('notifications').update({ read: true }).eq('user_id', me.id).eq('read', false);
    await refreshUnreadCount();
    await loadNotificationList();
  });
}

/* ---------------- ACCOUNT MENU (top-right, signed-in only) ---------------- */
// The old Members page's "My Profile" / Log Out only had a path in via the
// entry gate, and that gate no longer opens once you're already signed
// in — MEMBER routes straight to Live Session instead. This is the only
// way back to Profile/Log Out while logged in.
const accountMenu = document.getElementById('account-menu');
const accountMenuBtn = document.getElementById('account-menu-btn');
const accountMenuName = document.getElementById('account-menu-name');

function refreshAccountMenu(signedIn){
  if (!accountMenu) return;
  accountMenu.style.display = signedIn ? '' : 'none';
  if (!signedIn){
    accountMenu.classList.remove('open');
    if (accountMenuBtn) accountMenuBtn.setAttribute('aria-expanded', 'false');
    return;
  }
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  if (accountMenuName) accountMenuName.textContent = (me && me.fullName) ? me.fullName.split(' ')[0] : 'Account';
}

if (accountMenuBtn){
  accountMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = accountMenu.classList.toggle('open');
    accountMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (accountMenu.classList.contains('open') && !accountMenu.contains(e.target)){
      accountMenu.classList.remove('open');
      accountMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });
  const profileBtn = document.getElementById('account-profile-btn');
  if (profileBtn) profileBtn.addEventListener('click', () => {
    accountMenu.classList.remove('open');
    if (typeof window.switchSite === 'function') window.switchSite('users');
    const modeBtn = document.querySelector('#usr-mode-switch [data-mode="profile"]');
    if (modeBtn) modeBtn.click();
  });
  const logoutBtn = document.getElementById('account-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    accountMenu.classList.remove('open');
    if (typeof window.bnbLogout === 'function') window.bnbLogout();
  });
}

// Exposed so the login/signup/logout flow (a separate script block) can
// re-paint the nav the moment auth state actually changes, same pattern
// as the mlsOnTabShown/schedOnTabShown/coachOnTabShown hooks below.
window.bnbRefreshNavAuthGate = refreshNavAuthGate;
refreshNavAuthGate();

plates.forEach(p => {
  p.addEventListener('click', () => {
    const tab = p.getAttribute('data-tab');
    // Member's own sections (Me, My Teams, Messages…) and Admin's
    // (Billing, Users…) are gated like their parent tab, so a deep link
    // such as #me:recipes or #billing can't open them for the wrong person.
    const memberOnly = GATED_TABS.includes(tab) || memberSectionTabs.includes(tab);
    const staffOnly = STAFF_ONLY_TABS.includes(tab) || adminSectionTabs.includes(tab);
    if (memberOnly || staffOnly){
      // Signed-out Member click: show what membership includes rather
      // than a bare login pop-up (Coach/Admin/Inbox still use the pop-up).
      if (!isSignedIn() && (tab === 'member' || memberSectionTabs.includes(tab))){ hideBackPill(); switchTab('member-preview'); return; }
      if (!isSignedIn()){ goToLoginPrompt(); return; }
      if (staffOnly && !isStaff()){ showStaffOnlyToast(); return; }
    }
    hideBackPill();
    switchTab(tab);
  });
});
// Member card screen's Back button — returns from a section's
// content to the cards without changing which section is marked
// .active internally (so tapping the same tile again just re-shows it).
const memberBackBtn = document.getElementById('member-back-btn');
if (memberBackBtn){
  memberBackBtn.addEventListener('click', () => {
    // me-content-mode too — Me hides the cards with it while open.
    document.getElementById('tab-member').classList.remove('member-content-mode', 'me-content-mode', 'me-section-mode');
    document.querySelectorAll('#member-section-switch .plate').forEach(b => b.classList.remove('active'));
    history.replaceState(null, '', '#member');
  });
}
// Me's own Back button — from a tracker back to the Me cards.
const meBackBtn = document.getElementById('me-back-btn');
if (meBackBtn){
  meBackBtn.addEventListener('click', () => {
    document.getElementById('tab-member').classList.remove('me-section-mode');
    document.querySelectorAll('#me-section-switch button').forEach(b => b.classList.remove('active'));
    history.replaceState(null, '', '#me');
  });
}
// Coach's card screen Back button — same pattern as Member's.
const coachBackBtn = document.getElementById('coach-back-btn');
if (coachBackBtn){
  coachBackBtn.addEventListener('click', () => {
    document.getElementById('tab-coach').classList.remove('coach-content-mode');
    document.querySelectorAll('#coach-section-switch button').forEach(b => b.classList.remove('active'));
    history.replaceState(null, '', '#coach');
  });
}
// Admin's card screen Back button — same pattern as Member's.
const adminBackBtn = document.getElementById('admin-back-btn');
if (adminBackBtn){
  adminBackBtn.addEventListener('click', () => {
    document.getElementById('tab-admin').classList.remove('admin-content-mode');
    document.querySelectorAll('#admin-section-switch .plate').forEach(b => b.classList.remove('active'));
    history.replaceState(null, '', '#admin');
  });
}
// Hash is either a plain tab key ('#reports') or, for the Coach/Me
// sub-switchers (which aren't part of the generic switchTab()/.plate
// system), a compound 'outerTab:subKey' ('#coach:messages', '#me:nutrition')
// — see the sub-switcher IIFEs below, which write that second form.
//
// Waits for restoreSession() (window.bnbSessionReady) before clicking,
// rather than firing at parse time: a gated tab (member/coach/schedule/
// admin) checks isSignedIn() inside its own click handler, and that
// check was losing the race against the session actually restoring —
// clicking too early saw selfId still null and bounced straight to the
// login prompt even though the session would have restored moments later.
function restoreInitialHash(){
  // try/finally so a stale hash (an old bookmark whose tab-key element
  // exists but whose button doesn't, say) can never leave the page stuck
  // hidden behind bnb-restoring — the reveal at the bottom always runs.
  try {
    const [initial, initialSub] = location.hash.replace('#','').split(':');
    if (initial && document.getElementById('tab-' + initial)) {
      // Every tab-panel id restorable here belongs to the Gym app, which is
      // one of several outer "site pages" (Home/Blog/Gallery/Shop/Gym) — and
      // "site-home" is the one marked active in the static HTML. Without
      // this, the tab click below still runs correctly, but stays hidden
      // behind the Home page, which is exactly what was showing up as
      // "reload always throws me back to Home."
      if (typeof window.switchSite === 'function') window.switchSite('gym');
      const tabBtn = document.querySelector('[data-tab="' + initial + '"]');
      if (tabBtn) tabBtn.click();
      if (initialSub){
        const subBtn = document.querySelector('#coach-section-switch [data-coach-section="' + initialSub + '"]')
                     || document.querySelector('#me-section-switch [data-me-section="' + initialSub + '"]');
        if (subBtn) subBtn.click();
      }
    } else if (initial === 'blog'){
      // A shared post link (#blog:<slug> — see the Share button in
      // js/bells-n-barz-blog.js). The blog module loads lazily and may not
      // have fetched its posts yet, so stash the slug for it to pick up
      // itself (see tryRestorePendingSlug() there) rather than trying to
      // open the post from here.
      if (initialSub) window.__bnbPendingBlogSlug = initialSub;
      if (typeof window.switchSite === 'function') window.switchSite('blog');
    }
  } finally {
    // Reveal the page now that the correct state (or, for a stale/invalid
    // hash, whatever default state) is in place — see the matching
    // visibility:hidden rule in <head>.
    document.documentElement.classList.remove('bnb-restoring');
  }
}
if (window.bnbSessionReady && typeof window.bnbSessionReady.then === 'function'){
  // Two-argument form (not .then().catch()) so exactly one branch fires,
  // never both: if restoreSession() ever rejects (a network error mid-
  // await, say), the page must not stay permanently hidden behind
  // bnb-restoring — fall back to restoring the hash anyway.
  window.bnbSessionReady.then(restoreInitialHash, restoreInitialHash);
} else {
  restoreInitialHash();
}

/* ---------------- DRILL INDEX ---------------- */
const drills = [
  "90/90 Switches","Ankle CARs","Band External Rotations","Band Pull-Aparts","Bike","Bird Dog",
  "Bodyweight Squats","Box Breathing","Box Jumps","Broad Jumps","Cat-Cow","Clap Push-ups",
  "Dead Bug","Dead Hang","Deep Squat Hold","Explosive Pull-ups","Explosive Ring Rows","Face Pulls",
  "Flexed-Arm Hang","Frog Stretch","Glute Bridges","Hamstring Walkouts","Handstand Hold","Headstand Hold",
  "HIIT Rower","Hip Airplane Hold","Hip CARs","Horse Stance","Jump Rope","Jump Squats","Kettlebell Swings",
  "Knee CARs","Knee-over-Toe Rocks","Leg Drops","Lizard Crawl","Medicine Ball Rotational Throw",
  "Monster Walks","Neck CARs","Open Books","Pallof Press","Patrick Step","Pelvic Tilts","Pigeon Stretch",
  "Pike Hold","Plyometric Push-ups","Pronation/Supination Drills","Push Press","Push-up Plank Hold",
  "Reverse Nordic Curl","Row","Scapular CARs","Scapular Hang","Scapular Pull-ups","Scapular Push-ups",
  "Serratus Punches","Shoulder CARs","Single-Leg Glute Bridge Hold","Single-leg Glute Bridges",
  "Suitcase Carry","Thoracic Rotations","Thread the Needle","Tibialis Raises","Torso Rotations",
  "Wall Slides","World's Greatest Stretch","Wrist CARs","Y-T-W Raises","Ape Walk","Bear Crawl",
  "Bear Crawl Hold","Crab Walk","Duck Walk"
];
const drillsNew = ["Back Extensions","Cable Crunches","Cable Side Bends"];
const driIdx = document.getElementById('drill-index');
[...drills, ...drillsNew].sort((a,b)=>a.localeCompare(b)).forEach(name => {
  const a = document.createElement('a');
  const isNew = drillsNew.includes(name);
  a.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " exercise tutorial");
  a.textContent = name + (isNew ? " · v1.6.1" : "");
  a.target = "_blank"; a.rel="noopener";
  if (isNew) a.classList.add('new');
  driIdx.appendChild(a);
});

/* ---------------- FUNCTION-TO-EXERCISE REFERENCE ---------------- */
const funcRef = [
  ["Flexion", ["Cable Crunches","Hanging Leg Raise (curl)","Sit-ups"]],
  ["Extension", ["Back Extension (hyperextension)","Reverse Hyper","Superman"]],
  ["Lateral Flexion", ["Cable Side Bend","Standing Oblique Crunch (cable)","Cable Side Crunch"]],
  ["Rotation", ["Torso Rotations (cable/band)","Russian Twists","Landmine Rotations"]],
  ["Anti-Flexion", ["Back Extension Isometric Hold","Good Morning Isometric Hold","Suitcase Deadlift Hold"]],
  ["Anti-Extension", ["Dead Bug","Ab Wheel Rollout","Stir-the-Pot (stability ball plank)"]],
  ["Anti-Lateral-Flexion", ["Suitcase Carry","Side Plank","Copenhagen Plank"]],
  ["Anti-Rotation", ["Pallof Press","Landmine Anti-Rotation Press","Renegade Row"]],
  ["Force Transfer", ["Medicine Ball Rotational Throw","Cable Chop (high-to-low)","Cable Lift (low-to-high)"]],
  ["Bracing / IAP", ["90/90 Breathing","Dead Bug with Exhale Cueing","Plank with Weight Release"]]
];
function gsearch(name){ return "https://www.google.com/search?q=" + encodeURIComponent(name + " exercise how to"); }
let refHtml = '<table class="ref-table"><tr><th>Function</th><th>Option 1</th><th>Option 2</th><th>Option 3</th></tr>';
funcRef.forEach(([fn, opts]) => {
  refHtml += `<tr><td><b>${fn}</b></td>` + opts.map(o => `<td><a href="${gsearch(o)}" target="_blank" rel="noopener">${o}</a></td>`).join('') + '</tr>';
});
refHtml += '</table>';
document.getElementById('func-ref-table').innerHTML = refHtml;

/* ---------------- FUNCTION DETAIL PAGES ---------------- */
const funcDetails = [
  {name:"Flexion", cat:"Movement-Production", status:"RESOLVED — v1.6.1", trainedBy:"Cable Crunches on Sunday Recovery (2 × 10–12)",
   items:[["Cable Crunches","Primary"],["Hanging Leg Raise (curl, not just raise)","Primary"],["Sit-ups","Primary"],
     ["Abdominal Crunch","Additional"],["V-Up","Additional"],["Swiss Ball Jackknife","Additional"],
     ["Barbell Rollout","Additional"],["Dragon Flag","Additional"],["Medicine Ball Slam","Additional"]],
   note:"Not spinal core: Reverse Crunch, Foam Roller Reverse Crunch on Bench, Leg Raises, Swiss Ball Pike, Hanging Leg Raises (raise only — no curl), Mountain Climber, and Flutter Kicks move the femur/pelvis at the hip, not the spine — don't credit them here."},
  {name:"Extension", cat:"Movement-Production", status:"RESOLVED — v1.6.1", trainedBy:"Back Extensions on Sunday Recovery (2 × 10–12)",
   items:[["Back Extension (hyperextension)","Primary"],["Reverse Hyper","Primary"],["Superman","Primary"]]},
  {name:"Lateral Flexion", cat:"Movement-Production", status:"RESOLVED — v1.6.1", trainedBy:"Cable Side Bends on Sunday Recovery (2 × 10–12 each side)",
   items:[["Cable Side Bend","Primary"],["Standing Oblique Crunch (cable)","Primary"],["Cable Side Crunch","Primary"],["Side Crunch (bodyweight)","Additional"]]},
  {name:"Rotation", cat:"Movement-Production", status:"Light", trainedBy:"Torso Rotations (Core slot) — unloaded, 2 × 10",
   items:[["Torso Rotations (cable/band)","Primary"],["Russian Twists","Primary"],["Landmine Rotations","Primary"],["Bicycle Crunch","Additional"]]},
  {name:"Anti-Flexion", cat:"Anti-Movement / Stability", status:"Trained, uncredited",
   trainedBy:"Never programmed directly, but demanded hard by every heavy hinge/row — RDL, Stiff Leg Deadlifts, Bent Over Rows, Landmine/T-Bar Row",
   items:[["Back Extension Isometric Hold","Primary"],["Good Morning Isometric Hold","Primary"],["Suitcase Deadlift Hold","Primary"]]},
  {name:"Anti-Extension", cat:"Anti-Movement / Stability", status:"Trained", trainedBy:"Dead Bug (Core slot); incidentally via overhead pressing",
   items:[["Dead Bug","Primary"],["Ab Wheel Rollout","Primary"],["Stir-the-Pot (stability ball plank)","Primary"],
     ["Hollow Hold","Additional"],["L-Sit","Additional"],["Swiss Ball Exchange","Additional"],
     ["Plank","Plank Variation"],["Forearm Plank Leg Lift","Plank Variation"],["Swiss Ball Plank","Plank Variation"],
     ["Plank with Weight Release","Plank Variation"],["Bear Crawl Hold","Plank Variation"]]},
  {name:"Anti-Lateral-Flexion", cat:"Anti-Movement / Stability", status:"Formalized",
   trainedBy:"Pallof Press on Monday/Saturday, Suitcase Carry on Thursday, per each day's Core Programming Note; Copenhagen Plank hits it as a side effect on Tuesday",
   items:[["Suitcase Carry","Primary"],["Side Plank","Primary"],["Copenhagen Plank","Primary"],
     ["Three Point Plank","Plank Variation"],["Two Point Plank (contralateral limbs lifted)","Plank Variation"]]},
  {name:"Anti-Rotation", cat:"Anti-Movement / Stability", status:"Strong",
   trainedBy:"Pallof Press (Core slot); incidentally via nearly every unilateral lift — Bulgarian Split Squats, Reverse Lunges, Step Ups, Cossack Squats, Single-Arm Cable Pressdowns",
   items:[["Pallof Press","Primary"],["Landmine Anti-Rotation Press","Primary"],["Renegade Row","Primary"],
     ["Turkish Get-Up (loaded transition, not just a hold)","Additional"],
     ["T-Plank","Plank Variation"],["Plank Shoulder Tap","Plank Variation"],["Rainbow Plank","Plank Variation"]]},
  {name:"Force Transfer", cat:"Outside the 2×4 grid", status:"RESOLVED — v1.6.1", trainedBy:"Medicine Ball Rotational Throws in Potentiate on Monday and Thursday",
   items:[["Medicine Ball Rotational Throw","Primary"],["Cable Chop (high-to-low)","Primary"],["Cable Lift (low-to-high)","Primary"]]},
  {name:"Bracing / IAP", cat:"Outside the 2×4 grid", status:"RESOLVED — v1.6.1",
   trainedBy:"Cued on Tuesday (squats) and Friday (hinges); Bear Crawl/Crawl patterns reinforce; Dead Bug in Core slot",
   items:[["90/90 Breathing","Primary"],["Dead Bug with Exhale Cueing","Primary"],["Plank with Weight Release","Primary"],
     ["Bird Dog (Quadruped)","Additional"],["Cat-Camel (breath/brace coordination through motion)","Additional"],
     ["Bear Crawl","Additional"],["Farmer's Carry","Additional"],["Glute Bridge","Additional"]]}
];
const fdWrap = document.getElementById('func-detail');
funcDetails.forEach(f => {
  const det = document.createElement('details');
  det.className = 'func-card';
  const rows = f.items.map(([n,t]) => `<tr><td><a href="${gsearch(n)}" target="_blank" rel="noopener">${n}</a></td><td>${t}</td></tr>`).join('');
  det.innerHTML = `
    <summary><span class="fname">${f.name}</span><span class="badge ${/RESOLVED/.test(f.status)?'resolved':(/Open/.test(f.status)?'open':'light')}">${f.status}</span></summary>
    <div class="fbody">
      <div class="trained-by"><i>${f.cat}</i> — <b>Trained by:</b> ${f.trainedBy}</div>
      <table>${rows}</table>
      ${f.note ? `<p style="font-size:12.5px;color:var(--muted-2);margin-top:10px;font-style:italic;">${f.note}</p>` : ''}
    </div>`;
  fdWrap.appendChild(det);
});

/* ---------------- SITE SEARCH ---------------- */
// Build a search index from every tab panel's meaningful text nodes.
// Runs last so it also picks up the JS-generated drill index, function
// reference table, and function detail cards above.
const SEARCH_SELECTORS = 'td, p, li, h2, h3, h4, .callout, .name, .drill-index a, .fname, caption, .timer-name, .timer-spec';
let searchIndex = [];

function buildSearchIndex(){
  searchIndex = [];
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const tabId = panel.id.replace('tab-', '');
    const seen = new Set();
    panel.querySelectorAll(SEARCH_SELECTORS).forEach(el => {
      // Skip containers whose text is already captured by a more specific descendant match
      if (el.children.length && el.matches('p, li') && el.querySelector('a')) {
        // still index — paragraphs with links are fine, just dedupe by text below
      }
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 3 || text.length > 400) return;
      const key = tabId + '|' + text;
      if (seen.has(key)) return;
      seen.add(key);
      let loc = '';
      const table = el.closest('table.block');
      if (table) {
        const cap = table.querySelector('caption');
        if (cap) loc = cap.textContent.trim();
      } else if (el.closest('.func-card')) {
        loc = 'Function detail';
      } else if (el.closest('#drill-index')) {
        loc = 'Drill index';
      } else if (el.closest('.hold-strip')) {
        loc = 'Signature hold';
      } else if (el.closest('.callout')) {
        loc = 'Note';
      }
      searchIndex.push({tab: tabId, text, loc, el});
    });
  });
}
buildSearchIndex();

const searchInput = document.getElementById('site-search');
const searchResultsEl = document.getElementById('search-results');
const searchClearBtn = document.getElementById('search-clear');
let selIndex = -1;

function escapeHtml(s){
  return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}
function highlight(text, q){
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return escapeHtml(text);
  return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i+q.length)) + '</mark>' + escapeHtml(text.slice(i+q.length));
}

function runSearch(q){
  q = q.trim();
  selIndex = -1;
  if (q.length < 2) {
    searchResultsEl.classList.remove('show');
    searchResultsEl.innerHTML = '';
    return;
  }
  const ql = q.toLowerCase();
  const matches = searchIndex.filter(item => item.text.toLowerCase().includes(ql));
  // De-dupe near-identical snippets, cap results
  const out = [];
  const seenText = new Set();
  for (const m of matches) {
    const shortKey = m.text.slice(0, 60);
    if (seenText.has(shortKey)) continue;
    seenText.add(shortKey);
    out.push(m);
    if (out.length >= 25) break;
  }
  if (!out.length) {
    searchResultsEl.innerHTML = `<div class="sr-empty">No matches for "${escapeHtml(q)}"</div>`;
    searchResultsEl.classList.add('show');
    return;
  }
  searchResultsEl.innerHTML = out.map((m, i) => `
    <button type="button" class="sr-item" data-i="${i}">
      <span class="sr-tab">${tabLabels[m.tab] || m.tab}</span>${m.loc ? '<span class="sr-loc">— ' + escapeHtml(m.loc) + '</span>' : ''}
      <span class="sr-snip">${highlight(m.text.length > 140 ? m.text.slice(0,140) + '…' : m.text, q)}</span>
    </button>`).join('');
  searchResultsEl.classList.add('show');
  searchResultsEl.querySelectorAll('.sr-item').forEach((btn, i) => {
    btn.addEventListener('click', () => jumpToResult(out[i], q));
  });
}

function jumpToResult(match, q){
  previousLocation = {
    tab: getCurrentTab(),
    scrollY: window.scrollY
  };
  switchTab(match.tab, false);
  searchResultsEl.classList.remove('show');
  requestAnimationFrame(() => {
    match.el.scrollIntoView({behavior:'smooth', block:'center'});
    match.el.classList.add('search-jump-flash');
    setTimeout(() => match.el.classList.add('fade'), 50);
    setTimeout(() => match.el.classList.remove('search-jump-flash','fade'), 1700);
  });
  backPillLabel.textContent = 'Back to ' + (tabLabels[previousLocation.tab] || previousLocation.tab);
  backPill.classList.add('show');
}

backPill.addEventListener('click', () => {
  if (!previousLocation) return;
  const target = previousLocation;
  switchTab(target.tab, false);
  requestAnimationFrame(() => window.scrollTo({top: target.scrollY, behavior:'smooth'}));
  hideBackPill();
});

searchInput.addEventListener('input', (e) => {
  searchClearBtn.classList.toggle('show', e.target.value.length > 0);
  runSearch(e.target.value);
});
searchInput.addEventListener('keydown', (e) => {
  const items = [...searchResultsEl.querySelectorAll('.sr-item')];
  if (!items.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); selIndex = Math.min(selIndex+1, items.length-1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); selIndex = Math.max(selIndex-1, 0); }
  else if (e.key === 'Enter') { e.preventDefault(); items[selIndex >= 0 ? selIndex : 0].click(); return; }
  else if (e.key === 'Escape') { searchResultsEl.classList.remove('show'); searchInput.blur(); return; }
  else return;
  items.forEach(it => it.classList.remove('sel'));
  items[selIndex].classList.add('sel');
  items[selIndex].scrollIntoView({block:'nearest'});
});
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.classList.remove('show');
  searchResultsEl.classList.remove('show');
  searchInput.focus();
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) searchResultsEl.classList.remove('show');
});

/* ---------------- INTERVAL TIMER ENGINE ---------------- */
function fmtClock(sec){
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec/60), s = sec%60;
  return m + ':' + String(s).padStart(2,'0');
}

function playTone(freq, dur){
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    playTone._ctx = playTone._ctx || new Ctx();
    const ctx = playTone._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch(e) { /* audio not available — fail silently */ }
}

function createIntervalTimer(ids, getConfig, opts){
  opts = opts || {};
  const els = {};
  for (const key in ids) els[key] = document.getElementById(ids[key]);
  // opts.labelMap lets a themed timer (e.g. Bring Sally Up) relabel
  // phases as "UP"/"DOWN" instead of "WORK"/"REST" — purely cosmetic,
  // the underlying phase.type driving data-phase (and its CSS) is
  // unchanged, so Tabata/Custom's own styling keeps working untouched.
  const labelMap = Object.assign({prep:'GET READY', work:'WORK', rest:'REST', restSet:'REST BETWEEN SETS', cooldown:'COOL DOWN', done:'DONE'}, opts.labelMap || {});

  let sequence = [];
  let seqIndex = 0;
  let remaining = 0;
  let running = false;
  let rafId = null;
  let lastTs = null;

  // cfg: {prep, work, rest, cycles, sets, restBetweenSets, cooldown}
  function buildSequence(cfg){
    const seq = [];
    if (cfg.prep > 0) seq.push({type:'prep', duration:cfg.prep, cycle:0, set:1});
    for (let s = 1; s <= cfg.sets; s++){
      for (let c = 1; c <= cfg.cycles; c++){
        seq.push({type:'work', duration:cfg.work, cycle:c, set:s});
        seq.push({type:'rest', duration:cfg.rest, cycle:c, set:s});
      }
      if (s < cfg.sets && cfg.restBetweenSets > 0){
        seq.push({type:'restSet', duration:cfg.restBetweenSets, cycle:cfg.cycles, set:s});
      }
    }
    if (cfg.cooldown > 0) seq.push({type:'cooldown', duration:cfg.cooldown, cycle:cfg.cycles, set:cfg.sets});
    seq.push({type:'done', duration:0, cycle:cfg.cycles, set:cfg.sets});
    return seq;
  }

  function totalSeconds(cfg){
    return cfg.prep
      + cfg.sets * cfg.cycles * (cfg.work + cfg.rest)
      + Math.max(0, cfg.sets - 1) * cfg.restBetweenSets
      + cfg.cooldown;
  }

  function updateTotalLabel(){
    if (!els.total) return;
    const cfg = getConfig();
    els.total.textContent = fmtClock(totalSeconds(cfg)) + ' total';
  }

  function render(){
    const phase = sequence[seqIndex];
    if (!phase) return;
    const cfg = getConfig();
    els.clock.textContent = fmtClock(remaining);
    els.phase.textContent = labelMap[phase.type] || '';
    const restLike = (phase.type === 'restSet' || phase.type === 'cooldown') ? 'rest' : phase.type;
    els.card.setAttribute('data-phase', phase.type === 'done' ? 'done' : restLike);
    if (cfg.sets > 1) {
      const shownSet = phase.type === 'done' ? cfg.sets : Math.max(phase.set, 1);
      const shownCycle = (phase.type === 'done' || phase.type === 'cooldown' || phase.type === 'restSet')
        ? cfg.cycles
        : Math.max(phase.cycle, running || seqIndex > 0 ? 1 : 0);
      els.round.textContent = 'Set ' + shownSet + '/' + cfg.sets + ' · Cycle ' + shownCycle + '/' + cfg.cycles;
    } else {
      const shownCycle = phase.type === 'done' ? cfg.cycles : Math.max(phase.cycle, running || seqIndex > 0 ? 1 : 0);
      els.round.textContent = 'Round ' + shownCycle + ' / ' + cfg.cycles;
    }
    const pct = phase.duration > 0 ? Math.min(100, (1 - remaining / phase.duration) * 100) : 100;
    if (els.progress) els.progress.style.width = pct + '%';
  }

  function tick(ts){
    if (!running) return;
    if (lastTs === null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;
    remaining -= dt;
    if (remaining <= 0) {
      advancePhase();
    } else {
      render();
      rafId = requestAnimationFrame(tick);
    }
  }

  function advancePhase(){
    seqIndex++;
    const phase = sequence[seqIndex];
    if (!phase) { finish(); return; }
    remaining = phase.duration;
    if (phase.type === 'work') playTone(1046, 0.15);
    else if (phase.type === 'rest' || phase.type === 'restSet') playTone(660, 0.15);
    else if (phase.type === 'cooldown') playTone(523, 0.2);
    else if (phase.type === 'done') { playTone(1568, 0.35); render(); finish(); return; }
    render();
    lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  function finish(){
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    els.card.setAttribute('data-phase', 'done');
    els.phase.textContent = 'DONE';
    if (els.progress) els.progress.style.width = '100%';
    els.start.disabled = false; els.start.textContent = 'Start';
    els.pause.disabled = true;
    if (opts.lockInputs) opts.lockInputs(false);
  }

  function resetInternal(){
    const cfg = getConfig();
    sequence = buildSequence(cfg);
    seqIndex = 0;
    remaining = sequence.length ? sequence[0].duration : 0;
    render();
  }

  function start(){
    if (running) return;
    if (!sequence.length || seqIndex >= sequence.length - 1) resetInternal();
    running = true;
    lastTs = null;
    els.start.disabled = true; els.start.textContent = 'Running…';
    els.pause.disabled = false;
    if (opts.lockInputs) opts.lockInputs(true);
    rafId = requestAnimationFrame(tick);
  }

  function pause(){
    if (!running) return;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    els.start.disabled = false; els.start.textContent = 'Resume';
    els.pause.disabled = true;
  }

  function reset(){
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    els.card.setAttribute('data-phase', 'idle');
    resetInternal();
    els.start.disabled = false; els.start.textContent = 'Start';
    els.pause.disabled = true;
    if (opts.lockInputs) opts.lockInputs(false);
  }

  els.start.addEventListener('click', start);
  els.pause.addEventListener('click', pause);
  els.reset.addEventListener('click', reset);

  updateTotalLabel();
  resetInternal();

  return { reset, updateTotalLabel, isRunning: () => running };
}

// Tabata — fixed 7s prep + 8 × (20s work / 10s rest), no sets/cooldown = 4:07 total
createIntervalTimer(
  {card:'tabata-card', phase:'tabata-phase', clock:'tabata-clock', round:'tabata-round', progress:'tabata-progress', total:'tabata-total', start:'tabata-start', pause:'tabata-pause', reset:'tabata-reset'},
  () => ({prep:7, work:20, rest:10, cycles:8, sets:1, restBetweenSets:0, cooldown:0})
);

// Bring Sally Up — 5s prep + 30 × (2s UP / 5s DOWN-hold), no sets/cooldown =
// 3:35 total, approximating the real song's ~3:32 runtime and ~30-rep
// count (see the Challenges tab's own note on why this is a pacer, not a
// reproduction of the actual track). "work"/"rest" relabeled to "UP"/
// "DOWN" via opts.labelMap; data-phase (and its CSS) is untouched.
createIntervalTimer(
  {card:'sally-card', phase:'sally-phase', clock:'sally-clock', round:'sally-round', progress:'sally-progress', total:'sally-total', start:'sally-start', pause:'sally-pause', reset:'sally-reset'},
  () => ({prep:5, work:2, rest:5, cycles:30, sets:1, restBetweenSets:0, cooldown:0}),
  {labelMap: {work:'UP', rest:'DOWN'}}
);

// Custom — every field editable, live total, locks while running
(function(){
  const fieldIds = {
    prep:'custom-prep', work:'custom-work', rest:'custom-rest', cycles:'custom-cycles',
    sets:'custom-sets', restBetweenSets:'custom-restsets', cooldown:'custom-cooldown'
  };
  const fieldEls = {};
  for (const k in fieldIds) fieldEls[k] = document.getElementById(fieldIds[k]);

  function readConfig(){
    const clamp = (v, min, max, fallback) => {
      v = parseInt(v, 10);
      if (isNaN(v)) return fallback;
      return Math.max(min, Math.min(max, v));
    };
    return {
      prep: clamp(fieldEls.prep.value, 0, 3600, 10),
      work: clamp(fieldEls.work.value, 1, 3600, 30),
      rest: clamp(fieldEls.rest.value, 0, 3600, 15),
      cycles: clamp(fieldEls.cycles.value, 1, 99, 6),
      sets: clamp(fieldEls.sets.value, 1, 20, 1),
      restBetweenSets: clamp(fieldEls.restBetweenSets.value, 0, 3600, 0),
      cooldown: clamp(fieldEls.cooldown.value, 0, 3600, 0)
    };
  }

  const customTimer = createIntervalTimer(
    {card:'custom-card', phase:'custom-phase', clock:'custom-clock', round:'custom-round', progress:'custom-progress', total:'custom-total', start:'custom-start', pause:'custom-pause', reset:'custom-reset'},
    readConfig,
    {lockInputs: (locked) => { for (const k in fieldEls) fieldEls[k].disabled = locked; }}
  );

  for (const k in fieldEls) {
    fieldEls[k].addEventListener('input', () => {
      customTimer.updateTotalLabel();
      customTimer.reset();
    });
  }

  // "Load into Custom" preset buttons on the Training Formats cards below
  const dataAttrMap = {
    prep:'prep', work:'work', rest:'rest', cycles:'cycles',
    sets:'sets', restBetweenSets:'restsets', cooldown:'cooldown'
  };
  document.querySelectorAll('.format-card').forEach(card => {
    const btn = card.querySelector('.format-load-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      for (const k in fieldEls) {
        const attrVal = card.getAttribute('data-' + dataAttrMap[k]);
        if (attrVal !== null) fieldEls[k].value = attrVal;
      }
      customTimer.updateTotalLabel();
      customTimer.reset();
      const customCardEl = document.getElementById('custom-card');
      customCardEl.scrollIntoView({behavior:'smooth', block:'center'});
      customCardEl.classList.add('format-load-flash');
      setTimeout(() => customCardEl.classList.add('fade'), 50);
      setTimeout(() => customCardEl.classList.remove('format-load-flash','fade'), 1500);
    });
  });
})();

/* ---------------- LIVE MESSAGE ALERTS ----------------
   Every message already inserts a row into notifications (send_message,
   send_direct_message). With that table in Supabase Realtime
   (sql/57-realtime-notifications.sql) the app hears each new row the
   moment it's written — filtered to the signed-in user, and Realtime
   applies the table's RLS too. For a message it then:
     - refreshes the open Inbox / Messages view right away,
     - updates the bell and INBOX counts,
     - and, unless you're already looking at that screen, plays a short
       chime, shows a clickable pop-up and (tab in the background, if
       allowed) a system notification.
   Sound on/off and "Enable desktop alerts" live in the bell menu. */
(function(){
  const SOUND_KEY = 'bnb-msg-sound'; // per-device preference
  let soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch(e){}

  // Browsers only allow audio after the person has interacted with the
  // page, so the audio context is created/resumed on the first tap/key.
  let audioCtx = null;
  function unlockAudio(){
    try {
      if (!audioCtx){ const AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch(e){}
  }
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));
  // Two soft rising notes (~0.35s), generated — no sound file to load.
  function chime(){
    if (!soundOn || !audioCtx || audioCtx.state !== 'running') return;
    const t0 = audioCtx.currentTime;
    [[880, 0], [1318.5, 0.12]].forEach(([freq, delay]) => {
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.22);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0 + delay); osc.stop(t0 + delay + 0.25);
    });
  }

  // Booking notifications (sql/62) also get the chime and pop-up.
  const BOOKING_TYPES = ['class_booked', 'class_cancelled', 'waitlist_promoted', 'pt_booked', 'pt_cancelled', 'booking_reminder', 'class_moved', 'pt_moved'];

  // Which screen shows each kind of message (notification link_tab).
  function viewFor(link){
    if (link === 'inbox') return { el: document.getElementById('tab-inbox'), active: el => el.classList.contains('active'), refresh: window.bnbInboxOnTabShown };
    if (link === 'messages') return { el: document.getElementById('messages-body'), active: el => !!el.offsetParent, refresh: window.bnbMessagesOnTabShown };
    if (link === 'coach') return { el: document.getElementById('coach-messages-body'), active: el => !!el.offsetParent, refresh: window.bnbMessagesStaffOnTabShown };
    return null;
  }
  function onScreen(link){
    const v = viewFor(link);
    return document.visibilityState === 'visible' && !!(v && v.el && v.active(v.el));
  }
  function openConversation(link){
    if (typeof window.switchSite === 'function') window.switchSite('gym');
    if (link === 'coach' || link === 'roster'){
      switchTab('coach');
      const b = document.querySelector('#coach-section-switch [data-coach-section="' + (link === 'roster' ? 'roster' : 'messages') + '"]');
      if (b) b.click();
    } else {
      switchTab(link);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  let popup = null, popupTimer = null;
  function showPopup(n){
    if (!popup){
      popup = document.createElement('button');
      popup.type = 'button';
      popup.className = 'msg-alert';
      popup.setAttribute('role', 'status');
      document.body.appendChild(popup);
    }
    const icon = BOOKING_TYPES.includes(n.type) ? '📅' : '💬';
    popup.innerHTML = '<span class="msg-alert-icon" aria-hidden="true">' + icon + '</span><span class="msg-alert-text"></span><span class="msg-alert-go" aria-hidden="true">Open →</span>';
    popup.querySelector('.msg-alert-text').textContent = n.message;
    popup.onclick = () => { popup.classList.remove('show'); openConversation(n.link_tab); };
    popup.classList.add('show');
    clearTimeout(popupTimer);
    popupTimer = setTimeout(() => popup.classList.remove('show'), 7000);
  }
  async function systemNotify(n){
    if (document.visibilityState === 'visible') return; // the pop-up covers it
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const title = "Bell(e)s n' Barz";
    const opts = { body: n.message, icon: 'icon.svg', tag: 'bnb-message' };
    try {
      // iOS only shows notifications through a service worker (sw.js).
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification){ await reg.showNotification(title, opts); return; }
    } catch(e){}
    try { new Notification(title, opts); } catch(e){}
  }

  // Exposed so it can be exercised without a real insert.
  window.bnbHandleNotification = function(n){
    if (!n) return;
    if (typeof refreshUnreadCount === 'function') refreshUnreadCount();
    if (window.bnbInboxRefreshBadge) window.bnbInboxRefreshBadge();
    const MESSAGE_TYPES = ['new_direct_message', 'new_message', 'new_group_message', 'group_added'];
    if (BOOKING_TYPES.includes(n.type)){
      // Bookings changed — redraw Booking/Coach if open, then alert.
      if (typeof window.schedRefreshBookings === 'function') window.schedRefreshBookings();
      chime();
      showPopup(n);
      systemNotify(n);
      return;
    }
    if (!MESSAGE_TYPES.includes(n.type)) return;
    const v = viewFor(n.link_tab);
    const looking = onScreen(n.link_tab);
    if (v && v.el && v.active(v.el) && typeof v.refresh === 'function') v.refresh();
    if (looking) return; // already in front of you — no need to make noise
    chime();
    showPopup(n);
    systemNotify(n);
  };

  let channel = null, channelUser = null;
  function resubscribe(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const uid = me ? me.id : null;
    if (uid === channelUser) return;
    if (channel){ bnbClient.removeChannel(channel); channel = null; }
    channelUser = uid;
    if (!uid) return;
    channel = bnbClient.channel('notifications:' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + uid },
          payload => window.bnbHandleNotification(payload.new))
      .subscribe();
  }
  window.bnbLiveAlertsResubscribe = resubscribe;
  if (window.bnbSessionReady) window.bnbSessionReady.then(resubscribe, () => {});

  // ---- Settings in the bell menu ----
  const soundToggle = document.getElementById('notif-sound-toggle');
  if (soundToggle){
    soundToggle.checked = soundOn;
    soundToggle.addEventListener('change', () => {
      soundOn = soundToggle.checked;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch(e){}
      if (soundOn){ unlockAudio(); setTimeout(chime, 50); } // play a sample
    });
  }
  const desktopBtn = document.getElementById('notif-desktop-btn');
  const desktopHint = document.getElementById('notif-desktop-hint');
  function hint(text){ if (desktopHint){ desktopHint.hidden = !text; desktopHint.textContent = text || ''; } }
  function refreshDesktopBtn(){
    if (!desktopBtn) return;
    if (!('Notification' in window)){ desktopBtn.hidden = true; hint('This browser doesn\'t support desktop alerts.'); return; }
    const p = Notification.permission;
    desktopBtn.hidden = p !== 'default';
    hint(p === 'granted' ? 'Desktop alerts are on for this device.' :
         p === 'denied' ? 'Desktop alerts are blocked — allow notifications for this site in your browser settings.' : '');
  }
  if (desktopBtn){
    refreshDesktopBtn();
    desktopBtn.addEventListener('click', async () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (ios && !standalone){ hint('On iPhone/iPad: add this site to your Home Screen (Share → Add to Home Screen), open it from there, then enable alerts.'); return; }
      try { if (navigator.serviceWorker) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch(e){}
      try { await Notification.requestPermission(); } catch(e){}
      refreshDesktopBtn();
    });
  }
})();

/* ---------------- TYPING INDICATOR ----------------
   "Alice is typing…" for Inbox and Messages, over Supabase Realtime
   broadcast: nothing is stored, the other person's browser just hears a
   short signal on a channel named after the conversation. The signal
   carries only the sender's user id and whether they're staff — never
   the text. Each view creates its own indicator:

     const typing = window.bnbTyping();
     typing.join(conversationKey, me.id, who => show/hide, onRead)  // after each render
     typing.notify(role) / typing.stop(role)                        // from the textarea
     typing.read(role, lastMessageAt)   // "I've read up to now" -> the other side's
                                        // onRead({uid, role, at}) flips "Sent" to "Seen"
*/
window.bnbTyping = function(){
  const SEND_EVERY = 2000;  // at most one "typing" signal per 2s while typing
  const SHOW_FOR = 5000;    // hide if nothing heard for 5s (never gets stuck)
  let ch = null, key = null, meId = null, onUpdate = null, onReadCb = null, onReactCb = null, clearTimer = null, lastSent = 0, current = null;
  function set(who){
    current = who;
    clearTimeout(clearTimer);
    if (who) clearTimer = setTimeout(() => set(null), SHOW_FOR);
    if (onUpdate) onUpdate(who);
  }
  function send(role, typing){
    if (ch) ch.send({ type: 'broadcast', event: 'typing', payload: { uid: meId, role, typing } });
  }
  return {
    // Call after every render: same conversation keeps the channel and
    // just re-applies the current state to the freshly drawn page.
    join(newKey, myId, cb, readCb, reactCb){
      onUpdate = cb;
      onReadCb = readCb || null;
      onReactCb = reactCb || null;
      if (newKey && newKey === key && ch){ cb(current); return; }
      this.leave();
      if (!newKey) return;
      key = newKey; meId = myId;
      ch = bnbClient.channel('typing:' + newKey, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.uid === meId) return; // my own other tabs
        set(payload.typing ? payload : null);
      });
      // Someone changed a reaction: the other side refetches that message's.
      ch.on('broadcast', { event: 'react' }, ({ payload }) => {
        if (!payload || payload.uid === meId) return;
        if (onReactCb) onReactCb(payload.messageId);
      });
      ch.on('broadcast', { event: 'read' }, ({ payload }) => {
        if (!payload || payload.uid === meId) return;
        set(null); // they've opened it; any "typing" from before is stale
        if (onReadCb) onReadCb(payload);
      });
      ch.subscribe();
      cb(null);
    },
    notify(role){
      const now = Date.now();
      if (now - lastSent < SEND_EVERY) return;
      lastSent = now;
      send(role, true);
    },
    stop(role){
      if (!lastSent) return; // never said we were typing
      lastSent = 0;
      send(role, false);
    },
    // Tell the other side I've read the conversation. The time sent is
    // now, or the last message's own time if the server's clock is ahead
    // of this device's, so it always counts as "after" that message.
    read(role, lastMessageAt){
      if (!ch) return;
      const at = new Date(Math.max(Date.now(), lastMessageAt ? new Date(lastMessageAt).getTime() : 0)).toISOString();
      ch.send({ type: 'broadcast', event: 'read', payload: { uid: meId, role, at } });
    },
    reacted(messageId){
      if (ch) ch.send({ type: 'broadcast', event: 'react', payload: { uid: meId, messageId } });
    },
    leave(){
      if (ch) bnbClient.removeChannel(ch);
      ch = null; key = null; lastSent = 0;
      set(null);
    }
  };
};

/* ---------------- MESSAGE ATTACHMENTS ----------------
   Photos and files in Inbox and Messages (sql/60-message-attachments.sql).
   Files go to the private message-files bucket under the sender's own
   folder; bubbles show them through short-lived signed URLs, which
   Storage only issues to people allowed to read that message. Each view:
     composeExtrasHtml(p) / pendingHtml(p)   📎 button + picked-file chip
     wire(p, { get, set })                   handles picking/clearing
     upload(pending, me.id) -> attachment    then pass it to the send RPC
     bubbleHtml(m.attachment) + fill(root)   show it in the thread
*/
window.bnbAttach = (function(){
  const MAX = 10 * 1024 * 1024;
  // Must match allowed_mime_types on the bucket (sql/60).
  const TYPES = {
    'image/jpeg':1, 'image/png':1, 'image/gif':1, 'image/webp':1, 'image/heic':1, 'image/heif':1,
    'application/pdf':1, 'text/plain':1, 'text/csv':1,
    'application/msword':1, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':1,
    'application/vnd.ms-excel':1, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':1,
    'application/vnd.ms-powerpoint':1, 'application/vnd.openxmlformats-officedocument.presentationml.presentation':1
  };
  // Some systems report '' for these; go by the extension instead.
  const BY_EXT = { csv:'text/csv', txt:'text/plain', heic:'image/heic', heif:'image/heif', pdf:'application/pdf',
    doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls:'application/vnd.ms-excel', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt:'application/vnd.ms-powerpoint', pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
  const ACCEPT = 'image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fmtSize = n => n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const isImage = type => /^image\/(jpeg|png|gif|webp)$/.test(type || ''); // ones browsers can show inline
  function fileIcon(type){
    if (/pdf/.test(type)) return '📕';
    if (/sheet|excel|csv/.test(type)) return '📊';
    if (/presentation|powerpoint/.test(type)) return '📽️';
    if (/^image\//.test(type)) return '🖼️';
    return '📄';
  }
  function toast(msg){
    const t = document.getElementById('t-toast');
    if (t){ t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
  }

  // Big photos are shrunk to 1600px (JPEG) before upload — phone photos
  // are often 4–8 MB and nobody needs that in a chat. GIFs stay as they
  // are (they may be animated).
  async function shrinkImage(file){
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 600 * 1024) return null;
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 1.5 * 1048576) return null;
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); // PNG transparency -> white
      ctx.drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85));
      return blob && blob.size < file.size ? blob : null;
    } catch(e){ return null; }
  }
  // -> { blob, name, type, size } or null (and a message) if not allowed.
  async function prepare(file){
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let type = TYPES[file.type] ? file.type : (BY_EXT[ext] || '');
    if (!type){ toast('That kind of file can\'t be sent — try a photo, PDF, Office document or text file.'); return null; }
    let blob = file, name = file.name;
    const smaller = await shrinkImage(file);
    if (smaller){ blob = smaller; type = 'image/jpeg'; name = name.replace(/\.(png|webp|jpe?g)$/i, '') + '.jpg'; }
    if (blob.size > MAX){ toast('That file is ' + fmtSize(blob.size) + ' — the limit is 10 MB.'); return null; }
    return { blob, name, type, size: blob.size };
  }
  async function upload(pending, meId){
    const safe = pending.name.replace(/[^\w.\-]+/g, '_').slice(-80) || 'file';
    const path = meId + '/' + (window.BNB_UUID ? window.BNB_UUID() : Date.now()) + '-' + safe;
    const { error } = await bnbClient.storage.from('message-files').upload(path, pending.blob, { contentType: pending.type, upsert: false });
    if (error) throw error;
    return { path, name: pending.name, size: pending.size, type: pending.type };
  }

  // ---- Compose: 📎 button, hidden file input, picked-file chip ----
  function composeExtrasHtml(p){
    return '<button type="button" class="msg-attach-btn" id="' + p + '-attach" title="Attach a photo or file" aria-label="Attach a photo or file">📎</button>'
      + '<input type="file" id="' + p + '-file" accept="' + ACCEPT + '" hidden>';
  }
  function pendingHtml(p){ return '<div class="msg-pending" id="' + p + '-pending" hidden></div>'; }
  function drawPending(p, pending, onClear){
    const box = document.getElementById(p + '-pending');
    if (!box) return;
    box.hidden = !pending;
    if (!pending){ box.innerHTML = ''; return; }
    box.innerHTML = '<span class="msg-pending-icon" aria-hidden="true">' + fileIcon(pending.type) + '</span>'
      + '<span class="msg-pending-name">' + esc(pending.name) + '</span><span class="msg-pending-size">' + fmtSize(pending.size) + '</span>'
      + '<button type="button" class="msg-pending-clear" aria-label="Remove attachment">×</button>';
    box.querySelector('.msg-pending-clear').addEventListener('click', onClear);
  }
  // state: { get: () => pending, set: pending => … } — kept by the view so a
  // re-render (auto-refresh) doesn't drop a picked file.
  function wire(p, state){
    const btn = document.getElementById(p + '-attach'), input = document.getElementById(p + '-file');
    if (!btn || !input) return;
    const clear = () => { state.set(null); drawPending(p, null); };
    drawPending(p, state.get(), clear);
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      btn.disabled = true;
      const pending = await prepare(file);
      btn.disabled = false;
      if (!pending) return;
      state.set(pending);
      drawPending(p, pending, clear);
    });
  }

  // ---- Showing attachments in bubbles ----
  function bubbleHtml(att){
    if (!att || !att.path) return '';
    return '<div class="msg-att" data-att="' + esc(encodeURIComponent(JSON.stringify(att))) + '"><span class="msg-att-loading">' + fileIcon(att.type) + ' ' + esc(att.name) + '</span></div>';
  }
  const urlCache = {}; // path -> { url, until }
  async function signedUrls(paths){
    const now = Date.now(), need = paths.filter(p => !(urlCache[p] && urlCache[p].until > now));
    if (need.length){
      const { data, error } = await bnbClient.storage.from('message-files').createSignedUrls(need, 3600);
      if (!error) (data || []).forEach(d => { if (d.signedUrl) urlCache[d.path] = { url: d.signedUrl, until: now + 50 * 60 * 1000 }; });
    }
    const out = {};
    paths.forEach(p => { if (urlCache[p]) out[p] = urlCache[p].url; });
    return out;
  }
  async function fill(root){
    if (!root) return;
    const els = [...root.querySelectorAll('.msg-att[data-att]:not([data-filled])')];
    if (!els.length) return;
    const atts = els.map(el => { try { return JSON.parse(decodeURIComponent(el.getAttribute('data-att'))); } catch(e){ return null; } });
    const urls = await signedUrls([...new Set(atts.filter(Boolean).map(a => a.path))]);
    els.forEach((el, i) => {
      const a = atts[i], url = a && urls[a.path];
      el.setAttribute('data-filled', '1');
      if (!a || !url){ el.innerHTML = '<span class="msg-att-missing">' + fileIcon(a && a.type) + ' ' + esc(a ? a.name : 'File') + ' (unavailable)</span>'; return; }
      if (isImage(a.type)){
        el.innerHTML = '<a class="msg-att-img" href="' + esc(url) + '" target="_blank" rel="noopener" title="Open full size">'
          + '<img src="' + esc(url) + '" alt="' + esc(a.name) + '" loading="lazy"></a>';
      } else {
        const dl = url + (url.includes('?') ? '&' : '?') + 'download=' + encodeURIComponent(a.name);
        el.innerHTML = '<a class="msg-att-file" href="' + esc(dl) + '" rel="noopener">'
          + '<span class="msg-att-icon" aria-hidden="true">' + fileIcon(a.type) + '</span>'
          + '<span class="msg-att-meta"><span class="msg-att-name">' + esc(a.name) + '</span><span class="msg-att-size">' + fmtSize(a.size || 0) + ' · Download</span></span></a>';
      }
    });
    // Keep the thread pinned to the bottom once photos have their height.
    root.querySelectorAll('.msg-att-img img').forEach(img => img.addEventListener('load', () => {
      const thread = img.closest('.msg-thread');
      if (thread && thread.scrollHeight - thread.scrollTop - thread.clientHeight < 400) thread.scrollTop = thread.scrollHeight;
    }, { once: true }));
  }

  return { composeExtrasHtml, pendingHtml, wire, upload, bubbleHtml, fill, drawPending };
})();

/* ---------------- MESSAGE REACTIONS ----------------
   Shared by Inbox and Messages. Each bubble gets a small ☺ button that
   opens a row of six emoji; reactions show as chips under the bubble
   ("👍 2"), yours highlighted, and tapping a chip toggles yours. The
   emoji list must match reaction_emoji_allowed() in
   sql/58-message-reactions.sql. Each view supplies how to load/toggle
   (the two message systems use different tables) via attach():

     window.bnbReactions.attach(rootEl, {
       meId: () => me.id,
       list: messageId => [{ user_id, emoji }, …],   // current reactions
       set:  (messageId, list) => …,                 // store a new list
       toggle: (messageId, emoji) => Promise,        // the RPC
       changed: messageId => …                       // e.g. tell the other side
     });
*/
window.bnbReactions = (function(){
  const EMOJI = ['👍', '❤️', '😂', '💪', '🔥', '🙏'];
  function rowHtml(list, meId){
    list = list || [];
    return EMOJI.map(e => {
      const n = list.filter(r => r.emoji === e).length;
      if (!n) return '';
      const mine = list.some(r => r.emoji === e && r.user_id === meId);
      return '<button type="button" class="msg-react-chip' + (mine ? ' mine' : '') + '" data-emoji="' + e + '"'
        + ' aria-pressed="' + mine + '" title="' + (mine ? 'You reacted — tap to remove' : 'Tap to add yours') + '">'
        + e + '<span class="n">' + n + '</span></button>';
    }).join('');
  }
  // Markup each view adds inside a bubble (data-msg-id goes on the bubble).
  function bubbleExtrasHtml(list, meId){
    return '<button type="button" class="msg-react-btn" aria-label="Add a reaction" title="React">☺</button>'
      + '<div class="msg-reactions">' + rowHtml(list, meId) + '</div>';
  }
  function pickerHtml(){
    return '<div class="msg-react-picker" role="group" aria-label="Pick a reaction">'
      + EMOJI.map(e => '<button type="button" class="msg-react-option" data-emoji="' + e + '" aria-label="React ' + e + '">' + e + '</button>').join('')
      + '</div>';
  }
  function closePickers(root, except){
    root.querySelectorAll('.msg-react-picker').forEach(p => { if (p !== except) p.remove(); });
  }
  function redraw(root, messageId, list, meId){
    const bubble = root.querySelector('.msg-bubble[data-msg-id="' + messageId + '"]');
    const row = bubble && bubble.querySelector('.msg-reactions');
    if (row) row.innerHTML = rowHtml(list, meId);
  }
  function attach(root, opts){
    if (!root || root.__bnbReactions) return;
    root.__bnbReactions = true;
    root.addEventListener('click', async e => {
      const openBtn = e.target.closest('.msg-react-btn');
      if (openBtn && root.contains(openBtn)){
        const bubble = openBtn.closest('.msg-bubble');
        const existing = bubble.querySelector('.msg-react-picker');
        closePickers(root);
        if (!existing) bubble.querySelector('.msg-reactions').insertAdjacentHTML('beforebegin', pickerHtml());
        return;
      }
      const pick = e.target.closest('.msg-react-option, .msg-react-chip');
      if (!pick || !root.contains(pick)) return;
      const bubble = pick.closest('.msg-bubble');
      const id = bubble && bubble.getAttribute('data-msg-id');
      if (!id) return;
      const emoji = pick.getAttribute('data-emoji');
      const me = opts.meId();
      closePickers(root);
      // Optimistic: show the change at once, undo it if the server says no.
      const before = (opts.list(id) || []).slice();
      const had = before.some(r => r.emoji === emoji && r.user_id === me);
      const after = had ? before.filter(r => !(r.emoji === emoji && r.user_id === me)) : before.concat([{ user_id: me, emoji }]);
      opts.set(id, after); redraw(root, id, after, me);
      try {
        const { error } = await opts.toggle(id, emoji);
        if (error) throw error;
        if (opts.changed) opts.changed(id);
      } catch(err){
        opts.set(id, before); redraw(root, id, before, me);
        const t = document.getElementById('t-toast');
        if (t){ t.textContent = (err && err.message) || 'Could not save that reaction.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
      }
    });
    // Clicking anywhere else closes an open picker.
    document.addEventListener('click', e => { if (!e.target.closest('.msg-bubble')) closePickers(root); });
  }
  return { EMOJI, rowHtml, bubbleExtrasHtml, attach, redraw };
})();

/* ---------------- INBOX UNREAD BADGE ----------------
   A count on the INBOX nav button of conversations with a message you
   haven't opened yet, refreshed every minute (and when the tab comes back
   into view) on any page. "Unread" comes from my_dm_threads().unread,
   which is server-side so reading on one device clears it everywhere
   (sql/55-inbox-unread.sql). Before that SQL has run, it falls back to
   "they spoke last and you haven't opened it on this device". The Inbox
   itself (js/bells-n-barz-inbox.js) uses the same helpers. */
(function(){
  const btn = document.getElementById('nav-inbox-btn');
  if (!btn) return;
  const badge = document.createElement('span');
  badge.className = 'nav-badge';
  badge.hidden = true;
  btn.appendChild(badge);

  const SEEN_KEY = 'bnb-dm-seen'; // thread id -> when it was last opened on this device
  function seenMap(){ try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch(e){ return {}; } }
  const time = s => (s ? new Date(s).getTime() : 0);

  window.bnbDmIsUnread = function(thread, meId){
    if (!thread.last_sender_id || thread.last_sender_id === meId) return false;
    // Opened on this device since the last message (covers the moment
    // before the server-side mark lands, and databases without sql/55).
    if (time(seenMap()[thread.thread_id]) >= time(thread.updated_at)) return false;
    return typeof thread.unread === 'boolean' ? thread.unread : true;
  };
  // kind 'group' marks a group chat (sql/59); its local key is 'g:<id>',
  // matching groupRow() below.
  window.bnbDmMarkRead = function(threadId, lastMessageAt, kind){
    const m = seenMap();
    // Read up to now — or the last message's own time, if the server's
    // clock is ahead of this device's.
    m[kind === 'group' ? 'g:' + threadId : threadId] = new Date(Math.max(Date.now(), time(lastMessageAt))).toISOString();
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(m)); } catch(e){}
    // Errors are expected until sql/55 / sql/59 add these functions; the
    // per-device record above still works without them.
    if (kind === 'group') bnbClient.rpc('mark_chat_group_read', { p_group_id: threadId }).then(() => {});
    else bnbClient.rpc('mark_dm_thread_read', { p_thread_id: threadId }).then(() => {});
  };
  // A my_chat_groups() row in the shape bnbDmIsUnread() expects.
  window.bnbGroupAsThread = g => ({ thread_id: 'g:' + g.group_id, last_sender_id: g.last_sender_id, updated_at: g.updated_at, unread: g.unread });
  window.bnbInboxSetBadge = function(n){
    badge.hidden = !n;
    badge.textContent = n > 99 ? '99+' : String(n || '');
    btn.setAttribute('aria-label', n ? 'Inbox, ' + n + ' unread' : 'Inbox');
  };
  async function refreshBadge(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    if (!me){ window.bnbInboxSetBadge(0); return; }
    const [dms, groups] = await Promise.all([bnbClient.rpc('my_dm_threads'), bnbClient.rpc('my_chat_groups')]);
    if (dms.error) return;
    // Groups count too once sql/59 is in (an error before then just means none).
    const groupRows = groups.error ? [] : (groups.data || []).map(window.bnbGroupAsThread);
    window.bnbInboxSetBadge((dms.data || []).concat(groupRows).filter(t => window.bnbDmIsUnread(t, me.id)).length);
  }
  window.bnbInboxRefreshBadge = refreshBadge;
  setInterval(() => { if (document.visibilityState === 'visible') refreshBadge(); }, 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshBadge(); });
  if (window.bnbSessionReady) window.bnbSessionReady.then(refreshBadge, () => {});
})();

/* ---------------- AUTO-REFRESH ---------------- */
// A tab left open for hours can drift from real data (roster changes,
// new bookings, moon-phase/Ekadashi date rollover, etc.) — so after 2
// hours it reloads, but only once nothing would be lost: no pop-up form
// open, no interval timer running, no field focused, and nothing typed
// in the last 20 minutes. Until then it keeps checking every 5 minutes
// and whenever the tab comes back into view. (Live Session progress is
// already saved to this device as you go, so it survives a reload.)
(function(){
  const REFRESH_AFTER = 2 * 60 * 60 * 1000;
  const QUIET_FOR = 20 * 60 * 1000;
  const loadedAt = Date.now();
  let lastInputAt = 0;
  ['input', 'change'].forEach(type => document.addEventListener(type, () => { lastInputAt = Date.now(); }, true));
  function wouldLoseWork(){
    if (document.querySelector('.panel-backdrop.show, .t-panel-backdrop.open, .gate-backdrop.show')) return true;
    if (document.querySelector('.timer-card[data-phase]:not([data-phase="idle"]):not([data-phase="done"])')) return true;
    const a = document.activeElement;
    if (a && (a.matches('input, textarea, select') || a.isContentEditable)) return true;
    return Date.now() - lastInputAt < QUIET_FOR;
  }
  function maybeRefresh(){
    if (Date.now() - loadedAt >= REFRESH_AFTER && !wouldLoseWork()) location.reload();
  }
  setInterval(maybeRefresh, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') maybeRefresh(); });
})();

/* ---------------- WEIGHT TRACKER ---------------- */
<!-- LAZY-LOADED MODULE: bells-n-barz-weight.js (loaded on demand — see bnbLoadModule) -->


/* ---------------- TOOLS PAGE (free, no account needed) ---------------- */
// Timers and Challenges are static markup driven by this file; the Body
// and Calories pages are filled by js/bells-n-barz-tools.js, lazy-loaded
// the first time the Tools tab opens (TAB_TO_MODULE above).
// Tools opens on a card per page; picking one sets tools-page-mode on
// #tab-tools, which swaps the cards for that page plus "Back to Tools".
function showToolsPage(page){
  document.querySelectorAll('#tools-page-tabs [data-tools-page]').forEach(b => b.classList.toggle('active', b.getAttribute('data-tools-page') === page));
  document.querySelectorAll('#tab-tools .tools-page').forEach(el => { el.style.display = el.id === 'tools-page-' + page ? 'block' : 'none'; });
  const panel = document.getElementById('tab-tools');
  if (panel) panel.classList.add('tools-page-mode');
}
function showToolsCards(){
  const panel = document.getElementById('tab-tools');
  if (panel) panel.classList.remove('tools-page-mode');
  document.querySelectorAll('#tools-page-tabs [data-tools-page]').forEach(b => b.classList.remove('active'));
}
window.bnbShowToolsPage = showToolsPage;
document.querySelectorAll('#tools-page-tabs [data-tools-page]').forEach(b => {
  b.addEventListener('click', () => { showToolsPage(b.getAttribute('data-tools-page')); window.scrollTo({ top: 0, behavior: 'smooth' }); });
});
const toolsBackBtn = document.getElementById('tools-back-btn');
if (toolsBackBtn) toolsBackBtn.addEventListener('click', showToolsCards);

/* ---------------- HOME / ABOUT / CONTACTS CARDS ---------------- */
// Cards that open a Gym tab (data-home-gym="tools|member|schedule|messages").
// Tools is open to everyone; the rest go through the MEMBER nav pill when
// signed out, so guests land on the same membership preview + sign-in.
document.querySelectorAll('[data-home-gym]').forEach(card => {
  card.addEventListener('click', () => {
    const tab = card.getAttribute('data-home-gym');
    switchSite('gym');
    if (tab !== 'tools' && !isSignedIn()){
      const memberPill = document.getElementById('nav-member-btn');
      if (memberPill) memberPill.click();
      return;
    }
    switchTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ---------------- MEMBER PREVIEW (signed-out visitors) ---------------- */
(function(){
  const enter = mode => { if (typeof window.bnbEnterGym === 'function') window.bnbEnterGym(mode); };
  const signup = document.getElementById('member-preview-signup');
  const login = document.getElementById('member-preview-login');
  const tools = document.getElementById('member-preview-tools');
  if (signup) signup.addEventListener('click', () => enter('signup'));
  if (login) login.addEventListener('click', () => enter('login'));
  if (tools) tools.addEventListener('click', () => { switchTab('tools'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();
