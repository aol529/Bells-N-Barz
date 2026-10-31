(function(){

  // Admin > Switchboard: features an admin can turn off for everyone, so
  // the app behaves as if they weren't there. On/off lives in the
  // feature_switches table (sql/75-feature-switches.sql); names and
  // descriptions live here.
  //
  // To make a feature switchable:
  //   1. Add it to FEATURES below.
  //   2. Mark its markup with data-feature="<key>" — those elements are
  //      hidden while it's off, including ones rendered later. Markup with
  //      data-feature-off="<key>" is the reverse: shown only while it's off.
  //   3. Where behaviour (not just markup) changes, check
  //      BNB_FEATURES.on('<key>') and listen for 'bnb-features-change'.
  //   4. If SQL does something for it, check feature_on('<key>') there.
  // A feature with no row in the table counts as on, unless it says
  // defaultOn: false (for features whose SQL may not have been run yet).
  const FEATURES = [
    { key: 'currency-switch', name: 'USD / KES price switch',
      desc: 'The USD | KES switches wherever money is shown (Shop, Billing, Reports, Users, coach dashboard, sign-up). Off: the switches disappear and every price shows in US dollars.' },
    { key: 'registration-fee', name: 'Registration fee',
      desc: 'New sign-ups get a one-time $0.50 Registration invoice, and the sign-up form mentions it. Off: no invoice, no mention.' },
    { key: 'forgot-password', name: 'Forgot password', defaultOn: false,
      desc: 'Log In > "Forgot your password?": checks the email has an account, then offers a reset link, a one-time code, or asking an admin. Off: the link is replaced by "Ask at the front desk". Staff reset emails and admin temporary passwords work either way.' },
    { key: 'pre-session-screening', name: 'Pre-session screening', defaultOn: false,
      desc: 'Me > Screening: members fill in a health check (PAR-Q), goals, lifestyle and emergency contact, and sign the waiver. Booking a 1-on-1 without one asks for it first; coaches are told and see it in Users > Assessment, where it pre-fills the Initial Assessment. Needs sql/89. Off: none of it shows and booking works as before.' },
    { key: 'library', name: 'Library', defaultOn: false,
      desc: 'The Library page: the books that inspired Bells n Barz, with why each matters and short takeaways. Off: the Library link disappears from the menu.' }
  ];

  const CACHE_KEY = 'bnb-features-v1';
  function readCache(){ try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch(e){ return {}; } }
  function writeCache(){ try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch(e){} }

  // Last-known state first, so a switched-off feature doesn't flash on
  // while the table loads.
  let state = readCache();
  let loaded = false;
  let loadError = '';
  const saving = {};

  function on(key){
    if (key in state) return state[key] !== false;
    const f = FEATURES.find(x => x.key === key);
    return !(f && f.defaultOn === false);
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'bnb-feature-switches';
  document.head.appendChild(styleEl);

  function apply(){
    styleEl.textContent = FEATURES.map(f => on(f.key)
      ? '[data-feature-off="' + f.key + '"]{display:none !important;}'
      : '[data-feature="' + f.key + '"]{display:none !important;}').join('\n');
    document.dispatchEvent(new CustomEvent('bnb-features-change'));
    render();
  }

  async function load(){
    const { data, error } = await bnbClient.from('feature_switches').select('key, enabled, updated_at');
    if (error){
      loadError = error.message || 'Could not load switches.';
      console.error('Supabase load feature_switches failed:', error);
      render();
      return;
    }
    loadError = '';
    state = {};
    (data || []).forEach(r => { state[r.key] = r.enabled; });
    loaded = true;
    writeCache();
    apply();
  }

  function isAdmin(){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    return !!(me && me.roles && me.roles.includes('admin'));
  }

  async function set(key, enabled){
    const me = window.BNB_USERS && window.BNB_USERS.getSelf && window.BNB_USERS.getSelf();
    const was = on(key);
    state[key] = enabled;
    saving[key] = true;
    apply();
    const { error } = await bnbClient.from('feature_switches').upsert({
      key, enabled, updated_at: new Date().toISOString(), updated_by: me ? me.id : null
    });
    delete saving[key];
    if (error){
      console.error('Saving feature switch failed:', error);
      state[key] = was;
      toast('Could not save that switch — ' + (error.message || 'try again.'));
    } else {
      writeCache();
      const f = FEATURES.find(x => x.key === key);
      toast((f ? f.name : key) + (enabled ? ' turned on.' : ' turned off.'));
    }
    apply();
  }

  function toast(msg){
    const el = document.getElementById('t-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._featureTimer);
    el._featureTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function render(){
    const body = document.getElementById('switchboard-body');
    if (!body) return;
    const admin = isAdmin();
    let html = '';
    if (loadError) html += '<div class="admin-notice">Could not load the switches: ' + esc(loadError) + ' — has sql/75-feature-switches.sql been run?</div>';
    if (!admin) html += '<div class="admin-notice">Only admins can change these. You can see what\'s on and off.</div>';
    html += '<ul class="sb-list">' + FEATURES.map(f => {
      const isOn = on(f.key);
      const disabled = !admin || !loaded || saving[f.key];
      return '<li class="sb-row">' +
        '<div class="sb-text"><div class="sb-name">' + esc(f.name) + ' <span class="sb-state ' + (isOn ? 'on' : 'off') + '">' + (isOn ? 'On' : 'Off') + '</span></div>' +
        '<div class="sb-desc">' + esc(f.desc) + '</div></div>' +
        '<label class="switch"><input type="checkbox" data-sb-key="' + esc(f.key) + '"' + (isOn ? ' checked' : '') + (disabled ? ' disabled' : '') +
        ' aria-label="' + esc(f.name) + '"><span class="slider"></span></label>' +
        '</li>';
    }).join('') + '</ul>';
    body.innerHTML = html;
    body.querySelectorAll('input[data-sb-key]').forEach(inp => {
      inp.addEventListener('change', () => set(inp.dataset.sbKey, inp.checked));
    });
  }

  window.BNB_FEATURES = { on, list: () => FEATURES.slice() };
  // Re-read on tab-open so a switch flipped on another device shows here.
  window.bnbSwitchboardOnTabShown = function(){ render(); load(); };

  apply();
  load();
})();
