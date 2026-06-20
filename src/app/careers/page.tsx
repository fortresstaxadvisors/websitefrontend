import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { FirmPageHero, QuietStatement } from "@/components/firm-identity/shared";
import {
  CareersTenets,
  CareersOpenings,
  CareersExpressInterest,
} from "@/components/firm-identity/careers-sections";

/*
  Careers — the culture / hiring narrative. Precision, calm judgment,
  substantive work over volume; technical depth; accountability. Elegant and
  restrained. Band rhythm:

    Hero (paper) → Statement (slate) → The Standard (paper)
    → Express Interest (paper-deep)

  TRUTHFULNESS: no fabricated open roles, salaries, or benefits. The path to
  apply is a truthful "express interest" route to the confirmed firm address.
*/

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Careers at Fortress Tax Advisors — current openings across engineering, accounting, and client relations. A senior-led, remote-first firm for professionals who value precision, technical depth, and substantive client work over volume.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <FirmPageHero
        eyebrow="Careers"
        title={
          <>
            For people who do <em>fewer things</em>, better.
          </>
        }
        lede="Fortress is built for professionals who value precision, calm judgment, and substantive client work over volume-driven advisory. The work rewards technical depth, real ownership, and the discipline to keep complex positions defensible over time."
      />

      {/* A single restrained voice moment. */}
      <Section tone="slate" tight>
        <Reveal>
          <QuietStatement eyebrow="The Work">
            The most consistent failure in this profession is the gap between the
            advisor a client meets and the advisor who does the work. We are
            built to eliminate that gap — which only works with the right people.
          </QuietStatement>
        </Reveal>
      </Section>

      <CareersTenets />

      <CareersOpenings />

      <CareersExpressInterest />
    </>
  );
}
