import Image from "next/image";
import Link from "next/link";
import { footerColumns } from "@/lib/nav";
import { KeystoneGlyph, AshlarField } from "@/components/brand/motifs";

/*
  Authority footer — Slate & Brass. Full nav taxonomy, "Built to Hold."
  brand lockup, advisory disclaimer. Truthful: no fabricated office,
  geography, headcount, or client claims. Method-over-personality framing.
*/

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="band band-slate-deep relative isolate mt-auto overflow-hidden">
      <AshlarField
        className="pointer-events-none absolute inset-0 -z-10 text-[var(--on-dark)]"
        opacity={0.05}
      />

      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] md:gap-10">
          {/* Brand lockup + posture */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3.5">
              <Image
                src="/fortress-mark.svg"
                alt=""
                width={42}
                height={42}
                className="h-10 w-10"
              />
              <span className="leading-none">
                <span className="serif block text-[1.3rem] font-semibold tracking-[0.06em] text-[var(--on-dark)]">
                  FORTRESS
                </span>
                <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.36em] text-[var(--on-dark-muted)]">
                  Tax Advisors
                </span>
              </span>
            </div>
            <p className="mt-6 text-sm leading-7 text-[var(--on-dark-muted)]">
              Senior-led tax advisory for businesses, investors, and fiduciaries
              managing genuine complexity. Founded in 2021 and built for the
              environment in which it has practiced ever since.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-[var(--accent-bright)]">
              <KeystoneGlyph className="h-4 w-4" />
              <span className="serif text-lg">Built to Hold.</span>
            </p>
          </div>

          {footerColumns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--on-dark-muted)]">
                {col.heading}
              </h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--on-dark)]/80 transition-colors hover:text-[var(--on-dark)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <hr className="mt-14 mb-6 h-px border-0 bg-[var(--line-on-dark)]" />

        <div className="flex flex-col gap-4 text-xs leading-6 text-[var(--on-dark-muted)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>&copy; {year} Fortress Tax Advisors. All rights reserved.</span>
            <Link href="/privacy" className="transition-colors hover:text-[var(--on-dark)]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--on-dark)]">
              Terms
            </Link>
          </div>
          <p className="max-w-xl md:text-right">
            Content on this site is provided for general information and does not
            constitute tax, legal, or accounting advice. Engagements are scoped
            individually.
          </p>
        </div>
      </div>
    </footer>
  );
}
