import Link from "next/link";
import { Eyebrow } from "@/components/ui/primitives";

/*
  WhoWeServe — the buyer-stage axis. General target profiles only (from the
  positioning memo) — no named clients, counts, or outcomes. Framed by the
  decision environment each profile is in, not by claims about who Fortress
  has worked with.
*/

const PROFILES = [
  {
    stage: "Pre-liquidity",
    title: "Founders approaching an exit",
    body: "Owners whose tax situation has outgrown a generalist and for whom a single consequential decision — a sale, a recap, a transfer — will define the outcome.",
  },
  {
    stage: "Sponsor-backed",
    title: "PE-backed portfolio companies",
    body: "Operating companies where ownership structure, add-ons, and reporting demands require tax integrated with the broader deal and finance function.",
  },
  {
    stage: "Multi-generational",
    title: "Family offices",
    body: "Families coordinating tax across entities, trusts, and generations — where continuity and structural integrity matter more than single-year optimization.",
  },
  {
    stage: "Private wealth",
    title: "High-net-worth individuals",
    body: "Individuals with genuine complexity — concentrated positions, multi-state exposure, estate planning windows — who need a position that holds under scrutiny.",
  },
  {
    stage: "Scaling",
    title: "Growth-stage operators",
    body: "Companies whose footprint, headcount, and entity map are expanding faster than their tax structure was built to support.",
  },
];

export function WhoWeServe() {
  return (
    <div>
      <div className="max-w-2xl">
        <Eyebrow>Who We Serve</Eyebrow>
        <h2 className="display mt-4 t-h2 text-[var(--ink)]">
          Built for those who <em>cannot afford</em> loose advice.
        </h2>
        <p className="lede mt-5 text-[var(--muted)]">
          Fortress is organized around clients in decision environments where
          the cost of a weak position is real — not around volume.
        </p>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
        {PROFILES.map((p) => (
          <div
            key={p.title}
            className="reveal group flex flex-col bg-[var(--paper)] p-6 transition-colors duration-300 hover:bg-[var(--surface)] md:p-7"
          >
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)]">
              {p.stage}
            </span>
            <h3 className="serif mt-3 text-[1.2rem] leading-snug text-[var(--ink)]">
              {p.title}
            </h3>
            <p className="mt-2.5 text-[0.9rem] leading-7 text-[var(--muted)]">
              {p.body}
            </p>
          </div>
        ))}
        {/* A quiet "Industries" tile to bridge to the sector axis. */}
        <div className="reveal flex flex-col justify-between bg-[var(--paper-deep)] p-6 md:p-7">
          <p className="text-[0.9rem] leading-7 text-[var(--muted)]">
            Industries are the other axis — sector environments where ownership
            and reporting reality change the answer.
          </p>
          <Link href="/industries" className="link-arrow mt-5">
            View industries
            <span className="arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
