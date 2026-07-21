import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/service-acceptance-workflow.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const workflow = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const at = {
  delivered: "2026-07-21T12:00:00.000Z",
  sent: "2026-07-21T12:05:00.000Z",
  completed: "2026-07-22T15:00:00.000Z",
};

const artifact = (key) => ({
  bucket: "fortress-evidence-test",
  key,
  versionId: "version-1",
  sha256: "a".repeat(64),
  size: 12_345,
  contentType: "application/pdf",
  createdAt: at.completed,
});

function deliveredRecord() {
  return workflow.createServiceAcceptanceRecord({
    invoiceId: "inv:123",
    invoiceNumber: "FTA-2026-001",
    milestoneId: "final-delivery",
    squareInvoiceId: "inv:123",
    engagementSubmissionId: 42,
    serviceDate: "2026-07-21",
    serviceSummary: "Delivered the completed advisory memorandum and final review meeting.",
    actor: "operator@example.com",
  }, at.delivered);
}

test("creates a milestone-scoped delivered acceptance with one audit entry", () => {
  const record = deliveredRecord();
  assert.equal(record.status, "DELIVERED");
  assert.equal(record.version, 1);
  assert.deepEqual(record.auditEntries, [{
    action: "CREATE",
    toStatus: "DELIVERED",
    actor: "operator@example.com",
    at: at.delivered,
  }]);
  assert.doesNotThrow(() => workflow.validateServiceAcceptanceRecord(record));
});

test("advances from delivery through archived signed completion", () => {
  const delivered = deliveredRecord();
  const sent = workflow.advanceServiceAcceptanceRecord(delivered, {
    status: "SENT",
    actor: "operator@example.com",
    docusealSubmissionId: 77,
  }, at.sent).record;
  const completed = workflow.advanceServiceAcceptanceRecord(sent, {
    status: "COMPLETED",
    actor: "docuseal-webhook",
    docusealSubmissionId: 77,
    signerName: "Client Person",
    signerEmail: "CLIENT@EXAMPLE.COM",
    acceptanceArtifact: artifact("acceptances/inv-123/final.pdf"),
    auditArtifact: artifact("acceptances/inv-123/audit.pdf"),
  }, at.completed).record;

  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.signerEmail, "client@example.com");
  assert.equal(completed.completedAt, at.completed);
  assert.equal(completed.version, 3);
  assert.equal(completed.auditEntries.length, 3);
  assert.throws(() => workflow.advanceServiceAcceptanceRecord(completed, {
    status: "WITHDRAWN",
    actor: "operator@example.com",
  }), /cannot move/);
});

test("requires a DocuSeal ID when sent and complete archived evidence when completed", () => {
  const delivered = deliveredRecord();
  assert.throws(() => workflow.advanceServiceAcceptanceRecord(delivered, {
    status: "SENT",
    actor: "operator@example.com",
  }, at.sent), /DocuSeal submission ID/);

  const sent = workflow.advanceServiceAcceptanceRecord(delivered, {
    status: "SENT",
    actor: "operator@example.com",
    docusealSubmissionId: 77,
  }, at.sent).record;
  assert.throws(() => workflow.advanceServiceAcceptanceRecord(sent, {
    status: "COMPLETED",
    actor: "docuseal-webhook",
    signerName: "Client Person",
    signerEmail: "client@example.com",
  }, at.completed), /archived signature evidence/);
});

test("permits resend after expiry but not after decline", () => {
  const sent = workflow.advanceServiceAcceptanceRecord(deliveredRecord(), {
    status: "SENT",
    actor: "operator@example.com",
    docusealSubmissionId: 77,
  }, at.sent).record;
  const expired = workflow.advanceServiceAcceptanceRecord(sent, {
    status: "EXPIRED",
    actor: "deadline-worker",
  }, "2026-08-05T12:00:00.000Z").record;
  assert.equal(workflow.advanceServiceAcceptanceRecord(expired, {
    status: "SENT",
    actor: "operator@example.com",
    docusealSubmissionId: 88,
  }, "2026-08-05T12:05:00.000Z").record.docusealSubmissionId, 88);

  const declined = workflow.advanceServiceAcceptanceRecord(sent, {
    status: "DECLINED",
    actor: "docuseal-webhook",
    note: "Client requested corrections.",
  }, at.completed).record;
  assert.throws(() => workflow.advanceServiceAcceptanceRecord(declined, {
    status: "SENT",
    actor: "operator@example.com",
    docusealSubmissionId: 99,
  }), /cannot move/);
});

test("rejects rewritten or non-appended acceptance audit history", () => {
  const previous = deliveredRecord();
  const next = workflow.advanceServiceAcceptanceRecord(previous, {
    status: "WITHDRAWN",
    actor: "operator@example.com",
  }, at.sent).record;
  const rewritten = structuredClone(next);
  rewritten.auditEntries[0].actor = "different@example.com";
  assert.throws(() => workflow.validateAcceptanceAuditAppend(previous, rewritten), /append-only/);

  const skippedVersion = structuredClone(next);
  skippedVersion.version = 9;
  assert.throws(() => workflow.validateAcceptanceAuditAppend(previous, skippedVersion), /append exactly one/);
});

test("rejects unsafe service summaries and oversized artifacts", () => {
  assert.throws(() => workflow.createServiceAcceptanceRecord({
    invoiceId: "inv:123",
    invoiceNumber: "FTA-1",
    milestoneId: "final",
    serviceDate: "2026-07-21",
    serviceSummary: "Too short",
    actor: "operator@example.com",
  }, at.delivered), /20 to 2,000/);
  assert.throws(() => workflow.validateAcceptanceArtifact({
    ...artifact("acceptance.pdf"),
    size: 25 * 1024 * 1024 + 1,
  }, "Acceptance artifact"), /size/);
});
