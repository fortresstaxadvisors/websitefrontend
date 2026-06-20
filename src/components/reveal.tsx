"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";

/*
  Progressive-enhancement reveals. Content is fully visible by default
  (robust with no JS, for crawlers, and under prefers-reduced-motion).
  When JS is present, `html.js .reveal` starts hidden and an
  IntersectionObserver adds `.is-shown` as elements scroll into view.
  No animation library ships to the client.
*/

type Tag = "div" | "section" | "article" | "li" | "span" | "ul" | "ol";
type Kind = "rise" | "rise-lg" | "fade" | "rule";

function styleWithDelay(delay?: number): CSSProperties | undefined {
  return delay ? { transitionDelay: `${delay}s` } : undefined;
}

export function Reveal({
  children,
  kind = "rise",
  delay,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  kind?: Kind;
  delay?: number;
  className?: string;
  as?: Tag;
}) {
  const Tag = as;
  return (
    <Tag
      className={`reveal ${className}`}
      data-kind={kind}
      style={styleWithDelay(delay)}
    >
      {children}
    </Tag>
  );
}

/** Container whose direct .reveal children stagger via nth-child delays. */
export function RevealGroup({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  /** Accepted for API compatibility; stagger is handled in CSS. */
  stagger?: number;
}) {
  const Tag = as;
  return <Tag className={`reveal-group ${className}`}>{children}</Tag>;
}

export function RevealItem({
  children,
  className = "",
  as = "div",
  kind = "rise",
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  kind?: Kind;
  /** Accepted for API compatibility. */
  y?: number;
}) {
  const Tag = as;
  return (
    <Tag className={`reveal ${className}`} data-kind={kind}>
      {children}
    </Tag>
  );
}

/** Mounted once in the root layout. Observes reveal targets per route. */
export function RevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-shown)")
    );
    if (targets.length === 0) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      targets.forEach((el) => el.classList.add("is-shown"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-shown");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    targets.forEach((el) => io.observe(el));

    // Safety net: never leave content hidden if the observer misbehaves.
    const failsafe = window.setTimeout(() => {
      targets.forEach((el) => el.classList.add("is-shown"));
    }, 2500);

    return () => {
      window.clearTimeout(failsafe);
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
