import { readWebhookBody, WebhookBodyTooLargeError } from "@/lib/webhook-body";
import {
  getDisputeCase,
  listDisputeCases,
  updateDisputeCase,
  DisputeCaseConflictError,
  type DisputeCaseState,
} from "@/lib/dispute-case-store";
import { disputeManifestHash, syncSquareDispute } from "@/lib/dispute-case-service";
import { squareFetch } from "@/lib/square";

class RequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
function sameOrigin(request: Request) {
  const base = process.env.PAYMENT_BASE_URL;
  return Boolean(base && request.headers.get("origin") === new URL(base).origin);
}
const clean = (value: unknown, label: string, maximum = 191) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum || /[\r\n\0]/.test(value)) throw new RequestError(`${label} is invalid`, 422);
  return value.trim();
};

export async function GET() {
  try {
    return Response.json({ cases: await listDisputeCases() }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (cause) {
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not load dispute cases" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new RequestError("Invalid request origin", 403);
    let raw: string;
    try { raw = await readWebhookBody(request, 32_768); }
    catch (cause) { if (cause instanceof WebhookBodyTooLargeError) throw new RequestError("Request body is too large", 413); throw cause; }
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { throw new RequestError("Request body must be valid JSON", 400); }
    const disputeId = clean(body.disputeId, "Dispute ID");
    const action = clean(body.action, "Action", 64);
    const actor = request.headers.get("x-fortress-actor") || "authenticated-billing-operator";
    if (action === "sync") {
      if (body.confirmed !== true) throw new RequestError("Confirm the authoritative Square sync", 422);
      return Response.json({ case: await syncSquareDispute(disputeId, actor) });
    }
    const expectedVersion = Number(body.version);
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) throw new RequestError("Case version is invalid", 409);
    let current = await getDisputeCase(disputeId);
    if (!current) throw new RequestError("Dispute case was not found", 404);
    if (current.version !== expectedVersion) throw new RequestError("This case changed; reload it before saving", 409);

    if (action === "assign") {
      if (!["NEW", "PREPARING"].includes(current.localState) || current.review || current.submission) throw new RequestError("Assignment is locked after evidence review begins", 409);
      const owner = clean(body.ownerUserId, "Owner");
      const backup = clean(body.backupOwnerUserId, "Backup owner");
      if (owner.toLowerCase() === backup.toLowerCase()) throw new RequestError("Owner and backup owner must differ", 422);
      const summary = clean(body.summary, "Case summary", 2_000);
      if (summary.length < 20) throw new RequestError("Case summary must be at least 20 characters", 422);
      const internalDueAt = clean(body.internalDueAt, "Internal deadline");
      current = await updateDisputeCase(current, { localState: current.localState === "NEW" ? "PREPARING" : current.localState, ownerUserId: owner, backupOwnerUserId: backup, summary, internalDueAt, actor, action: "ASSIGN", note: "Owner, backup owner, and internal response deadline confirmed." });
    } else if (action === "exclude") {
      if (!["NEW", "PREPARING", "READY_FOR_REVIEW"].includes(current.localState) || current.submission) throw new RequestError("Evidence is locked after submission", 409);
      const itemId = clean(body.itemId, "Checklist item", 64);
      const note = clean(body.note, "Exclusion reason", 500);
      const item = current.checklist.find((candidate) => candidate.id === itemId);
      if (!item) throw new RequestError("Checklist item was not found", 404);
      if (item.required) throw new RequestError("Required evidence cannot be excluded; upload a usable file", 409);
      const checklist = current.checklist.map((candidate) => candidate.id === itemId ? { ...candidate, status: "EXCLUDED" as const, artifact: undefined, note } : candidate);
      current = await updateDisputeCase(current, { checklist, review: null, actor, action: "EXCLUDE_EVIDENCE", note: `${item.label}: ${note}` });
    } else if (action === "ready") {
      if (!(["PREPARING", "READY_FOR_REVIEW"].includes(current.localState)) || current.submission) throw new RequestError("Case is not eligible for evidence review", 409);
      if (body.confirmed !== true) throw new RequestError("Confirm that the evidence set was reviewed", 422);
      const manifestHash = disputeManifestHash(current.checklist);
      current = await updateDisputeCase(current, { localState: "READY_FOR_REVIEW", review: { reviewedBy: actor, reviewedAt: new Date().toISOString(), manifestHash }, actor, action: "REVIEW", note: "Evidence manifest reviewed and locked for submission." });
    } else if (action === "record_submission") {
      if (current.localState !== "READY_FOR_REVIEW" || current.submission) throw new RequestError("Case is not awaiting Square submission", 409);
      if (body.confirmed !== true) throw new RequestError("Confirm the evidence was submitted in Square", 422);
      if (body.attestedExactFiles !== true) throw new RequestError("Attest that the reviewed files were the files submitted in Square", 422);
      if (!current.review) throw new RequestError("Review the evidence manifest before recording submission", 409);
      const [{ evidence = [] }, { dispute }] = await Promise.all([
        squareFetch<{ evidence?: Array<{ evidence_id?: string; id?: string }> }>(`/v2/disputes/${encodeURIComponent(disputeId)}/evidence`),
        squareFetch<{ dispute: { state?: string } }>(`/v2/disputes/${encodeURIComponent(disputeId)}`),
      ]);
      const evidenceIds = evidence.map((item) => item.evidence_id || item.id).filter((id): id is string => Boolean(id));
      if (!evidenceIds.length) throw new RequestError("Square does not show submitted evidence for this dispute", 409);
      const squareState = dispute.state || "UNKNOWN";
      if (!["PROCESSING", "INQUIRY_PROCESSING", "WON", "LOST", "ACCEPTED"].includes(squareState)) throw new RequestError("Square does not show that the evidence response was submitted", 409);
      const manifestHash = disputeManifestHash(current.checklist);
      if (manifestHash !== current.review.manifestHash) throw new RequestError("Evidence changed after review; review the current manifest again", 409);
      current = await updateDisputeCase(current, { localState: "SUBMITTED", squareState, squareSyncedAt: new Date().toISOString(), submission: { submittedBy: actor, submittedAt: new Date().toISOString(), squareEvidenceIds: evidenceIds, manifestHash }, actor, action: "RECORD_SUBMISSION", note: `Staff attested the reviewed files were submitted; Square reports ${evidenceIds.length} evidence record(s) and state ${squareState}.` });
    } else if (action === "close") {
      if (body.confirmed !== true) throw new RequestError("Confirm that this case should be closed", 422);
      const allowed = new Set<DisputeCaseState>(["WON", "LOST", "ACCEPTED"]);
      if (!allowed.has(current.localState)) throw new RequestError("Record the final outcome before closing the case", 409);
      current = await updateDisputeCase(current, { localState: "CLOSED", actor, action: "CLOSE", note: clean(body.note, "Closure note", 500) });
    } else {
      throw new RequestError("Unsupported dispute action", 422);
    }
    return Response.json({ case: current });
  } catch (cause) {
    const status = cause instanceof RequestError ? cause.status : cause instanceof DisputeCaseConflictError ? 409 : 500;
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not update dispute case" }, { status });
  }
}
