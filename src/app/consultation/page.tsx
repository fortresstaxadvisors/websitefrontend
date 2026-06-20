import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { ConversionHero } from "@/components/firm-conversion/conversion-hero";
import { ConsultationExpectations } from "@/components/firm-conversion/consultation-expectations";
import { ConsultationSpine } from "@/components/firm-conversion/consultation-spine";
import { FAQ } from "@/components/seo/faq";
import { consultationFaq } from "@/content/site";

export const metadata: Metadata = {
  title: "Consultation",
  description:
    "What a first conversation with Fortress is, and what to expect. A focused, senior-led discussion structured around the Fortress Hold Method — built to define the issue before scope, not to sell a quote.",
  alternates: { canonical: "/consultation" },
};

export default function ConsultationPage() {
  return (
    <>
      {/* Masthead */}
      <Section tone="paper" tight>
        <ConversionHero
          eyebrow="Consultation"
          title={
            <>
              A first conversation is designed to create{" "}
              <em>clarity quickly</em>.
            </>
          }
          lede="Before there is an engagement, there is a conversation. Its job is to get the facts straight, define the real issue, and recommend the right path forward — whether or not that path runs through Fortress."
        />
      </Section>

      {/* What to expect / what to have ready / what it isn't */}
      <Section tone="paper-deep">
        <Reveal kind="fade">
          <ConsultationExpectations />
        </Reveal>
      </Section>

      {/* The engagement spine — the Fortress Hold Method (dark moment) */}
      <Section tone="slate-deep">
        <Reveal kind="fade">
          <ConsultationSpine />
        </Reveal>
      </Section>

      {/* Common questions — visible Q&A + FAQPage schema (confirmed answers). */}
      <Section tone="paper-deep">
        <Reveal kind="fade">
          <FAQ
            items={consultationFaq}
            eyebrow="Common questions"
            title="What to expect, answered directly."
          />
        </Reveal>
      </Section>

      {/* Route to the form */}
      <Section tone="paper" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Start Here"
            title="When the situation has outgrown the current advisor, this is the conversation worth having."
            body="Share the decision, the deadline, or the question on the table. A senior advisor will respond within one business day."
            primary={{ href: "/contact", label: "Start the conversation" }}
            secondary={{ href: "/services", label: "Explore our services" }}
            note="No script, no pressure, and no quote before the issue is defined."
          />
        </Reveal>
      </Section>
    </>
  );
}
