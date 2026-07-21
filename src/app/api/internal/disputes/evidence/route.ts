import { archiveEvidence, evidenceSegment, readArchivedEvidence } from "@/lib/evidence-archive";
import { getDisputeCase, updateDisputeCase, DisputeCaseConflictError } from "@/lib/dispute-case-store";

class RequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
function sameOrigin(request: Request) {
  const base = process.env.PAYMENT_BASE_URL;
  return Boolean(base && request.headers.get("origin") === new URL(base).origin);
}
const mimeExtension: Record<string, string> = { "application/pdf": "pdf", "image/heic": "heic", "image/heif": "heif", "image/jpeg": "jpg", "image/png": "png", "image/tiff": "tiff" };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const disputeId = url.searchParams.get("disputeId")?.trim() || "";
    const itemId = url.searchParams.get("itemId")?.trim() || "";
    if (!disputeId || disputeId.length > 191 || !itemId || itemId.length > 64) throw new RequestError("Evidence request is invalid", 400);
    const record = await getDisputeCase(disputeId);
    const item = record?.checklist.find((candidate) => candidate.id === itemId);
    if (!record || !item?.artifact) throw new RequestError("Evidence file was not found", 404);
    const bytes = await readArchivedEvidence(item.artifact);
    const extension = mimeExtension[item.artifact.contentType] || "bin";
    return new Response(Buffer.from(bytes), { headers: { "Content-Type": item.artifact.contentType, "Content-Disposition": `attachment; filename="${evidenceSegment(item.id)}.${extension}"`, "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
  } catch (cause) {
    const status = cause instanceof RequestError ? cause.status : 500;
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not download evidence" }, { status });
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new RequestError("Invalid request origin", 403);
    const declared = Number(request.headers.get("content-length"));
    if (!Number.isFinite(declared) || declared <= 0) throw new RequestError("Evidence upload length is required", 411);
    if (declared > 5.5 * 1024 * 1024) throw new RequestError("Evidence upload exceeds the 5 MB Square limit", 413);
    const form = await request.formData();
    const disputeId = String(form.get("disputeId") || "").trim();
    const itemId = String(form.get("itemId") || "").trim();
    const note = String(form.get("note") || "").trim();
    const version = Number(form.get("version"));
    const confirmed = form.get("confirmed") === "yes";
    const file = form.get("file");
    if (!disputeId || disputeId.length > 191 || !itemId || itemId.length > 64 || !Number.isSafeInteger(version) || !confirmed || !(file instanceof File)) throw new RequestError("Complete and confirm the evidence upload", 422);
    if (!mimeExtension[file.type] || file.size < 5 || file.size > 5 * 1024 * 1024) throw new RequestError("Use a PDF, JPEG, PNG, TIFF, HEIC, or HEIF file no larger than 5 MB", 422);
    const current = await getDisputeCase(disputeId);
    if (!current) throw new RequestError("Dispute case was not found", 404);
    if (current.version !== version) throw new RequestError("This case changed; reload it before uploading", 409);
    if (["SUBMITTED", "PROCESSING", "WON", "LOST", "ACCEPTED", "CLOSED"].includes(current.localState)) throw new RequestError("Evidence is locked after submission", 409);
    const item = current.checklist.find((candidate) => candidate.id === itemId);
    if (!item) throw new RequestError("Checklist item was not found", 404);
    const extension = mimeExtension[file.type];
    const key = `disputes/${evidenceSegment(disputeId)}/${evidenceSegment(itemId)}.${extension}`;
    const archived = await archiveEvidence(key, file, 5 * 1024 * 1024);
    const checklist = current.checklist.map((candidate) => candidate.id === itemId ? { ...candidate, status: "READY" as const, artifact: archived, note: note || undefined } : candidate);
    const actor = request.headers.get("x-fortress-actor") || "authenticated-billing-operator";
    const updated = await updateDisputeCase(current, { checklist, review: null, actor, action: "UPLOAD_EVIDENCE", note: `${item.label} archived with SHA-256 integrity metadata.` });
    return Response.json({ case: updated });
  } catch (cause) {
    const status = cause instanceof RequestError ? cause.status : cause instanceof DisputeCaseConflictError ? 409 : 500;
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not upload evidence" }, { status });
  }
}
