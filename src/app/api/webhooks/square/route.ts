import { createHmac, timingSafeEqual } from "node:crypto";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";
import { readWebhookBody, WebhookBodyTooLargeError } from "@/lib/webhook-body";

async function valid(signature: string, raw: string) {
  const { SQUARE_WEBHOOK_SIGNATURE_KEY: key } = await getRuntimeSecrets();
  const url = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;
  if (!url || !signature) return false;
  const expected = createHmac("sha256", key).update(url + raw).digest("base64");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let raw: string;
  try { raw = await readWebhookBody(request); }
  catch (cause) {
    if (cause instanceof WebhookBodyTooLargeError) return new Response(cause.message, { status: 413 });
    return new Response("Could not read event body", { status: 400 });
  }
  let secrets;
  try {
    secrets = await getRuntimeSecrets();
    if (!await valid(request.headers.get("x-square-hmacsha256-signature") || "", raw)) return new Response("Invalid signature", { status: 403 });
  } catch { return new Response("Webhook verification is unavailable", { status: 503 }); }
  let event: { event_id?: string; type?: string; created_at?: string };
  try { event = JSON.parse(raw); }
  catch { return new Response("Invalid event body", { status: 400 }); }
  if (!event.event_id || !event.type) return new Response("Event ID and type are required", { status: 422 });
  console.info("[square-webhook]", JSON.stringify({ eventId: event.event_id, type: event.type, createdAt: event.created_at }));
  if (process.env.PAYMENT_EVENT_FORWARD_URL) {
    try {
      const forwarded = await fetch(process.env.PAYMENT_EVENT_FORWARD_URL, { method: "POST", signal: AbortSignal.timeout(10_000), headers: { "Content-Type": "application/json", "Idempotency-Key": event.event_id, "X-Fortress-Event-Id": event.event_id, "X-Fortress-Event-Type": event.type, ...(secrets.PAYMENT_EVENT_FORWARD_TOKEN ? { Authorization: `Bearer ${secrets.PAYMENT_EVENT_FORWARD_TOKEN}` } : {}) }, body: raw });
      if (!forwarded.ok) throw new Error(`Forwarding endpoint returned ${forwarded.status}`);
    } catch (cause) {
      console.error("[square-webhook] forwarding failed", cause);
      return Response.json({ error: "Event forwarding failed; retry required" }, { status: 503 });
    }
  }
  return Response.json({ received: true });
}
