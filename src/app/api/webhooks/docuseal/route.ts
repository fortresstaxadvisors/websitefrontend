import { createHmac, timingSafeEqual } from "node:crypto";
import { readBillingWorkflowToken } from "@/lib/billing-workflow-token";
import { docusealFetch } from "@/lib/docuseal";
import { createSquareInvoice } from "@/lib/invoicing";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

async function verify(header: string, raw: string) { const { DOCUSEAL_WEBHOOK_SECRET: secret } = await getRuntimeSecrets(); const [timestamp, supplied] = header.split(".", 2); if (!timestamp || !supplied || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false; const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex"); const a = Buffer.from(supplied), b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b); }

export async function POST(request: Request) {
  const raw = await request.text();
  try {
    if (!await verify(request.headers.get("x-docuseal-signature") || "", raw)) return new Response("Invalid signature", { status: 403 });
  } catch { return new Response("Webhook verification is unavailable", { status: 503 }); }
  const event = JSON.parse(raw) as { event_type?: string; data?: { id?: number } };
  // Return a non-2xx response on automation failure so DocuSeal retries the
  // completed event. Square idempotency keys make each retry safe.
  if (event.event_type === "submission.completed" && event.data?.id) {
    try { await complete(event.data.id); }
    catch (cause) { console.error("[docuseal] completion automation failed", { submissionId: event.data.id, error: cause instanceof Error ? cause.message : String(cause) }); return Response.json({ error: "Completion automation failed; retry required" }, { status: 503 }); }
  }
  return Response.json({ received: true });
}

async function complete(submissionId: number) {
  const submission = await docusealFetch<{ status?: string; combined_document_url?: string | null; audit_log_url?: string | null; submitters?: { metadata?: { fortress_workflow?: string } }[] }>(`/submissions/${submissionId}?include=combined_document_url`);
    if (submission.status !== "completed") throw new Error("DocuSeal submission is not completed");
    const token = submission.submitters?.map((s) => s.metadata?.fortress_workflow).find(Boolean);
    if (!token) throw new Error("Completed submission has no Fortress billing workflow");
    const input = await readBillingWorkflowToken(token);
  let agreement: Blob;
  let auditLog: Blob | undefined;
  if (submission.combined_document_url) {
    agreement = await downloadPdf(submission.combined_document_url, "completed signed agreement");
  } else {
    const documents = await docusealFetch<{ documents?: { url?: string }[] }>(`/submissions/${submissionId}/documents?merge=true`);
    const url = documents.documents?.[0]?.url;
    if (!url) throw new Error("Completed signed PDF is unavailable");
    agreement = await downloadPdf(url, "completed signed agreement");
  }
  if (submission.audit_log_url) auditLog = await downloadPdf(submission.audit_log_url, "signature audit log");
  await createSquareInvoice(input, agreement, auditLog);
  console.info("[docuseal] completed engagement created Square invoice", JSON.stringify({ submissionId, workflowId: input.workflowId, invoiceNumber: input.invoiceNumber }));
}

async function downloadPdf(url: string, label: string) { const response = await fetch(url, { cache: "no-store" }); if (!response.ok) throw new Error(`Could not download ${label}`); const blob = await response.blob(); if (blob.type && blob.type !== "application/pdf") throw new Error(`${label} was not returned as a PDF`); return blob; }
