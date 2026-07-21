import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/components/payments/service-acceptance-ui.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const ui = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("presents acknowledgments and issue reports as different outcomes", () => {
  assert.deepEqual(ui.acceptancePresentation("COMPLETED"), {
    label: "Receipt acknowledged",
    description: "The client acknowledged receipt and review. This is evidence only, not proof that payment is final.",
    tone: "success",
  });
  assert.equal(ui.acceptancePresentation("DECLINED").label, "Client issue reported");
  assert.equal(ui.acceptancePresentation("DECLINED").tone, "issue");
});

test("shows only the latest explicit client issue note", () => {
  const base = {
    invoiceId: "invoice-1",
    invoiceNumber: "FTA-2026-001",
    milestoneId: "milestone-1",
    serviceDate: "2026-07-20",
    serviceSummary: "Delivered the final tax advisory memorandum to the secure portal.",
    status: "DECLINED",
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z",
    auditEntries: [
      { action: "CREATE", toStatus: "DELIVERED", at: "2026-07-20T12:00:00.000Z", note: "Delivered by portal" },
      { action: "DECLINE", toStatus: "DECLINED", at: "2026-07-21T12:00:00.000Z", note: " Schedule C is missing. " },
    ],
  };
  assert.equal(ui.latestIssueNote(base), "Schedule C is missing.");
  assert.equal(ui.latestIssueNote({ ...base, status: "COMPLETED" }), undefined);
});

test("matches the API invoice eligibility states", () => {
  for (const status of ["SCHEDULED", "UNPAID", "PARTIALLY_PAID", "PAYMENT_PENDING", "PAID", "OVERDUE"]) {
    assert.equal(ui.canRequestServiceAcceptance(status), true, status);
  }
  assert.equal(ui.canRequestServiceAcceptance("CANCELED"), false);
  assert.equal(ui.canRequestServiceAcceptance("DRAFT"), false);
});

test("gives staff outcome-specific duplicate guidance", () => {
  assert.deepEqual(ui.existingAcceptanceNotice("SENT"), {
    ok: true,
    text: "This exact milestone is already awaiting the client. No duplicate request was sent.",
  });
  assert.match(ui.existingAcceptanceNotice("EXPIRED").text, /no replacement was sent/i);
  assert.equal(ui.existingAcceptanceNotice("EXPIRED").ok, false);
  assert.match(ui.existingAcceptanceNotice("DELIVERED").text, /sending is not confirmed/i);
  assert.match(ui.existingAcceptanceNotice("DECLINED").text, /client-reported issue/i);
});
