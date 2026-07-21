import "server-only";
import { squareFetch, squareLocationId } from "@/lib/square";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";
import { createRefundPreviewToken, validateRefundInput, verifyRefundPreviewToken } from "@/lib/refund-validation";

type Money = { amount?: number; currency?: string };

type Invoice = {
  id: string;
  invoice_number?: string;
  order_id?: string;
  status?: string;
  total_completed_amount_money?: Money;
  next_payment_amount_money?: Money;
};

type Tender = { id?: string; payment_id?: string; type?: string };
type Payment = {
  id: string;
  order_id?: string;
  status?: string;
  source_type?: string;
  amount_money?: Money;
  refunded_money?: Money;
  refund_ids?: string[];
  created_at?: string;
  updated_at?: string;
  version_token?: string;
};

export type RefundSummary = {
  id: string;
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  reason: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getInvoice(invoiceId: string) {
  if (!invoiceId || invoiceId.length > 128) throw new Error("Invoice ID is invalid");
  const data = await squareFetch<{ invoice: Invoice }>(`/v2/invoices/${encodeURIComponent(invoiceId)}`);
  return data.invoice;
}

export async function getSingleCompletedInvoicePayment(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice.order_id) throw new Error("Square invoice has no order");
  const orderData = await squareFetch<{ order: { tenders?: Tender[] } }>(`/v2/orders/${encodeURIComponent(invoice.order_id)}`);
  const tenderIds = (orderData.order.tenders || [])
    .map((tender) => tender.payment_id || tender.id)
    .filter((id): id is string => Boolean(id));
  const payments = await Promise.all(tenderIds.map(async (id) => {
    const data = await squareFetch<{ payment: Payment }>(`/v2/payments/${encodeURIComponent(id)}`);
    return data.payment;
  }));
  const completed = payments.filter((payment) => payment.status === "COMPLETED");
  if (completed.length !== 1) throw new Error("A full refund requires exactly one completed Square payment");
  return { invoice, payment: completed[0] };
}

export async function issueFullInvoiceRefund(input: {
  invoiceId: string;
  invoiceNumber: string;
  reason: string;
  reference: string;
  previewToken: string;
}) {
  if (process.env.FORTRESS_REFUNDS_ENABLED !== "true") throw new Error("Refund actions are disabled");
  const { reason, reference, idempotencyKey } = validateRefundInput(input);
  const { BILLING_WORKFLOW_SECRET } = await getRuntimeSecrets();
  const preview = verifyRefundPreviewToken(input.previewToken, BILLING_WORKFLOW_SECRET);
  if (preview.invoiceId !== input.invoiceId || preview.invoiceNumber !== input.invoiceNumber) {
    throw new Error("Refund preview does not match this invoice; prepare it again");
  }
  const { invoice, payment } = await getSingleCompletedInvoicePayment(input.invoiceId);
  if (invoice.invoice_number !== input.invoiceNumber) throw new Error("Invoice confirmation does not match Square");
  if (payment.source_type !== "CARD") throw new Error("Automated refunds are restricted to completed card payments");
  const existingRefunds = await Promise.all((payment.refund_ids || []).map(async (id) => {
    const data = await squareFetch<{ refund: {
      id: string; payment_id: string; status?: string; amount_money?: Money; reason?: string;
      created_at?: string; updated_at?: string;
    } }>(`/v2/refunds/${encodeURIComponent(id)}`);
    return data.refund;
  }));
  const existing = existingRefunds.find((refund) => refund.reason?.startsWith(`${input.invoiceNumber} [${reference}]`));
  if (existing && preview.paymentId === payment.id) return summarizeRefund(existing);
  const disputeResult = await allSquarePages<{
    disputed_payment?: { payment_id?: string };
  }>(`/v2/disputes?location_id=${encodeURIComponent(squareLocationId())}&states=INQUIRY_EVIDENCE_REQUIRED&states=INQUIRY_PROCESSING&states=EVIDENCE_REQUIRED&states=PROCESSING`, "disputes", 5000);
  if (disputeResult.truncated) throw new Error("Square dispute review was truncated; refund manually after reviewing disputes");
  if (disputeResult.items.some((dispute) => dispute.disputed_payment?.payment_id === payment.id)) {
    throw new Error("This payment has a Square dispute and cannot be automatically refunded; review the dispute first");
  }
  if (invoice.status !== "PAID") throw new Error("Square invoice is not eligible for an automated refund");
  const paid = payment.amount_money?.amount || 0;
  const refunded = payment.refunded_money?.amount || 0;
  const refundable = paid - refunded;
  if (!Number.isSafeInteger(refundable) || refundable <= 0) throw new Error("This payment has no refundable balance");
  const currency = payment.amount_money?.currency || "USD";
  const version = payment.version_token || "";
  if (!version) throw new Error("Square payment version is unavailable; refund manually in Square");
  if (
    preview.paymentId !== payment.id
    || preview.amount !== refundable
    || preview.currency !== currency
    || preview.version !== version
  ) throw new Error("Square payment changed after preview; prepare the refund again");
  const description = `${input.invoiceNumber} [${reference}]: ${reason}`.slice(0, 192);
  const data = await squareFetch<{ refund: {
    id: string;
    payment_id: string;
    status?: string;
    amount_money?: Money;
    reason?: string;
    created_at?: string;
    updated_at?: string;
  } }>("/v2/refunds", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      payment_id: payment.id,
      payment_version_token: version,
      amount_money: { amount: refundable, currency },
      reason: description,
    }),
  });
  return summarizeRefund(data.refund);
}

async function allSquarePages<T>(path: string, key: "refunds" | "disputes" | "payments", maximum = 500) {
  const items: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const separator = path.includes("?") ? "&" : "?";
    const data = await squareFetch<Record<string, unknown> & { cursor?: string }>(`${path}${cursor ? `${separator}cursor=${encodeURIComponent(cursor)}` : ""}`);
    const page = data[key];
    if (Array.isArray(page)) items.push(...page as T[]);
    const nextCursor = data.cursor;
    if (nextCursor && seenCursors.has(nextCursor)) throw new Error(`Square returned a repeated ${key} cursor`);
    if (nextCursor) seenCursors.add(nextCursor);
    cursor = nextCursor;
  } while (cursor && items.length < maximum);
  return { items, truncated: Boolean(cursor) };
}

export async function previewFullInvoiceRefund(input: { invoiceId: string; invoiceNumber: string }) {
  const { invoice, payment } = await getSingleCompletedInvoicePayment(input.invoiceId);
  if (invoice.invoice_number !== input.invoiceNumber) throw new Error("Invoice confirmation does not match Square");
  if (invoice.status !== "PAID") throw new Error("Square invoice is not eligible for an automated refund");
  if (payment.source_type !== "CARD") throw new Error("Automated refunds are restricted to completed card payments");
  const paid = payment.amount_money?.amount || 0;
  const refunded = payment.refunded_money?.amount || 0;
  const amount = paid - refunded;
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("This payment has no refundable balance");
  const currency = payment.amount_money?.currency || "USD";
  const version = payment.version_token || "";
  if (!version) throw new Error("Square payment version is unavailable; refund manually in Square");
  const { BILLING_WORKFLOW_SECRET } = await getRuntimeSecrets();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  return {
    amount,
    currency,
    paymentId: payment.id,
    expiresAt,
    token: createRefundPreviewToken({
      invoiceId: input.invoiceId,
      invoiceNumber: input.invoiceNumber,
      paymentId: payment.id,
      amount,
      currency,
      version,
      expiresAt,
    }, BILLING_WORKFLOW_SECRET),
  };
}

function summarizeRefund(refund: {
  id: string;
  payment_id: string;
  status?: string;
  amount_money?: Money;
  reason?: string;
  created_at?: string;
  updated_at?: string;
}): RefundSummary {
  return {
    id: refund.id,
    paymentId: refund.payment_id,
    status: refund.status || "UNKNOWN",
    amount: refund.amount_money?.amount || 0,
    currency: refund.amount_money?.currency || "USD",
    reason: refund.reason || "",
    createdAt: refund.created_at,
    updatedAt: refund.updated_at,
  };
}

export async function listPaymentOperations() {
  const locationId = squareLocationId();
  type Refund = {
      id: string; payment_id: string; status?: string; amount_money?: Money;
      reason?: string; created_at?: string; updated_at?: string;
  };
  type Dispute = {
      dispute_id?: string; id?: string; state?: string; reason?: string;
      amount_money?: Money; disputed_payment?: { payment_id?: string }; due_at?: string; created_at?: string; updated_at?: string;
  };
  const results = await Promise.allSettled([
    allSquarePages<Refund>(`/v2/refunds?location_id=${encodeURIComponent(locationId)}&limit=100&sort_order=DESC`, "refunds"),
    allSquarePages<Dispute>(`/v2/disputes?location_id=${encodeURIComponent(locationId)}`, "disputes"),
    allSquarePages<Payment>(`/v2/payments?location_id=${encodeURIComponent(locationId)}&limit=100&sort_order=DESC`, "payments"),
  ]);
  const [refundResult, disputeResult, paymentResult] = results;
  const warnings = results.flatMap((result, index) => result.status === "rejected"
    ? [`${["Refunds", "Disputes", "Payments"][index]} could not be loaded: ${result.reason instanceof Error ? result.reason.message : "unknown error"}`]
    : []);
  const refunds = refundResult.status === "fulfilled" ? refundResult.value.items : [];
  const disputes = disputeResult.status === "fulfilled" ? disputeResult.value.items : [];
  const payments = paymentResult.status === "fulfilled" ? paymentResult.value.items : [];
  if (refundResult.status === "fulfilled" && refundResult.value.truncated) warnings.push("Refund history is truncated at 500 records");
  if (disputeResult.status === "fulfilled" && disputeResult.value.truncated) warnings.push("Dispute history is truncated at 500 records");
  if (paymentResult.status === "fulfilled" && paymentResult.value.truncated) warnings.push("Payment history is truncated at 500 records");
  return {
    warnings,
    refunds: refunds.map(summarizeRefund),
    disputes: disputes.map((dispute) => ({
      id: dispute.dispute_id || dispute.id || "unknown",
      paymentId: dispute.disputed_payment?.payment_id || "",
      state: dispute.state || "UNKNOWN",
      reason: dispute.reason || "UNKNOWN",
      amount: dispute.amount_money?.amount || 0,
      currency: dispute.amount_money?.currency || "USD",
      dueAt: dispute.due_at,
      createdAt: dispute.created_at,
      updatedAt: dispute.updated_at,
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      orderId: payment.order_id || "",
      status: payment.status || "UNKNOWN",
      sourceType: payment.source_type || "UNKNOWN",
      amount: payment.amount_money?.amount || 0,
      currency: payment.amount_money?.currency || "USD",
      refundedAmount: payment.refunded_money?.amount || 0,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    })),
  };
}
