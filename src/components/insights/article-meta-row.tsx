import Link from "next/link";
import type { InsightEntry } from "@/lib/content";
import { slugify } from "@/components/insights/insights-helpers";

/*
  ArticleMetaRow — the masthead meta line under an article's dek. Renders the
  originally-published date, reading time, and a linked topic, separated by
  hairline dividers. Reflows to wrap comfortably on mobile. The year and topic
  are real links into the archive's browse views.
*/

function Divider() {
  return (
    <span
      className="h-3.5 w-px bg-[var(--line-strong)]"
      aria-hidden="true"
    />
  );
}

export function ArticleMetaRow({ insight }: { insight: InsightEntry }) {
  const when = insight.published || insight.year;
  const hasYear = /^\d{4}$/.test(insight.year);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-[0.82rem] text-[var(--muted)]">
      <span className="flex items-center gap-2">
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
          Originally published
        </span>
        <span className="tnum font-medium text-[var(--ink)]">
          {hasYear ? (
            <Link
              href={`/insights/year/${insight.year}`}
              className="underline-offset-4 transition-colors hover:text-[var(--accent-ink)] hover:underline"
            >
              {when}
            </Link>
          ) : (
            when
          )}
        </span>
      </span>

      <Divider />

      <span className="tnum font-medium">{insight.readingMinutes} min read</span>

      <Divider />

      <Link
        href={`/insights/topic/${slugify(insight.topic)}`}
        className="font-medium text-[var(--accent-ink)] underline-offset-4 transition-colors hover:underline"
      >
        {insight.topic}
      </Link>
    </div>
  );
}
