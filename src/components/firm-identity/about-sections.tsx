import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader, Eyebrow, ArrowLink } from "@/components/ui/primitives";
import { Reveal, RevealGroup } from "@/components/reveal";
import { Methodology } from "@/components/brand/methodology";
import { WhoWeServe } from "@/components/brand/who-we-serve";
import { EraTimeline } from "@/components/brand/era-timeline";
import { KeystoneGlyph } from "@/components/brand/motifs";

/*
  About page sections. The firm narrative, drawn from:
    - 02-brand/history-framing.md §5 (the About framework + approved patterns)
    - 02-brand/messaging-pillars.md (pillars 1–4)
    - 00-orchestration/confirmed-inputs.md (CPA-firm credential, client types)
  Tone: method-over-personality. Light/dark band rhythm. No fabricated facts.
*/

/* ---- 1. How We Work — the senior-led / advisory-not-compliance thesis ---- */

const PRINCIPLES = [
  {
    title: "Senior-led, by design",
    body: "The advisor who scopes your engagement is the advisor who does the work and stays responsible for it. Complexity is handled by people who have seen complexity before — not assigned to junior staff and supervised from a distance.",
  },
  {
    title: "Advisory, not compliance",
    body: "Our work begins before a transaction is structured, not after a return needs to reflect it. A filing is a report on decisions made through the year. We are involved in making those decisions.",
  },
  {
    title: "Built to hold",
    body: "A defensible position is not the most aggressive one — it is the one most likely to survive scrutiny, professional review, and time. We build for that standard rather than for a single year's optimization.",
  },
  {
    title: "Continuity as structure",
    body: "The advisor who works with you in year one is the advisor who knows your situation in year five. That continuity is structural, not incidental — and it is what makes the relationship defensible.",
  },
];

export function AboutHowWeWork() {
  return (
    <Section tone="paper" id="how-we-work">
      <Reveal>
        <SectionHeader
          eyebrow="How We Work"
          title="What it means, operationally, to be a Fortress client."
          aside="Four commitments that shape how engagements are scoped, staffed, and maintained — stated as structure, not sentiment."
        />
      </Reveal>

      <hr className="rule-engraved mt-10" />

      <RevealGroup className="grid gap-px bg-[var(--line-soft)] sm:grid-cols-2">
        {PRINCIPLES.map((p) => (
          <div
            key={p.title}
            className="reveal flex flex-col bg-[var(--paper)] p-7 md:p-9"
          >
            <KeystoneGlyph className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="serif mt-5 t-h3 text-[var(--ink)]">{p.title}</h3>
            <p className="mt-3.5 max-w-md text-[0.97rem] leading-7 text-[var(--muted)]">
              {p.body}
            </p>
          </div>
        ))}
      </RevealGroup>
    </Section>
  );
}

/* ---- 2. The founding context — narrative lead-in to the era timeline ---- */

export function AboutFoundingContext() {
  return (
    <Section tone="paper-deep" id="founding">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <Reveal>
          <SectionHeader
            eyebrow="The Founding Context"
            title="Founded in 2021. Constituted for the complexity we have practiced in ever since."
          />
        </Reveal>
        <Reveal delay={0.06}>
          <div className="measure space-y-6 text-[var(--muted)] md:text-[1.075rem] md:leading-[1.75]">
            <p>
              Fortress was founded at a moment of unusual density in U.S. tax
              law — a period absorbing more simultaneous structural change than
              at any point in the prior two decades. The Tax Cuts and Jobs Act
              remained unsettled in planning practice. COVID-era legislation had
              created an unprecedented wave of retroactive elections and novel
              credits. The Inflation Reduction Act would soon expand examination
              capacity and raise the documentation standard for complex returns.
            </p>
            <p>
              A firm founded in 2021 was not born into a stable landscape and
              gradually confronted by complexity.{" "}
              <strong className="font-semibold text-[var(--ink)]">
                Fortress was built for that environment.
              </strong>{" "}
              Our advisors have never practiced in a materially simpler one.
              That is not a limitation. It is the credential — a claim about
              depth in this environment, not about breadth across decades.
            </p>
            <p>
              The conditions that defined the founding window — enforcement
              expansion, new reporting regimes, the TCJA sunset horizon — are
              not resolved. They are the continuing conditions of the market we
              serve. The timeline below is a matter of public record.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---- 3. The era timeline — the honest scale signal (dark band) ---- */

export function AboutEra() {
  return (
    <Section tone="slate">
      <Reveal>
        <EraTimeline />
      </Reveal>
    </Section>
  );
}

/* ---- 4. The method — the Fortress Hold Method (deep dark band) ---- */

export function AboutMethod() {
  return (
    <Section tone="slate-deep" id="method">
      <Reveal>
        <Methodology />
      </Reveal>
      <Reveal className="mt-10">
        <ArrowLink href="/services">
          See the method applied across our services
        </ArrowLink>
      </Reveal>
    </Section>
  );
}

/* ---- 5. Who we serve — confirmed client types (light band) ---- */

const CLIENT_TYPES = [
  "Business owners",
  "Investors",
  "Fiduciaries",
  "High-net-worth families",
  "Operating companies",
  "Complex individual taxpayers",
];

export function AboutWhoWeServe() {
  return (
    <Section tone="paper" id="who-we-serve">
      <Reveal>
        <WhoWeServe />
      </Reveal>

      {/* The confirmed, named client types — stated plainly as a quiet ledger. */}
      <Reveal className="mt-14">
        <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9">
          <Eyebrow>Who we work with</Eyebrow>
          <p className="mt-4 max-w-2xl text-[var(--muted)] md:text-[1.075rem] md:leading-[1.7]">
            Fortress serves clients across the United States whose tax situations
            carry genuine complexity:
          </p>
          <ul className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {CLIENT_TYPES.map((c) => (
              <li
                key={c}
                className="flex items-baseline gap-3 border-t border-[var(--line-soft)] pt-4"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--accent)]"
                />
                <span className="serif text-[1.05rem] text-[var(--ink)]">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}

/* ---- 6. The firm credential — CPA-firm trust signal (restrained) ---- */

export function AboutCredential() {
  return (
    <Section tone="paper-deep" id="credential">
      <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center md:gap-16">
        <Reveal>
          <SectionHeader
            eyebrow="The Firm"
            title="A licensed CPA firm, organized around judgment."
          />
        </Reveal>
        <Reveal delay={0.06}>
          {/*
            TRUTHFULNESS: firm-level credential only. Per confirmed-inputs.md,
            Fortress is a licensed CPA firm with CPAs on staff. This is a
            practice-level statement, never a personal designation.
            NOTE: exact legal wording must be reviewed before launch — see the
            HTML comment in app/about/page.tsx.
          */}
          <div className="measure space-y-6 text-[var(--muted)] md:text-[1.075rem] md:leading-[1.75]">
            <p>
              Fortress Tax Advisors is a licensed CPA firm, with CPAs on staff.
              We surface that credential where it belongs — at the level of the
              practice — and let the substance of the work speak for the rest.
            </p>
            <p>
              Scale signals, at Fortress, come from depth rather than from a
              staffing chart. We do not compete on headcount, office count, or
              the breadth of a service menu. We compete on the quality of the
              analysis and the durability of the positions it produces.
            </p>
            <p>
              The people who lead the firm — and the way they work — are the
              subject of the next page.
            </p>
            <Link href="/leadership" className="link-arrow !text-[0.86rem]">
              Meet the people behind the method
              <span className="arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
