import { createBillingWorkflowToken } from "@/lib/billing-workflow-token";
import { docusealFetch } from "@/lib/docuseal";
import { invoiceTotal, parseInvoiceForm } from "@/lib/invoicing";

type Submission = { id: number; status?: string; name?: string; completed_at?: string; created_at?: string; submitters?: { email?: string; status?: string; external_id?: string }[] };
type CreatedSubmitter = { id: number; submission_id: number; status?: string };

export async function GET() {
  try { const data = await docusealFetch<Submission[] | { data?: Submission[] }>("/submissions?limit=30"); const list = Array.isArray(data) ? data : data.data || []; return Response.json({ engagements: list.map((item) => ({ id: item.id, name: item.name || `Submission ${item.id}`, status: item.status || "pending", email: item.submitters?.[0]?.email || "", createdAt: item.created_at, completedAt: item.completed_at })) }); }
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
    const clientRole = process.env.DOCUSEAL_CLIENT_ROLE || "Client";
    const submitters: Record<string, unknown>[] = [{ role: clientRole, name: `${input.givenName} ${input.familyName}`, email: input.email, phone: input.phone || undefined, order: 0, require_email_2fa: true, external_id: input.workflowId, metadata: { fortress_workflow: workflowToken }, fields: [{ name: "Client Name", default_value: `${input.givenName} ${input.familyName}`, readonly: true }, { name: "Client Company", default_value: input.company, readonly: true }, { name: "Invoice Number", default_value: input.invoiceNumber, readonly: true }, { name: "Service Description", default_value: input.description, readonly: true }, { name: "Total Amount", default_value: (total / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }), readonly: true }, { name: "Payment Schedule", default_value: input.depositPercent > 0 ? `${input.depositPercent}% deposit due ${input.depositDueDate}; balance due ${input.dueDate}` : `Full balance due ${input.dueDate}`, readonly: true }] }];
    if (process.env.DOCUSEAL_FIRM_SIGNER_EMAIL && process.env.DOCUSEAL_FIRM_SIGNER_NAME) submitters.push({ role: process.env.DOCUSEAL_FIRM_ROLE || "Fortress", name: process.env.DOCUSEAL_FIRM_SIGNER_NAME, email: process.env.DOCUSEAL_FIRM_SIGNER_EMAIL, order: 1, require_email_2fa: true, external_id: `${input.workflowId}:firm` });
    const created = await docusealFetch<CreatedSubmitter[]>("/submissions", { method: "POST", body: JSON.stringify({ template_id: templateId, send_email: true, order: "preserved", completed_redirect_url: `${process.env.PAYMENT_BASE_URL || "https://fortresstaxadvisors.com"}/engagement-complete`, bcc_completed: process.env.DOCUSEAL_COMPLETED_BCC || undefined, reply_to: process.env.DOCUSEAL_REPLY_TO || undefined, expire_at: new Date(Date.now() + 30 * 86400000).toISOString(), message: { subject: `Signature requested: ${input.title}`, body: `Please review the Fortress Tax Advisors engagement agreement for ${input.invoiceNumber}.\n\n[Review and sign the engagement]({{submitter.link}})\n\nThe itemized Square invoice will be issued automatically after all required signatures are complete.` }, submitters }) });
    const first = created[0];
    if (!first?.submission_id) throw new Error("DocuSeal did not return a submission ID");
    return Response.json({ submissionId: first.submission_id, invoiceNumber: input.invoiceNumber, submitterStatus: first.status || "sent" });
  } catch (cause) { return Response.json({ error: cause instanceof Error ? cause.message : "Could not send engagement" }, { status: 422 }); }
}
