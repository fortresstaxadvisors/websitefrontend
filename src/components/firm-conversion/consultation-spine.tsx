import { Eyebrow } from "@/components/ui/primitives";
import { KeystoneGlyph } from "@/components/brand/motifs";

/*
  ConsultationSpine — the Fortress Hold Method rendered as the *engagement
  spine* for the consultation page. The homepage <Methodology> presents the
  method as a thesis; here we reframe the same five steps as what a first
  conversation, and the work that follows, actually moves through. Same real
  five-step sequence (numbered markers earned), described in method terms —
  never as fabricated outcomes.

  Designed to sit on a dark band (band-slate*), where ink/muted/accent flip to
  their on-dark values automatically.
*/

const STEPS = [
  {
    n: "01",
    title: "Define the facts",
    when: "The first conversation",
    body: "We start by understanding where your position actually stands — entities, elections, ownership, and the planning horizon. The opening call is about getting the facts straight, not pitching a service.",
  },
  {
    n: "02",
    title: "Evaluate exposure",
    when: "Framing the issue",
    body: "We map where the real risk and ambiguity sit, and what is worth examining before it becomes a problem. This is where a vague concern becomes a defined question.",
  },
  {
    n: "03",
    title: "Build the structure",
    when: "Scoping the work",
    body: "If there is work to do, we scope it deliberately — positions designed to be documented, internally consistent, and sound across years rather than optimized for one.",
  },
  {
    n: "04",
    title: "Coordinate execution",
    when: "In the engagement",
    body: "Tax is integrated with your legal, finance, and wealth counterparts so the structure holds together in practice. The advisor in the first call is the advisor on the file.",
  },
  {
    n: "05",
    title: "Monitor change over time",
    when: "The relationship",
    body: "Positions are maintained as the law moves. The same advisors who built the structure keep it current against enforcement, reporting, and legislative change.",
  },
];

export function ConsultationSpine() {
  return (
    <div>
      <div className="max-w-2xl">
        <Eyebrow>The Fortress Hold Method</Eyebrow>
        <h2 className="display mt-4 t-h2 text-[var(--ink)]">
          A first conversation follows the same method as the{" "}
          <em>work itself</em>.
        </h2>
        <p className="lede mt-5 text-[var(--muted)]">
          The Fortress Hold Method is our way of turning complex tax facts into
          durable positions. It is also how a relationship begins — the opening
          call moves through the first steps before anyone talks about scope.
        </p>
      </div>

      <ol className="mt-12 flex flex-col gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)]">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="reveal grid gap-4 bg-[var(--surface)] p-6 md:grid-cols-[auto_1fr] md:items-baseline md:gap-8 md:p-7"
          >
            <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
              <span className="index-num text-2xl text-[var(--accent-ink)]">
                {step.n}
              </span>
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--faint)] md:max-w-[8rem] md:leading-5">
                {step.when}
              </span>
            </div>
            <div>
              <h3 className="serif flex items-center gap-2.5 text-[1.2rem] leading-snug text-[var(--ink)]">
                <KeystoneGlyph className="h-4 w-4 flex-none text-[var(--accent)]" />
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-2xl text-[0.95rem] leading-7 text-[var(--muted)]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
