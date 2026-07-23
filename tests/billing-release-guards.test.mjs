import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("leases Square side effects independently before external delivery", () => {
  const store = read("src/lib/billing-operations-store.ts");
  const webhook = read("src/app/api/webhooks/square/route.ts");
  assert.match(store, /EVENT_EFFECT#/);
  assert.match(store, /leaseUntil/);
  assert.match(store, /ConditionExpression: "attribute_not_exists\(#pk\) OR \(#state = :processing AND #leaseUntil < :now\)"/);
  assert.match(webhook, /acquireBillingEventEffect\(event\.event_id, "SNS_ALERT"\)/);
  assert.match(webhook, /acquireBillingEventEffect\(event\.event_id, "EXTERNAL_FORWARD"\)/);
  assert.match(webhook, /completeBillingEventEffect/);
});

test("reserves each service-acceptance attempt before DocuSeal creation", () => {
  const store = read("src/lib/service-acceptance-store.ts");
  const route = read("src/app/api/internal/acceptances/route.ts");
  assert.match(store, /ACCEPTANCE_ATTEMPT#/);
  assert.match(store, /status: string\("CREATING"\)/);
  const acquireAt = route.indexOf("acquireServiceAcceptanceAttempt(externalId)");
  const createAt = route.indexOf('docusealFetch<Submitter[]>("/submissions"');
  assert.ok(acquireAt > 0 && createAt > acquireAt, "attempt reservation must precede DocuSeal creation");
  assert.match(route, /completeServiceAcceptanceAttempt\(attempt\.lease, submissionId\)/);
});

test("full Sandbox release requires the service-acceptance template ID", () => {
  const script = read("scripts/deploy-billing-sandbox-cloudshell.sh");
  assert.match(script, /if \[\[ ! "\$service_acceptance_template_id" =~ \^\[1-9\]\[0-9\]\*\$ \]\]/);
});

test("repeat Sandbox releases reuse the stored DocuSeal webhook secret", () => {
  const script = read("scripts/deploy-billing-sandbox-cloudshell.sh");
  const secretReadAt = script.indexOf("existing_secret_json=");
  const transportAt = script.indexOf("aws sqs create-queue");
  assert.ok(secretReadAt > 0 && transportAt > secretReadAt, "Secrets Manager must be checked before opening a transport queue");
  assert.match(script, /if \[\[ "\$docuseal_hmac" == whsec_\* \]\]/);
  assert.match(script, /Reusing the existing DocuSeal webhook verification secret/);
});

test("Sandbox release failures cannot fall through to a false success", () => {
  const script = read("scripts/deploy-billing-sandbox-cloudshell.sh");
  const earlyUnsetAt = script.indexOf("unset square_token square_signature secret_json");
  const docusealVerificationAt = script.indexOf("docuseal_hmac_header=");
  assert.ok(earlyUnsetAt > 0 && docusealVerificationAt > earlyUnsetAt);
  assert.doesNotMatch(script.slice(earlyUnsetAt, docusealVerificationAt), /unset[^\n]*docuseal_hmac/);
  assert.doesNotMatch(script, /fortress_deploy_billing_sandbox \|\|/);
  assert.match(script, /fortress_deploy_billing_sandbox\nfortress_status=\$\?/);
});

test("staff-added dispute evidence is bounded and locked after submission", () => {
  const evidence = read("src/app/api/internal/disputes/evidence/route.ts");
  const cases = read("src/app/api/internal/disputes/route.ts");
  assert.match(evidence, /Evidence upload length is required/);
  assert.match(evidence, /Evidence is locked after submission/);
  assert.match(cases, /attestedExactFiles/);
  assert.match(cases, /Required evidence cannot be excluded/);
});
