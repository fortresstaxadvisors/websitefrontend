export const DISPUTE_CASE_STATES = [
  "NEW",
  "PREPARING",
  "READY_FOR_REVIEW",
  "SUBMITTED",
  "PROCESSING",
  "WON",
  "LOST",
  "ACCEPTED",
  "CLOSED",
] as const;

export type DisputeCaseState = (typeof DISPUTE_CASE_STATES)[number];
export type DisputeChecklistStatus = "MISSING" | "READY" | "EXCLUDED";

export type DisputeArtifactMetadata = {
  bucket: string;
  key: string;
  versionId?: string;
  sha256: string;
  size: number;
  contentType: "application/pdf" | "image/heic" | "image/heif" | "image/jpeg" | "image/png" | "image/tiff";
  createdAt: string;
};

export type DisputeChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  status: DisputeChecklistStatus;
  evidenceType?: string;
  artifact?: DisputeArtifactMetadata;
  note?: string;
};

export type DisputeReview = {
  reviewedBy: string;
  reviewedAt: string;
  manifestHash: string;
};

export type DisputeSubmission = {
  submittedBy: string;
  submittedAt: string;
  squareEvidenceIds: string[];
  manifestHash: string;
};

export type DisputeCaseAuditEntry = {
  action: string;
  fromState?: DisputeCaseState;
  toState: DisputeCaseState;
  actor: string;
  at: string;
  note?: string;
};

export type DisputeCaseRecord = {
  itemType: "DISPUTE_CASE";
  disputeId: string;
  squareState: string;
  reason: string;
  paymentId: string;
  orderId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId?: string;
  amount: number;
  currency: string;
  squareDueAt?: string;
  internalDueAt: string;
  summary: string;
  localState: DisputeCaseState;
  ownerUserId?: string;
  backupOwnerUserId?: string;
  checklist: DisputeChecklistItem[];
  review?: DisputeReview;
  submission?: DisputeSubmission;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastSquareSyncAt: string;
  auditEntries: DisputeCaseAuditEntry[];
};

export type CreateDisputeCaseInput = Omit<
  DisputeCaseRecord,
  "itemType" | "localState" | "version" | "createdAt" | "updatedAt" | "lastSquareSyncAt" | "auditEntries" | "review" | "submission"
> & { actor: string; note?: string };

export type UpdateDisputeCaseInput = {
  localState?: DisputeCaseState;
  squareState?: string;
  internalDueAt?: string;
  summary?: string;
  ownerUserId?: string | null;
  backupOwnerUserId?: string | null;
  checklist?: DisputeChecklistItem[];
  review?: DisputeReview | null;
  submission?: DisputeSubmission | null;
  actor: string;
  action: string;
  note?: string;
  squareSyncedAt?: string;
};

const ALLOWED_TRANSITIONS: Record<DisputeCaseState, readonly DisputeCaseState[]> = {
  NEW: ["PREPARING", "WON", "LOST", "ACCEPTED", "CLOSED"],
  PREPARING: ["READY_FOR_REVIEW", "WON", "LOST", "ACCEPTED", "CLOSED"],
  READY_FOR_REVIEW: ["PREPARING", "SUBMITTED", "PROCESSING", "WON", "LOST", "ACCEPTED", "CLOSED"],
  SUBMITTED: ["PROCESSING", "WON", "LOST", "ACCEPTED", "CLOSED"],
  PROCESSING: ["PREPARING", "WON", "LOST", "ACCEPTED", "CLOSED"],
  WON: ["CLOSED"],
  LOST: ["CLOSED"],
  ACCEPTED: ["CLOSED"],
  CLOSED: [],
};

export class DisputeCaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DisputeCaseValidationError";
  }
}

function text(value: string, label: string, maximum = 191) {
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maximum || /[\r\n\0]/.test(cleaned)) throw new DisputeCaseValidationError(`${label} is invalid`);
  return cleaned;
}

function optionalText(value: string | undefined, label: string, maximum = 191) {
  return value === undefined ? undefined : text(value, label, maximum);
}

function isoInstant(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new DisputeCaseValidationError(`${label} must be an ISO timestamp`);
  }
  return value;
}

function hash(value: string, label: string) {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new DisputeCaseValidationError(`${label} is invalid`);
  return value;
}

function optionalNote(value: string | undefined) {
  if (value === undefined) return undefined;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > 1_000 || /\0/.test(cleaned)) throw new DisputeCaseValidationError("Audit note is invalid");
  return cleaned;
}

export function validateDisputeArtifact(artifact: DisputeArtifactMetadata) {
  text(artifact.bucket, "Artifact bucket", 255);
  text(artifact.key, "Artifact key", 1_024);
  optionalText(artifact.versionId, "Artifact version", 1_024);
  hash(artifact.sha256, "Artifact hash");
  // Square accepts dispute evidence files up to 5 MB. Enforcing the limit at
  // the domain boundary prevents a case from being marked ready with evidence
  // that the eventual Square submission cannot accept.
  if (!Number.isSafeInteger(artifact.size) || artifact.size < 1 || artifact.size > 5 * 1024 * 1024) {
    throw new DisputeCaseValidationError("Artifact size is invalid");
  }
  if (!new Set(["application/pdf", "image/heic", "image/heif", "image/jpeg", "image/png", "image/tiff"]).has(artifact.contentType)) {
    throw new DisputeCaseValidationError("Artifact content type is unsupported");
  }
  isoInstant(artifact.createdAt, "Artifact creation time");
}

function validateChecklist(checklist: DisputeChecklistItem[]) {
  if (!checklist.length || checklist.length > 50) throw new DisputeCaseValidationError("Dispute checklist must contain 1 to 50 items");
  const ids = new Set<string>();
  for (const item of checklist) {
    const id = text(item.id, "Checklist ID", 64);
    if (!/^[A-Za-z0-9._-]+$/.test(id) || ids.has(id)) throw new DisputeCaseValidationError("Checklist IDs must be unique and URL-safe");
    ids.add(id);
    text(item.label, "Checklist label", 200);
    if (!new Set<DisputeChecklistStatus>(["MISSING", "READY", "EXCLUDED"]).has(item.status)) {
      throw new DisputeCaseValidationError("Checklist status is invalid");
    }
    optionalText(item.evidenceType, "Evidence type", 96);
    if (item.artifact) validateDisputeArtifact(item.artifact);
    optionalNote(item.note);
    if (item.status === "READY" && !item.artifact) throw new DisputeCaseValidationError("Ready checklist item requires artifact metadata");
    if (item.status === "EXCLUDED" && !item.note) throw new DisputeCaseValidationError("Excluded checklist item requires a reason");
  }
}

function validateReview(review: DisputeReview) {
  text(review.reviewedBy, "Reviewer");
  isoInstant(review.reviewedAt, "Review time");
  hash(review.manifestHash, "Review manifest hash");
}

function validateSubmission(submission: DisputeSubmission) {
  text(submission.submittedBy, "Submitter");
  isoInstant(submission.submittedAt, "Submission time");
  hash(submission.manifestHash, "Submission manifest hash");
  if (!submission.squareEvidenceIds.length || submission.squareEvidenceIds.length > 50
    || new Set(submission.squareEvidenceIds).size !== submission.squareEvidenceIds.length) {
    throw new DisputeCaseValidationError("Square evidence IDs are invalid");
  }
  submission.squareEvidenceIds.forEach((id) => text(id, "Square evidence ID"));
}

export function validateDisputeCaseRecord(record: DisputeCaseRecord) {
  if (record.itemType !== "DISPUTE_CASE") throw new DisputeCaseValidationError("Dispute item type is invalid");
  text(record.disputeId, "Dispute ID");
  text(record.squareState, "Square state", 64);
  text(record.reason, "Dispute reason", 96);
  text(record.paymentId, "Payment ID");
  optionalText(record.orderId, "Order ID");
  optionalText(record.invoiceId, "Invoice ID");
  optionalText(record.invoiceNumber, "Invoice number");
  optionalText(record.customerId, "Customer ID");
  if (!Number.isSafeInteger(record.amount) || record.amount <= 0) throw new DisputeCaseValidationError("Dispute amount is invalid");
  if (!/^[A-Z]{3}$/.test(record.currency)) throw new DisputeCaseValidationError("Dispute currency is invalid");
  if (record.squareDueAt) isoInstant(record.squareDueAt, "Square due time");
  isoInstant(record.internalDueAt, "Internal due time");
  if (record.squareDueAt && Date.parse(record.internalDueAt) > Date.parse(record.squareDueAt)) {
    throw new DisputeCaseValidationError("Internal due time cannot be after Square's deadline");
  }
  const summary = record.summary.trim();
  if (summary.length < 20 || summary.length > 2_000 || /\0/.test(summary)) {
    throw new DisputeCaseValidationError("Case summary must be 20 to 2,000 characters");
  }
  if (!DISPUTE_CASE_STATES.includes(record.localState)) throw new DisputeCaseValidationError("Local dispute state is invalid");
  optionalText(record.ownerUserId, "Owner");
  optionalText(record.backupOwnerUserId, "Backup owner");
  if (record.ownerUserId && record.ownerUserId === record.backupOwnerUserId) throw new DisputeCaseValidationError("Owner and backup owner must differ");
  validateChecklist(record.checklist);
  if (record.review) validateReview(record.review);
  if (record.submission) validateSubmission(record.submission);
  if (record.submission && (!record.review || record.submission.manifestHash !== record.review.manifestHash)) {
    throw new DisputeCaseValidationError("Submission must match the reviewed manifest");
  }
  if (["READY_FOR_REVIEW", "SUBMITTED"].includes(record.localState)) {
    if (!record.ownerUserId) throw new DisputeCaseValidationError("Reviewable dispute requires an owner");
    if (record.checklist.some((item) => item.required && item.status === "MISSING")) {
      throw new DisputeCaseValidationError("Required dispute evidence is still missing");
    }
  }
  if (record.localState === "SUBMITTED" && (!record.review || !record.submission)) {
    throw new DisputeCaseValidationError("Submitted dispute requires review and submission metadata");
  }
  if (!Number.isSafeInteger(record.version) || record.version < 1) throw new DisputeCaseValidationError("Dispute version is invalid");
  isoInstant(record.createdAt, "Created at");
  isoInstant(record.updatedAt, "Updated at");
  isoInstant(record.lastSquareSyncAt, "Square sync time");
  if (!record.auditEntries.length || record.auditEntries.length > 250) throw new DisputeCaseValidationError("Dispute audit history is invalid");
  for (const entry of record.auditEntries) {
    text(entry.action, "Audit action", 96);
    text(entry.actor, "Audit actor");
    isoInstant(entry.at, "Audit time");
    optionalNote(entry.note);
    if (!DISPUTE_CASE_STATES.includes(entry.toState) || (entry.fromState && !DISPUTE_CASE_STATES.includes(entry.fromState))) {
      throw new DisputeCaseValidationError("Audit state is invalid");
    }
  }
}

export function validateDisputeAuditAppend(previous: DisputeCaseRecord | null, next: DisputeCaseRecord) {
  if (!previous) {
    const first = next.auditEntries[0];
    if (next.version !== 1 || next.localState !== "NEW" || next.auditEntries.length !== 1
      || first.action !== "CREATE" || first.fromState !== undefined || first.toState !== "NEW") {
      throw new DisputeCaseValidationError("New dispute must contain one creation audit entry");
    }
    return;
  }
  if (next.version !== previous.version + 1 || next.auditEntries.length !== previous.auditEntries.length + 1) {
    throw new DisputeCaseValidationError("Dispute update must append exactly one audit entry");
  }
  if (JSON.stringify(next.auditEntries.slice(0, -1)) !== JSON.stringify(previous.auditEntries)) {
    throw new DisputeCaseValidationError("Dispute audit history is append-only");
  }
  const last = next.auditEntries.at(-1)!;
  if (last.fromState !== previous.localState || last.toState !== next.localState) {
    throw new DisputeCaseValidationError("Dispute audit entry does not match the state update");
  }
}

export function createDisputeCaseRecord(
  input: CreateDisputeCaseInput,
  now = new Date().toISOString(),
): DisputeCaseRecord {
  const { actor, note, ...caseFields } = input;
  const record: DisputeCaseRecord = {
    ...caseFields,
    itemType: "DISPUTE_CASE",
    disputeId: input.disputeId.trim(),
    squareState: input.squareState.trim(),
    reason: input.reason.trim(),
    paymentId: input.paymentId.trim(),
    summary: input.summary.trim(),
    currency: input.currency.trim().toUpperCase(),
    localState: "NEW",
    version: 1,
    createdAt: isoInstant(now, "Created at"),
    updatedAt: now,
    lastSquareSyncAt: now,
    auditEntries: [{ action: "CREATE", toState: "NEW", actor: text(actor, "Audit actor"), at: now, ...(optionalNote(note) ? { note: note!.trim() } : {}) }],
  };
  validateDisputeCaseRecord(record);
  validateDisputeAuditAppend(null, record);
  return record;
}

export function updateDisputeCaseRecord(
  current: DisputeCaseRecord,
  input: UpdateDisputeCaseInput,
  now = new Date().toISOString(),
): DisputeCaseRecord {
  validateDisputeCaseRecord(current);
  const localState = input.localState || current.localState;
  if (localState !== current.localState && !ALLOWED_TRANSITIONS[current.localState].includes(localState)) {
    throw new DisputeCaseValidationError(`Dispute cannot move from ${current.localState} to ${localState}`);
  }
  const next: DisputeCaseRecord = {
    ...current,
    localState,
    ...(input.squareState !== undefined ? { squareState: input.squareState.trim() } : {}),
    ...(input.internalDueAt !== undefined ? { internalDueAt: input.internalDueAt } : {}),
    ...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
    ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId === null ? undefined : input.ownerUserId.trim() } : {}),
    ...(input.backupOwnerUserId !== undefined ? { backupOwnerUserId: input.backupOwnerUserId === null ? undefined : input.backupOwnerUserId.trim() } : {}),
    ...(input.checklist !== undefined ? { checklist: input.checklist } : {}),
    ...(input.review !== undefined ? { review: input.review === null ? undefined : input.review } : {}),
    ...(input.submission !== undefined ? { submission: input.submission === null ? undefined : input.submission } : {}),
    version: current.version + 1,
    updatedAt: isoInstant(now, "Updated at"),
    lastSquareSyncAt: input.squareSyncedAt ? isoInstant(input.squareSyncedAt, "Square sync time") : current.lastSquareSyncAt,
    auditEntries: [...current.auditEntries, {
      action: text(input.action, "Audit action", 96),
      fromState: current.localState,
      toState: localState,
      actor: text(input.actor, "Audit actor"),
      at: now,
      ...(optionalNote(input.note) ? { note: input.note!.trim() } : {}),
    }],
  };
  validateDisputeCaseRecord(next);
  validateDisputeAuditAppend(current, next);
  return next;
}
