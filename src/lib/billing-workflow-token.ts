import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { InvoiceInput } from "@/lib/invoicing";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

export async function createBillingWorkflowToken(input: InvoiceInput) { const payload = deflateRawSync(Buffer.from(JSON.stringify(input))).toString("base64url"); const { BILLING_WORKFLOW_SECRET } = await getRuntimeSecrets(); const signature = createHmac("sha256", BILLING_WORKFLOW_SECRET).update(payload).digest("base64url"); return `${payload}.${signature}`; }
export async function readBillingWorkflowToken(token: string) { const [payload, supplied] = token.split("."); if (!payload || !supplied) throw new Error("Invalid billing workflow token"); const { BILLING_WORKFLOW_SECRET } = await getRuntimeSecrets(); const expected = createHmac("sha256", BILLING_WORKFLOW_SECRET).update(payload).digest("base64url"); const a = Buffer.from(supplied), b = Buffer.from(expected); if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid billing workflow token"); return JSON.parse(inflateRawSync(Buffer.from(payload, "base64url")).toString()) as InvoiceInput; }
