import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/primitives";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { AshlarField, SectionOpener } from "@/components/brand/motifs";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getIndustries } from "@/lib/content";
import {
  IndustryIndex,
  ServicesBridge,
} from "@/components/industries/industry-sections";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Sector-aware tax advisory for environments where ownership complexity, operating reality, and reporting exposure change the answer — across real estate, professional services, healthcare, manufacturing and distribution, technology, and private capital.",
  alternates: { canonical: "/industries" },
};

/*
  Industries hub — operational, sector-aware. Per the art-direction brief, the
  tone is less abstract and more sector-specific than the homepage. Tonal
  rhythm: paper intro → paper-deep index → SLATE "why sector" band → paper
  services bridge → paper-deep consultative close.
*/

/** Hub-level "where tax bites" cues — tight, sector-specific, truthful. */
const SECTOR_CUES: Record<string, string> = {
  "real-estate":
    "Cost recovery, gain deferral, passive losses, and state exposure are decided at acquisition.",
  "professional-services":
    "Entity form and the compensation-versus-distribution line drive partner economics directly.",
  healthcare:
    "Reimbursement timing, ownership limits, and management-entity pricing shape the structure.",
  "manufacturing-distribution":
    "Inventory capitalization, multi-state nexus, and cost recovery live inside operations.",
  "technology-saas":
    "R&D capitalization, equity comp, and revenue sourcing arrive before the finance team does.",
  "private-investors-family-capital":
    "Trust design, liquidity timing, and transfer windows compound across generations.",
};

export default function IndustriesPage() {
  const count = getIndustries().length;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Industries", url: "/industries" },
        ]}
      />

      {/* Intro — operational thesis */}
      <Section tone="paper" className="relative isolate overflow-hidden">
        <AshlarField
          className="pointer-events-none absolute inset-0 -z-10 text-[var(--ink)]"
          opacity={0.04}
        />
        <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-end md:gap-16">
          <Reveal>
            <SectionOpener className="mb-5" />
            <Eyebrow>Industries</Eyebrow>
            <h1 className="display mt-4 t-h1 text-[var(--ink)]">
              Where the sector <em>changes</em> the tax answer.
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="lede max-w-xl text-[var(--muted)]">
              Fortress concentrates on {count} environments where technical
              rules, ownership complexity, and operational nuance meaningfully
              change the result — not on a generic service offered under a new
              logo. In each, the structure of the business is also the structure
              of its tax position.
            </p>
            <p className="mt-5 max-w-xl text-[0.95rem] leading-7 text-[var(--faint)]">
              The thread across all of them: the right answer is built into how
              the business is owned and run, and it is far easier to design than
              to repair.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* The index — sector rows with "where tax bites" cues */}
      <Section tone="paper-deep">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
            <Eyebrow as="h2">Focus Industries</Eyebrow>
            <p className="max-w-md text-[0.85rem] leading-6 text-[var(--faint)]">
              Six sectors, each read for the decisions where tax materially
              changes the outcome.
            </p>
          </div>
        </Reveal>

        <IndustryIndex cues={SECTOR_CUES} />
      </Section>

      {/* Why sector-specific — the dark structural band */}
      <Section tone="slate">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal>
            <Eyebrow>The Discipline</Eyebrow>
            <h2 className="display mt-4 t-h2 text-[var(--ink)]">
              Sector-aware, because the rules are not generic.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="lede text-[var(--muted)]">
              The same transaction can carry very different consequences
              depending on the sector it sits in. Cost recovery, nexus, entity
              treatment, and the timing of gain do not behave the same way for a
              real estate partnership, a growth-stage software company, and a
              multi-generational family structure.
            </p>
            <p className="mt-6 text-[0.98rem] leading-8 text-[var(--muted)]">
              Fortress reads each engagement through the operating reality of
              the sector first, then applies the same disciplined method to
              build a position that holds. Industry tells us where to look.{" "}
              <span className="text-[var(--ink)]">
                The Fortress Hold Method governs what we do once we are looking.
              </span>
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Bridge to Services */}
      <Section tone="paper">
        <Reveal>
          <ServicesBridge />
        </Reveal>
      </Section>

      {/* Consultative close */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Start Here"
            title="Tell us the sector, and the decision in front of you."
            body="The most useful conversations begin with the specific situation — the entity, the transaction, the timeline — not a generic intake. We define the issue before we recommend scope."
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
