import fs from "node:fs";
import path from "node:path";

type ContentKind = "service" | "industry" | "insight";

type ParsedMarkdown = {
  title: string;
  /** The dek/summary, extracted once and stripped from `body`. */
  description: string;
  /** Body with the dek (and any pulled-out sections) removed — no dupes. */
  body: string;
  metadata: Record<string, string>;
  /** Content of a `## Source anchor` section, if present. */
  sourceAnchor?: string;
};

export type ServiceEntry = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export type IndustryEntry = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export type InsightEntry = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  /** Primary topic cluster derived from category (for filtering / relations). */
  topic: string;
  /** Audience framing derived from topic — never a fabricated client claim. */
  audience: string;
  /** Editorial format label (Tax Alert / Analysis / Reference). */
  format: string;
  /** Raw "Originally published" string, e.g. "January 2025". */
  published: string;
  /** Four-digit year, or "Archive" if absent. */
  year: string;
  /** A sortable key (YYYY-MM) derived from the published string. */
  publishedSort: string;
  /** Estimated reading time in minutes (>= 1). */
  readingMinutes: number;
  /** Source-anchor citation text, if the article declares one. */
  sourceAnchor?: string;
};

const copyRoot = path.join(process.cwd(), "..", "04-copy");
const coreSiteRoot = path.join(copyRoot, "core-site");
const archiveRoot = path.join(copyRoot, "archive");

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function readMarkdown(filePath: string) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function slugToLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function blockType(block: string): "h2" | "h3" | "list" | "quote" | "para" {
  if (block.startsWith("## ")) return "h2";
  if (block.startsWith("### ")) return "h3";
  if (block.startsWith("> ")) return "quote";
  if (block.split("\n").every((line) => line.trim().startsWith("- ")))
    return "list";
  return "para";
}

/**
 * Parse a Fortress markdown file:
 *  - first `# ` line is the title
 *  - `**Key:** value` lines are metadata
 *  - the DEK is extracted once (from a `## Summary` section if present,
 *    otherwise the first body paragraph) and REMOVED from the body so it
 *    never renders twice (fixes the historical dupe-dek bug)
 *  - a `## Source anchor` section is lifted into metadata, also removed
 */
function parseMarkdown(raw: string): ParsedMarkdown {
  const lines = raw.split(/\r?\n/);
  const metadata: Record<string, string> = {};
  let title = "";
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (!title && line.startsWith("# ") && !line.startsWith("## ")) {
      title = line.replace(/^#\s+/, "").trim();
      continue;
    }

    const metadataMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (metadataMatch) {
      metadata[metadataMatch[1].trim()] = metadataMatch[2].trim();
      continue;
    }

    bodyLines.push(line);
  }

  const blocks = bodyLines
    .join("\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  // Pull a `## Summary` section (heading + the paragraph(s) under it) out as
  // the dek, and a `## Source anchor` section out as a citation. Remaining
  // blocks become the body — the dek is therefore not duplicated.
  let description = "";
  let sourceAnchor: string | undefined;
  const kept: string[] = [];

  let mode: "none" | "summary" | "source" = "none";

  for (const block of blocks) {
    const type = blockType(block);

    if (type === "h2" || type === "h3") {
      const headingText = block.replace(/^#+\s+/, "").trim().toLowerCase();
      if (type === "h2" && headingText === "summary") {
        mode = "summary";
        continue; // drop the "Summary" heading itself
      }
      if (type === "h2" && headingText === "source anchor") {
        mode = "source";
        continue; // drop the "Source anchor" heading itself
      }
      mode = "none";
      kept.push(block);
      continue;
    }

    if (mode === "summary") {
      // First paragraph under Summary is the dek; keep it ONLY as the dek.
      if (!description && type === "para") {
        description = block.replace(/\n+/g, " ");
      } else {
        // Any extra summary content stays out of body too (it's intro matter).
      }
      continue;
    }

    if (mode === "source") {
      sourceAnchor = (sourceAnchor ? sourceAnchor + " " : "") + block.replace(/\n+/g, " ");
      continue;
    }

    kept.push(block);
  }

  // Fallback dek: first plain paragraph of the kept body, then strip it so it
  // isn't rendered twice (covers services/industries with no `## Summary`).
  if (!description) {
    const firstParaIndex = kept.findIndex((b) => blockType(b) === "para");
    if (firstParaIndex !== -1) {
      description = kept[firstParaIndex].replace(/\n+/g, " ");
      kept.splice(firstParaIndex, 1);
    }
  }

  return {
    title,
    description,
    body: kept.join("\n\n").trim(),
    metadata,
    sourceAnchor,
  };
}

function estimateReadingMinutes(body: string, dek: string) {
  const words = `${dek} ${body}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function publishedSortKey(published: string): string {
  const yearMatch = published.match(/\b(20\d{2})\b/);
  const year = yearMatch?.[1] ?? "0000";
  const monthMatch = published.toLowerCase().match(/[a-z]+/);
  const month = monthMatch ? MONTHS[monthMatch[0]] ?? "00" : "00";
  return `${year}-${month}`;
}

/**
 * Map a (sometimes compound) category like "Tax Controversy / Business Tax"
 * to a single primary topic cluster used for filtering and relations.
 */
function topicFromCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("controvers") || c.includes("irs") || c.includes("complian"))
    return "Controversy & Compliance";
  if (c.includes("trust") || c.includes("estate") || c.includes("private"))
    return "Trusts & Estates";
  if (c.includes("salt") || c.includes("state")) return "State & Local";
  if (c.includes("planning") || c.includes("business") || c.includes("entity"))
    return "Business & Planning";
  return "Business & Planning";
}

function audienceFromTopic(topic: string): string {
  switch (topic) {
    case "Trusts & Estates":
      return "Families, fiduciaries, and private capital";
    case "Controversy & Compliance":
      return "Owners and finance leaders managing exposure";
    case "State & Local":
      return "Multi-state operators and pass-through owners";
    default:
      return "Owners, operators, and investors";
  }
}

/** Editorial format labels, in the order they rank for explicit declarations. */
const FORMATS = ["Tax Alert", "Analysis", "Reference"];

function formatFromCategory(category: string, title: string): string {
  const c = `${category} ${title}`.toLowerCase();
  if (c.includes("checklist") || c.includes("faq") || c.includes("reference"))
    return "Reference";
  if (
    c.includes("alert") ||
    c.includes("moratorium") ||
    c.includes("goes live") ||
    c.includes("deadline") ||
    c.includes("signed") ||
    c.includes("begins")
  )
    return "Tax Alert";
  return "Analysis";
}

function getEntriesFromDirectory(kind: ContentKind) {
  const directory = kind === "insight" ? archiveRoot : coreSiteRoot;
  const prefix =
    kind === "service" ? "service-" : kind === "industry" ? "industry-" : "";

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => (prefix ? file.startsWith(prefix) : true))
    .sort();
}

export function getServices(): ServiceEntry[] {
  return getEntriesFromDirectory("service").map((fileName) => {
    const slug = fileName.replace(/^service-/, "").replace(/\.md$/, "");
    const parsed = parseMarkdown(
      readMarkdown(path.join(coreSiteRoot, fileName))
    );

    return {
      slug,
      title: parsed.title || slugToLabel(slug),
      summary: parsed.description,
      body: parsed.body,
    };
  });
}

export function getServiceBySlug(slug: string) {
  return getServices().find((service) => service.slug === slug);
}

export function getIndustries(): IndustryEntry[] {
  return getEntriesFromDirectory("industry").map((fileName) => {
    const slug = fileName.replace(/^industry-/, "").replace(/\.md$/, "");
    const parsed = parseMarkdown(
      readMarkdown(path.join(coreSiteRoot, fileName))
    );

    return {
      slug,
      title: parsed.title || slugToLabel(slug),
      summary: parsed.description,
      body: parsed.body,
    };
  });
}

export function getIndustryBySlug(slug: string) {
  return getIndustries().find((industry) => industry.slug === slug);
}

export function getInsights(): InsightEntry[] {
  return getEntriesFromDirectory("insight")
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const parsed = parseMarkdown(
        readMarkdown(path.join(archiveRoot, fileName))
      );
      const published = parsed.metadata["Originally published"] ?? "";
      const yearMatch = published.match(/\b(20\d{2})\b/);
      const category = parsed.metadata.Category ?? "Insights";
      const topic = topicFromCategory(category);

      // An article may declare `**Format:** Tax Alert` explicitly; otherwise we
      // derive it from category/title keywords. Explicit always wins so the
      // editorial team controls what surfaces in the Tax Alerts stream rather
      // than depending on a keyword landing in the headline.
      const explicitFormat = parsed.metadata.Format;
      const format =
        explicitFormat && FORMATS.includes(explicitFormat)
          ? explicitFormat
          : formatFromCategory(category, parsed.title);

      return {
        slug,
        title: parsed.title || slugToLabel(slug),
        summary: parsed.description,
        body: parsed.body,
        category,
        topic,
        audience: audienceFromTopic(topic),
        format,
        published,
        year: yearMatch?.[1] ?? "Archive",
        publishedSort: publishedSortKey(published),
        readingMinutes: estimateReadingMinutes(parsed.body, parsed.description),
        sourceAnchor: parsed.sourceAnchor,
      };
    })
    .sort((a, b) => b.publishedSort.localeCompare(a.publishedSort));
}

export function getInsightBySlug(slug: string) {
  return getInsights().find((insight) => insight.slug === slug);
}

/** Distinct topic clusters present in the archive, in a stable display order. */
export function getInsightTopics(): string[] {
  const order = [
    "Business & Planning",
    "Trusts & Estates",
    "State & Local",
    "Controversy & Compliance",
  ];
  const present = new Set(getInsights().map((i) => i.topic));
  return order.filter((t) => present.has(t));
}

/** Distinct years present in the archive, newest first. */
export function getInsightYears(): string[] {
  const years = new Set(
    getInsights()
      .map((i) => i.year)
      .filter((y) => /^\d{4}$/.test(y))
  );
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}
