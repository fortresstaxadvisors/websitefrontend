/*
  Figure specs — the data contract for in-article diagrams.

  Diagrams are authored as DATA, not as one-off JSX, so they stay on-brand and
  consistent: a single set of hand-built primitives renders every figure from a
  typed spec. An article body references a figure by id with a one-line token
  (`::figure id="…"`), and the registry resolves that id to one of these specs.

  Design intent: engraved architectural schematics, not generic charts —
  hairlines, one brass accent, tabular figures, serif for the values that carry
  weight. Every spec must read as cleanly in text (screen readers) as on screen.
*/

/** Fields shared by every figure. */
type FigureBase = {
  /** Short tracked-caps label above the figure, e.g. "Effective dates". */
  kicker?: string;
  /** The figure's title — the one-line claim it makes. */
  title: string;
  /** Optional reading line under the figure (what to take from it). */
  caption?: string;
  /** Optional source/authority line (statute, notice, court). */
  source?: string;
};

/** A vertical, dated sequence of milestones along an engraved spine. */
export type TimelineSpec = FigureBase & {
  type: "timeline";
  milestones: {
    /** Tabular date or period, e.g. "Jan 19, 2025" or "Q3 2026". */
    date: string;
    label: string;
    detail?: string;
    /** Optional headline magnitude for this milestone, e.g. "20%". */
    value?: string;
    /** 0–1 magnitude for the milestone's bar (escalation/severity). */
    fill?: number;
    /** Mark the pivotal milestone (filled brass node, ink text). */
    emphasis?: boolean;
  }[];
};

/** A before/after split divided by a single pivotal date. */
export type TwoRegimeSpec = FigureBase & {
  type: "two-regime";
  /** The dividing line — rendered as the central keystone. */
  pivot: { date: string; label?: string };
  left: { heading: string; rows: { label: string; value?: string }[] };
  right: { heading: string; rows: { label: string; value?: string }[] };
};

/** A ladder of triggers → values (rate schedules, tier tables, phase-downs). */
export type ThresholdLadderSpec = FigureBase & {
  type: "threshold-ladder";
  /** Column header for the trigger side, e.g. "Holding period". */
  triggerLabel?: string;
  /** Column header for the value side, e.g. "Gain excluded". */
  valueLabel?: string;
  rungs: {
    trigger: string;
    /** The headline value, e.g. "50%" or "$15M". Rendered tabular/serif. */
    value: string;
    detail?: string;
    /** 0–1 fill for the engraved bar. Omit to render the rung bar-less. */
    fill?: number;
    emphasis?: boolean;
  }[];
};

/** A compact decision: one question, a small set of condition → outcome rows. */
export type DecisionPathSpec = FigureBase & {
  type: "decision-path";
  question: string;
  branches: {
    condition: string;
    outcome: string;
    /** Tone of the outcome keyline: proceed / weigh-it / stop. */
    tone?: "go" | "caution" | "stop";
  }[];
};

export type FigureSpec =
  | TimelineSpec
  | TwoRegimeSpec
  | ThresholdLadderSpec
  | DecisionPathSpec;
