import type { ReactNode } from "react";
import type {
  TimelineSpec,
  TwoRegimeSpec,
  ThresholdLadderSpec,
  DecisionPathSpec,
} from "./types";

/*
  Figure primitives — the hand-built diagram set for Fortress long-form.

  Pure server components (no client JS). The look is an engraved technical plate
  in the Slate & Brass system: hairlines, rotated-square nodes, tabular figures,
  and real visual encoding (proportional bars, a pivot medallion, a branching
  flowchart) rather than tables of text. Long values WRAP — cells are never
  fixed-width — so nothing overflows the plate at any width.

  Each primitive renders only the inner diagram; `FigureFrame` supplies the
  plate, kicker, title, and caption so framing stays identical across types.
*/

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/* Restrained, earthy semantic tones for decision outcomes — component-local so
   the frozen global tokens stay untouched. Brass-adjacent, never primary RGB. */
const TONE: Record<
  "go" | "caution" | "stop",
  { line: string; tint: string; label: string }
> = {
  go: { line: "#4f6b52", tint: "rgba(79,107,82,0.10)", label: "Proceed" },
  caution: { line: "#9a7a43", tint: "rgba(154,122,67,0.12)", label: "Weigh it" },
  stop: { line: "#9a5a44", tint: "rgba(154,90,68,0.10)", label: "Stop" },
};

/** The shared plate: bordered surface, kicker + title, diagram, caption. */
export function FigureFrame({
  kicker,
  title,
  caption,
  source,
  children,
}: {
  kicker?: string;
  title: string;
  caption?: string;
  source?: string;
  children: ReactNode;
}) {
  return (
    <figure
      role="group"
      aria-label={title}
      className="not-prose !my-12 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_60%,transparent)]"
    >
      <figcaption className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] px-6 py-5 sm:px-8">
        {kicker ? <span className="eyebrow text-[0.66rem]">{kicker}</span> : null}
        <p className="serif mt-3 text-[1.1rem] leading-snug text-[var(--ink)] sm:text-[1.22rem]">
          {title}
        </p>
      </figcaption>

      <div className="px-6 py-7 sm:px-8">{children}</div>

      {caption || source ? (
        <figcaption className="border-t border-[var(--line)] px-6 py-4 sm:px-8">
          {caption ? (
            <p className="text-[0.9rem] leading-7 text-[var(--muted)]">
              {caption}
            </p>
          ) : null}
          {source ? (
            <p className="mt-2 text-[0.72rem] uppercase leading-5 tracking-[0.13em] text-[var(--faint)]">
              {source}
            </p>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** A rotated-square node — the recurring Fortress mark, reused as a diagram dot. */
function Node({ filled = false, size = 11 }: { filled?: boolean; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`block rotate-45 border border-[var(--accent)] ${
        filled ? "bg-[var(--accent)]" : "bg-[var(--surface)]"
      }`}
      style={{ width: size, height: size }}
    />
  );
}

/* ---------------------------------------------------------------- Timeline */

export function TimelineFigure({ spec }: { spec: TimelineSpec }) {
  return (
    <FigureFrame
      kicker={spec.kicker}
      title={spec.title}
      caption={spec.caption}
      source={spec.source}
    >
      <ol className="relative ml-[5px] space-y-8 border-l border-[var(--line-strong)] pl-7">
        {spec.milestones.map((m, i) => {
          const hasBar = typeof m.fill === "number";
          return (
            <li key={i} className="relative min-w-0">
              <span className="absolute top-[3px] -left-[calc(1.75rem+6px)] grid h-3.5 w-3.5 place-items-center bg-[color-mix(in_srgb,var(--surface)_60%,transparent)]">
                <Node filled={m.emphasis} />
              </span>

              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="tnum text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
                  {m.date}
                </span>
                {m.value ? (
                  <span className="serif tnum text-[1.2rem] leading-none text-[var(--ink)]">
                    {m.value}
                  </span>
                ) : null}
              </div>

              <div className="serif mt-1.5 text-[1.05rem] leading-snug text-[var(--ink)]">
                {m.label}
              </div>

              {hasBar ? (
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-sm bg-[var(--line-soft)]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${clamp01(m.fill as number) * 100}%`,
                      background:
                        (m.fill as number) >= 0.85
                          ? "#9a5a44"
                          : "var(--accent)",
                    }}
                  />
                </div>
              ) : null}

              {m.detail ? (
                <p className="mt-2 text-[0.92rem] leading-7 text-[var(--muted)]">
                  {m.detail}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </FigureFrame>
  );
}

/* ------------------------------------------------------------- Two regimes */

export function TwoRegimeFigure({ spec }: { spec: TwoRegimeSpec }) {
  const rows = Math.max(spec.left.rows.length, spec.right.rows.length);
  const dims = Array.from({ length: rows }, (_, i) => ({
    label: spec.left.rows[i]?.label ?? spec.right.rows[i]?.label ?? "",
    legacy: spec.left.rows[i]?.value,
    next: spec.right.rows[i]?.value,
  }));

  return (
    <FigureFrame
      kicker={spec.kicker}
      title={spec.title}
      caption={spec.caption}
      source={spec.source}
    >
      {/* Pivot medallion — the single date the whole split turns on. */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Node filled size={13} />
        <div className="serif tnum mt-2 text-[1.15rem] text-[var(--ink)]">
          {spec.pivot.date}
        </div>
        {spec.pivot.label ? (
          <div className="mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--faint)]">
            {spec.pivot.label}
          </div>
        ) : null}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <ColHead>{spec.left.heading}</ColHead>
        <ColHead accent>{spec.right.heading}</ColHead>
      </div>

      {/* Matched comparison rows — dimension divider + two wrapping cells. */}
      <div className="mt-2">
        {dims.map((d, i) => (
          <div key={i} className="border-t border-[var(--line)] pt-4 pb-1">
            {d.label ? (
              <p className="mb-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
                {d.label}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Cell>{d.legacy}</Cell>
              <Cell accent>{d.next}</Cell>
            </div>
          </div>
        ))}
      </div>
    </FigureFrame>
  );
}

function ColHead({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <p
      className={`min-w-0 text-[0.72rem] font-semibold uppercase leading-snug tracking-[0.1em] ${
        accent ? "text-[var(--accent-ink)]" : "text-[var(--muted)]"
      }`}
    >
      {children}
    </p>
  );
}

function Cell({
  children,
  accent = false,
}: {
  children?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="min-w-0 rounded-[10px] border p-3 text-[0.88rem] leading-6 break-words hyphens-auto"
      style={
        accent
          ? {
              borderColor: "color-mix(in srgb, var(--accent) 26%, transparent)",
              background: "color-mix(in srgb, var(--accent) 7%, transparent)",
              color: "var(--ink)",
            }
          : {
              borderColor: "var(--line)",
              background: "color-mix(in srgb, var(--ink) 3%, transparent)",
              color: "var(--muted)",
            }
      }
    >
      {children || "—"}
    </div>
  );
}

/* --------------------------------------------------------- Threshold ladder */

export function ThresholdLadderFigure({ spec }: { spec: ThresholdLadderSpec }) {
  return (
    <FigureFrame
      kicker={spec.kicker}
      title={spec.title}
      caption={spec.caption}
      source={spec.source}
    >
      {spec.triggerLabel || spec.valueLabel ? (
        <div className="mb-1 flex items-baseline justify-between gap-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
          <span>{spec.triggerLabel}</span>
          <span>{spec.valueLabel}</span>
        </div>
      ) : null}

      <ol className="space-y-5">
        {spec.rungs.map((rung, i) => (
          <li key={i} className="min-w-0 border-t border-[var(--line)] pt-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[0.98rem] leading-snug text-[var(--ink)]">
                  {rung.trigger}
                </div>
                {rung.detail ? (
                  <div className="mt-1 text-[0.86rem] leading-6 text-[var(--muted)]">
                    {rung.detail}
                  </div>
                ) : null}
              </div>
              <div
                className={`serif tnum shrink-0 text-[1.55rem] leading-none ${
                  rung.emphasis ? "text-[var(--accent-ink)]" : "text-[var(--ink)]"
                }`}
              >
                {rung.value}
              </div>
            </div>
            {typeof rung.fill === "number" ? (
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-sm bg-[var(--line-soft)]">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${clamp01(rung.fill) * 100}%`,
                    background: rung.emphasis
                      ? "var(--accent)"
                      : "color-mix(in srgb, var(--accent) 62%, transparent)",
                  }}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </FigureFrame>
  );
}

/* ----------------------------------------------------------- Decision path */

export function DecisionPathFigure({ spec }: { spec: DecisionPathSpec }) {
  return (
    <FigureFrame
      kicker={spec.kicker}
      title={spec.title}
      caption={spec.caption}
      source={spec.source}
    >
      {/* Question node */}
      <div className="rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] p-4">
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)]">
          Decision
        </span>
        <p className="serif mt-2 text-[1.05rem] leading-snug text-[var(--ink)]">
          {spec.question}
        </p>
      </div>

      {/* Branches — spine + elbow connectors + tone-coded outcome cards. */}
      <ul className="relative mt-0 ml-5 border-l border-[var(--line-strong)] pt-2">
        {spec.branches.map((b, i) => {
          const tone = TONE[b.tone ?? "caution"];
          return (
            <li key={i} className="relative mt-4 min-w-0 pl-6 first:mt-2">
              <span
                aria-hidden="true"
                className="absolute top-[1.6rem] -left-px h-px w-6"
                style={{ background: "var(--line-strong)" }}
              />
              <div
                className="rounded-r-[10px] rounded-l-sm border-l-[3px] p-4"
                style={{ borderColor: tone.line, background: tone.tint }}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ background: tone.line }}
                  />
                  <span
                    className="text-[0.64rem] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: tone.line }}
                  >
                    {tone.label}
                  </span>
                </div>
                <p className="mt-2 text-[0.95rem] font-medium leading-6 text-[var(--ink)]">
                  {b.condition}
                </p>
                <p className="mt-1.5 text-[0.92rem] leading-7 text-[var(--muted)]">
                  {b.outcome}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </FigureFrame>
  );
}
