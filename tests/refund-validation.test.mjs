import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/refund-validation.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const validation = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("normalizes refund inputs and returns a stable idempotency key", () => {
  const first = validation.validateRefundInput({ invoiceId: "inv:123", reason: "  Duplicate payment  ", reference: " RF-2026-001 " });
  const replay = validation.validateRefundInput({ invoiceId: "inv:123", reason: "Different explanation", reference: "rf-2026-001" });
  assert.equal(first.reason, "Duplicate payment");
  assert.equal(first.reference, "RF-2026-001");
  assert.equal(first.idempotencyKey, replay.idempotencyKey);
  assert.equal(first.idempotencyKey.length, 45);
});

test("rejects unsafe or ambiguous refund inputs", () => {
  assert.throws(() => validation.validateRefundInput({ invoiceId: "", reason: "Valid reason", reference: "RF-01" }), /Invoice ID/);
  assert.throws(() => validation.validateRefundInput({ invoiceId: "inv", reason: "bad", reference: "RF-01" }), /5–140/);
  assert.throws(() => validation.validateRefundInput({ invoiceId: "inv", reason: "Valid reason", reference: "spaces are unsafe" }), /4–64/);
});

test("signs, verifies, expires, and detects tampered refund previews", () => {
  const payload = {
    invoiceId: "inv-1",
    invoiceNumber: "FTA-001",
    paymentId: "pay-1",
    amount: 2500,
    currency: "USD",
    version: "version-1",
    expiresAt: 2_000,
  };
  const token = validation.createRefundPreviewToken(payload, "a sufficiently long workflow secret");
  assert.deepEqual(validation.verifyRefundPreviewToken(token, "a sufficiently long workflow secret", 1_000), payload);
  assert.throws(() => validation.verifyRefundPreviewToken(`${token}x`, "a sufficiently long workflow secret", 1_000), /invalid/);
  assert.throws(() => validation.verifyRefundPreviewToken(token, "wrong secret", 1_000), /invalid/);
  assert.throws(() => validation.verifyRefundPreviewToken(token, "a sufficiently long workflow secret", 2_001), /expired/);
});
