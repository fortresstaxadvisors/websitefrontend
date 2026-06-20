import type { ReactNode } from "react";
import { Section } from "@/components/ui/section";
import { Eyebrow, ArrowLink } from "@/components/ui/primitives";
import { ServiceCard, ArticleCard, LinkRow } from "@/components/ui/card";
import { Reveal, RevealGroup } from "@/components/reveal";
import { KeystoneGlyph, CoursingCorner } from "@/components/brand/motifs";
import type { ScopeItem } from "@/components/services/service-content";
import type { InsightEntry, IndustryEntry, ServiceEntry } from "@/lib/content";

/*
  Page-specific section components for the Services detail template.

  These compose Wave-0 primitives only (Section, Eyebrow, ServiceCard,
  ArticleCard, LinkRow, motifs, reveals). No new colors, fonts, or tokens.
  They give the thin source copy a real structure: positioning → who it's for
  → scope of work → how Fortress works → related insights/industries → CTA.
*/

/* --------------------------------------------------------------------------
   Detail hero — positioning / problem framing. NO duplicate dek: the dek
   (service.summary) is the lede here, and the problem paragraph adds the
   framing. The content-layer body renders later via <Prose>, dek-stripped.
   -------------------------------------------------------------------------- */
export function ServiceHero({
  cluster,
  title,
  summary,
  problem,
}: {
  cluster: string;
  title: string;
  summary: string;
  problem?: string;
}) {
  return (
    <Section tone="paper">
      <Reveal>
        <ArrowLink href="/services" className="!text-[var(--muted)]">
          <span className="sr-only">Back to </span>All services
        </ArrowLink>
      </Reveal>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-start md:gap-16">
        <Reveal className="max-w-2xl">
          <Eyebrow>{cluster}</Eyebrow>
          <h1 className="display mt-4 t-h1 text-[var(--ink)]">{title}</h1>
          <p className="lede mt-6 text-[1.15rem] leading-8 text-[var(--muted)] md:text-[1.25rem]">
            {summary}
          </p>
        </Reveal>

        {problem ? (
          <Reveal delay={0.08} className="md:pt-2">
            <div className="relative panel-quiet p-6 md:p-7">
              <CoursingCorner className="pointer-events-none absolute right-4 top-4 h-8 w-8 text-[var(--accent)] opacity-40" />
              <p className="eyebrow eyebrow--bare !text-[var(--accent-ink)]">
                The problem
              </p>
              <p className="mt-3 text-[0.98rem] leading-7 text-[var(--muted)]">
                {problem}
              </p>
            </div>
          </Reveal>
        ) : null}
      </div>

      <Reveal kind="rule">
        <hr className="rule-engraved mt-12" />
      </Reveal>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   Who it's for + Scope of work — the two structural columns. Always rendered
   from the per-service content map, so the page never collapses to dead space.
   -------------------------------------------------------------------------- */
export function ServiceScope({
  whoFor,
  scope,
}: {
  whoFor: string[];
  scope: ScopeItem[];
}) {
  return (
    <Section tone="paper-deep">
      <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        {/* Who it's for */}
        <Reveal>
          <Eyebrow>Who it&rsquo;s for</Eyebrow>
          <h2 className="display mt-4 t-h2 text-[var(--ink)]">
            Built for a specific kind of decision.
          </h2>
          <ul className="mt-8 flex flex-col">
            {whoFor.map((item, i) => (
              <li
                key={i}
                className="flex gap-4 border-t border-[var(--line)] py-5 last:border-b"
              >
                <KeystoneGlyph className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span className="text-[0.97rem] leading-7 text-[var(--muted)]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Scope of work */}
        <Reveal delay={0.06}>
          <Eyebrow>Scope of work</Eyebrow>
          <h2 className="display mt-4 t-h2 text-[var(--ink)]">
            What the engagement covers.
          </h2>
          <RevealGroup className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
            {scope.map((item) => (
              <div
                key={item.label}
                className="reveal flex flex-col bg-[var(--paper)] p-6 md:p-7"
              >
                <h3 className="serif text-[1.1rem] leading-snug text-[var(--ink)]">
                  {item.label}
                </h3>
                <p className="mt-2.5 text-[0.9rem] leading-7 text-[var(--muted)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </RevealGroup>
        </Reveal>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   How Fortress works — the Fortress Hold Method tie-in, scoped to this
   service via the `engagement` sentence. The five-step sequence justifies
   numbered markers (a real sequence, per the design principles).
   -------------------------------------------------------------------------- */
const METHOD_STEPS = [
  "Define the facts",
  "Evaluate exposure",
  "Build the structure",
  "Coordinate execution",
  "Monitor change over time",
];

export function ServiceMethod({ engagement }: { engagement?: string }) {
  return (
    <Section tone="slate">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal className="max-w-md">
          <Eyebrow>How Fortress works</Eyebrow>
          <h2 className="display mt-4 t-h2 text-[var(--ink)]">
            One method, applied to <em>this</em> work.
          </h2>
          <p className="lede mt-5 text-[var(--muted)]">
            The Fortress Hold Method is our way of turning complex tax facts into
            durable positions &mdash; a deliberate, five-step sequence built to
            hold under audit, professional review, and time.
          </p>
          {engagement ? (
            <p className="mt-5 text-[0.97rem] leading-7 text-[var(--muted)]">
              {engagement}
            </p>
          ) : null}
        </Reveal>

        <RevealGroup
          as="ol"
          className="grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2"
        >
          {METHOD_STEPS.map((step, i) => (
            <li
              key={step}
              className={`reveal flex items-start gap-4 bg-[var(--surface)] p-6 md:p-7 ${
                i === METHOD_STEPS.length - 1 ? "sm:col-span-2" : ""
              }`}
            >
              <span className="index-num text-lg text-[var(--accent-ink)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="serif text-[1.1rem] leading-snug text-[var(--ink)]">
                {step}
              </span>
            </li>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   Related insights + related industries — cross-links via @/lib/relations.
   Rendered only when there's something to show, so no empty rails.
   -------------------------------------------------------------------------- */
export function ServiceRelated({
  insights,
  industries,
}: {
  insights: InsightEntry[];
  industries: IndustryEntry[];
}) {
  if (insights.length === 0 && industries.length === 0) return null;

  return (
    <Section tone="paper">
      <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
        {insights.length > 0 ? (
          <div>
            <Reveal>
              <div className="flex items-end justify-between gap-6">
                <Eyebrow>Related insights</Eyebrow>
                <ArrowLink href="/insights" className="hidden sm:inline-flex">
                  Full archive
                </ArrowLink>
              </div>
              <hr className="rule-coursing mt-5" />
            </Reveal>
            <RevealGroup className="mt-2 grid gap-px bg-[var(--line-soft)] sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        ) : (
          <div />
        )}

        {industries.length > 0 ? (
          <Reveal delay={0.06}>
            <Eyebrow>Related industries</Eyebrow>
            <p className="mt-4 max-w-sm text-[0.95rem] leading-7 text-[var(--muted)]">
              Sector environments where this work most often changes the answer.
            </p>
            <ul className="mt-5 flex flex-col">
              {industries.map((industry) => (
                <li key={industry.slug}>
                  <LinkRow
                    href={`/industries/${industry.slug}`}
                    title={industry.title}
                  />
                </li>
              ))}
            </ul>
            <ArrowLink href="/industries" className="mt-6 !text-[var(--accent-ink)]">
              All industries
            </ArrowLink>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   Cluster block for the hub — a labeled group of service cards. NOT a
   sequence, so no decorative numbering on the cards. Tone is set by caller
   so the hub alternates light/dark bands.
   -------------------------------------------------------------------------- */
export function ServiceClusterBlock({
  id,
  label,
  title,
  summary,
  services,
  children,
}: {
  id: string;
  label: string;
  title: ReactNode;
  summary: string;
  services: ServiceEntry[];
  /** Optional extra node (e.g. the cluster's framing aside). */
  children?: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <Reveal>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-xl">
            <Eyebrow>{label}</Eyebrow>
            <h2 className="display mt-4 t-h2 text-[var(--ink)]">{title}</h2>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-7 text-[var(--muted)]">
            {summary}
          </p>
        </div>
      </Reveal>

      {children}

      <Reveal kind="rule">
        <hr className="rule-coursing mt-8" />
      </Reveal>

      {/* Grid adapts to card count so a 2-service cluster never leaves an
          orphan empty cell in a 3-up grid. */}
      <RevealGroup
        className={`mt-2 grid gap-px bg-[var(--line-soft)] sm:grid-cols-2 ${
          services.length >= 3 ? "lg:grid-cols-3" : ""
        }`}
      >
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
