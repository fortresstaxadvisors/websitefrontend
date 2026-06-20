import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { CTABlock } from "@/components/ui/cta-block";
import { SectionHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/reveal";
import { ConversionHero } from "@/components/firm-conversion/conversion-hero";
import { PortalFeature } from "@/components/firm-conversion/portal-feature";

export const metadata: Metadata = {
  title: "Client Portal",
  description:
    "The Fortress Client Portal is being built as the secure operating layer for onboarding, document exchange, engagement visibility, and ongoing advisory coordination. Request access or get notified when it goes live.",
  alternates: { canonical: "/client-portal" },
};

export default function ClientPortalPage() {
  return (
    <>
      {/* Masthead — dark band so the product reads as a real platform */}
      <Section tone="slate">
        <ConversionHero
          eyebrow="Client Portal"
          title={
            <>
              The secure operating layer for the{" "}
              <em>Fortress relationship</em>.
            </>
          }
          lede="The Fortress Client Portal is being built as the secure operating layer for onboarding, document exchange, engagement visibility, and ongoing advisory coordination."
          meta={
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line-strong)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--accent-bright)]"
                aria-hidden="true"
              />
              In active development
            </span>
          }
        />
      </Section>

      {/* The four pillars */}
      <Section tone="paper">
        <Reveal>
          <SectionHeader
            eyebrow="What it will do"
            title="Built around how the work actually moves."
            aside="One secure environment for the document exchange, visibility, and coordination a serious engagement depends on — not a portal bolted on as an afterthought."
          />
        </Reveal>
        <hr className="rule-engraved mt-10" />
        <div className="mt-10">
          <PortalFeature />
        </div>
      </Section>

      {/* Honest status + access path */}
      <Section tone="paper-deep" tight>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <Reveal kind="fade">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">
                Where it stands
              </p>
              <h2 className="display mt-4 t-h2 text-[var(--ink)]">
                Built deliberately, released when it&rsquo;s sound.
              </h2>
              <div className="measure mt-5 flex flex-col gap-4 text-[var(--muted)]">
                <p>
                  The portal is in active development. We&rsquo;re building it the
                  way we build a tax position — secure, documented, and sound
                  before it ships, rather than rushed to a launch date.
                </p>
                <p>
                  Until it goes live, your advisor remains your direct line for
                  document and account questions, and onboarding is handled
                  personally.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal kind="fade" delay={0.08}>
            <CTABlock
              surface="dark"
              eyebrow="Request access"
              title="Want a place in line when the portal opens?"
              body="Tell us a little about your relationship with Fortress and we'll notify you as access becomes available. Existing clients can ask their advisor directly."
              primary={{
                href: "/contact",
                label: "Request access or get notified",
              }}
              secondary={{ href: "/consultation", label: "Talk to an advisor" }}
              note="No login exists yet — we won't ask you to create one until the portal is genuinely ready."
            />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
