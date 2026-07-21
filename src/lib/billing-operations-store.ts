import "server-only";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import type { CheckAction, CheckState } from "@/lib/check-workflow";
import { randomUUID } from "node:crypto";

export type CheckAuditEntry = {
  action: CheckAction;
  state: CheckState;
  at: string;
  note?: string;
  amount?: number;
  maskedReference?: string;
  squarePaymentId?: string;
};

export type BillingCheckRecord = {
  itemType: "CHECK";
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  maskedReference: string;
  squarePaymentId?: string;
  state: CheckState;
  version: number;
  createdAt: string;
  updatedAt: string;
  auditEntries: CheckAuditEntry[];
};

export type BillingEventRecord = {
  eventId: string;
  type: string;
  resourceId?: string;
  eventCreatedAt?: string;
  receivedAt: string;
};

export type BillingEventEffectLease = { eventId: string; effect: string; token: string; leaseUntil: number };

export type BillingEngagementRecord = {
  itemType: "ENGAGEMENT";
  invoiceNumber: string;
  workflowHash: string;
  status: "RESERVED" | "CREATED";
  submissionId?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export class BillingOperationConflictError extends Error {
  constructor() {
    super("The check record changed while this request was being processed");
    this.name = "BillingOperationConflictError";
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

const pk = (invoiceId: string) => `CHECK#${invoiceId}`;
const engagementPk = (invoiceNumber: string) => `ENGAGEMENT#${invoiceNumber.toLowerCase()}`;
const string = (value: string): AttributeValue => ({ S: value });
const number = (value: number): AttributeValue => ({ N: String(value) });

function toItem(record: BillingCheckRecord): Record<string, AttributeValue> {
  return {
    pk: string(pk(record.invoiceId)),
    itemType: string("CHECK"),
    invoiceId: string(record.invoiceId),
    invoiceNumber: string(record.invoiceNumber),
    amount: number(record.amount),
    maskedReference: string(record.maskedReference),
    ...(record.squarePaymentId ? { squarePaymentId: string(record.squarePaymentId) } : {}),
    state: string(record.state),
    version: number(record.version),
    createdAt: string(record.createdAt),
    updatedAt: string(record.updatedAt),
    auditEntries: {
      L: record.auditEntries.map((entry) => ({
        M: {
          action: string(entry.action),
          state: string(entry.state),
          at: string(entry.at),
          ...(entry.note ? { note: string(entry.note) } : {}),
          ...(entry.amount ? { amount: number(entry.amount) } : {}),
          ...(entry.maskedReference ? { maskedReference: string(entry.maskedReference) } : {}),
          ...(entry.squarePaymentId ? { squarePaymentId: string(entry.squarePaymentId) } : {}),
        },
      })),
    },
  };
}

function requiredString(item: Record<string, AttributeValue>, key: string) {
  const value = item[key]?.S;
  if (!value) throw new Error(`Stored check record is missing ${key}`);
  return value;
}

function requiredInteger(item: Record<string, AttributeValue>, key: string) {
  const value = Number(item[key]?.N);
  if (!Number.isSafeInteger(value)) throw new Error(`Stored check record has invalid ${key}`);
  return value;
}

function fromItem(item: Record<string, AttributeValue>): BillingCheckRecord {
  const itemType = requiredString(item, "itemType");
  if (itemType !== "CHECK") throw new Error("Stored billing operation is not a check record");
  const auditEntries = (item.auditEntries?.L || []).map((entry) => {
    const map = entry.M;
    if (!map) throw new Error("Stored check audit entry is invalid");
    const note = map.note?.S;
    const amount = map.amount?.N ? requiredInteger(map, "amount") : undefined;
    const maskedReference = map.maskedReference?.S;
    const squarePaymentId = map.squarePaymentId?.S;
    return {
      action: requiredString(map, "action") as CheckAction,
      state: requiredString(map, "state") as CheckState,
      at: requiredString(map, "at"),
      ...(note ? { note } : {}),
      ...(amount ? { amount } : {}),
      ...(maskedReference ? { maskedReference } : {}),
      ...(squarePaymentId ? { squarePaymentId } : {}),
    };
  });
  return {
    itemType: "CHECK",
    invoiceId: requiredString(item, "invoiceId"),
    invoiceNumber: requiredString(item, "invoiceNumber"),
    amount: requiredInteger(item, "amount"),
    maskedReference: requiredString(item, "maskedReference"),
    squarePaymentId: item.squarePaymentId?.S,
    state: requiredString(item, "state") as CheckState,
    version: requiredInteger(item, "version"),
    createdAt: requiredString(item, "createdAt"),
    updatedAt: requiredString(item, "updatedAt"),
    auditEntries,
  };
}

export async function getCheckRecord(invoiceId: string): Promise<BillingCheckRecord | null> {
  const { tableName, client: dynamo } = settings();
  const response = await dynamo.send(new GetItemCommand({
    TableName: tableName,
    Key: { pk: string(pk(invoiceId)) },
    ConsistentRead: true,
  }));
  return response.Item ? fromItem(response.Item) : null;
}

export async function putCheckRecord(
  record: BillingCheckRecord,
  previous: BillingCheckRecord | null,
): Promise<void> {
  const { tableName, client: dynamo } = settings();
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: toItem(record),
      ConditionExpression: previous
        ? "#version = :version AND #state = :state"
        : "attribute_not_exists(#pk)",
      ExpressionAttributeNames: previous
        ? { "#version": "version", "#state": "state" }
        : { "#pk": "pk" },
      ...(previous ? {
        ExpressionAttributeValues: {
          ":version": number(previous.version),
          ":state": string(previous.state),
        },
      } : {}),
    }));
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") {
      throw new BillingOperationConflictError();
    }
    throw cause;
  }
}

export async function putBillingEventIfAbsent(record: BillingEventRecord): Promise<boolean> {
  const { tableName, client: dynamo } = settings();
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: string(`EVENT#${record.eventId}`),
        itemType: string("EVENT"),
        eventId: string(record.eventId),
        type: string(record.type),
        receivedAt: string(record.receivedAt),
        ...(record.resourceId ? { resourceId: string(record.resourceId) } : {}),
        ...(record.eventCreatedAt ? { eventCreatedAt: string(record.eventCreatedAt) } : {}),
      },
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: { "#pk": "pk" },
    }));
    return true;
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") return false;
    throw cause;
  }
}

export async function acquireBillingEventEffect(eventId: string, effect: string): Promise<
  { state: "ACQUIRED"; lease: BillingEventEffectLease } | { state: "COMPLETED" | "BUSY" }
> {
  if (!eventId || eventId.length > 191 || !/^[A-Z_]{2,64}$/.test(effect)) throw new Error("Billing event effect is invalid");
  const { tableName, client: dynamo } = settings();
  const now = Date.now();
  const lease: BillingEventEffectLease = { eventId, effect, token: randomUUID(), leaseUntil: now + 90_000 };
  const effectPk = `EVENT_EFFECT#${eventId}#${effect}`;
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: string(effectPk), itemType: string("EVENT_EFFECT"), eventId: string(eventId), effect: string(effect),
        state: string("PROCESSING"), leaseToken: string(lease.token), leaseUntil: number(lease.leaseUntil), updatedAt: string(new Date(now).toISOString()),
      },
      ConditionExpression: "attribute_not_exists(#pk) OR (#state = :processing AND #leaseUntil < :now)",
      ExpressionAttributeNames: { "#pk": "pk", "#state": "state", "#leaseUntil": "leaseUntil" },
      ExpressionAttributeValues: { ":processing": string("PROCESSING"), ":now": number(now) },
    }));
    return { state: "ACQUIRED", lease };
  } catch (cause) {
    if (!(cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException")) throw cause;
    const result = await dynamo.send(new GetItemCommand({ TableName: tableName, Key: { pk: string(effectPk) }, ConsistentRead: true }));
    return { state: result.Item?.state?.S === "COMPLETED" ? "COMPLETED" : "BUSY" };
  }
}

export async function completeBillingEventEffect(lease: BillingEventEffectLease) {
  const { tableName, client: dynamo } = settings();
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: string(`EVENT_EFFECT#${lease.eventId}#${lease.effect}`), itemType: string("EVENT_EFFECT"), eventId: string(lease.eventId), effect: string(lease.effect),
        state: string("COMPLETED"), completedAt: string(new Date().toISOString()),
      },
      ConditionExpression: "#state = :processing AND #leaseToken = :token",
      ExpressionAttributeNames: { "#state": "state", "#leaseToken": "leaseToken" },
      ExpressionAttributeValues: { ":processing": string("PROCESSING"), ":token": string(lease.token) },
    }));
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") throw new BillingOperationConflictError();
    throw cause;
  }
}

function engagementFromItem(item: Record<string, AttributeValue>): BillingEngagementRecord {
  const status = requiredString(item, "status");
  if (!new Set(["RESERVED", "CREATED"]).has(status)) throw new Error("Stored engagement workflow has invalid status");
  return {
    itemType: "ENGAGEMENT",
    invoiceNumber: requiredString(item, "invoiceNumber"),
    workflowHash: requiredString(item, "workflowHash"),
    status: status as BillingEngagementRecord["status"],
    submissionId: item.submissionId?.N ? requiredInteger(item, "submissionId") : undefined,
    version: requiredInteger(item, "version"),
    createdAt: requiredString(item, "createdAt"),
    updatedAt: requiredString(item, "updatedAt"),
  };
}

export async function getEngagementWorkflow(invoiceNumber: string): Promise<BillingEngagementRecord | null> {
  const { tableName, client: dynamo } = settings();
  const response = await dynamo.send(new GetItemCommand({
    TableName: tableName,
    Key: { pk: string(engagementPk(invoiceNumber)) },
    ConsistentRead: true,
  }));
  return response.Item ? engagementFromItem(response.Item) : null;
}

export async function reserveEngagementWorkflow(invoiceNumber: string, workflowHash: string) {
  const { tableName, client: dynamo } = settings();
  const now = new Date().toISOString();
  const record: BillingEngagementRecord = {
    itemType: "ENGAGEMENT",
    invoiceNumber,
    workflowHash,
    status: "RESERVED",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: string(engagementPk(invoiceNumber)),
        itemType: string("ENGAGEMENT"),
        invoiceNumber: string(invoiceNumber),
        workflowHash: string(workflowHash),
        status: string("RESERVED"),
        version: number(1),
        createdAt: string(now),
        updatedAt: string(now),
      },
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: { "#pk": "pk" },
    }));
    return { record, created: true };
  } catch (cause) {
    if (!(cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException")) throw cause;
    const current = await getEngagementWorkflow(invoiceNumber);
    if (!current) throw new BillingOperationConflictError();
    return { record: current, created: false };
  }
}

export async function completeEngagementWorkflow(record: BillingEngagementRecord, submissionId: number) {
  const { tableName, client: dynamo } = settings();
  const now = new Date().toISOString();
  const next: BillingEngagementRecord = {
    ...record,
    status: "CREATED",
    submissionId,
    version: record.version + 1,
    updatedAt: now,
  };
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: string(engagementPk(record.invoiceNumber)),
        itemType: string("ENGAGEMENT"),
        invoiceNumber: string(record.invoiceNumber),
        workflowHash: string(record.workflowHash),
        status: string("CREATED"),
        submissionId: number(submissionId),
        version: number(next.version),
        createdAt: string(record.createdAt),
        updatedAt: string(now),
      },
      ConditionExpression: "#version = :version AND #status = :reserved",
      ExpressionAttributeNames: { "#version": "version", "#status": "status" },
      ExpressionAttributeValues: { ":version": number(record.version), ":reserved": string("RESERVED") },
    }));
    return next;
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") {
      const current = await getEngagementWorkflow(record.invoiceNumber);
      if (current?.status === "CREATED" && current.submissionId === submissionId) return current;
      throw new BillingOperationConflictError();
    }
    throw cause;
  }
}

export async function renewEngagementWorkflow(record: BillingEngagementRecord) {
  const { tableName, client: dynamo } = settings();
  const now = new Date().toISOString();
  const next = { ...record, version: record.version + 1, updatedAt: now };
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: string(engagementPk(record.invoiceNumber)),
        itemType: string("ENGAGEMENT"),
        invoiceNumber: string(record.invoiceNumber),
        workflowHash: string(record.workflowHash),
        status: string("RESERVED"),
        version: number(next.version),
        createdAt: string(record.createdAt),
        updatedAt: string(now),
      },
      ConditionExpression: "#version = :version AND #status = :reserved AND #workflowHash = :workflowHash",
      ExpressionAttributeNames: { "#version": "version", "#status": "status", "#workflowHash": "workflowHash" },
      ExpressionAttributeValues: { ":version": number(record.version), ":reserved": string("RESERVED"), ":workflowHash": string(record.workflowHash) },
    }));
    return next;
  } catch (cause) {
    if (cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException") throw new BillingOperationConflictError();
    throw cause;
  }
}

export async function listBillingEvents(): Promise<BillingEventRecord[]> {
  const { tableName, client: dynamo } = settings();
  const items: Record<string, AttributeValue>[] = [];
  let startKey: Record<string, AttributeValue> | undefined;
  do {
    const response = await dynamo.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "#itemType = :event",
      ExpressionAttributeNames: { "#itemType": "itemType" },
      ExpressionAttributeValues: { ":event": string("EVENT") },
      ConsistentRead: true,
      ExclusiveStartKey: startKey,
    }));
    items.push(...(response.Items || []));
    startKey = response.LastEvaluatedKey;
  } while (startKey);
  return items.map((item) => ({
    eventId: requiredString(item, "eventId"),
    type: requiredString(item, "type"),
    resourceId: item.resourceId?.S,
    eventCreatedAt: item.eventCreatedAt?.S,
    receivedAt: requiredString(item, "receivedAt"),
  })).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, 50);
}
