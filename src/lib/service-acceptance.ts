import { createHash } from "node:crypto";

export const DELIVERY_METHODS = ["SECURE_PORTAL", "EMAIL", "MEETING", "MAIL", "OTHER"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export type ServiceAcceptanceInput = {
  completionId: string;
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  clientName: string;
  clientEmail: string;
  company: string;
  milestoneTitle: string;
  serviceSummary: string;
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  deliveredTo: string;
  payerRelationship: "SIGNER" | "AUTHORIZED_BUSINESS_PAYER" | "AUTHORIZED_THIRD_PARTY" | "UNKNOWN";
  authorizedPayerName?: string;
  authorizedPayerEmail?: string;
};

const clean = (value: unknown, label: string, min: number, max: number) => {
  if (typeof value !== "string") throw new Error(`${label} is required`);
  const result = value.trim();
  if (result.length < min || result.length > max || /[\0]/.test(result)) throw new Error(`${label} must be ${min}–${max} characters`);
  return result;
};

export function parseServiceDelivery(input: Record<string, unknown>, authoritative: {
  invoiceId: string; invoiceNumber: string; orderId: string; clientName: string; clientEmail: string; company?: string;
}): ServiceAcceptanceInput {
  const invoiceNumber = clean(input.invoiceNumber, "Invoice number", 4, 64);
  if (invoiceNumber !== authoritative.invoiceNumber) throw new Error("Invoice number does not match Square");
  const deliveryDate = clean(input.deliveryDate, "Delivery date", 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || Number.isNaN(Date.parse(`${deliveryDate}T12:00:00Z`))) throw new Error("Delivery date is invalid");
  if (deliveryDate > new Date().toISOString().slice(0, 10)) throw new Error("Delivery date cannot be in the future");
  const deliveryMethod = input.deliveryMethod;
  if (typeof deliveryMethod !== "string" || !DELIVERY_METHODS.includes(deliveryMethod as DeliveryMethod)) throw new Error("Delivery method is invalid");
  const payerRelationship = input.payerRelationship;
  if (typeof payerRelationship !== "string" || !new Set(["SIGNER", "AUTHORIZED_BUSINESS_PAYER", "AUTHORIZED_THIRD_PARTY", "UNKNOWN"]).has(payerRelationship)) throw new Error("Payer relationship is required");
  const authorizedPayerName = typeof input.authorizedPayerName === "string" ? input.authorizedPayerName.trim() : "";
  const authorizedPayerEmail = typeof input.authorizedPayerEmail === "string" ? input.authorizedPayerEmail.trim().toLowerCase() : "";
  if (payerRelationship !== "SIGNER" && (!authorizedPayerName || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(authorizedPayerEmail))) throw new Error("Provide the authorized payer name and email when the payer differs from the signer");
  const milestoneTitle = clean(input.milestoneTitle, "Milestone title", 5, 128);
  const serviceSummary = clean(input.serviceSummary, "Completed service summary", 20, 1500);
  const deliveredTo = clean(input.deliveredTo, "Delivered-to contact", 3, 191);
  const completionId = createHash("sha256").update(`${authoritative.invoiceId}:${milestoneTitle.toLowerCase()}:${deliveryDate}:${serviceSummary}`).digest("hex").slice(0, 24);
  return {
    completionId,
    invoiceId: authoritative.invoiceId,
    invoiceNumber,
    orderId: authoritative.orderId,
    clientName: authoritative.clientName,
    clientEmail: authoritative.clientEmail,
    company: authoritative.company || "",
    milestoneTitle,
    serviceSummary,
    deliveryDate,
    deliveryMethod: deliveryMethod as DeliveryMethod,
    deliveredTo,
    payerRelationship: payerRelationship as ServiceAcceptanceInput["payerRelationship"],
    ...(authorizedPayerName ? { authorizedPayerName } : {}),
    ...(authorizedPayerEmail ? { authorizedPayerEmail } : {}),
  };
}
