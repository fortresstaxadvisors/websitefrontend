import { ImageResponse } from "next/og";

/*
  Root Open Graph image — the branded 1200×630 social card.

  Slate & Brass: deep-slate ground, an ivory "Fortress Tax Advisors" wordmark,
  the brass "Built to Hold." lockup, and a keystone/elevation motif drawn in
  brass linework (echoes the site's architectural signature without depending on
  the app SVG, which would need fetching at the edge).

  Constraints (next/og + Satori): flexbox only — NO `display: grid`, no external
  CSS, a subset of properties. System fonts are used deliberately so the route
  never fails on a missing font file; a generous serif stack carries the
  editorial wordmark, a clean sans the supporting copy.
*/

export const alt =
  "Fortress Tax Advisors — Built to Hold. Senior-led tax advisory for businesses, investors, and fiduciaries.";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

// Slate & Brass tokens (mirrors globals.css — OG cannot read CSS variables).
const SLATE_DEEP = "#0c1116";
const SLATE_RAISED = "#18212b";
const IVORY = "#f3eee4";
const IVORY_MUTED = "#aab1b9";
const BRASS = "#c6a06a";
const LINE = "rgba(243, 238, 228, 0.14)";

const SERIF =
  'Georgia, "Times New Roman", "Iowan Old Style", "Apple Garamond", serif';
const SANS = 'Helvetica, "Helvetica Neue", Arial, sans-serif';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: SLATE_DEEP,
          // Subtle vertical lift toward the slate-raised tone, top to bottom.
          backgroundImage: `linear-gradient(160deg, ${SLATE_RAISED} 0%, ${SLATE_DEEP} 62%)`,
          padding: "72px 84px",
          position: "relative",
        }}
      >
        {/* Keystone / elevation motif — top-right, brass linework. */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 84,
            display: "flex",
          }}
        >
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Keystone (locked trapezoid) over a coursed elevation base. */}
            <path
              d="M110 14 L150 56 L150 84 L70 84 L70 56 Z"
              stroke={BRASS}
              strokeWidth="3"
              fill="none"
              opacity="0.95"
            />
            {/* Body of the bastion */}
            <path
              d="M58 100 L162 100 L162 196 L58 196 Z"
              stroke={BRASS}
              strokeWidth="3"
              fill="none"
              opacity="0.55"
            />
            {/* Coursing lines (ashlar joints) */}
            <line x1="58" y1="132" x2="162" y2="132" stroke={BRASS} strokeWidth="2" opacity="0.4" />
            <line x1="58" y1="164" x2="162" y2="164" stroke={BRASS} strokeWidth="2" opacity="0.4" />
            <line x1="110" y1="100" x2="110" y2="132" stroke={BRASS} strokeWidth="2" opacity="0.4" />
            <line x1="84" y1="132" x2="84" y2="164" stroke={BRASS} strokeWidth="2" opacity="0.4" />
            <line x1="136" y1="164" x2="136" y2="196" stroke={BRASS} strokeWidth="2" opacity="0.4" />
            {/* Dimension tick under the keystone */}
            <line x1="110" y1="84" x2="110" y2="100" stroke={BRASS} strokeWidth="2" opacity="0.7" />
          </svg>
        </div>

        {/* Top: eyebrow */}
        <div
          style={{
            display: "flex",
            fontFamily: SANS,
            fontSize: 22,
            letterSpacing: 7,
            textTransform: "uppercase",
            color: IVORY_MUTED,
            fontWeight: 600,
          }}
        >
          Tax Advisory · Est. 2021
        </div>

        {/* Center: wordmark + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: SERIF,
              fontSize: 92,
              lineHeight: 1.02,
              color: IVORY,
              fontWeight: 600,
              letterSpacing: -1,
            }}
          >
            Fortress Tax Advisors
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            {/* Brass keystone bullet */}
            <svg width="26" height="26" viewBox="0 0 26 26" style={{ marginRight: 16 }}>
              <path d="M13 3 L22 12 L19 22 L7 22 L4 12 Z" fill={BRASS} />
            </svg>
            <div
              style={{
                display: "flex",
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 46,
                color: BRASS,
                fontWeight: 500,
              }}
            >
              Built to Hold.
            </div>
          </div>
        </div>

        {/* Bottom: hairline + supporting line */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              height: 1,
              width: "100%",
              backgroundColor: LINE,
              marginBottom: 22,
            }}
          />
          <div
            style={{
              display: "flex",
              fontFamily: SANS,
              fontSize: 24,
              lineHeight: 1.4,
              color: IVORY_MUTED,
              maxWidth: 820,
            }}
          >
            Senior-led tax advisory for businesses, investors, and fiduciaries
            managing genuine complexity.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
