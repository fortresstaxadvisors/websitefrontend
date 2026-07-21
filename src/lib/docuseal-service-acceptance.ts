import type { ServiceAcceptanceInput } from "@/lib/service-acceptance";
import type { ServiceAcceptanceRecord } from "@/lib/service-acceptance-workflow";

export const SERVICE_ACCEPTANCE_ACKNOWLEDGMENT = "I acknowledge receipt and review of the listed deliverables";
export const SERVICE_ACCEPTANCE_ISSUE_REPORT = "I am reporting an issue with the listed deliverables";

type DocuSealValue = string | number | boolean | unknown[] | null;

export type DocuSealAcceptanceSubmitter = {
  id?: number;
  submission_id?: number;
  status?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  external_id?: string | null;
  metadata?: Record<string, unknown>;
  values?: { field?: string; value?: DocuSealValue }[];
};

export type DocuSealAcceptanceSubmission = {
  id?: number;
  status?: string;
  template?: { id?: number } | null;
  submitters?: DocuSealAcceptanceSubmitter[];
};

export type ServiceAcceptanceOutcome = {
  status: "COMPLETED" | "DECLINED";
  signerName: string;
  signerEmail: string;
  clientComment: string;
  auditNote: string;
};

export class DocuSealAcceptanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocuSealAcceptanceValidationError";
  }
}

function requiredText(value: unknown, label: string, maximum = 2_000) {
  if (typeof value !== "string") throw new DocuSealAcceptanceValidationError(`${label} is missing`);
  const result = value.trim();
  if (!result || result.length > maximum || /\0/.test(result)) {
    throw new DocuSealAcceptanceValidationError(`${label} is invalid`);
  }
  return result;
}

function fieldMap(submitter: DocuSealAcceptanceSubmitter) {
  const result = new Map<string, DocuSealValue>();
  for (const item of submitter.values || []) {
    const name = typeof item.field === "string" ? item.field.trim() : "";
    if (!name) continue;
    if (result.has(name)) throw new DocuSealAcceptanceValidationError(`DocuSeal field ${name} is duplicated`);
    result.set(name, item.value ?? null);
  }
  return result;
}

function exactField(fields: Map<string, DocuSealValue>, name: string, expected: string) {
  const value = fields.get(name);
  if (typeof value !== "string" || value.trim() !== expected) {
    throw new DocuSealAcceptanceValidationError(`${name} does not match the protected completion record`);
  }
}

function hasSignature(value: DocuSealValue | undefined) {
  if (typeof value === "string") return Boolean(value.trim());
  return Array.isArray(value) && value.length > 0;
}

export function serviceAcceptanceAttemptExternalId(invoiceId: string, milestoneId: string, attemptVersion: number) {
  const invoice = requiredText(invoiceId, "Invoice ID", 191);
  const milestone = requiredText(milestoneId, "Completion record ID", 96);
  if (!Number.isSafeInteger(attemptVersion) || attemptVersion < 1) {
    throw new DocuSealAcceptanceValidationError("Acceptance attempt version is invalid");
  }
  return `acceptance:${invoice}:${milestone}:v${attemptVersion}`;
}

export function currentServiceAcceptanceExternalId(record: Pick<ServiceAcceptanceRecord, "invoiceId" | "milestoneId" | "status" | "version">) {
  if (!new Set(["DELIVERED", "EXPIRED", "SENT", "COMPLETED", "DECLINED"]).has(record.status)) {
    throw new DocuSealAcceptanceValidationError("Acceptance is not in an active signing attempt");
  }
  const attemptVersion = record.status === "SENT"
    ? record.version - 1
    : record.status === "COMPLETED" || record.status === "DECLINED"
      ? record.version - 2
      : record.version;
  return serviceAcceptanceAttemptExternalId(record.invoiceId, record.milestoneId, attemptVersion);
}

function linkedServiceAcceptanceExternalIds(record: Pick<ServiceAcceptanceRecord, "invoiceId" | "milestoneId" | "status" | "version">) {
  const attemptVersion = record.status === "EXPIRED"
    ? record.version - 2
    : record.status === "SENT"
      ? record.version - 1
      : record.status === "COMPLETED" || record.status === "DECLINED"
        ? record.version - 2
        : record.version;
  const ids = [serviceAcceptanceAttemptExternalId(record.invoiceId, record.milestoneId, attemptVersion)];
  // Accept the exact pre-versioning first-attempt identifier for in-flight
  // requests created before this rollout. All new and resent attempts use vN.
  if (attemptVersion === 1) ids.push(`acceptance:${record.invoiceId}:${record.milestoneId}`);
  return ids;
}

export function isServiceAcceptanceSubmission(submission: DocuSealAcceptanceSubmission, acceptanceTemplateId?: number) {
  return Boolean(
    (acceptanceTemplateId && submission.template?.id === acceptanceTemplateId)
    || submission.submitters?.some((submitter) =>
      submitter.external_id?.startsWith("acceptance:")
      || submitter.metadata?.fortress_workflow_kind === "service_acceptance"
      || typeof submitter.metadata?.fortress_service_acceptance === "string"),
  );
}

export function serviceAcceptanceSubmitter(
  submission: DocuSealAcceptanceSubmission,
  expectedSubmissionId: number,
  expectedTemplateId: number,
  expectedRole = "Client",
  expectedStatus: "completed" | "expired" = "completed",
) {
  if (submission.id !== expectedSubmissionId || submission.status !== expectedStatus) {
    throw new DocuSealAcceptanceValidationError(`DocuSeal submission is not ${expectedStatus}`);
  }
  if (submission.template?.id !== expectedTemplateId) {
    throw new DocuSealAcceptanceValidationError("DocuSeal acceptance template does not match configuration");
  }
  if (!Array.isArray(submission.submitters) || submission.submitters.length !== 1) {
    throw new DocuSealAcceptanceValidationError("Service acceptance must contain exactly one client submitter");
  }
  const submitter = submission.submitters[0];
  if (submitter.submission_id !== expectedSubmissionId || submitter.role !== expectedRole) {
    throw new DocuSealAcceptanceValidationError("DocuSeal client submitter linkage is invalid");
  }
  if (submitter.metadata?.fortress_workflow_kind !== "service_acceptance") {
    throw new DocuSealAcceptanceValidationError("DocuSeal workflow kind is invalid");
  }
  const token = requiredText(submitter.metadata?.fortress_service_acceptance, "Service acceptance token", 16_384);
  return { submitter, token };
}

export function validateServiceAcceptanceLinkage(
  submitter: DocuSealAcceptanceSubmitter,
  input: ServiceAcceptanceInput,
  record: ServiceAcceptanceRecord,
) {
  if (record.invoiceId !== input.invoiceId || record.invoiceNumber !== input.invoiceNumber
    || record.milestoneId !== input.completionId || record.serviceDate !== input.deliveryDate
    || record.serviceSummary !== input.serviceSummary) {
    throw new DocuSealAcceptanceValidationError("Acceptance token does not match the stored completion record");
  }
  if (record.docusealSubmissionId !== submitter.submission_id) {
    throw new DocuSealAcceptanceValidationError("DocuSeal submission is not the active acceptance attempt");
  }
  if (!linkedServiceAcceptanceExternalIds(record).includes(submitter.external_id || "")) {
    throw new DocuSealAcceptanceValidationError("DocuSeal external ID does not match the active acceptance attempt");
  }
  if (submitter.email?.trim().toLowerCase() !== input.clientEmail.trim().toLowerCase()) {
    throw new DocuSealAcceptanceValidationError("DocuSeal signer email does not match the intended client");
  }
}

function sanitizedAuditComment(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 350);
}

export function serviceAcceptanceOutcome(
  submitter: DocuSealAcceptanceSubmitter,
  input: ServiceAcceptanceInput,
): ServiceAcceptanceOutcome {
  if (submitter.status !== "completed") throw new DocuSealAcceptanceValidationError("Client submitter is not completed");
  const fields = fieldMap(submitter);
  exactField(fields, "Client Name", input.clientName);
  exactField(fields, "Client Company", input.company);
  exactField(fields, "Invoice Number", input.invoiceNumber);
  exactField(fields, "Completion Record ID", input.completionId);
  exactField(fields, "Service or Milestone", input.milestoneTitle);
  exactField(fields, "Delivery Date", input.deliveryDate);
  exactField(fields, "Delivery Method", input.deliveryMethod.replaceAll("_", " ").toLowerCase());
  exactField(fields, "Delivered To", input.deliveredTo);
  exactField(fields, "Completed Deliverables", input.serviceSummary);

  const response = requiredText(fields.get("Client Response"), "Client Response", 100);
  if (response !== SERVICE_ACCEPTANCE_ACKNOWLEDGMENT && response !== SERVICE_ACCEPTANCE_ISSUE_REPORT) {
    throw new DocuSealAcceptanceValidationError("Client Response is not an allowed outcome");
  }
  const clientComment = requiredText(fields.get("Client Comments or Issue Description"), "Client Comments or Issue Description");
  requiredText(fields.get("Client Rights Initials"), "Client Rights Initials", 32);
  const signerName = requiredText(fields.get("Client Printed Legal Name"), "Client Printed Legal Name", 191);
  if (fields.has("Client Signer Title") && fields.get("Client Signer Title") !== null && fields.get("Client Signer Title") !== "") {
    requiredText(fields.get("Client Signer Title"), "Client Signer Title", 191);
  }
  if (!hasSignature(fields.get("Client Signature"))) {
    throw new DocuSealAcceptanceValidationError("Client Signature is missing");
  }
  requiredText(fields.get("Client Signature Date"), "Client Signature Date", 64);
  const signerEmail = requiredText(submitter.email, "Client signer email", 320).toLowerCase();
  const comment = sanitizedAuditComment(clientComment);
  return response === SERVICE_ACCEPTANCE_ACKNOWLEDGMENT
    ? { status: "COMPLETED", signerName, signerEmail, clientComment, auditNote: `Client acknowledged receipt and review. Comment: ${comment}` }
    : { status: "DECLINED", signerName, signerEmail, clientComment, auditNote: `Client reported an issue with the listed deliverables: ${comment}` };
}
