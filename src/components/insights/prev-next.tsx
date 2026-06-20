import Link from "next/link";
import type { InsightEntry } from "@/lib/content";

/*
  PrevNext — chronological neighbors within the archive (newest-first order).
  "Newer" is the previous entry in the sorted list, "Older" the next. Renders a
  two-up hairline-framed pager; collapses gracefully when a neighbor is absent.
*/

function PagerLink({
  insight,
  direction,
}: {
  insight: InsightEntry;
  direction: "newer" | "older";
}) {
  const isNewer = direction === "newer";
  return (
    <Link
      href={`/insights/${insight.slug}`}
      className={`group flex flex-col gap-2 py-1 ${
        isNewer ? "items-start text-left" : "items-end text-right"
      }`}
    >
      <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
        {isNewer ? (
          <>
            <span
              className="transition-transform duration-300 group-hover:-translate-x-1"
              aria-hidden="true"
            >
              &larr;
            </span>
            Newer
          </>
        ) : (
          <>
            Older
            <span
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </>
        )}
      </span>
      <span className="serif max-w-xs text-[1.05rem] leading-snug text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--accent-ink)]">
        {insight.title}
      </span>
    </Link>
  );
}

export function PrevNext({
  newer,
  older,
}: {
  newer?: InsightEntry;
  older?: InsightEntry;
}) {
  if (!newer && !older) return null;

  return (
    <nav
      aria-label="Archive navigation"
      className="grid grid-cols-2 gap-6 border-t border-[var(--line)] pt-8"
    >
      <div>{newer ? <PagerLink insight={newer} direction="newer" /> : null}</div>
      <div className="flex justify-end">
        {older ? <PagerLink insight={older} direction="older" /> : null}
      </div>
    </nav>
  );
}
