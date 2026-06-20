import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal, RevealGroup } from "@/components/reveal";
import { getInsights, getInsightTopics } from "@/lib/content";
import {
  slugify,
  topicFromSlug,
  topicBlurb,
} from "@/components/insights/insights-helpers";
import { ArchiveHeader } from "@/components/insights/archive-header";
import { ArticleListItem } from "@/components/insights/article-list-item";

type TopicPageProps = {
  params: Promise<{ topic: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getInsightTopics().map((topic) => ({ topic: slugify(topic) }));
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { topic: topicSlug } = await params;
  const topic = topicFromSlug(topicSlug, getInsightTopics());
  if (!topic) return {};

  const description = `Fortress Tax Advisors analysis and tax alerts on ${topic.toLowerCase()} — ${topicBlurb(
    topic
  )}`;

  return {
    title: `${topic} — Insights`,
    description,
    alternates: { canonical: `/insights/topic/${topicSlug}` },
    openGraph: { type: "website", title: `${topic} | Insights`, description },
  };
}

export default async function InsightTopicPage({ params }: TopicPageProps) {
  const { topic: topicSlug } = await params;
  const topics = getInsightTopics();
  const topic = topicFromSlug(topicSlug, topics);

  if (!topic) {
    notFound();
  }

  const items = getInsights().filter((insight) => insight.topic === topic);
  const others = topics.filter((t) => t !== topic);

  return (
    <>
      <Section tone="paper" tight as="header">
        <ArchiveHeader
          eyebrow="Browse by Topic"
          title={topic}
          dek={topicBlurb(topic)}
          count={items.length}
        />

        {/* Cross-topic switcher */}
        {others.length > 0 ? (
          <Reveal className="mt-9 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
              Other topics
            </span>
            {others.map((t) => (
              <Link
                key={t}
                href={`/insights/topic/${slugify(t)}`}
                className="inline-flex items-center rounded-full border border-[var(--line)] px-3 py-1.5 text-[0.78rem] font-medium text-[var(--muted)] transition-colors duration-300 hover:border-[var(--ink)] hover:text-[var(--ink)]"
              >
                {t}
              </Link>
            ))}
          </Reveal>
        ) : null}
      </Section>

      <Section tone="paper" tight>
        <RevealGroup as="div">
          {items.map((insight) => (
            <ArticleListItem
              key={insight.slug}
              insight={insight}
              showTopic={false}
            />
          ))}
        </RevealGroup>
      </Section>

      <Section tone="paper-deep">
        <Reveal>
          <CTABlock
            surface="light"
            eyebrow="Start Here"
            title={`A ${topic.toLowerCase()} question on your desk?`}
            body="If a development in this subject maps to a decision you are weighing, the conversation worth having is a focused one. We define the issue and the timeline before recommending scope."
            primary={{ href: "/contact", label: "Speak with a Fortress advisor" }}
            secondary={{ href: "/services", label: "Explore Services" }}
            watermark={false}
          />
        </Reveal>
      </Section>
    </>
  );
}
