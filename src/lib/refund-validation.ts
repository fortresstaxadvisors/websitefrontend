import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type RefundPreviewPayload = {
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  amount: number;
  currency: string;
  version: string;
  expiresAt: number;
};

export function validateRefundInput(input: { invoiceId: string; reason: string; reference: string }) {
  const reason = input.reason.trim();
  const reference = input.reference.trim();
  if (!input.invoiceId || input.invoiceId.length > 128) throw new Error("Invoice ID is invalid");
  if (reason.length < 5 || reason.length > 140) throw new Error("Refund reason must be 5–140 characters");
  if (!/^[A-Za-z0-9._-]{4,64}$/.test(reference)) throw new Error("Refund reference must be 4–64 letters, numbers, dots, underscores, or dashes");
  return {
    reason,
    reference,
    idempotencyKey: createHash("sha256")
      .update(`fortress-refund:${input.invoiceId}:${reference.toLowerCase()}`)
      .digest("hex")
      .slice(0, 45),
  };
}

export function createRefundPreviewToken(payload: RefundPreviewPayload, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyRefundPreviewToken(token: string, secret: string, now = Date.now()): RefundPreviewPayload {
  const [encoded, supplied, extra] = token.split(".");
  if (!encoded || !supplied || extra) throw new Error("Refund preview is invalid; prepare it again");
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Refund preview is invalid; prepare it again");
  let payload: RefundPreviewPayload;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); }
  catch { throw new Error("Refund preview is invalid; prepare it again"); }
  if (
    !payload || typeof payload !== "object"
    || typeof payload.invoiceId !== "string" || !payload.invoiceId
    || typeof payload.invoiceNumber !== "string" || !payload.invoiceNumber
    || typeof payload.paymentId !== "string" || !payload.paymentId
    || !Number.isSafeInteger(payload.amount) || payload.amount <= 0
    || typeof payload.currency !== "string" || !payload.currency
    || typeof payload.version !== "string" || !payload.version
    || !Number.isSafeInteger(payload.expiresAt) || payload.expiresAt < now
  ) throw new Error("Refund preview expired or is invalid; prepare it again");
  return payload;
}
