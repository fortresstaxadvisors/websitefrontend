import { Prose } from "@/components/prose";

/*
  Back-compat shim. The editorial renderer now lives in `prose.tsx`.
  Existing `[slug]` route pages import `MarkdownContent`; this keeps them
  compiling and upgrades them to the Prose treatment without churn.
  New code should import `Prose` directly.
*/
type MarkdownContentProps = {
  content: string;
  sourceAnchor?: string;
  raisedInitial?: boolean;
};

export function MarkdownContent({
  content,
  sourceAnchor,
  raisedInitial,
}: MarkdownContentProps) {
  return (
    <Prose
      content={content}
      sourceAnchor={sourceAnchor}
      raisedInitial={raisedInitial}
    />
  );
}
