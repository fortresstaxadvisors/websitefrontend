/*
  JSON-LD structured data for Fortress Tax Advisors.

  TRUTHFULNESS: firm-level facts only. We assert the things we can stand
  behind — the legal name, the canonical URL, the founding year (2021), the
  "Built to Hold." slogan, and that Fortress is a licensed CPA firm offering
  tax advisory services. We deliberately DO NOT emit a postal address, phone
  number, geo coordinates, employee count, founders, awards, ratings, or
  client claims, because none of those are confirmed/publishable. Adding empty
  or fabricated values would be both untrue and bad for SEO, so they are
  omitted entirely (Google treats absent properties as simply unknown).

  No third-party schema dependency: a small local JSON-LD type keeps the graph
  well-formed without expanding the dependency surface.
*/

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdObject
  | JsonLdValue[];

type JsonLdObject = { [key: string]: JsonLdValue | undefined };

type JsonLdDocument = JsonLdObject & { "@context": string; "@type": string };

const SITE_URL = "https://fortresstaxadvisors.com";
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const ORG_NAME = "Fortress Tax Advisors";

const ORG_DESCRIPTION =
  "Fortress Tax Advisors is a senior-led, licensed CPA firm providing tax " +
  "advisory services — planning, entity structuring, transaction and exit " +
  "planning, multi-state compliance, trust and estate tax, and controversy " +
  "support — for businesses, investors, and fiduciaries managing genuine " +
  "complexity. Founded in 2021. Built to Hold.";

/** Strip `undefined` keys so optional props never emit empty JSON properties. */
function prune(value: JsonLdValue | undefined): JsonLdValue | undefined {
  if (Array.isArray(value)) {
    return value.map(prune).filter((v) => v !== undefined) as JsonLdValue[];
  }
  if (value && typeof value === "object") {
    const out: JsonLdObject = {};
    for (const [k, v] of Object.entries(value)) {
      const pruned = prune(v);
      if (pruned !== undefined) out[k] = pruned;
    }
    return out;
  }
  return value;
}

/** Render a `<script type="application/ld+json">` block from a typed object. */
function JsonLdScript({ data }: { data: JsonLdDocument }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here: it is our own data, fully escaped
      // by stringify, and contains no user input. `dangerouslySetInnerHTML`
      // is the documented way to embed JSON-LD without React escaping the
      // quotes into HTML entities (which would break the JSON).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(prune(data)) }}
    />
  );
}

/**
 * Organization / ProfessionalService node for Fortress Tax Advisors.
 * Mounted once in the root layout so every page advertises the firm.
 */
export function OrganizationJsonLd() {
  const data: JsonLdDocument = {
    "@context": "https://schema.org",
    // ProfessionalService is a subtype of LocalBusiness → Organization; it is
    // the most accurate single type for an advisory practice. We pair it with
    // a stable @id so other nodes (e.g. Article.publisher) can reference it.
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: "Fortress Tax Advisors",
    legalName: "Fortress Tax Advisors",
    url: SITE_URL,
    description: ORG_DESCRIPTION,
    slogan: "Built to Hold.",
    foundingDate: "2021",
    logo: `${SITE_URL}/fortress-logo.svg`,
    image: `${SITE_URL}/opengraph-image`,
    knowsAbout: [
      "Tax advisory",
      "Business tax strategy",
      "Entity structuring",
      "Transaction and exit planning",
      "Multi-state tax compliance",
      "Trust and estate tax",
      "Tax controversy support",
    ],
    areaServed: { "@type": "Country", name: "United States" },
    // Tie the firm to its website node so the two nodes form one graph.
    subjectOf: { "@id": WEBSITE_ID },
  };

  return <JsonLdScript data={data} />;
}

/**
 * WebSite node with a SearchAction. Mounted once in the root layout alongside
 * the Organization node so AI engines and Google can model the site itself
 * (name, language, publisher) and discover the on-site search surface.
 *
 * The site's search experience routes through /insights (see `utilityNav`),
 * which accepts a `?q=` query — the SearchAction target reflects that, so the
 * sitelinks search box (where shown) lands users on real results.
 */
export function WebSiteJsonLd() {
  const data: JsonLdDocument = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: "Fortress Tax Advisors",
    description: ORG_DESCRIPTION,
    inLanguage: "en-US",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/insights?q={search_term_string}`,
      },
      // schema.org requires this to be a literal string naming the query var.
      "query-input": "required name=search_term_string",
    },
  };

  return <JsonLdScript data={data} />;
}

/**
 * BreadcrumbList node. Pass an ordered list of `{ name, url }` crumbs from a
 * page (root → … → current). URLs may be root-relative; they are absolutized.
 * Helps AI engines and Google understand a page's place in the hierarchy and
 * powers breadcrumb rich results. The final crumb is the current page.
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  if (items.length === 0) return null;

  const data: JsonLdDocument = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return <JsonLdScript data={data} />;
}

/**
 * FAQPage node. Pairs with a visible, on-page Q&A block so the structured data
 * always mirrors content a user can read (a Google requirement and the honest
 * default). Answers may include light inline markup; they are emitted as plain
 * strings, so pass already-resolved text.
 *
 * TRUTHFULNESS: only confirmed answers — response standard, CPA-firm credential
 * (firm level), method, and process. No fabricated specifics.
 */
export function FaqJsonLd({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  if (items.length === 0) return null;

  const data: JsonLdDocument = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return <JsonLdScript data={data} />;
}

/**
 * Article node for an Insights/archive piece. Exported for the Insights route
 * to drop into individual article pages (`<ArticleJsonLd ... />`). Publisher
 * references the Organization node by @id so the graph stays consistent.
 *
 * Pass only confirmed values; `datePublished`/`dateModified` are optional and
 * should be omitted rather than faked when a precise date is unknown.
 */
export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  section,
}: {
  title: string;
  description?: string;
  /** Absolute or root-relative URL of the article. */
  url: string;
  /** ISO 8601 (e.g. "2025-01" or "2025-01-15"); omit if unknown. */
  datePublished?: string;
  dateModified?: string;
  /** Editorial section / category, e.g. "Business & Planning". */
  section?: string;
}) {
  const absolute = url.startsWith("http") ? url : `${SITE_URL}${url}`;

  const data: JsonLdDocument = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: absolute,
    mainEntityOfPage: { "@type": "WebPage", "@id": absolute },
    datePublished,
    dateModified: dateModified ?? datePublished,
    articleSection: section,
    isAccessibleForFree: true,
    author: { "@id": ORG_ID, name: "Fortress Tax Advisors" },
    publisher: { "@id": ORG_ID, name: "Fortress Tax Advisors" },
  };

  return <JsonLdScript data={data} />;
}

/**
 * JobPosting node for a single careers opening. Emitted on each
 * `/careers/[role]` page so Google (Job Search / rich results) and AI engines
 * can model the role accurately.
 *
 * Shape notes (per Google's JobPosting guidelines):
 *  - `hiringOrganization` references the existing Organization node by @id and
 *    repeats name/url/logo (Google reads these as direct properties; the @id
 *    keeps the graph consistent across the site).
 *  - Remote role: `jobLocationType: "TELECOMMUTE"` plus an
 *    `applicantLocationRequirements` Country (USA) — the documented pairing for
 *    a fully remote posting with no physical `jobLocation`.
 *  - `description` is required and must be a full HTML string of the same
 *    content shown on the page. We assemble it from the role's sections.
 *
 * TRUTHFULNESS: we deliberately OMIT `baseSalary` (no fabricated comp),
 * `jobBenefits`, headcount, and any office/geo beyond "remote, USA". `validThrough`
 * is omitted (no fixed close date) — Google treats that as an open posting.
 */
export function JobPostingJsonLd({
  title,
  description,
  url,
  datePosted,
  employmentType = "FULL_TIME",
  team,
}: {
  title: string;
  /** Full HTML description of the role (mirrors the visible page content). */
  description: string;
  /** Absolute or root-relative URL of the role page. */
  url: string;
  /** ISO 8601 date the role was posted, e.g. "2026-06-19". */
  datePosted: string;
  /** Schema.org employmentType token. */
  employmentType?: string;
  /** Department / team, surfaced via `occupationalCategory` and `industry`. */
  team?: string;
}) {
  const absolute = url.startsWith("http") ? url : `${SITE_URL}${url}`;

  const data: JsonLdDocument = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    datePosted,
    employmentType,
    url: absolute,
    mainEntityOfPage: { "@type": "WebPage", "@id": absolute },
    // Direct + @id reference: Google reads the inline name/url/logo; the @id
    // ties this back to the site-wide Organization node.
    hiringOrganization: {
      "@id": ORG_ID,
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/fortress-logo.svg`,
      sameAs: SITE_URL,
    },
    // Fully remote, United States — the documented remote pairing.
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: { "@type": "Country", name: "USA" },
    occupationalCategory: team,
    industry: "Tax advisory services",
    directApply: false,
  };

  return <JsonLdScript data={data} />;
}
