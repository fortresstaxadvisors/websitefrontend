import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { HomeHero } from "@/components/home/hero";
import {
  ServicesModule,
  IndustriesModule,
  InsightsModule,
} from "@/components/home/modules";
import { EraTimeline } from "@/components/brand/era-timeline";
import { Methodology } from "@/components/brand/methodology";
import { WhoWeServe } from "@/components/brand/who-we-serve";

/*
  Homepage — the canonical reference implementation for Wave 1.

  Vertical rhythm deliberately alternates light and dark bands to give the
  page real tonal drama (the cure for the old flat-cream look):

    Hero (paper) → Era timeline (SLATE) → Services (paper)
    → Industries (paper-deep) → Methodology (SLATE-DEEP) → Who We Serve (paper)
    → Insights (paper-deep) → CTA (dark block on paper)
*/

export default function Page() {
  return (
    <>
      <HomeHero />

      {/* The honest scale signal — the big structural dark band. */}
      <Section tone="slate">
        <Reveal>
          <EraTimeline />
        </Reveal>
      </Section>

      <ServicesModule />

      <IndustriesModule />

      {/* Methodology teaser on a deep band — the second dark moment. */}
      <Section tone="slate-deep">
        <Reveal>
          <Methodology />
        </Reveal>
      </Section>

      <Section tone="paper">
        <Reveal>
          <WhoWeServe />
        </Reveal>
      </Section>

      <InsightsModule />

      {/* Consultative close. */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Start Here"
            title="A focused conversation, not a generic intake form."
            body="We begin by defining the issue, the timeline, and the decision environment before recommending scope. That keeps the work sharp and the engagement honest."
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{ href: "/services", label: "Explore Services" }}
            note="Existing clients will reach secure document workflows through the client portal as that experience comes online."
          />
        </Reveal>
      </Section>
    </>
  );
}
