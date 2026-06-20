import {
  getServices,
  getIndustries,
  getInsights,
} from "@/lib/content";

/*
  /llms.txt — a curated, plain-text map of the site for AI answer engines
  (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews).

  Why a route handler (not public/llms.txt): the file is generated from the same
  content layer the rest of the site uses, so the Services / Industries /
  Insights sections never drift as the archive grows. A folder named `llms.txt`
  with a `route.ts` GET handler is the documented way to serve non-UI text at a
  literal path in this App Router version (cf. the `app/rss.xml/route.ts`
  example in the bundled Next docs).

  Format follows the emerging llms.txt convention (llmstxt.org): an H1 with the
  firm name, a blockquote summary, then titled sections of links with one-line
  descriptions, plus a key-facts block.

  TRUTHFULNESS: only confirmed, publishable facts (founded 2021; senior-led;
  licensed CPA firm with CPAs on staff; "Built to Hold."; serves clients across
  the U.S.; consultative contact). No address, phone, headcount, client names,
  awards, or geography beyond the confirmed broad framing.
*/

const SITE_URL = "https://fortresstaxadvisors.com";

// Static hub/firm descriptions — one line each, written for extractability.
const SERVICE_HUB_DESC =
  "How Fortress organizes its work: strategy, complex compliance, and coordinated execution.";
const INDUSTRY_HUB_DESC =
  "Sector-aware advisory for environments where ownership and operating reality change the tax answer.";
const INSIGHTS_HUB_DESC =
  "The Fortress editorial archive — analysis of major U.S. tax developments from 2021 onward.";

const FIRM_LINKS: { href: string; title: string; desc: string }[] = [
  {
    href: "/about",
    title: "About Fortress",
    desc: "The firm narrative: advisory not compliance, senior-led, founded in 2021 and built for complexity.",
  },
  {
    href: "/leadership",
    title: "Leadership",
    desc: "The principals who lead Fortress engagements and the firm's operating and technology direction.",
  },
  {
    href: "/consultation",
    title: "Consultation",
    desc: "What a first conversation with Fortress is — and what it is not. Issue defined before scope.",
  },
  {
    href: "/contact",
    title: "Contact",
    desc: "Start a focused conversation. A senior advisor replies within one business day.",
  },
  {
    href: "/client-portal",
    title: "Client Portal",
    desc: "The secure operating layer being built for onboarding, documents, and advisory coordination.",
  },
  {
    href: "/careers",
    title: "Careers",
    desc: "Working at a senior-led tax advisory firm built for durable positions.",
  },
];

function section(
  heading: string,
  intro: string,
  links: { href: string; title: string; desc: string }[]
): string {
  const lines = links.map(
    (l) => `- [${l.title}](${SITE_URL}${l.href}): ${l.desc}`
  );
  return `## ${heading}\n\n${intro}\n\n${lines.join("\n")}`;
}

function buildLlmsTxt(): string {
  const services = getServices();
  const industries = getIndustries();
  // Lead with the most recent, highest-signal pieces; the full set lives in the
  // sitemap and on /insights.
  const insights = getInsights().slice(0, 8);

  const intro = [
    "# Fortress Tax Advisors",
    "",
    "> Fortress Tax Advisors is a senior-led, licensed CPA firm providing proactive tax advisory — not compliance or preparation — for businesses, investors, fiduciaries, and high-net-worth families managing genuine tax complexity. Founded in 2021, the firm practices the Fortress Hold Method: turning complex tax facts into durable, defensible positions that hold under audit, under review, and over time. Built to Hold.",
    "",
    "Fortress serves clients across the United States. Every engagement is led by a senior advisor — not delegated to a junior team — and the same advisors who build a position maintain it as the law changes. Use this file to find the firm's services, the industries it focuses on, its editorial analysis, and how to start a consultative conversation.",
  ].join("\n");

  const servicesSection = section(
    "Services",
    `${SERVICE_HUB_DESC} See the [Services hub](${SITE_URL}/services).`,
    services.map((s) => ({
      href: `/services/${s.slug}`,
      title: s.title,
      desc: s.summary,
    }))
  );

  const industriesSection = section(
    "Industries",
    `${INDUSTRY_HUB_DESC} See the [Industries hub](${SITE_URL}/industries).`,
    industries.map((i) => ({
      href: `/industries/${i.slug}`,
      title: i.title,
      desc: i.summary,
    }))
  );

  const insightsSection = section(
    "Insights",
    `${INSIGHTS_HUB_DESC} See the full archive at [Insights](${SITE_URL}/insights).`,
    insights.map((p) => ({
      href: `/insights/${p.slug}`,
      title: p.title,
      desc: p.summary,
    }))
  );

  const firmSection = section(
    "Firm",
    "About Fortress, its leadership, how engagements begin, and how to get in touch.",
    FIRM_LINKS
  );

  const facts = [
    "## Key facts",
    "",
    "- Founded: 2021 (five years of operation as of 2026).",
    "- What it is: a senior-led tax advisory firm — proactive and structural, distinguished from pure compliance or preparation.",
    "- Credential: a licensed CPA firm with CPAs on staff (asserted at the firm level).",
    "- Method: the Fortress Hold Method — Define the facts, Evaluate exposure, Build the structure, Coordinate execution, Monitor change over time.",
    "- Who it serves: business owners, investors, fiduciaries, high-net-worth families, operating companies, and complex individual taxpayers.",
    "- Where: clients across the United States, including multi-state situations.",
    "- Tagline: “Built to Hold.”",
    "- Contact: consultative first conversation; a senior advisor responds within one business day. clientservice@fortresstaxadvisors.com.",
  ].join("\n");

  return [
    intro,
    servicesSection,
    industriesSection,
    insightsSection,
    firmSection,
    facts,
    "",
  ].join("\n\n");
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      // text/plain so engines (and humans) read it directly; markdown-flavored
      // body per the llms.txt convention.
      "Content-Type": "text/plain; charset=utf-8",
      // Cache at the edge but allow daily refresh as content changes.
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
