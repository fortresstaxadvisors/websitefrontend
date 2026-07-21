import { createHmac, timingSafeEqual } from "node:crypto";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";
import { readWebhookBody, WebhookBodyTooLargeError } from "@/lib/webhook-body";
import { acquireBillingEventEffect, completeBillingEventEffect, putBillingEventIfAbsent } from "@/lib/billing-operations-store";
import { syncSquareDispute } from "@/lib/dispute-case-service";
import { publishDisputeAlert } from "@/lib/dispute-alerts";

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
  let event: { event_id?: string; type?: string; created_at?: string; data?: { id?: string; object?: { dispute?: { dispute_id?: string; id?: string } } } };
  try { event = JSON.parse(raw); }
  catch { return new Response("Invalid event body", { status: 400 }); }
  if (!event.event_id || !event.type) return new Response("Event ID and type are required", { status: 422 });
  let created: boolean;
  try {
    created = await putBillingEventIfAbsent({ eventId: event.event_id, type: event.type, eventCreatedAt: event.created_at, resourceId: event.data?.id, receivedAt: new Date().toISOString() });
  } catch (cause) {
    console.error("[square-webhook] durable receipt failed", cause);
    return Response.json({ error: "Event receipt failed; retry required" }, { status: 503 });
  }
  console.info("[square-webhook]", JSON.stringify({ eventId: event.event_id, type: event.type, createdAt: event.created_at, duplicate: !created }));
  if (event.type.startsWith("dispute.")) {
    const disputeId = event.data?.object?.dispute?.dispute_id || event.data?.object?.dispute?.id || event.data?.id;
    if (!disputeId) return Response.json({ error: "Dispute event did not include a dispute ID; retry required" }, { status: 503 });
    try {
      const dispute = await syncSquareDispute(disputeId, "square-webhook");
      const effect = await acquireBillingEventEffect(event.event_id, "SNS_ALERT");
      if (effect.state === "BUSY") return Response.json({ error: "Dispute alert is already processing; retry required" }, { status: 503 });
      if (effect.state === "ACQUIRED") {
        await publishDisputeAlert(dispute, event.event_id);
        await completeBillingEventEffect(effect.lease);
      }
    } catch (cause) {
      console.error("[square-webhook] dispute sync failed", cause);
      return Response.json({ error: "Dispute case sync failed; retry required" }, { status: 503 });
    }
  }
  if (process.env.PAYMENT_EVENT_FORWARD_URL) {
    try {
      const effect = await acquireBillingEventEffect(event.event_id, "EXTERNAL_FORWARD");
      if (effect.state === "BUSY") return Response.json({ error: "Event forwarding is already processing; retry required" }, { status: 503 });
      if (effect.state === "ACQUIRED") {
        const alertBody = JSON.stringify({ eventId: event.event_id, type: event.type, resourceId: event.data?.id, createdAt: event.created_at });
        const forwarded = await fetch(process.env.PAYMENT_EVENT_FORWARD_URL, { method: "POST", signal: AbortSignal.timeout(10_000), headers: { "Content-Type": "application/json", "Idempotency-Key": event.event_id, "X-Fortress-Event-Id": event.event_id, "X-Fortress-Event-Type": event.type, ...(secrets.PAYMENT_EVENT_FORWARD_TOKEN ? { Authorization: `Bearer ${secrets.PAYMENT_EVENT_FORWARD_TOKEN}` } : {}) }, body: alertBody });
        if (!forwarded.ok) throw new Error(`Forwarding endpoint returned ${forwarded.status}`);
        await completeBillingEventEffect(effect.lease);
      }
    } catch (cause) {
      console.error("[square-webhook] forwarding failed", cause);
      return Response.json({ error: "Event forwarding failed; retry required" }, { status: 503 });
    }
  }
  return Response.json({ received: true, duplicate: !created });
}
