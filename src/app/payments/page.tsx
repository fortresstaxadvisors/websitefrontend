import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Secure Payment",
  description: "Payment guidance for Fortress Tax Advisors clients.",
  robots: { index: false, follow: false },
};

export default function PaymentsPage() {
  return (
    <>
      <Section tone="slate" tight>
        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow">Secure client payment</p>
            <h1 className="display mt-4 t-h1">
              Pay the amount you reviewed and approved.
            </h1>
          </div>
          <p className="max-w-xl text-[var(--on-dark-muted)] lg:justify-self-end">
            Fortress does not use an open payment form. Your secure payment
            options appear on the itemized Square invoice sent to your verified
            email address.
          </p>
        </div>
      </Section>
      <Section tone="paper" tight>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-raise)] md:p-8">
              <span className="font-mono text-xs text-[var(--accent-ink)]">
                OPTION 01
              </span>
              <h2 className="display mt-4 text-3xl">Pay online</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Open the itemized Square invoice in your email and select its
                secure payment button. Card payment and, when shown, bank
                payment are processed by Square.
              </p>
              <ul className="mt-6 space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
                <li className="flex gap-3">
                  <span className="text-[var(--accent-ink)]">✓</span>
                  Confirm the Fortress invoice number and total.
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent-ink)]">✓</span>
                  Pay only through the Square-hosted invoice page.
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent-ink)]">✓</span>
                  Keep Square&apos;s emailed receipt for your records.
                </li>
              </ul>
            </article>
            <article className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-raise)] md:p-8">
              <span className="font-mono text-xs text-[var(--accent-ink)]">
                OPTION 02
              </span>
              <h2 className="display mt-4 text-3xl">Pay by check</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Follow the remittance instructions provided on your invoice.
                Include the invoice number so the payment can be matched to the
                correct engagement.
              </p>
              <ul className="mt-6 space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
                <li className="flex gap-3">
                  <span className="text-[var(--accent-ink)]">✓</span>
                  Make the check payable exactly as instructed.
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent-ink)]">✓</span>
                  Write the invoice number on the memo line.
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent-ink)]">✓</span>
                  Allow time for delivery and account reconciliation.
                </li>
              </ul>
            </article>
          </div>

          <aside className="mt-8 grid gap-6 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper-deep)] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <p className="eyebrow">Before you pay</p>
              <h2 className="serif mt-3 text-2xl">
                Does the invoice look unfamiliar or incorrect?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Do not submit payment. Contact Fortress so your advisor can
                verify the invoice, correct the scope or amount, or resend it
                securely.
              </p>
            </div>
            <Button href="/contact" variant="secondary" arrow>
              Contact Fortress
            </Button>
          </aside>
        </div>
      </Section>
    </>
  );
}
