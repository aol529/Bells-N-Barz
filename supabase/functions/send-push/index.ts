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

  return new Response(JSON.stringify({ sent, removed: gone.length }), { headers: { "Content-Type": "application/json" } });
});
