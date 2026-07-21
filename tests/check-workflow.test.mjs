import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/check-workflow.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const workflow = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("accepts the strict happy-path check lifecycle", () => {
  let state = null;
  for (const [action, expected] of [
    ["RECEIVE", "RECEIVED"],
    ["DEPOSIT", "DEPOSITED"],
    ["CLEAR", "CLEARED_AWAITING_SQUARE"],
    ["RECONCILE", "RECONCILED"],
  ]) {
    const result = workflow.validateCheckTransition(state, action);
    assert.deepEqual(result, { state: expected, idempotent: false });
    state = result.state;
  }
});

test("permits return from every pre-reconciled state", () => {
  for (const state of ["RECEIVED", "DEPOSITED", "CLEARED_AWAITING_SQUARE"]) {
    assert.deepEqual(workflow.validateCheckTransition(state, "RETURN"), {
      state: "RETURNED",
      idempotent: false,
    });
  }
});

test("treats repeated same-state actions as idempotent", () => {
  for (const [state, action] of [
    ["RECEIVED", "RECEIVE"],
    ["DEPOSITED", "DEPOSIT"],
    ["CLEARED_AWAITING_SQUARE", "CLEAR"],
    ["RETURNED", "RETURN"],
    ["RECONCILED", "RECONCILE"],
  ]) {
    assert.deepEqual(workflow.validateCheckTransition(state, action), { state, idempotent: true });
  }
});

test("rejects skipped, reversed, and terminal-state transitions", () => {
  for (const [state, action] of [
    [null, "DEPOSIT"],
    ["RECEIVED", "CLEAR"],
    ["DEPOSITED", "RECEIVE"],
    ["CLEARED_AWAITING_SQUARE", "DEPOSIT"],
    ["RETURNED", "RECEIVE"],
    ["RECONCILED", "RETURN"],
  ]) {
    assert.throws(() => workflow.validateCheckTransition(state, action), /must be received|cannot move/);
  }
});

test("stores only the final four reference characters", () => {
  assert.equal(workflow.maskCheckReference("  12345678 "), "5678");
  assert.equal(workflow.maskCheckReference("AB-12"), "B-12");
  assert.equal(workflow.maskCheckReference("42"), "42");
  assert.throws(() => workflow.maskCheckReference("1"), /2 to 8/);
  assert.throws(() => workflow.maskCheckReference("123456789"), /2 to 8/);
  assert.throws(() => workflow.maskCheckReference("12 34"), /2 to 8/);
});

test("rejects unknown actions", () => {
  assert.throws(() => workflow.parseCheckAction("PAY"), /invalid/);
  assert.throws(() => workflow.parseCheckAction(undefined), /invalid/);
});

test("reconciles only one exact completed Square external check payment", () => {
  const good = {
    status: "COMPLETED",
    source_type: "EXTERNAL",
    amount_money: { amount: 12500, currency: "USD" },
    external_details: { type: "CHECK" },
  };
  assert.equal(workflow.isMatchingClearedCheckPayment(good, 12500), true);
  assert.equal(workflow.isMatchingClearedCheckPayment({ ...good, source_type: "CARD" }, 12500), false);
  assert.equal(workflow.isMatchingClearedCheckPayment({ ...good, external_details: { type: "OTHER" } }, 12500), false);
  assert.equal(workflow.isMatchingClearedCheckPayment({ ...good, amount_money: { amount: 12499, currency: "USD" } }, 12500), false);
  assert.equal(workflow.isMatchingClearedCheckPayment({ ...good, status: "PENDING" }, 12500), false);
});
