import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader, ArrowLink } from "@/components/ui/primitives";
import { ServiceCard, ArticleCard, LinkRow } from "@/components/ui/card";
import { Reveal, RevealGroup } from "@/components/reveal";
import { getServices, getIndustries, getInsights } from "@/lib/content";
import { serviceClusters } from "@/lib/nav";

/*
  Homepage content modules. These read the real content layer (the same data
  Wave-1 detail pages consume), so the homepage doubles as a wiring reference.
*/

export function ServicesModule() {
  const services = getServices();
  // Show a representative 6 (2 per cluster) so the grid stays balanced.
  const featuredSlugs = serviceClusters.flatMap((c) =>
    c.links.slice(0, 2).map((l) => l.href.replace("/services/", ""))
  );
  const featured = featuredSlugs
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <Section tone="paper" id="services">
      <Reveal>
        <SectionHeader
          eyebrow="Services"
          title="Organized around the decisions that move outcomes."
          aside="Strategy, compliance, and coordination — structured around the moments where precision changes the answer."
        />
      </Reveal>

      <hr className="rule-engraved mt-10" />

      <RevealGroup className="grid gap-px bg-[var(--line-soft)] sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((service) => (
          <ServiceCard
            key={service.slug}
            href={`/services/${service.slug}`}
            title={service.title}
            summary={service.summary}
          />
        ))}
      </RevealGroup>

      <Reveal className="mt-8">
        <ArrowLink href="/services">All services, in three clusters</ArrowLink>
      </Reveal>
    </Section>
  );
}

export function IndustriesModule() {
  const industries = getIndustries();

  return (
    <Section tone="paper-deep" id="industries">
      <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <Reveal>
          <SectionHeader
            eyebrow="Industries"
            title="Sector-aware, not generic advice with a new logo."
          />
          <p className="lede mt-6 max-w-md text-[var(--muted)]">
            We structure work around environments where ownership complexity,
            operational nuance, and reporting exposure actually change the
            answer.
          </p>
        </Reveal>

        <RevealGroup as="ul" className="flex flex-col">
          {industries.map((industry) => (
            <li key={industry.slug} className="reveal">
              <LinkRow
                href={`/industries/${industry.slug}`}
                title={industry.title}
              />
            </li>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

export function InsightsModule() {
  const insights = getInsights().slice(0, 3);

  return (
    <Section tone="paper" id="insights">
      <Reveal>
        <SectionHeader
          eyebrow="Insights"
          title="An archive built to signal depth, not just recency."
          aside="A historically grounded editorial record, plus a current alert stream on the changes that move client decisions."
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
            cta="Read insight"
          />
        ))}
      </RevealGroup>

      <Reveal className="mt-8">
        <Link href="/insights" className="link-arrow">
          The full archive
          <span className="arrow" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </Reveal>
    </Section>
  );
}
