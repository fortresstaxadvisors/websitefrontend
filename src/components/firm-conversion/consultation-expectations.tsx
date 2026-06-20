import { KeystoneGlyph, SectionOpener } from "@/components/brand/motifs";

/*
  ConsultationExpectations — sets accurate expectations for a first
  conversation. Three quiet columns: what the conversation is, what to have
  in mind, and what it is not. Low-pressure tone per the contact/inquiry tone
  rules (no urgency, no service-center warmth, no claimed outcomes).
*/

type Item = { title: string; body: string };

function Column({
  eyebrow,
  items,
}: {
  eyebrow: string;
  items: Item[];
}) {
  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">
        {eyebrow}
      </p>
      <ul className="mt-6 flex flex-col gap-6">
        {items.map((item) => (
          <li key={item.title} className="flex gap-3.5">
            <KeystoneGlyph className="mt-1 h-4 w-4 flex-none text-[var(--accent)]" />
            <div>
              <p className="serif text-[1.05rem] leading-snug text-[var(--ink)]">
                {item.title}
              </p>
              <p className="mt-1.5 text-[0.92rem] leading-7 text-[var(--muted)]">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const WHAT: Item[] = [
  {
    title: "A focused first call",
    body: "Senior-led and oriented around your facts. We listen first and ask the questions that define the issue.",
  },
  {
    title: "A clear read on fit",
    body: "We are direct about whether this is work we should do, work that can wait, or work better placed elsewhere.",
  },
  {
    title: "A recommended next step",
    body: "You leave with a defined issue and a path forward — whether or not it becomes an engagement.",
  },
];

const READY: Item[] = [
  {
    title: "The decision or deadline",
    body: "What prompted the call — a transaction, a notice, a filing, or a question that has grown past your current advisor.",
  },
  {
    title: "Your structure, roughly",
    body: "The entities, ownership, and any elections involved. Exact figures aren't needed to start a useful conversation.",
  },
  {
    title: "Who else is at the table",
    body: "Counsel, a CFO, a wealth advisor — the people a sound position has to hold together with.",
  },
];

const NOT: Item[] = [
  {
    title: "Not a sales call",
    body: "There is no script and no pressure. If now isn't the time, that is a legitimate outcome of the conversation.",
  },
  {
    title: "Not a quote",
    body: "We define the issue and the timeline before we discuss scope. Precision comes before price, not after.",
  },
  {
    title: "Not generic advice",
    body: "We don't issue positions on a first call. We frame the question correctly so the work that follows can hold.",
  },
];

export function ConsultationExpectations() {
  return (
    <div>
      <SectionOpener className="mb-5" />
      <h2 className="display max-w-2xl t-h2 text-[var(--ink)]">
        What a first conversation is — and what it is not.
      </h2>
      <hr className="rule-engraved mt-10" />
      <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
        <Column eyebrow="What to expect" items={WHAT} />
        <Column eyebrow="What to have in mind" items={READY} />
        <Column eyebrow="What it isn't" items={NOT} />
      </div>
    </div>
  );
}
