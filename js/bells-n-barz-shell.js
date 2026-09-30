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
  const THEMES = ['dark', 'light', 'royal', 'red', 'pink'];
  const THEME_META = {
    dark:  { icon: '☾', label: 'Dark' },
    light: { icon: '☀', label: 'Light' },
    royal: { icon: '♛', label: 'Royal' },
    red:   { icon: '❤', label: 'Red' },
    pink:  { icon: '🎗', label: 'Pink' }
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
const tabLabels = {overview:'Overview', mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday', appendix:'Appendix', log:'Log', time:'Timers', session:'Session Log', glance:'Exercise Glance', coach:'Coach', schedule:'Booking', billing:'Billing', me:'Me', accountability:'My Teams', messages:'Messages', reports:'Reports'};

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
const memberSectionTabs = ['session','time','me','accountability','messages','schedule','challenges'];
const adminSectionTabs = ['billing', 'users', 'sessions', 'reports'];
// Clicking the rack's MEMBER/ADMIN pill should land on that page's default
// sub-tab, not a page of its own — so 'member'/'admin' are aliases, resolved
// before anything else runs.
const TAB_ALIASES = { member: 'session', admin: 'billing' };
const NESTED_TAB_PARENT = { session: 'tab-member', time: 'tab-member', me: 'tab-member', accountability: 'tab-member', messages: 'tab-member', schedule: 'tab-member', challenges: 'tab-member', billing: 'tab-admin', users: 'tab-admin', sessions: 'tab-admin', reports: 'tab-admin' };

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
  schedule: 'Booking', coach: 'Coach', billing: 'Billing', users: 'Members — Admin', sessions: 'Sessions — Admin', reports: 'Reports — Admin',
  session: 'Live Session Log', time: 'Timers', me: 'Me', accountability: 'My Teams', messages: 'Messages', inbox: 'Inbox', challenges: 'Challenges'
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
    reports: 'reports'
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
  if (navMemberBtn) navMemberBtn.classList.toggle('active', memberSectionTabs.includes(tab));
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
  // Mobile-only: Member lands on the 6-tile screen instead of defaulting
  // into Live Session — rawTab === 'member' means the top-nav pill (or a
  // restored #member hash) was used, as opposed to a specific tile/deep
  // link, which should still open straight into its content as normal.
  // Desktop is untouched — the CSS side of this only exists inside the
  // max-width:640px media query, so this class does nothing there.
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
  }
  // Same tile-home-screen treatment for Admin — landing via the top-nav
  // ADMIN pill (or a restored #admin hash) shows the Billing/Users/
  // Sessions/Reports tile grid instead of jumping straight into Billing.
  if (nestedParent === 'tab-admin'){
    panel.classList.toggle('admin-content-mode', rawTab !== 'admin');
    if (rawTab === 'admin'){
      document.querySelectorAll('#admin-section-switch .plate').forEach(b => b.classList.remove('active'));
    }
  }
  // Same tile-home-screen treatment for Coach — landing via the top-nav
  // COACH pill always resets to the tile screen, even if a section was
  // previously open. Entering a specific section (tile tap, or a
  // restored #coach:key hash) is handled separately in the COACH
  // SUB-SWITCHER IIFE below, since Coach's inner navigation never goes
  // through switchTab() at all.
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
    messages: document.getElementById('coach-section-messages')
  };
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.getAttribute('data-coach-section');
      btns.forEach(b=> b.classList.toggle('active', b===btn));
      Object.keys(sections).forEach(k=> sections[k].classList.toggle('active', k===key));
      // Mobile tile-home-screen: selecting any section here (tile tap, or
      // a restored #coach:key hash) enters content mode — hides the tiles,
      // shows the Back button. No-op on desktop (see the media query).
      document.getElementById('tab-coach').classList.add('coach-content-mode');
      // Encode which sub-section is active in the hash too (as coach:<key>),
      // so a refresh restores it — switchTab() only ever wrote the outer
      // 'coach' tab, leaving every reload stuck back on Dashboard.
      history.replaceState(null, '', '#coach:' + key);
      if (key === 'program' && typeof window.bnbProgramBuilderOnShown === 'function') window.bnbProgramBuilderOnShown();
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
    period: document.getElementById('tab-period'),
    track: document.getElementById('tab-track'),
    nutrition: document.getElementById('tab-nutrition'),
    fasting: document.getElementById('tab-fasting')
  };
  const ME_SECTION_TO_MODULE = { weight: 'bmi', period: 'period', track: 'track', nutrition: 'nutrition', fasting: 'fasting' };
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.getAttribute('data-me-section');
      if (ME_SECTION_TO_MODULE[key] && typeof bnbLoadModule === 'function'){
        bnbLoadModule(ME_SECTION_TO_MODULE[key]).catch(err => {
          console.error(err);
          const t = document.getElementById('t-toast');
          if (t){ t.textContent = 'Failed to load this section — check your connection and try again.'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
        });
      }
      btns.forEach(b=> b.classList.toggle('active', b===btn));
      Object.keys(sections).forEach(k=> sections[k].classList.toggle('active', k===key));
      // Same fix as the Coach sub-switcher above (as me:<key>) — otherwise
      // a refresh on Period/Track/Nutrition silently drops back to Weight.
      history.replaceState(null, '', '#me:' + key);
    });
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

/* ---- Ekadashi reminder (staff, computed on open) ----
   Same "no real scheduler" limitation as checkBirthdaysAndNotify()
   above, plus one more wrinkle: the reminder goes out as an Inbox
   direct message (sql/14-inbox.sql's send_direct_message()), which has
   no "system sender" concept — it's sent FROM whichever staff account
   happens to trigger this, which could be a different staff member
   each time depending on who's got the app open. That means a simple
   "did *I* already send this" check (like the birthday one uses)
   isn't enough — a different staff member opening the app later that
   same day would send a second copy. ekadashi_reminders_sent
   (sql/15-ekadashi-reminders.sql) is the cross-session, cross-staff
   fix: a (member_id, ekadashi_start) primary key claimed via insert
   right before the send, so whichever session gets there first "wins"
   and every later attempt — same staff reloading, or a different staff
   member entirely — hits the conflict and skips. */
async function checkEkadashiReminderAndNotify(){
  const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
  if (!me || !isStaff()) return;
  const info = nextEkadashi(new Date());
  if (info.ongoing || !info.start) return; // only a "tomorrow" reminder, not a same-day one
  const msUntilStart = info.start.getTime() - Date.now();
  if (msUntilStart <= 0 || msUntilStart > 24 * 60 * 60 * 1000) return; // outside the 24h-before window

  const members = (window.BNB_USERS.getMembers && window.BNB_USERS.getMembers()) || [];
  if (!members.length) return;
  const startIso = info.start.toISOString();
  const dateStr = info.start.toLocaleDateString(undefined, {weekday:'long', month:'short', day:'numeric'});
  const message = 'Reminder: ' + info.paksha + ' Paksha Ekadashi begins tomorrow (' + dateStr +
    '). See the home page banner for the exact time.';

  for (const member of members){
    const { error: claimErr } = await bnbClient
      .from('ekadashi_reminders_sent')
      .insert([{ member_id: member.id, ekadashi_start: startIso }]);
    if (claimErr){
      if (claimErr.code !== '23505') console.warn('Supabase claim Ekadashi reminder slot failed:', claimErr);
      continue; // '23505' = already claimed (by this staff member or another) — expected, not an error
    }
    const { error: sendErr } = await bnbClient.rpc('send_direct_message', { p_recipient_id: member.id, p_body: message });
    if (sendErr) console.warn('Supabase send Ekadashi reminder failed:', sendErr);
  }
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
        window.switchTab(link);
      }
    });
  });
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
  checkEkadashiReminderAndNotify();
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
    if (GATED_TABS.includes(tab)){
      if (!isSignedIn()){ goToLoginPrompt(); return; }
      if (STAFF_ONLY_TABS.includes(tab) && !isStaff()){ showStaffOnlyToast(); return; }
    }
    hideBackPill();
    switchTab(tab);
  });
});
// Mobile Member tile screen's Back button — returns from a section's
// content to the tile grid without changing which section is marked
// .active internally (so tapping the same tile again just re-shows it).
const memberBackBtn = document.getElementById('member-back-btn');
if (memberBackBtn){
  memberBackBtn.addEventListener('click', () => {
    document.getElementById('tab-member').classList.remove('member-content-mode');
    document.querySelectorAll('#member-section-switch .plate').forEach(b => b.classList.remove('active'));
    history.replaceState(null, '', '#member');
  });
}
// Coach's mobile tile screen's Back button — same pattern as Member's.
const coachBackBtn = document.getElementById('coach-back-btn');
if (coachBackBtn){
  coachBackBtn.addEventListener('click', () => {
    document.getElementById('tab-coach').classList.remove('coach-content-mode');
    document.querySelectorAll('#coach-section-switch button').forEach(b => b.classList.remove('active'));
    history.replaceState(null, '', '#coach');
  });
}
// Admin's mobile tile screen's Back button — same pattern as Member's.
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

/* ---------------- AUTO-REFRESH ---------------- */
// A tab left open for hours can drift from real data (roster changes,
// new bookings, moon-phase/Ekadashi date rollover, etc.) — reload every
// 2 hours so it stays current, same pattern as the Bible reading plan.
setInterval(() => location.reload(), 2 * 60 * 60 * 1000);

/* ---------------- WEIGHT TRACKER ---------------- */
<!-- LAZY-LOADED MODULE: bells-n-barz-weight.js (loaded on demand — see bnbLoadModule) -->
