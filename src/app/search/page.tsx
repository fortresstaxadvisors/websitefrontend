import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Eyebrow, Pill } from "@/components/ui/primitives";
import { Reveal, RevealGroup } from "@/components/reveal";
import {
  countResultsBySection,
  getSearchIndex,
  searchSite,
  type SiteSearchResult,
} from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search Fortress Tax Advisors services, industries, insights, careers, and firm pages.",
  alternates: { canonical: "/search" },
  openGraph: {
    type: "website",
    title: "Search | Fortress Tax Advisors",
    description:
      "Search across the Fortress Tax Advisors website, including services, industries, insights, careers, and firm pages.",
  },
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    query?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q) || firstParam(params.query);
  const index = getSearchIndex();
  const results = query ? searchSite(query, index) : [];
  const sectionCounts = countResultsBySection(results);

  return (
    <>
      <Section tone="paper" tight as="header">
        <Reveal className="max-w-3xl">
          <Eyebrow>Site Search</Eyebrow>
          <h1 className="display mt-5 t-h1 text-[var(--ink)]">
            Search the <em>whole site</em>.
          </h1>
          <p className="lede mt-6 max-w-2xl text-[var(--muted)]">
            {query
              ? `${results.length} ${
                  results.length === 1 ? "result" : "results"
                } found across services, industries, insights, careers, and firm pages.`
              : `Search across ${index.length} indexed pages and articles, from service lines and industry pages to the full insights archive.`}
          </p>

          <Form
            action="/search"
            className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <label htmlFor="site-search" className="sr-only">
              Search Fortress Tax Advisors
            </label>
            <input
              id="site-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Service, industry, topic, article, or role"
              className="min-h-13 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-[1rem] text-[var(--ink)] shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--faint)] focus:border-[var(--accent-ink)] focus:shadow-[0_0_0_4px_rgba(154,122,67,0.12)]"
            />
            <button type="submit" className="btn btn-primary min-h-13 px-7">
              Search
            </button>
          </Form>
        </Reveal>
      </Section>

      {query ? (
        <Section tone="paper">
          {sectionCounts.length > 0 ? (
            <Reveal className="mb-8 flex flex-wrap gap-2">
              {sectionCounts.map((group) => (
                <Pill key={group.section} tone="outline">
                  {group.section} · {group.count}
                </Pill>
              ))}
            </Reveal>
          ) : null}

          {results.length > 0 ? (
            <RevealGroup as="div">
              {results.map((result) => (
                <SearchResultRow key={result.href} result={result} />
              ))}
            </RevealGroup>
          ) : (
            <Reveal className="max-w-2xl">
              <Eyebrow bare>No Matches</Eyebrow>
              <p className="lede mt-4 text-[var(--muted)]">
                Try a broader term, or start from one of the main indexes.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
                <Link href="/services" className="link-arrow">
                  Services
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
                <Link href="/industries" className="link-arrow">
                  Industries
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
                <Link href="/insights" className="link-arrow">
                  Insights
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            </Reveal>
          )}
        </Section>
      ) : (
        <Section tone="paper-deep">
          <Reveal className="grid gap-8 md:grid-cols-3">
            {[
              {
                href: "/services",
                label: "Services",
                body: "Business tax, entity structuring, multi-state, trusts and estates, controversy, and transactions.",
              },
              {
                href: "/industries",
                label: "Industries",
                body: "Real estate, professional services, healthcare, manufacturing, technology, and family capital.",
              },
              {
                href: "/insights",
                label: "Insights",
                body: "Tax alerts, planning analysis, reference articles, and topic archives from 2021 onward.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group border-t border-[var(--line)] pt-5"
              >
                <p className="serif text-[1.35rem] text-[var(--ink)] transition-colors group-hover:text-[var(--accent-ink)]">
                  {item.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {item.body}
                </p>
                <span className="link-arrow mt-5">
                  Browse
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </span>
              </Link>
            ))}
          </Reveal>
        </Section>
      )}
    </>
  );
}

function SearchResultRow({ result }: { result: SiteSearchResult }) {
  return (
    <Link
      href={result.href}
      className="group block border-t border-[var(--line)] py-7 last:border-b"
    >
      <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
        <span>{result.section}</span>
        {result.meta ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{result.meta}</span>
          </>
        ) : null}
      </div>
      <h2 className="serif mt-3 text-[1.45rem] leading-tight text-[var(--ink)] transition-colors group-hover:text-[var(--accent-ink)] md:text-[1.7rem]">
        {result.title}
      </h2>
      <p className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-[var(--muted)]">
        {result.summary}
      </p>
      <span className="link-arrow mt-5">
        Open result
        <span className="arrow" aria-hidden="true">
          &rarr;
        </span>
      </span>
    </Link>
  );
}
