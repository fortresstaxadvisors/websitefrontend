import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/primitives";
import { CTABlock } from "@/components/ui/cta-block";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { AshlarField, SectionOpener } from "@/components/brand/motifs";
import { FortressElevation } from "@/components/brand/fortress-elevation";
import { IndustryMark, hasIndustryMark } from "@/components/brand/industry-marks";
import { getIndustries, getIndustryBySlug } from "@/lib/content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { insightsForIndustry } from "@/lib/relations";
import { getIndustryDetail } from "@/components/industries/industry-data";
import {
  PressurePoints,
  RelatedServices,
  RelatedInsights,
  OtherIndustries,
} from "@/components/industries/industry-sections";

type IndustryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getIndustries().map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({
  params,
}: IndustryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);

  if (!industry) {
    return {};
  }

  return {
    title: industry.title,
    description: industry.summary,
    alternates: { canonical: `/industries/${slug}` },
  };
}

/*
  Industry detail — structured, not a flat markdown blob:
    1. Hero (sector tag + title + the dek, rendered ONCE)
    2. The operating reality (sector context, via <Prose>)
    3. Where tax changes the answer (sector pressure points)
    4. How Fortress helps (ties to services + the Fortress Hold Method)
    5. Related services + related insights (via @/lib/relations)
    6. Consultative CTA
  Tonal rhythm alternates light/dark bands. If a slug somehow lacks structured
  detail data, the template degrades gracefully to the markdown body.
*/

export default async function IndustryDetailPage({
  params,
}: IndustryPageProps) {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);

  if (!industry) {
    notFound();
  }

  const detail = getIndustryDetail(slug);
  const hasRelatedInsights = insightsForIndustry(slug, 3).length > 0;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Industries", url: "/industries" },
          { name: industry.title, url: `/industries/${slug}` },
        ]}
      />

      {/* 1 — Hero. The dek is rendered here and nowhere else (no dupe). */}
      <Section tone="paper" className="relative isolate overflow-hidden">
        <AshlarField
          className="pointer-events-none absolute inset-0 -z-10 text-[var(--ink)]"
          opacity={0.04}
        />
        <Reveal>
          <Link href="/industries" className="link-arrow">
            <span className="arrow rotate-180" aria-hidden="true">
              &rarr;
            </span>
            Industries
          </Link>
        </Reveal>

        <div className="mt-8 grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-14">
          <Reveal>
            <SectionOpener className="mb-5" />
            <Eyebrow>{detail?.tag ?? "Industry"}</Eyebrow>
            <h1 className="display mt-4 t-h1 text-[var(--ink)]">
              {industry.title}
            </h1>
            <p className="lede mt-5 max-w-xl text-[var(--muted)]">
              {industry.summary}
            </p>
          </Reveal>

          <Reveal
            delay={0.1}
            className="relative mx-auto hidden w-full max-w-sm md:block"
            kind="fade"
          >
            {hasIndustryMark(slug) ? (
              <IndustryMark
                slug={slug}
                variant="opener"
                aria-hidden="true"
                className="h-auto w-full text-[var(--accent)] opacity-90"
              />
            ) : (
              <FortressElevation
                variant="opener"
                aria-hidden="true"
                className="h-auto w-full text-[var(--accent)] opacity-90"
              />
            )}
          </Reveal>
        </div>
      </Section>

      {detail ? (
        <>
          {/* 2 — The operating reality */}
          <Section tone="paper-deep">
            <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
              <Reveal>
                <SectionOpener className="mb-5" />
                <Eyebrow>The Operating Reality</Eyebrow>
                <h2 className="display mt-4 t-h2 text-[var(--ink)]">
                  How the sector actually works.
                </h2>
                {detail.realityAside ? (
                  <p className="mt-6 max-w-xs text-[0.9rem] leading-7 text-[var(--faint)]">
                    {detail.realityAside}
                  </p>
                ) : null}
              </Reveal>
              <Reveal delay={0.06}>
                <Prose content={detail.reality} className="measure" />
              </Reveal>
            </div>
          </Section>

          {/* 3 — Where tax changes the answer (dark structural band) */}
          <Section tone="slate">
            <Reveal>
              <div className="max-w-2xl">
                <Eyebrow>Where Tax Changes the Answer</Eyebrow>
                <h2 className="display mt-4 t-h2 text-[var(--ink)]">
                  The decisions where the result is actually{" "}
                  <em>set</em>.
                </h2>
                <p className="lede mt-5 text-[var(--muted)]">
                  The points in {industry.title.toLowerCase()} where tax law
                  meaningfully changes the outcome — and where planning ahead is
                  worth far more than cleanup after.
                </p>
              </div>
            </Reveal>

            <PressurePoints points={detail.pressurePoints} />
          </Section>

          {/* 4 — How Fortress helps */}
          <Section tone="paper">
            <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
              <Reveal>
                <SectionOpener className="mb-5" />
                <Eyebrow>How Fortress Helps</Eyebrow>
                <h2 className="display mt-4 t-h2 text-[var(--ink)]">
                  A method, applied to this sector.
                </h2>
                <Reveal className="mt-7" kind="fade">
                  <Link href="/about" className="link-arrow">
                    The Fortress Hold Method
                    <span className="arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                </Reveal>
              </Reveal>
              <Reveal delay={0.06}>
                <Prose content={detail.approach} className="measure" />
              </Reveal>
            </div>
          </Section>

          {/* 5a — Related services */}
          <Section tone="paper-deep">
            <RelatedServices
              slug={slug}
              orderedSlugs={detail.serviceSlugs}
              lede={detail.servicesLede}
            />
          </Section>
        </>
      ) : (
        /* Graceful fallback: render the markdown body if no structured data. */
        <Section tone="paper-deep">
          <Reveal>
            <Prose content={industry.body} className="measure" raisedInitial />
          </Reveal>
        </Section>
      )}

      {/* 5b — Related insights (band only renders if the archive has matches) */}
      {hasRelatedInsights ? (
        <Section tone="paper">
          <RelatedInsights slug={slug} />
        </Section>
      ) : null}

      {/* Other industries — a quiet raised shelf that keeps the sector axis
          navigable and reads distinctly from either neighbor. */}
      <Section tone="surface" tight>
        <Reveal>
          <OtherIndustries currentSlug={slug} />
        </Reveal>
      </Section>

      {/* 6 — Consultative close */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Start Here"
            title={`A focused conversation about your position in ${industry.title.toLowerCase()}.`}
            body="We begin with the specific facts — the entity, the transaction, the timeline — and define the issue before recommending scope. That keeps the work sharp and the engagement honest."
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{ href: "/services", label: "Explore Services" }}
          />
        </Reveal>
      </Section>
    </>
  );
}
