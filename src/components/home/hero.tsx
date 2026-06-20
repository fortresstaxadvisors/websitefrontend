import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/primitives";
import { ProofBand } from "@/components/ui/proof-band";
import { FortressElevation } from "@/components/brand/fortress-elevation";
import { AshlarField } from "@/components/brand/motifs";
import { homeProof } from "@/content/site";

/*
  Hero — the thesis, not a template. Opens with the most characteristic thing
  in Fortress's world: the "Built to Hold." structural statement set against
  the signature architectural elevation. One orchestrated load sequence
  (`.hero-load` + data-seq), reduced-motion safe via CSS.
*/

export function HomeHero() {
  return (
    <section className="band band-paper relative isolate overflow-hidden">
      {/* faint ashlar texture behind everything */}
      <AshlarField
        className="pointer-events-none absolute inset-0 -z-10 text-[var(--ink)]"
        opacity={0.04}
      />

      <div className="shell hero-load grid items-center gap-10 pt-12 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:pt-16 lg:gap-14">
        {/* Thesis column */}
        <div className="relative z-10 max-w-2xl">
          <div data-seq="1">
            <Eyebrow>Senior-led tax advisory &middot; Founded 2021</Eyebrow>
          </div>
          <h1
            data-seq="2"
            className="display mt-6 t-display text-[var(--ink)]"
          >
            Built to <em>Hold</em>.
          </h1>
          <p
            data-seq="3"
            className="lede mt-7 max-w-xl text-[1.15rem] leading-8 text-[var(--muted)] md:text-[1.3rem]"
          >
            A defensible position is not the most aggressive one. It is the one
            most likely to hold &mdash; under audit, under review, and over
            time. Fortress Tax Advisors is a senior-led, licensed CPA firm that
            builds tax structures for exactly that standard.
          </p>
          <div
            data-seq="4"
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button href="/contact" variant="primary" arrow>
              Speak with a Fortress advisor
            </Button>
            <Button href="/services" variant="secondary">
              Explore Services
            </Button>
          </div>
        </div>

        {/* Signature column */}
        <div
          data-seq="art"
          className="relative mx-auto w-full max-w-[34rem] md:max-w-none"
        >
          <FortressElevation
            variant="hero"
            animate
            className="h-auto w-full text-[var(--accent)]"
          />
          <p className="mt-1 text-center text-[0.66rem] font-medium uppercase tracking-[0.24em] text-[var(--faint)]">
            Fortress &mdash; elevation &middot; built to hold
          </p>
        </div>
      </div>

      {/* Proof band — honest scale signals */}
      <div className="shell mt-10 pb-14 md:mt-14 md:pb-20">
        <ProofBand items={homeProof} />
      </div>
    </section>
  );
}
