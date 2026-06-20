import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/primitives";
import { MonogramPortrait } from "@/components/firm-identity/shared";

/*
  LeadershipPrincipal — a single principal bio card. Two-column on desktop
  (monogram portrait + bio), stacked on mobile. The MonogramPortrait owns a
  fixed aspect ratio so a real headshot swaps in later with ZERO layout change.

  TRUTHFULNESS: only confirmed principals and confirmed facts. No invented
  credentials, employers, education, or designations. Tyler is NOT a CPA — the
  CPA credential lives at the firm level only (see LeadershipCredential).

  `index` alternates the column order so the two cards mirror each other
  (portrait-left / portrait-right) — a quiet editorial rhythm, not a sequence.
*/

export type Principal = {
  name: string;
  /** Initials for the monogram (used until a headshot is supplied). */
  initials: string;
  title: string;
  /** Bio paragraphs. */
  bio: ReactNode[];
  /** A short "focus" ledger — what this principal owns at the firm. */
  focus: string[];
  /** Optional tracked-caps line under the focus list. */
  note?: ReactNode;
};

export function LeadershipPrincipal({
  principal,
  index,
}: {
  principal: Principal;
  index: number;
}) {
  const portraitRight = index % 2 === 1;

  return (
    <article className="grid items-start gap-8 md:grid-cols-[0.85fr_1.15fr] md:gap-12 lg:gap-16">
      {/* Portrait column — order flips on alternating cards (desktop only). */}
      <div
        className={`mx-auto w-full max-w-[20rem] md:mx-0 ${
          portraitRight ? "md:order-2 md:max-w-[22rem]" : "md:max-w-[22rem]"
        }`}
      >
        <MonogramPortrait initials={principal.initials} />
      </div>

      {/* Bio column. */}
      <div className={portraitRight ? "md:order-1" : ""}>
        <h2 className="serif t-h2 text-[var(--ink)]">{principal.name}</h2>
        <p className="mt-3 text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-ink)]">
          {principal.title}
        </p>

        <div className="measure mt-7 space-y-5 text-[var(--muted)] md:text-[1.05rem] md:leading-[1.7]">
          {principal.bio.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="mt-8 border-t border-[var(--line)] pt-6">
          <Eyebrow bare>Focus</Eyebrow>
          <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {principal.focus.map((f) => (
              <li key={f} className="flex items-baseline gap-3 leading-7">
                <span
                  aria-hidden="true"
                  className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--accent)]"
                />
                <span className="text-[0.95rem] text-[var(--ink)]">{f}</span>
              </li>
            ))}
          </ul>
          {principal.note ? (
            <p className="mt-5 text-sm leading-7 text-[var(--faint)] italic">
              {principal.note}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
