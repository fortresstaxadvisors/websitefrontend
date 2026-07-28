import "server-only";
import { createHash } from "node:crypto";
import { squareFetch, squareLocationId } from "@/lib/square";

export type InvoiceInput = {
  workflowId: string;
  givenName: string; familyName: string; email: string; phone: string; company: string;
  invoiceNumber: string; title: string; description: string; dueDate: string;
  depositPercent: number; depositDueDate: string; allowAch: boolean;
  payerRelationship: "SIGNER" | "AUTHORIZED_BUSINESS_PAYER" | "AUTHORIZED_THIRD_PARTY";
  authorizedPayerName: string; authorizedPayerEmail: string;
  lineItems: { name: string; quantity: "1"; base_price_money: { amount: number; currency: "USD" } }[];
};

type SquareCustomer = { id: string; given_name?: string; family_name?: string; company_name?: string; email_address?: string };
type SquareInvoice = { id: string; version: number; invoice_number?: string; order_id?: string; status?: string; public_url?: string };

const text = (form: FormData, key: string) => { const value = form.get(key); return typeof value === "string" ? value.trim() : ""; };
const validDate = (input: string) => /^\d{4}-\d{2}-\d{2}$/.test(input) && !Number.isNaN(Date.parse(`${input}T12:00:00Z`));
const squareToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: process.env.SQUARE_LOCATION_TIME_ZONE || "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
function normalizePhone(input: string) { if (!input) return ""; const digits = input.replace(/\D/g, ""); if (digits.length === 10) return `+1${digits}`; if (digits.length >= 9 && digits.length <= 16) return `+${digits}`; throw new Error("Phone must include a valid country code or a 10-digit US number"); }

export function parseInvoiceForm(form: FormData): InvoiceInput {
  const givenName = text(form, "givenName"), familyName = text(form, "familyName"), email = text(form, "email").toLowerCase(), confirmEmail = text(form, "confirmEmail").toLowerCase(), phone = text(form, "phone"), company = text(form, "company");
  const invoiceNumber = text(form, "invoiceNumber"), title = text(form, "title"), description = text(form, "description"), dueDate = text(form, "dueDate"), depositDueDate = text(form, "depositDueDate");
  const depositPercent = Number(text(form, "depositPercent") || "0");
  const allowAch = text(form, "allowAch") === "yes";
  const payerRelationship = text(form, "payerRelationship");
  const authorizedPayerName = text(form, "authorizedPayerName");
  const authorizedPayerEmail = text(form, "authorizedPayerEmail").toLowerCase();
  const today = squareToday();
  if (!givenName || givenName.length > 80 || !familyName || familyName.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email !== confirmEmail || !/^[A-Za-z0-9._-]{4,64}$/.test(invoiceNumber) || !title || title.length > 128 || description.length < 20 || description.length > 1500 || company.length > 191 || !validDate(dueDate) || dueDate < today || text(form, "confirmed") !== "yes") throw new Error("Complete every required field, confirm the client email, and use a current or future due date");
  if (!Number.isFinite(depositPercent) || depositPercent < 0 || depositPercent > 90 || (depositPercent > 0 && (!validDate(depositDueDate) || depositDueDate < today || depositDueDate >= dueDate))) throw new Error("A deposit must be due today or later and before the balance due date");
  if (!new Set(["SIGNER", "AUTHORIZED_BUSINESS_PAYER", "AUTHORIZED_THIRD_PARTY"]).has(payerRelationship)) throw new Error("Select who is authorized to make the payment");
  if (payerRelationship !== "SIGNER" && (!authorizedPayerName || authorizedPayerName.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(authorizedPayerEmail))) throw new Error("Provide the authorized payer name and email when the signer will not pay");
  const lineItems = text(form, "lineItems").split("\n").filter((line) => line.trim()).map((line) => { const split = line.lastIndexOf("|"); const name = line.slice(0, split).trim(); const rawAmount = line.slice(split + 1).trim(); if (split < 1 || !name || name.length > 255 || !/^\d{1,7}(?:\.\d{1,2})?$/.test(rawAmount)) throw new Error(`Invalid line item: ${line}`); const amount = Math.round(Number(rawAmount) * 100); if (!Number.isSafeInteger(amount) || amount < 1) throw new Error(`Invalid line item: ${line}`); return { name, quantity: "1" as const, base_price_money: { amount, currency: "USD" as const } }; });
  if (!lineItems.length || lineItems.length > 50) throw new Error("Add between 1 and 50 line items");
  // The invoice number is the business-level uniqueness boundary. Using a
  // deterministic workflow ID makes duplicate signature callbacks and even
  // duplicate engagement submissions converge on one Square invoice.
  const workflowId = createHash("sha256").update(`fortress:${invoiceNumber.toLowerCase()}`).digest("hex").slice(0, 32);
  return { workflowId, givenName, familyName, email, phone: normalizePhone(phone), company, invoiceNumber, title, description, dueDate, depositPercent, depositDueDate, allowAch, payerRelationship: payerRelationship as InvoiceInput["payerRelationship"], authorizedPayerName, authorizedPayerEmail, lineItems };
}

export function payerAuthorizationStatement(input: InvoiceInput) {
  if (!input.payerRelationship || input.payerRelationship === "SIGNER") return `Expected payer: the engagement signer (${input.givenName} ${input.familyName}).`;
  const relationship = input.payerRelationship === "AUTHORIZED_BUSINESS_PAYER" ? "authorized business payer" : "authorized third-party payer";
  return `Expected payer: ${input.authorizedPayerName}, identified by the client as an ${relationship}. The payer email is retained only in Fortress's private billing evidence record.`;
}

const key = (workflowId: string, stage: string) => createHash("sha256").update(`${workflowId}:${stage}`).digest("hex").slice(0, 45);

export function squareInvoiceSchedule(input: InvoiceInput, today = squareToday()) {
  const balanceDueDate = input.dueDate < today ? today : input.dueDate;
  const depositDueDate = input.depositDueDate < today ? today : input.depositDueDate;
  const includeDeposit = input.depositPercent > 0 && depositDueDate < balanceDueDate;
  let adjustmentNote = "";
  if (input.depositPercent > 0 && !includeDeposit) {
    adjustmentNote = `The signed engagement set a ${input.depositPercent}% deposit due ${input.depositDueDate} and the balance due ${input.dueDate}. Because a separate deposit is no longer due before the balance, this invoice requests the full balance due ${balanceDueDate}.`;
  } else if (includeDeposit && depositDueDate !== input.depositDueDate) {
    adjustmentNote = `The signed engagement set the deposit due ${input.depositDueDate}. Because that date passed while signatures were being completed, Square displays the deposit as due ${depositDueDate}; the contractual balance remains due ${balanceDueDate}.`;
  } else if (balanceDueDate !== input.dueDate) {
    adjustmentNote = `The signed engagement set the balance due ${input.dueDate}. Because Square cannot create a past-dated payment request, this invoice displays the unpaid balance as due ${balanceDueDate}.`;
  }
  return { balanceDueDate, depositDueDate, includeDeposit, adjustmentNote };
}

async function existingSquareInvoiceForOrder(orderId: string, locationId: string) {
  const matches: SquareInvoice[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page += 1) {
    const result = await squareFetch<{ invoices?: SquareInvoice[]; cursor?: string }>("/v2/invoices/search", {
      method: "POST",
      body: JSON.stringify({
        query: { filter: { location_ids: [locationId] } },
        limit: 100,
        ...(cursor ? { cursor } : {}),
      }),
    });
    matches.push(...(result.invoices || []).filter((invoice) => invoice.order_id === orderId));
    if (matches.length > 1) throw new Error("Multiple Square invoices are linked to the engagement order");
    cursor = result.cursor;
    if (!cursor) return matches[0];
  }
  throw new Error("Square invoice recovery exceeded the pagination limit");
}

export async function createSquareInvoice(input: InvoiceInput, signedAgreement: Blob, auditLog?: Blob) {
  let draftId: string | undefined;
  try {
    const customerId = await findOrCreateCustomer(input);
    const locationId = squareLocationId();
    const orderData = await squareFetch<{ order: { id: string } }>("/v2/orders", { method: "POST", body: JSON.stringify({ idempotency_key: key(input.workflowId, "order"), order: { location_id: locationId, customer_id: customerId, reference_id: input.invoiceNumber.slice(0, 40), source: { name: "Fortress Signed Engagement" }, line_items: input.lineItems } }) });
    const reminders = [{ relative_scheduled_days: -7, message: `Reminder: ${input.invoiceNumber} is due in seven days.` }, { relative_scheduled_days: 0, message: `Invoice ${input.invoiceNumber} is due today.` }, { relative_scheduled_days: 7, message: `Invoice ${input.invoiceNumber} is seven days past due. Contact Fortress if payment is already in transit by check.` }];
    const schedule = squareInvoiceSchedule(input);
    const paymentRequests = schedule.includeDeposit
      ? [{ request_type: "DEPOSIT", due_date: schedule.depositDueDate, percentage_requested: String(input.depositPercent), reminders: reminders.slice(0, 2) }, { request_type: "BALANCE", due_date: schedule.balanceDueDate, reminders }]
      : [{ request_type: "BALANCE", due_date: schedule.balanceDueDate, reminders }];
    const checkPayee = process.env.FORTRESS_CHECK_PAYEE?.trim();
    const checkAddress = process.env.FORTRESS_CHECK_REMITTANCE_ADDRESS?.trim();
    const checkText = checkPayee && checkAddress
      ? `Check option: make payable to ${checkPayee}; mail to ${checkAddress}; include ${input.invoiceNumber} on the memo line.`
      : "Check payment is not enabled on this invoice. Contact clientservice@fortresstaxadvisors.com before mailing any check.";
    const achEnabled = process.env.SQUARE_ENABLE_ACH === "true" && input.allowAch === true;
    const scheduleText = schedule.adjustmentNote ? `\n\nBilling schedule note: ${schedule.adjustmentNote}` : "";
    const recovered = await existingSquareInvoiceForOrder(orderData.order.id, locationId);
    const invoiceStage = `invoice-schedule-v2:${schedule.includeDeposit ? "deposit" : "balance"}:${schedule.depositDueDate}:${schedule.balanceDueDate}`;
    const draft = recovered
      ? { invoice: recovered }
      : await squareFetch<{ invoice: SquareInvoice }>("/v2/invoices", { method: "POST", body: JSON.stringify({ idempotency_key: key(input.workflowId, invoiceStage), invoice: { order_id: orderData.order.id, primary_recipient: { customer_id: customerId }, delivery_method: "EMAIL", payment_requests: paymentRequests, accepted_payment_methods: { card: true, square_gift_card: false, bank_account: achEnabled, buy_now_pay_later: false, cash_app_pay: false }, invoice_number: input.invoiceNumber, title: input.title, description: `${input.description}\n\n${payerAuthorizationStatement(input)}${scheduleText}\n\nSecure online payment is available through this invoice.${achEnabled ? " ACH is enabled for this approved engagement; pending or completed ACH is not treated as irrevocable." : " ACH is not enabled for this engagement."} ${checkText} Refund and cancellation terms are governed by the attached signed engagement agreement.`, store_payment_method_enabled: false } }) });
    draftId = draft.invoice.id;
    const existing = await squareFetch<{ invoice: SquareInvoice }>(`/v2/invoices/${encodeURIComponent(draftId)}`);
    if (existing.invoice.status && existing.invoice.status !== "DRAFT") {
      return { invoiceId: existing.invoice.id, invoiceNumber: existing.invoice.invoice_number, orderId: orderData.order.id, customerId, publicUrl: existing.invoice.public_url, status: existing.invoice.status };
    }
    const skipSandboxAttachment = process.env.SQUARE_ENVIRONMENT !== "production" && process.env.SQUARE_SANDBOX_SKIP_ATTACHMENTS === "true";
    if (!skipSandboxAttachment) {
      if (signedAgreement.size + (auditLog?.size || 0) > 25 * 1024 * 1024) throw new Error("The completed agreement and audit record exceed Square's 25 MB attachment limit");
      await attach(draftId, input, signedAgreement, "signed-agreement", "Completed engagement agreement", `${input.invoiceNumber}-signed-engagement.pdf`);
      if (auditLog) await attach(draftId, input, auditLog, "signature-audit", "Electronic signature audit log", `${input.invoiceNumber}-signature-audit.pdf`);
    }
    // Attachment creation increments the Square invoice version. Publishing
    // must use the current version, not the version returned with the draft.
    const current = await squareFetch<{ invoice: SquareInvoice }>(`/v2/invoices/${encodeURIComponent(draftId)}`);
    const published = await squareFetch<{ invoice: SquareInvoice }>(`/v2/invoices/${encodeURIComponent(draftId)}/publish`, { method: "POST", body: JSON.stringify({ version: current.invoice.version, idempotency_key: key(input.workflowId, "publish") }) });
    return { invoiceId: published.invoice.id, invoiceNumber: published.invoice.invoice_number, orderId: orderData.order.id, customerId, publicUrl: published.invoice.public_url, status: published.invoice.status };
  } catch (cause) {
    throw new Error(`${cause instanceof Error ? cause.message : "Invoice creation failed"}${draftId ? ` Draft invoice ${draftId} was not published; review it in Square.` : ""}`);
  }
}

async function existingSquareCustomer(input: InvoiceInput) {
  const found = await squareFetch<{ customers?: SquareCustomer[] }>("/v2/customers/search", { method: "POST", body: JSON.stringify({ query: { filter: { email_address: { exact: input.email } } }, limit: 2 }) });
  if ((found.customers?.length || 0) > 1) throw new Error("Multiple Square customers use this email; merge them in Square first");
  if (found.customers?.[0]) {
    const customer = found.customers[0];
    const same = (a?: string, b?: string) => (a || "").trim().toLocaleLowerCase() === (b || "").trim().toLocaleLowerCase();
    if (
      (customer.given_name && !same(customer.given_name, input.givenName))
      || (customer.family_name && !same(customer.family_name, input.familyName))
      || (customer.company_name && input.company && !same(customer.company_name, input.company))
    ) throw new Error("The existing Square customer for this email has different identity details; review the customer record before sending");
    return customer.id;
  }
  return undefined;
}

export async function preflightSquareCustomer(input: InvoiceInput) {
  await existingSquareCustomer(input);
}

async function findOrCreateCustomer(input: InvoiceInput) {
  const existing = await existingSquareCustomer(input);
  if (existing) return existing;
  const created = await squareFetch<{ customer: SquareCustomer }>("/v2/customers", { method: "POST", body: JSON.stringify({ idempotency_key: key(input.workflowId, "customer"), given_name: input.givenName, family_name: input.familyName, email_address: input.email, ...(input.phone ? { phone_number: input.phone } : {}), ...(input.company ? { company_name: input.company } : {}) }) });
  return created.customer.id;
}

export function invoiceTotal(input: InvoiceInput) { return input.lineItems.reduce((sum, item) => sum + item.base_price_money.amount, 0); }

async function attach(invoiceId: string, input: InvoiceInput, file: Blob, stage: string, description: string, filename: string) {
  const form = new FormData();
  form.append("request", JSON.stringify({ idempotency_key: key(input.workflowId, stage), description }));
  form.append("file", file, filename);
  await squareFetch(`/v2/invoices/${encodeURIComponent(invoiceId)}/attachments`, { method: "POST", body: form });
}
