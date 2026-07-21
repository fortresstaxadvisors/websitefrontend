import "server-only";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import type { DisputeCaseRecord } from "@/lib/dispute-case-store";

let client: SNSClient | undefined;

export async function publishDisputeAlert(record: DisputeCaseRecord, eventId: string) {
  const topicArn = process.env.FORTRESS_DISPUTE_ALERT_TOPIC_ARN?.trim();
  if (!topicArn) return { configured: false } as const;
  const region = process.env.FORTRESS_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region || !/^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9_-]{1,256}$/.test(topicArn)) throw new Error("Dispute alert topic is invalid");
  client ||= new SNSClient({ region });
  const consoleUrl = `${process.env.PAYMENT_BASE_URL || ""}/internal/invoices#disputes`;
  await client.send(new PublishCommand({
    TopicArn: topicArn,
    Subject: `Fortress payment dispute: ${record.squareState}`.slice(0, 100),
    Message: [
      "A verified Square dispute event requires staff review.",
      `Dispute: ${record.disputeId}`,
      `Square state: ${record.squareState}`,
      `Reason: ${record.reason}`,
      `Amount: ${(record.amount / 100).toFixed(2)} ${record.currency}`,
      `Square evidence deadline: ${record.squareDueAt || "not supplied"}`,
      `Fortress internal deadline: ${record.internalDueAt}`,
      `Event: ${eventId}`,
      `Private billing console: ${consoleUrl}`,
      "Do not reply to this alert with client documents or sensitive tax data.",
    ].join("\n"),
    MessageAttributes: {
      eventType: { DataType: "String", StringValue: "square.dispute" },
      squareState: { DataType: "String", StringValue: record.squareState },
    },
  }));
  return { configured: true } as const;
}
