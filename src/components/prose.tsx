import type { ReactNode } from "react";

/*
  Prose — the editorial body renderer for Fortress long-form content.

  Replaces the old MarkdownContent with real editorial craft:
   - optional raised initial on the opening paragraph
   - blockquotes rendered as pull quotes (brass keyline + serif)
   - tabular figures inside paragraphs/lists (lining + tabular numerals)
   - bold "**…**" and IRC "§" runs styled inline
   - a measured column for comfortable reading
   - an optional source-anchor citation block

  The markdown subset matches the Fortress copy files: `##`/`###` headings,
  `- ` lists, `> ` blockquotes, `**bold:**` lead-ins, and paragraphs.
*/

type ProseProps = {
  content: string;
  /** Raise the first letter of the first paragraph (essays/analysis). */
  raisedInitial?: boolean;
  /** Source-anchor citation text rendered after the body. */
  sourceAnchor?: string;
  className?: string;
};

/** Inline formatting: **bold**, and tabular treatment for figures/§ runs. */
function renderInline(text: string): ReactNode {
  // Split on **bold** spans, keeping the delimiters out of the output.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function Prose({
  content,
  raisedInitial = false,
  sourceAnchor,
  className = "",
}: ProseProps) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  // Index of the first paragraph block — the only one that may get a raised
  // initial. Computed up front so we never mutate state during render.
  const firstParaIndex = raisedInitial
    ? blocks.findIndex(
        (b) =>
          !b.startsWith("## ") &&
          !b.startsWith("### ") &&
          !b.startsWith("> ") &&
          !b.split("\n").every((line) => line.trim().startsWith("- "))
      )
    : -1;

  return (
    <div
      className={`tnum text-[var(--muted)] [&>*+*]:mt-6 ${className}`}
    >
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="serif !mt-12 text-[var(--ink)] t-h3 md:text-[1.9rem] first:!mt-0"
            >
              {renderInline(block.replace(/^##\s+/, ""))}
            </h2>
          );
        }

        if (block.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="serif !mt-9 text-[1.25rem] text-[var(--ink)] md:text-[1.45rem]"
            >
              {renderInline(block.replace(/^###\s+/, ""))}
            </h3>
          );
        }

        if (block.startsWith("> ")) {
          const quote = block.replace(/^>\s?/gm, "");
          return (
            <blockquote
              key={index}
              className="!mt-10 border-l-2 border-[var(--accent)] py-1 pl-6"
            >
              <p className="serif text-[1.4rem] leading-[1.4] text-[var(--ink)] md:text-[1.7rem]">
                {renderInline(quote)}
              </p>
            </blockquote>
          );
        }

        if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index} className="space-y-3 text-[var(--muted)]">
              {block.split("\n").map((line, li) => (
                <li key={li} className="flex gap-3.5 leading-7">
                  <span
                    aria-hidden="true"
                    className="mt-[0.62rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--accent)]"
                  />
                  <span>{renderInline(line.replace(/^-\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph. The first one may carry a raised initial.
        const useInitial = index === firstParaIndex;

        return (
          <p
            key={index}
            className={`leading-[1.75] text-[var(--muted)] md:text-[1.075rem] ${
              useInitial ? "prose-initial" : ""
            }`}
          >
            {renderInline(block)}
          </p>
        );
      })}

      {sourceAnchor ? (
        <aside className="!mt-12 border-t border-[var(--line)] pt-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">
            Source anchor
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)] italic">
            {renderInline(sourceAnchor)}
          </p>
        </aside>
      ) : null}

      {/* Raised initial — scoped here so it travels with Prose. */}
      <style>{`
        .prose-initial::first-letter {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 500;
          color: var(--ink);
          float: left;
          font-size: 3.6em;
          line-height: 0.78;
          padding-right: 0.08em;
          margin-top: 0.04em;
        }
      `}</style>
    </div>
  );
}
