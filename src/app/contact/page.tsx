import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { ConversionHero } from "@/components/firm-conversion/conversion-hero";
import { ConsultationForm } from "@/components/firm-conversion/consultation-form";
import { ContactAside } from "@/components/firm-conversion/contact-aside";
import { FAQ } from "@/components/seo/faq";
import { firmFaq } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start with a focused conversation. Share your situation and a Fortress advisor will respond within one business day — defining the issue and the right next step before any engagement begins.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      {/* Masthead */}
      <Section tone="paper" tight>
        <ConversionHero
          eyebrow="Contact"
          title={
            <>
              Start with a focused <em>conversation</em>.
            </>
          }
          lede="Tell us what you're working through. A senior advisor will read it, define the issue with you, and recommend the right next step — before any engagement begins. We reply within one business day."
        />
      </Section>

      {/* Form + consultative aside */}
      <Section tone="paper-deep">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.85fr] lg:gap-16">
          <Reveal kind="fade">
            <div>
              <h2 className="serif text-[1.6rem] leading-snug text-[var(--ink)] md:text-[1.9rem]">
                Tell us about the situation
              </h2>
              <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-[var(--muted)]">
                The more we understand up front, the sharper the first
                conversation. Nothing here commits you to anything.
              </p>
              <div className="mt-8">
                <ConsultationForm />
              </div>
            </div>
          </Reveal>

          <Reveal kind="fade" delay={0.08}>
            <ContactAside />
          </Reveal>
        </div>
      </Section>

      {/* Common questions — visible Q&A + FAQPage schema (confirmed answers). */}
      <Section tone="paper" tight>
        <Reveal kind="fade">
          <FAQ
            items={firmFaq}
            eyebrow="Common questions"
            title="How Fortress works, in brief."
          />
        </Reveal>
      </Section>
    </>
  );
}
