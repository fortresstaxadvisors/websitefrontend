import { Eyebrow } from "@/components/ui/primitives";
import { KeystoneGlyph } from "@/components/brand/motifs";

/*
  Methodology — "The Fortress Hold Method" (client-approved; see
  00-orchestration/confirmed-inputs.md).

  A real five-step SEQUENCE, so numbered markers (01–05) are earned. Steps are
  described in METHOD terms — never as fabricated outcomes or results. Drawn as
  connected keystones to echo the signature elevation.
*/

const STAGES = [
  {
    n: "01",
    title: "Define the facts",
    body: "Every engagement begins with a full accounting of where a position actually stands — entities, elections, ownership, and the planning horizon — before anything is recommended.",
  },
  {
    n: "02",
    title: "Evaluate exposure",
    body: "We map where the real risk sits: the positions most likely to draw scrutiny, the areas of genuine ambiguity, and what each is worth examining before it matters.",
  },
  {
    n: "03",
    title: "Build the structure",
    body: "Positions are designed to withstand review — documented, internally consistent, and sound across multiple years rather than optimized for a single one.",
  },
  {
    n: "04",
    title: "Coordinate execution",
    body: "Tax is integrated with legal, finance, and wealth counterparts so the structure holds together in practice — not just on paper, and not in isolation.",
  },
  {
    n: "05",
    title: "Monitor change over time",
    body: "Positions are maintained as the law moves. The same advisors who built the structure keep it current against enforcement, reporting, and legislative change.",
  },
];

export function Methodology({
  teaser = false,
}: {
  /** Teaser mode renders a compact lead-in (for the homepage). */
  teaser?: boolean;
}) {
  return (
    <div>
      <div className={teaser ? "max-w-2xl" : "max-w-3xl"}>
        <Eyebrow>The Fortress Hold Method</Eyebrow>
        <h2 className="display mt-4 t-h2 text-[var(--ink)]">
          A position is only as good as its ability to{" "}
          <em>withstand scrutiny</em>.
        </h2>
        <p className="lede mt-5 text-[var(--muted)]">
          Our way of turning complex tax facts into durable positions — a
          deliberate, five-step sequence built to hold under audit, professional
          review, and time.
        </p>
      </div>

      <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage) => (
          <li
            key={stage.n}
            className="reveal flex flex-col bg-[var(--surface)] p-6 md:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="index-num text-2xl text-[var(--accent-ink)]">
                {stage.n}
              </span>
              <KeystoneGlyph className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <h3 className="serif mt-5 text-[1.15rem] leading-snug text-[var(--ink)]">
              {stage.title}
            </h3>
            <p className="mt-2.5 text-[0.88rem] leading-7 text-[var(--muted)]">
              {stage.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
