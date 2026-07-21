import { acquireServiceAcceptanceAttempt, completeServiceAcceptanceAttempt, createServiceAcceptance, getServiceAcceptance, listServiceAcceptances, advanceServiceAcceptance, ServiceAcceptanceConflictError } from "@/lib/service-acceptance-store";
import { currentServiceAcceptanceExternalId } from "@/lib/docuseal-service-acceptance";
import { parseServiceDelivery } from "@/lib/service-acceptance";
import { createServiceAcceptanceToken } from "@/lib/service-acceptance-token";
import { getBillingEvidenceIndex } from "@/lib/evidence-index-store";
import { docusealFetch } from "@/lib/docuseal";
import { squareFetch } from "@/lib/square";
import { readWebhookBody, WebhookBodyTooLargeError } from "@/lib/webhook-body";

type Submitter = { id: number; submission_id: number; status?: string; slug?: string };
type SquareInvoice = { id: string; invoice_number?: string; order_id?: string; status?: string; primary_recipient?: { customer_id?: string; email_address?: string } };
type SquareCustomer = { id: string; given_name?: string; family_name?: string; company_name?: string; email_address?: string };

class RequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
const allowedInvoiceStates = new Set(["SCHEDULED", "UNPAID", "PARTIALLY_PAID", "PAYMENT_PENDING", "PAID", "OVERDUE"]);

function sameOrigin(request: Request) {
  const base = process.env.PAYMENT_BASE_URL;
  return Boolean(base && request.headers.get("origin") === new URL(base).origin);
}

function signingUrls(submitters: Submitter[]) {
  if (process.env.FORTRESS_DEPLOYMENT_STAGE !== "sandbox") return undefined;
  const origin = new URL(process.env.DOCUSEAL_BASE_URL || "").origin;
  return submitters.flatMap((item) => item.slug ? [`${origin}/s/${item.slug}`] : []);
}

async function findSubmitters(externalId: string) {
  const data = await docusealFetch<Submitter[] | { data?: Submitter[] }>(`/submitters?external_id=${encodeURIComponent(externalId)}&limit=10`);
  return Array.isArray(data) ? data : data.data || [];
}

async function authoritativeInput(invoiceId: string) {
  if (!invoiceId || invoiceId.length > 128) throw new RequestError("Invoice ID is invalid", 400);
  const { invoice } = await squareFetch<{ invoice: SquareInvoice }>(`/v2/invoices/${encodeURIComponent(invoiceId)}`);
  if (invoice.id !== invoiceId || !invoice.order_id || !invoice.invoice_number || !invoice.status || !allowedInvoiceStates.has(invoice.status)) throw new RequestError("Square invoice is not eligible for a completion acknowledgment", 409);
  const customerId = invoice.primary_recipient?.customer_id;
  if (!customerId) throw new RequestError("Square invoice has no client record", 409);
  const { customer } = await squareFetch<{ customer: SquareCustomer }>(`/v2/customers/${encodeURIComponent(customerId)}`);
  const email = (customer.email_address || invoice.primary_recipient?.email_address || "").toLowerCase();
  const name = `${customer.given_name || ""} ${customer.family_name || ""}`.trim();
  if (!email || !name) throw new RequestError("Square client name and email are required", 409);
  return { invoiceId, invoiceNumber: invoice.invoice_number, orderId: invoice.order_id, clientName: name, clientEmail: email, company: customer.company_name || "" };
}

export async function GET(request: Request) {
  try {
    const invoiceId = new URL(request.url).searchParams.get("invoiceId")?.trim();
    return Response.json({ acceptances: await listServiceAcceptances(invoiceId || undefined) }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (cause) { return Response.json({ error: cause instanceof Error ? cause.message : "Could not load completion evidence" }, { status: 502 }); }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new RequestError("Invalid request origin", 403);
    const templateId = Number(process.env.DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID);
    if (!Number.isSafeInteger(templateId) || templateId <= 0) throw new RequestError("Service acceptance template is not configured", 503);
    let raw: string;
    try { raw = await readWebhookBody(request, 24_576); }
    catch (cause) { if (cause instanceof WebhookBodyTooLargeError) throw new RequestError("Request body is too large", 413); throw cause; }
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { throw new RequestError("Request body must be valid JSON", 400); }
    if (body.confirmed !== true) throw new RequestError("Confirm the delivery record before requesting acknowledgment", 422);
    const authoritative = await authoritativeInput(typeof body.invoiceId === "string" ? body.invoiceId : "");
    const evidence = await getBillingEvidenceIndex(authoritative.invoiceNumber);
    const input = parseServiceDelivery({
      ...body,
      payerRelationship: evidence?.payerRelationship || "SIGNER",
      authorizedPayerName: evidence?.authorizedPayerName || "",
      authorizedPayerEmail: evidence?.authorizedPayerEmail || "",
    }, authoritative);
    const actor = request.headers.get("x-fortress-actor") || "authenticated-billing-operator";
    let record = await getServiceAcceptance(input.invoiceId, input.completionId);
    if (!record) {
      try {
        record = await createServiceAcceptance({ invoiceId: input.invoiceId, invoiceNumber: input.invoiceNumber, milestoneId: input.completionId, squareInvoiceId: input.invoiceId, engagementSubmissionId: evidence?.engagementSubmissionId, serviceDate: input.deliveryDate, serviceSummary: input.serviceSummary, actor, note: `Delivered by ${input.deliveryMethod} to ${input.deliveredTo}` });
      } catch (cause) {
        if (!(cause instanceof ServiceAcceptanceConflictError)) throw cause;
        record = await getServiceAcceptance(input.invoiceId, input.completionId);
      }
    }
    if (!record || record.serviceDate !== input.deliveryDate || record.serviceSummary !== input.serviceSummary) throw new RequestError("Completion record conflicts with existing evidence", 409);
    if (!new Set(["DELIVERED", "EXPIRED", "SENT"]).has(record.status)) {
      return Response.json({ acceptance: record, existing: true });
    }
    // The version that precedes SENT is the stable attempt identifier. A retry
    // of an uncertain create finds the same DocuSeal request, while an EXPIRED
    // record gets a fresh identifier and cannot collide with its old submitter.
    const externalId = currentServiceAcceptanceExternalId(record);
    let existingSubmitters = await findSubmitters(externalId);
    const existingSubmissionIds = [...new Set(existingSubmitters.map((item) => item.submission_id))];
    if (existingSubmissionIds.length > 1) throw new RequestError("Multiple DocuSeal acknowledgments exist for this milestone; review them before continuing", 409);
    if (existingSubmissionIds[0]) {
      if (record.status === "DELIVERED" || record.status === "EXPIRED") record = (await advanceServiceAcceptance(record, { status: "SENT", actor, docusealSubmissionId: existingSubmissionIds[0], note: "Recovered existing DocuSeal acknowledgment attempt" })).record;
      return Response.json({ acceptance: record, existing: true, signingUrls: signingUrls(existingSubmitters) });
    }
    if (record.status === "SENT") throw new RequestError("The active DocuSeal acknowledgment could not be found; review it before retrying", 409);
    const attempt = await acquireServiceAcceptanceAttempt(externalId);
    if (attempt.state === "BUSY") throw new RequestError("This acknowledgment attempt is already being created. Wait a moment, then reload before retrying.", 409);
    if (attempt.state === "CREATED") {
      throw new RequestError(`Reserved DocuSeal acknowledgment ${attempt.submissionId} is not yet visible in the signer index. Review DocuSeal or wait, then retry; no duplicate was created.`, 409);
    }
    const workflowToken = await createServiceAcceptanceToken(input);
    const sendEmail = process.env.FORTRESS_DEPLOYMENT_STAGE !== "sandbox" || process.env.DOCUSEAL_SANDBOX_SEND_EMAIL !== "false";
    let created: Submitter[];
    try {
      created = await docusealFetch<Submitter[]>("/submissions", { method: "POST", body: JSON.stringify({
        template_id: templateId, send_email: sendEmail, order: "preserved",
        completed_redirect_url: `${process.env.PAYMENT_BASE_URL}/engagement-complete?kind=acceptance`,
        expire_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        message: { subject: `Service delivery acknowledgment: ${input.invoiceNumber}`, body: `Please review the completed-service record for ${input.invoiceNumber}. This acknowledgment does not charge a payment or waive cardholder rights.\n\n[Review the delivery record]({{submitter.link}})` },
        submitters: [{ role: process.env.DOCUSEAL_CLIENT_ROLE || "Client", name: input.clientName, email: input.clientEmail, order: 0, require_email_2fa: true, external_id: externalId, metadata: { fortress_service_acceptance: workflowToken, fortress_workflow_kind: "service_acceptance" }, fields: [
          { name: "Client Name", default_value: input.clientName, readonly: true }, { name: "Client Company", default_value: input.company, readonly: true },
          { name: "Invoice Number", default_value: input.invoiceNumber, readonly: true }, { name: "Completion Record ID", default_value: input.completionId, readonly: true },
          { name: "Service or Milestone", default_value: input.milestoneTitle, readonly: true }, { name: "Completed Deliverables", default_value: input.serviceSummary, readonly: true },
          { name: "Delivery Date", default_value: input.deliveryDate, readonly: true },
          { name: "Delivery Method", default_value: input.deliveryMethod.replaceAll("_", " ").toLowerCase(), readonly: true }, { name: "Delivered To", default_value: input.deliveredTo, readonly: true },
        ] }],
      }) });
    } catch { throw new RequestError("DocuSeal outcome is uncertain. The delivery record is preserved; review DocuSeal before retrying.", 502); }
    const submissionId = created[0]?.submission_id;
    if (!submissionId) throw new RequestError("DocuSeal did not return an acknowledgment submission ID", 502);
    await completeServiceAcceptanceAttempt(attempt.lease, submissionId);
    record = (await advanceServiceAcceptance(record, { status: "SENT", actor, docusealSubmissionId: submissionId, note: "Service acknowledgment requested" })).record;
    existingSubmitters = created;
    return Response.json({ acceptance: record, existing: false, signingUrls: signingUrls(existingSubmitters) }, { status: 201 });
  } catch (cause) {
    const status = cause instanceof RequestError ? cause.status : cause instanceof ServiceAcceptanceConflictError ? 409 : 500;
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not request service acknowledgment" }, { status });
  }
}
