import type { CSSProperties } from "react";

/*
  Brand motifs derived from the same architectural-drawing system as the
  signature elevation. All inline SVG / CSS — fully ownable, no fabrication.
  Color is driven by `currentColor`; set it on the parent.
*/

/**
 * AshlarField — a faint coursing/ashlar background texture (stone joints).
 * Use as an absolutely-positioned layer behind a band. Decorative; aria-hidden.
 */
export function AshlarField({
  className = "",
  style,
  opacity = 0.5,
}: {
  className?: string;
  style?: CSSProperties;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={{ opacity, ...style }}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <pattern
          id="ashlar"
          width="120"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          {/* bed joints */}
          <line x1="0" y1="0" x2="120" y2="0" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="32" x2="120" y2="32" stroke="currentColor" strokeWidth="1" />
          {/* staggered head joints */}
          <line x1="40" y1="0" x2="40" y2="32" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="0" x2="100" y2="32" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="32" x2="10" y2="64" stroke="currentColor" strokeWidth="1" />
          <line x1="70" y1="32" x2="70" y2="64" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ashlar)" />
    </svg>
  );
}

/**
 * SectionOpener — the keystone-and-rule motif that opens major sections.
 * A small keystone glyph centered over a coursing rule with a dimension tick.
 */
export function SectionOpener({
  className = "",
  align = "left",
}: {
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        align === "center" ? "justify-center" : ""
      } ${className}`}
      aria-hidden="true"
    >
      <KeystoneGlyph className="h-4 w-4 text-[var(--accent)]" />
      <span className="h-px w-16 bg-[var(--accent)] opacity-50" />
      <span className="h-2 w-px bg-[var(--accent)] opacity-50" />
    </div>
  );
}

/** A single keystone glyph — the locked stone. Reused as a bullet/marker. */
export function KeystoneGlyph({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 6 L9 2 L15 2 L17 6 L14 6 L13 22 L11 22 L10 6 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="currentColor"
        fillOpacity="0.12"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/**
 * ElevationWatermark — a very faint, large signature used as a band
 * watermark (e.g. behind the dark CTA). Decorative; aria-hidden.
 */
export function CoursingCorner({
  className = "",
}: {
  className?: string;
}) {
  // A bracket of dimension ticks — a precise "drawing corner" accent.
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1" opacity="0.6">
        <line x1="2" y1="2" x2="2" y2="40" />
        <line x1="2" y1="2" x2="40" y2="2" />
        {[14, 26, 38].map((d) => (
          <line key={`x${d}`} x1="2" y1={d} x2="8" y2={d} />
        ))}
        {[14, 26, 38].map((d) => (
          <line key={`y${d}`} x1={d} y1="2" x2={d} y2="8" />
        ))}
      </g>
    </svg>
  );
}
