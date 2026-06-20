import type { ReactNode } from "react";
import { Stat } from "@/components/ui/stat";

/*
  ProofBand — a row of proof figures separated by hairlines, sitting on a
  coursing rule. Used for the honest scale signals (years of operation,
  regulatory-era framing). Truthfulness: callers pass only verifiable values.
*/

type ProofItem = { value: ReactNode; label: ReactNode };

export function ProofBand({
  items,
  className = "",
  numbered = false,
}: {
  items: ProofItem[];
  className?: string;
  /** Show ledger numerals — only when the items are a real sequence. */
  numbered?: boolean;
}) {
  const cols =
    items.length >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : items.length === 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-3";
  return (
    <div className={className}>
      <hr className="rule-coursing" />
      <div
        className={`reveal-group grid grid-cols-1 divide-y divide-[var(--line-soft)] sm:divide-x sm:divide-y-0 ${cols}`}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="reveal flex items-baseline py-6 sm:px-8 sm:first:pl-0"
          >
            <Stat
              value={item.value}
              label={item.label}
              index={numbered ? String(i + 1).padStart(2, "0") : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
