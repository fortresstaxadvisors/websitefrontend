import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/primitives";
import { CTABlock } from "@/components/ui/cta-block";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import {
  ServiceHero,
  ServiceScope,
  ServiceMethod,
  ServiceRelated,
} from "@/components/services/sections";
import { getServiceContent } from "@/components/services/service-content";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getServiceBySlug, getServices } from "@/lib/content";
import { insightsForService, servicesForIndustry } from "@/lib/relations";
import { getIndustries } from "@/lib/content";

/*
  Service detail template.

  Fixes the old "thin intro + flat markdown + dead space" page with a structured
  layout that holds up even when the source copy is terse:

    1. Positioning / problem framing   (ServiceHero)
    2. Who it's for + Scope of work     (ServiceScope)   ← from service-content map
    3. Further detail (if any body)     (<Prose>)        ← content layer, dek-stripped
    4. How Fortress works               (ServiceMethod)  ← Fortress Hold Method tie-in
    5. Related insights + industries    (ServiceRelated) ← @/lib/relations
    6. Service-specific consultative CTA (CTABlock)

  No duplicate dek: the dek renders once as the hero lede; the body is rendered
  by <Prose> with the dek already stripped by the content layer.
*/

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getServices().map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  // Title only — the root layout template adds the " · Fortress…" suffix.
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${slug}` },
  };
}

/**
 * Industries related to this service — the reverse of the relations
 * industry→services map. Keeps cross-links coherent in both directions.
 */
function industriesForService(slug: string) {
  return getIndustries().filter((industry) =>
    servicesForIndustry(industry.slug).some((s) => s.slug === slug)
  );
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const content = getServiceContent(slug);
  const insights = insightsForService(slug, 3);
  const industries = industriesForService(slug).slice(0, 5);

  // The source body is just the "Focus"/"Ideal Clients" lists, which the
  // structured Scope/Who-it's-for sections already present far better. Render
  // the raw body ONLY as a fallback when no structured content map exists —
  // otherwise it duplicates the scope and reintroduces the flat-markdown look.
  const showRawBody = !content && service.body.trim().length > 0;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
          { name: service.title, url: `/services/${slug}` },
        ]}
      />

      <ServiceHero
        cluster={content?.cluster ?? "Service"}
        title={service.title}
        summary={service.summary}
        problem={content?.problem}
      />

      {content ? (
        <ServiceScope whoFor={content.whoFor} scope={content.scope} />
      ) : null}

      {/* Fallback prose body — only when there's no structured content map,
          so we never duplicate the Scope section with the raw "Focus" list. */}
      {showRawBody ? (
        <Section tone="paper">
          <Reveal className="max-w-3xl">
            <Eyebrow>In practice</Eyebrow>
            <div className="measure mt-6">
              <Prose content={service.body} />
            </div>
          </Reveal>
        </Section>
      ) : null}

      <ServiceMethod engagement={content?.engagement} />

      <ServiceRelated insights={insights} industries={industries} />

      {/* Service-specific consultative close. */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Start here"
            title={
              <>
                Start with the situation, not the{" "}
                <em>{service.title.toLowerCase()}</em> brochure.
              </>
            }
            body={`We begin by defining the facts and the timeline before recommending scope. If ${service.title.toLowerCase()} is the right fit, we will say so — and if it is not, we will say that too.`}
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{ href: "/services", label: "All services" }}
            note="A licensed CPA firm with CPAs on staff. Typical first response within one business day."
          />
        </Reveal>
      </Section>
    </>
  );
}
