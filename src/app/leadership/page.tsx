import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/ui/primitives";
import { KeystoneGlyph } from "@/components/brand/motifs";
import { FirmPageHero, QuietStatement } from "@/components/firm-identity/shared";
import {
  LeadershipPrincipal,
  type Principal,
} from "@/components/firm-identity/leadership-cards";

/*
  Leadership — a FULL page (two principals), quiet and credible. No-photo
  monogram cards designed to swap in real headshots later with zero layout
  change (see MonogramPortrait in firm-identity/shared.tsx).

  TRUTHFULNESS (critical here):
   - Only the two confirmed principals + a firm-level "CPAs on staff" line.
   - Tyler Ballein is NOT a CPA — no "CPA" after his name, no implication.
   - The CPA credential is stated at the FIRM level only, never personally.
   - No invented credentials, employers, education, awards, or other team.

  NOTE(legal-review): the "licensed CPA firm / CPAs on staff" wording is
  publishable per confirmed-inputs.md, but the EXACT legal wording must be
  reviewed before launch. Treat as review-pending.
*/

// ---------------------------------------------------------------------------
// TODO(orchestrator): swap real name. The CTO's exact full name + spelling is
// PENDING from the client (title confirmed: "Partner & CTO"). This is the one
// place to patch — change this single constant and the page updates everywhere.
const CTO_NAME = "Omer Muhammad";
// Initials for the monogram portrait until a name/headshot is supplied.
// TODO(orchestrator): set real initials alongside CTO_NAME.
const CTO_INITIALS = "OM";
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Leadership",
  description:
    "The principals of Fortress Tax Advisors. Tyler Ballein, Founding & Managing Partner, leads the firm's advisory practice; the firm's Partner & CTO leads client experience, operations, and the systems behind every engagement. A licensed CPA firm with CPAs on staff.",
  alternates: { canonical: "/leadership" },
};

const PRINCIPALS: Principal[] = [
  {
    name: "Tyler Ballein",
    initials: "TB",
    title: "Founding & Managing Partner",
    bio: [
      "Tyler Ballein founded Fortress Tax Advisors and leads the firm as Managing Partner. His relationship with the work began early: he grew up around the discipline of accounting through his mother's career in the field, long before he pursued formal accounting training of his own.",
      "That combination — an instinct for the craft formed early, sharpened later by formal study — shapes how he runs the firm. Fortress is built on the conviction that complex tax work should be led by the advisor who is actually doing it, with positions designed to hold rather than to impress.",
      "As Managing Partner, Tyler sets the standard for how engagements are scoped, how positions are built, and how the firm stays in front of the regulatory change that defines the market it serves.",
    ],
    focus: [
      "Firm leadership and direction",
      "Advisory practice and engagement standards",
      "Structuring and defensible positions",
      "Senior client relationships",
    ],
  },
  {
    name: CTO_NAME,
    initials: CTO_INITIALS,
    title: "Partner & CTO",
    bio: [
      "Omer Muhammad leads the operating and technology side of the firm — the systems, processes, and client experience that let senior advisory work scale without losing the relationship at its center.",
      "A company-builder by background, Omer is responsible for how clients actually experience Fortress: onboarding, document exchange, engagement visibility, and the day-to-day operations that keep complex work organized. The discipline that holds a tax position together also has to hold the workflow around it together.",
      "That work anchors the Fortress Client Portal — being built as the secure operating layer for onboarding, document exchange, engagement visibility, and ongoing advisory coordination.",
    ],
    focus: [
      "Client experience and onboarding",
      "Operations and systems",
      "The Fortress Client Portal",
      "Firm infrastructure and technology",
    ],
  },
];

export default function LeadershipPage() {
  return (
    <>
      <FirmPageHero
        eyebrow="Leadership"
        title={
          <>
            The people behind <em>the method</em>.
          </>
        }
        lede="Fortress is led by two principals with complementary responsibilities: one for the advisory practice and the standard of the work, one for the experience, systems, and operations that hold it together. The advisor who knows your situation is the one who built it."
        meta="A licensed CPA firm · CPAs on staff"
      />

      {/* The principals. */}
      <Section tone="paper">
        <div className="flex flex-col gap-20 md:gap-28">
          {PRINCIPALS.map((principal, i) => (
            <Reveal key={i}>
              <LeadershipPrincipal principal={principal} index={i} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* How we work — the people-and-method framing tied to the Hold Method. */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <QuietStatement eyebrow="How We Work">
            Work at Fortress is not delegated after the relationship is
            established. Senior advisors manage their own engagements. That is
            how the firm is structured — and it is what the Fortress Hold Method
            depends on.
          </QuietStatement>
        </Reveal>
      </Section>

      {/* Firm credential — CPAs on staff, stated at the practice level. */}
      <Section tone="slate">
        <Reveal>
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-16">
            <div>
              <div className="flex items-center gap-3">
                <KeystoneGlyph className="h-5 w-5 text-[var(--accent-bright)]" />
                <Eyebrow bare>The Credential</Eyebrow>
              </div>
              <h2 className="display mt-5 t-h2 text-[var(--ink)]">
                A licensed CPA firm, with CPAs on staff.
              </h2>
            </div>
            <div className="measure space-y-5 text-[var(--muted)] md:text-[1.05rem] md:leading-[1.7]">
              {/*
                TRUTHFULNESS: firm/practice-level credential ONLY. Never a
                personal designation for Tyler or the CTO. Exact legal wording
                pending review (see NOTE at top of file).
              */}
              <p>
                Fortress Tax Advisors is a licensed CPA firm, and there are CPAs
                on staff supporting the work. We hold that credential at the
                level of the practice — where it belongs — rather than treating
                it as a personal title.
              </p>
              <p>
                As the firm grows, we will introduce the advisors behind the
                method by name. For now, the two principals lead a practice
                built to keep complex positions defensible and the clients who
                hold them well served.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Consultative close. */}
      <Section tone="paper" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Start Here"
            title="Work directly with the people who lead the firm."
            body="A Fortress engagement begins with a focused conversation about the issue, the timeline, and the decision in front of you — with the advisors who will stay responsible for it."
            primary={{
              href: "/contact",
              label: "Speak with a Fortress advisor",
            }}
            secondary={{ href: "/about", label: "About the firm" }}
            note="We aim to respond to qualified inquiries within one business day."
          />
        </Reveal>
      </Section>
    </>
  );
}
