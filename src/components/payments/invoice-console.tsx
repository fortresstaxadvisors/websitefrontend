"use client";

import { useCallback, useEffect, useState } from "react";
import { InvoiceActions, PaymentRiskPanel } from "@/components/payments/payment-operations";

type InvoiceSummary = {
  id: string;
  orderId: string;
  number: string;
  status: string;
  title: string;
  email: string;
  amount: number;
  completedAmount: number;
  acceptsCard: boolean;
  acceptsAch: boolean;
  dueDate?: string;
  publicUrl?: string;
  updatedAt?: string;
};

type EngagementSummary = {
  id: number;
  name: string;
  status: string;
  email: string;
  createdAt?: string;
  completedAt?: string;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 py-3 text-[0.95rem] text-[var(--ink)] shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--faint)] focus:border-[var(--accent-ink)] focus:shadow-[0_0_0_3px_rgba(154,122,67,0.12)]";

const labelClass = "text-sm font-semibold text-[var(--ink)]";

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
  );
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function humanizeStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function statusStyle(status: string) {
  const normalized = status.toUpperCase();
  if (["PAID", "COMPLETED", "COMPLETE"].includes(normalized)) {
    return "border-emerald-700/20 bg-emerald-50 text-emerald-900";
  }
  if (["CANCELED", "CANCELLED", "FAILED", "REFUNDED"].includes(normalized)) {
    return "border-red-700/20 bg-red-50 text-red-900";
  }
  if (["OVERDUE", "PARTIALLY_PAID"].includes(normalized)) {
    return "border-amber-700/20 bg-amber-50 text-amber-950";
  }
  return "border-[var(--line)] bg-[var(--paper-deep)] text-[var(--muted)]";
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${statusStyle(status)}`}
    >
      {humanizeStatus(status)}
    </span>
  );
}

function parseDraftTotal(value: string) {
  return value.split("\n").reduce((total, line) => {
    const separator = line.lastIndexOf("|");
    if (separator < 1) return total;
    const amount = Number(line.slice(separator + 1).trim());
    return Number.isFinite(amount) && amount > 0
      ? total + Math.round(amount * 100)
      : total;
  }, 0);
}

export function InvoiceConsole() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [engagements, setEngagements] = useState<EngagementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState("");
  const [depositPercent, setDepositPercent] = useState("0");
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
    url?: string;
    signingUrls?: string[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceResponse, engagementResponse] = await Promise.all([
        fetch("/api/internal/invoices", { cache: "no-store" }),
        fetch("/api/internal/engagements", { cache: "no-store" }),
      ]);
      const invoiceData = await invoiceResponse.json();
      const engagementData = await engagementResponse.json();
      if (!invoiceResponse.ok) throw new Error(invoiceData.error);
      if (!engagementResponse.ok) throw new Error(engagementData.error);
      setInvoices(invoiceData.invoices);
      setEngagements(engagementData.engagements);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Could not load billing workflow",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/internal/engagements", {
        method: "POST",
        body: new FormData(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Engagement creation failed");
      }
      setMessage({
        ok: true,
        text: Array.isArray(data.signingUrls) && data.signingUrls.length > 0
          ? `Engagement ${data.invoiceNumber} was created. Use the Sandbox signing links below; Square will issue the test invoice only after every required signer completes it.`
          : `Engagement ${data.invoiceNumber} was sent for signature. Square will issue the invoice only after every required signer completes it.`,
        signingUrls: Array.isArray(data.signingUrls)
          ? data.signingUrls.filter((url: unknown): url is string =>
              typeof url === "string" && url.startsWith("https://"),
            )
          : undefined,
      });
      form.reset();
      setLineItems("");
      setDepositPercent("0");
      await load();
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Engagement creation failed",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const draftTotal = parseDraftTotal(lineItems);
  const completedEngagements = engagements.filter((engagement) =>
    ["COMPLETED", "COMPLETE"].includes(engagement.status.toUpperCase()),
  ).length;
  const paidInvoices = invoices.filter(
    (invoice) => invoice.status.toUpperCase() === "PAID",
  ).length;
  const openInvoices = invoices.filter((invoice) =>
    ["UNPAID", "SCHEDULED", "PARTIALLY_PAID", "OVERDUE"].includes(
      invoice.status.toUpperCase(),
    ),
  ).length;

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:gap-12">
      <form
        onSubmit={submit}
        className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-raise)]"
      >
        <div className="border-b border-[var(--line)] px-6 py-6 md:px-8">
          <p className="eyebrow">New workflow</p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="display text-3xl">Prepare the engagement</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                The client signs first. The invoice is created and emailed only
                after all required signatures are complete.
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-[var(--faint)]">
              * Required fields
            </span>
          </div>
        </div>

        <fieldset className="grid gap-5 border-b border-[var(--line)] px-6 py-7 md:grid-cols-2 md:px-8">
          <legend className="w-full px-6 pt-7 md:px-8">
            <span className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--slate)] text-xs font-bold text-[var(--on-dark)]">
                1
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
                Client record
              </span>
            </span>
          </legend>
          <label className={labelClass}>
            First name *
            <input
              name="givenName"
              required
              autoComplete="given-name"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Last name *
            <input
              name="familyName"
              required
              autoComplete="family-name"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Email *
            <input
              name="email"
              required
              type="email"
              autoComplete="email"
              className={fieldClass}
            />
            <span className="mt-1.5 block text-xs font-normal text-[var(--faint)]">
              DocuSeal and Square use this address.
            </span>
          </label>
          <label className={labelClass}>
            Phone
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Optional"
              className={fieldClass}
            />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Company, trust, or entity
            <input
              name="company"
              autoComplete="organization"
              className={fieldClass}
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-5 border-b border-[var(--line)] px-6 py-7 md:grid-cols-2 md:px-8">
          <legend className="w-full px-6 pt-7 md:px-8">
            <span className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--slate)] text-xs font-bold text-[var(--on-dark)]">
                2
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
                Scope &amp; billing
              </span>
            </span>
          </legend>
          <label className={labelClass}>
            Invoice number *
            <input
              name="invoiceNumber"
              required
              placeholder="FTA-2026-001"
              className={fieldClass}
            />
            <span className="mt-1.5 block text-xs font-normal text-[var(--faint)]">
              Must be unique; this prevents duplicate invoices.
            </span>
          </label>
          <label className={labelClass}>
            Final due date *
            <input name="dueDate" required type="date" className={fieldClass} />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Engagement title *
            <input
              name="title"
              required
              placeholder="2026 Tax Advisory Services"
              className={fieldClass}
            />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Detailed scope *
            <textarea
              name="description"
              required
              minLength={20}
              rows={4}
              className={fieldClass}
              placeholder="Describe the covered period, services, deliverables, and important exclusions."
            />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Line items *
            <span className="mt-1 block text-xs font-normal leading-5 text-[var(--faint)]">
              Enter one service per line in this format: description | amount
            </span>
            <textarea
              name="lineItems"
              required
              rows={5}
              value={lineItems}
              onChange={(event) => setLineItems(event.target.value)}
              className={`${fieldClass} font-mono text-sm`}
              placeholder={
                "2026 business return preparation | 3500.00\nQuarterly advisory retainer | 1500.00"
              }
            />
          </label>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 md:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">Draft invoice total</span>
              <span className="font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                {formatMoney(draftTotal)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--faint)]">
              Confirm this amount against your approved scope before sending.
            </p>
          </div>
          <label className={labelClass}>
            Deposit percentage
            <input
              name="depositPercent"
              type="number"
              min="0"
              max="90"
              step="1"
              value={depositPercent}
              onChange={(event) => setDepositPercent(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Deposit due date
            <input
              name="depositDueDate"
              type="date"
              required={Number(depositPercent) > 0}
              disabled={Number(depositPercent) <= 0}
              className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-[var(--paper-deep)] disabled:text-[var(--faint)]`}
            />
          </label>
        </fieldset>

        <div className="px-6 py-7 md:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--slate)] text-xs font-bold text-[var(--on-dark)]">
              3
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
              Review &amp; send
            </span>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--muted)]">
            <input
              name="confirmed"
              value="yes"
              required
              type="checkbox"
              className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--slate)]"
            />
            <span>
              I reviewed the client, scope, line items, total, and due dates. I
              authorize DocuSeal to send the engagement agreement and understand
              that Square will invoice automatically after all required
              signatures.
            </span>
          </label>
          {message ? (
            <div
              role="status"
              aria-live="polite"
              className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
                message.ok
                  ? "border-emerald-700/20 bg-emerald-50 text-emerald-950"
                  : "border-red-700/20 bg-red-50 text-red-900"
              }`}
            >
              <strong>{message.ok ? "Sent. " : "Action needed. "}</strong>
              {message.text}
              {message.url ? (
                <>
                  {" "}
                  <a
                    href={message.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    Open invoice
                  </a>
                </>
              ) : null}
              {message.signingUrls?.length ? (
                <span className="mt-3 flex flex-wrap gap-2">
                  {message.signingUrls.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-emerald-800/25 bg-white px-3 py-2 font-semibold text-emerald-950 underline decoration-emerald-700/40 underline-offset-2"
                    >
                      Open {index === 0 ? "client" : "Fortress"} Sandbox signing
                    </a>
                  ))}
                </span>
              ) : null}
            </div>
          ) : null}
          <button
            disabled={submitting}
            className="btn btn-primary mt-6 w-full justify-center disabled:cursor-wait disabled:opacity-55 sm:w-auto"
          >
            {submitting
              ? "Creating signature workflow…"
              : draftTotal > 0
                ? `Send agreement — ${formatMoney(draftTotal)}`
                : "Send engagement for signature"}
          </button>
          <p className="mt-3 text-xs leading-5 text-[var(--faint)]">
            Sending does not charge the client. Payment becomes available only
            through the invoice issued after signature.
          </p>
        </div>
      </form>

      <section aria-labelledby="workflow-status-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Live records</p>
            <h2 id="workflow-status-heading" className="display mt-3 text-3xl">
              Workflow status
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              DocuSeal signatures and Square invoices in one view.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn btn-secondary !px-4 !py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-3 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]">
          {[
            ["Signed", completedEngagements],
            ["Open", openInvoices],
            ["Paid", paidInvoices],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`p-4 text-center ${index ? "border-l border-[var(--line)]" : ""}`}
            >
              <dd className="font-mono text-2xl font-bold tabular-nums text-[var(--ink)]">
                {loading ? "—" : value}
              </dd>
              <dt className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--faint)]">
                {label}
              </dt>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
            Engagements
          </h3>
          <span className="text-xs text-[var(--faint)]">
            {engagements.length} recent
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
              Loading DocuSeal engagements…
            </p>
          ) : engagements.length ? (
            engagements.map((engagement) => (
              <article
                key={engagement.id}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raise)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold">{engagement.name}</h4>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      {engagement.email}
                    </p>
                  </div>
                  <StatusPill status={engagement.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--line)] pt-3 text-xs text-[var(--faint)]">
                  <span>DocuSeal #{engagement.id}</span>
                  {engagement.completedAt ? (
                    <span>Signed {formatDate(engagement.completedAt)}</span>
                  ) : engagement.createdAt ? (
                    <span>Sent {formatDate(engagement.createdAt)}</span>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[var(--radius)] border border-dashed border-[var(--line-strong)] p-6">
              <h4 className="font-semibold">No engagements yet</h4>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                The first agreement you send will appear here with its live
                signature status.
              </p>
            </div>
          )}
        </div>

        <div className="mt-9 flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
            Square invoices
          </h3>
          <span className="text-xs text-[var(--faint)]">
            {invoices.length} recent
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
              Loading Square invoices…
            </p>
          ) : invoices.length ? (
            invoices.map((invoice) => (
              <article
                key={invoice.id}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raise)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
                      {invoice.number}
                    </p>
                    <h4 className="mt-1 truncate font-semibold">
                      {invoice.title}
                    </h4>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      {invoice.email}
                    </p>
                  </div>
                  <StatusPill status={invoice.status} />
                </div>
                <div className="mt-4 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-4">
                  <div>
                    <p className="font-mono text-lg font-bold tabular-nums">
                      {formatMoney(invoice.amount)}
                    </p>
                    {invoice.dueDate ? (
                      <p className="mt-0.5 text-xs text-[var(--faint)]">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    ) : null}
                  </div>
                  {invoice.publicUrl ? (
                    <a
                      href={invoice.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="link-arrow text-sm"
                    >
                      Open invoice
                      <span className="arrow" aria-hidden="true">
                        &rarr;
                      </span>
                    </a>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
                  {invoice.acceptsCard ? <span>Card</span> : null}
                  {invoice.acceptsAch ? <span>ACH</span> : null}
                  <span>Check by staff reconciliation</span>
                  {invoice.completedAmount > 0 ? <span>{formatMoney(invoice.completedAmount)} completed</span> : null}
                </div>
                <InvoiceActions invoice={invoice} onChanged={load} />
              </article>
            ))
          ) : (
            <div className="rounded-[var(--radius)] border border-dashed border-[var(--line-strong)] p-6">
              <h4 className="font-semibold">No Square invoices yet</h4>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Invoices appear only after every required signature is
                completed.
              </p>
            </div>
          )}
        </div>
        <PaymentRiskPanel refreshKey={refreshKey} />
      </section>
    </div>
  );
}
