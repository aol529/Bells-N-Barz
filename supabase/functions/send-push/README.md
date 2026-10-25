# send-push: phone alerts with the app closed

Every notification the app already makes (messages, bookings, reminders,
freeze decisions…) is also sent as a push to the member's devices.

How it fits together:

1. A member turns on **Alerts on this device** in the bell menu. Their browser
   gives a push address, saved in `push_subscriptions`.
2. When a row is added to `notifications`, the `notify_push()` trigger
   (`sql/86-push-notifications.sql`) posts it here.
3. This function sends it to each of that member's devices.

## Set it up (once)

1. **Run the SQL**: `sql/86-push-notifications.sql` in the SQL editor.
2. **Create the function**: Supabase dashboard → Edge Functions → Deploy a new
   function → Via Editor. Name it `send-push` and paste in `index.ts`. Deploy.
   (With the Supabase CLI instead: `supabase functions deploy send-push --no-verify-jwt`.)
3. **Turn off JWT verification** for `send-push` (function → Details →
   "Verify JWT with legacy secret" / "Enforce JWT verification": off). The
   trigger proves itself with the shared secret, not a login.
4. **Add the secrets**: Edge Functions → Secrets:
   - `VAPID_PUBLIC_KEY`: the `PUSH_PUBLIC_KEY` value in `js/bells-n-barz-push.js`
   - `VAPID_PRIVATE_KEY`: its private half. It was generated alongside the
     public key and kept out of the repo (on the machine it was made on:
     `~/.config/bells-n-barz/vapid-keys.txt`).
   - `VAPID_SUBJECT`: `mailto:` + an email push services can contact, e.g. `mailto:you@example.com`
   - `PUSH_WEBHOOK_SECRET`: the output of this, run in the SQL editor:
     ```sql
     select decrypted_secret from vault.decrypted_secrets where name = 'push_webhook_secret';
     ```

## Check it

Turn on alerts on a phone, close the app, and from another account send that
member a message. In Edge Functions → send-push → Logs you should see a call
returning `{"sent":1,...}`.

On iPhone, push only works once the site is added to the Home Screen (Share →
Add to Home Screen) and opened from there (iOS 16.4 or newer).

## New keys

If the private key is ever lost or leaked, make a new pair, e.g.
`npx web-push generate-vapid-keys`. Put the public one in
`js/bells-n-barz-push.js` and both in the secrets. Devices then have to turn
alerts on again.
