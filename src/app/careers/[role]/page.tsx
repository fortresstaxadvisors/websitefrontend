import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/primitives";
import { CTABlock } from "@/components/ui/cta-block";
import { Reveal } from "@/components/reveal";
import { KeystoneGlyph } from "@/components/brand/motifs";
import { JobPostingJsonLd } from "@/components/seo/json-ld";
import {
  getOpenings,
  getOpeningBySlug,
  applyMailto,
  OPENINGS_DATE_POSTED,
  type Opening,
} from "@/components/careers/openings";

type RolePageProps = {
  params: Promise<{ role: string }>;
};

export function generateStaticParams() {
  return getOpenings().map((opening) => ({ role: opening.slug }));
}

export async function generateMetadata({
  params,
}: RolePageProps): Promise<Metadata> {
  const { role } = await params;
  const opening = getOpeningBySlug(role);
  if (!opening) return {};

  return {
    title: `${opening.title} — Careers`,
    description: opening.summary,
    alternates: { canonical: `/careers/${opening.slug}` },
  };
}

/**
 * Full HTML description for the JobPosting structured data — mirrors the
 * visible page content (Google requires the schema description to match).
 */
function jobDescriptionHtml(o: Opening): string {
  const p = (s: string) => `<p>${s}</p>`;
  const ul = (items: string[]) =>
    `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  return [
    ...o.intro.map(p),
    "<h3>Responsibilities</h3>",
    ul(o.responsibilities),
    "<h3>What we&rsquo;re looking for</h3>",
    ul(o.qualifications),
    "<h3>How we work</h3>",
    p(o.howWeWork),
  ].join("");
}

function RoleList({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div>
      <Eyebrow as="h2">{heading}</Eyebrow>
      <ul className="mt-6 flex flex-col">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-4 border-t border-[var(--line)] py-5 last:border-b"
          >
            <KeystoneGlyph className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
            <span className="text-[0.97rem] leading-7 text-[var(--muted)]">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function RolePage({ params }: RolePageProps) {
  const { role } = await params;
  const opening = getOpeningBySlug(role);

  if (!opening) {
    notFound();
  }

  const apply = applyMailto(opening.title);

  return (
    <>
      <JobPostingJsonLd
        title={opening.title}
        description={jobDescriptionHtml(opening)}
        url={`/careers/${opening.slug}`}
        datePosted={OPENINGS_DATE_POSTED}
        team={opening.teamLabel}
      />

      {/* Hero */}
      <Section tone="paper">
        <Reveal>
          <Link href="/careers" className="link-arrow">
            <span className="arrow rotate-180" aria-hidden="true">
              &rarr;
            </span>
            Careers
          </Link>
        </Reveal>

        <Reveal className="mt-8 max-w-3xl">
          <Eyebrow>{opening.teamLabel}</Eyebrow>
          <h1 className="display mt-4 t-h1 text-[var(--ink)]">{opening.title}</h1>
          <p className="lede mt-6 text-[1.15rem] leading-8 text-[var(--muted)]">
            {opening.summary}
          </p>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
            <span>Remote &mdash; United States</span>
            <span aria-hidden="true">&middot;</span>
            <span>Full-time</span>
            <span aria-hidden="true">&middot;</span>
            <span>{opening.teamLabel}</span>
          </p>
          <div className="mt-8">
            <a href={apply} className="btn btn-primary">
              Apply for this role
            </a>
          </div>
        </Reveal>

        <Reveal kind="rule">
          <hr className="rule-engraved mt-12" />
        </Reveal>
      </Section>

      {/* Body */}
      <Section tone="paper" tight>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <Eyebrow>The role</Eyebrow>
            <div className="measure mt-6 space-y-5 text-[var(--muted)] md:text-[1.05rem] md:leading-[1.75]">
              {opening.intro.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Reveal>

          <div className="flex flex-col gap-12">
            <Reveal>
              <RoleList heading="Responsibilities" items={opening.responsibilities} />
            </Reveal>
            <Reveal>
              <RoleList
                heading="What we&rsquo;re looking for"
                items={opening.qualifications}
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* How we work */}
      <Section tone="paper-deep" tight>
        <Reveal className="max-w-3xl">
          <Eyebrow>How we work</Eyebrow>
          <p className="lede mt-5 text-[var(--muted)]">{opening.howWeWork}</p>
        </Reveal>
      </Section>

      {/* Apply CTA */}
      <Section tone="paper-deep" tight>
        <Reveal>
          <CTABlock
            surface="dark"
            eyebrow="Apply"
            title="If the standard fits how you work, write to us."
            body="Send a short, specific note about who you are and the work you do best. There is no long form to complete — a clear note about your background and what you want to do is more useful than a generic application."
            primary={{ href: apply, label: "Apply for this role" }}
            secondary={{ href: "/careers", label: "All openings" }}
            note="Remote — United States. We typically respond within one business day."
          />
        </Reveal>
      </Section>
    </>
  );
}
