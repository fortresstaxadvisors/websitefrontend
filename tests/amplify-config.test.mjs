import assert from "node:assert/strict";
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
  })));
});

test("prevents a forwarding loop", () => {
  assert.throws(() => buildRuntimeConfig(environment({ PAYMENT_EVENT_FORWARD_URL: "https://test.fortresstaxadvisors.com/api/webhooks/square" })), /cannot point/);
});
