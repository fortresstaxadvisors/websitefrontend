import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { Prose } from "@/components/prose";
import { getInsightBySlug, getInsights } from "@/lib/content";
import { relatedToInsight } from "@/lib/relations";
import { ArticleMetaRow } from "@/components/insights/article-meta-row";
import { RelatedRail } from "@/components/insights/related-rail";
import { PrevNext } from "@/components/insights/prev-next";
import { slugify } from "@/components/insights/insights-helpers";
import { ArticleJsonLd } from "@/components/seo/json-ld";

type InsightPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getInsights().map((insight) => ({ slug: insight.slug }));
}

export async function generateMetadata({
  params,
}: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    return {};
  }

  const description = insight.summary || `${insight.format} from the Fortress archive.`;

  return {
    title: insight.title,
    description,
    alternates: { canonical: `/insights/${slug}` },
    openGraph: {
      type: "article",
      title: insight.title,
      description,
      url: `/insights/${slug}`,
      ...(insight.publishedSort ? { publishedTime: insight.publishedSort } : {}),
    },
  };
}

export default async function InsightDetailPage({ params }: InsightPageProps) {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }

  // Chronological neighbors within the newest-first archive.
  const all = getInsights();
  const index = all.findIndex((i) => i.slug === insight.slug);
  const newer = index > 0 ? all[index - 1] : undefined;
  const older = index < all.length - 1 ? all[index + 1] : undefined;

  const { related, services, industries } = relatedToInsight(insight);

  return (
    <article>
      <ArticleJsonLd
        title={insight.title}
        description={insight.summary || undefined}
        url={`/insights/${slug}`}
        datePublished={insight.publishedSort}
        section={insight.topic}
      />
      {/* Masthead */}
      <Section tone="paper" tight as="header">
        <Reveal className="max-w-3xl">
          <Link href="/insights" className="link-arrow">
            <span className="arrow rotate-180" aria-hidden="true">
              &rarr;
            </span>
            Insights
          </Link>

          <p className="eyebrow mt-8">{insight.format}</p>

          <h1 className="display mt-4 text-[2.3rem] leading-[1.05] text-[var(--ink)] sm:text-[3rem] md:text-[3.6rem]">
            {insight.title}
          </h1>

          {insight.summary ? (
            <p className="lede mt-6 max-w-2xl text-[1.18rem] leading-8 text-[var(--muted)]">
              {insight.summary}
            </p>
          ) : null}

          <div className="mt-8 border-t border-[var(--line)] pt-5">
            <ArticleMetaRow insight={insight} />
          </div>
        </Reveal>
      </Section>

      {/* Body */}
      <Section tone="paper" tight>
        <Reveal className="measure">
          <Prose
            content={insight.body}
            sourceAnchor={insight.sourceAnchor}
            raisedInitial
          />
        </Reveal>

        {/* Prev / next within the archive */}
        <div className="mt-16">
          <PrevNext newer={newer} older={older} />
        </div>
      </Section>

      {/* Related */}
      <Section tone="paper-deep">
        <RelatedRail
          related={related}
          services={services}
          industries={industries}
        />
      </Section>

      {/* Consultative CTA */}
      <Section tone="paper">
        <Reveal>
          <CTABlock
            eyebrow="Start Here"
            title="Weighing a decision this touches?"
            body="If this development maps to your position, the next step is a focused conversation. We define the issue and the timeline before recommending scope."
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{
              href: `/insights/topic/${slugify(insight.topic)}`,
              label: `More on ${insight.topic}`,
            }}
            note="We typically respond within one business day."
          />
        </Reveal>
      </Section>
    </article>
  );
}
