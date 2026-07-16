import { randomUUID } from "node:crypto";

const token = process.env.SQUARE_DEVELOPER_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN;
const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;
if (!token || !notificationUrl) throw new Error("Set SQUARE_DEVELOPER_ACCESS_TOKEN (or SQUARE_ACCESS_TOKEN) and SQUARE_WEBHOOK_NOTIFICATION_URL");
const base = process.env.SQUARE_ENVIRONMENT === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
const response = await fetch(`${base}/v2/webhooks/subscriptions`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Square-Version": "2026-05-20" }, body: JSON.stringify({ idempotency_key: randomUUID(), subscription: { name: "Fortress invoice and dispute automation", notification_url: notificationUrl, api_version: "2026-05-20", event_types: ["invoice.published", "invoice.updated", "invoice.payment_made", "invoice.refunded", "invoice.canceled", "invoice.scheduled_charge_failed", "payment.updated", "dispute.created", "dispute.state.updated"] } }) });
const data = await response.json();
if (!response.ok) throw new Error(data.errors?.map((e) => e.detail || e.code).join("; ") || `Square returned ${response.status}`);
console.log(JSON.stringify({ id: data.subscription.id, notificationUrl: data.subscription.notification_url, signatureKey: data.subscription.signature_key, events: data.subscription.event_types }, null, 2));
console.error("Store signatureKey as SQUARE_WEBHOOK_SIGNATURE_KEY in the deployment secret manager; never commit it.");
