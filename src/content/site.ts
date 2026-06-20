export const fortressStats = [
  { value: "5 years", label: "operating at the frontier of tax complexity" },
  { value: "Senior-led", label: "every engagement, by design — not delegated" },
  { value: "Advisory", label: "proactive and structural, not compliance" },
];

// Homepage proof figures — only verifiable / method facts (no fabricated counts).
export const homeProof: { value: string; label: string }[] = [
  { value: "2021", label: "Founded into peak tax complexity" },
  { value: "Senior-led", label: "Engagements, not staffed down to junior teams" },
  { value: "Built to Hold", label: "Positions designed to withstand scrutiny" },
];

export const serviceCards = [
  {
    slug: "business-tax-strategy",
    title: "Business Tax Strategy",
    description:
      "Forward-looking planning for owners, operators, and leadership teams making consequential decisions.",
  },
  {
    slug: "entity-structuring",
    title: "Entity Structuring",
    description:
      "Structure and restructuring guidance built around liability, flexibility, and tax efficiency.",
  },
  {
    slug: "trust-estate-tax",
    title: "Trust and Estate Tax",
    description:
      "Measured, high-trust support for fiduciary reporting and long-horizon planning.",
  },
  {
    slug: "transaction-exit-planning",
    title: "Transaction and Exit Planning",
    description:
      "Tax architecture for sales, recapitalizations, transfers, and liquidity events.",
  },
];

export const services = [
  {
    slug: "business-tax-strategy",
    title: "Business Tax Strategy",
    summary:
      "Forward-looking tax planning tied to actual business decisions rather than generic annual recommendations.",
  },
  {
    slug: "entity-structuring",
    title: "Entity Structuring",
    summary:
      "Formation and restructuring guidance where tax treatment, ownership architecture, and future flexibility all matter.",
  },
  {
    slug: "multi-state-compliance",
    title: "Multi-State Compliance",
    summary:
      "Disciplined support for state filing footprints, nexus exposure, and reporting complexity across jurisdictions.",
  },
  {
    slug: "trust-estate-tax",
    title: "Trust and Estate Tax",
    summary:
      "Fiduciary reporting and planning support for trusts, estates, and long-horizon family structures.",
  },
  {
    slug: "tax-controversy-support",
    title: "Tax Controversy Support",
    summary:
      "Organized response support for notices, disputed positions, and high-friction agency interactions.",
  },
  {
    slug: "transaction-exit-planning",
    title: "Transaction and Exit Planning",
    summary:
      "Planning around recapitalizations, liquidity events, ownership transfers, and tax-sensitive deal structures.",
  },
];

export const industryCards = [
  { slug: "real-estate", label: "Real Estate" },
  { slug: "professional-services", label: "Professional Services" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "manufacturing-distribution", label: "Manufacturing and Distribution" },
  { slug: "technology-saas", label: "Technology and SaaS" },
  { slug: "private-investors-family-capital", label: "Private Investors and Family Capital" },
];

export const insightCards = [
  {
    slug: "2025-tcja-sunset-countdown",
    category: "Tax Planning",
    title: "The 2025 TCJA Sunset Countdown: Core Provisions at Stake for Owners and Families",
  },
  {
    slug: "2024-boi-reporting-goes-live",
    category: "IRS and Compliance",
    title: "BOI Reporting Goes Live: Deadlines, Exemptions, and Immediate Action Items",
  },
  {
    slug: "2023-erc-moratorium",
    category: "Compliance",
    title: "IRS Halts New ERC Claims: What the September 2023 Moratorium Means for Businesses Still Waiting",
  },
];

export const insights = [
  {
    slug: "2025-tcja-sunset-countdown",
    category: "Tax Planning",
    year: "2025",
    title: "The 2025 TCJA Sunset Countdown: Core Provisions at Stake for Owners and Families",
  },
  {
    slug: "2024-boi-reporting-goes-live",
    category: "IRS and Compliance",
    year: "2024",
    title: "BOI Reporting Goes Live: Deadlines, Exemptions, and Immediate Action Items",
  },
  {
    slug: "2023-erc-moratorium",
    category: "Compliance",
    year: "2023",
    title: "IRS Halts New ERC Claims: What the September 2023 Moratorium Means for Businesses Still Waiting",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Define the actual issue",
    description:
      "We start by narrowing the decision, the exposure, and the timeline before we recommend anything.",
  },
  {
    step: "02",
    title: "Build a defensible path",
    description:
      "Every engagement is scoped around decisions that can be documented, coordinated, and executed cleanly.",
  },
  {
    step: "03",
    title: "Coordinate execution",
    description:
      "Fortress works alongside legal, finance, and wealth counterparts so tax is integrated rather than isolated.",
  },
];

/*
  FAQ content — confirmed facts only, written to be self-contained so an answer
  engine can lift any single Q&A and have it stand on its own.

  TRUTHFULNESS: every answer maps to confirmed-inputs.md / history-framing.md —
  founding (2021), senior-led model, the Fortress Hold Method, the firm-level
  CPA-firm credential, the "within one business day" response standard, the
  consultative (no-quote-first) process, and the future Client Portal. No
  fabricated address, phone, headcount, geography, clients, or outcomes.

  NOTE(legal-review): the "licensed CPA firm" answer below is publishable per
  confirmed-inputs.md, but the EXACT legal wording must be reviewed and
  approved before launch. Treat as review-pending (same status as /about and
  /leadership).
*/

/** Firm-level FAQ — used on the Contact page. "What is Fortress / how to start." */
export const firmFaq: { question: string; answer: string }[] = [
  {
    question: "What is Fortress Tax Advisors?",
    answer:
      "Fortress Tax Advisors is a senior-led, licensed CPA firm that provides proactive tax advisory — planning, entity structuring, transaction and exit planning, multi-state compliance, trust and estate tax, and controversy support — for businesses, investors, fiduciaries, and high-net-worth families managing genuine tax complexity. Founded in 2021, the firm practices advisory rather than pure compliance: the work begins before transactions are structured, not after returns are filed.",
  },
  {
    question: "Is Fortress a CPA firm?",
    answer:
      "Yes. Fortress is a licensed CPA firm with CPAs on staff. That credential is held at the firm level. Engagements are led by senior advisors who remain responsible for the relationship over time.",
  },
  {
    question: "How does Fortress work?",
    answer:
      "Every engagement follows the Fortress Hold Method — a real five-step sequence: define the facts, evaluate exposure, build the structure, coordinate execution, and monitor change over time. Work is led by a senior advisor rather than delegated to a junior team, and the same advisor who builds a position helps maintain it as the law changes.",
  },
  {
    question: "What is the first step?",
    answer:
      "A focused first conversation. You share the decision, deadline, or question on the table; a senior advisor defines the issue with you and recommends the right next step — before any engagement begins, and whether or not that step runs through Fortress. There is no quote before the issue is defined.",
  },
  {
    question: "How fast does Fortress respond?",
    answer:
      "A Fortress advisor replies within one business day. Every inquiry is read by a senior advisor before it is answered, rather than triaged by a queue. If a matter is time-sensitive, say so and it will be prioritized.",
  },
  {
    question: "Who does Fortress work with?",
    answer:
      "Business owners, investors, fiduciaries, high-net-worth families, operating companies, and complex individual taxpayers — typically those who have outgrown a generalist or do not want to be a minor account at a larger firm. Fortress serves clients across the United States, including multi-state situations.",
  },
];

/** Process-focused FAQ — used on the Consultation page. "What a first call is." */
export const consultationFaq: { question: string; answer: string }[] = [
  {
    question: "What happens in a first conversation with Fortress?",
    answer:
      "It is a focused, senior-led call oriented around your facts. A senior advisor listens first, asks the questions that define the issue, gives a direct read on whether this is work Fortress should do, and recommends a next step. You leave with a defined issue and a path forward — whether or not it becomes an engagement.",
  },
  {
    question: "Is the consultation a sales call?",
    answer:
      "No. There is no script and no pressure. If now is not the time, that is a legitimate outcome of the conversation. Fortress does not issue positions on a first call; the goal is to frame the question correctly so the work that follows can hold.",
  },
  {
    question: "Will I get a price or quote on the first call?",
    answer:
      "Not before the issue is defined. Fortress defines the issue and the timeline first, then scopes the engagement that fits. Precision comes before price, not after — scope follows the conversation rather than the other way around.",
  },
  {
    question: "What should I have ready for the conversation?",
    answer:
      "Roughly: what prompted the call (a transaction, a notice, a filing, or a question that has grown past your current advisor), your structure at a high level (entities, ownership, and any elections involved), and who else is at the table — counsel, a CFO, a wealth advisor. Exact figures are not needed to start a useful conversation.",
  },
  {
    question: "Will I work with the same advisor throughout?",
    answer:
      "Yes. The advisor in the first conversation is the advisor on the file. Fortress is senior-led by design: the same advisors who build a position coordinate its execution and keep it current as enforcement, reporting, and legislation change.",
  },
];
