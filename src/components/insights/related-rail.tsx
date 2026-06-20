import Link from "next/link";
import type {
  InsightEntry,
  ServiceEntry,
  IndustryEntry,
} from "@/lib/content";
import { metaLine } from "@/components/insights/insights-helpers";

/*
  RelatedRail — the authority-linking block at the foot of an article. Three
  related rails fed by @/lib/relations: related insights (same topic), and the
  services / industries Fortress connects to the piece. Quiet, hairline-ruled,
  consistent with the card system. Each sub-rail renders only if it has items.
*/

function RailHeading({ children }: { children: string }) {
  return (
    <h2 className="eyebrow eyebrow--bare !text-[var(--faint)]">{children}</h2>
  );
}

export function RelatedRail({
  related,
  services,
  industries,
}: {
  related: InsightEntry[];
  services: ServiceEntry[];
  industries: IndustryEntry[];
}) {
  const hasWork = services.length > 0 || industries.length > 0;
  if (related.length === 0 && !hasWork) return null;

  return (
    <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
      {/* Related insights */}
      {related.length > 0 ? (
        <section className="reveal">
          <RailHeading>Related insights</RailHeading>
          <ul className="mt-5">
            {related.map((insight) => (
              <li key={insight.slug}>
                <Link
                  href={`/insights/${insight.slug}`}
                  className="group block border-t border-[var(--line)] py-5 last:border-b"
                >
                  <span className="tnum text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[var(--faint)]">
                    {insight.format} &middot; {metaLine(insight)}
                  </span>
                  <span className="serif mt-2 block text-[1.2rem] leading-snug text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--accent-ink)] md:text-[1.35rem]">
                    {insight.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Related work (services + industries) */}
      {hasWork ? (
        <section className="reveal">
          <RailHeading>Where this connects</RailHeading>

          {services.length > 0 ? (
            <ul className="mt-5 space-y-px bg-[var(--line-soft)]">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="group flex items-center justify-between gap-4 bg-[var(--paper)] px-4 py-3.5 transition-colors duration-300 hover:bg-[var(--surface)]"
                  >
                    <span className="text-[0.95rem] font-medium text-[var(--ink)]">
                      {service.title}
                    </span>
                    <span
                      className="text-[var(--accent-ink)] transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {industries.length > 0 ? (
            <div className="mt-5">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
                For
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <li key={industry.slug}>
                    <Link
                      href={`/industries/${industry.slug}`}
                      className="inline-flex items-center rounded-full border border-[var(--line)] px-3 py-1.5 text-[0.78rem] font-medium text-[var(--muted)] transition-colors duration-300 hover:border-[var(--ink)] hover:text-[var(--ink)]"
                    >
                      {industry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
