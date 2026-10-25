/* =========================================================================
   BELL(E)S N' BARZ — PUSH NOTIFICATIONS
   "Alerts on this device" in the bell menu: the browser's push address for
   this device is saved for the signed-in account (save_push_subscription,
   sql/86), and the send-push Edge Function delivers every new notification
   to it, even with the app closed. sw.js shows it. Turning it off removes
   this device. On iPhone it needs the Home Screen app (iOS 16.4+).
   ========================================================================= */
(function(){
  // Public half of the VAPID key pair; the private half is only in the
  // Edge Function's secrets (see supabase/functions/send-push/README.md).
  const PUSH_PUBLIC_KEY = 'BNMkxntCnGL0f2F5fbBZkw5CMku0nHrI3DHCgp9h_aZKpG28AAsw_OUrMzCWEFRlptfwJqB6M8961bHFQ1WBFXo';
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;

  function keyBytes(b64){
    const pad = '='.repeat((4 - b64.length % 4) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }
  async function registration(){
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    await navigator.serviceWorker.register('sw.js');
    return navigator.serviceWorker.ready;
  }
  async function current(){
    if (!supported) return null;
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? reg.pushManager.getSubscription() : null;
  }
  async function save(sub){
    const j = sub.toJSON();
    const { error } = await bnbClient.rpc('save_push_subscription', {
      p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_user_agent: navigator.userAgent
    });
    if (error) throw error;
  }

  async function turnOn(){
    if (!supported) throw new Error('This browser can\'t get alerts with the app closed.');
    if (ios && !standalone) throw new Error('On iPhone/iPad: add this site to your Home Screen (Share → Add to Home Screen), open it from there, then turn alerts on.');
    if (!(window.BNB_USERS && window.BNB_USERS.getSelf())) throw new Error('Sign in first.');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Notifications are blocked — allow them for this site in your browser settings.');
    const reg = await registration();
    const sub = (await reg.pushManager.getSubscription()) ||
      await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUSH_PUBLIC_KEY) });
    await save(sub);
    window.BNB_PUSH.active = true;
  }
  async function turnOff(){
    const sub = await current();
    if (sub){
      await bnbClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
    window.BNB_PUSH.active = false;
  }

  window.BNB_PUSH = { active: false, turnOn, turnOff };

  // ---- Bell menu switch ----
  const toggle = document.getElementById('notif-push-toggle');
  const hint = document.getElementById('notif-desktop-hint');
  function say(text){ if (hint){ hint.hidden = !text; hint.textContent = text || ''; } }
  async function refresh(){
    const sub = await current().catch(() => null);
    window.BNB_PUSH.active = !!sub && Notification.permission === 'granted';
    if (toggle) toggle.checked = window.BNB_PUSH.active;
  }
  if (toggle){
    if (!supported && !ios) toggle.closest('label').hidden = true;
    toggle.addEventListener('change', async () => {
      toggle.disabled = true;
      try {
        if (toggle.checked){ await turnOn(); say('Alerts are on for this device, even with the app closed.'); }
        else { await turnOff(); say('Alerts are off for this device.'); }
      } catch(e){
        say(e.message || String(e));
        toggle.checked = !toggle.checked;
      }
      toggle.disabled = false;
    });
  }
  // Signing in on a device that already has alerts on: make sure this
  // account owns its push address (the last account signed in gets them).
  document.addEventListener('bnb-auth-changed', async e => {
    if (!(e.detail && e.detail.signedIn)) return;
    const sub = await current().catch(() => null);
    if (sub && Notification.permission === 'granted') save(sub).catch(err => console.warn('push: could not save subscription', err));
    refresh();
  });
  refresh();
})();
