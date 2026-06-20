import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/primitives";
import { Reveal } from "@/components/reveal";
import { AshlarField, KeystoneGlyph } from "@/components/brand/motifs";

/*
  Shared firm-identity building blocks (About / Leadership / Careers).

  These pages are deliberately QUIETER than the homepage (per
  page-art-direction.md: "judgment and method over personality theater").
  So there is no animated signature hero here — instead a restrained
  editorial masthead and a headshot-ready monogram portrait.

  Owned by W1-Firm-Identity. Unique filenames; not in components/firm/*.
*/

/**
 * FirmPageHero — the restrained page masthead used by all three firm-identity
 * pages. A left-weighted editorial lockup on paper with a faint ashlar wash and
 * a single keystone tick. No animated elevation (that signature belongs to the
 * homepage); this is the institutional, "documents" register.
 */
export function FirmPageHero({
  eyebrow,
  title,
  lede,
  meta,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  /** Optional small tracked-caps line beneath the lede (e.g. a credential). */
  meta?: ReactNode;
}) {
  return (
    <section className="band band-paper relative isolate overflow-hidden">
      <AshlarField
        className="pointer-events-none absolute inset-0 -z-10 text-[var(--ink)]"
        opacity={0.04}
      />
      <div className="shell pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="max-w-3xl">
          <Reveal>
            <div className="flex items-center gap-3">
              <KeystoneGlyph className="h-4 w-4 text-[var(--accent)]" />
              <Eyebrow bare>{eyebrow}</Eyebrow>
            </div>
            <h1 className="display mt-6 t-h1 text-[var(--ink)]">{title}</h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="lede mt-7 max-w-2xl text-[1.15rem] leading-8 text-[var(--muted)] md:text-[1.25rem]">
              {lede}
            </p>
            {meta ? (
              <p className="mt-7 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">
                {meta}
              </p>
            ) : null}
          </Reveal>
        </div>
      </div>
      <div className="shell">
        <hr className="rule-coursing" />
      </div>
    </section>
  );
}

/**
 * MonogramPortrait — a no-photo leadership card surface, built to swap in a
 * real headshot later with ZERO layout change. It owns a fixed aspect ratio
 * (the same a portrait will occupy), a quiet slate-raised ground, ashlar
 * coursing, and a serif monogram with a dimension tick — so the empty state
 * reads as intentional, not as a missing image.
 *
 * To swap in a photo later: drop an <Image fill> (or <img>) inside, remove the
 * monogram layer. The frame and ratio stay identical, so the grid does not move.
 */
export function MonogramPortrait({
  initials,
  className = "",
}: {
  initials: string;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--slate-raised)] ${className}`}
    >
      {/* faint ashlar coursing — the "stone" reading */}
      <AshlarField
        className="pointer-events-none absolute inset-0 text-[var(--on-dark)]"
        opacity={0.05}
      />
      {/* a recessed brass keyline frame */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-[10px] border border-[color-mix(in_srgb,var(--accent-bright)_28%,transparent)]"
      />
      {/* the monogram — a locked keystone over serif initials */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <KeystoneGlyph className="h-6 w-6 text-[var(--accent-bright)] opacity-80" />
        <span className="serif mt-3 text-[2.9rem] leading-none tracking-[0.04em] text-[var(--on-dark)] md:text-[3.4rem]">
          {initials}
        </span>
        <span
          aria-hidden="true"
          className="mt-4 h-px w-10 bg-[var(--accent-bright)] opacity-50"
        />
      </div>
      {/* a small "drawing" corner tick, bottom-right, for the technical register */}
      <span
        aria-hidden="true"
        className="absolute bottom-3 right-3 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[var(--on-dark-muted)] opacity-70"
      >
        Portrait
      </span>
    </div>
  );
}

/**
 * QuietStatement — a centered, restrained pull-statement band component used to
 * give the firm pages a single confident "voice" moment without a loud hero.
 * Renders inside a Section; the caller picks the band tone.
 */
export function QuietStatement({
  eyebrow,
  children,
  attribution,
}: {
  eyebrow?: string;
  children: ReactNode;
  attribution?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <Eyebrow className="eyebrow--center justify-center">{eyebrow}</Eyebrow>
      ) : null}
      <p className="serif mt-6 text-[1.5rem] leading-[1.42] text-[var(--ink)] md:text-[2rem]">
        {children}
      </p>
      {attribution ? (
        <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">
          {attribution}
        </p>
      ) : null}
    </div>
  );
}
