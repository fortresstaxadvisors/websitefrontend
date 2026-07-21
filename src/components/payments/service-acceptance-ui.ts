export type AcceptanceStatus =
  | "DELIVERED"
  | "SENT"
  | "COMPLETED"
  | "DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

export type ServiceAcceptanceDisplayRecord = {
  invoiceId: string;
  invoiceNumber: string;
  milestoneId: string;
  serviceDate: string;
  serviceSummary: string;
  status: AcceptanceStatus;
  docusealSubmissionId?: number;
  signerName?: string;
  signerEmail?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  auditEntries: Array<{
    action: string;
    toStatus: string;
    at: string;
    note?: string;
  }>;
};

export type AcceptanceTone = "neutral" | "pending" | "success" | "issue";

const PRESENTATION: Record<AcceptanceStatus, {
  label: string;
  description: string;
  tone: AcceptanceTone;
}> = {
  DELIVERED: {
    label: "Delivery recorded",
    description: "The delivery record exists, but a client request has not been confirmed as sent.",
    tone: "neutral",
  },
  SENT: {
    label: "Awaiting client",
    description: "DocuSeal sent the review request and the client has not responded yet.",
    tone: "pending",
  },
  COMPLETED: {
    label: "Receipt acknowledged",
    description: "The client acknowledged receipt and review. This is evidence only, not proof that payment is final.",
    tone: "success",
  },
  DECLINED: {
    label: "Client issue reported",
    description: "Stop and review the client’s issue before collection, release, or follow-up activity.",
    tone: "issue",
  },
  EXPIRED: {
    label: "Request expired",
    description: "The client did not respond before the signing request expired.",
    tone: "pending",
  },
  WITHDRAWN: {
    label: "Request withdrawn",
    description: "This request was withdrawn and should not be treated as client acceptance.",
    tone: "neutral",
  },
};

export function acceptancePresentation(status: AcceptanceStatus) {
  return PRESENTATION[status] || {
    label: "Unknown status",
    description: "Review the authoritative record before taking action.",
    tone: "neutral" as const,
  };
}

export function latestIssueNote(record: ServiceAcceptanceDisplayRecord) {
  if (record.status !== "DECLINED") return undefined;
  return [...record.auditEntries]
    .reverse()
    .find((entry) => entry.action === "DECLINE" && entry.note?.trim())
    ?.note?.trim();
}

export function canRequestServiceAcceptance(invoiceStatus: string) {
  return [
    "SCHEDULED",
    "UNPAID",
    "PARTIALLY_PAID",
    "PAYMENT_PENDING",
    "PAID",
    "OVERDUE",
  ].includes(invoiceStatus.toUpperCase());
}

export function existingAcceptanceNotice(status: string) {
  switch (status.toUpperCase()) {
    case "SENT":
      return { ok: true, text: "This exact milestone is already awaiting the client. No duplicate request was sent." };
    case "COMPLETED":
      return { ok: true, text: "The client already acknowledged this exact milestone. No duplicate request was sent." };
    case "DECLINED":
      return { ok: false, text: "This milestone already has a client-reported issue. Review and resolve it; no duplicate request was sent." };
    case "EXPIRED":
      return { ok: false, text: "The prior request for this exact milestone expired, and no replacement was sent. Review the record before following up." };
    case "DELIVERED":
      return { ok: false, text: "The delivery record exists, but sending is not confirmed. Review DocuSeal before retrying to avoid a duplicate." };
    case "WITHDRAWN":
      return { ok: false, text: "This exact milestone was withdrawn and no new request was sent." };
    default:
      return { ok: false, text: "This exact milestone already has a record in an unexpected state. Review it before continuing." };
  }
}
