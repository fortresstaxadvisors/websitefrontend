import Link from "next/link";
import { SectionHeader, Eyebrow, ArrowLink } from "@/components/ui/primitives";
import { ServiceCard, ArticleCard } from "@/components/ui/card";
import { Reveal, RevealGroup } from "@/components/reveal";
import { KeystoneGlyph, SectionOpener } from "@/components/brand/motifs";
import { getIndustries } from "@/lib/content";
import {
  insightsForIndustry,
  servicesForIndustry,
} from "@/lib/relations";
import type { IndustryPoint } from "@/components/industries/industry-data";

/*
  Industries — page-specific section components. Composes only Wave-0
  primitives and tokens. Each section is band-tone agnostic: it inherits
  light/dark semantics from the enclosing <Section tone>.
*/

/* ------------------------------------------------------------------ */
/* HUB                                                                  */
/* ------------------------------------------------------------------ */

/**
 * The hub's industry index. Editorial rows (not decorative-numbered — these
 * are a set, not a sequence) with the sector dek and a sector-pressure cue.
 */
export function IndustryIndex({
  cues,
}: {
  /** slug → short "where tax bites" cue, surfaced under each row. */
  cues: Record<string, string>;
}) {
  const industries = getIndustries();

  return (
    <RevealGroup as="ul" className="flex flex-col">
      {industries.map((industry) => (
        <li key={industry.slug} className="reveal">
          <Link
            href={`/industries/${industry.slug}`}
            className="group grid grid-cols-[1fr_auto] items-start gap-6 border-t border-[var(--line)] py-8 last:border-b md:gap-10 md:py-10"
          >
            <span className="grid gap-4 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
              <span>
                <span className="flex items-center gap-3">
                  <KeystoneGlyph className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <span className="serif block text-[1.6rem] leading-tight text-[var(--ink)] md:text-[2.05rem]">
                    {industry.title}
                  </span>
                </span>
                <span className="mt-3 block max-w-xl text-[0.95rem] leading-7 text-[var(--muted)]">
                  {industry.summary}
                </span>
              </span>
              {cues[industry.slug] ? (
                <span className="flex md:justify-end">
                  <span className="block max-w-sm border-l border-[var(--line)] pl-5 text-[0.85rem] leading-6 text-[var(--faint)] md:text-right md:border-l-0 md:border-r md:pl-0 md:pr-5">
                    <span className="mb-1.5 block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)]">
                      Where tax bites
                    </span>
                    {cues[industry.slug]}
                  </span>
                </span>
              ) : null}
            </span>
            <span
              className="self-center pt-1 text-[var(--accent-ink)] transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </Link>
        </li>
      ))}
    </RevealGroup>
  );
}

/** The hub's cross-link to Services — a quiet bridge between the two axes. */
export function ServicesBridge() {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
      <div className="max-w-xl">
        <SectionOpener className="mb-5" />
        <Eyebrow>The Other Axis</Eyebrow>
        <h2 className="display mt-4 t-h2 text-[var(--ink)]">
          Industry frames the question. <em>Services</em> answer it.
        </h2>
        <p className="lede mt-5 text-[var(--muted)]">
          Sector tells us where the rules bite. The work itself runs through the
          same disciplined practice — strategy, compliance, and coordination —
          regardless of the industry it serves.
        </p>
      </div>
      <div className="md:pb-2">
        <ArrowLink href="/services">View all services</ArrowLink>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DETAIL                                                               */
/* ------------------------------------------------------------------ */

/**
 * "Where tax changes the answer" — the sector pressure points. A real list of
 * issues (not a process), so no decorative numerals. Keystone bullets tie it
 * to the brand system.
 */
export function PressurePoints({ points }: { points: IndustryPoint[] }) {
  return (
    <RevealGroup
      as="ul"
      className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2"
    >
      {points.map((point) => (
        <li
          key={point.label}
          className="reveal flex flex-col bg-[var(--surface)] p-6 md:p-7"
        >
          <KeystoneGlyph className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="serif mt-4 text-[1.15rem] leading-snug text-[var(--ink)] md:text-[1.25rem]">
            {point.label}
          </h3>
          <p className="mt-2.5 text-[0.9rem] leading-7 text-[var(--muted)]">
            {point.body}
          </p>
        </li>
      ))}
    </RevealGroup>
  );
}

/**
 * Related services rail for a given industry. Uses the relations layer's
 * curated order, falling back to the detail-data order if supplied.
 */
export function RelatedServices({
  slug,
  orderedSlugs,
  lede,
}: {
  slug: string;
  orderedSlugs?: string[];
  lede?: string;
}) {
  const fromRelations = servicesForIndustry(slug);
  // Honor the detail-data order when provided, but only render services that
  // actually exist in the content layer.
  const services = orderedSlugs
    ? orderedSlugs
        .map((s) => fromRelations.find((svc) => svc.slug === s))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .concat(
          fromRelations.filter((svc) => !orderedSlugs.includes(svc.slug))
        )
    : fromRelations;

  if (services.length === 0) return null;

  return (
    <div>
      <Reveal>
        <SectionHeader
          eyebrow="Related Services"
          title="How the work gets done."
          aside={lede}
        />
      </Reveal>

      <hr className="rule-engraved mt-10" />

      <RevealGroup className="grid gap-px bg-[var(--line-soft)] sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.slug}
            href={`/services/${service.slug}`}
            title={service.title}
            summary={service.summary}
          />
        ))}
      </RevealGroup>
    </div>
  );
}

/**
 * Related insights rail for an industry. Renders only when the relations
 * layer surfaces sector-tagged insights — never an empty shell.
 */
export function RelatedInsights({ slug }: { slug: string }) {
  const insights = insightsForIndustry(slug, 3);
  if (insights.length === 0) return null;

  return (
    <div>
      <Reveal>
        <SectionHeader
          eyebrow="Related Insights"
          title="From the editorial archive."
          aside="Practitioner analysis on the developments that move decisions in this sector."
        />
      </Reveal>

      <hr className="rule-engraved mt-10" />

      <RevealGroup className="grid gap-px bg-[var(--line-soft)] md:grid-cols-3">
        {insights.map((insight) => (
          <ArticleCard
            key={insight.slug}
            href={`/insights/${insight.slug}`}
            kicker={insight.format}
            meta={`${insight.year} · ${insight.readingMinutes} min`}
            title={insight.title}
            summary={insight.summary}
          />
        ))}
      </RevealGroup>

      <Reveal className="mt-8">
        <ArrowLink href="/insights">The full archive</ArrowLink>
      </Reveal>
    </div>
  );
}

/**
 * A compact "other industries" rail for the bottom of a detail page — keeps
 * the sector axis navigable without a trip back to the hub.
 */
export function OtherIndustries({ currentSlug }: { currentSlug: string }) {
  const others = getIndustries().filter((i) => i.slug !== currentSlug);
  if (others.length === 0) return null;

  return (
    <div>
      <Eyebrow>Other Industries</Eyebrow>
      <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-3">
        {others.map((industry) => (
          <li key={industry.slug}>
            <Link
              href={`/industries/${industry.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-[0.82rem] font-medium text-[var(--muted)] transition-colors duration-300 hover:border-[var(--accent-ink)] hover:text-[var(--ink)]"
            >
              {industry.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
