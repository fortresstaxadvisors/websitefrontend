import {
  BillingOperationConflictError,
  getCheckRecord,
  putCheckRecord,
  type BillingCheckRecord,
  type CheckAuditEntry,
} from "@/lib/billing-operations-store";
import {
  CheckTransitionError,
  maskCheckReference,
  isMatchingClearedCheckPayment,
  parseCheckAction,
  targetStateForAction,
  validateCheckTransition,
  type CheckAction,
} from "@/lib/check-workflow";
import { squareFetch } from "@/lib/square";
import { readWebhookBody, WebhookBodyTooLargeError } from "@/lib/webhook-body";

type SquareMoney = { amount?: number; currency?: string };
type SquareInvoice = {
  id?: string;
  invoice_number?: string;
  order_id?: string;
  status?: string;
  next_payment_amount_money?: SquareMoney;
};
type SquareTender = { id?: string; payment_id?: string };
type SquareOrder = { id?: string; state?: string; total_money?: SquareMoney; tenders?: SquareTender[] };
type SquarePayment = {
  id?: string;
  status?: string;
  source_type?: string;
  amount_money?: SquareMoney;
  external_details?: { type?: string };
};

class RequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "RequestError";
  }
}

const OPEN_INVOICE_STATES = new Set(["SCHEDULED", "UNPAID", "PARTIALLY_PAID", "OVERDUE"]);

function cleanIdentifier(value: unknown, label: string, maxLength = 255) {
  if (typeof value !== "string") throw new RequestError(`${label} is required`, 400);
  const result = value.trim();
  if (!result || result.length > maxLength || /[\r\n\0]/.test(result)) {
    throw new RequestError(`${label} is invalid`, 400);
  }
  return result;
}

function cleanNote(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new RequestError("Note is invalid", 400);
  const result = value.trim();
  if (result.length > 500 || /[\0]/.test(result)) throw new RequestError("Note must be 500 characters or fewer", 400);
  return result || undefined;
}

function checkAmount(value: unknown, outstanding: number) {
  if (!Number.isSafeInteger(value) || Number(value) <= 0 || Number(value) > outstanding) {
    throw new RequestError("Check amount must be a positive amount no greater than Square's current balance due", 422);
  }
  return Number(value);
}

function response(record: BillingCheckRecord | null, status = 200, message?: string) {
  return Response.json({ check: record ? {
    itemType: record.itemType,
    invoiceId: record.invoiceId,
    invoiceNumber: record.invoiceNumber,
    amount: record.amount,
    maskedReference: record.maskedReference,
    squarePaymentId: record.squarePaymentId,
    state: record.state,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    auditEntries: record.auditEntries,
  } : null, ...(message ? { message } : {}) }, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

function transitionMessage(action: CheckAction) {
  return {
    RECEIVE: "Check receipt recorded. The invoice is still unpaid.",
    DEPOSIT: "Bank deposit recorded. The invoice remains unpaid until the check clears and Square is reconciled.",
    CLEAR: "Bank clearance recorded. Record the external check payment in Square, then reconcile it here.",
    RETURN: "Check return recorded. Do not treat this amount as settled; correct Square if it was already reconciled.",
    RECONCILE: "The exact completed Square check payment was verified and reconciled.",
  }[action];
}

async function authoritativeInvoice(invoiceId: string) {
  const invoiceData = await squareFetch<{ invoice: SquareInvoice }>(`/v2/invoices/${encodeURIComponent(invoiceId)}`);
  const invoice = invoiceData.invoice;
  if (!invoice?.id || invoice.id !== invoiceId || !invoice.order_id) {
    throw new RequestError("Square returned an invalid invoice record", 502);
  }
  const orderData = await squareFetch<{ order: SquareOrder }>(`/v2/orders/${encodeURIComponent(invoice.order_id)}`);
  if (!orderData.order?.id || orderData.order.id !== invoice.order_id) {
    throw new RequestError("Square returned an invalid invoice order", 502);
  }
  return { invoice, order: orderData.order };
}

function requireExactInvoiceNumber(invoice: SquareInvoice, expected: string) {
  if (invoice.invoice_number !== expected) {
    throw new RequestError("Invoice number does not match the authoritative Square invoice", 409);
  }
}

function requireOpenInvoice(invoice: SquareInvoice, order: SquareOrder) {
  if (!invoice.status || !OPEN_INVOICE_STATES.has(invoice.status) || order.state !== "OPEN") {
    throw new RequestError("Check action requires an open Square invoice", 409);
  }
}

function outstandingAmount(invoice: SquareInvoice) {
  const money = invoice.next_payment_amount_money;
  if (money?.currency !== "USD" || !Number.isSafeInteger(money.amount) || money.amount! <= 0) {
    throw new RequestError("Square invoice has no valid USD amount currently due", 409);
  }
  return money.amount!;
}

function validateAuthoritativeState(
  action: CheckAction,
  invoice: SquareInvoice,
  order: SquareOrder,
  existing: BillingCheckRecord | null,
) {
  if (action === "RECONCILE") {
    if (!invoice.status || !new Set(["PAID", "PARTIALLY_PAID"]).has(invoice.status)) {
      throw new RequestError("Square must report the check payment on the invoice before reconciliation", 409);
    }
    return;
  }
  if (action === "RETURN") return;
  requireOpenInvoice(invoice, order);
  const outstanding = outstandingAmount(invoice);
  if (existing && action !== "RECEIVE" && outstanding < existing.amount) {
    throw new RequestError("Square's current outstanding amount is less than the recorded check", 409);
  }
}

async function requireMatchingClearedCheck(order: SquareOrder, existing: BillingCheckRecord | null, squarePaymentId: string) {
  if (!existing) throw new RequestError("The stored check record is unavailable", 409);
  const tenderIds = (order.tenders || [])
    .map((tender) => tender.payment_id || tender.id)
    .filter((id): id is string => Boolean(id));
  if (!tenderIds.includes(squarePaymentId)) {
    throw new RequestError("The supplied Square payment does not belong to this invoice", 409);
  }
  const data = await squareFetch<{ payment: SquarePayment }>(`/v2/payments/${encodeURIComponent(squarePaymentId)}`);
  if (data.payment?.id !== squarePaymentId || !isMatchingClearedCheckPayment(data.payment, existing.amount)) {
    throw new RequestError(
      "The supplied Square payment is not a completed external check payment for the recorded amount",
      409,
    );
  }
}

export async function GET(request: Request) {
  try {
    const invoiceId = cleanIdentifier(new URL(request.url).searchParams.get("invoiceId"), "Invoice ID");
    return response(await getCheckRecord(invoiceId));
  } catch (cause) {
    const status = cause instanceof RequestError ? cause.status : 500;
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not load check record" }, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  }
}

export async function POST(request: Request) {
  try {
    const baseUrl = process.env.PAYMENT_BASE_URL;
    if (!baseUrl) throw new RequestError("PAYMENT_BASE_URL is not configured", 503);
    if (request.headers.get("origin") !== new URL(baseUrl).origin) {
      throw new RequestError("Invalid request origin", 403);
    }
    let raw: string;
    try { raw = await readWebhookBody(request, 16_384); }
    catch (cause) {
      if (cause instanceof WebhookBodyTooLargeError) throw new RequestError("Request body is too large", 413);
      throw cause;
    }
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { throw new RequestError("Request body must be valid JSON", 400); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new RequestError("Request body must be a JSON object", 400);
    }
    const body = parsed as Record<string, unknown>;
    const invoiceId = cleanIdentifier(body.invoiceId, "Invoice ID");
    const invoiceNumber = cleanIdentifier(body.invoiceNumber, "Invoice number", 191);
    const actor = cleanIdentifier(
      request.headers.get("x-fortress-actor") || "authenticated-billing-operator",
      "Operator",
      191,
    );
    const note = cleanNote(body.note);
    if (body.confirmed !== true) throw new RequestError("Explicit confirmation is required", 422);

    let action: CheckAction;
    try { action = parseCheckAction(body.action); }
    catch (cause) { throw new RequestError(cause instanceof Error ? cause.message : "Check action is invalid", 400); }

    const existing = await getCheckRecord(invoiceId);
    if (existing && existing.invoiceNumber !== invoiceNumber) {
      throw new RequestError("Invoice number does not match the stored check record", 409);
    }

    let transition;
    try { transition = validateCheckTransition(existing?.state || null, action); }
    catch (cause) {
      if (cause instanceof CheckTransitionError) throw new RequestError(cause.message, 409);
      throw cause;
    }
    if (action === "RETURN" && (!note || note.length < 3)) {
      throw new RequestError("A return reason of at least 3 characters is required", 422);
    }
    if (["CLEAR", "RETURN", "RECONCILE"].includes(action) && body.confirmation !== invoiceNumber) {
      throw new RequestError("Type the exact invoice number to confirm this check action", 422);
    }

    if (transition.idempotent) {
      if (action === "RECEIVE" && body.checkReference !== undefined) {
        let masked: string;
        try { masked = maskCheckReference(body.checkReference); }
        catch (cause) { throw new RequestError(cause instanceof Error ? cause.message : "Check reference is invalid", 400); }
        if (masked !== existing!.maskedReference) throw new RequestError("Check reference does not match the stored record", 409);
        if (body.checkAmountCents !== undefined && body.checkAmountCents !== existing!.amount) {
          throw new RequestError("Check amount does not match the stored record", 409);
        }
      }
      return response(existing, 200, `This ${targetStateForAction(action).replaceAll("_", " ").toLowerCase()} check state was already recorded.`);
    }

    const { invoice, order } = await authoritativeInvoice(invoiceId);
    requireExactInvoiceNumber(invoice, invoiceNumber);
    validateAuthoritativeState(action, invoice, order, existing);
    const receivedAmount = action === "RECEIVE"
      ? checkAmount(body.checkAmountCents, outstandingAmount(invoice))
      : undefined;
    const squarePaymentId = action === "RECONCILE"
      ? cleanIdentifier(body.squarePaymentId, "Square payment ID", 192)
      : action === "RECEIVE" ? undefined : existing?.squarePaymentId;
    if (action === "RECONCILE") await requireMatchingClearedCheck(order, existing, squarePaymentId!);

    let maskedReference = existing?.maskedReference;
    if (action === "RECEIVE") {
      try { maskedReference = maskCheckReference(body.checkReference); }
      catch (cause) { throw new RequestError(cause instanceof Error ? cause.message : "Check reference is invalid", 400); }
    }
    if (!maskedReference) throw new RequestError("Check reference is unavailable", 409);

    const now = new Date().toISOString();
    const entry: CheckAuditEntry = {
      action,
      state: targetStateForAction(action),
      at: now,
      actor,
      ...(note ? { note } : {}),
      amount: receivedAmount ?? existing!.amount,
      maskedReference,
      ...(squarePaymentId ? { squarePaymentId } : {}),
    };
    const next: BillingCheckRecord = {
      itemType: "CHECK",
      invoiceId,
      invoiceNumber,
      amount: receivedAmount ?? existing!.amount,
      maskedReference,
      ...(squarePaymentId ? { squarePaymentId } : {}),
      state: transition.state,
      version: (existing?.version || 0) + 1,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      auditEntries: [...(existing?.auditEntries || []), entry],
    };

    try {
      await putCheckRecord(next, existing);
    } catch (cause) {
      if (!(cause instanceof BillingOperationConflictError)) throw cause;
      const current = await getCheckRecord(invoiceId);
      if (
        current?.state === transition.state
        && current.invoiceNumber === invoiceNumber
        && (action !== "RECEIVE" || current.maskedReference === next.maskedReference)
      ) return response(current, 200, transitionMessage(action));
      throw cause;
    }
    return response(next, existing ? 200 : 201, transitionMessage(action));
  } catch (cause) {
    const status = cause instanceof RequestError
      ? cause.status
      : cause instanceof BillingOperationConflictError
        ? 409
        : 500;
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not update check record" }, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  }
}
