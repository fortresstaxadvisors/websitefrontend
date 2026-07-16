import type { Metadata } from "next";
import { InvoiceConsole } from "@/components/payments/invoice-console";

export const metadata: Metadata = { title: "Engagement & Billing Console", robots: { index: false, follow: false } };

export default function InvoiceConsolePage() {
  return <main className="min-h-screen bg-[var(--paper)] py-12"><div className="shell"><div className="flex flex-col gap-3 border-b border-[var(--line)] pb-8 md:flex-row md:items-end md:justify-between"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">Private operations</p><h1 className="display mt-2 text-4xl">Engagement &amp; billing console</h1></div><p className="max-w-xl text-sm text-[var(--muted)]">Create the engagement, collect every required signature, issue the Square invoice, and monitor both systems from one controlled workflow.</p></div><InvoiceConsole /></div></main>;
}
