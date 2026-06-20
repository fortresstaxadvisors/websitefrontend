import { Eyebrow } from "@/components/ui/primitives";

/*
  EraTimeline — the honest scale signal. 2021 → 2026 rendered as a precise
  drawing-style timeline using ONLY public legislative / regulatory facts
  (no fabricated firm milestones, clients, or outcomes). This is the credential:
  Fortress has only ever practiced at the frontier of this complexity.

  Facts are matters of public record (see 02-brand/history-framing.md §2).
*/

type Era = {
  year: string;
  marker: string;
  title: string;
  body: string;
};

const ERAS: Era[] = [
  {
    year: "2021",
    marker: "Founded",
    title: "Founded into peak complexity",
    body: "Fortress is founded as practitioners work through TCJA structural questions — §199A, §163(j), entity choice — alongside the retroactive wave of CARES-era elections and Employee Retention Credit activity.",
  },
  {
    year: "2022",
    marker: "IRA",
    title: "Enforcement expands; the code shifts",
    body: "The Inflation Reduction Act expands IRS examination capacity and adds the corporate AMT and stock-buyback excise. SECURE 2.0 rewrites retirement parameters. The documentation standard for complex returns rises.",
  },
  {
    year: "2023",
    marker: "Scrutiny",
    title: "The position-quality era",
    body: "The ERC moratorium and renewed high-income examination programs make defensibility — not aggressiveness — the operative standard for positions taken on a return.",
  },
  {
    year: "2024",
    marker: "Reporting",
    title: "New reporting regimes go live",
    body: "Beneficial ownership information reporting goes live and digital-asset reporting takes shape. Compliance footprints widen for entities that previously assumed they were out of scope.",
  },
  {
    year: "2025",
    marker: "Sunset",
    title: "The TCJA sunset window",
    body: "Individual and pass-through TCJA provisions — rates, §199A, the estate and gift exemption — are scheduled to expire after December 31, 2025. One of the most consequential structural planning windows in a decade.",
  },
  {
    year: "2026",
    marker: "Now",
    title: "Five years at the frontier",
    body: "Five years of operating in exactly this environment. The conditions that defined the window — enforcement, reporting, the sunset horizon — are the continuing conditions of the market Fortress serves.",
  },
];

export function EraTimeline() {
  return (
    <div>
      <Eyebrow>Built for this era</Eyebrow>
      <h2 className="display mt-4 t-h2 max-w-3xl text-[var(--ink)]">
        Founded in 2021. We have never practiced in a{" "}
        <em>materially simpler</em> tax landscape.
      </h2>
      <p className="lede mt-5 max-w-2xl text-[var(--muted)]">
        Most firms market years in practice. Fortress reframes the credential:
        not how long, but under what conditions. Every year of the firm&rsquo;s
        history is a year at the frontier of the most demanding regulatory
        period in a generation.
      </p>

      <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {ERAS.map((era, i) => (
          <li key={era.year} className="reveal relative">
            <div className="flex items-baseline gap-4">
              <span className="serif tnum text-[var(--fs-data)] leading-none text-[var(--ink)]">
                {era.year}
              </span>
              <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
                {era.marker}
              </span>
            </div>
            <hr className="mt-4 rule-coursing" />
            <h3 className="serif mt-4 text-[1.2rem] leading-snug text-[var(--ink)]">
              {era.title}
            </h3>
            <p className="mt-2.5 text-[0.92rem] leading-7 text-[var(--muted)]">
              {era.body}
            </p>
            <span className="sr-only">
              Step {i + 1} of {ERAS.length}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
