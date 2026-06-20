/*
  Industry detail content — the structured, sector-specific layer that the
  thin copy deks (04-copy/core-site/industry-*.md) intentionally don't carry.

  Why this lives here (a documented assumption):
  The markdown copy files provide only a one-line dek per industry. The build
  plan requires a STRUCTURED detail template (operating reality → where tax
  changes the answer → how Fortress helps), not a flat dek. Rather than invent
  prose inside the page, the sector-specific framing is authored once here as
  typed data the template consumes. The dek itself still comes from the content
  layer (`getIndustryBySlug().summary`) and is rendered once in the hero only.

  Truthfulness: every item below describes a REAL, well-documented tax
  phenomenon for the sector (cost recovery, §174, nexus, pass-through economics,
  etc.). Nothing here is a client name, count, outcome, fee, SLA, office, or
  testimonial. Framing is operational and general — "where the rules bite,"
  never "what we did for whom."
*/

export type IndustryPoint = {
  /** Short, declarative label (the lever / the issue). */
  label: string;
  /** One or two sentences of operational framing. */
  body: string;
};

export type IndustryDetail = {
  /** The eyebrow / sector tag shown in the hero. */
  tag: string;
  /**
   * The operating reality — a short, sector-specific paragraph (markdown for
   * <Prose>). Frames the environment, not Fortress. No dek duplication.
   */
  reality: string;
  /** A compact phrase summarizing the sector's tax posture, for the aside. */
  realityAside: string;
  /** The decisions where tax materially changes the answer for this sector. */
  pressurePoints: IndustryPoint[];
  /**
   * How Fortress works in this sector — markdown for <Prose>. Ties to the
   * Fortress Hold Method and the broader practice; method-over-personality.
   */
  approach: string;
  /** Slugs of services most relevant here (order = display order). */
  serviceSlugs: string[];
  /** Optional intro line for the "related services" rail. */
  servicesLede?: string;
};

export const INDUSTRY_DETAIL: Record<string, IndustryDetail> = {
  "real-estate": {
    tag: "Real Estate",
    realityAside:
      "Few sectors reward structure — and punish improvisation — as directly.",
    reality:
      "Real estate is one of the few sectors where the tax answer is built into the structure of the deal itself. Cost recovery, the timing of gain, how losses pass through to owners, and which state has a claim are not afterthoughts to a transaction — they are functions of how the entity, the financing, and the hold period were arranged before anything closed. The same property can produce very different after-tax results depending on decisions made at acquisition, and most of those decisions are difficult or impossible to revisit later.\n\nOwnership rarely sits in one place. Operating entities, investment vehicles, and family holdings layer over the same assets, each with its own reporting posture and its own exposure. The work is less about any single return than about keeping that structure coherent as properties are acquired, refinanced, contributed, and eventually sold or passed on.",
    pressurePoints: [
      {
        label: "Cost recovery and the timing of deductions",
        body: "Depreciation method, component segregation, and the treatment of improvements determine when value is recovered — and the difference compounds over a hold. Decisions made at acquisition are difficult to unwind once a return is filed.",
      },
      {
        label: "Deferral and the structure of gain",
        body: "Like-kind exchanges, installment treatment, and the ordering of gain on disposition turn on how the holding entity and the transaction were arranged well before a closing date. The deferral either survives review or it does not.",
      },
      {
        label: "Passive activity and loss utilization",
        body: "Whether losses are usable in the year they arise depends on material participation, grouping, and an owner's broader activity — a question that has to be answered for the structure, not just the property.",
      },
      {
        label: "State exposure across the footprint",
        body: "Property in multiple states means multiple filing obligations, apportionment questions, and withholding on nonresident owners. Footprint drives exposure, and footprint changes with every acquisition.",
      },
      {
        label: "Ownership layering and legacy",
        body: "Operating, investment, and family-held interests in the same assets carry different reporting and transfer consequences. Keeping the layers consistent is what allows the position to hold across years and across owners.",
      },
    ],
    approach:
      "Fortress supports real estate tax decisions in operating, investment, and legacy contexts — and treats them as one connected structure rather than a sequence of isolated returns. Work typically begins before an acquisition or disposition is structured, where the leverage is real, and continues through the hold as the footprint and ownership change.\n\nThe **Fortress Hold Method** governs how that work is done: define the facts of the structure as it actually stands, evaluate where the exposure sits across entities and states, build positions documented to survive review, coordinate with legal and finance counterparts on execution, and monitor the structure as the law and the portfolio move.",
    serviceSlugs: [
      "entity-structuring",
      "business-tax-strategy",
      "transaction-exit-planning",
    ],
    servicesLede:
      "The services most often engaged across an acquisition, a hold, and an eventual disposition.",
  },

  "professional-services": {
    tag: "Professional Services",
    realityAside:
      "The firm's economics and its tax posture are the same conversation.",
    reality:
      "A professional firm's tax position is inseparable from how the firm is owned and how its partners are paid. Entity form, the line between compensation and distribution, retirement and deferral structures, and the way the firm spreads across states all shape the result — and all of them touch partner economics directly. There is no neutral version of these choices: a structure that suits one partner mix or growth stage can become the wrong one as the firm changes.\n\nThese firms also tend to grow their geographic footprint faster than their tax structure was built to support. Remote partners, multi-state clients, and new offices create filing and apportionment questions that compound quietly until they surface in a return or a notice.",
    pressurePoints: [
      {
        label: "Entity form and partner economics",
        body: "The choice and maintenance of entity form drives self-employment exposure, the treatment of partner compensation, and how income is allocated. It is rarely a one-time decision — the right structure shifts as the partner group does.",
      },
      {
        label: "Compensation versus distribution",
        body: "How partner pay is characterized affects payroll exposure, qualified business income treatment, and the firm's overall posture. The line has to be drawn deliberately and documented, not assumed.",
      },
      {
        label: "Multi-state footprint",
        body: "Remote partners, clients in other states, and new locations create nexus, apportionment, and pass-through entity tax questions. Footprint expands faster than most firms revisit their filing posture.",
      },
      {
        label: "Pass-through entity tax elections",
        body: "State-level elections that shift tax to the entity carry real trade-offs across a partner group spread over multiple states — and the analysis has to be redone as the law and the footprint change.",
      },
      {
        label: "Retirement and deferral structures",
        body: "Deferred compensation and retirement arrangements interact with entity form and partner cash flow. Built well, they hold; built reactively, they create exposure that surfaces later.",
      },
    ],
    approach:
      "Fortress focuses on planning that fits how a firm actually operates — its partner group, its compensation model, and the footprint it has grown into — rather than a generic pass-through template. The aim is a structure partners understand and that holds up as the firm changes shape.\n\nThrough the **Fortress Hold Method**, the firm's facts are defined as they stand today, exposure is mapped across entities and states, the structure is built and documented to withstand review, execution is coordinated with the firm's finance and legal counterparts, and the position is maintained as partners, clients, and locations change.",
    serviceSlugs: [
      "business-tax-strategy",
      "multi-state-compliance",
      "entity-structuring",
    ],
    servicesLede:
      "The services that most often shape a firm's structure and its multi-state posture.",
  },

  healthcare: {
    tag: "Healthcare",
    realityAside:
      "Reimbursement and regulation shape the tax answer as much as economics do.",
    reality:
      "Healthcare businesses operate inside constraints that most other companies don't: reimbursement timing that distorts cash flow and accounting method choices, ownership rules that limit who can hold equity, and a regulatory environment where the tax structure has to coexist with compliance obligations that come first. Tax planning here cannot be designed in isolation — it has to fit a structure that was shaped by clinical, regulatory, and payer realities before tax entered the conversation.\n\nThe organizations themselves are often layered: practice entities, management or services companies, and real estate held separately. Each layer has its own reporting posture, and the relationships between them are exactly where exposure tends to concentrate.",
    pressurePoints: [
      {
        label: "Accounting method and reimbursement timing",
        body: "When revenue is recognized and how reimbursement lags interact with cash- versus accrual-method choices shapes taxable income in ways specific to how the practice is paid. The method has to match the economics, not fight them.",
      },
      {
        label: "Ownership structure and regulatory limits",
        body: "Rules governing who may own a practice push many groups toward management-company and related structures. The tax treatment of those arrangements has to be sound on its own terms and consistent with the regulatory rationale behind them.",
      },
      {
        label: "Management and services entities",
        body: "Fees and allocations between a practice and an affiliated management or services company are a recurring area of scrutiny. They need to be priced and documented to withstand review.",
      },
      {
        label: "Real estate held alongside the practice",
        body: "Medical real estate is frequently owned in a separate entity, which raises the same cost-recovery, leasing, and related-party questions that any owner-occupied real estate does — with added sensitivity given the regulated operator.",
      },
      {
        label: "Transactions and consolidation",
        body: "Acquisitions, roll-ups, and partner transitions are common in the sector, and each carries entity, allocation, and successor-exposure questions that reward planning before the deal is structured.",
      },
    ],
    approach:
      "Fortress provides guidance that accounts for reimbursement realities, ownership constraints, regulatory sensitivity, and the operational complexity of how care organizations are actually built. The tax structure is designed to fit the regulatory structure, not to sit awkwardly beside it.\n\nThe **Fortress Hold Method** anchors the work: define the facts across practice, management, and real-estate entities; evaluate where exposure concentrates in the relationships between them; build positions documented to withstand review; coordinate with legal and finance counterparts who carry the regulatory load; and monitor the structure as the organization grows or consolidates.",
    serviceSlugs: [
      "business-tax-strategy",
      "entity-structuring",
      "tax-controversy-support",
    ],
    servicesLede:
      "The services that most often support a layered care organization and its exposure.",
  },

  "manufacturing-distribution": {
    tag: "Manufacturing & Distribution",
    realityAside:
      "Inventory, footprint, and supply chain are tax questions, not just operations.",
    reality:
      "Manufacturers and distributors carry tax consequences inside their operations in a way service businesses do not. How inventory is valued and capitalized, where physical operations and inventory create nexus, how tariffs and sourcing flow through cost, and how capital investment is recovered all move taxable income — and all of them follow from operating decisions made for reasons that often have nothing to do with tax. The result rewards deliberate tax architecture and penalizes treating these as filing-season cleanup.\n\nFootprint is the recurring complication. Plants, warehouses, inventory in transit, and distribution into many states create obligations that expand as the business grows and the supply chain shifts.",
    pressurePoints: [
      {
        label: "Inventory accounting and capitalization",
        body: "Inventory methods and the rules requiring certain costs to be capitalized into inventory directly affect taxable income. The right method depends on how the business actually produces and moves goods.",
      },
      {
        label: "Nexus across a physical footprint",
        body: "Plants, warehouses, inventory, and sales into multiple states create income- and sales-tax obligations that follow the operations. Footprint drives exposure, and footprint changes with the supply chain.",
      },
      {
        label: "Tariffs, sourcing, and cost flow",
        body: "Sourcing decisions and tariff costs flow through the cost of goods and into taxable income. Treating them as a tax variable, not only a procurement one, keeps the position coherent.",
      },
      {
        label: "Capital investment and cost recovery",
        body: "Equipment, facilities, and process investment carry depreciation and expensing choices whose timing materially changes near-term results. These are decisions worth making before the capital is committed.",
      },
      {
        label: "Transactions and succession",
        body: "Sales, recapitalizations, and ownership transitions raise entity, basis, and successor-exposure questions. Disciplined structure ahead of a transaction protects the value built over years of operations.",
      },
    ],
    approach:
      "Fortress treats these businesses as systems where operating decisions and tax outcomes are connected — and builds disciplined tax architecture rather than reactive filing work. The leverage is in planning the structure around how the business runs, then keeping it current as the footprint and supply chain move.\n\nThrough the **Fortress Hold Method**, the facts of the operation are defined, exposure is mapped across inventory, footprint, and capital structure, positions are built and documented to withstand review, execution is coordinated with finance and operations counterparts, and the structure is monitored as the business and the rules around it change.",
    serviceSlugs: [
      "business-tax-strategy",
      "multi-state-compliance",
      "transaction-exit-planning",
    ],
    servicesLede:
      "The services that most often support an operating footprint and an eventual transition.",
  },

  "technology-saas": {
    tag: "Technology & SaaS",
    realityAside:
      "Complexity that other companies meet at scale arrives here early.",
    reality:
      "Technology companies tend to encounter advanced tax complexity earlier in their lives than businesses in most other sectors. Equity compensation, the treatment of research and software development costs, where digital revenue is sourced, and cross-border structure all arrive while the company is still growing — often before there is a finance function built to absorb them. Decisions made early, when they feel premature, are frequently the ones that define the result at a financing or an exit.\n\nThese questions also interact. An equity plan, an R&D position, and a multi-state or multi-country revenue map are not separate problems; they are facets of a single structure that has to remain coherent as the company scales.",
    pressurePoints: [
      {
        label: "Capitalization of research and software costs",
        body: "Rules requiring research and experimentation costs — including much software development — to be capitalized and amortized can sharply raise taxable income for R&D-heavy companies. The position has to be taken deliberately and documented.",
      },
      {
        label: "Equity compensation",
        body: "Option and equity structures, early elections, and qualified-stock treatment carry consequences for the company and its people that are difficult to fix retroactively. They reward planning before grants are made.",
      },
      {
        label: "Revenue sourcing and nexus",
        body: "Digital and subscription revenue raises questions about where income is sourced and which states' sales-tax rules reach software and services. Economic-presence standards mean exposure can exist without any physical footprint.",
      },
      {
        label: "Cross-border structure",
        body: "International customers, contractors, and IP create cross-border questions — withholding, permanent establishment, transfer pricing — that surface earlier for technology companies than for most.",
      },
      {
        label: "Financing and exit readiness",
        body: "Priced rounds, recapitalizations, and acquisitions surface every prior structural decision at once. Tax diligence is far easier to pass when the structure was built to be examined.",
      },
    ],
    approach:
      "Fortress supports the tax planning layer around technology growth — the equity, research, revenue, and cross-border decisions that arrive early — so the structure is ready for the financing or exit that will eventually test it. The work is meant to keep pace with the company rather than catch up to it.\n\nThe **Fortress Hold Method** structures the engagement: define the facts as the company is built, evaluate where exposure concentrates across equity, R&D, and footprint, build positions documented to withstand diligence and review, coordinate execution with finance, legal, and corporate counsel, and monitor the structure as the company raises, scales, and approaches an exit.",
    serviceSlugs: [
      "entity-structuring",
      "transaction-exit-planning",
      "multi-state-compliance",
    ],
    servicesLede:
      "The services that most often support a company built to be examined at financing and exit.",
  },

  "private-investors-family-capital": {
    tag: "Private Investors & Family Capital",
    realityAside:
      "Continuity across entities and generations matters more than any single year.",
    reality:
      "Private investors and family capital structures are defined by coordination rather than by any single return. Investment entities, operating interests, trusts, and the people who benefit from them are connected, and a decision in one place — a liquidity event, a distribution, a transfer — moves the answer everywhere else. The work is long-horizon by nature: it is measured across generations and transitions, not optimized for a single tax year.\n\nThat horizon is exactly what makes structure matter. Trust design, the timing of gain on a liquidity event, the basis that carries to the next generation, and the planning windows opened and closed by changing law all compound over decades. Coordination is not a nicety here; it is the whole discipline.",
    pressurePoints: [
      {
        label: "Trust and entity structure",
        body: "How trusts and investment entities are designed governs income taxation, distributions, and what passes to the next generation. These structures are built to last, which makes getting them right at the outset decisive.",
      },
      {
        label: "Liquidity events and the timing of gain",
        body: "Sales of operating interests and concentrated positions raise questions of gain timing, basis, and entity treatment that are best resolved before the event, not after the proceeds are in hand.",
      },
      {
        label: "Transfer planning and the exemption window",
        body: "Lifetime exemption levels and the rules around them change with legislation, and several planning windows are time-bound. Strategy has to anticipate the change rather than react to it.",
      },
      {
        label: "Coordination across entities and advisors",
        body: "Tax, legal, and wealth decisions touch the same structure from different directions. Continuity across them is what keeps a family's position coherent over time.",
      },
      {
        label: "Multi-state and multi-generational exposure",
        body: "Residency, situs, and interests held across states and generations create layered exposure that a single-year view will miss. The structure has to be read as a whole.",
      },
    ],
    approach:
      "Fortress coordinates planning across trusts, operating interests, liquidity events, and long-term transfer strategy — treating a family's capital as one structure to be maintained, not a set of separate returns. Continuity is the point: the same advisors who define the structure keep it current as the family and the law change.\n\nThe **Fortress Hold Method** carries that through: define the facts across entities, trusts, and generations; evaluate where exposure and planning windows sit; build positions documented to withstand review and time; coordinate with legal and wealth counterparts so the structure holds together; and monitor it across transitions and legislative change.",
    serviceSlugs: [
      "trust-estate-tax",
      "family-office-tax-coordination",
      "transaction-exit-planning",
    ],
    servicesLede:
      "The services most often engaged to coordinate a family's capital across entities and time.",
  },
};

export function getIndustryDetail(slug: string): IndustryDetail | undefined {
  return INDUSTRY_DETAIL[slug];
}
