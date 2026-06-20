/*
  Careers — typed openings data.

  The single source of truth for Fortress's current openings. The careers index
  (`/careers`) groups these by team; each role renders its own page at
  `/careers/[role]` with a JobPosting structured-data block.

  TRUTHFULNESS (hard rules — see CLAUDE.md + confirmed-inputs.md):
   - Real, generic-but-substantive descriptions only.
   - NO salary / comp / equity / benefits, NO headcount or growth claims,
     NO office or city. Work model is Remote — United States.
   - The CPA credential lives at the FIRM level; a role may require a personal
     CPA only where the role itself genuinely demands it (Tax Manager).
   - Copy is in the Fortress voice (precise, declarative, no promotional filler).

  Apply path: a `mailto:` to the confirmed firm inbox with a role-specific
  subject. The subject is derived from the title so it is always consistent.
  NOTE(client): a dedicated `careers@fortresstaxadvisors.com` would be a clean
  future swap — change APPLY_EMAIL below and nothing else moves.
*/

/** Confirmed-working inbox. Swap to a dedicated careers@ address later. */
export const APPLY_EMAIL = "clientservice@fortresstaxadvisors.com";

/** Date all current openings were posted (used in copy + JobPosting). */
export const OPENINGS_DATE_POSTED = "2026-06-19";

/** The three teams, in display order, with a short framing line for the index. */
export const TEAMS = [
  {
    id: "engineering",
    label: "Engineering",
    blurb:
      "Building the Fortress Client Portal — the secure operating layer for onboarding, document exchange, engagement visibility, and ongoing advisory coordination.",
  },
  {
    id: "accounting",
    label: "Accounting",
    blurb:
      "The advisory practice itself: building and defending tax positions for business owners, investors, fiduciaries, and high-net-worth families.",
  },
  {
    id: "client-relations",
    label: "Client Relations",
    blurb:
      "Holding the relationship together over time — coordination, onboarding, and the continuity the firm is built on.",
  },
] as const;

export type TeamId = (typeof TEAMS)[number]["id"];

export type Opening = {
  /** URL segment for `/careers/[role]`. */
  slug: string;
  title: string;
  team: TeamId;
  /** Plain team label, denormalized for convenience in cards/metadata. */
  teamLabel: string;
  /** One sentence — the meta description and the role-card dek. */
  summary: string;
  /** The role in context: 2 short paragraphs. */
  intro: string[];
  responsibilities: string[];
  /** Heading rendered as "What we're looking for". */
  qualifications: string[];
  /** How this role experiences the Fortress model. One paragraph. */
  howWeWork: string;
};

const TEAM_LABEL: Record<TeamId, string> = {
  engineering: "Engineering",
  accounting: "Accounting",
  "client-relations": "Client Relations",
};

// Raw role content (team label derived below to keep the two in sync).
type RawOpening = Omit<Opening, "teamLabel">;

const RAW_OPENINGS: RawOpening[] = [
  // ---- Engineering ---------------------------------------------------------
  {
    slug: "senior-full-stack-engineer-client-portal",
    title: "Senior Full-Stack Engineer — Client Portal",
    team: "engineering",
    summary:
      "Lead the engineering of the Fortress Client Portal — the secure operating layer through which clients exchange documents, see engagement status, and coordinate advisory work.",
    intro: [
      "Fortress is building its Client Portal as the secure operating layer for onboarding, document exchange, engagement visibility, and ongoing advisory coordination. This role owns the hard parts of that build: how sensitive client material moves through the system, how an engagement's state is modeled and surfaced, and how the work an advisor does on a file becomes visible to the client without exposing anything that should not be.",
      "This is a senior position because the portal is not a marketing site with a login bolted on — it is where the firm's relationship with a client will increasingly live. You will make architectural decisions that hold for years, not ones that get rewritten the moment a second engineer reads them. The firm is senior-led on the advisory side for the same reason it wants a senior engineer here: the people closest to the work make the consequential calls.",
    ],
    responsibilities: [
      "Own end-to-end delivery of core Client Portal capabilities — secure document exchange, engagement-status visibility, and the coordination surfaces advisors and clients use to work together.",
      "Design the data model for engagements, documents, and access so that what each party can see is precise, auditable, and correct by construction rather than by convention.",
      "Build authentication, authorization, and audit logging to a standard appropriate for material financial and tax documents, and document the security posture you are committing the firm to.",
      "Make the architectural decisions — service boundaries, storage, background processing, data retention — and write them down so they can survive review and revisit.",
      "Translate how the firm actually runs an engagement (intake, exchange, coordination, follow-through) into software that matches the work, in direct conversation with the advisors who do it.",
      "Establish the engineering practices the portal will be held to: testing, code review, observability, and a defensible release process.",
      "Stay accountable for what you ship after it ships — including how it behaves under real client load and real client data.",
    ],
    qualifications: [
      "Several years building and operating full-stack web applications that handle sensitive data, with direct ownership of architecture and not just features.",
      "Strong command of a modern TypeScript web stack — the kind of environment built on React/Next.js, Node, and a relational database such as Postgres — with the judgment to choose tools deliberately rather than by default.",
      "Demonstrated care for security and correctness: authorization models, data handling, audit trails, and the failure modes that matter when the data is consequential.",
      "Comfort making decisions with incomplete information and standing behind them, then revising when the facts change.",
      "Experience working directly with non-engineers to turn how a business actually operates into a system that reflects it.",
      "A plus: prior work on document-heavy, compliance-sensitive, or financial / professional-services systems.",
      "A plus: experience setting engineering standards others will work within.",
    ],
    howWeWork:
      "You will own the portal's hardest decisions rather than implement someone else's. There is no architecture handed down to you and supervised from a distance — you scope it, build it, and remain responsible for how it behaves in production. You will work directly with the partners and the advisors whose engagements the portal serves, which means short paths between a question and an answer and no layers between you and the people who know what the software has to do.",
  },
  {
    slug: "software-engineer-full-stack",
    title: "Software Engineer (Full-Stack)",
    team: "engineering",
    summary:
      "Build and ship features across the Fortress Client Portal and internal tooling, working close to the advisors and clients the software serves.",
    intro: [
      "This role builds the Client Portal alongside the senior engineer who owns its architecture — the secure operating layer for onboarding, document exchange, engagement visibility, and ongoing advisory coordination. You will take features from a described need to working software in clients' hands, across the full stack, with real responsibility for the parts you build.",
      "It is a role for an engineer who wants to understand the work the software supports, not just the ticket in front of them. Fortress is a small, senior-led firm; the distance between writing a feature and seeing an advisor or client use it is short, and the feedback is direct. That proximity is the point.",
    ],
    responsibilities: [
      "Build features across the stack — interface, application logic, data layer — for the Client Portal's document exchange, engagement visibility, and coordination capabilities.",
      "Implement access and permission rules correctly, so that each client and advisor sees exactly what they should and nothing more.",
      "Write code that is reviewed, tested, and maintainable by someone other than you, and review the same from your colleagues.",
      "Investigate and resolve issues in running software, including ones involving real client data, with the care that data warrants.",
      "Contribute to internal tooling that supports onboarding and engagement coordination behind the portal.",
      "Raise the questions a feature description leaves unanswered before building on an assumption, and confirm them with the advisors who know.",
      "Keep what you ship working — own your features through release and into use.",
    ],
    qualifications: [
      "Professional experience building full-stack web applications, with the ability to work confidently across frontend and backend.",
      "Working fluency in a modern TypeScript stack — React/Next.js, Node, and a relational database such as Postgres — or clear evidence you can become fluent quickly.",
      "Sound instincts for correctness and clarity: you test your work, you handle the edge cases, and you write code the next person can read.",
      "The habit of asking what a feature is actually for before deciding how to build it.",
      "Care for security and data handling appropriate to financial and tax material.",
      "A plus: experience with document handling, authentication flows, or compliance-sensitive applications.",
      "A plus: comfort owning a feature end to end with minimal supervision.",
    ],
    howWeWork:
      "Work here is not handed to you pre-decided and checked from afar. You will own features outright, make the calls within them, and stay responsible for how they behave once people rely on them. Because the firm is small and senior-led, you will talk directly to the advisors and partners who know what the software has to do — so you build against real understanding, not a relayed description, and you grow by doing consequential work rather than waiting to be trusted with it.",
  },
  {
    slug: "platform-devops-engineer",
    title: "Platform / DevOps Engineer",
    team: "engineering",
    summary:
      "Own the infrastructure, security posture, and deployment foundations the Fortress Client Portal runs on, where the data is sensitive and uptime is a client commitment.",
    intro: [
      "The Client Portal is being built as the secure operating layer for onboarding, document exchange, engagement visibility, and ongoing advisory coordination — which means the infrastructure underneath it carries real weight. This role owns that foundation: how the system is deployed, how it stays available, how it is monitored, and how the firm can demonstrate that sensitive client material is handled to a defensible standard.",
      "For a firm whose entire proposition is positions that hold under scrutiny, infrastructure is not a back-office concern. The same standard the advisory side applies to a tax position — built deliberately, documented, able to survive review — applies to how this system runs. This role holds that line on the platform.",
    ],
    responsibilities: [
      "Own the deployment, environments, and release process for the Client Portal, so that shipping is repeatable, observable, and reversible.",
      "Build and maintain the infrastructure-as-code, cloud configuration, and CI/CD that the engineering work depends on.",
      "Establish the security posture for systems handling sensitive financial and tax data — access controls, secrets management, encryption in transit and at rest, and the audit trail to evidence it.",
      "Implement monitoring, alerting, and logging that surface problems before clients do, and define what the firm is committing to on availability and recovery.",
      "Plan and test backup, retention, and disaster-recovery so that a bad day is a recoverable one.",
      "Document the infrastructure and its controls clearly enough to withstand a security review or a client's diligence.",
      "Work directly with the engineers building on the platform to make the secure path the easy one.",
    ],
    qualifications: [
      "Substantial experience running production infrastructure for web applications, with direct ownership of reliability and security.",
      "Fluency with modern cloud infrastructure, infrastructure-as-code, containerization, and CI/CD pipelines, and the judgment to keep the setup as simple as the requirements allow.",
      "Real depth in security practice: access control, secrets, encryption, audit logging, and the operational habits that keep them intact.",
      "Experience defining and meeting availability, monitoring, and recovery standards rather than improvising them.",
      "The ability to document systems and controls precisely, for both engineers and non-engineers.",
      "A plus: familiarity with the compliance and data-handling expectations of financial, legal, or professional-services systems.",
      "A plus: experience supporting a small engineering team where you are the person who owns the platform.",
    ],
    howWeWork:
      "You will own the platform, not maintain someone else's design of it — the architecture of how Fortress systems run is yours to set, justify, and stand behind. There is no separate operations layer to escalate into and no one supervising the work from a distance; the decisions are yours, and so is the result. You will work in close contact with the engineers and the technology partner, which keeps the loop between a reliability or security concern and the decision to address it short and direct.",
  },
  // ---- Accounting ----------------------------------------------------------
  {
    slug: "tax-manager-cpa",
    title: "Tax Manager (CPA)",
    team: "accounting",
    summary:
      "Manage complex tax engagements end to end for business owners, investors, and high-net-worth families, owning the defensibility of every position from intake through follow-through.",
    intro: [
      "A Tax Manager at Fortress runs their own engagements. That is the structural fact of the role: the advisor who scopes a matter stays responsible for it, through the firm's full sequence — defining the facts, evaluating exposure, building the structure, coordinating execution, and monitoring change over time. This is the Fortress Hold Method, and the manager is the person accountable for a position holding under scrutiny, not merely being filed.",
      "The role exists because Fortress competes on the quality of its analysis for clients whose situations have outgrown a general practitioner — operating companies, investors, fiduciaries, and complex individual taxpayers. It is a senior position with real ownership: not oversight of work done elsewhere, but direct responsibility for the work on the file.",
    ],
    responsibilities: [
      "Own complex tax engagements for business owners, investors, high-net-worth families, and fiduciaries from intake through delivery and ongoing monitoring.",
      "Develop and defend tax positions — building the factual record, evaluating exposure honestly, and structuring so the position is the one most likely to hold, not the most aggressive one.",
      "Advise on structure before transactions are completed: entity selection, elections, ownership, and planning horizon, rather than reflecting decisions after the fact.",
      "Handle multi-state and entity-level complexity, and document the analysis so it survives professional review or an IRS inquiry.",
      "Coordinate execution with clients' legal, finance, and wealth counterparts so a position holds together in practice across the people responsible for it.",
      "Monitor legislative and regulatory change on behalf of clients and bring material developments to them before they become problems.",
      "Review the work of associates supporting the engagement while retaining ownership of the position and the client relationship.",
    ],
    qualifications: [
      "An active CPA license (required).",
      "Several years of tax experience with direct responsibility for complex engagements — planning and advisory, not compliance volume alone.",
      "Genuine depth in structuring, multi-state issues, and the regulatory interpretation that complex positions require.",
      "Sound, defensible judgment under real stakes: the discernment to distinguish a position that will hold from one that merely has not yet been challenged.",
      "The ability to coordinate with legal, finance, and wealth professionals and hold a multi-party position together.",
      "Clear writing — the capacity to render a technical position into guidance a client can act on and a reviewer can follow.",
      "A plus: experience serving fiduciaries, closely held businesses, or high-net-worth individuals with the discretion those engagements require.",
    ],
    howWeWork:
      "You manage your own engagements and stay with them — the client you scope in year one is the client whose situation you know in year five. Work is not delegated to you and then supervised from a distance, and it is not delegated away from you once the relationship is established; the responsibility for the position and the relationship is the same person's, and that person is you. Caseloads are kept at a level that lets each position get the attention defensibility actually requires.",
  },
  {
    slug: "senior-tax-associate",
    title: "Senior Tax Associate",
    team: "accounting",
    summary:
      "Do the substantive analytical work behind defensible tax positions — building the factual record, modeling exposure, and preparing the structuring analysis — on engagements you stay close to.",
    intro: [
      "The Senior Tax Associate does the analytical work that a defensible position rests on. Within the Fortress Hold Method, this is the role most directly engaged in defining the facts and evaluating exposure: assembling the factual record accurately, modeling the tax consequences, and preparing the analysis a manager and client rely on to decide how a position should be built.",
      "It is a role for someone who wants to develop real depth on substantive matters rather than process high volume at a distance from the thinking. You will work closely with the manager who owns the engagement — not as a remote contributor, but as part of how the position gets built — which is how associates here grow into managing engagements of their own.",
    ],
    responsibilities: [
      "Build the factual record on an engagement accurately and completely — the foundation every subsequent position depends on.",
      "Model and quantify tax exposure across scenarios, and prepare the analysis the engagement's structuring decisions are made from.",
      "Prepare and substantiate elements of complex returns and planning work, documenting the reasoning so it can survive review.",
      "Research substantive technical questions and produce clear, organized analysis a manager and client can act on.",
      "Support multi-state and entity-level work, tracking the details that determine whether a position is correct.",
      "Surface the questions a fact pattern leaves open rather than building on an unconfirmed assumption.",
      "Maintain the precision the work requires — in a firm that competes on the quality of its analysis, the analysis is the product.",
    ],
    qualifications: [
      "A few years of tax experience with substantive analytical responsibility, not exclusively high-volume preparation.",
      "CPA, CPA-track, or EA — an EA or CPA is a strong plus, and active progress toward the CPA is valued.",
      "Strong technical research ability and the discipline to document reasoning clearly.",
      "Care for accuracy under real consequence — you check the detail that determines whether a position holds.",
      "The instinct to raise an unresolved question early rather than carry an assumption forward.",
      "Clear writing, with the ability to organize a technical analysis so others can follow and rely on it.",
      "A plus: exposure to multi-state issues, pass-through entities, or high-net-worth individual taxation.",
    ],
    howWeWork:
      "You work directly with the manager who owns the engagement, close to the actual thinking rather than at the end of a chain of handoffs — which means you see how a defensible position gets built and you contribute to it, not just to a piece of it. The work is given to you to own within its scope, and the path from doing strong analysis to managing engagements of your own is short and real. Caseloads are managed so you can do the work to the standard, not race through it.",
  },
  {
    slug: "trust-estate-tax-specialist",
    title: "Trust & Estate Tax Specialist",
    team: "accounting",
    summary:
      "Advise fiduciaries and high-net-worth families on the tax positions behind trust and estate structures, where the planning horizon is long and the structures must hold across it.",
    intro: [
      "Trust and estate work is where the Fortress idea — a position built to hold — is tested over the longest horizon. This role advises fiduciaries and high-net-worth families on the tax treatment of trust and estate structures: the positions taken when they are established, the consequences as they operate, and the changes in law that can reshape them over the years they are meant to last.",
      "It is a specialist role because the terrain is its own. Fiduciary taxation, transfer-tax exposure, and multi-generational structuring demand depth that does not come from general practice, and the stakes — to families, to fiduciaries with legal duties — reward getting it right. The role exists to bring that depth to engagements that need it and to keep these structures defensible as the law moves.",
    ],
    responsibilities: [
      "Advise on the tax positions behind trust and estate structures — at formation, in operation, and as circumstances and law change.",
      "Build and defend positions on fiduciary income tax and transfer-tax exposure, documenting the analysis to a standard that survives scrutiny.",
      "Support structuring decisions for high-net-worth families across a multi-generational planning horizon, where today's choice has to hold for years.",
      "Coordinate with clients' estate attorneys, fiduciaries, and wealth advisors so a structure holds together across the professionals responsible for it.",
      "Monitor legislative and regulatory change affecting trusts, estates, and transfer taxes, and bring material developments to the families and fiduciaries they affect before they become problems.",
      "Prepare and review fiduciary returns and the related analysis with the precision the area requires.",
      "Translate genuinely complex structures into guidance a fiduciary or family member can understand and act on.",
    ],
    qualifications: [
      "Substantial experience in trust, estate, and fiduciary taxation, with direct responsibility for the positions taken.",
      "CPA or EA, with depth in fiduciary income tax and transfer-tax matters.",
      "Real command of the technical terrain — the regulatory and structuring knowledge that general tax practice does not supply.",
      "The judgment to build positions that hold across a long horizon and the discipline to document them defensibly.",
      "The ability to coordinate with estate attorneys and wealth advisors and hold a multi-party structure together.",
      "Discretion appropriate to working with families' most sensitive financial circumstances.",
      "A plus: experience with closely held business interests inside trust and estate structures.",
    ],
    howWeWork:
      "You own these engagements and stay with them, which matters more here than almost anywhere — trust and estate structures are measured in years, and continuity of advisor is continuity of judgment about a family's situation. The work is not handed down and supervised from a distance; you are the specialist responsible for the position and the relationship both. You coordinate directly with the family's other professionals, with no layer between you and the people whose decisions the structure depends on.",
  },
  // ---- Client Relations ----------------------------------------------------
  {
    slug: "client-relations-manager",
    title: "Client Relations Manager",
    team: "client-relations",
    summary:
      "Own the continuity of client relationships at Fortress — coordinating engagements, keeping communication ahead of deadlines, and making the firm's relationship-over-volume model real in practice.",
    intro: [
      "At Fortress, the relationship is structural, not incidental — the same advisors stay with a client year over year, and the firm competes on continuity that most larger firms cannot honestly claim. The Client Relations Manager is responsible for making that continuity work day to day: coordinating across active engagements, keeping clients informed, and ensuring the experience of working with Fortress matches what the firm says it is.",
      "This is a coordination and stewardship role, not a sales one. It exists because substantive advisory work for complex clients requires someone who holds the thread across engagements, anticipates what a client will need before they ask, and keeps communication composed and ahead of deadlines rather than reactive after them.",
    ],
    responsibilities: [
      "Own the continuity and coordination of client relationships across their active engagements, so nothing falls between advisors or matters.",
      "Keep clients informed with clear, timely communication — ahead of deadlines, in the composed register the firm holds to, never scrambling after the fact.",
      "Coordinate across the firm's advisors and, where relevant, clients' legal, finance, and wealth counterparts so the work stays aligned.",
      "Anticipate what a client will need next and prepare for it, rather than waiting for the request.",
      "Steward the client experience from active engagement through renewal and continuity, surfacing issues early and resolving them.",
      "Maintain accurate, current records of client context and engagement status so the firm's knowledge of a client compounds over time.",
      "Work with the team building the Client Portal to shape how clients will experience engagement coordination and visibility as that tooling comes online.",
    ],
    qualifications: [
      "Experience managing professional or advisory client relationships where the standard is substance and continuity, not transaction volume.",
      "Strong coordination ability — keeping multiple complex engagements aligned across several people without losing the thread.",
      "Clear, composed written and verbal communication, with judgment about what to tell a client, when, and how.",
      "The instinct to anticipate a client's needs and act ahead of them.",
      "Discretion and sound judgment with sensitive financial and personal information.",
      "The temperament to stay measured when a matter is complex and the stakes are real.",
      "A plus: experience in tax, accounting, legal, wealth, or another field serving sophisticated clients (no professional license required for this role).",
    ],
    howWeWork:
      "You own your client relationships rather than route them — you are the person who knows a client's context and holds it steadily over time, which is the whole point of a continuity model. Nothing is handed to you to manage at arm's length and reviewed from a distance; the relationships are genuinely yours to steward. Because the firm is senior-led and small, you work in direct contact with the advisors doing the work, so coordinating an engagement means a real conversation, not a handoff into a queue.",
  },
  {
    slug: "client-onboarding-specialist",
    title: "Client Onboarding Specialist",
    team: "client-relations",
    summary:
      "Run the onboarding of new Fortress clients — assembling the factual record, coordinating intake, and giving the engagement a precise, composed start.",
    intro: [
      "A Fortress engagement begins with a full accounting of where a client's position actually stands — and that beginning sets the tone for everything after it. The Client Onboarding Specialist owns that first stretch: gathering the documents and facts a new engagement depends on, coordinating intake across the client and the assigned advisor, and making sure the relationship starts with precision rather than confusion.",
      "The role maps directly to the first step of how the firm works — defining the facts — and it matters because the quality of an engagement's start determines how much rework comes later. It is a role for someone organized, attentive, and composed, who understands that a careful onboarding is the foundation a defensible position is later built on.",
    ],
    responsibilities: [
      "Run the onboarding of new clients end to end, from initial intake through a clean handoff into the active engagement.",
      "Assemble the documents and facts a new engagement requires — accurately and completely — so the advisor begins with a sound factual record rather than gaps.",
      "Coordinate intake between the client and the assigned advisor, keeping the steps clear, sequenced, and on schedule.",
      "Communicate with new clients in a clear, composed way that sets accurate expectations for what the engagement entails.",
      "Identify missing or inconsistent information early and resolve it before it reaches the advisory work.",
      "Maintain organized, current onboarding records so the firm's knowledge of a client is right from day one.",
      "Help shape how onboarding works within the Client Portal as that tooling comes online, so the process stays precise as it scales.",
    ],
    qualifications: [
      "Experience in client onboarding, intake, operations, or coordination, ideally in a professional or financial setting.",
      "Genuine organizational rigor — the ability to track documents, steps, and details without anything slipping.",
      "Clear, composed communication with clients, especially when requesting sensitive or detailed information.",
      "Care for accuracy and completeness, with the instinct to catch a gap before it becomes a problem downstream.",
      "Discretion with sensitive financial and personal information.",
      "A calm, methodical temperament suited to giving each new client a precise start.",
      "A plus: familiarity with tax, accounting, or another field where intake accuracy carries real consequence (no professional license required for this role).",
    ],
    howWeWork:
      "You own the start of the client relationship and the standard it sets — onboarding here is not box-checking handed to you and supervised from afar, but real responsibility for the foundation every later position rests on. You work directly with the advisor who will carry the engagement, so the handoff is a conversation between two people who both know the client, not a form dropped into a system. The care you put into a clean start is the same care the firm applies to the work that follows it.",
  },
];

/** All current openings, in display order, with the team label denormalized. */
export const OPENINGS: Opening[] = RAW_OPENINGS.map((o) => ({
  ...o,
  teamLabel: TEAM_LABEL[o.team],
}));

export function getOpenings(): Opening[] {
  return OPENINGS;
}

export function getOpeningBySlug(slug: string): Opening | undefined {
  return OPENINGS.find((o) => o.slug === slug);
}

/** Openings grouped by team, in `TEAMS` display order (empty teams dropped). */
export function getOpeningsByTeam(): {
  id: TeamId;
  label: string;
  blurb: string;
  openings: Opening[];
}[] {
  return TEAMS.map((team) => ({
    id: team.id,
    label: team.label,
    blurb: team.blurb,
    openings: OPENINGS.filter((o) => o.team === team.id),
  })).filter((group) => group.openings.length > 0);
}

/** Total count, for honest "N current openings" copy on the index. */
export function getOpeningsCount(): number {
  return OPENINGS.length;
}

/**
 * A role-specific `mailto:` apply link to the confirmed firm inbox.
 * The subject is derived from the title so it is always consistent and useful
 * to whoever triages the inbox.
 */
export function applyMailto(title: string): string {
  const subject = `Application — ${title}`;
  return `mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
