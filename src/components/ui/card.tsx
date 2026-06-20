import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/primitives";

/*
  Card system. Three editorial card shapes used across the site:
   - ServiceCard: titled, with a practical summary and a "view" link
   - ArticleCard: kicker (category/date) + serif title + read link
   - LinkRow: a hairline-divided row (industries, related lists)
  All inherit band semantics; works on light or dark.
*/

export function ServiceCard({
  href,
  index,
  title,
  summary,
  cta = "View service",
}: {
  href: string;
  index?: string;
  title: string;
  summary: string;
  cta?: string;
}) {
  return (
    <article className="group relative flex h-full flex-col bg-[var(--paper)] p-7 transition-colors duration-300 hover:bg-[var(--surface)] md:p-9">
      <Link href={href} className="flex h-full flex-col">
        {index ? (
          <span className="index-num text-sm text-[var(--accent-ink)]">
            {index}
          </span>
        ) : null}
        <h3 className="serif mt-4 t-h3 text-[var(--ink)]">{title}</h3>
        <p className="mt-3.5 max-w-md text-[0.97rem] leading-7 text-[var(--muted)]">
          {summary}
        </p>
        <span className="link-arrow mt-auto pt-6">
          {cta}
          <span className="arrow" aria-hidden="true">
            &rarr;
          </span>
        </span>
      </Link>
    </article>
  );
}

export function ArticleCard({
  href,
  kicker,
  meta,
  title,
  summary,
  cta = "Read insight",
}: {
  href: string;
  kicker: string;
  meta?: string;
  title: string;
  summary?: string;
  cta?: string;
}) {
  return (
    <article className="group flex h-full flex-col bg-[var(--paper)] p-7 transition-colors duration-300 hover:bg-[var(--surface)]">
      <Link href={href} className="flex h-full flex-col">
        <span className="flex items-center gap-3">
          <Eyebrow bare className="!text-[var(--accent-ink)]">
            {kicker}
          </Eyebrow>
          {meta ? (
            <span className="tnum text-[0.72rem] font-medium text-[var(--faint)]">
              {meta}
            </span>
          ) : null}
        </span>
        <h3 className="serif mt-4 text-[1.25rem] leading-[1.28] text-[var(--ink)] md:text-[1.4rem]">
          {title}
        </h3>
        {summary ? (
          <p className="mt-3 text-[0.92rem] leading-7 text-[var(--muted)]">
            {summary}
          </p>
        ) : null}
        <span className="link-arrow mt-auto pt-6">
          {cta}
          <span className="arrow" aria-hidden="true">
            &rarr;
          </span>
        </span>
      </Link>
    </article>
  );
}

export function LinkRow({
  href,
  index,
  title,
  summary,
}: {
  href: string;
  index?: string;
  title: string;
  summary?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group grid items-baseline gap-5 border-t border-[var(--line)] py-6 last:border-b md:gap-8 ${
        index ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[1fr_auto]"
      }`}
    >
      {index ? (
        <span className="index-num text-sm text-[var(--accent-ink)]">
          {index}
        </span>
      ) : null}
      <span>
        <span className="serif block text-[1.35rem] text-[var(--ink)] md:text-[1.7rem]">
          {title}
        </span>
        {summary ? (
          <span className="mt-2 block max-w-2xl text-sm leading-7 text-[var(--muted)]">
            {summary}
          </span>
        ) : null}
      </span>
      <span
        className="self-center text-[var(--accent-ink)] transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden="true"
      >
        &rarr;
      </span>
    </Link>
  );
}

/** Generic surface card (panel) for arbitrary content. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`panel p-6 md:p-7 ${className}`}>{children}</div>;
}
