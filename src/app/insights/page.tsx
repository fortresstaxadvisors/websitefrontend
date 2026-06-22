import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/ui/section";
import { SectionHeader, Eyebrow } from "@/components/ui/primitives";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal, RevealGroup } from "@/components/reveal";
import { SectionOpener } from "@/components/brand/motifs";
import { FortressElevation } from "@/components/brand/fortress-elevation";
import {
  getInsights,
  getInsightYears,
  getInsightTopics,
} from "@/lib/content";
import { FeaturedLead } from "@/components/insights/featured-lead";
import { ArticleListItem } from "@/components/insights/article-list-item";
import { BrowseRail } from "@/components/insights/browse-rail";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Read Fortress Tax Advisors insights, tax alerts, and archive content covering business tax, trust and estate issues, compliance developments, and planning strategy.",
  alternates: { canonical: "/insights" },
  openGraph: {
    type: "website",
    title: "Insights | Fortress Tax Advisors",
    description:
      "Tax alerts, planning analysis, and a historically grounded archive on the developments that move client decisions.",
  },
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const rawQ = (await searchParams).q;
  const query = (Array.isArray(rawQ) ? rawQ[0] : rawQ)?.trim() ?? "";

  // Legacy compatibility: structured data previously routed site searches to
  // `/insights?q=...`. Send those requests to the site-wide search surface.
  if (query) {
    redirect(`/search?q=${encodeURIComponent(query)}`);
  }

  const insights = getInsights();
  const [lead, ...rest] = insights;
  const recent = rest.slice(0, 9);
  const alerts = insights.filter((i) => i.format === "Tax Alert").slice(0, 4);

  const years = getInsightYears().map((value) => ({
    value,
    count: insights.filter((i) => i.year === value).length,
  }));
  const topics = getInsightTopics().map((value) => ({
    value,
    count: insights.filter((i) => i.topic === value).length,
  }));

  return (
    <>
      {/* Masthead */}
      <Section tone="paper" tight as="header">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
          <Reveal className="hero-load">
            <div data-seq="1">
              <Eyebrow>The Fortress Archive</Eyebrow>
            </div>
            <h1
              data-seq="2"
              className="display mt-5 t-display text-[var(--ink)]"
            >
              Insights, <em>on the record</em>.
            </h1>
            <p
              data-seq="3"
              className="lede mt-7 max-w-xl text-[1.12rem] leading-8 text-[var(--muted)]"
            >
              Tax alerts, planning analysis, and a five-year editorial record of
              the developments that move owner, investor, and fiduciary
              decisions &mdash; written to be useful before a deadline, not after.
            </p>
            <div
              data-seq="4"
              className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3"
            >
              <Link href="#tax-alerts" className="link-arrow">
                Tax Alerts
                <span className="arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
              <Link href="#browse" className="link-arrow">
                Browse the archive
                <span className="arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          </Reveal>

          <Reveal
            kind="fade"
            className="relative mx-auto hidden w-full max-w-sm md:block"
          >
            <FortressElevation
              variant="opener"
              className="h-auto w-full text-[var(--accent)] opacity-90"
            />
          </Reveal>
        </div>
      </Section>

      {/* Featured lead */}
      {lead ? (
        <Section tone="surface">
          <Reveal className="mb-8 flex items-center gap-4">
            <SectionOpener />
            <Eyebrow bare className="!text-[var(--faint)]">
              Latest
            </Eyebrow>
          </Reveal>
          <Reveal>
            <FeaturedLead insight={lead} />
          </Reveal>
        </Section>
      ) : null}

      {/* Recent pieces */}
      <Section tone="paper" id="recent">
        <Reveal>
          <SectionHeader
            eyebrow="Recent"
            title="From the archive"
            aside="The most recent additions across every topic. Browse the full record by year or by subject below."
          />
        </Reveal>

        <hr className="rule-engraved mt-10" />

        <RevealGroup as="div" className="mt-2">
          {recent.map((insight) => (
            <ArticleListItem key={insight.slug} insight={insight} />
          ))}
        </RevealGroup>
      </Section>

      {/* Tax Alerts stream */}
      {alerts.length > 0 ? (
        <Section tone="slate" id="tax-alerts">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <Reveal>
              <SectionHeader
                eyebrow="Tax Alerts"
                title="What changed, and what to do."
                opener={false}
              />
              <p className="lede mt-6 max-w-md text-[var(--muted)]">
                The time-bound stream: laws, notices, rulings, and deadlines,
                with the practical implication stated plainly. Composed
                notification before the deadline &mdash; not a scramble after it.
              </p>
            </Reveal>

            <RevealGroup as="div">
              {alerts.map((insight) => (
                <ArticleListItem
                  key={insight.slug}
                  insight={insight}
                  showTopic={false}
                />
              ))}
            </RevealGroup>
          </div>
        </Section>
      ) : null}

      {/* Browse by year / topic */}
      <Section tone="paper-deep" id="browse">
        <Reveal>
          <SectionHeader
            eyebrow="Browse the Archive"
            title="Find the record by year or by subject."
          />
        </Reveal>

        <hr className="rule-engraved mt-10 mb-12" />

        <BrowseRail years={years} topics={topics} />
      </Section>

      {/* Consultative CTA */}
      <Section tone="paper">
        <Reveal>
          <CTABlock
            eyebrow="Start Here"
            title="A development on this list affects your position?"
            body="If something in the archive maps to a decision you are weighing, the conversation worth having is a focused one. We define the issue and the timeline before recommending scope."
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{ href: "/services", label: "Explore Services" }}
            note="We typically respond within one business day."
          />
        </Reveal>
      </Section>
    </>
  );
}
