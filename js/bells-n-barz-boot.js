// Shared start-up for every page (the site, the staff portal): the Supabase
// connection, the cache-busting stamp, table sync, the lazy module loader and
// a few helpers. Loaded right after supabase-js, before any other script.
// (Was inline in the main page; moved here so staff.html uses the same code.)
// ---- Supabase connection ----
// One project for every host (GitHub Pages, a custom domain, localhost).
// It used to be the "staging" half of a staging/production split, but
// the production project (kyrrkojpdqnempvzshkj) was never used and no
// longer exists, so this is the live database. The publishable key is
// meant to be public; Row Level Security is what protects the data
// (check with sql/check-security.sql).
const BNB_SUPABASE_URL = 'https://orurnegmjqytuxbtoqkn.supabase.co';
const BNB_SUPABASE_ANON_KEY = 'sb_publishable_WK7bJzWl6RwTMH6gY4NaaQ_RuhBWSQb';
const bnbClient = supabase.createClient(BNB_SUPABASE_URL, BNB_SUPABASE_ANON_KEY);
// Cache-busting stamp for css/ and js/ links. The GitHub Pages deploy
// swaps __BUILD__ for the commit id (see .github/workflows/pages.yml),
// so every release loads fresh files instead of a mix of cached ones.
const BNB_BUILD = window.BNB_BUILD_STAMP || 'dev';

/* ---------------- TABLE SYNC (Booking, Shop, Billing, Users) ----------------
   Remembers the last copy of each row known to match the database, so a
   save only sends rows that actually changed and deletes rows that were
   removed. That keeps a tab left open for hours from overwriting rows
   other people changed in the meantime, and makes deletes real (they
   used to vanish locally and come back on reload). Anything that fails
   stays "unsaved" and is retried by the next save; the person is told.
   Rows are sent one at a time on purpose: under RLS a batch upsert fails
   entirely if even one row in it is blocked. */
function bnbTableSync(table, opts){
  // opts.deletes === false: never delete rows here (Users — see users.js).
  const allowDeletes = !(opts && opts.deletes === false);
  let saved = {};
  function reset(rows){
    saved = {};
    rows.forEach(r => { if (r.id) saved[r.id] = JSON.stringify(r); });
  }
  async function save(rows){
    const keep = new Set(rows.map(r => r.id));
    const changed = rows.filter(r => r.id && saved[r.id] !== JSON.stringify(r));
    const removed = allowDeletes ? Object.keys(saved).filter(id => !keep.has(id)) : [];
    if (!changed.length && !removed.length) return true;
    const [ups, dels] = await Promise.all([
      Promise.allSettled(changed.map(r => bnbClient.from(table).upsert([r]))),
      Promise.allSettled(removed.map(id => bnbClient.from(table).delete().eq('id', id)))
    ]);
    const errOf = res => res.status === 'rejected' ? res.reason : (res.value && res.value.error);
    let failed = 0;
    ups.forEach((res, i) => {
      const err = errOf(res);
      if (err){ failed++; console.warn('Supabase: could not save row in', table, changed[i].id, err); }
      else saved[changed[i].id] = JSON.stringify(changed[i]);
    });
    dels.forEach((res, i) => {
      const err = errOf(res);
      if (err){ failed++; console.warn('Supabase: could not delete row in', table, removed[i], err); }
      else delete saved[removed[i]];
    });
    if (failed){
      alert('Could not save ' + failed + ' change' + (failed === 1 ? '' : 's') + ' to the database (' + table + ') — check your connection. It will be retried on your next save.');
    }
    return failed === 0;
  }
  return { reset, save };
}

/* ---------------- LAZY MODULE LOADER ---------------- */
// Blog, Gallery, Shop, Booking/Coach, Billing, Weight, BMI, Track, and
// the seed-data Migration tool only fetch their script the first time
// they're actually opened, instead of every visitor downloading all of
// it up front. Once loaded, a module stays loaded for the rest of the
// session — never re-fetched. The Manual/Program module stays in this
// main file rather than being split out, since it's what guests land
// on by default and would need to load immediately either way.
const BNB_MODULES = {
  weight:       { file: 'js/bells-n-barz-weight.js' },
  bmi:          { file: 'js/bells-n-barz-bmi.js', deps: ['weight', 'bodyfat'] },
  // Tape-measure body fat formulas, shared by Body Composition and Client Progress.
  bodyfat:      { file: 'js/bells-n-barz-bodyfat.js' },
  // Tools > Body Calculators / Calories & Macros (free, nothing saved).
  tools:        { file: 'js/bells-n-barz-tools.js', deps: ['bodyfat', 'targets'] },
  // Me > Blood Pressure and Me > Steps share one file.
  vitals:       { file: 'js/bells-n-barz-vitals.js' },
  period:       { file: 'js/bells-n-barz-period.js' },
  track:        { file: 'js/bells-n-barz-track.js' },
  // One calorie/macro formula shared by Food Log, Meal Plan and the diets.
  targets:      { file: 'js/bells-n-barz-targets.js' },
  nutrition:    { file: 'js/bells-n-barz-nutrition.js', deps: ['targets'] },
  fasting:      { file: 'js/bells-n-barz-fasting.js' },
  blog:         { file: 'js/bells-n-barz-blog.js' },
  gallery:      { file: 'js/bells-n-barz-gallery.js' },
  library:      { file: 'js/bells-n-barz-library.js' },
  // Shop's checkout flow calls window.BNB_BILLING.createInvoice()
  // directly with no fallback if it's missing — Billing must be loaded
  // first or a real purchase would fail with "Checkout unavailable."
  shop:         { file: 'js/bells-n-barz-shop.js', deps: ['billing'] },
  // Booking/Coach's window.BNB_BILLING calls are already guarded with a
  // fallback (shows an empty unpaid-invoices list instead of failing),
  // but loading Billing alongside it avoids that degraded state for
  // the common case of a staff member using both together anyway.
  bookingCoach: { file: 'js/bells-n-barz-booking-coach.js', deps: ['billing', 'bodyfat', 'vitals', 'screening'] },
  // Me > Screening, the booking gate, and the coach's view of it.
  screening:    { file: 'js/bells-n-barz-screening.js' },
  billing:      { file: 'js/bells-n-barz-billing.js' },
  migrate:      { file: 'js/bells-n-barz-migrate.js' },
  accountability: { file: 'js/bells-n-barz-accountability.js' },
  messages:     { file: 'js/bells-n-barz-messages.js' },
  inbox:        { file: 'js/bells-n-barz-inbox.js' },
  // Meal Plan loads its data layer, the diets module and each diet first.
  mealplanStore: { file: 'js/bells-n-barz-mealplan-store.js', deps: ['targets'] },
  diets:        { file: 'js/bells-n-barz-diets.js', deps: ['mealplanStore'] },
  dietCoachKa:  { file: 'js/bells-n-barz-diet-coach-ka.js', deps: ['diets'] },
  planProgram:  { file: 'js/bells-n-barz-plan-program.js', deps: ['targets'] },
  mealplan:     { file: 'js/bells-n-barz-mealplan.js', deps: ['dietCoachKa', 'planProgram'] },
  reports:      { file: 'js/bells-n-barz-reports.js' },
  // Admin > Content: the owner's overview of the blog, library, gallery and shop.
  content:      { file: 'js/bells-n-barz-content.js' },
  // Member > Leaderboard and Me > Photos.
  engage:       { file: 'js/bells-n-barz-engage.js' },
  // Coach > Program Builder > Build a Program.
  programGenerator: { file: 'js/bells-n-barz-program-generator.js' }
};
const BNB_MODULE_PROMISES = {};
function bnbLoadModule(key){
  const mod = BNB_MODULES[key];
  if (!mod) return Promise.resolve();
  if (BNB_MODULE_PROMISES[key]) return BNB_MODULE_PROMISES[key];
  const depPromise = mod.deps ? Promise.all(mod.deps.map(bnbLoadModule)) : Promise.resolve();
  const promise = depPromise.then(() => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = mod.file + '?v=' + BNB_BUILD;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ' + mod.file));
    document.body.appendChild(script);
  }));
  BNB_MODULE_PROMISES[key] = promise;
  return promise;
}
window.bnbLoadModule = bnbLoadModule;
// Charts draw at the width they're shown at (one SVG unit = one pixel),
// so a full-width chart stays the same height with normal-size text
// instead of a 700-wide drawing stretched up. 700 while hidden.
window.bnbChartWidth = function(el){
  const w = el ? Math.round(el.getBoundingClientRect().width) : 0;
  return w > 320 ? w : 700;
};
// Shared real-UUID generator, used everywhere a new record's id is
// created locally before its first save. Using a real UUID (not a
// fake 'x'+Date.now() string) means the very first Supabase upsert
// already has a matching primary key — so every SUBSEQUENT save
// correctly updates that same row instead of silently inserting a
// new duplicate row each time (which is what happens when `id` is
// omitted from an upsert payload: Postgres has nothing to match
// against, so it always inserts fresh).
window.BNB_UUID = function(){
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
    const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
  });
};

// An element by id, or a detached stand-in when it isn't on this page. For
// wiring up buttons that only exist on one of the two pages (the staff
// screens are on staff.html, not the main page): listeners on the stand-in
// simply never fire, instead of an error stopping the rest of the script.
function bnbEl(id){ return document.getElementById(id) || document.createElement('div'); }
