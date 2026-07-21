import "server-only";
import { createHash } from "node:crypto";
import { squareFetch } from "@/lib/square";
import { findBillingEvidenceByOrderId, type BillingEvidenceIndex } from "@/lib/evidence-index-store";
import { listServiceAcceptances } from "@/lib/service-acceptance-store";
import {
  createDisputeCase,
  getDisputeCase,
  updateDisputeCase,
  DisputeCaseConflictError,
  type DisputeArtifactMetadata,
  type DisputeChecklistItem,
} from "@/lib/dispute-case-store";
import type { ArchivedEvidence } from "@/lib/evidence-archive";

type SquareDispute = {
  dispute_id?: string;
  id?: string;
  state?: string;
  reason?: string;
  amount_money?: { amount?: number; currency?: string };
  disputed_payment?: { payment_id?: string };
  due_at?: string;
};
type SquarePayment = { id?: string; order_id?: string; customer_id?: string };

function artifact(value: ArchivedEvidence | undefined): DisputeArtifactMetadata | undefined {
  if (!value || value.size > 5 * 1024 * 1024) return undefined;
  return value;
}

function archivedItem(id: string, label: string, evidenceType: string, value: ArchivedEvidence | undefined, required: boolean): DisputeChecklistItem {
  const usable = artifact(value);
  return {
    id,
    label,
    evidenceType,
    required,
    status: usable ? "READY" : "MISSING",
    ...(usable ? { artifact: usable } : {}),
    ...(!usable && value ? { note: "Archived file exceeds Square's 5 MB per-file evidence limit; prepare a smaller copy." } : {}),
  };
}

async function initialChecklist(index: BillingEvidenceIndex | null): Promise<DisputeChecklistItem[]> {
  const completed = index
    ? (await listServiceAcceptances(index.squareInvoiceId)).find((item) => item.status === "COMPLETED" && item.acceptanceArtifact)
    : undefined;
  return [
    archivedItem("signed-agreement", "Signed engagement agreement", "SIGNED_AGREEMENT", index?.agreementArtifact, true),
    archivedItem("signature-audit", "Electronic signature audit record", "SIGNATURE_HISTORY", index?.auditArtifact, true),
    archivedItem("service-acceptance", "Signed service or milestone acknowledgment", "PROOF_OF_DELIVERY", completed?.acceptanceArtifact, false),
    { id: "itemized-invoice", label: "Itemized Square invoice or receipt", evidenceType: "RECEIPT", required: true, status: "MISSING" },
    { id: "client-communications", label: "Relevant client communications", evidenceType: "COMMUNICATION", required: false, status: "MISSING" },
    { id: "service-workpapers", label: "Non-confidential proof the contracted work was delivered", evidenceType: "PROOF_OF_SERVICE", required: false, status: "MISSING", note: "Exclude tax returns, SSNs, bank data, and unrelated client-confidential workpapers." },
  ];
}

function internalDeadline(squareDueAt: string | undefined, now = Date.now()) {
  const fallback = new Date(now + 5 * 86_400_000).toISOString();
  if (!squareDueAt || Number.isNaN(Date.parse(squareDueAt))) return fallback;
  const due = Date.parse(squareDueAt);
  // A late webhook still needs a durable, visibly overdue case and alert. The
  // internal deadline therefore remains at the already-passed Square deadline
  // instead of inventing a later time that violates the case invariant.
  return new Date(due <= now ? due : Math.max(now, due - 48 * 3_600_000)).toISOString();
}

export function disputeManifestHash(checklist: DisputeChecklistItem[]) {
  const manifest = checklist
    .filter((item) => item.status === "READY" && item.artifact)
    .map((item) => ({ id: item.id, evidenceType: item.evidenceType, sha256: item.artifact!.sha256, size: item.artifact!.size }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
}

export async function syncSquareDispute(disputeId: string, actor: string) {
  const cleanedId = disputeId.trim();
  if (!cleanedId || cleanedId.length > 191) throw new Error("Square dispute ID is invalid");
  const { dispute } = await squareFetch<{ dispute: SquareDispute }>(`/v2/disputes/${encodeURIComponent(cleanedId)}`);
  const id = dispute.dispute_id || dispute.id;
  const paymentId = dispute.disputed_payment?.payment_id;
  const amount = dispute.amount_money?.amount;
  const currency = dispute.amount_money?.currency || "USD";
  if (id !== cleanedId || !paymentId || !Number.isSafeInteger(amount) || Number(amount) <= 0) throw new Error("Square returned an incomplete dispute");
  const { payment } = await squareFetch<{ payment: SquarePayment }>(`/v2/payments/${encodeURIComponent(paymentId)}`);
  if (payment.id !== paymentId) throw new Error("Square returned a mismatched disputed payment");
  const index = payment.order_id ? await findBillingEvidenceByOrderId(payment.order_id) : null;
  const squareState = dispute.state || "UNKNOWN";
  const existing = await getDisputeCase(id);
  if (existing) {
    const terminal: Record<string, "WON" | "LOST" | "ACCEPTED" | "CLOSED"> = { WON: "WON", LOST: "LOST", ACCEPTED: "ACCEPTED", INQUIRY_CLOSED: "CLOSED" };
    const canRecordTerminal = existing.localState !== "CLOSED" && Boolean(terminal[squareState]);
    const canRecordProcessing = ["READY_FOR_REVIEW", "SUBMITTED"].includes(existing.localState) && ["PROCESSING", "INQUIRY_PROCESSING"].includes(squareState);
    const nextState = canRecordTerminal ? terminal[squareState] : canRecordProcessing ? "PROCESSING" as const : existing.localState;
    if (existing.squareState === squareState && nextState === existing.localState) return existing;
    return await updateDisputeCase(existing, {
      squareState,
      localState: nextState,
      actor,
      action: "SQUARE_SYNC",
      note: nextState === existing.localState ? `Square state updated to ${squareState}` : `Verified Square state ${squareState} and advanced the local case to ${nextState}.`,
      squareSyncedAt: new Date().toISOString(),
    });
  }
  const reason = dispute.reason || "UNKNOWN";
  const summary = `Square ${reason.replaceAll("_", " ").toLowerCase()} dispute for payment ${paymentId}. Review the signed scope, delivery evidence, payer identity, invoice, receipt, and communications before deciding whether to challenge or accept.`;
  try {
    const created = await createDisputeCase({
      disputeId: id,
      squareState,
      reason,
      paymentId,
      ...(payment.order_id ? { orderId: payment.order_id } : {}),
      ...(index ? { invoiceId: index.squareInvoiceId, invoiceNumber: index.invoiceNumber, customerId: index.squareCustomerId } : payment.customer_id ? { customerId: payment.customer_id } : {}),
      amount: Number(amount),
      currency,
      ...(dispute.due_at ? { squareDueAt: dispute.due_at } : {}),
      internalDueAt: internalDeadline(dispute.due_at),
      summary,
      checklist: await initialChecklist(index),
      actor,
      note: index ? "Created from a verified Square dispute and linked billing evidence." : "Created from a verified Square dispute; billing evidence linkage requires staff review.",
    });
    const discoveredOutcome: Record<string, "WON" | "LOST" | "ACCEPTED" | "CLOSED"> = { WON: "WON", LOST: "LOST", ACCEPTED: "ACCEPTED", INQUIRY_CLOSED: "CLOSED" };
    const outcome = discoveredOutcome[squareState];
    return outcome ? await updateDisputeCase(created, { localState: outcome, actor, action: "SQUARE_SYNC", note: `Case was first discovered after Square reached ${squareState}.`, squareSyncedAt: new Date().toISOString() }) : created;
  } catch (cause) {
    if (!(cause instanceof DisputeCaseConflictError)) throw cause;
    const raced = await getDisputeCase(id);
    if (!raced) throw cause;
    return raced;
  }
}
