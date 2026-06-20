import { KeystoneGlyph } from "@/components/brand/motifs";

/*
  PortalFeature — the four pillars of the forthcoming Fortress Client Portal,
  drawn from the approved wording (confirmed-inputs.md): onboarding, document
  exchange, engagement visibility, and ongoing advisory coordination. Framed
  honestly as in development — no fake login, no UI that pretends to work.
*/

const PILLARS = [
  {
    n: "01",
    title: "Onboarding",
    body: "A structured, secure start to every engagement — intake, entity and ownership detail, and the documents an advisor needs to begin, gathered once and held in order.",
  },
  {
    n: "02",
    title: "Document exchange",
    body: "A single secure place to send and receive sensitive material, replacing email attachments and version confusion with a defensible record of what was shared and when.",
  },
  {
    n: "03",
    title: "Engagement visibility",
    body: "A clear view of where work stands — what is in progress, what is waiting on you, and what comes next — so an engagement is never a black box between calls.",
  },
  {
    n: "04",
    title: "Advisory coordination",
    body: "The connective layer for ongoing work across entities, years, and the advisors and counsel a position has to hold together with.",
  },
];

export function PortalFeature() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
      {PILLARS.map((p) => (
        <li
          key={p.n}
          className="reveal flex flex-col bg-[var(--surface)] p-7 md:p-8"
        >
          <div className="flex items-center justify-between">
            <span className="index-num text-2xl text-[var(--accent-ink)]">
              {p.n}
            </span>
            <KeystoneGlyph className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <h3 className="serif mt-5 text-[1.2rem] leading-snug text-[var(--ink)]">
            {p.title}
          </h3>
          <p className="mt-2.5 text-[0.93rem] leading-7 text-[var(--muted)]">
            {p.body}
          </p>
        </li>
      ))}
    </ol>
  );
}
