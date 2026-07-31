import { createHash } from "node:crypto";
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { NextResponse } from "next/server";
import {
  buildContactEmails,
  type ContactEmail,
} from "@/lib/contact/email-templates";
import {
  MAX_CONTACT_BODY_BYTES,
  validateContactPayload,
  type ContactInquiry,
} from "@/lib/contact/validation";

export const runtime = "nodejs";

const DEFAULT_TO_EMAIL = "clientservices@fortresstaxadvisors.com";
const DEFAULT_FROM_EMAIL =
  "Fortress Tax Advisors <inquiries@fortresstaxadvisors.com>";
const AWS_REGION =
  process.env.FORTRESS_AWS_REGION?.trim() ||
  process.env.AWS_REGION?.trim() ||
  "us-east-1";
const CONTACT_TABLE =
  process.env.CONTACT_OPERATIONS_TABLE?.trim() ||
  "fortress-contact-operations-prod";
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const RATE_LIMIT_MAX = 5;
const GLOBAL_RATE_LIMIT_WINDOW_SECONDS = 5 * 60;
const GLOBAL_RATE_LIMIT_MAX = 100;
const DELIVERY_TTL_SECONDS = 30 * 24 * 60 * 60;
const DELIVERY_LOCK_SECONDS = 60;

type RateLimitEntry = { count: number; resetAt: number };
type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};
type DeliveryState = {
  internalSent: boolean;
  confirmationSent: boolean;
  lockExpiresAt: number;
  status: string;
};
type LockResult =
  | { acquired: true; state: DeliveryState }
  | { acquired: false; complete: boolean };

const rateLimits = new Map<string, RateLimitEntry>();
const dynamo = new DynamoDBClient({ region: AWS_REGION });
const ses = new SESv2Client({ region: AWS_REGION });

function json(
  body: Record<string, unknown>,
  init?: { status?: number; headers?: HeadersInit }
) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

function readSecret(name: string) {
  const direct = process.env[name]?.trim();
  if (direct) return direct;

  try {
    const secrets = JSON.parse(process.env.secrets ?? "{}") as Record<
      string,
      unknown
    >;
    const secret = secrets[name];
    return typeof secret === "string" ? secret.trim() : "";
  } catch {
    return "";
  }
}

function awsDeliveryEnabled() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.CONTACT_ENABLE_AWS_DELIVERY === "true"
  );
}

function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    ""
  );
}

function consumeMemoryRateLimit(ip: string) {
  if (!ip) return { allowed: true, retryAfter: 0 };

  const now = Date.now();
  if (rateLimits.size > 1_000) {
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(key);
    }
    if (rateLimits.size > 1_000) {
      const oldestKey = rateLimits.keys().next().value as string | undefined;
      if (oldestKey) rateLimits.delete(oldestKey);
    }
  }

  const current = rateLimits.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimits.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1_000,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function isConditionalFailure(error: unknown) {
  return (
    error instanceof ConditionalCheckFailedException ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ConditionalCheckFailedException")
  );
}

async function consumeDynamoCounter({
  key,
  max,
  windowSeconds,
}: {
  key: string;
  max: number;
  windowSeconds: number;
}) {
  const now = Math.floor(Date.now() / 1_000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const retryAfter = Math.max(1, windowStart + windowSeconds - now);

  try {
    await dynamo.send(
      new UpdateItemCommand({
        TableName: CONTACT_TABLE,
        Key: { pk: { S: `rate#${key}#${windowStart}` } },
        UpdateExpression:
          "SET expiresAt = if_not_exists(expiresAt, :ttl) ADD attempts :one",
        ConditionExpression:
          "attribute_not_exists(attempts) OR attempts < :maximum",
        ExpressionAttributeValues: {
          ":ttl": { N: String(windowStart + windowSeconds + 3_600) },
          ":one": { N: "1" },
          ":maximum": { N: String(max) },
        },
      })
    );
    return { allowed: true, retryAfter: 0 };
  } catch (error) {
    if (isConditionalFailure(error)) {
      return { allowed: false, retryAfter };
    }
    throw error;
  }
}

async function consumeDurableRateLimit(ip: string) {
  if (!ip || !awsDeliveryEnabled()) {
    return { allowed: true, retryAfter: 0 };
  }

  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  try {
    const perIp = await consumeDynamoCounter({
      key: `ip#${ipHash}`,
      max: RATE_LIMIT_MAX,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (!perIp.allowed) return perIp;

    return await consumeDynamoCounter({
      key: "global",
      max: GLOBAL_RATE_LIMIT_MAX,
      windowSeconds: GLOBAL_RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch (error) {
    console.error("[contact] durable rate limiter unavailable", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { allowed: true, retryAfter: 0 };
  }
}

function allowedTurnstileHostnames() {
  return new Set(
    (
      process.env.TURNSTILE_ALLOWED_HOSTNAMES ??
      "fortresstaxadvisors.com,www.fortresstaxadvisors.com"
    )
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function verifyTurnstile(inquiry: ContactInquiry, ip: string) {
  const secret = readSecret("TURNSTILE_SECRET_KEY");
  const required = process.env.CONTACT_REQUIRE_TURNSTILE === "true";

  if (!secret) return !required;
  if (!inquiry.turnstileToken) return false;

  const body = new URLSearchParams({
    secret,
    response: inquiry.turnstileToken,
    ...(ip ? { remoteip: ip } : {}),
  });

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!response.ok) return false;

    const result = (await response.json()) as TurnstileResponse;
    if (!result.success || result.action !== "contact") return false;

    if (process.env.NODE_ENV === "production") {
      const hostname = result.hostname?.toLowerCase() ?? "";
      if (!allowedTurnstileHostnames().has(hostname)) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function readBoolean(
  item: Record<string, AttributeValue> | undefined,
  key: string
) {
  return item?.[key]?.BOOL === true;
}

function readNumber(
  item: Record<string, AttributeValue> | undefined,
  key: string
) {
  const value = item?.[key]?.N;
  return value ? Number(value) : 0;
}

function readStringAttribute(
  item: Record<string, AttributeValue> | undefined,
  key: string
) {
  return item?.[key]?.S ?? "";
}

function deliveryState(item?: Record<string, AttributeValue>): DeliveryState {
  return {
    internalSent: readBoolean(item, "internalSent"),
    confirmationSent: readBoolean(item, "confirmationSent"),
    lockExpiresAt: readNumber(item, "lockExpiresAt"),
    status: readStringAttribute(item, "status"),
  };
}

async function acquireDeliveryLock(submissionId: string): Promise<LockResult> {
  const pk = `delivery#${submissionId}`;
  const now = Math.floor(Date.now() / 1_000);
  const initialState: DeliveryState = {
    internalSent: false,
    confirmationSent: false,
    lockExpiresAt: now + DELIVERY_LOCK_SECONDS,
    status: "PROCESSING",
  };

  try {
    await dynamo.send(
      new PutItemCommand({
        TableName: CONTACT_TABLE,
        Item: {
          pk: { S: pk },
          status: { S: initialState.status },
          internalSent: { BOOL: false },
          confirmationSent: { BOOL: false },
          lockExpiresAt: { N: String(initialState.lockExpiresAt) },
          expiresAt: { N: String(now + DELIVERY_TTL_SECONDS) },
        },
        ConditionExpression: "attribute_not_exists(pk)",
      })
    );
    return { acquired: true, state: initialState };
  } catch (error) {
    if (!isConditionalFailure(error)) throw error;
  }

  const existing = await dynamo.send(
    new GetItemCommand({
      TableName: CONTACT_TABLE,
      Key: { pk: { S: pk } },
      ConsistentRead: true,
    })
  );
  const state = deliveryState(existing.Item);
  if (state.status === "COMPLETE") {
    return { acquired: false, complete: true };
  }

  try {
    await dynamo.send(
      new UpdateItemCommand({
        TableName: CONTACT_TABLE,
        Key: { pk: { S: pk } },
        UpdateExpression:
          "SET lockExpiresAt = :lock, #status = :processing, expiresAt = :ttl",
        ConditionExpression:
          "attribute_exists(pk) AND #status <> :complete AND (attribute_not_exists(lockExpiresAt) OR lockExpiresAt < :now)",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":lock": { N: String(now + DELIVERY_LOCK_SECONDS) },
          ":processing": { S: "PROCESSING" },
          ":complete": { S: "COMPLETE" },
          ":now": { N: String(now) },
          ":ttl": { N: String(now + DELIVERY_TTL_SECONDS) },
        },
      })
    );
    return {
      acquired: true,
      state: { ...state, lockExpiresAt: now + DELIVERY_LOCK_SECONDS },
    };
  } catch (error) {
    if (isConditionalFailure(error)) {
      return { acquired: false, complete: false };
    }
    throw error;
  }
}

async function markDeliveryStep(
  submissionId: string,
  step: "internal" | "confirmation",
  messageId: string
) {
  const sentAttribute =
    step === "internal" ? "internalSent" : "confirmationSent";
  const messageAttribute =
    step === "internal" ? "internalMessageId" : "confirmationMessageId";

  await dynamo.send(
    new UpdateItemCommand({
      TableName: CONTACT_TABLE,
      Key: { pk: { S: `delivery#${submissionId}` } },
      UpdateExpression: "SET #sent = :true, #messageId = :messageId",
      ExpressionAttributeNames: {
        "#sent": sentAttribute,
        "#messageId": messageAttribute,
      },
      ExpressionAttributeValues: {
        ":true": { BOOL: true },
        ":messageId": { S: messageId },
      },
    })
  );
}

async function completeDelivery(submissionId: string) {
  await dynamo.send(
    new UpdateItemCommand({
      TableName: CONTACT_TABLE,
      Key: { pk: { S: `delivery#${submissionId}` } },
      UpdateExpression:
        "SET #status = :complete, lockExpiresAt = :zero, completedAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":complete": { S: "COMPLETE" },
        ":zero": { N: "0" },
        ":now": { S: new Date().toISOString() },
      },
    })
  );
}

async function releaseDeliveryLock(submissionId: string) {
  try {
    await dynamo.send(
      new UpdateItemCommand({
        TableName: CONTACT_TABLE,
        Key: { pk: { S: `delivery#${submissionId}` } },
        UpdateExpression: "SET lockExpiresAt = :zero, #status = :partial",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":zero": { N: "0" },
          ":partial": { S: "PARTIAL" },
        },
      })
    );
  } catch {
    // The original delivery error is more useful than a cleanup failure.
  }
}

async function sendContactEmail(email: ContactEmail) {
  const result = await ses.send(
    new SendEmailCommand({
      FromEmailAddress: email.from,
      Destination: { ToAddresses: email.to },
      ReplyToAddresses: [email.replyTo],
      Content: {
        Simple: {
          Subject: { Data: email.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: email.html, Charset: "UTF-8" },
            Text: { Data: email.text, Charset: "UTF-8" },
          },
        },
      },
      EmailTags: email.tags.map(({ name, value }) => ({
        Name: name,
        Value: value,
      })),
    })
  );

  if (!result.MessageId) throw new Error("SES did not return a message ID.");
  return result.MessageId;
}

async function deliverInquiry(inquiry: ContactInquiry) {
  if (!awsDeliveryEnabled()) {
    return { ok: false as const, reason: "configuration" as const };
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const replyEmail =
    process.env.CONTACT_REPLY_EMAIL?.trim() || DEFAULT_TO_EMAIL;
  const [internalEmail, confirmationEmail] = buildContactEmails({
    inquiry,
    from,
    to,
    replyEmail,
  });

  try {
    const lock = await acquireDeliveryLock(inquiry.submissionId);
    if (!lock.acquired) {
      return lock.complete
        ? { ok: true as const }
        : { ok: false as const, reason: "busy" as const };
    }

    if (!lock.state.internalSent) {
      const messageId = await sendContactEmail(internalEmail);
      await markDeliveryStep(inquiry.submissionId, "internal", messageId);
    }

    if (!lock.state.confirmationSent) {
      const messageId = await sendContactEmail(confirmationEmail);
      await markDeliveryStep(inquiry.submissionId, "confirmation", messageId);
    }

    await completeDelivery(inquiry.submissionId);
    console.info("[contact] inquiry and confirmation queued", {
      submissionId: inquiry.submissionId,
    });
    return { ok: true as const };
  } catch (error) {
    await releaseDeliveryLock(inquiry.submissionId);
    console.error("[contact] AWS email delivery failed", {
      submissionId: inquiry.submissionId,
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { ok: false as const, reason: "provider" as const };
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json(
      { ok: false, delivered: false, error: "Unsupported request type." },
      { status: 415 }
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_CONTACT_BODY_BYTES) {
    return json(
      { ok: false, delivered: false, error: "Request body is too large." },
      { status: 413 }
    );
  }

  const ip = clientIp(request);
  const memoryRateLimit = consumeMemoryRateLimit(ip);
  if (!memoryRateLimit.allowed) {
    return json(
      {
        ok: false,
        delivered: false,
        error: "Too many attempts. Please wait before trying again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(memoryRateLimit.retryAfter) },
      }
    );
  }

  const durableRateLimit = await consumeDurableRateLimit(ip);
  if (!durableRateLimit.allowed) {
    return json(
      {
        ok: false,
        delivered: false,
        error: "Too many attempts. Please wait before trying again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(durableRateLimit.retryAfter) },
      }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json(
      { ok: false, delivered: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_CONTACT_BODY_BYTES) {
    return json(
      { ok: false, delivered: false, error: "Request body is too large." },
      { status: 413 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(
      { ok: false, delivered: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const validation = validateContactPayload(payload);
  if (!validation.ok) {
    return json(
      { ok: false, delivered: false, error: validation.error },
      { status: validation.honeypot ? 400 : 422 }
    );
  }

  const turnstileValid = await verifyTurnstile(validation.inquiry, ip);
  if (!turnstileValid) {
    return json(
      {
        ok: false,
        delivered: false,
        error: "Please complete the security check and try again.",
      },
      { status: 403 }
    );
  }

  const delivery = await deliverInquiry(validation.inquiry);
  if (!delivery.ok) {
    const configurationError = delivery.reason === "configuration";
    return json(
      {
        ok: false,
        delivered: false,
        error: configurationError
          ? "The contact form is not configured yet."
          : "We could not deliver your inquiry just now.",
      },
      { status: configurationError ? 503 : 502 }
    );
  }

  return json({
    ok: true,
    delivered: true,
    confirmationQueued: true,
    submissionId: validation.inquiry.submissionId,
  });
}

export async function GET() {
  return json(
    { ok: false, delivered: false, error: "Method not allowed." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
