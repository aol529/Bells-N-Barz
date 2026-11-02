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

## Android app

The same function also sends each notification to the Android app
(github.com/aol529/bells-n-barz-android) through Firebase Cloud Messaging.
Until the secret below is set it simply skips that part.

1. **Run the SQL**: `sql/90-app-push.sql` (the `app_push_tokens` table the
   app writes its token to after sign-in).
2. **Firebase project**: console.firebase.google.com → Add project (Google
   Analytics not needed). Add an **Android app** with package name
   `io.github.aol529.bellsnbarz` and download `google-services.json`. It goes
   in the app repo at `app/google-services.json` (it holds only public
   identifiers; the app reads it at build time).
3. **Service account key**: Firebase → Project settings → Service accounts →
   Generate new private key. Paste the **whole JSON file** as the Edge
   Function secret `FCM_SERVICE_ACCOUNT`. Keep the file out of every repo.
4. **Redeploy** `send-push` with the new `index.ts` (JWT verification still off).

Check: sign in on the phone, then from another account send that member a
message. The function log shows `"app":{"sent":1,...}`.
