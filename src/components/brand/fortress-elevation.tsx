import type { CSSProperties } from "react";

/*
  ============================================================================
  THE SIGNATURE ELEMENT — "Fortress Elevation"
  ============================================================================
  An abstract architectural ELEVATION (an architect's front-on drawing) of a
  fortress bastion, rendered as fine technical linework in brass. Not heraldic:
  no cartoon castle, no turrets, no shield. The read is "a drawing of a thing
  built to hold" — load-bearing structure that survives scrutiny.

  Composition (left→right is symmetric about center):
    - a battered (out-sloping) ashlar base — the load-bearing plinth
    - regular coursing lines (the ashlar joints)
    - a stepped parapet / crenel rhythm at the top, drawn as a profile
    - a central recessed bay with a KEYSTONE at its head (the locked stone)
    - dimension ticks + a leader line + a survey baseline with end ticks
  Everything sits on a faint construction grid that fades out.

  Drawn on a 600 × 440 canvas; scales fluidly. `variant` tunes detail/weight
  for hero vs. small mark vs. section opener.
  ============================================================================
*/

type Variant = "hero" | "mark" | "opener";

type Props = {
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
  /** Animate the linework drawing in on mount (hero only; reduced-motion safe via CSS). */
  animate?: boolean;
  title?: string;
};

export function FortressElevation({
  variant = "hero",
  className = "",
  style,
  animate = false,
  title = "Fortress — an architectural elevation",
}: Props) {
  const strong = variant === "mark" ? 2.4 : 1.6;
  const fine = variant === "mark" ? 1.4 : 1;
  const hairline = 0.7;

  // Brass palette via currentColor + opacity layers; color set by parent.
  const brass = "currentColor";

  return (
    <svg
      viewBox="0 0 600 440"
      role="img"
      aria-label={title}
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      <defs>
        {/* Fade the construction grid out toward the edges/top. */}
        <linearGradient id="fe-gridfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="fe-gridmask">
          <rect x="0" y="0" width="600" height="440" fill="url(#fe-gridfade)" />
        </mask>
        {/* Soft radial so the keystone reads as the focal point. */}
        <radialGradient id="fe-glow" cx="50%" cy="46%" r="42%">
          <stop offset="0" stopColor={brass} stopOpacity="0.10" />
          <stop offset="1" stopColor={brass} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* faint construction grid */}
      {variant !== "mark" && (
        <g
          stroke={brass}
          strokeWidth={hairline}
          opacity="0.16"
          mask="url(#fe-gridmask)"
        >
          {Array.from({ length: 13 }, (_, i) => 60 + i * 40).map((x) => (
            <line key={`v${x}`} x1={x} y1="36" x2={x} y2="404" />
          ))}
          {Array.from({ length: 8 }, (_, i) => 60 + i * 48).map((y) => (
            <line key={`h${y}`} x1="48" y1={y} x2="552" y2={y} />
          ))}
        </g>
      )}

      <rect x="0" y="0" width="600" height="440" fill="url(#fe-glow)" />

      {/* ---- The structure ---- */}
      <g stroke={brass} strokeLinejoin="miter" strokeLinecap="butt">
        {/*
          PARAPET PROFILE (top edge) — a stepped crenellation drawn as a single
          outline so it reads as a wall section, not toy battlements.
          Outer silhouette of the bastion body.
        */}
        <path
          className={animate ? "fe-draw fe-draw-1" : undefined}
          d="
            M150 134
            L150 112 L180 112 L180 100 L210 100 L210 112 L246 112
            L246 92  L264 92  L264 74 L336 74 L336 92 L354 92
            L354 112 L390 112 L390 100 L420 100 L420 112 L450 112 L450 134
            L470 404
            L130 404
            Z
          "
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.03"
        />

        {/* Central recessed bay (the gate/keep void) with a KEYSTONE head. */}
        <path
          className={animate ? "fe-draw fe-draw-2" : undefined}
          d="
            M266 404
            L266 226
            Q266 188 300 188
            Q334 188 334 226
            L334 404
          "
          strokeWidth={fine}
        />
        {/* Keystone — the locked stone at the crown of the bay arch (the focal point). */}
        <path
          className={animate ? "fe-draw fe-draw-2" : undefined}
          d="M287 192 L281 162 L319 162 L313 192 Z"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.2"
        />
        {/* keystone center mark */}
        <line
          x1="300"
          y1="162"
          x2="300"
          y2="192"
          strokeWidth={hairline}
          opacity="0.55"
        />

        {/* ---- ASHLAR COURSING (horizontal joints across the body) ---- */}
        <g strokeWidth={fine} opacity="0.85">
          {[164, 200, 236, 272, 308, 344, 380].map((y, i) => {
            // Body tapers slightly with the battered base; compute x-insets.
            const t = (y - 132) / (404 - 132);
            const leftX = 150 - 20 * t;
            const rightX = 450 + 20 * t;
            return (
              <line
                key={`course${i}`}
                className={animate ? "fe-draw fe-draw-3" : undefined}
                x1={leftX}
                y1={y}
                x2={rightX}
                y2={y}
              />
            );
          })}
        </g>

        {/* ---- VERTICAL ASHLAR JOINTS (staggered, only outside the bay) ---- */}
        <g strokeWidth={hairline} opacity="0.5">
          {/* between courses, a few staggered head-joints, left + right of bay */}
          <line x1="186" y1="132" x2="186" y2="164" />
          <line x1="222" y1="164" x2="222" y2="200" />
          <line x1="186" y1="200" x2="186" y2="236" />
          <line x1="408" y1="132" x2="408" y2="164" />
          <line x1="378" y1="164" x2="378" y2="200" />
          <line x1="408" y1="200" x2="408" y2="236" />
          <line x1="204" y1="236" x2="204" y2="272" />
          <line x1="396" y1="236" x2="396" y2="272" />
        </g>

        {/* ---- BATTERED BASE (the out-sloping load-bearing plinth) ---- */}
        <path
          className={animate ? "fe-draw fe-draw-4" : undefined}
          d="M126 376 L474 376 L488 404 L112 404 Z"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.05"
        />
        <line x1="112" y1="404" x2="488" y2="404" strokeWidth={strong} />
      </g>

      {/* ---- DIMENSIONING (the "drawing" tell) ---- */}
      {variant !== "mark" && (
        <g stroke={brass} strokeWidth={hairline} opacity="0.55">
          {/* left vertical dimension with end ticks + leader */}
          <line x1="86" y1="110" x2="86" y2="404" />
          <line x1="80" y1="110" x2="92" y2="110" />
          <line x1="80" y1="404" x2="92" y2="404" />
          {/* top horizontal dimension across the bastion width */}
          <line x1="130" y1="52" x2="470" y2="52" />
          <line x1="130" y1="46" x2="130" y2="58" />
          <line x1="470" y1="46" x2="470" y2="58" />
          {/* a leader line pointing to the keystone */}
          <line x1="300" y1="162" x2="300" y2="120" opacity="0.8" />
          <circle cx="300" cy="118" r="2.6" fill={brass} stroke="none" opacity="0.9" />
        </g>
      )}

      {/* survey baseline ground ticks */}
      {variant !== "mark" && (
        <g stroke={brass} strokeWidth={hairline} opacity="0.4">
          {Array.from({ length: 17 }, (_, i) => 116 + i * 23).map((x) => (
            <line key={`tick${x}`} x1={x} y1="404" x2={x - 8} y2="418" />
          ))}
        </g>
      )}
    </svg>
  );
}
