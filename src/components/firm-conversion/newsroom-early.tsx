import Link from "next/link";
import { Eyebrow, ArrowLink } from "@/components/ui/primitives";
import { KeystoneGlyph, CoursingCorner } from "@/components/brand/motifs";

/*
  NewsroomEarly — an honest early-state for the newsroom. There are no
  confirmed press items, awards, or announcements, so we fabricate none.
  Instead: a clear statement of what the newsroom will hold, what it
  deliberately will not, and a route to the editorial archive (Insights),
  which is where substance currently lives.
*/

const WILL: { title: string; body: string }[] = [
  {
    title: "Firm updates",
    body: "Milestones in how Fortress is built and how it serves clients — recorded when they are real, not manufactured for a press cycle.",
  },
  {
    title: "Selected commentary",
    body: "Considered positions on developments that matter to clients, sitting adjacent to the deeper editorial archive.",
  },
  {
    title: "Appearances",
    body: "Speaking engagements and contributions where a Fortress advisor takes a public position worth standing behind.",
  },
];

export function NewsroomEarly() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
      {/* The honest statement */}
      <div>
        <Eyebrow>The record so far</Eyebrow>
        <h2 className="display mt-4 t-h2 text-[var(--ink)]">
          We&rsquo;d rather an empty page than a manufactured one.
        </h2>
        <div className="measure mt-6 flex flex-col gap-4 text-[var(--muted)]">
          <p className="lede text-[var(--muted)]">
            The newsroom is where Fortress will record firm news, appearances,
            and selected commentary. It is intentionally quiet today.
          </p>
          <p>
            We don&rsquo;t publish awards we haven&rsquo;t earned, announcements
            that aren&rsquo;t real, or press written to fill space. When there is
            something here, it will be because something genuinely happened — and
            it will be worth your time to read.
          </p>
          <p>
            In the meantime, the substance lives in our editorial archive: a
            historically grounded record of analysis, plus a current alert
            stream on the changes that move client decisions.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
          <ArrowLink href="/insights">Read the Insights archive</ArrowLink>
          <ArrowLink href="/contact">Media &amp; speaking inquiries</ArrowLink>
        </div>
      </div>

      {/* What this page will hold */}
      <div className="relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-7 md:p-9">
        <CoursingCorner className="pointer-events-none absolute right-5 top-5 h-12 w-12 text-[var(--accent)] opacity-50" />
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">
          What the newsroom will hold
        </p>
        <ul className="mt-7 flex flex-col divide-y divide-[var(--line-soft)]">
          {WILL.map((item) => (
            <li key={item.title} className="flex gap-3.5 py-5 first:pt-0 last:pb-0">
              <KeystoneGlyph className="mt-1 h-4 w-4 flex-none text-[var(--accent)]" />
              <div>
                <p className="serif text-[1.05rem] leading-snug text-[var(--ink)]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[0.9rem] leading-7 text-[var(--muted)]">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-7 border-t border-[var(--line)] pt-5 text-[0.85rem] leading-7 text-[var(--faint)]">
          Journalists and event organizers can reach the firm through{" "}
          <Link
            href="/contact"
            className="text-[var(--accent-ink)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--accent-ink)]"
          >
            our contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
