import "server-only";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const requiredKeys = [
  "SQUARE_ACCESS_TOKEN",
  "SQUARE_WEBHOOK_SIGNATURE_KEY",
  "INVOICE_ADMIN_USERNAME",
  "INVOICE_ADMIN_PASSWORD",
  "BILLING_WORKFLOW_SECRET",
  "DOCUSEAL_API_TOKEN",
  "DOCUSEAL_WEBHOOK_SECRET",
] as const;

type RequiredSecretKey = (typeof requiredKeys)[number];
export type RuntimeSecrets = Record<RequiredSecretKey, string> & {
  PAYMENT_EVENT_FORWARD_TOKEN?: string;
};

let cached: { expiresAt: number; value: Promise<RuntimeSecrets> } | undefined;

function validate(input: unknown): RuntimeSecrets {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Runtime secret must be a JSON object");
  const source = input as Record<string, unknown>;
  const output = {} as RuntimeSecrets;
  for (const key of requiredKeys) {
    const value = source[key];
    if (typeof value !== "string" || !value.trim()) throw new Error(`Runtime secret is missing ${key}`);
    output[key] = value;
  }
  if (output.BILLING_WORKFLOW_SECRET.length < 32) throw new Error("BILLING_WORKFLOW_SECRET must be at least 32 characters");
  if (output.INVOICE_ADMIN_PASSWORD.length < 24) throw new Error("INVOICE_ADMIN_PASSWORD must be at least 24 characters");
  if (typeof source.PAYMENT_EVENT_FORWARD_TOKEN === "string" && source.PAYMENT_EVENT_FORWARD_TOKEN) {
    output.PAYMENT_EVENT_FORWARD_TOKEN = source.PAYMENT_EVENT_FORWARD_TOKEN;
  }
  return output;
}

function localSecrets() {
  if (process.env.NODE_ENV === "production" || process.env.FORTRESS_ALLOW_LOCAL_ENV_SECRETS !== "true") {
    throw new Error("FORTRESS_RUNTIME_SECRET_ID is not configured");
  }
  return validate(Object.fromEntries([...requiredKeys, "PAYMENT_EVENT_FORWARD_TOKEN"].map((key) => [key, process.env[key]])));
}

async function load(): Promise<RuntimeSecrets> {
  const secretId = process.env.FORTRESS_RUNTIME_SECRET_ID;
  if (!secretId) return localSecrets();
  const region = process.env.FORTRESS_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) throw new Error("FORTRESS_AWS_REGION is not configured");
  const client = new SecretsManagerClient({ region });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) throw new Error("Runtime secret must use SecretString JSON");
  return validate(JSON.parse(response.SecretString));
}

export function getRuntimeSecrets(): Promise<RuntimeSecrets> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;
  const configuredTtl = Number(process.env.FORTRESS_SECRET_CACHE_TTL_SECONDS || "300");
  const ttlSeconds = Number.isFinite(configuredTtl) ? Math.min(3600, Math.max(30, configuredTtl)) : 300;
  const value = load().catch((error) => {
    cached = undefined;
    throw error;
  });
  cached = { expiresAt: now + ttlSeconds * 1000, value };
  return value;
}
