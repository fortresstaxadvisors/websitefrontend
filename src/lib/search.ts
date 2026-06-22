import { getIndustries, getInsights, getServices } from "@/lib/content";
import { getOpenings } from "@/components/careers/openings";

export type SearchSection =
  | "Firm"
  | "Services"
  | "Industries"
  | "Insights"
  | "Careers";

export type SiteSearchItem = {
  title: string;
  href: string;
  section: SearchSection;
  summary: string;
  body?: string;
  meta?: string;
};

export type SiteSearchResult = SiteSearchItem & {
  score: number;
};

const SECTION_ORDER: SearchSection[] = [
  "Firm",
  "Services",
  "Industries",
  "Insights",
  "Careers",
];

const STATIC_PAGES: SiteSearchItem[] = [
  {
    title: "Fortress Tax Advisors",
    href: "/",
    section: "Firm",
    meta: "Home",
    summary:
      "Tax strategy for complex businesses, investors, and legacy planning.",
    body:
      "Fortress helps owners, operators, investors, fiduciaries, and families navigate high-stakes tax decisions with structure, discretion, advisor coordination, and year-round strategic guidance.",
  },
  {
    title: "Services",
    href: "/services",
    section: "Services",
    meta: "Hub",
    summary:
      "Strategic planning, complex compliance, transactions, family and fiduciary coordination, and advisor integration.",
    body:
      "Business tax strategy, entity structuring, multi-state compliance, trust and estate tax, tax controversy support, transaction and exit planning, family office tax coordination, and CFO advisor coordination.",
  },
  {
    title: "Industries",
    href: "/industries",
    section: "Industries",
    meta: "Hub",
    summary:
      "Sector-aware advisory for environments where ownership complexity and operating reality change the tax answer.",
    body:
      "Real estate, professional services, healthcare, manufacturing and distribution, technology and SaaS, private investors, and family capital.",
  },
  {
    title: "Insights",
    href: "/insights",
    section: "Insights",
    meta: "Archive",
    summary:
      "Tax alerts, planning analysis, and a five-year editorial archive of developments that move client decisions.",
    body:
      "Browse tax alerts, analysis, reference articles, topic archives, annual archives, business planning, trusts and estates, state and local tax, controversy, compliance, and IRS developments.",
  },
  {
    title: "About",
    href: "/about",
    section: "Firm",
    summary:
      "Fortress Tax Advisors is a senior-led, licensed CPA firm built for genuine tax complexity.",
    body:
      "Founded in 2021, advisory not compliance, Built to Hold, Fortress Hold Method, senior-led analysis, defensible positions, business owners, investors, fiduciaries, high-net-worth families, and complex taxpayers.",
  },
  {
    title: "Leadership",
    href: "/leadership",
    section: "Firm",
    summary:
      "The principals behind the advisory practice, client experience, operations, and systems.",
    body:
      "Tyler Ballein, Founding and Managing Partner, Omer Muhammad, Partner and CTO, licensed CPA firm, CPAs on staff, senior advisors, Fortress Hold Method, client portal, operations, technology, and engagement standards.",
  },
  {
    title: "Consultation",
    href: "/consultation",
    section: "Firm",
    summary:
      "A focused first conversation to define the facts, the real issue, and the right path forward.",
    body:
      "Consultation, first call, issue definition, urgency, scope, timeline, fit, next step, no quote before the issue is defined, advisor conversation, and one business day response.",
  },
  {
    title: "Contact",
    href: "/contact",
    section: "Firm",
    summary:
      "Start a focused conversation with Fortress. A senior advisor replies within one business day.",
    body:
      "Contact Fortress Tax Advisors, consultation request, advisory inquiry, tax issue, transaction, notice, filing, trust, estate, business, investor, fiduciary, deadline, and next step.",
  },
  {
    title: "Client Portal",
    href: "/client-portal",
    section: "Firm",
    summary:
      "The secure operating layer being built for onboarding, document exchange, engagement visibility, and advisory coordination.",
    body:
      "Portal, secure gateway, document exchange, onboarding, engagement visibility, account questions, client support, advisory coordination, and document workflow.",
  },
  {
    title: "Careers",
    href: "/careers",
    section: "Careers",
    summary:
      "Current openings across engineering, accounting, and client relations at a senior-led, remote-first firm.",
    body:
      "Careers, openings, jobs, remote United States, engineering, accounting, client relations, tax manager, tax associate, trust and estate specialist, software engineer, platform engineer, client onboarding, and client relations.",
  },
  {
    title: "Newsroom",
    href: "/newsroom",
    section: "Firm",
    summary:
      "Firm updates, appearances, and selected commentary adjacent to the broader Insights archive.",
    body:
      "Newsroom, announcements, firm updates, appearances, selected commentary, media, institutional updates, and insights archive.",
  },
];

function stripMarkdown(value: string): string {
  return value
    .replace(/^::figure\s+id="[^"]+"\s*$/gm, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#|[\](){}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return stripMarkdown(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function uniqueTerms(query: string): string[] {
  return Array.from(
    new Set(
      normalize(query)
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(Boolean)
    )
  );
}

function scoreItem(item: SiteSearchItem, query: string, terms: string[]): number {
  const title = normalize(item.title);
  const summary = normalize(item.summary);
  const meta = normalize(item.meta ?? "");
  const body = normalize(item.body ?? "");
  const haystack = `${title} ${summary} ${meta} ${body}`;
  const normalizedQuery = normalize(query);

  if (!terms.every((term) => haystack.includes(term))) {
    return 0;
  }

  let score = title === normalizedQuery ? 80 : 0;
  if (title.includes(normalizedQuery)) score += 36;
  if (summary.includes(normalizedQuery)) score += 22;
  if (meta.includes(normalizedQuery)) score += 10;

  for (const term of terms) {
    if (title.includes(term)) score += 24;
    if (summary.includes(term)) score += 12;
    if (meta.includes(term)) score += 6;
    if (body.includes(term)) score += 3;
  }

  return score;
}

export function getSearchIndex(): SiteSearchItem[] {
  const services = getServices().map<SiteSearchItem>((service) => ({
    title: service.title,
    href: `/services/${service.slug}`,
    section: "Services",
    meta: "Service",
    summary: service.summary,
    body: service.body,
  }));

  const industries = getIndustries().map<SiteSearchItem>((industry) => ({
    title: industry.title,
    href: `/industries/${industry.slug}`,
    section: "Industries",
    meta: "Industry",
    summary: industry.summary,
    body: industry.body,
  }));

  const insights = getInsights().map<SiteSearchItem>((insight) => ({
    title: insight.title,
    href: `/insights/${insight.slug}`,
    section: "Insights",
    meta: [insight.format, insight.topic, insight.published || insight.year]
      .filter(Boolean)
      .join(" · "),
    summary: insight.summary,
    body: [
      insight.category,
      insight.audience,
      insight.sourceAnchor ?? "",
      insight.body,
    ].join(" "),
  }));

  const careers = getOpenings().map<SiteSearchItem>((opening) => ({
    title: opening.title,
    href: `/careers/${opening.slug}`,
    section: "Careers",
    meta: `${opening.teamLabel} · Remote United States`,
    summary: opening.summary,
    body: [
      opening.teamLabel,
      ...opening.intro,
      ...opening.responsibilities,
      ...opening.qualifications,
      opening.howWeWork,
    ].join(" "),
  }));

  return [...STATIC_PAGES, ...services, ...industries, ...insights, ...careers];
}

export function searchSite(
  query: string,
  index: SiteSearchItem[] = getSearchIndex()
): SiteSearchResult[] {
  const terms = uniqueTerms(query);
  if (terms.length === 0) return [];

  return index
    .map((item) => ({ ...item, score: scoreItem(item, query, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const sectionDelta =
        SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section);
      if (sectionDelta !== 0) return sectionDelta;
      return a.title.localeCompare(b.title);
    });
}

export function countResultsBySection(results: SiteSearchResult[]) {
  return SECTION_ORDER.map((section) => ({
    section,
    count: results.filter((result) => result.section === section).length,
  })).filter((group) => group.count > 0);
}
