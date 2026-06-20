import Link from "next/link";
import { KeystoneGlyph } from "@/components/brand/motifs";

/*
  ContactAside — the consultative companion to the contact form. Sets the
  response standard ("within one business day", a confirmed publishable
  service standard), gives a direct email, names who the page is for, and
  points existing clients toward the forthcoming portal. No fabricated phone
  numbers, offices, geographies, or SLAs beyond the confirmed standard.
*/

const CLIENT_SERVICE_EMAIL = "clientservice@fortresstaxadvisors.com";

const FOR: string[] = [
  "Business owners and operators weighing a consequential decision",
  "Investors and fiduciaries with positions that have grown in complexity",
  "High-net-worth families and family offices coordinating across entities",
  "Advisors and counsel looking for a tax counterpart who will hold the line",
];

export function ContactAside() {
  return (
    <div className="flex flex-col gap-8">
      {/* Response standard */}
      <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
        <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">
          <KeystoneGlyph className="h-4 w-4 text-[var(--accent)]" />
          Our response standard
        </p>
        <p className="serif mt-4 text-[1.5rem] leading-snug text-[var(--ink)]">
          A Fortress advisor replies within one business day.
        </p>
        <p className="mt-3 text-[0.92rem] leading-7 text-[var(--muted)]">
          Every inquiry is read by a senior advisor before it&rsquo;s answered —
          not triaged by a queue. If a matter is time-sensitive, say so and
          we&rsquo;ll prioritize it.
        </p>
      </div>

      {/* Direct contact */}
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--faint)]">
          Prefer email
        </p>
        <a
          href={`mailto:${CLIENT_SERVICE_EMAIL}`}
          className="link-arrow mt-3 break-all text-[0.95rem]"
        >
          {CLIENT_SERVICE_EMAIL}
          <span className="arrow" aria-hidden="true">
            &rarr;
          </span>
        </a>
        <p className="mt-3 max-w-sm text-[0.88rem] leading-7 text-[var(--muted)]">
          Reach our client service team directly. We&rsquo;ll route your note to
          the right advisor.
        </p>
      </div>

      <hr className="hairline" />

      {/* Who this is for */}
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--faint)]">
          Who this page is for
        </p>
        <ul className="mt-5 flex flex-col gap-3.5">
          {FOR.map((line) => (
            <li
              key={line}
              className="flex gap-3 text-[0.92rem] leading-7 text-[var(--muted)]"
            >
              <span
                className="mt-2.5 h-1.5 w-1.5 flex-none rotate-45 bg-[var(--accent)]"
                aria-hidden="true"
              />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <hr className="hairline" />

      {/* Existing clients / portal */}
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--faint)]">
          Already a client
        </p>
        <p className="mt-3 max-w-sm text-[0.88rem] leading-7 text-[var(--muted)]">
          Secure document workflows will move into the{" "}
          <Link href="/client-portal" className="text-[var(--accent-ink)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--accent-ink)]">
            Fortress Client Portal
          </Link>{" "}
          as that experience comes online. Until then, your advisor remains your
          direct line for account and document questions.
        </p>
      </div>
    </div>
  );
}
