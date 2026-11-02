// send-push: Web Push for Bells n Barz notifications.
// Called by the notify_push() trigger (sql/86-push-notifications.sql) for
// every new row in public.notifications. Sends it to each device the
// member turned alerts on for, and forgets devices that have gone away.
//
// Secrets (Edge Functions > Secrets in the Supabase dashboard):
//   PUSH_WEBHOOK_SECRET  the Vault secret 'push_webhook_secret' (see README)
//   VAPID_PUBLIC_KEY     same key as PUSH_PUBLIC_KEY in js/bells-n-barz-push.js
//   VAPID_PRIVATE_KEY    its private half (never in the repo)
//   VAPID_SUBJECT        mailto: address push services can contact
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// Deploy with JWT verification OFF: the trigger signs with the secret instead.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  const secret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-push-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  let n: { user_id?: string; message?: string; link_tab?: string; type?: string; id?: string };
  try { n = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (!n.user_id || !n.message) return new Response("Missing user_id or message", { status: 400 });

  const { data: subs, error } = await supabase
    .from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", n.user_id);
  if (error) return new Response(error.message, { status: 500 });

  const payload = JSON.stringify({
    title: "Bell(e)s n' Barz",
    body: n.message,
    tag: n.type || "bnb",
    url: "./#" + (n.link_tab || ""),
  });

  let sent = 0;
  const gone: string[] = [];
  await Promise.all((subs || []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) gone.push(s.id);
      else console.error("push failed", code, (e as Error).message);
    }
  }));
  if (gone.length) await supabase.from("push_subscriptions").delete().in("id", gone);
  if (sent) await supabase.from("push_subscriptions").update({ last_used: new Date().toISOString() }).eq("user_id", n.user_id);

  // The Android app (sql/90-app-push.sql). Skipped until FCM_SERVICE_ACCOUNT is set.
  const app = await sendToApp(n).catch((e) => { console.error("app push failed", (e as Error).message); return { sent: 0, removed: 0 }; });

  return new Response(JSON.stringify({ sent, removed: gone.length, app }), { headers: { "Content-Type": "application/json" } });
});

/* ---------------- Android app: Firebase Cloud Messaging (HTTP v1) ----------------
   FCM_SERVICE_ACCOUNT is the whole JSON key of a Firebase service account
   (Firebase console → Project settings → Service accounts → Generate new
   private key). It is signed into a short-lived Google access token here. */
type ServiceAccount = { project_id: string; client_email: string; private_key: string; token_uri?: string };
let cachedToken: { value: string; expires: number } | null = null;

async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const b64url = (data: Uint8Array | string) =>
    btoa(typeof data === "string" ? data : String.fromCharCode(...data)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." + b64url(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const res = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + b64url(sig) }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error("Google token: " + JSON.stringify(body));
  cachedToken = { value: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

async function sendToApp(n: { user_id?: string; message?: string; link_tab?: string; type?: string; id?: string }) {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!raw) return { sent: 0, removed: 0, skipped: "FCM_SERVICE_ACCOUNT not set" };
  const { data: rows, error } = await supabase.from("app_push_tokens").select("token").eq("user_id", n.user_id!);
  if (error || !rows?.length) return { sent: 0, removed: 0 };
  const sa = JSON.parse(raw) as ServiceAccount;
  const access = await googleAccessToken(sa);
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(rows.map(async ({ token }) => {
    // Data-only, so the app draws the notification itself and can open the right screen.
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" },
      body: JSON.stringify({ message: {
        token,
        data: { title: "Bell(e)s n' Barz", body: n.message!, type: n.type || "", link_tab: n.link_tab || "", id: n.id || "" },
        android: { priority: "HIGH", ttl: "86400s" },
      } }),
    });
    if (res.ok) { sent++; return; }
    const text = await res.text();
    if (res.status === 404 || text.includes("UNREGISTERED") || text.includes("INVALID_ARGUMENT")) gone.push(token);
    else console.error("fcm failed", res.status, text);
  }));
  if (gone.length) await supabase.from("app_push_tokens").delete().in("token", gone);
  if (sent) await supabase.from("app_push_tokens").update({ last_used: new Date().toISOString() }).eq("user_id", n.user_id!);
  return { sent, removed: gone.length };
}
