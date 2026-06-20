import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/primitives";
import { Reveal } from "@/components/reveal";
import { SectionOpener } from "@/components/brand/motifs";

/*
  ConversionHero — a shared, restrained page header for the firm conversion
  pages (Contact / Consultation / Client Portal / Newsroom). Wave-0 ships a
  module-level SectionHeader and a bespoke HomeHero, but no general page hero,
  so this gives the four pages a coherent masthead without duplicating markup.

  It is a content block, not a band — the page wraps it in a <Section> so the
  tone (light/dark) is the page's choice and all colors inherit correctly.
*/

export function ConversionHero({
  eyebrow,
  title,
  lede,
  meta,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Optional small line under the lede (e.g. response standard). */
  meta?: ReactNode;
}) {
  return (
    <div className="hero-load max-w-3xl">
      <Reveal>
        <div data-seq="1">
          <SectionOpener className="mb-6" />
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      </Reveal>
      <Reveal>
        <h1
          data-seq="2"
          className="display mt-5 text-[var(--ink)] t-display"
          style={{ fontSize: "clamp(2.4rem, 1.5rem + 3.6vw, 4.4rem)" }}
        >
          {title}
        </h1>
      </Reveal>
      {lede ? (
        <Reveal>
          <p
            data-seq="3"
            className="lede mt-6 max-w-2xl text-[1.15rem] leading-8 text-[var(--muted)]"
          >
            {lede}
          </p>
        </Reveal>
      ) : null}
      {meta ? (
        <Reveal>
          <div data-seq="4" className="mt-8">
            {meta}
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
