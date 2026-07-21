import { createHmac, timingSafeEqual } from "node:crypto";
import { readBillingWorkflowToken } from "@/lib/billing-workflow-token";
import { completeEngagementWorkflow, getEngagementWorkflow } from "@/lib/billing-operations-store";
import {
  isServiceAcceptanceSubmission,
  serviceAcceptanceOutcome,
  serviceAcceptanceSubmitter,
  validateServiceAcceptanceLinkage,
  type DocuSealAcceptanceSubmission,
} from "@/lib/docuseal-service-acceptance";
import { archivePdf, downloadDocuSealPdf, evidenceSegment, type ArchivedEvidence } from "@/lib/evidence-archive";
import { getBillingEvidenceIndex, putBillingEvidenceIndex } from "@/lib/evidence-index-store";
import { docusealFetch } from "@/lib/docuseal";
import { createSquareInvoice } from "@/lib/invoicing";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";
import {
  advanceServiceAcceptance,
  getServiceAcceptance,
  ServiceAcceptanceConflictError,
} from "@/lib/service-acceptance-store";
import { readServiceAcceptanceToken } from "@/lib/service-acceptance-token";
import { readWebhookBody, WebhookBodyTooLargeError } from "@/lib/webhook-body";

type Submission = DocuSealAcceptanceSubmission & {
  combined_document_url?: string | null;
  audit_log_url?: string | null;
  submitters?: (NonNullable<DocuSealAcceptanceSubmission["submitters"]>[number] & {
    metadata?: Record<string, unknown> & { fortress_workflow?: string };
  })[];
};

async function verify(header: string, raw: string) {
  const { DOCUSEAL_WEBHOOK_SECRET: secret } = await getRuntimeSecrets();
  const [timestamp, supplied] = header.split(".", 2);
  if (!timestamp || !supplied || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let raw: string;
  try { raw = await readWebhookBody(request); }
  catch (cause) {
    if (cause instanceof WebhookBodyTooLargeError) return new Response(cause.message, { status: 413 });
    return new Response("Could not read event body", { status: 400 });
  }
  try {
    if (!await verify(request.headers.get("x-docuseal-signature") || "", raw)) return new Response("Invalid signature", { status: 403 });
  } catch { return new Response("Webhook verification is unavailable", { status: 503 }); }
  let event: { event_type?: string; data?: { id?: number } };
  try { event = JSON.parse(raw); }
  catch { return new Response("Invalid event body", { status: 400 }); }

  const submissionId = event.data?.id;
  if ((event.event_type === "submission.completed" || event.event_type === "submission.expired")
    && Number.isSafeInteger(submissionId) && submissionId! > 0) {
    try {
      await processSubmissionEvent(event.event_type, submissionId!);
    } catch (cause) {
      console.error("[docuseal] submission automation failed", {
        eventType: event.event_type,
        submissionId,
        error: cause instanceof Error ? cause.message : String(cause),
      });
      return Response.json({ error: "Submission automation failed; retry required" }, { status: 503 });
    }
  }
  return Response.json({ received: true });
}

function acceptanceTemplateId() {
  const value = Number(process.env.DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error("Service acceptance template is not configured");
  return value;
}

async function processSubmissionEvent(eventType: "submission.completed" | "submission.expired", submissionId: number) {
  const submission = await docusealFetch<Submission>(`/submissions/${submissionId}?include=combined_document_url`);
  const configuredTemplateId = Number(process.env.DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID);
  const isAcceptance = isServiceAcceptanceSubmission(
    submission,
    Number.isSafeInteger(configuredTemplateId) && configuredTemplateId > 0 ? configuredTemplateId : undefined,
  );
  if (isAcceptance) {
    if (eventType === "submission.completed") await completeServiceAcceptance(submissionId, submission);
    else await expireServiceAcceptance(submissionId, submission);
    return;
  }
  if (eventType === "submission.completed") await completeEngagement(submissionId, submission);
}

async function acceptanceContext(
  submissionId: number,
  submission: Submission,
  status: "completed" | "expired",
) {
  const { submitter, token } = serviceAcceptanceSubmitter(
    submission,
    submissionId,
    acceptanceTemplateId(),
    process.env.DOCUSEAL_CLIENT_ROLE || "Client",
    status,
  );
  const input = await readServiceAcceptanceToken(token);
  const record = await getServiceAcceptance(input.invoiceId, input.completionId);
  if (!record) throw new Error("Service acceptance has no canonical completion record");
  validateServiceAcceptanceLinkage(submitter, input, record);
  return { input, record, submitter };
}

async function signedAcceptancePdfs(submissionId: number, submission: Submission) {
  let signedUrl = submission.combined_document_url;
  if (!signedUrl) {
    const documents = await docusealFetch<{ documents?: { url?: string }[] }>(`/submissions/${submissionId}/documents?merge=true`);
    signedUrl = documents.documents?.[0]?.url;
  }
  if (!signedUrl) throw new Error("Completed service acceptance PDF is unavailable");
  if (!submission.audit_log_url) throw new Error("Service acceptance audit PDF is unavailable");
  const [signed, audit] = await Promise.all([
    downloadDocuSealPdf(signedUrl, "completed service acceptance"),
    downloadDocuSealPdf(submission.audit_log_url, "service acceptance audit log"),
  ]);
  return { signed, audit };
}

async function completeServiceAcceptance(submissionId: number, submission: Submission) {
  const { input, record, submitter } = await acceptanceContext(submissionId, submission, "completed");
  const outcome = serviceAcceptanceOutcome(submitter, input);
  if (record.status === outcome.status) {
    if (!record.acceptanceArtifact || !record.auditArtifact) throw new Error("Completed acceptance is missing archived evidence");
    return;
  }
  if (record.status !== "SENT") throw new Error("Service acceptance is not awaiting a client response");

  // Archive immutable evidence before changing the workflow state. A failed
  // archive leaves the record SENT and causes DocuSeal to retry this callback.
  const { signed, audit } = await signedAcceptancePdfs(submissionId, submission);
  const invoiceSegment = evidenceSegment(input.invoiceNumber);
  const completionSegment = evidenceSegment(input.completionId);
  const [acceptanceArtifact, auditArtifact] = await Promise.all([
    archivePdf(`acceptances/${invoiceSegment}/${completionSegment}/${submissionId}-signed.pdf`, signed),
    archivePdf(`acceptances/${invoiceSegment}/${completionSegment}/${submissionId}-audit.pdf`, audit),
  ]);
  try {
    await advanceServiceAcceptance(record, {
      status: outcome.status,
      actor: "docuseal-webhook",
      note: outcome.auditNote,
      docusealSubmissionId: submissionId,
      signerName: outcome.signerName,
      signerEmail: outcome.signerEmail,
      acceptanceArtifact,
      auditArtifact,
    });
  } catch (cause) {
    if (!(cause instanceof ServiceAcceptanceConflictError)) throw cause;
    const latest = await getServiceAcceptance(input.invoiceId, input.completionId);
    if (!latest || latest.status !== outcome.status || latest.docusealSubmissionId !== submissionId
      || !latest.acceptanceArtifact || !latest.auditArtifact) throw cause;
  }
  // Deliberately no Square operation: an acknowledgment records delivery
  // evidence only and must never create, publish, charge, or alter an invoice.
  console.info("[docuseal] service acceptance outcome archived", JSON.stringify({
    submissionId,
    invoiceId: input.invoiceId,
    completionId: input.completionId,
    outcome: outcome.status,
  }));
}

async function expireServiceAcceptance(submissionId: number, submission: Submission) {
  const { input, record } = await acceptanceContext(submissionId, submission, "expired");
  if (record.status === "EXPIRED") return;
  if (record.status !== "SENT") throw new Error("Expired submission is not the active service acceptance attempt");
  try {
    await advanceServiceAcceptance(record, {
      status: "EXPIRED",
      actor: "docuseal-webhook",
      note: "DocuSeal acknowledgment request expired before the client responded",
      docusealSubmissionId: submissionId,
    });
  } catch (cause) {
    if (!(cause instanceof ServiceAcceptanceConflictError)) throw cause;
    const latest = await getServiceAcceptance(input.invoiceId, input.completionId);
    if (!latest || latest.status !== "EXPIRED" || latest.docusealSubmissionId !== submissionId) throw cause;
  }
}

async function completeEngagement(submissionId: number, submission: Submission) {
  if (submission.status !== "completed") throw new Error("DocuSeal submission is not completed");
  const token = submission.submitters?.map((s) => s.metadata?.fortress_workflow).find((value): value is string => typeof value === "string" && Boolean(value));
  if (!token) throw new Error("Completed submission has no Fortress billing workflow");
  const input = await readBillingWorkflowToken(token);
  const workflow = await getEngagementWorkflow(input.invoiceNumber);
  if (!workflow) {
    if (process.env.FORTRESS_DEPLOYMENT_STAGE === "production") throw new Error("Completed submission has no canonical engagement reservation");
  } else if (workflow.status === "CREATED") {
    if (workflow.submissionId !== submissionId) throw new Error("Completed submission is not the canonical engagement for this invoice");
  } else {
    await completeEngagementWorkflow(workflow, submissionId);
  }
  let agreement: Blob;
  let auditLog: Blob | undefined;
  if (submission.combined_document_url) {
    agreement = await downloadDocuSealPdf(submission.combined_document_url, "completed signed agreement");
  } else {
    const documents = await docusealFetch<{ documents?: { url?: string }[] }>(`/submissions/${submissionId}/documents?merge=true`);
    const url = documents.documents?.[0]?.url;
    if (!url) throw new Error("Completed signed PDF is unavailable");
    agreement = await downloadDocuSealPdf(url, "completed signed agreement");
  }
  if (submission.audit_log_url) auditLog = await downloadDocuSealPdf(submission.audit_log_url, "signature audit log");
  const existingEvidence = await getBillingEvidenceIndex(input.invoiceNumber);
  let agreementArtifact: ArchivedEvidence | undefined, auditArtifact: ArchivedEvidence | undefined;
  if (!existingEvidence) {
    const segment = evidenceSegment(input.invoiceNumber);
    agreementArtifact = await archivePdf(`engagements/${segment}/${submissionId}-signed-agreement.pdf`, agreement);
    auditArtifact = auditLog ? await archivePdf(`engagements/${segment}/${submissionId}-signature-audit.pdf`, auditLog) : undefined;
  }
  const invoice = await createSquareInvoice(input, agreement, auditLog);
  if (!existingEvidence && agreementArtifact) {
    await putBillingEvidenceIndex({
      itemType: "EVIDENCE_INDEX", invoiceNumber: input.invoiceNumber, workflowId: input.workflowId,
      engagementSubmissionId: submissionId, squareInvoiceId: invoice.invoiceId, squareOrderId: invoice.orderId,
      squareCustomerId: invoice.customerId, clientName: `${input.givenName} ${input.familyName}`,
      clientEmail: input.email, payerRelationship: input.payerRelationship || "SIGNER",
      ...(input.authorizedPayerName ? { authorizedPayerName: input.authorizedPayerName } : {}),
      ...(input.authorizedPayerEmail ? { authorizedPayerEmail: input.authorizedPayerEmail } : {}),
      agreementArtifact, ...(auditArtifact ? { auditArtifact } : {}), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  }
  console.info("[docuseal] completed engagement created Square invoice", JSON.stringify({ submissionId, workflowId: input.workflowId, invoiceNumber: input.invoiceNumber }));
}
