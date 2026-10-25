/* ---------------- SERVICE WORKER — notifications only ----------------
   No offline caching: this app changes often and caching its own assets
   is its own headache this doesn't take on. It does two things:
   - Local alerts. iOS Safari's Notifications API is only reachable
     through a ServiceWorkerRegistration (reg.showNotification(...)), even
     for a plain local alert with no push server behind it; the bare
     `new Notification()` constructor silently doesn't work there. This is
     what makes the Fasting timer's "Enable Browser Alerts" fire on an
     iPhone (added to the Home Screen — see isIOS()/isStandalone() in
     js/bells-n-barz-fasting.js).
   - Web Push (the push handler below): server notifications while the
     app is closed. Clicking one opens the screen it's about. */

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

/* Push (sql/86 + supabase/functions/send-push): a notification from the
   server while the app may be closed. If the app is open and on screen,
   its own pop-up and chime already cover it, so nothing is shown here. */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.some((c) => c.visibilityState === 'visible')) return;
      return self.registration.showNotification(data.title || "Bell(e)s n' Barz", {
        body: data.body || '',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: data.tag || 'bnb',
        data: { url: data.url || './' }
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          // Open the screen the notification is about (a push carries its
          // link, e.g. ./#messages); a local alert just focuses the app.
          if (url !== './' && 'navigate' in client) client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
