import { KeystoneGlyph } from "@/components/brand/motifs";
import { Eyebrow } from "@/components/ui/primitives";
import { FaqJsonLd } from "@/components/seo/json-ld";

/*
  FAQ — a tasteful, on-brand question/answer block paired with matching
  FAQPage JSON-LD (emitted from the same `items`, so the structured data can
  never drift from the visible copy — Google's stated requirement and the
  honest default).

  Built on native <details>/<summary>: the answer text is always present in the
  server-rendered HTML (so AI answer engines and crawlers extract it even when
  visually collapsed), it is keyboard-accessible for free, and it needs no
  client JS. Quiet Slate & Brass treatment — the keystone glyph as the marker,
  a hairline between rows, no loud accordion chrome.

  TRUTHFULNESS: pass only confirmed answers. The default questions used on the
  site cover the response standard, the firm-level CPA credential, the method,
  and the consultative process — all from confirmed-inputs.md.
*/

export type FaqItem = { question: string; answer: string };

export function FAQ({
  items,
  eyebrow = "Common questions",
  title,
  className = "",
}: {
  items: FaqItem[];
  eyebrow?: string;
  /** Optional visible heading above the list. */
  title?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {/* Structured data mirrors the visible Q&A below, one-to-one. */}
      <FaqJsonLd items={items} />

      <Eyebrow as="h2">{eyebrow}</Eyebrow>
      {title ? (
        <p className="display mt-4 max-w-2xl t-h2 text-[var(--ink)]">{title}</p>
      ) : null}

      <dl className="mt-8 border-t border-[var(--line)]">
        {items.map((item) => (
          <div key={item.question} className="border-b border-[var(--line)]">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-baseline gap-3.5 py-5 [&::-webkit-details-marker]:hidden">
                <KeystoneGlyph className="mt-1.5 h-3.5 w-3.5 flex-none text-[var(--accent)] transition-transform duration-300 group-open:rotate-180" />
                <dt className="serif flex-1 text-[1.1rem] leading-snug text-[var(--ink)] md:text-[1.2rem]">
                  {item.question}
                </dt>
              </summary>
              <dd className="ml-7 max-w-2xl pb-6 text-[0.95rem] leading-7 text-[var(--muted)]">
                {item.answer}
              </dd>
            </details>
          </div>
        ))}
      </dl>
    </div>
  );
}
