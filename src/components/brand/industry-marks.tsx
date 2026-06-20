import type { CSSProperties } from "react";

/*
  ============================================================================
  INDUSTRY MARKS — a family of sector elevations
  ============================================================================
  Six architectural line-art marks, one per industry, drawn in the EXACT same
  technical-drawing language as the signature `FortressElevation`:
    - fine brass linework via `currentColor` (adapts to light/dark bands)
    - a faint construction grid that fades out toward the top edges
    - a soft radial glow that fixes the sector's focal element
    - ashlar/structural detail, dimension ticks + leaders, a survey baseline
    - `strokeLinejoin="miter"`, `strokeLinecap="butt"`, fill on a 600×440 canvas

  They read as obvious siblings of the fortress signature — same canvas, same
  weights, same drawing tells — but each carries an unmistakable sector form:
    real-estate ............ a building elevation + parcel and a cornerstone
    professional-services .. a classical portico / colonnade
    healthcare ............. a structural "ward" frame around a recessed cross
    manufacturing-distribution .. a sawtooth factory roofline over stacked bays
    technology-saas ........ a node-and-grid lattice of stacked modules
    private-investors-family-capital .. nested arches / a vault with a keystone

  API mirrors `FortressElevation`: `variant` ("hero" | "opener" | "mark"),
  `className`, `style`, `title`. `<IndustryMark slug=… />` switches on slug and
  falls back to the fortress signature when a slug has no dedicated mark.
  ============================================================================
*/

type Variant = "hero" | "mark" | "opener";

type MarkProps = {
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
  title?: string;
  /** When true, the mark is decorative: role/label are dropped and it's hidden from AT. */
  "aria-hidden"?: boolean | "true" | "false";
};

/* Shared drawing weights — identical to FortressElevation's scale. */
function weights(variant: Variant) {
  return {
    strong: variant === "mark" ? 2.4 : 1.6,
    fine: variant === "mark" ? 1.4 : 1,
    hairline: 0.7,
  };
}

const brass = "currentColor";

/*
  Shared chrome: the faded construction grid, the focal glow, the perimeter
  dimensioning, and the surveyed ground line. Every mark composes these so the
  family stays visually locked to the signature. `glowCx`/`glowCy` aim the glow
  at each mark's focal element; `dimTop`/`dimW`/`dimH` size the dimension lines
  to the mark's silhouette.
*/
type ChromeProps = {
  variant: Variant;
  uid: string;
  glowCx?: string;
  glowCy?: string;
};

function Defs({ uid, glowCx = "50%", glowCy = "46%" }: ChromeProps) {
  return (
    <defs>
      <linearGradient id={`${uid}-gridfade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.35" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#fff" stopOpacity="1" />
      </linearGradient>
      <mask id={`${uid}-gridmask`}>
        <rect x="0" y="0" width="600" height="440" fill={`url(#${uid}-gridfade)`} />
      </mask>
      <radialGradient id={`${uid}-glow`} cx={glowCx} cy={glowCy} r="42%">
        <stop offset="0" stopColor={brass} stopOpacity="0.10" />
        <stop offset="1" stopColor={brass} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function ConstructionGrid({ variant, uid }: Pick<ChromeProps, "variant" | "uid">) {
  if (variant === "mark") return null;
  const { hairline } = weights(variant);
  return (
    <g stroke={brass} strokeWidth={hairline} opacity="0.16" mask={`url(#${uid}-gridmask)`}>
      {Array.from({ length: 13 }, (_, i) => 60 + i * 40).map((x) => (
        <line key={`v${x}`} x1={x} y1="36" x2={x} y2="404" />
      ))}
      {Array.from({ length: 8 }, (_, i) => 60 + i * 48).map((y) => (
        <line key={`h${y}`} x1="48" y1={y} x2="552" y2={y} />
      ))}
    </g>
  );
}

/** Perimeter dimensioning + leader to the focal point — the "drawing" tell. */
function Dimensioning({
  variant,
  left = 86,
  top = 52,
  bodyLeft = 130,
  bodyRight = 470,
  bodyTop = 110,
  leaderX = 300,
  leaderY1,
  leaderY2 = 120,
}: {
  variant: Variant;
  left?: number;
  top?: number;
  bodyLeft?: number;
  bodyRight?: number;
  bodyTop?: number;
  leaderX?: number;
  leaderY1?: number;
  leaderY2?: number;
}) {
  if (variant === "mark") return null;
  const { hairline } = weights(variant);
  return (
    <g stroke={brass} strokeWidth={hairline} opacity="0.55">
      {/* left vertical dimension with end ticks */}
      <line x1={left} y1={bodyTop} x2={left} y2="404" />
      <line x1={left - 6} y1={bodyTop} x2={left + 6} y2={bodyTop} />
      <line x1={left - 6} y1="404" x2={left + 6} y2="404" />
      {/* top horizontal dimension across the width */}
      <line x1={bodyLeft} y1={top} x2={bodyRight} y2={top} />
      <line x1={bodyLeft} y1={top - 6} x2={bodyLeft} y2={top + 6} />
      <line x1={bodyRight} y1={top - 6} x2={bodyRight} y2={top + 6} />
      {/* leader line + dot pointing at the focal element */}
      {leaderY1 != null ? (
        <>
          <line x1={leaderX} y1={leaderY1} x2={leaderX} y2={leaderY2} opacity="0.8" />
          <circle
            cx={leaderX}
            cy={leaderY2 - 2}
            r="2.6"
            fill={brass}
            stroke="none"
            opacity="0.9"
          />
        </>
      ) : null}
    </g>
  );
}

/** The surveyed ground line ticks under the structure. */
function GroundTicks({ variant }: { variant: Variant }) {
  if (variant === "mark") return null;
  const { hairline } = weights(variant);
  return (
    <g stroke={brass} strokeWidth={hairline} opacity="0.4">
      {Array.from({ length: 17 }, (_, i) => 116 + i * 23).map((x) => (
        <line key={`tick${x}`} x1={x} y1="404" x2={x - 8} y2="418" />
      ))}
    </g>
  );
}

/** A small locked-keystone path — reused where a mark crowns an opening. */
function keystonePath(cx: number, topY: number, h: number, halfTop: number, halfBot: number) {
  return `M${cx - halfBot} ${topY + h} L${cx - halfTop} ${topY} L${cx + halfTop} ${topY} L${cx + halfBot} ${topY + h} Z`;
}

/* ========================================================================== */
/* SVG shell — identical viewBox + attributes to FortressElevation.           */
/* ========================================================================== */

function MarkSvg({
  uid,
  variant,
  className,
  style,
  title,
  glowCx,
  glowCy,
  ariaHidden,
  children,
}: {
  uid: string;
  variant: Variant;
  className: string;
  style?: CSSProperties;
  title: string;
  glowCx?: string;
  glowCy?: string;
  ariaHidden?: boolean | "true" | "false";
  children: React.ReactNode;
}) {
  // Decorative when aria-hidden: drop role/label/title so AT skips it cleanly.
  const decorative = ariaHidden === true || ariaHidden === "true";
  return (
    <svg
      viewBox="0 0 600 440"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {decorative ? null : <title>{title}</title>}
      <Defs uid={uid} variant={variant} glowCx={glowCx} glowCy={glowCy} />
      <ConstructionGrid variant={variant} uid={uid} />
      <rect x="0" y="0" width="600" height="440" fill={`url(#${uid}-glow)`} />
      {children}
    </svg>
  );
}

/* ========================================================================== */
/* 1 — REAL ESTATE                                                            */
/* A surveyed parcel with a pitched-roof building elevation set on it: gabled */
/* main mass + a lower wing, coursed walls, a cornerstone, and parcel ticks.  */
/* ========================================================================== */

export function RealEstateMark({
  variant = "hero",
  className = "",
  style,
  title = "Real estate — a parcel and building elevation",
  "aria-hidden": ariaHidden,
}: MarkProps) {
  const { strong, fine, hairline } = weights(variant);
  return (
    <MarkSvg
      uid="ind-re"
      variant={variant}
      className={className}
      style={style}
      title={title}
      ariaHidden={ariaHidden}
      glowCy="40%"
    >
      <g stroke={brass} strokeLinejoin="miter" strokeLinecap="butt">
        {/* parcel boundary — a surveyed lot the structure sits on */}
        <rect
          x="120"
          y="96"
          width="360"
          height="308"
          strokeWidth={hairline}
          opacity="0.45"
          strokeDasharray="2 6"
        />

        {/* main gabled mass */}
        <path
          d="M178 404 L178 232 L300 150 L422 232 L422 404 Z"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.04"
        />
        {/* ridge + eave datum */}
        <line x1="178" y1="232" x2="422" y2="232" strokeWidth={fine} opacity="0.8" />
        {/* roof pitch coursing */}
        <line x1="208" y1="252" x2="392" y2="252" strokeWidth={hairline} opacity="0.5" />

        {/* lower wing to the right (massing variation) */}
        <path
          d="M422 404 L422 300 L470 270 L470 404 Z"
          strokeWidth={fine}
          fill={brass}
          fillOpacity="0.03"
        />

        {/* wall coursing across the main mass */}
        <g strokeWidth={fine} opacity="0.7">
          {[268, 304, 340, 376].map((y) => (
            <line key={`c${y}`} x1="178" y1={y} x2="422" y2={y} />
          ))}
        </g>
        {/* staggered head joints */}
        <g strokeWidth={hairline} opacity="0.45">
          <line x1="220" y1="232" x2="220" y2="268" />
          <line x1="380" y1="232" x2="380" y2="268" />
          <line x1="250" y1="268" x2="250" y2="304" />
          <line x1="350" y1="268" x2="350" y2="304" />
          <line x1="220" y1="340" x2="220" y2="376" />
          <line x1="380" y1="340" x2="380" y2="376" />
        </g>

        {/* central doorway (the entry void) crowned by a keystone */}
        <path
          d="M276 404 L276 322 Q276 300 300 300 Q324 300 324 322 L324 404"
          strokeWidth={fine}
        />
        <path
          d={keystonePath(300, 286, 18, 9, 13)}
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.2"
        />

        {/* upper windows flanking the gable */}
        <g strokeWidth={fine} opacity="0.85">
          <rect x="206" y="278" width="34" height="44" fill={brass} fillOpacity="0.05" />
          <rect x="360" y="278" width="34" height="44" fill={brass} fillOpacity="0.05" />
          <line x1="223" y1="278" x2="223" y2="322" strokeWidth={hairline} opacity="0.7" />
          <line x1="377" y1="278" x2="377" y2="322" strokeWidth={hairline} opacity="0.7" />
        </g>

        {/* cornerstone — the laid first stone, called out */}
        <rect
          x="178"
          y="376"
          width="30"
          height="28"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.12"
        />

        {/* battered footing + survey baseline */}
        <path
          d="M160 392 L488 392 L500 404 L148 404 Z"
          strokeWidth={fine}
          fill={brass}
          fillOpacity="0.05"
        />
        <line x1="112" y1="404" x2="500" y2="404" strokeWidth={strong} />
      </g>

      <Dimensioning
        variant={variant}
        bodyLeft={178}
        bodyRight={422}
        leaderX={300}
        leaderY1={150}
        leaderY2={112}
      />
      {/* parcel corner ticks */}
      {variant !== "mark" ? (
        <g stroke={brass} strokeWidth={hairline} opacity="0.5">
          <line x1="120" y1="96" x2="134" y2="96" />
          <line x1="120" y1="96" x2="120" y2="110" />
          <line x1="480" y1="96" x2="466" y2="96" />
          <line x1="480" y1="96" x2="480" y2="110" />
        </g>
      ) : null}
      <GroundTicks variant={variant} />
    </MarkSvg>
  );
}

/* ========================================================================== */
/* 2 — PROFESSIONAL SERVICES                                                  */
/* A classical portico: a stepped stylobate, a colonnade of fluted columns    */
/* with capitals, a full entablature (architrave/frieze/cornice), and a       */
/* pedimented gable crowned by a keystone — the "house of counsel."           */
/* ========================================================================== */

export function ProfessionalServicesMark({
  variant = "hero",
  className = "",
  style,
  title = "Professional services — a classical portico",
  "aria-hidden": ariaHidden,
}: MarkProps) {
  const { strong, fine, hairline } = weights(variant);
  const colXs = [186, 252, 318, 384, 450];
  const colW = 26;
  const capTop = 184;
  const shaftTop = 196;
  const shaftBot = 356;
  return (
    <MarkSvg
      uid="ind-ps"
      variant={variant}
      className={className}
      style={style}
      title={title}
      ariaHidden={ariaHidden}
      glowCy="38%"
    >
      <g stroke={brass} strokeLinejoin="miter" strokeLinecap="butt">
        {/* pediment — the triangular gable, crowned by a keystone */}
        <path
          d="M150 150 L318 92 L486 150 Z"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.04"
        />
        {/* pediment inner cornice */}
        <path d="M168 150 L318 98 L468 150" strokeWidth={hairline} opacity="0.5" />
        {/* apex keystone */}
        <path
          d={keystonePath(318, 100, 16, 8, 12)}
          strokeWidth={fine}
          fill={brass}
          fillOpacity="0.18"
        />

        {/* entablature — cornice / frieze / architrave as stacked rules */}
        <rect x="150" y="150" width="336" height="34" strokeWidth={fine} fill={brass} fillOpacity="0.03" />
        <line x1="150" y1="162" x2="486" y2="162" strokeWidth={hairline} opacity="0.6" />
        <line x1="150" y1="174" x2="486" y2="174" strokeWidth={hairline} opacity="0.6" />
        {/* triglyph ticks along the frieze */}
        <g strokeWidth={hairline} opacity="0.45">
          {[186, 252, 318, 384, 450].map((x) => (
            <line key={`tg${x}`} x1={x} y1="162" x2={x} y2="174" />
          ))}
        </g>

        {/* colonnade — five fluted columns with capitals + bases */}
        {colXs.map((cx) => (
          <g key={`col${cx}`}>
            {/* capital */}
            <rect
              x={cx - colW / 2 - 3}
              y={capTop}
              width={colW + 6}
              height="12"
              strokeWidth={fine}
              fill={brass}
              fillOpacity="0.06"
            />
            {/* shaft */}
            <rect
              x={cx - colW / 2}
              y={shaftTop}
              width={colW}
              height={shaftBot - shaftTop}
              strokeWidth={fine}
              fill={brass}
              fillOpacity="0.04"
            />
            {/* fluting */}
            <line x1={cx - 6} y1={shaftTop + 6} x2={cx - 6} y2={shaftBot - 6} strokeWidth={hairline} opacity="0.5" />
            <line x1={cx} y1={shaftTop + 6} x2={cx} y2={shaftBot - 6} strokeWidth={hairline} opacity="0.5" />
            <line x1={cx + 6} y1={shaftTop + 6} x2={cx + 6} y2={shaftBot - 6} strokeWidth={hairline} opacity="0.5" />
            {/* base */}
            <rect
              x={cx - colW / 2 - 3}
              y={shaftBot}
              width={colW + 6}
              height="12"
              strokeWidth={fine}
              fill={brass}
              fillOpacity="0.06"
            />
          </g>
        ))}

        {/* stylobate — the stepped platform the colonnade stands on */}
        <g strokeWidth={fine} fillOpacity="0.05" fill={brass}>
          <rect x="150" y="368" width="336" height="14" />
          <rect x="138" y="382" width="360" height="14" />
          <rect x="126" y="396" width="384" height="8" />
        </g>
        <line x1="112" y1="404" x2="500" y2="404" strokeWidth={strong} />
      </g>

      <Dimensioning
        variant={variant}
        bodyLeft={150}
        bodyRight={486}
        leaderX={318}
        leaderY1={92}
        leaderY2={74}
        top={62}
      />
      <GroundTicks variant={variant} />
    </MarkSvg>
  );
}

/* ========================================================================== */
/* 3 — HEALTHCARE                                                             */
/* An institutional "ward" block: a coursed structural frame whose central    */
/* recessed bay holds a refined relieved cross. Reads as a hospital pavilion  */
/* elevation, not a medical-clipart cross.                                    */
/* ========================================================================== */

export function HealthcareMark({
  variant = "hero",
  className = "",
  style,
  title = "Healthcare — a ward pavilion with a relieved cross",
  "aria-hidden": ariaHidden,
}: MarkProps) {
  const { strong, fine, hairline } = weights(variant);
  return (
    <MarkSvg
      uid="ind-hc"
      variant={variant}
      className={className}
      style={style}
      title={title}
      ariaHidden={ariaHidden}
    >
      <g stroke={brass} strokeLinejoin="miter" strokeLinecap="butt">
        {/* the pavilion block — a coursed institutional frame */}
        <rect
          x="150"
          y="120"
          width="300"
          height="284"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.03"
        />
        {/* cornice band */}
        <rect x="150" y="120" width="300" height="20" strokeWidth={fine} fill={brass} fillOpacity="0.05" />

        {/* window register — the institutional rhythm of a ward (two flanks) */}
        <g strokeWidth={fine} opacity="0.7">
          {[168, 218, 268, 318].map((y) =>
            [168, 408].map((x) => (
              <rect key={`w${x}-${y}`} x={x} y={y} width="24" height="30" fill={brass} fillOpacity="0.04" />
            ))
          )}
        </g>

        {/* central recessed bay — the relieving panel that holds the cross */}
        <rect
          x="254"
          y="152"
          width="92"
          height="220"
          strokeWidth={fine}
          fill={brass}
          fillOpacity="0.04"
        />
        {/* the refined cross, drawn as a relieved structural form */}
        <path
          d="M288 188 L312 188 L312 234 L346 234 L346 258 L312 258 L312 320 L288 320 L288 258 L254 258 L254 234 L288 234 Z"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.16"
        />
        {/* cross center datum */}
        <line x1="300" y1="188" x2="300" y2="320" strokeWidth={hairline} opacity="0.45" />

        {/* ground-floor coursing across the base */}
        <g strokeWidth={fine} opacity="0.6">
          {[362, 380].map((y) => (
            <line key={`gc${y}`} x1="150" y1={y} x2="450" y2={y} />
          ))}
        </g>

        {/* entry void + stepped plinth */}
        <path d="M280 404 L280 380 L320 380 L320 404" strokeWidth={fine} />
        <g strokeWidth={fine} fillOpacity="0.05" fill={brass}>
          <rect x="138" y="390" width="324" height="14" />
        </g>
        <line x1="112" y1="404" x2="488" y2="404" strokeWidth={strong} />
      </g>

      <Dimensioning
        variant={variant}
        bodyLeft={150}
        bodyRight={450}
        leaderX={300}
        leaderY1={188}
        leaderY2={104}
      />
      <GroundTicks variant={variant} />
    </MarkSvg>
  );
}

/* ========================================================================== */
/* 4 — MANUFACTURING & DISTRIBUTION                                           */
/* The classic industrial elevation: a sawtooth (north-light) factory roof    */
/* over a row of structural bays, a tall flue, and stacked distribution       */
/* units (pallet stacks) — production on the left, throughput on the right.   */
/* ========================================================================== */

export function ManufacturingMark({
  variant = "hero",
  className = "",
  style,
  title = "Manufacturing & distribution — a sawtooth factory elevation",
  "aria-hidden": ariaHidden,
}: MarkProps) {
  const { strong, fine, hairline } = weights(variant);
  // four sawtooth teeth across the production hall
  const teeth = [120, 188, 256, 324];
  return (
    <MarkSvg
      uid="ind-md"
      variant={variant}
      className={className}
      style={style}
      title={title}
      ariaHidden={ariaHidden}
      glowCx="38%"
    >
      <g stroke={brass} strokeLinejoin="miter" strokeLinecap="butt">
        {/* sawtooth / north-light roofline over the production hall */}
        <path
          d="M120 150 L120 116 L188 150 L188 116 L256 150 L256 116 L324 150 L324 116 L392 150 L392 220 L120 220 Z"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.04"
        />
        {/* glazed north-light faces (the angled rise of each tooth) */}
        <g strokeWidth={hairline} opacity="0.5">
          {teeth.map((x) => (
            <line key={`gl${x}`} x1={x} y1="150" x2={x + 68} y2="116" />
          ))}
        </g>
        {/* eave datum of the hall */}
        <line x1="120" y1="150" x2="392" y2="150" strokeWidth={fine} opacity="0.75" />

        {/* tall flue / stack rising past the roofline */}
        <rect x="356" y="78" width="22" height="72" strokeWidth={fine} fill={brass} fillOpacity="0.05" />
        <rect x="352" y="74" width="30" height="8" strokeWidth={fine} fill={brass} fillOpacity="0.08" />

        {/* structural bays of the production hall (portal frames) */}
        <g strokeWidth={fine} opacity="0.7">
          {[120, 188, 256, 324, 392].map((x) => (
            <line key={`bay${x}`} x1={x} y1="220" x2={x} y2="356" />
          ))}
          <line x1="120" y1="356" x2="392" y2="356" />
        </g>
        {/* roller-shutter loading doors in the bays */}
        <g strokeWidth={hairline} opacity="0.55">
          {[
            [134, 174],
            [202, 242],
            [338, 378],
          ].map(([x1, x2], i) => (
            <g key={`door${i}`}>
              <rect x={x1} y="300" width={x2 - x1} height="56" fill={brass} fillOpacity="0.04" />
              {[314, 326, 338].map((y) => (
                <line key={`sl${i}-${y}`} x1={x1} y1={y} x2={x2} y2={y} />
              ))}
            </g>
          ))}
        </g>

        {/* stacked distribution units — pallet/crate stacks on the dock */}
        <g strokeWidth={fine} fill={brass} fillOpacity="0.06">
          {/* a stepped stack: throughput / outbound */}
          <rect x="408" y="296" width="44" height="30" />
          <rect x="408" y="326" width="44" height="30" />
          <rect x="452" y="326" width="44" height="30" />
          <rect x="430" y="266" width="44" height="30" />
        </g>
        {/* crate cross-bracing detail */}
        <g strokeWidth={hairline} opacity="0.45">
          <line x1="408" y1="296" x2="452" y2="326" />
          <line x1="452" y1="296" x2="408" y2="326" />
          <line x1="430" y1="266" x2="474" y2="296" />
        </g>

        {/* loading dock platform + survey baseline */}
        <g strokeWidth={fine} fillOpacity="0.05" fill={brass}>
          <rect x="126" y="390" width="372" height="14" />
        </g>
        <line x1="112" y1="356" x2="496" y2="356" strokeWidth={fine} opacity="0.7" />
        <line x1="112" y1="404" x2="500" y2="404" strokeWidth={strong} />
      </g>

      <Dimensioning
        variant={variant}
        bodyLeft={120}
        bodyRight={392}
        leaderX={154}
        leaderY1={116}
        leaderY2={98}
        top={64}
      />
      <GroundTicks variant={variant} />
    </MarkSvg>
  );
}

/* ========================================================================== */
/* 5 — TECHNOLOGY & SAAS                                                      */
/* A node-and-grid lattice rendered as a clean architectural diagram: a       */
/* framed plan of stacked modules connected by a structural grid, with        */
/* highlighted nodes at the intersections (not a literal circuit).            */
/* ========================================================================== */

export function TechnologyMark({
  variant = "hero",
  className = "",
  style,
  title = "Technology & SaaS — a stacked-module lattice",
  "aria-hidden": ariaHidden,
}: MarkProps) {
  const { strong, fine, hairline } = weights(variant);
  // lattice grid coordinates within the framed plan
  const gx = [180, 240, 300, 360, 420];
  const gy = [156, 216, 276, 336];
  // emphasized nodes (the "service mesh") and the keyed module
  const nodes: Array<[number, number]> = [
    [180, 156],
    [300, 156],
    [420, 216],
    [240, 276],
    [360, 336],
    [180, 336],
  ];
  return (
    <MarkSvg
      uid="ind-tech"
      variant={variant}
      className={className}
      style={style}
      title={title}
      ariaHidden={ariaHidden}
    >
      <g stroke={brass} strokeLinejoin="miter" strokeLinecap="butt">
        {/* the framed plan — the system enclosure */}
        <rect
          x="150"
          y="120"
          width="300"
          height="284"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.03"
        />
        {/* title-block band along the top (a drawing/system header) */}
        <rect x="150" y="120" width="300" height="20" strokeWidth={fine} fill={brass} fillOpacity="0.05" />
        <line x1="408" y1="120" x2="408" y2="140" strokeWidth={hairline} opacity="0.6" />

        {/* structural grid — the lattice */}
        <g strokeWidth={hairline} opacity="0.45">
          {gx.map((x) => (
            <line key={`gx${x}`} x1={x} y1="152" x2={x} y2="372" />
          ))}
          {gy.map((y) => (
            <line key={`gy${y}`} x1="168" y1={y} x2="432" y2={y} />
          ))}
        </g>

        {/* stacked modules — three keyed cells raised out of the grid */}
        <g strokeWidth={fine} fill={brass} fillOpacity="0.06">
          <rect x="180" y="156" width="120" height="60" />
          <rect x="300" y="216" width="120" height="60" />
          <rect x="180" y="276" width="120" height="60" />
        </g>
        {/* module split lines (sub-services) */}
        <g strokeWidth={hairline} opacity="0.5">
          <line x1="240" y1="156" x2="240" y2="216" />
          <line x1="360" y1="216" x2="360" y2="276" />
          <line x1="240" y1="276" x2="240" y2="336" />
        </g>

        {/* mesh links — diagonal connections across the lattice */}
        <g strokeWidth={fine} opacity="0.6">
          <line x1="180" y1="156" x2="300" y2="216" />
          <line x1="300" y1="216" x2="420" y2="216" />
          <line x1="300" y1="156" x2="240" y2="276" />
          <line x1="240" y1="276" x2="360" y2="336" />
          <line x1="420" y1="216" x2="360" y2="336" />
          <line x1="180" y1="336" x2="240" y2="276" />
        </g>

        {/* nodes at the intersections — small filled keystoned squares */}
        <g strokeWidth={fine}>
          {nodes.map(([x, y]) => (
            <rect
              key={`n${x}-${y}`}
              x={x - 5}
              y={y - 5}
              width="10"
              height="10"
              fill={brass}
              fillOpacity="0.22"
            />
          ))}
        </g>
        {/* the keyed central node — the locked module (brand tie) */}
        <path
          d={keystonePath(300, 240, 14, 7, 11)}
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.2"
        />

        {/* base plinth + survey baseline */}
        <g strokeWidth={fine} fillOpacity="0.05" fill={brass}>
          <rect x="138" y="390" width="324" height="14" />
        </g>
        <line x1="112" y1="404" x2="488" y2="404" strokeWidth={strong} />
      </g>

      <Dimensioning
        variant={variant}
        bodyLeft={150}
        bodyRight={450}
        leaderX={300}
        leaderY1={240}
        leaderY2={104}
      />
      <GroundTicks variant={variant} />
    </MarkSvg>
  );
}

/* ========================================================================== */
/* 6 — PRIVATE INVESTORS & FAMILY CAPITAL                                     */
/* Nested arches descending into a vaulted strongroom, crowned by the         */
/* fortress keystone — generational depth and preservation. The arcade reads  */
/* as a treasury / vault elevation tied directly to the fortress signature.   */
/* ========================================================================== */

export function PrivateCapitalMark({
  variant = "hero",
  className = "",
  style,
  title = "Private investors & family capital — a vaulted arcade with a keystone",
  "aria-hidden": ariaHidden,
}: MarkProps) {
  const { strong, fine, hairline } = weights(variant);
  // nested concentric arches springing from a common impost line
  const cx = 300;
  const spring = 250; // impost (springing) line
  const base = 388;
  const arches = [
    { r: 150, w: strong, fo: 0.0 },
    { r: 122, w: fine, fo: 0.03 },
    { r: 94, w: fine, fo: 0.04 },
    { r: 66, w: fine, fo: 0.06 },
  ];
  return (
    <MarkSvg
      uid="ind-pc"
      variant={variant}
      className={className}
      style={style}
      title={title}
      ariaHidden={ariaHidden}
      glowCy="50%"
    >
      <g stroke={brass} strokeLinejoin="miter" strokeLinecap="butt">
        {/* the vault block these arches are cut into */}
        <path
          d="M150 404 L150 248 Q150 96 300 96 Q450 96 450 248 L450 404"
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.03"
        />
        {/* impost / springing datum line */}
        <line x1="150" y1={spring} x2="450" y2={spring} strokeWidth={hairline} opacity="0.45" />

        {/* nested concentric round arches (generational depth) */}
        {arches.map((a, i) => (
          <path
            key={`arch${i}`}
            d={`M${cx - a.r} ${base} L${cx - a.r} ${spring} A${a.r} ${a.r} 0 0 1 ${cx + a.r} ${spring} L${cx + a.r} ${base}`}
            strokeWidth={a.w}
            fill={a.fo ? brass : "none"}
            fillOpacity={a.fo}
          />
        ))}

        {/* voussoir ticks radiating from the outer arch crown */}
        <g strokeWidth={hairline} opacity="0.5">
          {[-58, -34, -10, 14, 38, 62].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const r1 = 122;
            const r2 = 150;
            return (
              <line
                key={`vous${deg}`}
                x1={cx + r1 * Math.sin(rad)}
                y1={spring - r1 * Math.cos(rad)}
                x2={cx + r2 * Math.sin(rad)}
                y2={spring - r2 * Math.cos(rad)}
              />
            );
          })}
        </g>

        {/* the crowning keystone — the fortress lock, seated on the arch crown
            (wide base meets the crown at y = spring - r, narrow head rises above) */}
        <path
          d={keystonePath(cx, spring - 150 - 26, 26, 8, 16)}
          strokeWidth={strong}
          fill={brass}
          fillOpacity="0.2"
        />
        <line x1={cx} y1={spring - 150 - 22} x2={cx} y2={spring - 150} strokeWidth={hairline} opacity="0.55" />

        {/* the strongroom floor / threshold within the innermost arch */}
        <line x1={cx - 66} y1={base} x2={cx + 66} y2={base} strokeWidth={fine} opacity="0.7" />
        {/* a vault seam down the deepest arch (the locked door) */}
        <line x1={cx} y1={spring} x2={cx} y2={base} strokeWidth={hairline} opacity="0.5" />

        {/* coursing on the flanking piers */}
        <g strokeWidth={hairline} opacity="0.5">
          {[284, 320, 356].map((y) => (
            <g key={`pier${y}`}>
              <line x1="150" y1={y} x2={cx - 150} y2={y} />
              <line x1={cx + 150} y1={y} x2="450" y2={y} />
            </g>
          ))}
        </g>

        {/* battered base + survey baseline */}
        <path
          d="M138 392 L462 392 L474 404 L126 404 Z"
          strokeWidth={fine}
          fill={brass}
          fillOpacity="0.05"
        />
        <line x1="112" y1="404" x2="488" y2="404" strokeWidth={strong} />
      </g>

      <Dimensioning
        variant={variant}
        bodyLeft={150}
        bodyRight={450}
        leaderX={cx}
        leaderY1={spring - 176}
        leaderY2={84}
        top={62}
      />
      <GroundTicks variant={variant} />
    </MarkSvg>
  );
}

/* ========================================================================== */
/* SWITCH — keyed by industry slug; falls back to the fortress signature.      */
/* ========================================================================== */

const MARKS: Record<string, (p: MarkProps) => React.JSX.Element> = {
  "real-estate": RealEstateMark,
  "professional-services": ProfessionalServicesMark,
  healthcare: HealthcareMark,
  "manufacturing-distribution": ManufacturingMark,
  "technology-saas": TechnologyMark,
  "private-investors-family-capital": PrivateCapitalMark,
};

/** True when a dedicated sector mark exists for this slug. */
export function hasIndustryMark(slug: string): boolean {
  return slug in MARKS;
}

/**
 * IndustryMark — renders the sector mark for `slug`. Returns null when no
 * dedicated mark exists, so callers can fall back to <FortressElevation />.
 */
export function IndustryMark({
  slug,
  ...props
}: MarkProps & { slug: string }) {
  const Mark = MARKS[slug];
  if (!Mark) return null;
  return <Mark {...props} />;
}
