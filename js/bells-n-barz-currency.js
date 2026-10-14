(function(){

  // Prices are stored and charged in US dollars — this module only changes
  // how they're shown. The USD/KES switch in the outer header flips every
  // amount rendered through BNB_CURRENCY.html() to its Kenyan shilling
  // equivalent. The rate comes from open.er-api.com once a day (no key,
  // no user data sent), cached in localStorage; if that fails it keeps the
  // last good rate, or DEFAULT_RATE if it has never had one.
  const MODE_KEY = 'bnb-currency-v1';
  const RATE_KEY = 'bnb-kes-rate-v1';
  const RATE_URL = 'https://open.er-api.com/v6/latest/USD';
  const DEFAULT_RATE = 129;
  const DAY_MS = 24 * 60 * 60 * 1000;

  function read(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function write(k, v){ try { localStorage.setItem(k, v); } catch(e){} }

  let mode = read(MODE_KEY) === 'KES' ? 'KES' : 'USD';
  let rate = DEFAULT_RATE, rateAt = 0;
  try {
    const c = JSON.parse(read(RATE_KEY) || 'null');
    if (c && c.rate > 0){ rate = c.rate; rateAt = c.at || 0; }
  } catch(e){}

  // What's actually shown: always USD while Admin > Switchboard has the
  // switch turned off (js/bells-n-barz-features.js).
  function shown(){
    return (window.BNB_FEATURES && !window.BNB_FEATURES.on('currency-switch')) ? 'USD' : mode;
  }

  // Plain text, for textContent / summaries. opts.short drops a trailing
  // ".00" on dollar amounts (the Shop's style). Shillings are always whole.
  function format(usd, opts){
    const n = Number(usd) || 0;
    const sign = n < 0 ? '-' : '';
    if (shown() === 'KES') return sign + 'KSh ' + Math.round(Math.abs(n) * rate).toLocaleString('en-US');
    let s = Math.abs(n).toFixed(2);
    if (opts && opts.short) s = s.replace(/\.00$/, '');
    return sign + '$' + s;
  }
  // Dollars always, plus the shilling figure when KES is on — for staff
  // forms where the amount typed in is in USD.
  function formatUsd(usd){
    const n = Number(usd) || 0;
    const d = (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2);
    return shown() === 'KES' ? d + ' (≈ ' + format(n) + ')' : d;
  }
  // HTML, for innerHTML. Tagged with the dollar amount so a currency
  // switch can re-label it in place without the owning module re-rendering.
  function html(usd, opts){
    const n = Number(usd) || 0;
    return '<span data-usd="' + n + '"' + (opts && opts.short ? ' data-usd-short="1"' : '') + '>' + format(n, opts) + '</span>';
  }

  function rateLabel(){
    const when = rateAt ? ' (updated ' + new Date(rateAt).toLocaleDateString(undefined, { day:'numeric', month:'short' }) + ')' : ' (approximate)';
    return '1 USD ≈ ' + rate.toFixed(2) + ' KES' + when;
  }

  function refresh(){
    document.querySelectorAll('[data-usd]').forEach(el => {
      el.textContent = format(el.dataset.usd, { short: el.dataset.usdShort === '1' });
    });
    document.querySelectorAll('#cur-switch button').forEach(b => {
      const on = b.dataset.cur === mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const sw = document.getElementById('cur-switch');
    if (sw) sw.title = 'Prices are in US dollars. ' + rateLabel();
    // For amounts shown as plain text (open panels, order totals).
    document.dispatchEvent(new CustomEvent('bnb-currency-change', { detail: { mode: shown(), rate } }));
  }

  function setMode(m){
    mode = m === 'KES' ? 'KES' : 'USD';
    write(MODE_KEY, mode);
    refresh();
  }

  async function fetchRate(){
    if (rateAt && Date.now() - rateAt < DAY_MS) return;
    try {
      const res = await fetch(RATE_URL);
      const data = await res.json();
      const kes = data && data.result === 'success' && data.rates && Number(data.rates.KES);
      if (!(kes > 0)) return;
      rate = kes;
      rateAt = Date.now();
      write(RATE_KEY, JSON.stringify({ rate, at: rateAt }));
      refresh();
    } catch(e){
      console.warn('KES rate fetch failed — using ' + rate, e);
    }
  }

  window.BNB_CURRENCY = {
    format, formatUsd, html, setMode,
    mode(){ return shown(); },
    rate(){ return rate; }
  };

  document.querySelectorAll('#cur-switch button').forEach(b => {
    b.addEventListener('click', () => setMode(b.dataset.cur));
  });
  document.addEventListener('bnb-features-change', refresh);
  refresh();
  fetchRate();
})();
