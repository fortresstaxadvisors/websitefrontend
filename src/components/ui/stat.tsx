import type { ReactNode } from "react";

/*
  Stat — a single proof figure. Uses tabular figures and the display serif for
  the value. Truthfulness: only used with confirmed/verifiable values (years,
  regulatory facts), never fabricated counts. Caller supplies the value text.
*/

export function Stat({
  value,
  label,
  index,
  className = "",
}: {
  value: ReactNode;
  label: ReactNode;
  index?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-4 ${className}`}>
      {index ? (
        <span className="index-num text-sm text-[var(--accent-ink)]">
          {index}
        </span>
      ) : null}
      <span>
        <span className="serif tnum block text-[1.7rem] leading-none text-[var(--ink)] md:text-[2rem]">
          {value}
        </span>
        <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
          {label}
        </span>
      </span>
    </div>
  );
}
