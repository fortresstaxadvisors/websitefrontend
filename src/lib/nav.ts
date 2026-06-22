/*
  Site navigation taxonomy — the single source of truth for the mega-menu,
  mobile nav, and footer. Wave-1 agents import from here; they do not
  re-declare nav structure.

  Services are organized into three clusters: Strategy / Compliance /
  Coordination. Slugs match the markdown files in 04-copy/core-site.
*/

export type NavLink = {
  href: string;
  label: string;
  /** Short supporting line shown in the mega-menu. */
  blurb?: string;
};

export type NavCluster = {
  id: string;
  title: string;
  /** One-line framing of the cluster. */
  summary: string;
  links: NavLink[];
};

export const serviceClusters: NavCluster[] = [
  {
    id: "strategy",
    title: "Strategy",
    summary: "Planning and structure for consequential decisions.",
    links: [
      {
        href: "/services/business-tax-strategy",
        label: "Business Tax Strategy",
        blurb: "Forward-looking planning tied to real decisions.",
      },
      {
        href: "/services/entity-structuring",
        label: "Entity Structuring",
        blurb: "Ownership architecture built for flexibility.",
      },
      {
        href: "/services/transaction-exit-planning",
        label: "Transaction & Exit Planning",
        blurb: "Tax architecture for liquidity events.",
      },
    ],
  },
  {
    id: "compliance",
    title: "Compliance",
    summary: "Positions documented to withstand scrutiny.",
    links: [
      {
        href: "/services/multi-state-compliance",
        label: "Multi-State Compliance",
        blurb: "Nexus, footprint, and reporting discipline.",
      },
      {
        href: "/services/tax-controversy-support",
        label: "Tax Controversy Support",
        blurb: "Organized response to notices and disputes.",
      },
      {
        href: "/services/trust-estate-tax",
        label: "Trust & Estate Tax",
        blurb: "Fiduciary reporting and long-horizon planning.",
      },
    ],
  },
  {
    id: "coordination",
    title: "Coordination",
    summary: "Tax integrated with the rest of the table.",
    links: [
      {
        href: "/services/cfo-advisor-coordination",
        label: "CFO & Advisor Coordination",
        blurb: "Working alongside finance and legal counterparts.",
      },
      {
        href: "/services/family-office-tax-coordination",
        label: "Family Office Coordination",
        blurb: "Tax aligned across entities and generations.",
      },
    ],
  },
];

export const industryLinks: NavLink[] = [
  { href: "/industries/real-estate", label: "Real Estate" },
  { href: "/industries/professional-services", label: "Professional Services" },
  { href: "/industries/healthcare", label: "Healthcare" },
  {
    href: "/industries/manufacturing-distribution",
    label: "Manufacturing & Distribution",
  },
  { href: "/industries/technology-saas", label: "Technology & SaaS" },
  {
    href: "/industries/private-investors-family-capital",
    label: "Private Investors & Family Capital",
  },
];

/** Top-level primary nav items (drive the header + mobile nav). */
export const primaryNav: { href: string; label: string }[] = [
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

/** Utility-bar links (search + client portal). Forthcoming features labeled honestly. */
export const utilityNav: { href: string; label: string }[] = [
  { href: "/search", label: "Search" },
  { href: "/client-portal", label: "Client Portal" },
];

/** Footer taxonomy. Reuses the same source so labels never drift. */
export const footerColumns: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Strategy",
    links: serviceClusters[0].links,
  },
  {
    heading: "Compliance",
    links: serviceClusters[1].links,
  },
  {
    heading: "Coordination & Industries",
    links: [
      ...serviceClusters[2].links,
      { href: "/industries", label: "All Industries" },
    ],
  },
  {
    heading: "Firm",
    links: [
      { href: "/about", label: "About" },
      { href: "/leadership", label: "Leadership" },
      { href: "/careers", label: "Careers" },
      { href: "/consultation", label: "Consultation" },
      { href: "/newsroom", label: "Newsroom" },
      { href: "/contact", label: "Contact" },
    ],
  },
];
