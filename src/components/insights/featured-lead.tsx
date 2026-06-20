import Link from "next/link";
import type { InsightEntry } from "@/lib/content";
import { CoursingCorner } from "@/components/brand/motifs";

/*
  FeaturedLead — the hub's lead story. A large editorial lockup: format kicker
  + date, an oversized serif headline, the dek, a clean meta line, and a read
  link. A faint drawing-corner motif anchors the right side so the panel reads
  as "the front page", not a generic hero. Designed on a `surface` band.
*/

export function FeaturedLead({ insight }: { insight: InsightEntry }) {
  const when = insight.published || insight.year;

  return (
    <article className="relative">
      <Link href={`/insights/${insight.slug}`} className="group block">
        <div className="grid gap-x-12 gap-y-6 md:grid-cols-[1fr_auto] md:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-ink)]">
                {insight.format}
              </span>
              <span className="text-[var(--line-strong)]" aria-hidden="true">
                ·
              </span>
              <span className="tnum text-[0.78rem] font-medium text-[var(--faint)]">
                {when}
              </span>
              <span className="text-[var(--line-strong)]" aria-hidden="true">
                ·
              </span>
              <span className="tnum text-[0.78rem] font-medium text-[var(--faint)]">
                {insight.readingMinutes} min read
              </span>
            </div>

            <h2 className="display mt-5 text-[2.1rem] leading-[1.04] text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--accent-ink)] sm:text-[2.6rem] md:text-[3.1rem]">
              {insight.title}
            </h2>

            {insight.summary ? (
              <p className="lede mt-6 max-w-2xl text-[1.1rem] leading-8 text-[var(--muted)]">
                {insight.summary}
              </p>
            ) : null}

            <div className="mt-7 flex items-center gap-4">
              <span className="link-arrow !text-[0.86rem]">
                Read the full analysis
                <span className="arrow" aria-hidden="true">
                  &rarr;
                </span>
              </span>
              <span className="hidden items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[var(--faint)] sm:inline-flex">
                <span
                  className="h-1 w-1 rotate-45 bg-[var(--accent)]"
                  aria-hidden="true"
                />
                {insight.topic}
              </span>
            </div>
          </div>

          <CoursingCorner className="hidden h-20 w-20 self-start text-[var(--accent)] md:block" />
        </div>
      </Link>
    </article>
  );
}
