import Link from "next/link";
import { slugify, topicBlurb } from "@/components/insights/insights-helpers";

/*
  BrowseRail — the archive's discovery surface for the hub. Two columns:
  Browse by Year (a tabular index of years with article counts) and Browse by
  Topic (the four clusters with a one-line framing each). Both read as a real
  archive index rather than decorative chips.
*/

type Counted = { value: string; count: number };

export function BrowseRail({
  years,
  topics,
}: {
  years: Counted[];
  topics: Counted[];
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      {/* Browse by Year */}
      <div className="reveal">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="serif text-[1.5rem] text-[var(--ink)]">
            Browse by Year
          </h3>
          <span className="tnum text-[0.78rem] font-medium text-[var(--faint)]">
            2021&ndash;{years[0]?.value ?? "2025"}
          </span>
        </div>
        <ul className="mt-6">
          {years.map(({ value, count }) => (
            <li key={value}>
              <Link
                href={`/insights/year/${value}`}
                className="group flex items-baseline justify-between gap-4 border-t border-[var(--line)] py-4 last:border-b"
              >
                <span className="index-num text-[1.4rem] text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--accent-ink)]">
                  {value}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tnum text-[0.82rem] text-[var(--muted)]">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </span>
                  <span
                    className="text-[var(--accent-ink)] transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Browse by Topic */}
      <div className="reveal">
        <h3 className="serif text-[1.5rem] text-[var(--ink)]">
          Browse by Topic
        </h3>
        <ul className="mt-6 grid gap-px bg-[var(--line-soft)] sm:grid-cols-2">
          {topics.map(({ value, count }) => (
            <li key={value}>
              <Link
                href={`/insights/topic/${slugify(value)}`}
                className="group flex h-full flex-col bg-[var(--paper)] p-5 transition-colors duration-300 hover:bg-[var(--surface)]"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="serif text-[1.15rem] leading-tight text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--accent-ink)]">
                    {value}
                  </span>
                  <span className="tnum text-[0.72rem] font-medium text-[var(--faint)]">
                    {count}
                  </span>
                </span>
                <span className="mt-2.5 text-[0.84rem] leading-6 text-[var(--muted)]">
                  {topicBlurb(value)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
