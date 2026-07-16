import { createHmac, timingSafeEqual } from "node:crypto";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

async function valid(signature: string, raw: string) {
  const { SQUARE_WEBHOOK_SIGNATURE_KEY: key } = await getRuntimeSecrets();
  const url = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;
  if (!url || !signature) return false;
  const expected = createHmac("sha256", key).update(url + raw).digest("base64");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const raw = await request.text();
  let secrets;
  try {
    secrets = await getRuntimeSecrets();
    if (!await valid(request.headers.get("x-square-hmacsha256-signature") || "", raw)) return new Response("Invalid signature", { status: 403 });
  } catch { return new Response("Webhook verification is unavailable", { status: 503 }); }
  const event = JSON.parse(raw);
  console.info("[square-webhook]", JSON.stringify({ eventId: event.event_id, type: event.type, createdAt: event.created_at }));
  if (process.env.PAYMENT_EVENT_FORWARD_URL) {
    try {
      const forwarded = await fetch(process.env.PAYMENT_EVENT_FORWARD_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(secrets.PAYMENT_EVENT_FORWARD_TOKEN ? { Authorization: `Bearer ${secrets.PAYMENT_EVENT_FORWARD_TOKEN}` } : {}) }, body: raw });
      if (!forwarded.ok) throw new Error(`Forwarding endpoint returned ${forwarded.status}`);
    } catch (cause) {
      console.error("[square-webhook] forwarding failed", cause);
      return Response.json({ error: "Event forwarding failed; retry required" }, { status: 503 });
    }
  }
  return Response.json({ received: true });
}
