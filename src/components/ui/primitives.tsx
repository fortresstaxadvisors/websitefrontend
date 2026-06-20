import Link from "next/link";
import type { ReactNode } from "react";
import { SectionOpener } from "@/components/brand/motifs";

/*
  Small shared primitives: Eyebrow, Pill/Tag, SectionHeader, ArrowLink.
  All inherit band semantics via CSS variables — no per-tone props needed.
*/

/** Eyebrow — tracked caps label with the engraved tick. */
export function Eyebrow({
  children,
  bare = false,
  className = "",
  as: As = "p",
}: {
  children: ReactNode;
  bare?: boolean;
  className?: string;
  as?: "p" | "span" | "div" | "h2" | "h3";
}) {
  return (
    <As className={`eyebrow ${bare ? "eyebrow--bare" : ""} ${className}`}>
      {children}
    </As>
  );
}

/** Pill / Tag — a small rounded label for categories, formats, audiences. */
export function Pill({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em]";
  const tones = {
    default:
      "bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] text-[var(--muted)]",
    accent:
      "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent-ink)]",
    outline: "border border-[var(--line)] text-[var(--muted)]",
  };
  return <span className={`${base} ${tones[tone]} ${className}`}>{children}</span>;
}

/** ArrowLink — the standard "read on" inline link with a brass underline. */
export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`link-arrow ${className}`}>
      {children}
      <span className="arrow" aria-hidden="true">
        &rarr;
      </span>
    </Link>
  );
}

/**
 * SectionHeader — eyebrow + headline (+ optional aside paragraph), with the
 * keystone section-opener motif. The standard module header across the site.
 */
export function SectionHeader({
  eyebrow,
  title,
  aside,
  as = "h2",
  align = "left",
  opener = true,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  as?: "h1" | "h2";
  align?: "left" | "center";
  opener?: boolean;
  className?: string;
}) {
  const Heading = as;
  const centered = align === "center";
  return (
    <div
      className={`flex flex-col gap-5 ${
        aside ? "md:flex-row md:items-end md:justify-between md:gap-10" : ""
      } ${className}`}
    >
      <div className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}`}>
        {opener && !centered ? <SectionOpener className="mb-5" /> : null}
        <Eyebrow className={centered ? "eyebrow--center" : ""}>{eyebrow}</Eyebrow>
        <Heading
          className={`display mt-4 ${
            as === "h1" ? "t-h1" : "t-h2"
          } text-[var(--ink)]`}
        >
          {title}
        </Heading>
      </div>
      {aside ? (
        <p className="max-w-sm text-sm leading-7 text-[var(--muted)]">{aside}</p>
      ) : null}
    </div>
  );
}
