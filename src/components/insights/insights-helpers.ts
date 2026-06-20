/*
  Insights helpers — shared, non-visual utilities for the editorial archive.

  Owns the topic <-> URL-slug mapping (the content layer exposes topics as
  display strings like "Business & Planning"; the /insights/topic/[topic]
  route needs stable slugs), plus small label/format helpers reused across the
  hub, browse pages, and the article template. No JSX here — keep it a `.ts`.
*/

import type { InsightEntry } from "@/lib/content";

/** A stable, URL-safe slug for any value (topics, formats). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Find the canonical topic display-string that matches a URL slug. */
export function topicFromSlug(slug: string, topics: string[]): string | undefined {
  return topics.find((topic) => slugify(topic) === slug);
}

/**
 * Short, scannable framing for each topic cluster — used as the dek on the
 * browse-by-topic page and the topic rail. Derived from the brand's own
 * vocabulary; no fabricated facts.
 */
export const TOPIC_BLURBS: Record<string, string> = {
  "Business & Planning":
    "Entity structure, pass-through planning, federal reform, and the decisions that move an owner's position.",
  "Trusts & Estates":
    "Fiduciary income tax, exemption windows, and long-horizon planning for families and private capital.",
  "State & Local":
    "Pass-through entity elections, nexus, and the filing footprint of multi-state operators.",
  "Controversy & Compliance":
    "IRS activity, documentation standards, and positions built to withstand scrutiny.",
};

/** A one-line framing for a topic, with a safe fallback. */
export function topicBlurb(topic: string): string {
  return (
    TOPIC_BLURBS[topic] ??
    "Practitioner analysis and developments across the Fortress archive."
  );
}

/**
 * The editorial format vocabulary, in display order. "Tax Alert" is the
 * time-bound stream; "Analysis" the considered pieces; "Reference" the durable
 * explainers. Mirrors `formatFromCategory` in the content layer.
 */
export const FORMAT_ORDER = ["Tax Alert", "Analysis", "Reference"] as const;

/** Compact meta string: "January 2025 · 4 min read" (date falls back to year). */
export function metaLine(insight: InsightEntry): string {
  const when = insight.published || insight.year;
  return `${when} · ${insight.readingMinutes} min read`;
}

/** Group insights by year (newest year first), preserving newest-first order. */
export function groupByYear(
  insights: InsightEntry[]
): { year: string; items: InsightEntry[] }[] {
  const map = new Map<string, InsightEntry[]>();
  for (const insight of insights) {
    const list = map.get(insight.year) ?? [];
    list.push(insight);
    map.set(insight.year, list);
  }
  return Array.from(map.entries())
    .filter(([year]) => /^\d{4}$/.test(year))
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, items]) => ({ year, items }));
}
