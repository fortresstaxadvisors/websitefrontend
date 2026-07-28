import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildRuntimeConfig } from "../scripts/write-amplify-runtime-config.mjs";

function environment(overrides = {}) {
  return {
    FORTRESS_DEPLOYMENT_STAGE: "sandbox",
    FORTRESS_RUNTIME_SECRET_ID: "fortress/website/billing-sandbox",
    FORTRESS_AWS_REGION: "us-east-1",
    PAYMENT_BASE_URL: "https://test.fortresstaxadvisors.com",
    SQUARE_ENVIRONMENT: "sandbox",
    SQUARE_LOCATION_ID: "sandbox-location",
    SQUARE_LOCATION_TIME_ZONE: "UTC",
    SQUARE_WEBHOOK_NOTIFICATION_URL: "https://test.fortresstaxadvisors.com/api/webhooks/square",
    DOCUSEAL_BASE_URL: "https://sign-test.fortresstaxadvisors.com/api",
    DOCUSEAL_ENGAGEMENT_TEMPLATE_ID: "42",
    DOCUSEAL_CLIENT_ROLE: "Client",
    ...overrides,
  };
}

test("writes only reviewed non-secret configuration", () => {
  const output = buildRuntimeConfig(environment({
    SQUARE_ACCESS_TOKEN: "must-not-be-written",
    DOCUSEAL_API_TOKEN: "must-not-be-written",
  }));
  assert.match(output, /FORTRESS_RUNTIME_SECRET_ID=/);
  assert.match(output, /SQUARE_LOCATION_ID=/);
  assert.match(output, /SQUARE_LOCATION_TIME_ZONE="UTC"/);
  assert.doesNotMatch(output, /must-not-be-written|SQUARE_ACCESS_TOKEN|DOCUSEAL_API_TOKEN/);
});

test("requires the exact Square webhook URL", () => {
  assert.throws(() => buildRuntimeConfig(environment({ SQUARE_WEBHOOK_NOTIFICATION_URL: "https://example.com/webhook" })), /exactly match/);
});

test("requires firm signer name and email together", () => {
  assert.throws(() => buildRuntimeConfig(environment({ DOCUSEAL_FIRM_SIGNER_NAME: "Fortress" })), /must be set together/);
});

test("keeps sandbox resources away from the production origin and secret", () => {
  assert.throws(() => buildRuntimeConfig(environment({ PAYMENT_BASE_URL: "https://fortresstaxadvisors.com", SQUARE_WEBHOOK_NOTIFICATION_URL: "https://fortresstaxadvisors.com/api/webhooks/square" })), /Sandbox PAYMENT_BASE_URL/);
  assert.throws(() => buildRuntimeConfig(environment({ FORTRESS_RUNTIME_SECRET_ID: "fortress/website/billing-production" })), /identify the deployment stage/);
});

test("requires production settings to move together", () => {
  assert.throws(() => buildRuntimeConfig(environment({ FORTRESS_DEPLOYMENT_STAGE: "production", FORTRESS_RUNTIME_SECRET_ID: "fortress/website/billing-production" })), /must match/);
  assert.doesNotThrow(() => buildRuntimeConfig(environment({
    FORTRESS_DEPLOYMENT_STAGE: "production",
    FORTRESS_RUNTIME_SECRET_ID: "fortress/website/billing-production",
    PAYMENT_BASE_URL: "https://fortresstaxadvisors.com",
    SQUARE_ENVIRONMENT: "production",
    SQUARE_WEBHOOK_NOTIFICATION_URL: "https://fortresstaxadvisors.com/api/webhooks/square",
    SQUARE_SANDBOX_SKIP_ATTACHMENTS: "false",
    FORTRESS_BILLING_OPERATIONS_TABLE: "fortress-billing-production-operations",
    FORTRESS_BILLING_EVIDENCE_BUCKET: "fortress-billing-production-evidence-123456789012",
    PAYMENT_EVENT_FORWARD_URL: "https://alerts.fortresstaxadvisors.com/square",
    DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID: "43",
    FORTRESS_DISPUTE_ALERT_TOPIC_ARN: "arn:aws:sns:us-east-1:123456789012:fortress-billing-production-dispute-alerts",
  })));
});

test("requires complete check instructions when checks are enabled", () => {
  assert.throws(() => buildRuntimeConfig(environment({ FORTRESS_CHECK_PAYEE: "Fortress Tax Advisors" })), /payee and remittance address/);
  assert.doesNotThrow(() => buildRuntimeConfig(environment({ FORTRESS_CHECK_PAYEE: "Fortress Tax Advisors", FORTRESS_CHECK_REMITTANCE_ADDRESS: "Verified test address" })));
});

test("requires production acceptance and a dispute alert topic", () => {
  assert.throws(() => buildRuntimeConfig(environment({
    FORTRESS_DEPLOYMENT_STAGE: "production", FORTRESS_RUNTIME_SECRET_ID: "fortress/website/billing-production",
    PAYMENT_BASE_URL: "https://fortresstaxadvisors.com", SQUARE_ENVIRONMENT: "production",
    SQUARE_WEBHOOK_NOTIFICATION_URL: "https://fortresstaxadvisors.com/api/webhooks/square",
    SQUARE_SANDBOX_SKIP_ATTACHMENTS: "false", FORTRESS_BILLING_OPERATIONS_TABLE: "fortress-billing-production-operations",
    FORTRESS_BILLING_EVIDENCE_BUCKET: "fortress-billing-production-evidence-123456789012",
    PAYMENT_EVENT_FORWARD_URL: "https://alerts.fortresstaxadvisors.com/square",
  })), /service-acceptance template/);
  assert.throws(() => buildRuntimeConfig(environment({
    FORTRESS_DEPLOYMENT_STAGE: "production", FORTRESS_RUNTIME_SECRET_ID: "fortress/website/billing-production",
    PAYMENT_BASE_URL: "https://fortresstaxadvisors.com", SQUARE_ENVIRONMENT: "production",
    SQUARE_WEBHOOK_NOTIFICATION_URL: "https://fortresstaxadvisors.com/api/webhooks/square",
    SQUARE_SANDBOX_SKIP_ATTACHMENTS: "false", FORTRESS_BILLING_OPERATIONS_TABLE: "fortress-billing-production-operations",
    FORTRESS_BILLING_EVIDENCE_BUCKET: "fortress-billing-production-evidence-123456789012",
    PAYMENT_EVENT_FORWARD_URL: "https://alerts.fortresstaxadvisors.com/square", DOCUSEAL_SERVICE_ACCEPTANCE_TEMPLATE_ID: "43",
  })), /dispute alert topic/);
});

test("prevents a forwarding loop", () => {
  assert.throws(() => buildRuntimeConfig(environment({ PAYMENT_EVENT_FORWARD_URL: "https://test.fortresstaxadvisors.com/api/webhooks/square" })), /cannot point/);
});

test("validates durable operations and refund controls", () => {
  const output = buildRuntimeConfig(environment({
    FORTRESS_BILLING_OPERATIONS_TABLE: "fortress-billing-sandbox-operations",
    FORTRESS_REFUNDS_ENABLED: "true",
    SQUARE_ENABLE_ACH: "true",
  }));
  assert.match(output, /FORTRESS_BILLING_OPERATIONS_TABLE="fortress-billing-sandbox-operations"/);
  assert.match(output, /FORTRESS_REFUNDS_ENABLED="true"/);
  assert.throws(() => buildRuntimeConfig(environment({ FORTRESS_REFUNDS_ENABLED: "yes" })), /must be true or false/);
  assert.throws(() => buildRuntimeConfig(environment({ FORTRESS_BILLING_OPERATIONS_TABLE: "bad table name" })), /invalid/);
});

test("exports and validates the private evidence bucket name", () => {
  const output = buildRuntimeConfig(environment({
    FORTRESS_BILLING_EVIDENCE_BUCKET: "fortress-billing-sandbox-evidence-123456789012",
  }));
  assert.match(output, /FORTRESS_BILLING_EVIDENCE_BUCKET="fortress-billing-sandbox-evidence-123456789012"/);
  assert.throws(() => buildRuntimeConfig(environment({ FORTRESS_BILLING_EVIDENCE_BUCKET: "Invalid_Bucket" })), /EVIDENCE_BUCKET is invalid/);
  assert.throws(() => buildRuntimeConfig(environment({ FORTRESS_BILLING_EVIDENCE_BUCKET: "192.168.1.1" })), /EVIDENCE_BUCKET is invalid/);
});

test("limits Amplify evidence access to workflow object prefixes", () => {
  const script = readFileSync(new URL("../scripts/deploy-billing-sandbox-cloudshell.sh", import.meta.url), "utf8");
  assert.match(script, /engagement_objects "\$\{evidence_bucket_arn\}\/engagements\/\*"/);
  assert.match(script, /acceptance_objects "\$\{evidence_bucket_arn\}\/acceptances\/\*"/);
  assert.match(script, /dispute_objects "\$\{evidence_bucket_arn\}\/disputes\/\*"/);
  assert.match(script, /Action:\["s3:GetObject","s3:GetObjectVersion","s3:PutObject"\]/);
  assert.doesNotMatch(script, /s3:(?:DeleteObject|ListBucket)/);
});

test("exports a same-region SNS topic without recipient addresses", () => {
  const alerts = { FORTRESS_DISPUTE_ALERT_TOPIC_ARN: "arn:aws:sns:us-east-1:123456789012:fortress-billing-sandbox-dispute-alerts" };
  const output = buildRuntimeConfig(environment(alerts));
  assert.match(output, /FORTRESS_DISPUTE_ALERT_TOPIC_ARN="arn:aws:sns:us-east-1:123456789012:fortress-billing-sandbox-dispute-alerts"/);
  assert.doesNotMatch(output, /FORTRESS_DISPUTE_ALERT_RECIPIENTS|owner@|backup@/);
  assert.throws(() => buildRuntimeConfig(environment({ ...alerts, FORTRESS_DISPUTE_ALERT_TOPIC_ARN: "arn:aws:sns:us-west-2:123456789012:wrong-region" })), /wrong region/);
});

test("provisions idempotent SNS email alerts with exact-topic publish access", () => {
  const script = readFileSync(new URL("../scripts/deploy-billing-sandbox-cloudshell.sh", import.meta.url), "utf8");
  assert.match(script, /aws sns create-topic/);
  assert.match(script, /aws sns list-subscriptions-by-topic/);
  assert.match(script, /aws sns subscribe/);
  assert.match(script, /Action:"sns:Publish"/);
  assert.match(script, /Resource:\$topic/);
  assert.match(script, /must confirm the AWS subscription email before alerts can arrive/);
  assert.doesNotMatch(script, /Action:"sns:\*"/);
});

test("enables DocuSeal invitations for human Sandbox testing", () => {
  const script = readFileSync(new URL("../scripts/deploy-billing-sandbox-cloudshell.sh", import.meta.url), "utf8");
  assert.match(script, /DOCUSEAL_SANDBOX_SEND_EMAIL:\s*"true"/);
  assert.match(buildRuntimeConfig(environment({ DOCUSEAL_SANDBOX_SEND_EMAIL: "true" })), /DOCUSEAL_SANDBOX_SEND_EMAIL="true"/);
});

test("enables a safe Fortress invoice-link email without leaving Square Sandbox", () => {
  const script = readFileSync(new URL("../scripts/deploy-billing-sandbox-cloudshell.sh", import.meta.url), "utf8");
  const policyStart = script.indexOf('Sid:"FortressSandboxInvoiceEmail"');
  const policyEnd = script.indexOf("installed_transactional_email_policy=", policyStart);
  assert.ok(policyStart >= 0 && policyEnd > policyStart);
  const transactionalPolicy = script.slice(policyStart, policyEnd);
  assert.match(script, /FORTRESS_SANDBOX_INVOICE_EMAIL:\s*"true"/);
  assert.match(transactionalPolicy, /Action:"ses:SendEmail"/);
  assert.match(transactionalPolicy, /Resource:"\*"/);
  assert.match(transactionalPolicy, /Condition:\{StringEquals:\{"ses:FromAddress":\$from\}\}/);
  assert.doesNotMatch(transactionalPolicy, /ses:\*/);
  assert.doesNotMatch(transactionalPolicy, /ses:Recipients/);
  assert.doesNotMatch(transactionalPolicy, /transactional_identity_arn|Resource:\$identity/);
  assert.match(script, /aws iam get-role-policy/);
  assert.match(script, /\.\[0\]\.Resource == "\*"/);
  assert.match(script, /SQUARE_ENVIRONMENT:\s*"sandbox"/);
  assert.doesNotMatch(script, /SQUARE_ENVIRONMENT:\s*"production"/);
  const output = buildRuntimeConfig(environment({
    FORTRESS_SANDBOX_INVOICE_EMAIL: "true",
    FORTRESS_TRANSACTIONAL_EMAIL_FROM: "engagements@fortresstaxadvisors.com",
    FORTRESS_TRANSACTIONAL_EMAIL_REPLY_TO: "clientservice@fortresstaxadvisors.com",
  }));
  assert.match(output, /FORTRESS_SANDBOX_INVOICE_EMAIL="true"/);
  assert.throws(() => buildRuntimeConfig(environment({
    FORTRESS_SANDBOX_INVOICE_EMAIL: "true",
  })), /TRANSACTIONAL_EMAIL_FROM/);
});
