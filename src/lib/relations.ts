/*
  Relations — a hand-maintained cross-link map between the three content types
  (insights ↔ services ↔ industries). Wave-1 pages use these helpers to render
  "related" rails on detail pages.

  Mapping is by topic so it stays robust as the archive grows. Each insight's
  category (which may be compound, e.g. "Tax Controversy / Business Tax") maps
  to one or more service slugs and, where natural, industry slugs.
*/

import {
  getInsights,
  getServices,
  getIndustries,
  type InsightEntry,
  type ServiceEntry,
  type IndustryEntry,
} from "@/lib/content";

export type RelationGroup = {
  /** Canonical service slugs this category relates to. */
  services: string[];
  /** Canonical industry slugs this category relates to (optional). */
  industries: string[];
};

/** Category keyword → related slugs. First match wins, longest keys first. */
const CATEGORY_RELATIONS: { match: RegExp; group: RelationGroup }[] = [
  {
    // Real estate first, so "real estate" isn't swallowed by the estate rule.
    match: /real estate|cost segregation/i,
    group: {
      services: ["business-tax-strategy", "entity-structuring"],
      industries: ["real-estate"],
    },
  },
  {
    match: /trust|estate|grantor|private/i,
    group: {
      services: ["trust-estate-tax", "family-office-tax-coordination"],
      industries: ["private-investors-family-capital"],
    },
  },
  {
    match: /state and local|salt|multi-?state|nexus/i,
    group: {
      services: ["multi-state-compliance", "business-tax-strategy"],
      industries: ["professional-services", "technology-saas"],
    },
  },
  {
    match: /controvers|moratorium|audit|notice|irs|complian/i,
    group: {
      services: ["tax-controversy-support", "business-tax-strategy"],
      industries: [],
    },
  },
  {
    match: /entity|transparency|cleanup|structure/i,
    group: {
      services: ["entity-structuring", "transaction-exit-planning"],
      industries: ["manufacturing-distribution"],
    },
  },
  {
    match: /credit|incentive|clean vehicle|prevailing wage/i,
    group: {
      services: ["business-tax-strategy"],
      industries: ["manufacturing-distribution"],
    },
  },
  {
    match: /retirement|secure/i,
    group: {
      services: ["business-tax-strategy", "family-office-tax-coordination"],
      industries: [],
    },
  },
  {
    match: /individual/i,
    group: {
      services: ["business-tax-strategy", "trust-estate-tax"],
      industries: [],
    },
  },
  {
    // default: business / planning
    match: /.*/i,
    group: {
      services: ["business-tax-strategy", "transaction-exit-planning"],
      industries: [],
    },
  },
];

function relationGroupForCategory(category: string): RelationGroup {
  for (const { match, group } of CATEGORY_RELATIONS) {
    if (match.test(category)) return group;
  }
  return CATEGORY_RELATIONS[CATEGORY_RELATIONS.length - 1].group;
}

/** Services/industries related to a given insight (by its category). */
export function relatedToInsight(insight: InsightEntry): {
  services: ServiceEntry[];
  industries: IndustryEntry[];
  related: InsightEntry[];
} {
  const group = relationGroupForCategory(insight.category);
  const allServices = getServices();
  const allIndustries = getIndustries();
  const allInsights = getInsights();

  const services = group.services
    .map((slug) => allServices.find((s) => s.slug === slug))
    .filter((s): s is ServiceEntry => Boolean(s));

  const industries = group.industries
    .map((slug) => allIndustries.find((i) => i.slug === slug))
    .filter((i): i is IndustryEntry => Boolean(i));

  // Related insights: same topic, excluding self, newest first, up to 3.
  const related = allInsights
    .filter((i) => i.slug !== insight.slug && i.topic === insight.topic)
    .slice(0, 3);

  return { services, industries, related };
}

/** Insights related to a service (reverse lookup by category mapping). */
export function insightsForService(slug: string, limit = 3): InsightEntry[] {
  return getInsights()
    .filter((insight) =>
      relationGroupForCategory(insight.category).services.includes(slug)
    )
    .slice(0, limit);
}

/** Insights related to an industry (reverse lookup by category mapping). */
export function insightsForIndustry(slug: string, limit = 3): InsightEntry[] {
  return getInsights()
    .filter((insight) =>
      relationGroupForCategory(insight.category).industries.includes(slug)
    )
    .slice(0, limit);
}

/** Services commonly paired with an industry (operational adjacency). */
const INDUSTRY_SERVICES: Record<string, string[]> = {
  "real-estate": ["entity-structuring", "business-tax-strategy", "transaction-exit-planning"],
  "professional-services": ["business-tax-strategy", "multi-state-compliance", "entity-structuring"],
  healthcare: ["business-tax-strategy", "entity-structuring", "tax-controversy-support"],
  "manufacturing-distribution": ["business-tax-strategy", "multi-state-compliance", "transaction-exit-planning"],
  "technology-saas": ["entity-structuring", "transaction-exit-planning", "multi-state-compliance"],
  "private-investors-family-capital": ["trust-estate-tax", "family-office-tax-coordination", "transaction-exit-planning"],
};

export function servicesForIndustry(slug: string): ServiceEntry[] {
  const wanted = INDUSTRY_SERVICES[slug] ?? ["business-tax-strategy"];
  const all = getServices();
  return wanted
    .map((s) => all.find((svc) => svc.slug === s))
    .filter((s): s is ServiceEntry => Boolean(s));
}
