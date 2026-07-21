import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/docuseal-service-acceptance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const acceptance = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const input = {
  completionId: "milestone-2026-final",
  invoiceId: "invoice-123",
  invoiceNumber: "FTA-2026-001",
  orderId: "order-123",
  clientName: "Client Person",
  clientEmail: "client@example.com",
  company: "Client Company LLC",
  milestoneTitle: "Final advisory delivery",
  serviceSummary: "Delivered the completed advisory memorandum and final review meeting.",
  deliveryDate: "2026-07-21",
  deliveryMethod: "SECURE_PORTAL",
  deliveredTo: "Client Person",
  payerRelationship: "SIGNER",
};

function values(response = acceptance.SERVICE_ACCEPTANCE_ACKNOWLEDGMENT, comment = "Everything listed was received.") {
  return [
    { field: "Client Name", value: input.clientName },
    { field: "Client Company", value: input.company },
    { field: "Invoice Number", value: input.invoiceNumber },
    { field: "Completion Record ID", value: input.completionId },
    { field: "Service or Milestone", value: input.milestoneTitle },
    { field: "Delivery Date", value: input.deliveryDate },
    { field: "Delivery Method", value: "secure portal" },
    { field: "Delivered To", value: input.deliveredTo },
    { field: "Completed Deliverables", value: input.serviceSummary },
    { field: "Client Response", value: response },
    { field: "Client Comments or Issue Description", value: comment },
    { field: "Client Rights Initials", value: "CP" },
    { field: "Client Printed Legal Name", value: "Client Person" },
    { field: "Client Signer Title", value: "Managing Member" },
    { field: "Client Signature", value: "signed-value" },
    { field: "Client Signature Date", value: "07/21/2026" },
  ];
}

function submitter(overrides = {}) {
  return {
    id: 77,
    submission_id: 1001,
    status: "completed",
    role: "Client",
    name: "Client Person",
    email: "CLIENT@example.com",
    external_id: "acceptance:invoice-123:milestone-2026-final:v1",
    metadata: {
      fortress_workflow_kind: "service_acceptance",
      fortress_service_acceptance: "v1.encrypted-token",
    },
    values: values(),
    ...overrides,
  };
}

function record(overrides = {}) {
  return {
    invoiceId: input.invoiceId,
    invoiceNumber: input.invoiceNumber,
    milestoneId: input.completionId,
    serviceDate: input.deliveryDate,
    serviceSummary: input.serviceSummary,
    status: "SENT",
    version: 2,
    docusealSubmissionId: 1001,
    ...overrides,
  };
}

test("uses a stable version-scoped ID per attempt and a fresh ID after expiry", () => {
  assert.equal(acceptance.currentServiceAcceptanceExternalId(record({ status: "DELIVERED", version: 1 })), "acceptance:invoice-123:milestone-2026-final:v1");
  assert.equal(acceptance.currentServiceAcceptanceExternalId(record()), "acceptance:invoice-123:milestone-2026-final:v1");
  assert.equal(acceptance.currentServiceAcceptanceExternalId(record({ status: "EXPIRED", version: 3 })), "acceptance:invoice-123:milestone-2026-final:v3");
  assert.equal(acceptance.currentServiceAcceptanceExternalId(record({ status: "SENT", version: 4 })), "acceptance:invoice-123:milestone-2026-final:v3");
});

test("requires one client submitter on the configured template with service metadata", () => {
  const submission = { id: 1001, status: "completed", template: { id: 42 }, submitters: [submitter()] };
  const result = acceptance.serviceAcceptanceSubmitter(submission, 1001, 42);
  assert.equal(result.token, "v1.encrypted-token");
  assert.equal(acceptance.isServiceAcceptanceSubmission(submission, 42), true);
  assert.throws(() => acceptance.serviceAcceptanceSubmitter({ ...submission, submitters: [submitter(), submitter({ id: 78 })] }, 1001, 42), /exactly one/);
  assert.throws(() => acceptance.serviceAcceptanceSubmitter(submission, 1001, 99), /template/);
  assert.throws(() => acceptance.serviceAcceptanceSubmitter({ ...submission, submitters: [submitter({ role: "Fortress" })] }, 1001, 42), /linkage/);
});

test("validates token record, submission ID, external ID, and intended signer linkage", () => {
  assert.doesNotThrow(() => acceptance.validateServiceAcceptanceLinkage(submitter(), input, record()));
  assert.doesNotThrow(() => acceptance.validateServiceAcceptanceLinkage(submitter({
    external_id: "acceptance:invoice-123:milestone-2026-final",
  }), input, record()));
  assert.throws(() => acceptance.validateServiceAcceptanceLinkage(submitter({ external_id: "acceptance:invoice-123:other:v1" }), input, record()), /external ID/);
  assert.throws(() => acceptance.validateServiceAcceptanceLinkage(submitter({ submission_id: 999 }), input, record()), /active acceptance/);
  assert.throws(() => acceptance.validateServiceAcceptanceLinkage(submitter({ email: "other@example.com" }), input, record()), /signer email/);
  assert.throws(() => acceptance.validateServiceAcceptanceLinkage(submitter(), { ...input, serviceSummary: "Tampered summary" }, record()), /token/);
});

test("accepts an expiry replay for the just-ended attempt while generating a new resend ID", () => {
  const expired = record({ status: "EXPIRED", version: 3 });
  assert.doesNotThrow(() => acceptance.validateServiceAcceptanceLinkage(submitter(), input, expired));
  assert.equal(acceptance.currentServiceAcceptanceExternalId(expired), "acceptance:invoice-123:milestone-2026-final:v3");
});

test("maps only the exact acknowledgment response to COMPLETED", () => {
  const outcome = acceptance.serviceAcceptanceOutcome(submitter(), input);
  assert.equal(outcome.status, "COMPLETED");
  assert.equal(outcome.signerName, "Client Person");
  assert.equal(outcome.signerEmail, "client@example.com");
  assert.match(outcome.auditNote, /acknowledged receipt and review/);
});

test("maps an issue report to DECLINED and sanitizes its audit note", () => {
  const comment = "The final schedule is missing.\nPlease contact me before billing.";
  const outcome = acceptance.serviceAcceptanceOutcome(submitter({
    values: values(acceptance.SERVICE_ACCEPTANCE_ISSUE_REPORT, comment),
  }), input);
  assert.equal(outcome.status, "DECLINED");
  assert.equal(outcome.clientComment, comment);
  assert.equal(outcome.auditNote.includes("\n"), false);
  assert.match(outcome.auditNote, /final schedule is missing/);
});

test("rejects unknown outcomes, tampered protected fields, duplicate fields, or a missing signature", () => {
  assert.throws(() => acceptance.serviceAcceptanceOutcome(submitter({ values: values("Yes") }), input), /allowed outcome/);
  assert.throws(() => acceptance.serviceAcceptanceOutcome(submitter({
    values: values().map((item) => item.field === "Invoice Number" ? { ...item, value: "FTA-OTHER" } : item),
  }), input), /protected completion record/);
  assert.throws(() => acceptance.serviceAcceptanceOutcome(submitter({ values: [...values(), { field: "Client Response", value: acceptance.SERVICE_ACCEPTANCE_ACKNOWLEDGMENT }] }), input), /duplicated/);
  assert.throws(() => acceptance.serviceAcceptanceOutcome(submitter({
    values: values().map((item) => item.field === "Client Signature" ? { ...item, value: "" } : item),
  }), input), /Signature is missing/);
});
