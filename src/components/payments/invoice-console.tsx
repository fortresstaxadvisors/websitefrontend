"use client";

import { useCallback, useEffect, useState } from "react";

type InvoiceSummary = { id: string; number: string; status: string; title: string; email: string; amount: number; dueDate?: string; publicUrl?: string; updatedAt?: string };
type EngagementSummary = { id: number; name: string; status: string; email: string; createdAt?: string; completedAt?: string };

export function InvoiceConsole() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [engagements, setEngagements] = useState<EngagementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const load = useCallback(async () => { setLoading(true); try { const [invoiceResponse, engagementResponse] = await Promise.all([fetch("/api/internal/invoices", { cache: "no-store" }), fetch("/api/internal/engagements", { cache: "no-store" })]); const invoiceData = await invoiceResponse.json(); const engagementData = await engagementResponse.json(); if (!invoiceResponse.ok) throw new Error(invoiceData.error); if (!engagementResponse.ok) throw new Error(engagementData.error); setInvoices(invoiceData.invoices); setEngagements(engagementData.engagements); } catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not load billing workflow" }); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage(null);
    try { const response = await fetch("/api/internal/engagements", { method: "POST", body: new FormData(event.currentTarget) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Engagement creation failed"); setMessage({ ok: true, text: `Engagement ${data.invoiceNumber} was sent for signature. Square will issue the invoice only after every required signer completes it.` }); event.currentTarget.reset(); await load(); }
    catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : "Engagement creation failed" }); }
    finally { setSubmitting(false); }
  }

  const input = "mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm outline-none focus:border-[var(--accent-ink)]";
  return <div className="grid gap-10 py-10 xl:grid-cols-[1.05fr_0.95fr]">
    <form onSubmit={submit} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-raise)] md:p-8">
      <h2 className="display text-2xl">Create engagement</h2><p className="mt-2 text-sm text-[var(--muted)]">DocuSeal sends the approved agreement first. After all signatures are complete, the signed PDF automatically gates creation and email delivery of the Square invoice.</p>
      <fieldset className="mt-7 grid gap-5 md:grid-cols-2"><legend className="col-span-full mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">Client</legend>
        <label className="text-sm font-semibold">First name<input name="givenName" required className={input} /></label><label className="text-sm font-semibold">Last name<input name="familyName" required className={input} /></label>
        <label className="text-sm font-semibold">Email<input name="email" required type="email" className={input} /></label><label className="text-sm font-semibold">Phone<input name="phone" type="tel" placeholder="Optional" className={input} /></label>
        <label className="text-sm font-semibold md:col-span-2">Company or entity<input name="company" className={input} /></label>
      </fieldset>
      <fieldset className="mt-8 grid gap-5 md:grid-cols-2"><legend className="col-span-full mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">Invoice</legend>
        <label className="text-sm font-semibold">Invoice number<input name="invoiceNumber" required placeholder="FTA-2026-001" className={input} /></label><label className="text-sm font-semibold">Due date<input name="dueDate" required type="date" className={input} /></label>
        <label className="text-sm font-semibold md:col-span-2">Invoice title<input name="title" required placeholder="2026 Tax Advisory Services" className={input} /></label>
        <label className="text-sm font-semibold md:col-span-2">Detailed scope<textarea name="description" required minLength={20} rows={4} className={input} placeholder="Describe the engagement, covered period, and deliverables clearly." /></label>
        <label className="text-sm font-semibold md:col-span-2">Line items <span className="font-normal text-[var(--faint)]">— one per line: description | amount</span><textarea name="lineItems" required rows={5} className={input} placeholder={"2026 business return preparation | 3500.00\nQuarterly advisory retainer | 1500.00"} /></label>
        <label className="text-sm font-semibold">Deposit percentage<input name="depositPercent" type="number" min="0" max="90" step="1" placeholder="0" className={input} /></label><label className="text-sm font-semibold">Deposit due date<input name="depositDueDate" type="date" className={input} /></label>
      </fieldset>
      <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"><input name="confirmed" value="yes" required type="checkbox" className="mt-1.5 h-4 w-4" /><span>I reviewed the client, scope, line items, amount, and due dates and authorize DocuSeal to send the approved engagement agreement. I understand Square will invoice automatically after all required signatures.</span></label>
      {message && <div role="status" className={`mt-5 rounded-lg p-4 text-sm ${message.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}>{message.text}{message.url && <> <a href={message.url} target="_blank" rel="noreferrer" className="font-semibold underline">Open invoice</a></>}</div>}
      <button disabled={submitting} className="mt-6 rounded-full bg-[var(--slate)] px-6 py-3 font-semibold text-[var(--on-dark)] disabled:opacity-50">{submitting ? "Creating signature workflow…" : "Send engagement for signature"}</button>
    </form>
    <section><div className="flex items-center justify-between"><div><h2 className="display text-2xl">Workflow status</h2><p className="mt-1 text-sm text-[var(--muted)]">Live signatures from DocuSeal and invoices from Square.</p></div><button onClick={() => void load()} className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold">Refresh</button></div>
      <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">Engagements</h3><div className="mt-3 space-y-3">{loading ? <p className="text-sm text-[var(--muted)]">Loading DocuSeal engagements…</p> : engagements.length ? engagements.map((engagement) => <article key={engagement.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-5"><div className="flex items-start justify-between gap-4"><div><h4 className="font-semibold">{engagement.name}</h4><p className="mt-1 text-sm text-[var(--muted)]">{engagement.email}</p></div><span className="rounded-full bg-[var(--paper-deep)] px-3 py-1 text-xs font-semibold">{engagement.status}</span></div></article>) : <p className="rounded-lg border border-[var(--line)] p-5 text-sm text-[var(--muted)]">No DocuSeal engagements yet.</p>}</div>
      <h3 className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">Square invoices</h3>
      <div className="mt-6 space-y-3">{loading ? <p className="text-sm text-[var(--muted)]">Loading Square invoices…</p> : invoices.length ? invoices.map((invoice) => <article key={invoice.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">{invoice.number}</p><h3 className="mt-1 font-semibold">{invoice.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{invoice.email}</p></div><span className="rounded-full bg-[var(--paper-deep)] px-3 py-1 text-xs font-semibold">{invoice.status}</span></div><div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4 text-sm"><span>{(invoice.amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}{invoice.dueDate ? ` · due ${invoice.dueDate}` : ""}</span>{invoice.publicUrl && <a href={invoice.publicUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-ink)] underline">Open</a>}</div></article>) : <p className="rounded-lg border border-[var(--line)] p-5 text-sm text-[var(--muted)]">No invoices returned by Square.</p>}</div>
    </section>
  </div>;
}
