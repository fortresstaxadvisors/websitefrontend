import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/dispute-case-workflow.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const workflow = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const times = {
  created: "2026-07-21T12:00:00.000Z",
  prepare: "2026-07-21T12:05:00.000Z",
  ready: "2026-07-21T13:00:00.000Z",
  submitted: "2026-07-21T14:00:00.000Z",
  processing: "2026-07-21T14:01:00.000Z",
  won: "2026-07-25T14:00:00.000Z",
  closed: "2026-07-25T15:00:00.000Z",
};
const manifestHash = "b".repeat(64);
const artifact = {
  bucket: "fortress-evidence-test",
  key: "cases/dispute-1/service-acceptance.pdf",
  versionId: "version-1",
  sha256: "a".repeat(64),
  size: 50_000,
  contentType: "application/pdf",
  createdAt: times.ready,
};

function newCase() {
  return workflow.createDisputeCaseRecord({
    disputeId: "dispute-1",
    squareState: "EVIDENCE_REQUIRED",
    reason: "NOT_RECEIVED",
    paymentId: "payment-1",
    orderId: "order-1",
    invoiceId: "invoice-1",
    invoiceNumber: "FTA-2026-001",
    customerId: "customer-1",
    amount: 125_000,
    currency: "usd",
    squareDueAt: "2026-08-01T00:00:00.000Z",
    internalDueAt: "2026-07-30T17:00:00.000Z",
    summary: "Client disputes receipt of the completed tax advisory services.",
    checklist: [{
      id: "service-acceptance",
      label: "Signed service acceptance",
      required: true,
      status: "MISSING",
    }],
    actor: "square-webhook",
  }, times.created);
}

test("creates a new dispute case with authoritative identifiers and audit", () => {
  const record = newCase();
  assert.equal(record.localState, "NEW");
  assert.equal(record.currency, "USD");
  assert.equal(record.version, 1);
  assert.equal(record.auditEntries[0].action, "CREATE");
  assert.equal("actor" in record, false);
  assert.doesNotThrow(() => workflow.validateDisputeCaseRecord(record));
});

test("supports preparation, review, submission, processing, outcome, and closure", () => {
  let record = newCase();
  record = workflow.updateDisputeCaseRecord(record, {
    localState: "PREPARING",
    ownerUserId: "owner@example.com",
    backupOwnerUserId: "backup@example.com",
    checklist: [{
      id: "service-acceptance",
      label: "Signed service acceptance",
      required: true,
      status: "READY",
      evidenceType: "SERVICE_RECEIVED_DOCUMENTATION",
      artifact,
    }],
    actor: "owner@example.com",
    action: "ASSIGN_AND_PREPARE",
  }, times.prepare);
  record = workflow.updateDisputeCaseRecord(record, {
    localState: "READY_FOR_REVIEW",
    actor: "owner@example.com",
    action: "MARK_READY",
  }, times.ready);
  record = workflow.updateDisputeCaseRecord(record, {
    localState: "SUBMITTED",
    review: { reviewedBy: "reviewer@example.com", reviewedAt: times.submitted, manifestHash },
    submission: {
      submittedBy: "reviewer@example.com",
      submittedAt: times.submitted,
      squareEvidenceIds: ["evidence-1"],
      manifestHash,
    },
    actor: "reviewer@example.com",
    action: "SUBMIT_TO_SQUARE",
  }, times.submitted);
  record = workflow.updateDisputeCaseRecord(record, {
    localState: "PROCESSING",
    squareState: "PROCESSING",
    squareSyncedAt: times.processing,
    actor: "square-webhook",
    action: "SQUARE_STATE_UPDATED",
  }, times.processing);
  record = workflow.updateDisputeCaseRecord(record, {
    localState: "WON",
    squareState: "WON",
    squareSyncedAt: times.won,
    actor: "square-webhook",
    action: "SQUARE_STATE_UPDATED",
  }, times.won);
  record = workflow.updateDisputeCaseRecord(record, {
    localState: "CLOSED",
    actor: "owner@example.com",
    action: "CLOSE_CASE",
  }, times.closed);

  assert.equal(record.localState, "CLOSED");
  assert.equal(record.version, 7);
  assert.equal(record.auditEntries.length, 7);
  assert.equal(record.submission.manifestHash, manifestHash);
});

test("blocks skipped transitions and readiness with missing required evidence", () => {
  const record = newCase();
  assert.throws(() => workflow.updateDisputeCaseRecord(record, {
    localState: "SUBMITTED",
    actor: "owner@example.com",
    action: "SKIP",
  }, times.prepare), /cannot move/);

  const preparing = workflow.updateDisputeCaseRecord(record, {
    localState: "PREPARING",
    ownerUserId: "owner@example.com",
    actor: "owner@example.com",
    action: "START_PREPARING",
  }, times.prepare);
  assert.throws(() => workflow.updateDisputeCaseRecord(preparing, {
    localState: "READY_FOR_REVIEW",
    actor: "owner@example.com",
    action: "MARK_READY",
  }, times.ready), /still missing/);
});

test("requires reviewed and submitted manifests to match", () => {
  let record = workflow.updateDisputeCaseRecord(newCase(), {
    localState: "PREPARING",
    ownerUserId: "owner@example.com",
    checklist: [{
      id: "service-acceptance",
      label: "Signed service acceptance",
      required: true,
      status: "READY",
      artifact,
    }],
    actor: "owner@example.com",
    action: "PREPARE",
  }, times.prepare);
  record = workflow.updateDisputeCaseRecord(record, {
    localState: "READY_FOR_REVIEW",
    actor: "owner@example.com",
    action: "MARK_READY",
  }, times.ready);
  assert.throws(() => workflow.updateDisputeCaseRecord(record, {
    localState: "SUBMITTED",
    review: { reviewedBy: "reviewer@example.com", reviewedAt: times.submitted, manifestHash },
    submission: {
      submittedBy: "reviewer@example.com",
      submittedAt: times.submitted,
      squareEvidenceIds: ["evidence-1"],
      manifestHash: "c".repeat(64),
    },
    actor: "reviewer@example.com",
    action: "SUBMIT_TO_SQUARE",
  }, times.submitted), /match the reviewed manifest/);
});

test("rejects identical owner assignments and due dates after Square deadline", () => {
  assert.throws(() => workflow.updateDisputeCaseRecord(newCase(), {
    ownerUserId: "same@example.com",
    backupOwnerUserId: "same@example.com",
    actor: "manager@example.com",
    action: "ASSIGN",
  }, times.prepare), /must differ/);
  assert.throws(() => workflow.updateDisputeCaseRecord(newCase(), {
    internalDueAt: "2026-08-02T00:00:00.000Z",
    actor: "manager@example.com",
    action: "CHANGE_DEADLINE",
  }, times.prepare), /cannot be after/);
});

test("rejects rewritten or non-appended dispute audit history", () => {
  const previous = newCase();
  const next = workflow.updateDisputeCaseRecord(previous, {
    localState: "PREPARING",
    actor: "owner@example.com",
    action: "START_PREPARING",
  }, times.prepare);
  const rewritten = structuredClone(next);
  rewritten.auditEntries[0].actor = "different@example.com";
  assert.throws(() => workflow.validateDisputeAuditAppend(previous, rewritten), /append-only/);

  const removed = structuredClone(next);
  removed.auditEntries.pop();
  assert.throws(() => workflow.validateDisputeAuditAppend(previous, removed), /append exactly one/);
});

test("rejects binary-like or unsupported evidence metadata", () => {
  assert.throws(() => workflow.validateDisputeArtifact({
    ...artifact,
    contentType: "application/zip",
  }), /unsupported/);
  assert.throws(() => workflow.validateDisputeArtifact({
    ...artifact,
    sha256: "not-a-hash",
  }), /hash/);
});
