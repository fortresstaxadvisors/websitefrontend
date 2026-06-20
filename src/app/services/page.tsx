import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { SectionHeader, Eyebrow, ArrowLink } from "@/components/ui/primitives";
import { CTABlock } from "@/components/ui/cta-block";
import { Methodology } from "@/components/brand/methodology";
import { AshlarField } from "@/components/brand/motifs";
import { Reveal } from "@/components/reveal";
import { ServiceClusterBlock } from "@/components/services/sections";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getServices } from "@/lib/content";
import { serviceClusters } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Fortress organizes its work around strategy, compliance, and coordination — engagements scoped to the decisions that materially affect outcomes.",
  alternates: { canonical: "/services" },
};

/*
  Services hub — confident, utilitarian, institutional. The three clusters from
  the nav taxonomy (Strategy / Compliance / Coordination), each rendered as a
  labeled group of real service cards. Bands alternate for tonal rhythm; the
  Fortress Hold Method ties the menu back to how the firm actually works.

  Clusters are NOT a sequence, so they carry no decorative numbering.
*/

// Cluster framing lines — institutional, not promotional. One per cluster.
const CLUSTER_FRAMING: Record<string, string> = {
  strategy:
    "Forward-looking work, placed next to the decisions that set the outcome — before a return has to reflect them.",
  compliance:
    "Positions documented to withstand scrutiny, and maintained as the rules and the footprint change.",
  coordination:
    "Tax integrated with the rest of the table — finance, counsel, trustees, and wealth advisors — so the structure holds in practice.",
};

// Alternate band tones per cluster index for rhythm.
const CLUSTER_TONE = ["paper", "paper-deep", "paper"] as const;

export default function ServicesPage() {
  const services = getServices();
  const bySlug = new Map(services.map((s) => [s.slug, s]));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
        ]}
      />

      {/* Intro */}
      <Section tone="paper">
        <div className="relative">
          <AshlarField
            className="pointer-events-none absolute -inset-x-6 -top-6 bottom-0 -z-10 text-[var(--ink)]"
            opacity={0.03}
          />
          <Reveal>
            <SectionHeader
              as="h1"
              eyebrow="Services"
              title={
                <>
                  Organized around the decisions that{" "}
                  <em>materially affect outcomes</em>.
                </>
              }
              aside="Strategy, complex compliance, and coordinated execution. Each engagement is scoped carefully, documented clearly, and built to reduce uncertainty rather than add to it."
            />
          </Reveal>

          <Reveal className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {serviceClusters.map((cluster) => (
              <ArrowLink key={cluster.id} href={`#${cluster.id}`}>
                {cluster.title}
              </ArrowLink>
            ))}
          </Reveal>
        </div>
      </Section>

      {/* Three clusters, each a labeled group of real service cards. */}
      {serviceClusters.map((cluster, i) => {
        const clusterServices = cluster.links
          .map((link) => bySlug.get(link.href.replace("/services/", "")))
          .filter((s): s is NonNullable<typeof s> => Boolean(s));

        return (
          <Section key={cluster.id} tone={CLUSTER_TONE[i] ?? "paper"} tight>
            <ServiceClusterBlock
              id={cluster.id}
              label={`Cluster · ${cluster.title}`}
              title={cluster.summary}
              summary={CLUSTER_FRAMING[cluster.id] ?? ""}
              services={clusterServices}
            />
          </Section>
        );
      })}

      {/* The method tie-in — why the menu hangs together. */}
      <Section tone="slate-deep">
        <Reveal className="mb-10 max-w-2xl">
          <Eyebrow>The through-line</Eyebrow>
          <p className="lede mt-4 text-[var(--muted)]">
            The clusters are not separate practices bolted together. They are one
            method applied at different points in a client&rsquo;s situation.
          </p>
        </Reveal>
        <Reveal>
          <Methodology />
        </Reveal>
      </Section>

      {/* Consultative close. */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Not sure which fits?"
            title="Scope follows the conversation, not the other way around."
            body="We begin by defining the issue, the timeline, and the decision environment — then recommend the engagement that fits. That keeps the work sharp and the relationship honest."
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{ href: "/industries", label: "Browse by industry" }}
            note="A licensed CPA firm with CPAs on staff. Typical first response within one business day."
          />
        </Reveal>
      </Section>
    </>
  );
}
