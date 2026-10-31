"use client";

import { useCallback } from "react";
import type { CSSProperties } from "react";

type RisingHandProps = {
  className?: string;
  /** clicking the hand scrolls to this selector (default: the séance table) */
  scrollTo?: string;
  /** auto rise/sink loop — disable for tiny static cameo appearances */
  loop?: boolean;
  /** show the whisper tooltip */
  whisper?: boolean;
  /** false → decorative cameo (non-focusable div, no click behavior) */
  interactive?: boolean;
};

const BONE_DARK = "#948871";
const BONE_SHADOW = "#5c5344";

/**
 * One true skeletal finger. A group pivots at the knuckle (hover spreads it
 * by --spread), and inside it: knuckle head → proximal phalanx → joint →
 * middle phalanx → joint → hooked distal phalanx crowned by a dark claw.
 */
function Finger({
  x,
  y,
  angle,
  segs,
  w,
  spread,
  curl = 5,
}: {
  x: number;
  y: number;
  angle: number;
  segs: [number, number, number];
  w: number;
  spread: string;
  curl?: number;
}) {
  return (
    <g className="hand-finger" style={{ ["--spread"]: spread } as CSSProperties}>
      <g transform={`translate(${x} ${y}) rotate(${angle})`}>
        {/* knuckle head — the pivot, shaded underneath */}
        <circle r={w * 0.66} fill="url(#bone-grad)" />
        <path d={`M ${-w * 0.5} ${w * 0.3} Q 0 ${w * 0.62} ${w * 0.5} ${w * 0.3}`} stroke={BONE_SHADOW} strokeWidth="0.9" fill="none" opacity="0.55" />
        {/* proximal phalanx — cylindrical shading, dark on the far side */}
        <rect x={-w / 2} y={-segs[0]} width={w} height={segs[0] - 1.5} rx={w * 0.45} fill="url(#bone-grad)" />
        <rect x={w * 0.18} y={-segs[0] + 2} width={w * 0.32} height={segs[0] - 5} rx={w * 0.16} fill={BONE_SHADOW} opacity={0.4} />
        {/* middle phalanx, dead crook */}
        <g transform={`translate(0 ${-segs[0] + 1.5}) rotate(${-curl})`}>
          <circle r={w * 0.52} fill="url(#bone-grad)" />
          <path d={`M ${-w * 0.4} ${w * 0.24} Q 0 ${w * 0.5} ${w * 0.4} ${w * 0.24}`} stroke={BONE_SHADOW} strokeWidth="0.8" fill="none" opacity="0.5" />
          <rect x={-w * 0.42} y={-segs[1]} width={w * 0.84} height={segs[1] - 1.5} rx={w * 0.4} fill="url(#bone-grad)" />
          <rect x={w * 0.08} y={-segs[1] + 2} width={w * 0.26} height={segs[1] - 5} rx={w * 0.13} fill={BONE_SHADOW} opacity={0.38} />
          {/* distal phalanx — hooked, tipped with a dark claw */}
          <g transform={`translate(0 ${-segs[1] + 1.5}) rotate(${-curl * 1.6})`}>
            <circle r={w * 0.42} fill="url(#bone-grad)" />
            <path
              d={`M ${-w * 0.38} 0 C ${-w * 0.42} ${-segs[2] * 0.6} ${-w * 0.3} ${-segs[2] * 0.9} 0 ${-segs[2]}
                  C ${w * 0.3} ${-segs[2] * 0.9} ${w * 0.42} ${-segs[2] * 0.6} ${w * 0.38} 0
                  C ${w * 0.2} ${-segs[2] * 0.3} ${-w * 0.2} ${-segs[2] * 0.3} ${-w * 0.38} 0 Z`}
              fill="url(#bone-grad)"
            />
            {/* the claw — a hooked yellowed talon capping the tip */}
            <path
              d={`M ${-w * 0.3} ${-segs[2] + 1.6}
                  C ${-w * 0.34} ${-segs[2] - w * 0.55} ${-w * 0.08} ${-segs[2] - w * 0.95} ${w * 0.32} ${-segs[2] - w * 0.6}
                  C ${w * 0.44} ${-segs[2] - w * 0.42} ${w * 0.42} ${-segs[2] - w * 0.12} ${w * 0.3} ${-segs[2] + 0.6}
                  C ${w * 0.1} ${-segs[2] - w * 0.05} ${-w * 0.12} ${-segs[2]} ${-w * 0.3} ${-segs[2] + 1.6} Z`}
              fill="url(#claw-grad)"
            />
            <path d={`M ${-w * 0.14} ${-segs[2] - w * 0.5} Q ${w * 0.06} ${-segs[2] - w * 0.72} ${w * 0.24} ${-segs[2] - w * 0.52}`} stroke="rgba(240,228,190,0.4)" strokeWidth="0.6" fill="none" />
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * The Dead Man's Hand — true bones: radius and ulna, a carpal cluster,
 * metacarpals fanning to knuckles, three phalanges per finger with joint
 * gaps and spade tips, tendons strung beneath. Hover (or focus) and it
 * rises, fingers spreading. Click and it drags you down to the séance.
 */
export function RisingHand({
  className,
  scrollTo = "#seance",
  loop = true,
  whisper = true,
  interactive = true,
}: RisingHandProps) {
  const onClick = useCallback(() => {
    document.querySelector(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollTo]);

  const Tag = (interactive ? "button" : "div") as "button";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={interactive ? onClick : undefined}
      aria-label={interactive ? "A dead man's hand reaches from the grave — deal the hand" : undefined}
      aria-hidden={interactive ? undefined : true}
      tabIndex={interactive ? undefined : -1}
      className={`hand group ${loop ? "hand-loop" : ""} ${interactive ? "cursor-pointer" : "cursor-default pointer-events-none"} ${className ?? ""}`}
    >
      {whisper && <span className="hand-whisper">deal the dead man&apos;s hand</span>}

      <div className="hand-pit">
        <div className="hand-riser">
          <svg viewBox="0 0 150 210" className="h-full w-full hand-bone-glow" aria-hidden>
            <defs>
              {/* cylindrical bone shading — lit from the upper left */}
              <linearGradient id="bone-grad" x1="0" y1="0" x2="1" y2="0.25">
                <stop offset="0%" stopColor="#e8dfc7" />
                <stop offset="45%" stopColor="#cfc4a8" />
                <stop offset="100%" stopColor="#7e7360" />
              </linearGradient>
              <linearGradient id="claw-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b09a62" />
                <stop offset="100%" stopColor="#4c3f26" />
              </linearGradient>
              <linearGradient id="flesh-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5a3038" />
                <stop offset="100%" stopColor="#28121c" />
              </linearGradient>
            </defs>
            <g className="hand-bone">
              <g transform="rotate(-3 75 210)">
                {/* ——— radius + ulna, two true forearm bones ——— */}
                <path
                  d="M62 210 C61 184 63 164 66 150 L62 147 C59 143 60 139 64 138 L75 137 C79 137 81 140 80 144 L77 147 C79 164 80 184 79 210 Z"
                  fill="url(#bone-grad)"
                />
                <path
                  d="M86 210 C86 186 87 166 90 152 L86 149 C83 146 84 142 88 141 L98 140 C102 140 104 143 103 147 L100 150 C102 166 103 186 103 210 Z"
                  fill={BONE_DARK}
                />
                <path d="M64 150 C63 172 63 190 64 208" stroke="rgba(232,223,199,0.5)" strokeWidth="1.4" fill="none" />
                {/* interosseous shadow in the gap between the bones */}
                <rect x="80" y="152" width="7" height="54" fill={BONE_SHADOW} opacity="0.3" />
                {/* old breaks, healed crooked */}
                <path d="M65 178 l6 5 M67 160 l5 4 M91 168 l5 4" stroke={BONE_SHADOW} strokeWidth="1.2" />
                {/* decay blooming on the shafts */}
                <circle cx="70" cy="172" r="2.6" fill="#46543c" opacity="0.4" />
                <circle cx="95" cy="182" r="2" fill="#3c4a34" opacity="0.35" />

                {/* ——— torn flesh cuff — the skin that stayed below ——— */}
                <path
                  d="M58 194 L62 200 L59 207 L66 202 L70 211 L77 203 L83 213 L89 203 L95 211 L100 201 L104 207 L103 198 L107 192 C96 199 68 200 58 194 Z"
                  fill="url(#flesh-grad)"
                />
                <path d="M58 194 C68 200 96 199 107 192 L105 186 C95 193 69 194 60 188 Z" fill="#432230" />
                <path d="M70 211 q1 4 -1 7 M89 203 q2 4 0 8" stroke="#331722" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                {/* soil line where the arm exits the grave */}
                <rect x="60" y="196" width="44" height="14" rx="6" fill="#1a1329" opacity="0.9" />
                <path d="M62 197 q10 4 20 2 q12 -2 20 1" stroke="#241b36" strokeWidth="2" fill="none" />

                {/* ——— carpal cluster: the wrist's eight pebbles, suggested ——— */}
                <g fill="url(#bone-grad)">
                  <ellipse cx="70" cy="130" rx="6.8" ry="5.2" />
                  <ellipse cx="82" cy="127" rx="7.2" ry="5.6" />
                  <ellipse cx="93" cy="130" rx="6.2" ry="5" />
                  <ellipse cx="76" cy="121" rx="5.2" ry="4.2" />
                  <ellipse cx="88" cy="120" rx="5.4" ry="4.4" />
                </g>
                <g fill={BONE_SHADOW} opacity="0.45">
                  <circle cx="73" cy="128" r="1.1" />
                  <circle cx="85" cy="125" r="1.2" />
                  <circle cx="90" cy="131" r="1" />
                </g>
                {/* rot spreading across the wrist bones */}
                <circle cx="80" cy="126" r="2.2" fill="#46543c" opacity="0.35" />
                <circle cx="90" cy="122" r="1.5" fill="#3c4a34" opacity="0.3" />

                {/* ——— metacarpals fanning to the knuckles ——— */}
                <g stroke="#cfc4a8" strokeWidth="5.4" strokeLinecap="round">
                  <line x1="71" y1="119" x2="59" y2="88" />
                  <line x1="80" y1="117" x2="75" y2="80" />
                  <line x1="88" y1="118" x2="92" y2="82" />
                  <line x1="95" y1="121" x2="106" y2="92" />
                </g>
                <g stroke="rgba(232,223,199,0.55)" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="69.5" y1="118" x2="57.5" y2="88" />
                  <line x1="78.5" y1="116" x2="73.5" y2="80" />
                  <line x1="86.5" y1="117" x2="90.5" y2="82" />
                </g>
                {/* thumb metacarpal jutting from the trapezium */}
                <g stroke={BONE_DARK} strokeWidth="6.4" strokeLinecap="round">
                  <line x1="68" y1="122" x2="50" y2="108" />
                </g>
                {/* tendons strung where the skin no longer is */}
                <g stroke={BONE_SHADOW} strokeWidth="1.3" opacity="0.55" fill="none">
                  <path d="M74 122 Q66 104 61 91" />
                  <path d="M80 120 Q77 100 76 84" />
                  <path d="M86 121 Q89 102 91 86" />
                  <path d="M92 124 Q99 108 105 93" />
                </g>

                {/* ——— four fingers, index through little ——— */}
                <Finger x={59} y={88} angle={-9} segs={[24, 19, 14]} w={9} spread="-13deg" />
                <Finger x={75} y={80} angle={-2} segs={[27, 21, 15]} w={10} spread="-5deg" curl={4} />
                <Finger x={92} y={82} angle={4} segs={[25, 20, 14]} w={10} spread="5deg" curl={5} />
                <Finger x={106} y={92} angle={11} segs={[20, 16, 12]} w={8.4} spread="13deg" curl={7} />

                {/* ——— the thumb: two phalanges, opposed ——— */}
                <g className="hand-finger" style={{ ["--spread"]: "-26deg" } as CSSProperties}>
                  <g transform="translate(50 108) rotate(-46)">
                    <circle r={4.8} fill="url(#bone-grad)" />
                    <rect x={-4.2} y={-17} width={8.4} height={15.5} rx={3.8} fill="url(#bone-grad)" />
                    <g transform="translate(0 -17) rotate(-16)">
                      <circle r={3.8} fill="url(#bone-grad)" />
                      <path
                        d="M -3.4 0 C -3.8 -7.5 -2.2 -10.5 0 -11 C 2.2 -10.5 3.8 -7.5 3.4 0 C 1.6 -2.2 -1.6 -2.2 -3.4 0 Z"
                        fill="url(#bone-grad)"
                      />
                      <path
                        d="M -2.6 -10.2 C -2.9 -13.4 -1.4 -15 0 -15.4 C 1.6 -14.9 2.7 -13.4 2.6 -10.4 C 1 -11.4 -1.2 -11.4 -2.6 -10.2 Z"
                        fill="url(#claw-grad)"
                      />
                    </g>
                  </g>
                </g>

                {/* a stolen ring — the dead kept their treasures */}
                <rect x="55" y="99" width="9.5" height="4.6" rx="2.2" fill="#f79b2e" opacity="0.9" transform="rotate(-9 60 101)" />
              </g>
            </g>
          </svg>

          {/* dirt clods kicked loose as it claws upward */}
          {[
            { left: "18%", "--dx": "-26px", delay: "0s" },
            { left: "30%", "--dx": "-12px", delay: "0.18s" },
            { left: "44%", "--dx": "4px", delay: "0.08s" },
            { left: "58%", "--dx": "14px", delay: "0.26s" },
            { left: "70%", "--dx": "26px", delay: "0.02s" },
            { left: "82%", "--dx": "38px", delay: "0.34s" },
          ].map((d, i) => (
            <span
              key={i}
              className="hand-dirt"
              style={{ left: d.left, bottom: "12%", animationDelay: d.delay, ["--dx"]: d["--dx"] } as CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* grave lip in front of the arm — sells the emergence */}
      <svg
        viewBox="0 0 160 34"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-1/2 z-10 w-[116%] -translate-x-1/2"
        aria-hidden
      >
        <path d="M0 34 Q14 16 44 10 Q80 2 118 10 Q148 17 160 34 Z" fill="#0d0817" />
        <path d="M0 34 Q14 16 44 10" fill="none" stroke="#151026" strokeWidth="2" />
        <g stroke="#131022" strokeWidth="2.2" strokeLinecap="round">
          <path d="M38 12 q-3 -7 -8 -9 M46 10 q1 -7 6 -9 M108 9 q-2 -6 -6 -8 M116 10 q3 -6 7 -7" />
        </g>
      </svg>
    </Tag>
  );
}
