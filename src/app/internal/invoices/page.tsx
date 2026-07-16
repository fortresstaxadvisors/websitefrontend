import type { Metadata } from "next";
import { InvoiceConsole } from "@/components/payments/invoice-console";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Engagement & Billing Console",
  robots: { index: false, follow: false },
};

export default function InvoiceConsolePage() {
  return (
    <>
      <Section tone="slate" tight as="header">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="eyebrow">Private operations</p>
            <h1 className="display mt-4 t-h1">
              Engagement &amp; billing console
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[var(--on-dark-muted)] lg:justify-self-end">
            Prepare one client record, send the engagement for signature, and
            let the approved agreement release the itemized Square invoice.
          </p>
        </div>
        <ol
          className="mt-9 grid border-y border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Billing workflow"
        >
          {[
            ["01", "Prepare", "Confirm client and scope"],
            ["02", "Sign", "DocuSeal collects approval"],
            ["03", "Invoice", "Square emails the bill"],
            ["04", "Reconcile", "Track payment status"],
          ].map(([number, title, detail]) => (
            <li
              key={number}
              className="flex gap-3 border-[var(--line)] py-4 pr-4 sm:odd:border-r lg:border-r lg:last:border-r-0 lg:pl-4 lg:first:pl-0"
            >
              <span className="font-mono text-xs text-[var(--accent-bright)]">
                {number}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--on-dark)]">
                  {title}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--on-dark-muted)]">
                  {detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Section>
      <Section tone="paper" tight>
        <InvoiceConsole />
      </Section>
    </>
  );
}
