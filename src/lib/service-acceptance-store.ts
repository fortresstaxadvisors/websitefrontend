import "server-only";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import {
  advanceServiceAcceptanceRecord,
  createServiceAcceptanceRecord,
  validateAcceptanceAuditAppend,
  validateServiceAcceptanceRecord,
  type AcceptanceArtifactMetadata,
  type AdvanceServiceAcceptanceInput,
  type CreateServiceAcceptanceInput,
  type ServiceAcceptanceAuditEntry,
  type ServiceAcceptanceRecord,
  type ServiceAcceptanceStatus,
} from "@/lib/service-acceptance-workflow";
import { randomUUID } from "node:crypto";

export type {
  AcceptanceArtifactMetadata,
  AdvanceServiceAcceptanceInput,
  CreateServiceAcceptanceInput,
  ServiceAcceptanceAuditEntry,
  ServiceAcceptanceRecord,
  ServiceAcceptanceStatus,
} from "@/lib/service-acceptance-workflow";

export class ServiceAcceptanceConflictError extends Error {
  constructor() {
    super("The service acceptance changed while this request was being processed");
    this.name = "ServiceAcceptanceConflictError";
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

const acceptancePk = (invoiceId: string, milestoneId: string) =>
  `ACCEPTANCE#${encodeURIComponent(invoiceId)}#${encodeURIComponent(milestoneId)}`;
const acceptancePrefix = (invoiceId: string) => `ACCEPTANCE#${encodeURIComponent(invoiceId)}#`;
const attemptPk = (externalId: string) => `ACCEPTANCE_ATTEMPT#${encodeURIComponent(externalId)}`;
const string = (value: string): AttributeValue => ({ S: value });
const number = (value: number): AttributeValue => ({ N: String(value) });

function requiredString(item: Record<string, AttributeValue>, key: string) {
  const value = item[key]?.S;
  if (!value) throw new Error(`Stored service acceptance is missing ${key}`);
  return value;
}

function requiredInteger(item: Record<string, AttributeValue>, key: string) {
  const value = Number(item[key]?.N);
  if (!Number.isSafeInteger(value)) throw new Error(`Stored service acceptance has invalid ${key}`);
  return value;
}

function artifactToAttribute(artifact: AcceptanceArtifactMetadata): AttributeValue {
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

function artifactFromAttribute(value: AttributeValue | undefined, label: string): AcceptanceArtifactMetadata | undefined {
  if (!value) return undefined;
  const map = value.M;
  if (!map) throw new Error(`Stored service acceptance has invalid ${label}`);
  return {
    bucket: requiredString(map, "bucket"),
    key: requiredString(map, "key"),
    ...(map.versionId?.S ? { versionId: map.versionId.S } : {}),
    sha256: requiredString(map, "sha256"),
    size: requiredInteger(map, "size"),
    contentType: requiredString(map, "contentType") as "application/pdf",
    createdAt: requiredString(map, "createdAt"),
  };
}

function auditToAttribute(entries: ServiceAcceptanceAuditEntry[]): AttributeValue {
  return { L: entries.map((entry) => ({ M: {
    action: string(entry.action),
    ...(entry.fromStatus ? { fromStatus: string(entry.fromStatus) } : {}),
    toStatus: string(entry.toStatus),
    actor: string(entry.actor),
    at: string(entry.at),
    ...(entry.note ? { note: string(entry.note) } : {}),
  } })) };
}

function auditFromAttribute(value: AttributeValue | undefined): ServiceAcceptanceAuditEntry[] {
  if (!value?.L) throw new Error("Stored service acceptance has invalid audit history");
  return value.L.map((entry) => {
    const map = entry.M;
    if (!map) throw new Error("Stored service acceptance has invalid audit entry");
    return {
      action: requiredString(map, "action") as ServiceAcceptanceAuditEntry["action"],
      ...(map.fromStatus?.S ? { fromStatus: map.fromStatus.S as ServiceAcceptanceStatus } : {}),
      toStatus: requiredString(map, "toStatus") as ServiceAcceptanceStatus,
      actor: requiredString(map, "actor"),
      at: requiredString(map, "at"),
      ...(map.note?.S ? { note: map.note.S } : {}),
    };
  });
}

function toItem(record: ServiceAcceptanceRecord): Record<string, AttributeValue> {
  return {
    pk: string(acceptancePk(record.invoiceId, record.milestoneId)),
    itemType: string(record.itemType),
    invoiceId: string(record.invoiceId),
    invoiceNumber: string(record.invoiceNumber),
    milestoneId: string(record.milestoneId),
    ...(record.squareInvoiceId ? { squareInvoiceId: string(record.squareInvoiceId) } : {}),
    ...(record.engagementSubmissionId ? { engagementSubmissionId: number(record.engagementSubmissionId) } : {}),
    serviceDate: string(record.serviceDate),
    serviceSummary: string(record.serviceSummary),
    status: string(record.status),
    ...(record.docusealSubmissionId ? { docusealSubmissionId: number(record.docusealSubmissionId) } : {}),
    ...(record.signerName ? { signerName: string(record.signerName) } : {}),
    ...(record.signerEmail ? { signerEmail: string(record.signerEmail) } : {}),
    ...(record.acceptanceArtifact ? { acceptanceArtifact: artifactToAttribute(record.acceptanceArtifact) } : {}),
    ...(record.auditArtifact ? { auditArtifact: artifactToAttribute(record.auditArtifact) } : {}),
    version: number(record.version),
    createdBy: string(record.createdBy),
    createdAt: string(record.createdAt),
    updatedAt: string(record.updatedAt),
    ...(record.completedAt ? { completedAt: string(record.completedAt) } : {}),
    auditEntries: auditToAttribute(record.auditEntries),
  };
}

function fromItem(item: Record<string, AttributeValue>): ServiceAcceptanceRecord {
  const record: ServiceAcceptanceRecord = {
    itemType: requiredString(item, "itemType") as "SERVICE_ACCEPTANCE",
    invoiceId: requiredString(item, "invoiceId"),
    invoiceNumber: requiredString(item, "invoiceNumber"),
    milestoneId: requiredString(item, "milestoneId"),
    ...(item.squareInvoiceId?.S ? { squareInvoiceId: item.squareInvoiceId.S } : {}),
    ...(item.engagementSubmissionId?.N ? { engagementSubmissionId: requiredInteger(item, "engagementSubmissionId") } : {}),
    serviceDate: requiredString(item, "serviceDate"),
    serviceSummary: requiredString(item, "serviceSummary"),
    status: requiredString(item, "status") as ServiceAcceptanceStatus,
    ...(item.docusealSubmissionId?.N ? { docusealSubmissionId: requiredInteger(item, "docusealSubmissionId") } : {}),
    ...(item.signerName?.S ? { signerName: item.signerName.S } : {}),
    ...(item.signerEmail?.S ? { signerEmail: item.signerEmail.S } : {}),
    ...(item.acceptanceArtifact ? { acceptanceArtifact: artifactFromAttribute(item.acceptanceArtifact, "acceptance artifact")! } : {}),
    ...(item.auditArtifact ? { auditArtifact: artifactFromAttribute(item.auditArtifact, "audit artifact")! } : {}),
    version: requiredInteger(item, "version"),
    createdBy: requiredString(item, "createdBy"),
    createdAt: requiredString(item, "createdAt"),
    updatedAt: requiredString(item, "updatedAt"),
    ...(item.completedAt?.S ? { completedAt: item.completedAt.S } : {}),
    auditEntries: auditFromAttribute(item.auditEntries),
  };
  validateServiceAcceptanceRecord(record);
  return record;
}

export async function getServiceAcceptance(invoiceId: string, milestoneId: string) {
  const { tableName, client: dynamo } = settings();
  const response = await dynamo.send(new GetItemCommand({
    TableName: tableName,
    Key: { pk: string(acceptancePk(invoiceId, milestoneId)) },
    ConsistentRead: true,
  }));
  return response.Item ? fromItem(response.Item) : null;
}

export async function listServiceAcceptances(invoiceId?: string) {
  const { tableName, client: dynamo } = settings();
  const items: Record<string, AttributeValue>[] = [];
  let startKey: Record<string, AttributeValue> | undefined;
  do {
    const response = await dynamo.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: invoiceId
        ? "#itemType = :itemType AND begins_with(#pk, :prefix)"
        : "#itemType = :itemType",
      ExpressionAttributeNames: { "#itemType": "itemType", ...(invoiceId ? { "#pk": "pk" } : {}) },
      ExpressionAttributeValues: {
        ":itemType": string("SERVICE_ACCEPTANCE"),
        ...(invoiceId ? { ":prefix": string(acceptancePrefix(invoiceId)) } : {}),
      },
      ConsistentRead: true,
      ExclusiveStartKey: startKey,
    }));
    items.push(...(response.Items || []));
    startKey = response.LastEvaluatedKey;
  } while (startKey);
  return items.map(fromItem).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function putServiceAcceptance(
  record: ServiceAcceptanceRecord,
  previous: ServiceAcceptanceRecord | null,
) {
  validateServiceAcceptanceRecord(record);
  validateAcceptanceAuditAppend(previous, record);
  const { tableName, client: dynamo } = settings();
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: toItem(record),
      ConditionExpression: previous
        ? "#version = :version AND #status = :status"
        : "attribute_not_exists(#pk)",
      ExpressionAttributeNames: previous
        ? { "#version": "version", "#status": "status" }
        : { "#pk": "pk" },
      ...(previous ? { ExpressionAttributeValues: {
        ":version": number(previous.version),
        ":status": string(previous.status),
      } } : {}),
    }));
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") {
      throw new ServiceAcceptanceConflictError();
    }
    throw cause;
  }
}

export async function createServiceAcceptance(input: CreateServiceAcceptanceInput, now?: string) {
  const record = createServiceAcceptanceRecord(input, now);
  await putServiceAcceptance(record, null);
  return record;
}

export async function advanceServiceAcceptance(
  current: ServiceAcceptanceRecord,
  input: AdvanceServiceAcceptanceInput,
  now?: string,
) {
  const result = advanceServiceAcceptanceRecord(current, input, now);
  if (!result.idempotent) await putServiceAcceptance(result.record, current);
  return result;
}

export type ServiceAcceptanceAttemptLease = { externalId: string; token: string; leaseUntil: number };

export async function acquireServiceAcceptanceAttempt(externalId: string): Promise<
  | { state: "ACQUIRED"; lease: ServiceAcceptanceAttemptLease }
  | { state: "CREATED"; submissionId: number }
  | { state: "BUSY" }
> {
  if (!externalId || externalId.length > 512 || /[\r\n\0]/.test(externalId)) throw new Error("Acceptance attempt ID is invalid");
  const { tableName, client: dynamo } = settings();
  const now = Date.now();
  const lease: ServiceAcceptanceAttemptLease = { externalId, token: randomUUID(), leaseUntil: now + 90_000 };
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: { pk: string(attemptPk(externalId)), itemType: string("SERVICE_ACCEPTANCE_ATTEMPT"), externalId: string(externalId), status: string("CREATING"), leaseToken: string(lease.token), leaseUntil: number(lease.leaseUntil), updatedAt: string(new Date(now).toISOString()) },
      ConditionExpression: "attribute_not_exists(#pk) OR (#status = :creating AND #leaseUntil < :now)",
      ExpressionAttributeNames: { "#pk": "pk", "#status": "status", "#leaseUntil": "leaseUntil" },
      ExpressionAttributeValues: { ":creating": string("CREATING"), ":now": number(now) },
    }));
    return { state: "ACQUIRED", lease };
  } catch (cause) {
    if (!(cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException")) throw cause;
    const result = await dynamo.send(new GetItemCommand({ TableName: tableName, Key: { pk: string(attemptPk(externalId)) }, ConsistentRead: true }));
    const submissionId = Number(result.Item?.submissionId?.N);
    if (result.Item?.status?.S === "CREATED" && Number.isSafeInteger(submissionId) && submissionId > 0) return { state: "CREATED", submissionId };
    return { state: "BUSY" };
  }
}

export async function completeServiceAcceptanceAttempt(lease: ServiceAcceptanceAttemptLease, submissionId: number) {
  if (!Number.isSafeInteger(submissionId) || submissionId <= 0) throw new Error("DocuSeal submission ID is invalid");
  const { tableName, client: dynamo } = settings();
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: { pk: string(attemptPk(lease.externalId)), itemType: string("SERVICE_ACCEPTANCE_ATTEMPT"), externalId: string(lease.externalId), status: string("CREATED"), submissionId: number(submissionId), updatedAt: string(new Date().toISOString()) },
      ConditionExpression: "#status = :creating AND #leaseToken = :token",
      ExpressionAttributeNames: { "#status": "status", "#leaseToken": "leaseToken" },
      ExpressionAttributeValues: { ":creating": string("CREATING"), ":token": string(lease.token) },
    }));
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") throw new ServiceAcceptanceConflictError();
    throw cause;
  }
}
