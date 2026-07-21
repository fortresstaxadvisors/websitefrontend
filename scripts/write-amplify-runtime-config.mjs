import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const required = [
  "FORTRESS_DEPLOYMENT_STAGE",
  "FORTRESS_RUNTIME_SECRET_ID",
  "FORTRESS_AWS_REGION",
  "PAYMENT_BASE_URL",
  "SQUARE_ENVIRONMENT",
  "SQUARE_LOCATION_ID",
  "SQUARE_WEBHOOK_NOTIFICATION_URL",
  "DOCUSEAL_BASE_URL",
  "DOCUSEAL_ENGAGEMENT_TEMPLATE_ID",
  "DOCUSEAL_CLIENT_ROLE",
];

const optional = [
  "FORTRESS_SECRET_CACHE_TTL_SECONDS",
  "SQUARE_SANDBOX_SKIP_ATTACHMENTS",
  "SQUARE_ENABLE_ACH",
  "FORTRESS_REFUNDS_ENABLED",
  "FORTRESS_BILLING_OPERATIONS_TABLE",
  "FORTRESS_BILLING_EVIDENCE_BUCKET",
  "FORTRESS_CHECK_PAYEE",
  "FORTRESS_CHECK_REMITTANCE_ADDRESS",
  "PAYMENT_EVENT_FORWARD_URL",
  "DOCUSEAL_FIRM_ROLE",
  "DOCUSEAL_FIRM_SIGNER_NAME",
  "DOCUSEAL_FIRM_SIGNER_EMAIL",
  "DOCUSEAL_COMPLETED_BCC",
  "DOCUSEAL_REPLY_TO",
  "DOCUSEAL_SANDBOX_SEND_EMAIL",
  "DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID",
  "FORTRESS_DISPUTE_ALERT_TOPIC_ARN",
];

function httpsUrl(value, key) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${key} must be a valid URL`); }
  if (url.protocol !== "https:") throw new Error(`${key} must use HTTPS`);
}

export function buildRuntimeConfig(environment = process.env) {
  const values = {};
  for (const key of required) {
    const value = environment[key];
    if (!value) throw new Error(`Missing required Amplify configuration ${key}`);
    values[key] = value;
  }
  for (const key of optional) if (environment[key]) values[key] = environment[key];

  if (!/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(values.FORTRESS_AWS_REGION)) throw new Error("FORTRESS_AWS_REGION is invalid");
  if (!new Set(["sandbox", "production"]).has(values.FORTRESS_DEPLOYMENT_STAGE)) throw new Error("FORTRESS_DEPLOYMENT_STAGE must be sandbox or production");
  if (!new Set(["sandbox", "production"]).has(values.SQUARE_ENVIRONMENT)) throw new Error("SQUARE_ENVIRONMENT must be sandbox or production");
  if (!/^\d+$/.test(values.DOCUSEAL_ENGAGEMENT_TEMPLATE_ID) || Number(values.DOCUSEAL_ENGAGEMENT_TEMPLATE_ID) < 1) throw new Error("DOCUSEAL_ENGAGEMENT_TEMPLATE_ID must be a positive integer");
  if (values.DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID && (!/^\d+$/.test(values.DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID) || Number(values.DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID) < 1)) throw new Error("DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID must be a positive integer");
  for (const key of ["PAYMENT_BASE_URL", "SQUARE_WEBHOOK_NOTIFICATION_URL", "DOCUSEAL_BASE_URL"]) httpsUrl(values[key], key);
  if (values.PAYMENT_EVENT_FORWARD_URL) httpsUrl(values.PAYMENT_EVENT_FORWARD_URL, "PAYMENT_EVENT_FORWARD_URL");
  if (values.SQUARE_WEBHOOK_NOTIFICATION_URL !== `${new URL(values.PAYMENT_BASE_URL).origin}/api/webhooks/square`) throw new Error("Square webhook URL must exactly match PAYMENT_BASE_URL origin plus /api/webhooks/square");
  if (values.PAYMENT_EVENT_FORWARD_URL && new URL(values.PAYMENT_EVENT_FORWARD_URL).href === new URL(values.SQUARE_WEBHOOK_NOTIFICATION_URL).href) throw new Error("PAYMENT_EVENT_FORWARD_URL cannot point to the Square webhook");
  if (!new URL(values.DOCUSEAL_BASE_URL).pathname.replace(/\/$/, "").endsWith("/api")) throw new Error("DOCUSEAL_BASE_URL must end in /api");
  if (!values.FORTRESS_RUNTIME_SECRET_ID.toLowerCase().includes(values.FORTRESS_DEPLOYMENT_STAGE)) throw new Error("FORTRESS_RUNTIME_SECRET_ID must identify the deployment stage");
  if (values.FORTRESS_DEPLOYMENT_STAGE !== values.SQUARE_ENVIRONMENT) throw new Error("Deployment stage and Square environment must match");
  if (values.FORTRESS_DEPLOYMENT_STAGE === "production") {
    if (new URL(values.PAYMENT_BASE_URL).origin !== "https://fortresstaxadvisors.com") throw new Error("Production PAYMENT_BASE_URL must be the canonical Fortress origin");
    if (values.SQUARE_SANDBOX_SKIP_ATTACHMENTS === "true") throw new Error("Production cannot skip signed-agreement attachments");
    if (!values.FORTRESS_BILLING_OPERATIONS_TABLE) throw new Error("Production requires a durable billing operations table");
    if (!values.FORTRESS_BILLING_EVIDENCE_BUCKET) throw new Error("Production requires a durable billing evidence bucket");
    if (!values.PAYMENT_EVENT_FORWARD_URL) throw new Error("Production requires a payment-event alert/worker endpoint");
    if (!values.DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID) throw new Error("Production requires a service-acceptance template");
    if (!values.FORTRESS_DISPUTE_ALERT_TOPIC_ARN) throw new Error("Production requires a dispute alert topic");
  } else if (new URL(values.PAYMENT_BASE_URL).origin === "https://fortresstaxadvisors.com") {
    throw new Error("Sandbox PAYMENT_BASE_URL cannot use the production origin");
  }
  for (const key of ["SQUARE_SANDBOX_SKIP_ATTACHMENTS", "SQUARE_ENABLE_ACH", "FORTRESS_REFUNDS_ENABLED"]) {
    if (values[key] && !new Set(["true", "false"]).has(values[key])) throw new Error(`${key} must be true or false`);
  }
  if (values.FORTRESS_BILLING_OPERATIONS_TABLE && !/^[A-Za-z0-9_.-]{3,255}$/.test(values.FORTRESS_BILLING_OPERATIONS_TABLE)) throw new Error("FORTRESS_BILLING_OPERATIONS_TABLE is invalid");
  if (values.FORTRESS_BILLING_EVIDENCE_BUCKET && (
    !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(values.FORTRESS_BILLING_EVIDENCE_BUCKET)
    || values.FORTRESS_BILLING_EVIDENCE_BUCKET.includes("..")
    || /(?:^|\.)(?:\d{1,3}\.){3}\d{1,3}$/.test(values.FORTRESS_BILLING_EVIDENCE_BUCKET)
  )) throw new Error("FORTRESS_BILLING_EVIDENCE_BUCKET is invalid");
  if (values.DOCUSEAL_SANDBOX_SEND_EMAIL && !new Set(["true", "false"]).has(values.DOCUSEAL_SANDBOX_SEND_EMAIL)) throw new Error("DOCUSEAL_SANDBOX_SEND_EMAIL must be true or false");
  if (values.FORTRESS_DEPLOYMENT_STAGE === "production" && values.DOCUSEAL_SANDBOX_SEND_EMAIL === "false") throw new Error("Production cannot disable DocuSeal signature-request email");
  if (values.FORTRESS_SECRET_CACHE_TTL_SECONDS && (!/^\d+$/.test(values.FORTRESS_SECRET_CACHE_TTL_SECONDS) || Number(values.FORTRESS_SECRET_CACHE_TTL_SECONDS) < 30 || Number(values.FORTRESS_SECRET_CACHE_TTL_SECONDS) > 3600)) throw new Error("FORTRESS_SECRET_CACHE_TTL_SECONDS must be between 30 and 3600");
  if (Boolean(values.DOCUSEAL_FIRM_SIGNER_NAME) !== Boolean(values.DOCUSEAL_FIRM_SIGNER_EMAIL)) throw new Error("DocuSeal firm signer name and email must be set together");
  if (Boolean(values.FORTRESS_CHECK_PAYEE) !== Boolean(values.FORTRESS_CHECK_REMITTANCE_ADDRESS)) throw new Error("Check payee and remittance address must be set together");
  if (values.FORTRESS_DISPUTE_ALERT_TOPIC_ARN) {
    const match = values.FORTRESS_DISPUTE_ALERT_TOPIC_ARN.match(/^arn:aws:sns:([a-z]{2}(?:-gov)?-[a-z]+-\d):\d{12}:[A-Za-z0-9_-]{1,256}$/);
    if (!match || match[1] !== values.FORTRESS_AWS_REGION) throw new Error("FORTRESS_DISPUTE_ALERT_TOPIC_ARN is invalid or in the wrong region");
  }
  for (const [key, value] of Object.entries(values)) if (/[\r\n\0]/.test(value)) throw new Error(`${key} contains an invalid control character`);
  return Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n") + "\n";
}

export function writeRuntimeConfig(destination = path.resolve(".env.production"), environment = process.env) {
  fs.writeFileSync(destination, buildRuntimeConfig(environment), { mode: 0o600 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  writeRuntimeConfig();
  console.log("Wrote reviewed non-secret Amplify runtime configuration to .env.production.");
}
