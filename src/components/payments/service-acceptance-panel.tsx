"use client";

import { useRef, useState } from "react";
import {
  acceptancePresentation,
  canRequestServiceAcceptance,
  existingAcceptanceNotice,
  latestIssueNote,
  type AcceptanceTone,
  type ServiceAcceptanceDisplayRecord,
} from "@/components/payments/service-acceptance-ui";

type AcceptanceInvoice = {
  id: string;
  number: string;
  status: string;
  email: string;
};

const inputClass =
  "mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--faint)] focus:border-[var(--accent-ink)] focus:shadow-[0_0_0_3px_rgba(154,122,67,0.12)] sm:text-sm";
const labelClass = "text-xs font-semibold text-[var(--ink)]";

const toneClass: Record<AcceptanceTone, string> = {
  neutral: "border-[var(--line)] bg-white text-[var(--muted)]",
  pending: "border-amber-700/20 bg-amber-50 text-amber-950",
  success: "border-emerald-700/20 bg-emerald-50 text-emerald-950",
  issue: "border-red-800/25 bg-red-50 text-red-950",
};

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function cleanSigningUrls(value: unknown) {
  return Array.isArray(value)
    ? value.filter((url): url is string => typeof url === "string" && url.startsWith("https://"))
    : [];
}

export function ServiceAcceptancePanel({
  invoice,
  acceptances,
  onChanged,
}: {
  invoice: AcceptanceInvoice;
  acceptances: ServiceAcceptanceDisplayRecord[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<{
    ok: boolean;
    text: string;
    signingUrls?: string[];
  } | null>(null);
  const submitLock = useRef(false);
  const panelId = `service-acceptance-${invoice.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const eligible = canRequestServiceAcceptance(invoice.status);
  const issues = acceptances.filter((record) => record.status === "DECLINED").length;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      milestoneTitle: String(fields.get("milestoneTitle") || ""),
      serviceSummary: String(fields.get("serviceSummary") || ""),
      deliveryDate: String(fields.get("deliveryDate") || ""),
      deliveryMethod: String(fields.get("deliveryMethod") || ""),
      deliveredTo: String(fields.get("deliveredTo") || ""),
      confirmed,
    };

    submitLock.current = true;
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/internal/acceptances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not request client acknowledgment");
      const status = String(data.acceptance?.status || "").toUpperCase();
      const signingUrls = cleanSigningUrls(data.signingUrls);
      const existingNotice = data.existing ? existingAcceptanceNotice(status) : undefined;
      setNotice({
        ok: existingNotice?.ok ?? true,
        text: existingNotice?.text
          || "The client review request was sent. Sending this request did not charge the client or change the invoice balance.",
        signingUrls,
      });
      if (!data.existing) {
        form.reset();
        setConfirmed(false);
      }
      await onChanged();
    } catch (cause) {
      setNotice({
        ok: false,
        text: cause instanceof Error ? cause.message : "Could not request client acknowledgment",
      });
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 border-t border-[var(--line)] pt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((value) => !value);
          setNotice(null);
        }}
        className="flex min-h-11 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-[var(--accent-ink)]"
      >
        <span>{open ? "Close service completion" : "Record service completion"}</span>
        <span className="flex items-center gap-2 text-xs font-normal text-[var(--faint)]">
          {issues ? <span className="rounded-full bg-red-100 px-2 py-1 font-bold text-red-900">{issues} issue{issues === 1 ? "" : "s"}</span> : null}
          <span>{acceptances.length} record{acceptances.length === 1 ? "" : "s"}</span>
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </span>
      </button>

      {open ? (
        <section id={panelId} aria-label={`Service completion for ${invoice.number}`} className="mt-3 space-y-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <div>
            <h5 className="font-semibold">Client delivery acknowledgments</h5>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Use one request per completed milestone. It documents delivery and the client’s response; it does not collect payment, make payment final, or waive statutory, card-network, bank-payment, provider-contact, or dispute rights.
            </p>
          </div>

          {acceptances.length ? (
            <ol aria-label="Service completion history" className="space-y-3">
              {acceptances.map((record) => {
                const presentation = acceptancePresentation(record.status);
                const issueNote = latestIssueNote(record);
                return (
                  <li key={record.milestoneId} className={`rounded-lg border p-3 text-sm ${toneClass[presentation.tone]}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <strong>{presentation.label}</strong>
                      <span className="text-xs font-semibold">Delivered {formatDate(record.serviceDate)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5">{presentation.description}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink)]">{record.serviceSummary}</p>
                    {issueNote ? (
                      <div className="mt-3 rounded-md border border-red-800/20 bg-white/70 p-3">
                        <strong className="text-xs uppercase tracking-[0.08em]">Client issue report</strong>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-5">{issueNote}</p>
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
                      <span>Updated {formatDate(record.updatedAt)}</span>
                      {record.docusealSubmissionId ? <span>DocuSeal #{record.docusealSubmissionId}</span> : null}
                      {record.signerName ? <span>Client: {record.signerName}</span> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--line-strong)] bg-white p-3 text-xs leading-5 text-[var(--muted)]">
              No completion milestones have been sent for this invoice.
            </p>
          )}

          {!eligible ? (
            <p role="status" className="rounded-lg border border-amber-700/20 bg-amber-50 p-3 text-sm font-semibold text-amber-950">
              This Square invoice status is not eligible for a new completion request. Review the invoice before continuing.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4 border-t border-[var(--line)] pt-4">
              <div>
                <h6 className="text-sm font-semibold">Send a milestone for client review</h6>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Describe only work actually delivered. A changed title, delivery date, or summary creates a separate milestone record.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`${labelClass} sm:col-span-2`}>
                  Milestone title *
                  <input name="milestoneTitle" required minLength={5} maxLength={128} className={inputClass} placeholder="Final 2025 business return delivered" />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  Completed services and deliverables *
                  <textarea name="serviceSummary" required minLength={20} maxLength={1500} rows={4} className={inputClass} placeholder="List the specific return, report, filing confirmation, or advisory deliverable the client received." />
                  <span className="mt-1 block font-normal leading-5 text-[var(--faint)]">Do not include Social Security numbers, bank details, access codes, or full tax-return data.</span>
                </label>
                <label className={labelClass}>
                  Delivery date *
                  <input name="deliveryDate" required type="date" max={localToday()} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Delivery method *
                  <select name="deliveryMethod" required defaultValue="SECURE_PORTAL" className={inputClass}>
                    <option value="SECURE_PORTAL">Secure portal</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="MAIL">Mail</option>
                    <option value="OTHER">Other documented method</option>
                  </select>
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  Delivered-to contact or destination *
                  <input name="deliveredTo" required minLength={3} maxLength={191} defaultValue={invoice.email} className={inputClass} />
                  <span className="mt-1 block font-normal leading-5 text-[var(--faint)]">Confirm this is the person or secure destination that actually received the work.</span>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-[var(--line-strong)] bg-white p-3 text-xs leading-5 text-[var(--muted)]">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--slate)]"
                />
                <span>
                  I confirm these services were actually delivered as described, the recipient and payer relationship are accurate, and I authorize sending this milestone to the client for review. I understand this request takes no payment and does not waive or restrict the client’s legal or payment-dispute rights.
                </span>
              </label>

              {notice ? (
                <div role="status" aria-live="polite" className={`rounded-lg border p-3 text-sm leading-5 ${notice.ok ? toneClass.success : toneClass.issue}`}>
                  <strong>{notice.ok ? "Recorded. " : "Action needed. "}</strong>{notice.text}
                  {notice.signingUrls?.length ? (
                    <span className="mt-2 flex flex-wrap gap-2">
                      {notice.signingUrls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-md border border-current/20 bg-white px-3 py-2 font-semibold underline underline-offset-2">
                          Open Sandbox client review
                        </a>
                      ))}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <button type="submit" disabled={submitting || !confirmed} className="btn btn-secondary min-h-11 w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">
                {submitting ? "Sending client review…" : "Send completion acknowledgment"}
              </button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
