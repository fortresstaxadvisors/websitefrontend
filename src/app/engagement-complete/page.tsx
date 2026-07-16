import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Engagement Signed",
  robots: { index: false, follow: false },
};

export default function EngagementCompletePage() {
  return (
    <>
      <Section tone="slate" tight>
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--slate-raised)] text-2xl text-[var(--accent-bright)]"
            aria-hidden="true"
          >
            ✓
          </div>
          <p className="eyebrow eyebrow--bare mt-6">Signature received</p>
          <h1 className="display mt-4 t-h1">Your engagement is underway.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[var(--on-dark-muted)]">
            Your signed agreement has been recorded. No payment was taken on
            this page.
          </p>
        </div>
      </Section>
      <Section tone="paper" tight>
        <div className="mx-auto max-w-4xl">
          <ol className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-raise)] md:grid-cols-3">
            {[
              [
                "01",
                "Completed copy",
                "DocuSeal emails the completed agreement for your records.",
              ],
              [
                "02",
                "Itemized invoice",
                "After every required signer finishes, Square emails your invoice.",
              ],
              [
                "03",
                "Choose payment",
                "Use the invoice’s secure online button or follow its check instructions.",
              ],
            ].map(([number, title, body], index) => (
              <li
                key={number}
                className={`p-6 md:p-7 ${index ? "border-t border-[var(--line)] md:border-l md:border-t-0" : ""}`}
              >
                <span className="font-mono text-xs text-[var(--accent-ink)]">
                  {number}
                </span>
                <h2 className="serif mt-3 text-xl">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--muted)]">
              If the invoice does not arrive, check your junk folder or contact
              your Fortress advisor.
            </p>
            <Button href="/payments" variant="secondary" className="mt-5" arrow>
              Review payment guidance
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
