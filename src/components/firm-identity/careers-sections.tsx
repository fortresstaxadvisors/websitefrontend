import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader, Eyebrow, ArrowLink } from "@/components/ui/primitives";
import { Reveal, RevealGroup } from "@/components/reveal";
import { KeystoneGlyph } from "@/components/brand/motifs";
import {
  getOpeningsByTeam,
  getOpeningsCount,
  APPLY_EMAIL,
} from "@/components/careers/openings";

/*
  Careers page sections. Culture / hiring narrative from 04-copy/core-site/
  careers.md: precision, calm judgment, substantive work over volume; technical
  depth; advisor coordination; accountability.

  TRUTHFULNESS: open roles are REAL (see components/careers/openings.ts) — no
  fabricated salaries or benefits. The apply path is a role-specific note to the
  confirmed firm address (clientservice@fortresstaxadvisors.com).
*/

/* ---- The standard — what the work is, and who it suits ---- */

const TENETS = [
  {
    title: "Precision over volume",
    body: "We are not the highest-volume firm in our market, and we are not trying to be. Caseloads are managed so that every position gets the attention it needs — which means the work suits people who would rather do fewer things to a higher standard.",
  },
  {
    title: "Calm judgment",
    body: "The composed professional notifies the client before the deadline; the reactive one scrambles after it. We hire for temperament as much as technique — the ability to stay measured when a matter is complex and the stakes are real.",
  },
  {
    title: "Technical depth",
    body: "Fortress competes on the quality of its analysis. That requires genuine depth in structuring, planning, and regulatory interpretation — and a willingness to keep that depth current as the law moves.",
  },
  {
    title: "Coordination",
    body: "Tax does not sit in isolation here. The work means coordinating with legal, finance, and wealth counterparts so a position holds together in practice, not just on paper.",
  },
  {
    title: "High-accountability execution",
    body: "The advisor who scopes a matter stays responsible for it. There is no handing work down and supervising from a distance — which means real ownership, and real accountability for the outcome.",
  },
  {
    title: "Earned clarity",
    body: "We translate technical complexity into clear, defensible guidance — without false simplification and without hiding behind jargon. Clarity is earned by rigor, and it is part of the job.",
  },
];

export function CareersTenets() {
  return (
    <Section tone="paper" id="the-standard">
      <Reveal>
        <SectionHeader
          eyebrow="The Standard"
          title="What the work is — and who it suits."
          aside="Fortress is built for professionals who value precision, calm judgment, and substantive client work over volume-driven advisory."
        />
      </Reveal>

      <hr className="rule-engraved mt-10" />

      <RevealGroup className="grid gap-px bg-[var(--line-soft)] sm:grid-cols-2 lg:grid-cols-3">
        {TENETS.map((t) => (
          <div
            key={t.title}
            className="reveal flex flex-col bg-[var(--paper)] p-7 md:p-8"
          >
            <KeystoneGlyph className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="serif mt-5 text-[1.2rem] leading-snug text-[var(--ink)]">
              {t.title}
            </h3>
            <p className="mt-3 text-[0.92rem] leading-7 text-[var(--muted)]">
              {t.body}
            </p>
          </div>
        ))}
      </RevealGroup>
    </Section>
  );
}

/* ---- Current openings — grouped by team, linking to role pages ---- */

export function CareersOpenings() {
  const groups = getOpeningsByTeam();
  const count = getOpeningsCount();

  return (
    <Section tone="paper" id="current-openings">
      <Reveal>
        <SectionHeader
          eyebrow="Current Openings"
          title="The roles we are hiring for now."
          aside={`We are currently hiring across ${groups.length} teams. We would still rather meet the right person than fill a seat — so if your strengths match how we work and you do not see your exact role, write to us anyway.`}
        />
      </Reveal>

      <p className="sr-only">{count} current openings.</p>

      <div className="mt-12 flex flex-col gap-14 md:gap-16">
        {groups.map((group) => (
          <Reveal key={group.id}>
            <div className="grid gap-6 md:grid-cols-[0.5fr_1fr] md:gap-12">
              {/* Team header rail */}
              <div className="md:pt-1">
                <div className="flex items-center gap-3">
                  <KeystoneGlyph className="h-4 w-4 text-[var(--accent)]" />
                  <Eyebrow bare as="h3">
                    {group.label}
                  </Eyebrow>
                </div>
                <p className="mt-4 max-w-xs text-[0.92rem] leading-7 text-[var(--muted)]">
                  {group.blurb}
                </p>
              </div>

              {/* The team's roles as hairline-divided rows */}
              <div className="min-w-0">
                {group.openings.map((opening) => (
                  <Link
                    key={opening.slug}
                    href={`/careers/${opening.slug}`}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-5 border-t border-[var(--line)] py-6 last:border-b md:gap-8"
                  >
                    <span className="min-w-0">
                      <span className="serif block text-[1.3rem] leading-snug text-[var(--ink)] md:text-[1.55rem]">
                        {opening.title}
                      </span>
                      <span className="mt-2 block max-w-2xl text-sm leading-7 text-[var(--muted)]">
                        {opening.summary}
                      </span>
                      <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                        <span>Remote — United States</span>
                        <span aria-hidden="true">·</span>
                        <span>Full-time</span>
                      </span>
                    </span>
                    <span
                      className="self-center text-[var(--accent-ink)] transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---- How to express interest — for people who don't see their exact role ---- */

export function CareersExpressInterest() {
  return (
    <Section tone="paper-deep" id="express-interest">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start md:gap-16">
        <Reveal className="min-w-0">
          <SectionHeader
            eyebrow="Don't See Your Role?"
            title="We would rather meet the right person than fill a seat."
          />
        </Reveal>
        <Reveal delay={0.06} className="min-w-0">
          <div className="measure space-y-6 text-[var(--muted)] md:text-[1.075rem] md:leading-[1.75]">
            <p>
              The openings above are the roles we are actively hiring for. But we
              do not run a high-volume process, and the right person rarely
              arrives exactly when a posting does. If your strengths match how we
              work and you do not see your exact role, we would still like to
              hear from you.
            </p>
            <p>
              If the standard above describes how you practice, send a short note
              about who you are and the kind of work you do best. Include
              whatever helps us understand your background — there is no form to
              complete.
            </p>
            <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
              <Eyebrow bare>Write to us</Eyebrow>
              <a
                href={`mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(
                  "Careers — Expression of interest",
                )}`}
                className="serif mt-3 block break-words text-[1.35rem] text-[var(--ink)] underline decoration-[var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent-ink)] md:text-[1.6rem]"
              >
                {APPLY_EMAIL}
              </a>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Tell us about your experience and the work you want to do. A
                short, specific note is more useful than a long one — and we read
                every one.
              </p>
            </div>
            <ArrowLink href="/about">
              How we work, and why it is structured this way
            </ArrowLink>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
