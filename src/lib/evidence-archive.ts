import "server-only";
import { createHash } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type ArchivedEvidence = {
  bucket: string;
  key: string;
  versionId?: string;
  sha256: string;
  size: number;
  contentType: "application/pdf" | "image/heic" | "image/heif" | "image/jpeg" | "image/png" | "image/tiff";
  createdAt: string;
};
export type ArchivedPdfEvidence = ArchivedEvidence & { contentType: "application/pdf" };

let client: S3Client | undefined;
function settings() {
  const bucket = process.env.FORTRESS_BILLING_EVIDENCE_BUCKET;
  const region = process.env.FORTRESS_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!bucket) throw new Error("FORTRESS_BILLING_EVIDENCE_BUCKET is not configured");
  if (!region) throw new Error("FORTRESS_AWS_REGION is not configured");
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error("Evidence bucket is invalid");
  client ||= new S3Client({ region });
  return { bucket, s3: client };
}

export function evidenceSegment(value: string) {
  const result = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
  if (!result) throw new Error("Evidence identifier is invalid");
  return result;
}

const allowedEvidenceTypes = new Set<ArchivedEvidence["contentType"]>([
  "application/pdf", "image/heic", "image/heif", "image/jpeg", "image/png", "image/tiff",
]);

export async function archiveEvidence(key: string, file: Blob, maximum = 25 * 1024 * 1024): Promise<ArchivedEvidence> {
  const { bucket, s3 } = settings();
  const contentType = file.type.toLowerCase() as ArchivedEvidence["contentType"];
  if (key.startsWith("/") || key.includes("..") || !allowedEvidenceTypes.has(contentType)) throw new Error("Evidence key or content type is invalid");
  if (file.size < 5 || file.size > maximum) throw new Error("Evidence file has an invalid size");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (contentType === "application/pdf" && Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") throw new Error("Evidence file is not a PDF");
  const signature = Buffer.from(bytes.subarray(0, 16));
  if (contentType === "image/jpeg" && !(signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff)) throw new Error("Evidence file is not a JPEG");
  if (contentType === "image/png" && !signature.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) throw new Error("Evidence file is not a PNG");
  if (contentType === "image/tiff" && !new Set(["49492a00", "4d4d002a"]).has(signature.subarray(0, 4).toString("hex"))) throw new Error("Evidence file is not a TIFF");
  if ((contentType === "image/heic" || contentType === "image/heif") && signature.subarray(4, 8).toString("ascii") !== "ftyp") throw new Error("Evidence file is not HEIF-compatible");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const createdAt = new Date().toISOString();
  const response = await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: bytes,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
    Metadata: { sha256, created_at: createdAt },
  }));
  return { bucket, key, ...(response.VersionId ? { versionId: response.VersionId } : {}), sha256, size: bytes.byteLength, contentType, createdAt };
}

export async function archivePdf(key: string, pdf: Blob): Promise<ArchivedPdfEvidence> {
  if (!key.endsWith(".pdf") || pdf.type !== "application/pdf") throw new Error("Evidence PDF is invalid");
  return await archiveEvidence(key, pdf) as ArchivedPdfEvidence;
}

export async function readArchivedEvidence(artifact: ArchivedEvidence) {
  const { bucket, s3 } = settings();
  if (artifact.bucket !== bucket) throw new Error("Evidence artifact is outside the configured archive");
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: artifact.key, ...(artifact.versionId ? { VersionId: artifact.versionId } : {}) }));
  if (!response.Body) throw new Error("Archived evidence body is unavailable");
  const bytes = await response.Body.transformToByteArray();
  if (bytes.byteLength !== artifact.size || createHash("sha256").update(bytes).digest("hex") !== artifact.sha256) throw new Error("Archived evidence integrity check failed");
  return bytes;
}

export async function downloadDocuSealPdf(url: string, label: string) {
  const base = process.env.DOCUSEAL_BASE_URL;
  if (!base) throw new Error("DocuSeal is not configured");
  const allowedOrigin = new URL(base).origin;
  let current = new URL(url);
  let response: Response | undefined;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (current.protocol !== "https:" || current.origin !== allowedOrigin) throw new Error(`${label} URL is not from the configured DocuSeal origin`);
    response = await fetch(current, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(30_000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location || redirects === 3) throw new Error(`${label} has an invalid redirect`);
    current = new URL(location, current);
  }
  if (!response?.ok || !response.body) throw new Error(`Could not download ${label}`);
  const maximum = 25 * 1024 * 1024;
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximum) throw new Error(`${label} exceeds the 25 MB limit`);
  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximum) { await reader.cancel(); throw new Error(`${label} exceeds the 25 MB limit`); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  if (bytes.byteLength < 5 || Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") throw new Error(`${label} is not a PDF`);
  return new Blob([bytes], { type: "application/pdf" });
}
