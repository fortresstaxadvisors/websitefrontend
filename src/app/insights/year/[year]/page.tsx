import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal, RevealGroup } from "@/components/reveal";
import { getInsights, getInsightYears } from "@/lib/content";
import { ArchiveHeader } from "@/components/insights/archive-header";
import { ArticleListItem } from "@/components/insights/article-list-item";

type YearPageProps = {
  params: Promise<{ year: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getInsightYears().map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: YearPageProps): Promise<Metadata> {
  const { year } = await params;
  if (!getInsightYears().includes(year)) return {};

  const count = getInsights().filter((i) => i.year === year).length;
  const description = `Fortress Tax Advisors insights and tax alerts published in ${year} — ${count} ${
    count === 1 ? "piece" : "pieces"
  } across business tax, trusts and estates, state and local, and compliance.`;

  return {
    title: `${year} Archive`,
    description,
    alternates: { canonical: `/insights/year/${year}` },
    openGraph: { type: "website", title: `${year} Archive | Insights`, description },
  };
}

export default async function InsightYearPage({ params }: YearPageProps) {
  const { year } = await params;
  const years = getInsightYears();

  if (!years.includes(year)) {
    notFound();
  }

  const items = getInsights().filter((insight) => insight.year === year);

  // Adjacent years for in-context navigation (years are newest-first).
  const yi = years.indexOf(year);
  const newerYear = yi > 0 ? years[yi - 1] : undefined;
  const olderYear = yi < years.length - 1 ? years[yi + 1] : undefined;

  return (
    <>
      <Section tone="paper" tight as="header">
        <ArchiveHeader
          eyebrow="Browse by Year"
          title={
            <>
              The <em>{year}</em> archive
            </>
          }
          dek={`Everything Fortress published in ${year}, newest first — the developments and planning windows that defined the year.`}
          count={items.length}
        />
      </Section>

      <Section tone="paper" tight>
        <RevealGroup as="div">
          {items.map((insight) => (
            <ArticleListItem key={insight.slug} insight={insight} />
          ))}
        </RevealGroup>

        {/* Year-to-year navigation */}
        <nav
          aria-label="Browse adjacent years"
          className="mt-12 flex items-center justify-between gap-6 border-t border-[var(--line)] pt-7"
        >
          <div>
            {newerYear ? (
              <Link
                href={`/insights/year/${newerYear}`}
                className="group flex flex-col gap-1"
              >
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
                  &larr; Newer
                </span>
                <span className="index-num text-[1.25rem] text-[var(--ink)] transition-colors group-hover:text-[var(--accent-ink)]">
                  {newerYear}
                </span>
              </Link>
            ) : null}
          </div>
          <Link href="/insights#browse" className="link-arrow">
            All years
          </Link>
          <div className="flex justify-end">
            {olderYear ? (
              <Link
                href={`/insights/year/${olderYear}`}
                className="group flex flex-col items-end gap-1"
              >
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
                  Older &rarr;
                </span>
                <span className="index-num text-[1.25rem] text-[var(--ink)] transition-colors group-hover:text-[var(--accent-ink)]">
                  {olderYear}
                </span>
              </Link>
            ) : null}
          </div>
        </nav>
      </Section>

      <Section tone="paper-deep">
        <Reveal>
          <CTABlock
            surface="light"
            eyebrow="Start Here"
            title="A development from this year still in play?"
            body="Several positions opened in earlier years remain live. If one maps to a decision you are weighing, the conversation worth having is a focused one."
            primary={{ href: "/contact", label: "Speak with a Fortress advisor" }}
            secondary={{ href: "/insights", label: "Back to all insights" }}
            watermark={false}
          />
        </Reveal>
      </Section>
    </>
  );
}
