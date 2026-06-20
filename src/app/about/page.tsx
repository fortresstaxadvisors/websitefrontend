import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { FirmPageHero, QuietStatement } from "@/components/firm-identity/shared";
import {
  AboutHowWeWork,
  AboutFoundingContext,
  AboutEra,
  AboutMethod,
  AboutWhoWeServe,
  AboutCredential,
} from "@/components/firm-identity/about-sections";

/*
  About — the firm narrative. Senior-led, advisory-not-compliance, founded 2021
  and built for the complexity it has practiced in since. Method over
  personality (per page-art-direction.md). Light/dark band rhythm:

    Hero (paper) → Thesis statement (paper-deep) → How We Work (paper)
    → Founding Context (paper-deep) → Era Timeline (SLATE)
    → The Hold Method (SLATE-DEEP) → Who We Serve (paper)
    → Firm credential (paper-deep) → Consultative CTA (dark block on paper)

  TRUTHFULNESS: founded 2021; five years; senior-led advisory; public
  regulatory context as credential; confirmed client types. Firm-level CPA
  credential only (never a personal designation).

  NOTE(legal-review): The "licensed CPA firm" statement here and on /leadership
  is publishable per confirmed-inputs.md, but the EXACT legal wording must be
  reviewed and approved before launch. Treat as review-pending.
*/

export const metadata: Metadata = {
  title: "About",
  description:
    "Fortress Tax Advisors is a senior-led, licensed CPA firm built for genuine tax complexity. Advisory, not compliance — founded in 2021 and built to hold. Our firm, method, and the clients we serve.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <FirmPageHero
        eyebrow="The Firm"
        title={
          <>
            Built for complexity. <em>Built to hold.</em>
          </>
        }
        lede="Fortress Tax Advisors is a tax advisory firm structured to provide senior-led analysis through a relationship model larger firms cannot credibly replicate. We practice advisory, not compliance: our work begins before transactions are structured — not after returns are filed."
        meta="A licensed CPA firm · Senior-led · Founded 2021"
      />

      {/* Opening thesis — a single restrained voice moment, not a loud hero. */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <QuietStatement eyebrow="The Idea">
            A defensible position is not the most aggressive position. It is the
            one most likely to hold. There is a difference, and it is the whole
            of what we do.
          </QuietStatement>
        </Reveal>
      </Section>

      <AboutHowWeWork />

      <AboutFoundingContext />

      <AboutEra />

      <AboutMethod />

      <AboutWhoWeServe />

      <AboutCredential />

      {/* Consultative close. */}
      <Section tone="paper" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Start Here"
            title="If you have outgrown the generalist, the conversation is worth having."
            body="We begin by defining the issue, the timeline, and the decision environment before recommending scope. Fortress was built for exactly the position you are in."
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{ href: "/services", label: "Explore Services" }}
            note="We aim to respond to qualified inquiries within one business day."
          />
        </Reveal>
      </Section>
    </>
  );
}
