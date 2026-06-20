import Link from "next/link";
import type { InsightEntry } from "@/lib/content";
import { slugify } from "@/components/insights/insights-helpers";

/*
  ArticleListItem — the editorial row that carries the archive's reading
  hierarchy. A left meta column (format, date, reading time) and a right
  content column (serif headline, dek, topic). On mobile the meta reflows
  above the headline as an inline kicker so nothing is cramped.

  Used by: the hub's recent list, browse-by-year, browse-by-topic, and the
  Tax Alerts stream. One row component keeps the newsroom feel consistent.
*/

export function ArticleListItem({
  insight,
  showTopic = true,
}: {
  insight: InsightEntry;
  /** Hide the topic tag on pages already scoped to a single topic. */
  showTopic?: boolean;
}) {
  const when = insight.published || insight.year;

  return (
    <article className="reveal border-t border-[var(--line)] last:border-b">
      <Link
        href={`/insights/${insight.slug}`}
        className="group grid items-baseline gap-x-10 gap-y-3 py-7 md:grid-cols-[12.5rem_1fr] md:py-8"
      >
        {/* Meta column — its own scannable index on desktop, a kicker on mobile */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 md:flex-col md:items-start md:gap-2.5">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--accent-ink)]">
            {insight.format}
          </span>
          <span className="text-[var(--line-strong)] md:hidden" aria-hidden="true">
            &middot;
          </span>
          <span className="tnum text-[0.78rem] font-medium text-[var(--faint)]">
            {when}
          </span>
          <span className="text-[var(--line-strong)] md:hidden" aria-hidden="true">
            &middot;
          </span>
          <span className="tnum text-[0.78rem] font-medium text-[var(--faint)]">
            {insight.readingMinutes} min read
          </span>
        </div>

        {/* Content column */}
        <div>
          <h3 className="serif text-[1.4rem] leading-[1.22] text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--accent-ink)] md:text-[1.7rem]">
            {insight.title}
          </h3>
          {insight.summary ? (
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-7 text-[var(--muted)]">
              {insight.summary}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-4">
            <span className="link-arrow">
              Read
              <span className="arrow" aria-hidden="true">
                &rarr;
              </span>
            </span>
            {showTopic ? (
              <span className="hidden items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[var(--faint)] sm:inline-flex">
                <span
                  className="h-1 w-1 rotate-45 bg-[var(--accent)]"
                  aria-hidden="true"
                />
                {insight.topic}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

/** A self-contained slug builder for topic links (kept here for co-location). */
export function topicHref(topic: string): string {
  return `/insights/topic/${slugify(topic)}`;
}
