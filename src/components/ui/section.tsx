import type { ReactNode } from "react";

/*
  Section — the band primitive. Owns the light/dark tonal rhythm: pick a
  `tone` and the inner content inherits the correct text/accent/hairline
  semantics (see `.band-*` in globals.css). Wraps content in the standard
  `.shell`. This is how Wave-1 pages compose the page's vertical rhythm.
*/

type Tone = "paper" | "paper-deep" | "surface" | "slate" | "slate-deep";

const toneClass: Record<Tone, string> = {
  paper: "band-paper",
  "paper-deep": "band-paper-deep",
  surface: "band-surface",
  slate: "band-slate",
  "slate-deep": "band-slate-deep",
};

export function Section({
  children,
  tone = "paper",
  tight = false,
  id,
  className = "",
  innerClassName = "",
  wide = false,
  as: As = "section",
}: {
  children: ReactNode;
  tone?: Tone;
  tight?: boolean;
  id?: string;
  className?: string;
  innerClassName?: string;
  wide?: boolean;
  as?: "section" | "div" | "footer" | "header";
}) {
  return (
    <As
      id={id}
      className={`band ${toneClass[tone]} ${
        tight ? "section-tight" : "section"
      } ${className}`}
    >
      <div className={`${wide ? "shell-wide" : "shell"} ${innerClassName}`}>
        {children}
      </div>
    </As>
  );
}
