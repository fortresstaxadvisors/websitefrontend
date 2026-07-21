import "server-only";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import {
  createDisputeCaseRecord,
  updateDisputeCaseRecord,
  validateDisputeAuditAppend,
  validateDisputeCaseRecord,
  type CreateDisputeCaseInput,
  type DisputeArtifactMetadata,
  type DisputeCaseAuditEntry,
  type DisputeCaseRecord,
  type DisputeCaseState,
  type DisputeChecklistItem,
  type DisputeReview,
  type DisputeSubmission,
  type UpdateDisputeCaseInput,
} from "@/lib/dispute-case-workflow";

export type {
  CreateDisputeCaseInput,
  DisputeArtifactMetadata,
  DisputeCaseAuditEntry,
  DisputeCaseRecord,
  DisputeCaseState,
  DisputeChecklistItem,
  DisputeReview,
  DisputeSubmission,
  UpdateDisputeCaseInput,
} from "@/lib/dispute-case-workflow";

export class DisputeCaseConflictError extends Error {
  constructor() {
    super("The dispute case changed while this request was being processed");
    this.name = "DisputeCaseConflictError";
  }
}

let client: DynamoDBClient | undefined;

function settings() {
  const tableName = process.env.FORTRESS_BILLING_OPERATIONS_TABLE;
  if (!tableName) throw new Error("FORTRESS_BILLING_OPERATIONS_TABLE is not configured");
  const region = process.env.FORTRESS_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) throw new Error("FORTRESS_AWS_REGION is not configured");
  client ||= new DynamoDBClient({ region });
  return { tableName, client };
}

const disputePk = (disputeId: string) => `DISPUTE#${encodeURIComponent(disputeId)}`;
const string = (value: string): AttributeValue => ({ S: value });
const number = (value: number): AttributeValue => ({ N: String(value) });
const bool = (value: boolean): AttributeValue => ({ BOOL: value });

function requiredString(item: Record<string, AttributeValue>, key: string) {
  const value = item[key]?.S;
  if (!value) throw new Error(`Stored dispute case is missing ${key}`);
  return value;
}

function requiredInteger(item: Record<string, AttributeValue>, key: string) {
  const value = Number(item[key]?.N);
  if (!Number.isSafeInteger(value)) throw new Error(`Stored dispute case has invalid ${key}`);
  return value;
}

function artifactToAttribute(artifact: DisputeArtifactMetadata): AttributeValue {
  return { M: {
    bucket: string(artifact.bucket),
    key: string(artifact.key),
    ...(artifact.versionId ? { versionId: string(artifact.versionId) } : {}),
    sha256: string(artifact.sha256),
    size: number(artifact.size),
    contentType: string(artifact.contentType),
    createdAt: string(artifact.createdAt),
  } };
}

function artifactFromAttribute(value: AttributeValue | undefined): DisputeArtifactMetadata | undefined {
  if (!value) return undefined;
  const map = value.M;
  if (!map) throw new Error("Stored dispute case has invalid artifact metadata");
  return {
    bucket: requiredString(map, "bucket"),
    key: requiredString(map, "key"),
    ...(map.versionId?.S ? { versionId: map.versionId.S } : {}),
    sha256: requiredString(map, "sha256"),
    size: requiredInteger(map, "size"),
    contentType: requiredString(map, "contentType") as DisputeArtifactMetadata["contentType"],
    createdAt: requiredString(map, "createdAt"),
  };
}

function checklistToAttribute(items: DisputeChecklistItem[]): AttributeValue {
  return { L: items.map((item) => ({ M: {
    id: string(item.id),
    label: string(item.label),
    required: bool(item.required),
    status: string(item.status),
    ...(item.evidenceType ? { evidenceType: string(item.evidenceType) } : {}),
    ...(item.artifact ? { artifact: artifactToAttribute(item.artifact) } : {}),
    ...(item.note ? { note: string(item.note) } : {}),
  } })) };
}

function checklistFromAttribute(value: AttributeValue | undefined): DisputeChecklistItem[] {
  if (!value?.L) throw new Error("Stored dispute case has invalid checklist");
  return value.L.map((entry) => {
    const map = entry.M;
    if (!map || map.required?.BOOL === undefined) throw new Error("Stored dispute case has invalid checklist item");
    return {
      id: requiredString(map, "id"),
      label: requiredString(map, "label"),
      required: map.required.BOOL,
      status: requiredString(map, "status") as DisputeChecklistItem["status"],
      ...(map.evidenceType?.S ? { evidenceType: map.evidenceType.S } : {}),
      ...(map.artifact ? { artifact: artifactFromAttribute(map.artifact)! } : {}),
      ...(map.note?.S ? { note: map.note.S } : {}),
    };
  });
}

function reviewToAttribute(review: DisputeReview): AttributeValue {
  return { M: {
    reviewedBy: string(review.reviewedBy),
    reviewedAt: string(review.reviewedAt),
    manifestHash: string(review.manifestHash),
  } };
}

function reviewFromAttribute(value: AttributeValue | undefined): DisputeReview | undefined {
  if (!value) return undefined;
  const map = value.M;
  if (!map) throw new Error("Stored dispute case has invalid review");
  return {
    reviewedBy: requiredString(map, "reviewedBy"),
    reviewedAt: requiredString(map, "reviewedAt"),
    manifestHash: requiredString(map, "manifestHash"),
  };
}

function submissionToAttribute(submission: DisputeSubmission): AttributeValue {
  return { M: {
    submittedBy: string(submission.submittedBy),
    submittedAt: string(submission.submittedAt),
    squareEvidenceIds: { L: submission.squareEvidenceIds.map(string) },
    manifestHash: string(submission.manifestHash),
  } };
}

function submissionFromAttribute(value: AttributeValue | undefined): DisputeSubmission | undefined {
  if (!value) return undefined;
  const map = value.M;
  if (!map?.squareEvidenceIds?.L) throw new Error("Stored dispute case has invalid submission");
  return {
    submittedBy: requiredString(map, "submittedBy"),
    submittedAt: requiredString(map, "submittedAt"),
    squareEvidenceIds: map.squareEvidenceIds.L.map((id) => {
      if (!id.S) throw new Error("Stored dispute case has invalid Square evidence ID");
      return id.S;
    }),
    manifestHash: requiredString(map, "manifestHash"),
  };
}

function auditToAttribute(entries: DisputeCaseAuditEntry[]): AttributeValue {
  return { L: entries.map((entry) => ({ M: {
    action: string(entry.action),
    ...(entry.fromState ? { fromState: string(entry.fromState) } : {}),
    toState: string(entry.toState),
    actor: string(entry.actor),
    at: string(entry.at),
    ...(entry.note ? { note: string(entry.note) } : {}),
  } })) };
}

function auditFromAttribute(value: AttributeValue | undefined): DisputeCaseAuditEntry[] {
  if (!value?.L) throw new Error("Stored dispute case has invalid audit history");
  return value.L.map((entry) => {
    const map = entry.M;
    if (!map) throw new Error("Stored dispute case has invalid audit entry");
    return {
      action: requiredString(map, "action"),
      ...(map.fromState?.S ? { fromState: map.fromState.S as DisputeCaseState } : {}),
      toState: requiredString(map, "toState") as DisputeCaseState,
      actor: requiredString(map, "actor"),
      at: requiredString(map, "at"),
      ...(map.note?.S ? { note: map.note.S } : {}),
    };
  });
}

function toItem(record: DisputeCaseRecord): Record<string, AttributeValue> {
  return {
    pk: string(disputePk(record.disputeId)),
    itemType: string(record.itemType),
    disputeId: string(record.disputeId),
    squareState: string(record.squareState),
    reason: string(record.reason),
    paymentId: string(record.paymentId),
    ...(record.orderId ? { orderId: string(record.orderId) } : {}),
    ...(record.invoiceId ? { invoiceId: string(record.invoiceId) } : {}),
    ...(record.invoiceNumber ? { invoiceNumber: string(record.invoiceNumber) } : {}),
    ...(record.customerId ? { customerId: string(record.customerId) } : {}),
    amount: number(record.amount),
    currency: string(record.currency),
    ...(record.squareDueAt ? { squareDueAt: string(record.squareDueAt) } : {}),
    internalDueAt: string(record.internalDueAt),
    summary: string(record.summary),
    localState: string(record.localState),
    ...(record.ownerUserId ? { ownerUserId: string(record.ownerUserId) } : {}),
    ...(record.backupOwnerUserId ? { backupOwnerUserId: string(record.backupOwnerUserId) } : {}),
    checklist: checklistToAttribute(record.checklist),
    ...(record.review ? { review: reviewToAttribute(record.review) } : {}),
    ...(record.submission ? { submission: submissionToAttribute(record.submission) } : {}),
    version: number(record.version),
    createdAt: string(record.createdAt),
    updatedAt: string(record.updatedAt),
    lastSquareSyncAt: string(record.lastSquareSyncAt),
    auditEntries: auditToAttribute(record.auditEntries),
  };
}

function fromItem(item: Record<string, AttributeValue>): DisputeCaseRecord {
  const record: DisputeCaseRecord = {
    itemType: requiredString(item, "itemType") as "DISPUTE_CASE",
    disputeId: requiredString(item, "disputeId"),
    squareState: requiredString(item, "squareState"),
    reason: requiredString(item, "reason"),
    paymentId: requiredString(item, "paymentId"),
    ...(item.orderId?.S ? { orderId: item.orderId.S } : {}),
    ...(item.invoiceId?.S ? { invoiceId: item.invoiceId.S } : {}),
    ...(item.invoiceNumber?.S ? { invoiceNumber: item.invoiceNumber.S } : {}),
    ...(item.customerId?.S ? { customerId: item.customerId.S } : {}),
    amount: requiredInteger(item, "amount"),
    currency: requiredString(item, "currency"),
    ...(item.squareDueAt?.S ? { squareDueAt: item.squareDueAt.S } : {}),
    internalDueAt: requiredString(item, "internalDueAt"),
    summary: requiredString(item, "summary"),
    localState: requiredString(item, "localState") as DisputeCaseState,
    ...(item.ownerUserId?.S ? { ownerUserId: item.ownerUserId.S } : {}),
    ...(item.backupOwnerUserId?.S ? { backupOwnerUserId: item.backupOwnerUserId.S } : {}),
    checklist: checklistFromAttribute(item.checklist),
    ...(item.review ? { review: reviewFromAttribute(item.review)! } : {}),
    ...(item.submission ? { submission: submissionFromAttribute(item.submission)! } : {}),
    version: requiredInteger(item, "version"),
    createdAt: requiredString(item, "createdAt"),
    updatedAt: requiredString(item, "updatedAt"),
    lastSquareSyncAt: requiredString(item, "lastSquareSyncAt"),
    auditEntries: auditFromAttribute(item.auditEntries),
  };
  validateDisputeCaseRecord(record);
  return record;
}

export async function getDisputeCase(disputeId: string) {
  const { tableName, client: dynamo } = settings();
  const response = await dynamo.send(new GetItemCommand({
    TableName: tableName,
    Key: { pk: string(disputePk(disputeId)) },
    ConsistentRead: true,
  }));
  return response.Item ? fromItem(response.Item) : null;
}

export async function listDisputeCases() {
  const { tableName, client: dynamo } = settings();
  const items: Record<string, AttributeValue>[] = [];
  let startKey: Record<string, AttributeValue> | undefined;
  do {
    const response = await dynamo.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "#itemType = :itemType",
      ExpressionAttributeNames: { "#itemType": "itemType" },
      ExpressionAttributeValues: { ":itemType": string("DISPUTE_CASE") },
      ConsistentRead: true,
      ExclusiveStartKey: startKey,
    }));
    items.push(...(response.Items || []));
    startKey = response.LastEvaluatedKey;
  } while (startKey);
  return items.map(fromItem).sort((a, b) => a.internalDueAt.localeCompare(b.internalDueAt));
}

export async function putDisputeCase(record: DisputeCaseRecord, previous: DisputeCaseRecord | null) {
  validateDisputeCaseRecord(record);
  validateDisputeAuditAppend(previous, record);
  const { tableName, client: dynamo } = settings();
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: toItem(record),
      ConditionExpression: previous
        ? "#version = :version AND #localState = :localState"
        : "attribute_not_exists(#pk)",
      ExpressionAttributeNames: previous
        ? { "#version": "version", "#localState": "localState" }
        : { "#pk": "pk" },
      ...(previous ? { ExpressionAttributeValues: {
        ":version": number(previous.version),
        ":localState": string(previous.localState),
      } } : {}),
    }));
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") {
      throw new DisputeCaseConflictError();
    }
    throw cause;
  }
}

export async function createDisputeCase(input: CreateDisputeCaseInput, now?: string) {
  const record = createDisputeCaseRecord(input, now);
  await putDisputeCase(record, null);
  return record;
}

export async function updateDisputeCase(
  current: DisputeCaseRecord,
  input: UpdateDisputeCaseInput,
  now?: string,
) {
  const record = updateDisputeCaseRecord(current, input, now);
  await putDisputeCase(record, current);
  return record;
}
