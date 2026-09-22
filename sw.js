/* ---------------- SERVICE WORKER — local notification support only ----------------
   No push logic here, no offline caching — this app changes often and
   caching its own assets is its own headache this doesn't take on.
   The one thing this exists for: iOS Safari's Notifications API is
   only reachable through a ServiceWorkerRegistration
   (reg.showNotification(...)), even for a plain local alert with no
   push server behind it — the bare `new Notification()` constructor
   silently doesn't work there. Registering this is what makes the
   Fasting timer's "Enable Browser Alerts" actually fire on an iPhone
   (added to the Home Screen — see the isIOS()/isStandalone() check in
   js/bells-n-barz-fasting.js). Clicking a notification just
   focuses/reopens the app; nothing else. */

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
