import type { MetadataRoute } from "next";

/*
  robots.txt — public brochure/authority site, fully crawlable. We allow all
  user agents and point crawlers at the sitemap. The Next.js metadata files
  (sitemap.xml, the generated OG image) are intentionally indexable.

  AI answer engines: we EXPLICITLY allow the major AI crawlers so Fortress can
  be read, understood, and CITED by ChatGPT, Perplexity, Gemini, Claude, and
  Google AI Overviews. The wildcard rule would already permit them, but naming
  them makes the intent self-documenting and resilient to future edits.

  Tradeoff (intentional): allowing these agents lets LLM-backed answer engines
  use the site's content for retrieval/citation (the goal for an authority
  site). The cost is that the content may also inform model training corpora.
  For a public brochure site with no proprietary/gated content and a strong
  citation incentive, allow is the right default. To opt OUT of training while
  staying citable, one could later disallow `GPTBot`/`ClaudeBot`/`Google-
  Extended` (training agents) while keeping `OAI-SearchBot`/`PerplexityBot`/
  `Googlebot` (retrieval + search) allowed.
*/

const SITE_URL = "https://fortresstaxadvisors.com";

// Named AI/LLM crawlers we want reading the site for citation visibility.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI — training + ChatGPT browsing
  "OAI-SearchBot", // OpenAI — ChatGPT search/citation surface
  "ChatGPT-User", // OpenAI — user-triggered browsing
  "ClaudeBot", // Anthropic — Claude crawling
  "Claude-Web", // Anthropic — Claude browsing
  "anthropic-ai", // Anthropic — legacy agent token
  "PerplexityBot", // Perplexity — index/citation
  "Perplexity-User", // Perplexity — user-triggered fetch
  "Google-Extended", // Google — Gemini / AI Overviews training opt-in token
  "Applebot-Extended", // Apple — AI training opt-in token
  "CCBot", // Common Crawl — feeds many models
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Everyone (classic search engines included): full access.
      { userAgent: "*", allow: "/" },
      // Named AI crawlers: explicitly allowed for answer-engine citation.
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
