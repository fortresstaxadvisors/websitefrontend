import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { InvoiceInput } from "@/lib/invoicing";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

const VERSION = "v1";
const AAD = Buffer.from("fortress-billing-workflow:v1");
const MAX_TOKEN_LENGTH = 16_384;
const MAX_PLAINTEXT_BYTES = 32_768;
const MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

type Envelope = { issuedAt: number; input: InvoiceInput };

function key(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function parseEnvelope(plaintext: Buffer): InvoiceInput {
  const envelope = JSON.parse(inflateRawSync(plaintext, { maxOutputLength: MAX_PLAINTEXT_BYTES }).toString()) as Partial<Envelope>;
  const issuedAt = envelope.issuedAt;
  if (typeof issuedAt !== "number" || !Number.isSafeInteger(issuedAt) || !envelope.input || typeof envelope.input !== "object") throw new Error("Invalid billing workflow token");
  const age = Date.now() - issuedAt;
  if (age < -5 * 60 * 1000 || age > MAX_AGE_MS) throw new Error("Billing workflow token has expired");
  return envelope.input;
}

export async function createBillingWorkflowToken(input: InvoiceInput) {
  const { BILLING_WORKFLOW_SECRET } = await getRuntimeSecrets();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(BILLING_WORKFLOW_SECRET), iv);
  cipher.setAAD(AAD);
  const plaintext = deflateRawSync(Buffer.from(JSON.stringify({ issuedAt: Date.now(), input } satisfies Envelope)));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return [VERSION, iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

export async function readBillingWorkflowToken(token: string) {
  try {
    if (!token || token.length > MAX_TOKEN_LENGTH) throw new Error("Invalid billing workflow token");
    const { BILLING_WORKFLOW_SECRET, BILLING_WORKFLOW_PREVIOUS_SECRET } = await getRuntimeSecrets();
    const secrets = [BILLING_WORKFLOW_SECRET, BILLING_WORKFLOW_PREVIOUS_SECRET].filter((value): value is string => Boolean(value));
    const parts = token.split(".");
    if (parts.length === 4 && parts[0] === VERSION) {
      const iv = Buffer.from(parts[1], "base64url");
      const ciphertext = Buffer.from(parts[2], "base64url");
      const tag = Buffer.from(parts[3], "base64url");
      if (iv.length !== 12 || !ciphertext.length || tag.length !== 16) throw new Error("Invalid billing workflow token");
      for (const secret of secrets) {
        try {
          const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
          decipher.setAAD(AAD);
          decipher.setAuthTag(tag);
          return parseEnvelope(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
        } catch (cause) {
          if (cause instanceof Error && cause.message === "Billing workflow token has expired") throw cause;
        }
      }
    }

    // Compatibility for already-issued signed-only tokens. New tokens always
    // use authenticated encryption so client billing details are not readable
    // from DocuSeal submitter metadata.
    if (parts.length === 2) {
      const [payload, supplied] = parts;
      const a = Buffer.from(supplied);
      for (const secret of secrets) {
        const expected = createHmac("sha256", secret).update(payload).digest("base64url");
        const b = Buffer.from(expected);
        if (a.length === b.length && timingSafeEqual(a, b)) {
          return JSON.parse(inflateRawSync(Buffer.from(payload, "base64url"), { maxOutputLength: MAX_PLAINTEXT_BYTES }).toString()) as InvoiceInput;
        }
      }
    }
  } catch (cause) {
    if (cause instanceof Error && cause.message === "Billing workflow token has expired") throw cause;
  }
  throw new Error("Invalid billing workflow token");
}
