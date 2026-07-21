import { createHash } from "node:crypto";
import { completeEngagementWorkflow, getEngagementWorkflow, renewEngagementWorkflow, reserveEngagementWorkflow } from "@/lib/billing-operations-store";
import { createBillingWorkflowToken } from "@/lib/billing-workflow-token";
import { docusealFetch } from "@/lib/docuseal";
import { invoiceTotal, parseInvoiceForm, preflightSquareCustomer } from "@/lib/invoicing";

type Submission = { id: number; status?: string; name?: string; completed_at?: string; created_at?: string; submitters?: { email?: string; status?: string; external_id?: string }[] };
type CreatedSubmitter = { id: number; submission_id: number; status?: string; slug?: string };

async function recoverDocuSealWorkflow(workflowId: string) {
  const responses = await Promise.all([workflowId, `${workflowId}:firm`].map((externalId) =>
    docusealFetch<CreatedSubmitter[] | { data?: CreatedSubmitter[] }>(`/submitters?external_id=${encodeURIComponent(externalId)}&limit=10`),
  ));
  const submitters = responses.flatMap((data) => Array.isArray(data) ? data : data.data || []);
  const submissionIds = [...new Set(submitters.map((item) => item.submission_id).filter(Number.isSafeInteger))];
  if (submissionIds.length > 1) throw new Error("Multiple DocuSeal submissions use this workflow ID; review them before continuing");
  const origin = new URL(process.env.DOCUSEAL_BASE_URL || "https://sign.fortresstaxadvisors.com/api").origin;
  return {
    submissionId: submissionIds[0],
    signingUrls: submitters.flatMap((item) => item.slug ? [`${origin}/s/${item.slug}`] : []),
  };
}

export async function GET() {
  try {
    const list: Submission[] = [];
    const seenAfter = new Set<number>();
    let after: number | undefined;
    do {
      const data = await docusealFetch<Submission[] | { data?: Submission[]; pagination?: { next?: number } }>(`/submissions?limit=100${after ? `&after=${after}` : ""}`);
      list.push(...(Array.isArray(data) ? data : data.data || []));
      after = Array.isArray(data) ? undefined : data.pagination?.next;
      if (after && seenAfter.has(after)) throw new Error("DocuSeal returned a repeated submissions cursor");
      if (after) seenAfter.add(after);
    } while (after && list.length < 500);
    return Response.json({ engagements: list.map((item) => ({ id: item.id, name: item.name || `Submission ${item.id}`, status: item.status || "pending", email: item.submitters?.[0]?.email || "", createdAt: item.created_at, completedAt: item.completed_at })), warning: after ? "DocuSeal history is truncated at 500 records" : undefined });
  }
  catch (cause) { return Response.json({ error: cause instanceof Error ? cause.message : "Could not load engagements" }, { status: 502 }); }
}

export async function POST(request: Request) {
  try {
    const baseUrl = process.env.PAYMENT_BASE_URL;
    if (!baseUrl) throw new Error("PAYMENT_BASE_URL is not configured");
    const expectedOrigin = new URL(baseUrl).origin;
    if (request.headers.get("origin") !== expectedOrigin) return new Response("Invalid request origin", { status: 403 });
    const input = parseInvoiceForm(await request.formData());
    const templateId = Number(process.env.DOCUSEAL_ENGAGEMENT_TEMPLATE_ID);
    if (!Number.isSafeInteger(templateId) || templateId <= 0) throw new Error("DOCUSEAL_ENGAGEMENT_TEMPLATE_ID is not configured");
    const total = invoiceTotal(input);
    const workflowToken = await createBillingWorkflowToken(input);
    const workflowHash = createHash("sha256").update(JSON.stringify({ templateId, input })).digest("hex");
    const prior = await getEngagementWorkflow(input.invoiceNumber);
    if (!prior) await preflightSquareCustomer(input);
    let reservation = await reserveEngagementWorkflow(input.invoiceNumber, workflowHash);
    if (reservation.record.workflowHash !== workflowHash) {
      return Response.json({ error: "This invoice number is already reserved for different client, scope, amount, or dates" }, { status: 409 });
    }
    if (!reservation.created) {
      if (reservation.record.status === "CREATED" && reservation.record.submissionId) {
        const recovered = process.env.FORTRESS_DEPLOYMENT_STAGE === "sandbox" ? await recoverDocuSealWorkflow(input.workflowId) : undefined;
        return Response.json({ submissionId: reservation.record.submissionId, invoiceNumber: input.invoiceNumber, existing: true, signingUrls: recovered?.signingUrls });
      }
      const recovered = await recoverDocuSealWorkflow(input.workflowId);
      if (recovered.submissionId) {
        const completed = await completeEngagementWorkflow(reservation.record, recovered.submissionId);
        return Response.json({ submissionId: completed.submissionId, invoiceNumber: input.invoiceNumber, existing: true, signingUrls: process.env.FORTRESS_DEPLOYMENT_STAGE === "sandbox" ? recovered.signingUrls : undefined });
      }
      if (Date.now() - Date.parse(reservation.record.updatedAt) < 5 * 60_000) {
        return Response.json({ error: "This engagement is already being created. Review DocuSeal before retrying; a duplicate was not sent." }, { status: 409 });
      }
      await preflightSquareCustomer(input);
      reservation = { record: await renewEngagementWorkflow(reservation.record), created: true };
    }
    const sendEmail = process.env.FORTRESS_DEPLOYMENT_STAGE !== "sandbox"
      || process.env.DOCUSEAL_SANDBOX_SEND_EMAIL !== "false";
    const clientRole = process.env.DOCUSEAL_CLIENT_ROLE || "Client";
    const submitters: Record<string, unknown>[] = [{ role: clientRole, name: `${input.givenName} ${input.familyName}`, email: input.email, phone: input.phone || undefined, order: 0, require_email_2fa: true, external_id: input.workflowId, metadata: { fortress_workflow: workflowToken }, fields: [{ name: "Client Name", default_value: `${input.givenName} ${input.familyName}`, readonly: true }, { name: "Client Company", default_value: input.company, readonly: true }, { name: "Invoice Number", default_value: input.invoiceNumber, readonly: true }, { name: "Service Description", default_value: input.description, readonly: true }, { name: "Total Amount", default_value: (total / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }), readonly: true }, { name: "Payment Schedule", default_value: input.depositPercent > 0 ? `${input.depositPercent}% deposit due ${input.depositDueDate}; balance due ${input.dueDate}` : `Full balance due ${input.dueDate}`, readonly: true }] }];
    if (process.env.DOCUSEAL_FIRM_SIGNER_EMAIL && process.env.DOCUSEAL_FIRM_SIGNER_NAME) submitters.push({ role: process.env.DOCUSEAL_FIRM_ROLE || "Fortress", name: process.env.DOCUSEAL_FIRM_SIGNER_NAME, email: process.env.DOCUSEAL_FIRM_SIGNER_EMAIL, order: 1, require_email_2fa: true, external_id: `${input.workflowId}:firm` });
    let created: CreatedSubmitter[];
    try {
      created = await docusealFetch<CreatedSubmitter[]>("/submissions", { method: "POST", body: JSON.stringify({ template_id: templateId, send_email: sendEmail, order: "preserved", completed_redirect_url: `${process.env.PAYMENT_BASE_URL || "https://fortresstaxadvisors.com"}/engagement-complete`, bcc_completed: process.env.DOCUSEAL_COMPLETED_BCC || undefined, reply_to: process.env.DOCUSEAL_REPLY_TO || undefined, expire_at: new Date(Date.now() + 30 * 86400000).toISOString(), message: { subject: `Signature requested: ${input.title}`, body: `Please review the Fortress Tax Advisors engagement agreement for ${input.invoiceNumber}.\n\n[Review and sign the engagement]({{submitter.link}})\n\nThe itemized Square invoice will be issued automatically after all required signatures are complete.` }, submitters }) });
    } catch {
      throw new Error("DocuSeal outcome is uncertain. A duplicate was blocked; review DocuSeal for this invoice number before any retry.");
    }
    const first = created[0];
    if (!first?.submission_id) throw new Error("DocuSeal did not return a submission ID");
    try { await completeEngagementWorkflow(reservation.record, first.submission_id); }
    catch { throw new Error(`DocuSeal submission ${first.submission_id} exists, but the local workflow record needs review. Do not resend it.`); }
    const signingUrls = sendEmail
      ? undefined
      : created.flatMap((submitter) => submitter.slug
        ? [`${new URL(process.env.DOCUSEAL_BASE_URL || "https://sign.fortresstaxadvisors.com/api").origin}/s/${submitter.slug}`]
        : []);
    return Response.json({ submissionId: first.submission_id, invoiceNumber: input.invoiceNumber, submitterStatus: first.status || "sent", signingUrls, existing: false });
  } catch (cause) { return Response.json({ error: cause instanceof Error ? cause.message : "Could not send engagement" }, { status: 422 }); }
}
