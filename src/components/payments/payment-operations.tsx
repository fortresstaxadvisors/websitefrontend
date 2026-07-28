"use client";

import { useEffect, useState } from "react";
import { DisputeCasePanel } from "@/components/payments/dispute-case-panel";

export type OperationsInvoice = {
  id: string;
  number: string;
  status: string;
  amount: number;
  completedAmount: number;
};

type CheckRecord = {
  state: "RECEIVED" | "DEPOSITED" | "CLEARED_AWAITING_SQUARE" | "RETURNED" | "RECONCILED";
  maskedReference: string;
  amount: number;
  updatedAt: string;
  squarePaymentId?: string;
  auditEntries: { action: string; state: string; at: string; actor?: string; note?: string; amount?: number; maskedReference?: string; squarePaymentId?: string }[];
};

const inputClass = "mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--accent-ink)] sm:text-sm";

export function InvoiceActions({ invoice, onChanged }: { invoice: OperationsInvoice; onChanged: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [refundConfirmation, setRefundConfirmation] = useState("");
  const [refundConfirmed, setRefundConfirmed] = useState(false);
  const [refundPreview, setRefundPreview] = useState<{ amount: number; currency: string; token: string; expiresAt: number } | null>(null);
  const [squarePaymentId, setSquarePaymentId] = useState("");
  const [checkConfirmation, setCheckConfirmation] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [returnConfirmation, setReturnConfirmation] = useState("");
  const outstandingCheckAmount = Math.max(0, invoice.amount - invoice.completedAmount);
  const [checkAmount, setCheckAmount] = useState((outstandingCheckAmount / 100).toFixed(2));

  useEffect(() => {
    setCheckAmount((outstandingCheckAmount / 100).toFixed(2));
  }, [outstandingCheckAmount]);

  async function loadCheck() {
    const response = await fetch(`/api/internal/checks?invoiceId=${encodeURIComponent(invoice.id)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load check record");
    setCheck(data.check || null);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    setNotice(null);
    if (next) {
      setLoading(true);
      try { await loadCheck(); }
      catch (error) { setNotice({ ok: false, text: error instanceof Error ? error.message : "Could not load payment controls" }); }
      finally { setLoading(false); }
    }
  }

  async function transitionCheck(action: "receive" | "deposit" | "clear" | "return" | "reconcile") {
    setLoading(true);
    setNotice(null);
    try {
      const response = await fetch("/api/internal/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, invoiceNumber: invoice.number, action: action.toUpperCase(), checkReference: reference, checkAmountCents: action === "receive" && /^\d{1,7}(?:\.\d{1,2})?$/.test(checkAmount.trim()) ? Math.round(Number(checkAmount) * 100) : undefined, note: action === "return" ? returnNote : note, squarePaymentId, confirmation: action === "return" ? returnConfirmation : checkConfirmation, confirmed: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check update failed");
      setCheck(data.check);
      setReference("");
      setNote("");
      setSquarePaymentId("");
      setCheckConfirmation("");
      setReturnNote("");
      setReturnConfirmation("");
      setNotice({ ok: true, text: data.message || "Check workflow updated." });
      await onChanged();
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Check update failed" });
    } finally { setLoading(false); }
  }

  async function prepareRefund() {
    setLoading(true);
    setNotice(null);
    setRefundPreview(null);
    setRefundConfirmed(false);
    setRefundConfirmation("");
    try {
      const response = await fetch("/api/internal/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", invoiceId: invoice.id, invoiceNumber: invoice.number }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Refund preview failed");
      setRefundPreview(data.preview);
      setNotice({ ok: true, text: "Square returned the exact refundable balance. Review it before authorizing." });
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Refund preview failed" });
    } finally { setLoading(false); }
  }

  async function refund() {
    if (refundConfirmation !== invoice.number || !refundConfirmed) {
      setNotice({ ok: false, text: "Type the exact invoice number and confirm the full refund." });
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const response = await fetch("/api/internal/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, invoiceNumber: invoice.number, reason: refundReason, reference: refundReference, previewToken: refundPreview?.token, confirmed: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Refund failed");
      setNotice({ ok: true, text: `Refund ${data.refund.id} is ${String(data.refund.status).toLowerCase()}.` });
      setRefundReason("");
      setRefundReference("");
      setRefundConfirmation("");
      setRefundConfirmed(false);
      setRefundPreview(null);
      await onChanged();
    } catch (error) {
      setRefundPreview(null);
      setRefundConfirmed(false);
      setRefundConfirmation("");
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Refund failed" });
    } finally { setLoading(false); }
  }

  const openForCheck = ["SCHEDULED", "UNPAID", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status.toUpperCase());
  const refundable = invoice.status.toUpperCase() === "PAID" && invoice.completedAmount > 0;
  if (!openForCheck && !refundable && !check) return null;

  return (
    <div className="mt-4 border-t border-[var(--line)] pt-4">
      <button type="button" aria-expanded={open} aria-controls={`payment-controls-${invoice.id}`} onClick={() => void toggle()} className="min-h-11 text-sm font-semibold text-[var(--accent-ink)] underline underline-offset-4">
        {open ? "Close payment controls" : "Manage check or refund"}
      </button>
      {open ? (
        <div id={`payment-controls-${invoice.id}`} className="mt-4 space-y-5 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
          {loading ? <p className="text-sm text-[var(--muted)]">Updating authoritative payment records…</p> : null}
          {notice ? <p role="status" className={`rounded-lg border p-3 text-sm ${notice.ok ? "border-emerald-700/20 bg-emerald-50 text-emerald-950" : "border-red-700/20 bg-red-50 text-red-900"}`}>{notice.text}</p> : null}

          {openForCheck || check ? (
            <section aria-label={`Check tracking for ${invoice.number}`}>
              <h5 className="font-semibold">Check clearing</h5>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Record only the check’s last four characters. Never enter routing or account numbers. Square must be updated separately after the bank confirms clearance.</p>
              {check ? (
                <div className="mt-3 rounded-lg border border-[var(--line)] bg-white p-3 text-sm">
                  <p><strong>{check.state.replaceAll("_", " ").toLowerCase()}</strong> · {check.maskedReference} · ${(check.amount / 100).toFixed(2)}</p>
                  <p className="mt-1 text-xs text-[var(--faint)]">Updated {new Date(check.updatedAt).toLocaleString()}</p>
                  {check.auditEntries?.length ? <ol className="mt-3 space-y-1 border-t border-[var(--line)] pt-2 text-xs text-[var(--muted)]">{check.auditEntries.slice(-8).map((entry, index) => <li key={`${entry.at}-${index}`}><strong>{entry.action.toLowerCase()}</strong> · {new Date(entry.at).toLocaleString()}{entry.actor ? ` · by ${entry.actor}` : ""}{entry.amount ? ` · $${(entry.amount / 100).toFixed(2)}` : ""}{entry.maskedReference ? ` · ${entry.maskedReference}` : ""}{entry.squarePaymentId ? ` · Square ${entry.squarePaymentId}` : ""}{entry.note ? ` · ${entry.note}` : ""}</li>)}</ol> : null}
                </div>
              ) : null}
              {check?.state === "RETURNED" && ["PAID", "PARTIALLY_PAID"].includes(invoice.status.toUpperCase()) ? <p className="mt-3 rounded-lg border border-red-800/20 bg-red-50 p-3 text-sm font-semibold text-red-950">Returned check recorded, but Square still includes the check payment. Correct the recorded payment in Square and resume collection; do not treat that amount as settled.</p> : null}
              {!check ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold">Check reference (last 2–8 characters)<input className={inputClass} value={reference} onChange={(event) => setReference(event.target.value)} maxLength={8} /></label>
                  <label className="text-xs font-semibold">Check amount<input className={inputClass} inputMode="decimal" value={checkAmount} onChange={(event) => setCheckAmount(event.target.value)} /></label>
                  <label className="text-xs font-semibold sm:col-span-2">Receipt note<input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} maxLength={140} /></label>
                  <button disabled={loading || reference.trim().length < 2 || !/^\d{1,7}(?:\.\d{1,2})?$/.test(checkAmount.trim()) || Math.round(Number(checkAmount) * 100) <= 0 || Math.round(Number(checkAmount) * 100) > outstandingCheckAmount} type="button" onClick={() => void transitionCheck("receive")} className="btn btn-secondary justify-center sm:col-span-2 disabled:opacity-50">Record check received — not paid</button>
                </div>
              ) : null}
              {check && !["RETURNED", "RECONCILED"].includes(check.state) ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold">Transition note<input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Optional bank or deposit reference" /></label>
                  <label className="block text-xs font-semibold">Type {invoice.number} for clear or reconcile<input className={inputClass} value={checkConfirmation} onChange={(event) => setCheckConfirmation(event.target.value)} /></label>
                </div>
              ) : null}
              {check && ["RETURNED", "RECONCILED"].includes(check.state) && openForCheck ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold">Next or replacement check reference (last 2–8)<input className={inputClass} value={reference} onChange={(event) => setReference(event.target.value)} maxLength={8} /></label>
                  <label className="text-xs font-semibold">Check amount<input className={inputClass} inputMode="decimal" value={checkAmount} onChange={(event) => setCheckAmount(event.target.value)} /></label>
                  <label className="text-xs font-semibold sm:col-span-2">Receipt note<input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></label>
                  <button disabled={loading || reference.trim().length < 2 || !/^\d{1,7}(?:\.\d{1,2})?$/.test(checkAmount.trim()) || Math.round(Number(checkAmount) * 100) <= 0 || Math.round(Number(checkAmount) * 100) > outstandingCheckAmount} type="button" onClick={() => void transitionCheck("receive")} className="btn btn-secondary min-h-11 justify-center sm:col-span-2 disabled:opacity-50">Record next or replacement check — not paid</button>
                </div>
              ) : null}
              {check?.state === "RECEIVED" ? <button disabled={loading} type="button" onClick={() => void transitionCheck("deposit")} className="btn btn-secondary mt-3 disabled:opacity-50">Record bank deposit</button> : null}
              {check?.state === "DEPOSITED" ? <button disabled={loading || checkConfirmation !== invoice.number} type="button" onClick={() => void transitionCheck("clear")} className="btn btn-secondary mt-3 disabled:opacity-50">Confirm bank cleared check</button> : null}
              {check?.state === "CLEARED_AWAITING_SQUARE" ? (
                <div className="mt-3 rounded-lg border border-amber-700/20 bg-amber-50 p-3 text-sm text-amber-950">
                  Record the cleared check in Square Dashboard first, then copy that transaction’s Square payment ID. Fortress verifies that exact completed external-check payment and amount; a deposit check can reconcile while the invoice balance remains due.
                  <label className="mt-3 block text-xs font-semibold">Square payment ID<input className={inputClass} value={squarePaymentId} onChange={(event) => setSquarePaymentId(event.target.value)} maxLength={192} /></label>
                  <button disabled={loading || squarePaymentId.trim().length < 8 || checkConfirmation !== invoice.number} type="button" onClick={() => void transitionCheck("reconcile")} className="btn btn-secondary mt-3 disabled:opacity-50">Verify exact Square payment and reconcile</button>
                </div>
              ) : null}
              {check && check.state !== "RETURNED" ? (
                <div className="mt-4 grid gap-3 rounded-lg border border-red-800/20 bg-red-50 p-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-red-950">Return reason<input className={inputClass} value={returnNote} onChange={(event) => setReturnNote(event.target.value)} maxLength={500} /></label>
                  <label className="text-xs font-semibold text-red-950">Type {invoice.number} to record the return<input className={inputClass} value={returnConfirmation} onChange={(event) => setReturnConfirmation(event.target.value)} /></label>
                  <button disabled={loading || returnNote.trim().length < 3 || returnConfirmation !== invoice.number} type="button" onClick={() => void transitionCheck("return")} className="btn min-h-11 justify-center !bg-red-900 !text-white disabled:opacity-40 sm:col-span-2">{check.state === "RECONCILED" ? "Record return and flag Square correction" : "Record returned check"}</button>
                </div>
              ) : null}
            </section>
          ) : null}

          {refundable ? (
            <section className="border-t border-[var(--line)] pt-4" aria-label={`Refund ${invoice.number}`}>
              <h5 className="font-semibold text-red-900">Refund review</h5>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">First verify eligibility with Square. Automated refunds are available only when one completed card payment paid the invoice in full. Deposit/balance schedules, ACH, check, cash, external, or multiple payments require a manual Square refund procedure.</p>
              <div className="mt-3 grid gap-3">
                {!refundPreview ? <button disabled={loading} type="button" onClick={() => void prepareRefund()} className="btn btn-secondary justify-center disabled:opacity-40">Check Square eligibility and exact amount</button> : (
                  <>
                    <p className="rounded-lg border border-red-800/20 bg-red-50 p-3 text-sm font-semibold text-red-950">Exact current refund: ${(refundPreview.amount / 100).toFixed(2)} {refundPreview.currency}</p>
                    <label className="text-xs font-semibold">Reason<input className={inputClass} value={refundReason} onChange={(event) => setRefundReason(event.target.value)} maxLength={140} /></label>
                    <label className="text-xs font-semibold">Unique refund reference<input className={inputClass} value={refundReference} onChange={(event) => setRefundReference(event.target.value)} placeholder="RF-2026-001" maxLength={64} /></label>
                    <label className="text-xs font-semibold">Type {invoice.number} to confirm<input className={inputClass} value={refundConfirmation} onChange={(event) => setRefundConfirmation(event.target.value)} /></label>
                    <label className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]"><input className="mt-1" type="checkbox" checked={refundConfirmed} onChange={(event) => setRefundConfirmed(event.target.checked)} />I authorize this exact ${(refundPreview.amount / 100).toFixed(2)} refund to the original card.</label>
                    <button disabled={loading || !refundConfirmed || refundConfirmation !== invoice.number || refundReason.length < 5 || refundReference.length < 4} type="button" onClick={() => void refund()} className="btn justify-center !bg-red-900 !text-white disabled:opacity-40">Issue exact full refund — ${(refundPreview.amount / 100).toFixed(2)}</button>
                  </>
                )}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type OperationsData = {
  refunds: { id: string; status: string; amount: number; reason: string; createdAt?: string }[];
  disputes: { id: string; paymentId: string; state: string; reason: string; amount: number; dueAt?: string; createdAt?: string }[];
  payments: { id: string; orderId: string; status: string; sourceType: string; amount: number; refundedAmount: number; createdAt?: string; updatedAt?: string }[];
  events: { eventId: string; type: string; resourceId?: string; eventCreatedAt?: string; receivedAt: string }[];
  warnings: string[];
};

export function PaymentRiskPanel({ refreshKey, invoices }: { refreshKey: number; invoices: Array<{ orderId: string; number: string; email: string }> }) {
  const [data, setData] = useState<OperationsData | null>(null);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  useEffect(() => {
    let active = true;
    setError("");
    void fetch("/api/internal/operations", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load payment operations");
        if (active) { setData(body); setError(""); setLoadedAt(new Date()); }
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load payment operations"); });
    return () => { active = false; };
  }, [refreshKey]);
  const attentionPayments = data?.payments.filter((payment) => ["FAILED", "PENDING"].includes(payment.status)) || [];
  if (error && !data) return <p className="mt-8 rounded-xl border border-red-700/20 bg-red-50 p-4 text-sm text-red-900">Payment operations: {error}</p>;
  return (
    <section className="mt-9" aria-labelledby="payment-operations-heading">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <h3 id="payment-operations-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-ink)]">Refunds &amp; disputes</h3>
        <span className="text-xs text-[var(--faint)]">{loadedAt ? `Updated ${loadedAt.toLocaleTimeString()}` : "Live from Square"}</span>
      </div>
      {!data ? <p className="mt-3 text-sm text-[var(--muted)]">Loading payment operations…</p> : (
        <div className="mt-3 grid gap-3">
          {error ? <p className="rounded-xl border border-amber-700/20 bg-amber-50 p-3 text-sm text-amber-950">Showing last loaded data; refresh failed: {error}</p> : null}
          {data.warnings?.map((warning) => <p key={warning} className="rounded-xl border border-amber-700/20 bg-amber-50 p-3 text-sm text-amber-950">Partial data warning: {warning}</p>)}
          <DisputeCasePanel refreshKey={refreshKey} squareDisputes={data.disputes} />
          {attentionPayments.map((payment) => { const invoice = invoices.find((item) => item.orderId === payment.orderId); return <article key={payment.id} className="rounded-xl border border-amber-700/20 bg-amber-50 p-4 text-sm text-amber-950"><strong>{payment.sourceType.replaceAll("_", " ").toLowerCase()} payment {payment.status.toLowerCase()}</strong><p className="mt-1">${(payment.amount / 100).toFixed(2)}{invoice ? ` · ${invoice.number} · ${invoice.email}` : ""}</p><p className="mt-1">{payment.status === "PENDING" ? "Do not release final work or ask the client to pay again while Square is processing this payment." : "Review the failed attempt before contacting the client or requesting another payment."}</p><p className="mt-1 break-all font-mono text-xs">{payment.id}</p></article>; })}
          {data.refunds.slice(0, 5).map((refund) => <article key={refund.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm"><strong>Refund {refund.status.toLowerCase()}</strong><p className="mt-1 text-[var(--muted)]">${(refund.amount / 100).toFixed(2)} · {refund.reason}</p></article>)}
          {data.events.slice(0, 8).map((event) => <article key={event.eventId} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs"><strong>{event.type.replaceAll("_", " ")}</strong><p className="mt-1 text-[var(--faint)]">Received {new Date(event.receivedAt).toLocaleString()}{event.resourceId ? ` · ${event.resourceId}` : ""}</p></article>)}
          {!data.disputes.length && !attentionPayments.length && !data.refunds.length && !data.events.length ? <p className="rounded-xl border border-dashed border-[var(--line-strong)] p-4 text-sm text-[var(--muted)]">No recent refunds, disputes, pending/failed payments, or webhook receipts.</p> : null}
        </div>
      )}
    </section>
  );
}
