import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { ConversionHero } from "@/components/firm-conversion/conversion-hero";
import { NewsroomEarly } from "@/components/firm-conversion/newsroom-early";

export const metadata: Metadata = {
  title: "Newsroom",
  description:
    "Firm updates, appearances, and selected commentary from Fortress Tax Advisors. Institutional and selective by design. For analysis, see the Insights archive.",
  alternates: { canonical: "/newsroom" },
};

export default function NewsroomPage() {
  return (
    <>
      {/* Masthead */}
      <Section tone="paper" tight>
        <ConversionHero
          eyebrow="Newsroom"
          title={
            <>
              Firm news, held to the same standard as the{" "}
              <em>work</em>.
            </>
          }
          lede="The newsroom captures firm updates, appearances, and selected commentary that sits adjacent to the broader Insights archive. Institutional and selective by design — never promotional."
        />
      </Section>

      {/* Honest early state */}
      <Section tone="paper-deep">
        <Reveal kind="fade">
          <NewsroomEarly />
        </Reveal>
      </Section>

      {/* Route onward */}
      <Section tone="paper" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="In the meantime"
            title="The substance lives in the archive."
            body="A historically grounded editorial record, plus a current alert stream on the changes that move client decisions."
            primary={{ href: "/insights", label: "Read the Insights archive" }}
            secondary={{ href: "/contact", label: "Media & speaking inquiries" }}
            watermark
          />
        </Reveal>
      </Section>
    </>
  );
}
