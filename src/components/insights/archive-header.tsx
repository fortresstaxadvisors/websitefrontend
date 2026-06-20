import Link from "next/link";
import type { ReactNode } from "react";
import { SectionOpener } from "@/components/brand/motifs";

/*
  ArchiveHeader — the shared masthead for scoped archive views (browse by
  year, browse by topic, the Tax Alerts stream). A back link to the hub, the
  keystone opener, an eyebrow, the display title, an optional dek, and a count.
  Keeps the three browse pages visually of-a-piece with the hub.
*/

export function ArchiveHeader({
  eyebrow,
  title,
  dek,
  count,
  countNoun = "piece",
  backHref = "/insights",
  backLabel = "All Insights",
}: {
  eyebrow: string;
  title: ReactNode;
  dek?: ReactNode;
  count: number;
  countNoun?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="reveal">
      <Link href={backHref} className="link-arrow">
        <span className="arrow rotate-180" aria-hidden="true">
          &rarr;
        </span>
        {backLabel}
      </Link>

      <SectionOpener className="mt-8 mb-5" />
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-4 t-h1 text-[var(--ink)]">{title}</h1>

      {dek ? (
        <p className="lede mt-6 max-w-2xl text-[var(--muted)]">{dek}</p>
      ) : null}

      <p className="tnum mt-6 text-[0.8rem] font-medium uppercase tracking-[0.16em] text-[var(--faint)]">
        {count} {count === 1 ? countNoun : `${countNoun}s`} in this view
      </p>
    </header>
  );
}
