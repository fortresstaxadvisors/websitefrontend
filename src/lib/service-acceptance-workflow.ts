export const SERVICE_ACCEPTANCE_STATUSES = [
  "DELIVERED",
  "SENT",
  "COMPLETED",
  "DECLINED",
  "EXPIRED",
  "WITHDRAWN",
] as const;

export type ServiceAcceptanceStatus = (typeof SERVICE_ACCEPTANCE_STATUSES)[number];

export type AcceptanceArtifactMetadata = {
  bucket: string;
  key: string;
  versionId?: string;
  sha256: string;
  size: number;
  contentType: "application/pdf";
  createdAt: string;
};

export type ServiceAcceptanceAuditEntry = {
  action: "CREATE" | "SEND" | "COMPLETE" | "DECLINE" | "EXPIRE" | "WITHDRAW";
  fromStatus?: ServiceAcceptanceStatus;
  toStatus: ServiceAcceptanceStatus;
  actor: string;
  at: string;
  note?: string;
};

export type ServiceAcceptanceRecord = {
  itemType: "SERVICE_ACCEPTANCE";
  invoiceId: string;
  invoiceNumber: string;
  milestoneId: string;
  squareInvoiceId?: string;
  engagementSubmissionId?: number;
  serviceDate: string;
  serviceSummary: string;
  status: ServiceAcceptanceStatus;
  docusealSubmissionId?: number;
  signerName?: string;
  signerEmail?: string;
  acceptanceArtifact?: AcceptanceArtifactMetadata;
  auditArtifact?: AcceptanceArtifactMetadata;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  auditEntries: ServiceAcceptanceAuditEntry[];
};

export type CreateServiceAcceptanceInput = {
  invoiceId: string;
  invoiceNumber: string;
  milestoneId: string;
  squareInvoiceId?: string;
  engagementSubmissionId?: number;
  serviceDate: string;
  serviceSummary: string;
  actor: string;
  note?: string;
};

export type AdvanceServiceAcceptanceInput = {
  status: Exclude<ServiceAcceptanceStatus, "DELIVERED">;
  actor: string;
  note?: string;
  docusealSubmissionId?: number;
  signerName?: string;
  signerEmail?: string;
  acceptanceArtifact?: AcceptanceArtifactMetadata;
  auditArtifact?: AcceptanceArtifactMetadata;
};

const ACTION_FOR_STATUS: Record<Exclude<ServiceAcceptanceStatus, "DELIVERED">, ServiceAcceptanceAuditEntry["action"]> = {
  SENT: "SEND",
  COMPLETED: "COMPLETE",
  DECLINED: "DECLINE",
  EXPIRED: "EXPIRE",
  WITHDRAWN: "WITHDRAW",
};

const ALLOWED_TRANSITIONS: Record<ServiceAcceptanceStatus, readonly ServiceAcceptanceStatus[]> = {
  DELIVERED: ["SENT", "WITHDRAWN"],
  SENT: ["COMPLETED", "DECLINED", "EXPIRED", "WITHDRAWN"],
  COMPLETED: [],
  DECLINED: [],
  EXPIRED: ["SENT", "WITHDRAWN"],
  WITHDRAWN: [],
};

export class ServiceAcceptanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceAcceptanceValidationError";
  }
}

function identifier(value: string, label: string, maximum = 191) {
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maximum || /[\r\n\0]/.test(cleaned)) {
    throw new ServiceAcceptanceValidationError(`${label} is invalid`);
  }
  return cleaned;
}

function optionalIdentifier(value: string | undefined, label: string, maximum = 191) {
  return value === undefined ? undefined : identifier(value, label, maximum);
}

function isoInstant(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ServiceAcceptanceValidationError(`${label} must be an ISO timestamp`);
  }
  return value;
}

function serviceDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`))) {
    throw new ServiceAcceptanceValidationError("Service date is invalid");
  }
  return value;
}

function note(value: string | undefined) {
  if (value === undefined) return undefined;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > 500 || /\0/.test(cleaned)) {
    throw new ServiceAcceptanceValidationError("Audit note is invalid");
  }
  return cleaned;
}

function positiveInteger(value: number | undefined, label: string) {
  if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) {
    throw new ServiceAcceptanceValidationError(`${label} is invalid`);
  }
  return value;
}

export function validateAcceptanceArtifact(artifact: AcceptanceArtifactMetadata, label: string) {
  identifier(artifact.bucket, `${label} bucket`, 255);
  identifier(artifact.key, `${label} key`, 1024);
  optionalIdentifier(artifact.versionId, `${label} version`, 1024);
  if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new ServiceAcceptanceValidationError(`${label} hash is invalid`);
  if (!Number.isSafeInteger(artifact.size) || artifact.size < 5 || artifact.size > 25 * 1024 * 1024) {
    throw new ServiceAcceptanceValidationError(`${label} size is invalid`);
  }
  if (artifact.contentType !== "application/pdf") throw new ServiceAcceptanceValidationError(`${label} must be a PDF`);
  isoInstant(artifact.createdAt, `${label} creation time`);
}

export function validateServiceAcceptanceRecord(record: ServiceAcceptanceRecord) {
  if (record.itemType !== "SERVICE_ACCEPTANCE") throw new ServiceAcceptanceValidationError("Acceptance item type is invalid");
  identifier(record.invoiceId, "Invoice ID");
  identifier(record.invoiceNumber, "Invoice number");
  identifier(record.milestoneId, "Milestone ID", 96);
  optionalIdentifier(record.squareInvoiceId, "Square invoice ID");
  positiveInteger(record.engagementSubmissionId, "Engagement submission ID");
  serviceDate(record.serviceDate);
  const summary = record.serviceSummary.trim();
  if (summary.length < 20 || summary.length > 2_000 || /\0/.test(summary)) {
    throw new ServiceAcceptanceValidationError("Service summary must be 20 to 2,000 characters");
  }
  if (!SERVICE_ACCEPTANCE_STATUSES.includes(record.status)) throw new ServiceAcceptanceValidationError("Acceptance status is invalid");
  positiveInteger(record.docusealSubmissionId, "DocuSeal submission ID");
  optionalIdentifier(record.signerName, "Signer name");
  if (record.signerEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(record.signerEmail)) {
    throw new ServiceAcceptanceValidationError("Signer email is invalid");
  }
  if (record.acceptanceArtifact) validateAcceptanceArtifact(record.acceptanceArtifact, "Acceptance artifact");
  if (record.auditArtifact) validateAcceptanceArtifact(record.auditArtifact, "Audit artifact");
  if (!Number.isSafeInteger(record.version) || record.version < 1) throw new ServiceAcceptanceValidationError("Acceptance version is invalid");
  identifier(record.createdBy, "Created by");
  isoInstant(record.createdAt, "Created at");
  isoInstant(record.updatedAt, "Updated at");
  if (record.completedAt) isoInstant(record.completedAt, "Completed at");
  if (!record.auditEntries.length || record.auditEntries.length > 100) throw new ServiceAcceptanceValidationError("Acceptance audit history is invalid");
  for (const entry of record.auditEntries) {
    identifier(entry.actor, "Audit actor");
    isoInstant(entry.at, "Audit time");
    note(entry.note);
    if (!SERVICE_ACCEPTANCE_STATUSES.includes(entry.toStatus)) throw new ServiceAcceptanceValidationError("Audit status is invalid");
    if (entry.fromStatus && !SERVICE_ACCEPTANCE_STATUSES.includes(entry.fromStatus)) throw new ServiceAcceptanceValidationError("Audit prior status is invalid");
  }
  if (record.status === "SENT" && !record.docusealSubmissionId) {
    throw new ServiceAcceptanceValidationError("Sent acceptance requires a DocuSeal submission ID");
  }
  if (record.status === "COMPLETED" && (
    !record.docusealSubmissionId || !record.signerName || !record.signerEmail
    || !record.acceptanceArtifact || !record.auditArtifact || !record.completedAt
  )) throw new ServiceAcceptanceValidationError("Completed acceptance requires signer and archived signature evidence");
}

export function validateAcceptanceAuditAppend(
  previous: ServiceAcceptanceRecord | null,
  next: ServiceAcceptanceRecord,
) {
  if (!previous) {
    const first = next.auditEntries[0];
    if (next.version !== 1 || next.status !== "DELIVERED" || next.auditEntries.length !== 1
      || first.action !== "CREATE" || first.fromStatus !== undefined || first.toStatus !== "DELIVERED") {
      throw new ServiceAcceptanceValidationError("New acceptance must contain one creation audit entry");
    }
    return;
  }
  if (next.version !== previous.version + 1 || next.auditEntries.length !== previous.auditEntries.length + 1) {
    throw new ServiceAcceptanceValidationError("Acceptance update must append exactly one audit entry");
  }
  if (JSON.stringify(next.auditEntries.slice(0, -1)) !== JSON.stringify(previous.auditEntries)) {
    throw new ServiceAcceptanceValidationError("Acceptance audit history is append-only");
  }
  const last = next.auditEntries.at(-1)!;
  if (last.fromStatus !== previous.status || last.toStatus !== next.status) {
    throw new ServiceAcceptanceValidationError("Acceptance audit entry does not match the status change");
  }
}

export function createServiceAcceptanceRecord(
  input: CreateServiceAcceptanceInput,
  now = new Date().toISOString(),
): ServiceAcceptanceRecord {
  const record: ServiceAcceptanceRecord = {
    itemType: "SERVICE_ACCEPTANCE",
    invoiceId: identifier(input.invoiceId, "Invoice ID"),
    invoiceNumber: identifier(input.invoiceNumber, "Invoice number"),
    milestoneId: identifier(input.milestoneId, "Milestone ID", 96),
    ...(optionalIdentifier(input.squareInvoiceId, "Square invoice ID") ? { squareInvoiceId: input.squareInvoiceId!.trim() } : {}),
    ...(positiveInteger(input.engagementSubmissionId, "Engagement submission ID") ? { engagementSubmissionId: input.engagementSubmissionId } : {}),
    serviceDate: serviceDate(input.serviceDate),
    serviceSummary: input.serviceSummary.trim(),
    status: "DELIVERED",
    version: 1,
    createdBy: identifier(input.actor, "Created by"),
    createdAt: isoInstant(now, "Created at"),
    updatedAt: now,
    auditEntries: [{ action: "CREATE", toStatus: "DELIVERED", actor: input.actor.trim(), at: now, ...(note(input.note) ? { note: input.note!.trim() } : {}) }],
  };
  validateServiceAcceptanceRecord(record);
  validateAcceptanceAuditAppend(null, record);
  return record;
}

export function advanceServiceAcceptanceRecord(
  current: ServiceAcceptanceRecord,
  input: AdvanceServiceAcceptanceInput,
  now = new Date().toISOString(),
): { record: ServiceAcceptanceRecord; idempotent: boolean } {
  validateServiceAcceptanceRecord(current);
  if (current.status === input.status) return { record: current, idempotent: true };
  if (!ALLOWED_TRANSITIONS[current.status].includes(input.status)) {
    throw new ServiceAcceptanceValidationError(`Acceptance cannot move from ${current.status} to ${input.status}`);
  }
  const cleanedNote = note(input.note);
  const next: ServiceAcceptanceRecord = {
    ...current,
    status: input.status,
    ...(positiveInteger(input.docusealSubmissionId, "DocuSeal submission ID") ? { docusealSubmissionId: input.docusealSubmissionId } : {}),
    ...(optionalIdentifier(input.signerName, "Signer name") ? { signerName: input.signerName!.trim() } : {}),
    ...(input.signerEmail ? { signerEmail: input.signerEmail.trim().toLowerCase() } : {}),
    ...(input.acceptanceArtifact ? { acceptanceArtifact: input.acceptanceArtifact } : {}),
    ...(input.auditArtifact ? { auditArtifact: input.auditArtifact } : {}),
    ...(input.status === "COMPLETED" ? { completedAt: now } : {}),
    version: current.version + 1,
    updatedAt: isoInstant(now, "Updated at"),
    auditEntries: [...current.auditEntries, {
      action: ACTION_FOR_STATUS[input.status],
      fromStatus: current.status,
      toStatus: input.status,
      actor: identifier(input.actor, "Audit actor"),
      at: now,
      ...(cleanedNote ? { note: cleanedNote } : {}),
    }],
  };
  validateServiceAcceptanceRecord(next);
  validateAcceptanceAuditAppend(current, next);
  return { record: next, idempotent: false };
}
