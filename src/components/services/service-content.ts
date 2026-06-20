/*
  service-content.ts — page-specific editorial scaffolding for the eight
  service detail pages.

  WHY THIS EXISTS
  ---------------
  The source copy in 04-copy/core-site/service-*.md is intentionally terse: a
  one-line dek, an "Ideal Clients" list (sometimes), and a "Focus" list. Rendered
  flat, that produces the "thin intro + dead space" problem the build is meant to
  fix. This map supplies the STRUCTURED template fields the detail page needs:

    - problem       : the positioning / problem-framing paragraph (1–2 sentences)
    - whoFor        : who the service is for (from the file's "Ideal Clients" +
                      the confirmed client-type vocabulary)
    - scope         : scope-of-work items, each a short label + plain-language line
                      (expanded from the file's "Focus" bullets)
    - engagement    : a single sentence on what working with Fortress looks like
                      for THIS service (ties to the Fortress Hold Method)

  TRUTHFULNESS
  ------------
  Every line here is an editorial expansion of facts already stated in the
  confirmed copy, written in the Fortress voice (see 02-brand/tone-guide.md).
  No fabricated clients, counts, outcomes, geographies, offices, or credentials.
  Client types are drawn only from the confirmed set (confirmed-inputs.md):
  business owners · investors · fiduciaries · high-net-worth families ·
  operating companies · complex individual taxpayers. The body markdown still
  comes from the content layer and renders verbatim with <Prose>.

  Keyed by service slug (matches the markdown file slug). If a slug is missing
  here, the detail page degrades gracefully to the content-layer dek + body.
*/

export type ScopeItem = {
  /** Short label — the area of work. */
  label: string;
  /** One plain-language line on what that work involves. */
  detail: string;
};

export type ServiceContent = {
  /** Eyebrow cluster label shown on the detail hero. */
  cluster: string;
  /** The problem this service addresses, framed before the offering. */
  problem: string;
  /** Who the engagement is built for (confirmed client types only). */
  whoFor: string[];
  /** Scope-of-work items derived from the file's "Focus" list. */
  scope: ScopeItem[];
  /** What working with Fortress looks like for this service (method tie-in). */
  engagement: string;
};

export const SERVICE_CONTENT: Record<string, ServiceContent> = {
  "business-tax-strategy": {
    cluster: "Strategy",
    problem:
      "The point at which a business outgrows generic annual advice is rarely obvious until after a consequential decision has been made. Business Tax Strategy exists to close that gap — to put forward-looking planning next to the decisions that actually move the outcome, on a cadence rather than once a year at filing.",
    whoFor: [
      "Owner-led and operating companies whose tax situation has outgrown a generalist",
      "Growing operators making tax-sensitive timing, structure, and reinvestment decisions",
      "Leadership and finance teams that need planning tied to real choices, not a year-end summary",
    ],
    scope: [
      {
        label: "Planning cadence",
        detail:
          "A recurring planning rhythm so material decisions are modeled before they are made — not reconstructed after the return is filed.",
      },
      {
        label: "Tax modeling",
        detail:
          "Scenario analysis on the decisions that change the number: timing, entity choice, compensation, and reinvestment.",
      },
      {
        label: "Timing & structure decisions",
        detail:
          "Direct advice on when and how to act, with the trade-offs stated plainly rather than buried in process language.",
      },
      {
        label: "Stakeholder coordination",
        detail:
          "Tax positions aligned with finance and legal counterparts so the plan holds together across the people executing it.",
      },
    ],
    engagement:
      "Engagements begin with a structural review — a full accounting of where the position stands today — and continue as an ongoing planning relationship rather than a once-a-year deliverable.",
  },

  "entity-structuring": {
    cluster: "Strategy",
    problem:
      "Legal form, tax treatment, and future flexibility are decided together or they are decided badly. Entity Structuring addresses the moments — formations, restructures, and ownership changes — where the structure chosen now constrains every option available later.",
    whoFor: [
      "Operating companies forming, restructuring, or changing ownership",
      "Business owners aligning legal form with tax treatment and long-term flexibility",
      "Companies preparing the entity map for a future transaction or capital event",
    ],
    scope: [
      {
        label: "Entity selection",
        detail:
          "Choice of legal form evaluated for tax treatment, governance, and the flexibility a future event will demand.",
      },
      {
        label: "Restructuring scenarios",
        detail:
          "Analysis of restructure paths and their tax consequences before a reorganization is committed.",
      },
      {
        label: "Ownership alignment",
        detail:
          "Ownership and equity arrangements structured so interests, control, and tax outcomes stay coherent.",
      },
      {
        label: "Transaction readiness",
        detail:
          "Structure built so a future sale, recapitalization, or transfer is not constrained by a form chosen for convenience.",
      },
    ],
    engagement:
      "Entity work is treated as load-bearing: the structure is designed to be internally consistent and sound across multiple years, not optimized for a single filing.",
  },

  "transaction-exit-planning": {
    cluster: "Strategy",
    problem:
      "In a sale, recapitalization, or redemption, structure is not a detail that follows the deal — it materially affects what the deal is worth. Transaction & Exit Planning brings tax into the room before terms are set, when the structure can still change the outcome.",
    whoFor: [
      "Business owners approaching a sale, recapitalization, or redemption",
      "Operating companies and investors structuring a liquidity or ownership event",
      "Owners who need the tax consequences understood before terms are negotiated",
    ],
    scope: [
      {
        label: "Pre-transaction planning",
        detail:
          "Tax analysis brought in before terms are set, while structure can still change the result.",
      },
      {
        label: "Structure alternatives",
        detail:
          "Deal structures compared on their actual after-tax outcome, not just headline value.",
      },
      {
        label: "Timing implications",
        detail:
          "The effect of timing on the position — holding periods, elections, and the windows that close with a year.",
      },
      {
        label: "Post-close follow-through",
        detail:
          "Execution carried through close and into the returns that have to reflect it, so nothing is left unfinished.",
      },
    ],
    engagement:
      "Transaction engagements are sequenced to the deal: define the facts early, evaluate exposure while it can still be acted on, and coordinate execution through close.",
  },

  "multi-state-compliance": {
    cluster: "Compliance",
    problem:
      "A growing footprint creates filing exposure faster than most teams track it. Multi-State Compliance brings discipline to where a business actually owes attention — nexus, apportionment, and the filing footprint — before a state does the work of finding it first.",
    whoFor: [
      "Operating companies creating filing exposure across multiple jurisdictions",
      "Pass-through owners and businesses with a growing multi-state footprint",
      "Finance teams that need state-level positions documented to withstand scrutiny",
    ],
    scope: [
      {
        label: "Nexus exposure",
        detail:
          "A clear read on where activity creates a filing obligation — before a jurisdiction raises the question.",
      },
      {
        label: "Filing footprint",
        detail:
          "The full map of where the business files and why, kept current as the footprint changes.",
      },
      {
        label: "Apportionment issues",
        detail:
          "State apportionment positions analyzed and documented so they hold up under review.",
      },
      {
        label: "Multi-state discipline",
        detail:
          "A repeatable process for staying ahead of state exposure as the business grows, rather than reacting to notices.",
      },
    ],
    engagement:
      "State work is handled as a maintained position, not a one-time cleanup — monitored as the footprint and the rules change over time.",
  },

  "tax-controversy-support": {
    cluster: "Compliance",
    problem:
      "A notice or examination is not a moment for improvisation. Tax Controversy Support brings organized, technical follow-through to agency friction — framing the issue, assembling the documentation, and carrying the response to resolution rather than reacting to it piecemeal.",
    whoFor: [
      "Businesses and complex individual taxpayers responding to notices or examinations",
      "Owners and finance leaders managing agency friction or information requests",
      "Clients who need a documented, defensible response carried through to resolution",
    ],
    scope: [
      {
        label: "Notice response",
        detail:
          "Organized, on-time responses to notices and information requests — composed, not scrambling.",
      },
      {
        label: "Issue framing",
        detail:
          "The matter framed on its strongest defensible footing before a position is advanced.",
      },
      {
        label: "Documentation support",
        detail:
          "The record assembled to support the position under professional and agency review.",
      },
      {
        label: "Resolution strategy",
        detail:
          "A coordinated path to resolution, with the steps and the timeline made clear throughout.",
      },
    ],
    engagement:
      "Controversy work draws on the same standard applied before filing: a position is built to be defensible, and the documentation is assembled to hold under scrutiny.",
  },

  "trust-estate-tax": {
    cluster: "Compliance",
    problem:
      "Trust reporting and estate administration reward continuity and punish improvisation. Trust & Estate Tax coordinates fiduciary returns, distribution reporting, and long-horizon planning so the people responsible are not reconstructing the position each year.",
    whoFor: [
      "Fiduciaries managing trust reporting and estate administration",
      "High-net-worth families coordinating tax across trusts and generations",
      "Advisors who need a tax counterpart aligned with a long-horizon plan",
    ],
    scope: [
      {
        label: "Fiduciary returns",
        detail:
          "Coordination of fiduciary return filings with the structure and intent behind them.",
      },
      {
        label: "Distribution reporting",
        detail:
          "Distribution reporting handled accurately and consistently across reporting periods.",
      },
      {
        label: "Estate administration",
        detail:
          "The tax matters of estate administration managed alongside the broader settlement.",
      },
      {
        label: "Advisor coordination",
        detail:
          "Tax aligned with the trustees, counsel, and wealth advisors already at the table.",
      },
    ],
    engagement:
      "This work is built for the long horizon — the same advisors stay with the structure as it moves through years, generations, and changes in law.",
  },

  "cfo-advisor-coordination": {
    cluster: "Coordination",
    problem:
      "Tax advice that arrives separate from finance, reporting, and outside counsel arrives too late to shape the decision. CFO & Advisor Coordination integrates tax into the workflows where decisions are actually made — with accountability for execution, not just a memo.",
    whoFor: [
      "Operating companies that need tax integrated into finance and reporting",
      "Finance leaders coordinating tax with outside advisors and counsel",
      "Organizations that want decision support, not a deliverable handed over the wall",
    ],
    scope: [
      {
        label: "Reporting alignment",
        detail:
          "Tax positions aligned with financial reporting so the two tell the same story.",
      },
      {
        label: "Outside-advisor coordination",
        detail:
          "Working directly alongside legal, audit, and wealth counterparts rather than around them.",
      },
      {
        label: "Decision support",
        detail:
          "Tax brought into decisions early enough to change them, framed for the people making the call.",
      },
      {
        label: "Execution accountability",
        detail:
          "Clear ownership of what gets done, by when — so coordination produces action, not just alignment.",
      },
    ],
    engagement:
      "This is the coordination step of the Fortress Hold Method run continuously — tax kept integrated with the rest of the table so the structure holds in practice.",
  },

  "family-office-tax-coordination": {
    cluster: "Coordination",
    problem:
      "Family capital is rarely held in one place, and tax that ignores that fact creates as much risk as it removes. Family Office Tax Coordination aligns tax across entities, trusts, investments, and operating interests — and keeps that alignment current as the structure evolves.",
    whoFor: [
      "High-net-worth families coordinating tax across complex capital structures",
      "Family offices aligning tax with investment, trust, and operating advisors",
      "Fiduciaries and investors who need recurring oversight, not episodic advice",
    ],
    scope: [
      {
        label: "Cross-advisor coordination",
        detail:
          "Tax aligned across the investment, trust, legal, and operating advisors involved.",
      },
      {
        label: "Entity layering",
        detail:
          "The layered entities of a family structure kept coherent and consistent for tax.",
      },
      {
        label: "Trust & investment integration",
        detail:
          "Trust and investment activity integrated so the tax picture stays whole, not fragmented.",
      },
      {
        label: "Recurring oversight",
        detail:
          "Ongoing planning oversight that keeps the structure current as the family's position changes.",
      },
    ],
    engagement:
      "Family-office work is continuity work: the same advisors hold the full picture across entities and years so single-year decisions never undo the long-horizon plan.",
  },
};

export function getServiceContent(slug: string): ServiceContent | undefined {
  return SERVICE_CONTENT[slug];
}
