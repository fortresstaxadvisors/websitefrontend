import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { ServiceAcceptanceInput } from "@/lib/service-acceptance";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

const VERSION = "v1";
const AAD = Buffer.from("fortress-service-acceptance:v1");
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const key = (secret: string) => createHash("sha256").update(secret).digest();

export async function createServiceAcceptanceToken(input: ServiceAcceptanceInput) {
  const { BILLING_WORKFLOW_SECRET } = await getRuntimeSecrets();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(BILLING_WORKFLOW_SECRET), iv);
  cipher.setAAD(AAD);
  const payload = deflateRawSync(Buffer.from(JSON.stringify({ issuedAt: Date.now(), input })));
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  return [VERSION, iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

export async function readServiceAcceptanceToken(token: string) {
  if (!token || token.length > 16_384) throw new Error("Invalid service acceptance token");
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("Invalid service acceptance token");
  const { BILLING_WORKFLOW_SECRET, BILLING_WORKFLOW_PREVIOUS_SECRET } = await getRuntimeSecrets();
  for (const secret of [BILLING_WORKFLOW_SECRET, BILLING_WORKFLOW_PREVIOUS_SECRET].filter((value): value is string => Boolean(value))) {
    try {
      const iv = Buffer.from(parts[1], "base64url"), ciphertext = Buffer.from(parts[2], "base64url"), tag = Buffer.from(parts[3], "base64url");
      if (iv.length !== 12 || !ciphertext.length || tag.length !== 16) continue;
      const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
      decipher.setAAD(AAD); decipher.setAuthTag(tag);
      const envelope = JSON.parse(inflateRawSync(Buffer.concat([decipher.update(ciphertext), decipher.final()]), { maxOutputLength: 32_768 }).toString()) as { issuedAt?: number; input?: ServiceAcceptanceInput };
      if (!Number.isSafeInteger(envelope.issuedAt) || !envelope.input) continue;
      const age = Date.now() - envelope.issuedAt!;
      if (age < -300_000 || age > MAX_AGE_MS) throw new Error("Service acceptance token has expired");
      return envelope.input;
    } catch (cause) {
      if (cause instanceof Error && cause.message === "Service acceptance token has expired") throw cause;
    }
  }
  throw new Error("Invalid service acceptance token");
}
