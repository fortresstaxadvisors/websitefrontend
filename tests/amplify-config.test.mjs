import assert from "node:assert/strict";
import test from "node:test";
import { buildRuntimeConfig } from "../scripts/write-amplify-runtime-config.mjs";

function environment(overrides = {}) {
  return {
    FORTRESS_RUNTIME_SECRET_ID: "fortress/website/billing-test",
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
