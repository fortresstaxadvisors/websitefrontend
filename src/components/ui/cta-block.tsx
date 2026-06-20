import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/primitives";
import { FortressElevation } from "@/components/brand/fortress-elevation";

/*
  CTABlock — the consultative call-to-action. Two surfaces:
   - "dark": brass-accented slate block with the signature elevation watermark
   - "light": quiet editorial variant on paper
  Consultative language only ("Speak with a Fortress advisor" / "Schedule a
  Consultation") — never urgency or retail warmth.
*/

type Action = { href: string; label: string; variant?: "primary" | "secondary" };

export function CTABlock({
  eyebrow = "Start Here",
  title,
  body,
  primary = { href: "/contact", label: "Speak with a Fortress advisor" },
  secondary,
  note,
  surface = "dark",
  watermark = true,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  primary?: Action;
  secondary?: Action;
  note?: ReactNode;
  surface?: "dark" | "light";
  watermark?: boolean;
}) {
  const dark = surface === "dark";

  return (
    <div
      className={`relative isolate overflow-hidden rounded-[var(--radius-lg)] px-7 py-12 md:px-14 md:py-16 ${
        dark ? "band-slate-deep on-slate" : "band-surface border border-[var(--line)]"
      }`}
    >
      {dark && watermark ? (
        <FortressElevation
          variant="opener"
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-16 hidden h-[140%] w-auto text-[var(--accent-bright)] opacity-[0.13] md:block"
        />
      ) : null}

      <div className="relative grid gap-9 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-12">
        <div className="max-w-xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="display mt-4 t-h2 text-[var(--ink)]">{title}</h2>
          {body ? (
            <p className="lede mt-5 text-[1.05rem] leading-8 text-[var(--muted)]">
              {body}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <Button href={primary.href} variant={primary.variant ?? "primary"} arrow className="w-full">
            {primary.label}
          </Button>
          {secondary ? (
            <Button
              href={secondary.href}
              variant={secondary.variant ?? "secondary"}
              className="w-full"
            >
              {secondary.label}
            </Button>
          ) : null}
          {note ? (
            <p className="pt-2 text-sm leading-7 text-[var(--muted)]">{note}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
