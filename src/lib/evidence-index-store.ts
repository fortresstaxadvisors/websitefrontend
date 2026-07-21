import "server-only";
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, type AttributeValue } from "@aws-sdk/client-dynamodb";
import type { ArchivedEvidence } from "@/lib/evidence-archive";

export type BillingEvidenceIndex = {
  itemType: "EVIDENCE_INDEX";
  invoiceNumber: string;
  workflowId: string;
  engagementSubmissionId: number;
  squareInvoiceId: string;
  squareOrderId: string;
  squareCustomerId: string;
  clientName: string;
  clientEmail: string;
  payerRelationship: string;
  authorizedPayerName?: string;
  authorizedPayerEmail?: string;
  agreementArtifact: ArchivedEvidence;
  auditArtifact?: ArchivedEvidence;
  createdAt: string;
  updatedAt: string;
};

let client: DynamoDBClient | undefined;
function settings() {
  const tableName = process.env.FORTRESS_BILLING_OPERATIONS_TABLE;
  const region = process.env.FORTRESS_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!tableName || !region) throw new Error("Billing evidence index is not configured");
  client ||= new DynamoDBClient({ region });
  return { tableName, dynamo: client };
}
const string = (value: string): AttributeValue => ({ S: value });
const key = (invoiceNumber: string) => `EVIDENCE#${invoiceNumber.trim().toLowerCase()}`;

export async function getBillingEvidenceIndex(invoiceNumber: string): Promise<BillingEvidenceIndex | null> {
  const { tableName, dynamo } = settings();
  const result = await dynamo.send(new GetItemCommand({ TableName: tableName, Key: { pk: string(key(invoiceNumber)) }, ConsistentRead: true }));
  const json = result.Item?.record?.S;
  if (!json) return null;
  const record = JSON.parse(json) as BillingEvidenceIndex;
  if (record.itemType !== "EVIDENCE_INDEX" || record.invoiceNumber.toLowerCase() !== invoiceNumber.trim().toLowerCase()) throw new Error("Stored evidence index is invalid");
  return record;
}

export async function findBillingEvidenceByOrderId(orderId: string): Promise<BillingEvidenceIndex | null> {
  const cleaned = orderId.trim();
  if (!cleaned || cleaned.length > 191 || /[\r\n\0]/.test(cleaned)) throw new Error("Square order ID is invalid");
  const { tableName, dynamo } = settings();
  const matches: BillingEvidenceIndex[] = [];
  let startKey: Record<string, AttributeValue> | undefined;
  do {
    const result = await dynamo.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "#itemType = :itemType",
      ExpressionAttributeNames: { "#itemType": "itemType" },
      ExpressionAttributeValues: { ":itemType": string("EVIDENCE_INDEX") },
      ConsistentRead: true,
      ExclusiveStartKey: startKey,
    }));
    for (const item of result.Items || []) {
      const json = item.record?.S;
      if (!json) continue;
      const record = JSON.parse(json) as BillingEvidenceIndex;
      if (record.itemType === "EVIDENCE_INDEX" && record.squareOrderId === cleaned) matches.push(record);
    }
    startKey = result.LastEvaluatedKey;
  } while (startKey);
  if (matches.length > 1) throw new Error("Multiple billing evidence records match the Square order");
  return matches[0] || null;
}

export async function putBillingEvidenceIndex(record: BillingEvidenceIndex) {
  const { tableName, dynamo } = settings();
  try {
    await dynamo.send(new PutItemCommand({
      TableName: tableName,
      Item: { pk: string(key(record.invoiceNumber)), itemType: string("EVIDENCE_INDEX"), invoiceNumber: string(record.invoiceNumber), record: string(JSON.stringify(record)) },
      ConditionExpression: "attribute_not_exists(#pk)", ExpressionAttributeNames: { "#pk": "pk" },
    }));
    return record;
  } catch (cause) {
    if (!(cause && typeof cause === "object" && "name" in cause && cause.name === "ConditionalCheckFailedException")) throw cause;
    const existing = await getBillingEvidenceIndex(record.invoiceNumber);
    if (!existing || existing.workflowId !== record.workflowId || existing.engagementSubmissionId !== record.engagementSubmissionId) throw new Error("Evidence index conflicts with a different engagement");
    return existing;
  }
}
