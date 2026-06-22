import { getFigure } from "./registry";
import {
  TimelineFigure,
  TwoRegimeFigure,
  ThresholdLadderFigure,
  DecisionPathFigure,
} from "./primitives";

/*
  ArticleFigure — resolves a figure id to its spec and dispatches to the right
  primitive. Rendered by Prose when it meets a `::figure id="…"` token. A missing
  id renders nothing (a stray token can never break a page); in dev it warns so
  the gap is caught before publish.
*/
export function ArticleFigure({ id }: { id: string }) {
  const spec = getFigure(id);

  if (!spec) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[ArticleFigure] no figure registered for id "${id}"`);
    }
    return null;
  }

  switch (spec.type) {
    case "timeline":
      return <TimelineFigure spec={spec} />;
    case "two-regime":
      return <TwoRegimeFigure spec={spec} />;
    case "threshold-ladder":
      return <ThresholdLadderFigure spec={spec} />;
    case "decision-path":
      return <DecisionPathFigure spec={spec} />;
    default:
      return null;
  }
}
