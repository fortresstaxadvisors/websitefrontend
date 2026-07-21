import "server-only";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import type { CheckAction, CheckState } from "@/lib/check-workflow";

export type CheckAuditEntry = {
  action: CheckAction;
  state: CheckState;
  at: string;
  note?: string;
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
    return {
      action: requiredString(map, "action") as CheckAction,
      state: requiredString(map, "state") as CheckState,
      at: requiredString(map, "at"),
      ...(note ? { note } : {}),
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
