import type { MetadataRoute } from "next";
import {
  getServices,
  getIndustries,
  getInsights,
  getInsightYears,
  getInsightTopics,
} from "@/lib/content";
import { slugify } from "@/components/insights/insights-helpers";

/*
  sitemap.xml — enumerated from the content layer + the fixed route map so it
  never drifts as the archive grows. Slugs/years/topics are pulled live from
  `@/lib/content`; topic slugs use the same `slugify` the Insights routes use,
  so /insights/topic/* entries always resolve.

  Priorities/changeFrequency are advisory hints (search engines treat them as
  weak signals): hubs rank above leaves; the time-bound insights stream is the
  most frequently updated surface.
*/

const SITE_URL = "https://fortresstaxadvisors.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) =>
    `${SITE_URL}${path === "/" ? "" : path}` as const;

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  ): MetadataRoute.Sitemap[number] => ({
    url: url(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  const services = getServices();
  const industries = getIndustries();
  const insights = getInsights();
  const years = getInsightYears();
  const topics = getInsightTopics();

  return [
    // Home
    entry("/", 1, "weekly"),

    // Services: hub + every service detail
    entry("/services", 0.9, "monthly"),
    ...services.map((s) => entry(`/services/${s.slug}`, 0.8, "monthly")),

    // Industries: hub + every industry detail
    entry("/industries", 0.9, "monthly"),
    ...industries.map((i) => entry(`/industries/${i.slug}`, 0.8, "monthly")),

    // Insights: hub + every article + browse-by-year + browse-by-topic
    entry("/insights", 0.9, "weekly"),
    ...insights.map((p) => entry(`/insights/${p.slug}`, 0.7, "monthly")),
    ...years.map((y) => entry(`/insights/year/${y}`, 0.5, "monthly")),
    ...topics.map((t) =>
      entry(`/insights/topic/${slugify(t)}`, 0.5, "monthly")
    ),

    // Firm
    entry("/about", 0.7, "monthly"),
    entry("/leadership", 0.7, "monthly"),
    entry("/careers", 0.6, "monthly"),
    entry("/contact", 0.7, "yearly"),
    entry("/consultation", 0.7, "yearly"),
    entry("/client-portal", 0.6, "monthly"),
    entry("/newsroom", 0.6, "monthly"),
    // Legal pages (/privacy, /terms) are omitted while they carry `noindex`
    // as drafts pending legal review.
  ];
}
