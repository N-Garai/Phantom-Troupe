"use client";

import { useEffect, useRef } from "react";

type GhostProps = {
  className?: string;
  /** parallax strength (px). 0 disables mouse-follow */
  parallax?: number;
};

const CLOAK =
  "M110 14 C74 14 50 44 51 84 C52 106 45 122 48 144 C44 168 39 186 45 204 Q54 210 63 201 Q74 215 86 203 Q98 217 111 205 Q124 215 136 203 Q148 213 157 199 C163 186 161 174 162 160 C165 134 168 114 165 94 C162 52 144 14 110 14 Z";

/* flame tendrils — two structure-matched variants each, morphed with SMIL */
const TENDRILS: { a: string; b: string; dur: number }[] = [
  {
    a: "M62 196 C54 214 47 226 52 242 C55 252 49 260 43 266 C56 258 63 246 63 231 C63 217 62 205 62 196 Z",
    b: "M62 196 C58 216 55 230 62 246 C67 254 63 262 55 268 C63 258 66 246 65 231 C64 215 62 204 62 196 Z",
    dur: 4.6,
  },
  {
    a: "M90 204 C82 224 76 238 82 256 C85 266 79 274 72 280 C86 272 94 258 94 243 C94 228 91 214 90 204 Z",
    b: "M90 204 C86 226 84 242 92 258 C97 266 93 274 85 280 C93 270 96 258 95 243 C94 227 91 213 90 204 Z",
    dur: 5.4,
  },
  {
    a: "M124 202 C118 220 112 232 117 248 C120 258 114 266 108 271 C120 264 127 252 127 238 C127 224 125 212 124 202 Z",
    b: "M124 202 C121 222 119 236 126 250 C130 258 126 266 119 271 C127 262 130 251 129 238 C128 222 125 210 124 202 Z",
    dur: 5.0,
  },
  {
    a: "M152 196 C146 212 140 222 144 236 C147 245 142 252 136 257 C147 251 153 240 153 227 C153 214 152 204 152 196 Z",
    b: "M152 196 C149 214 147 226 153 240 C156 247 152 254 146 258 C154 251 157 241 156 227 C155 213 152 204 152 196 Z",
    dur: 4.2,
  },
];

const WISPS: { a: string; b: string; dur: number }[] = [
  {
    a: "M49 122 C38 132 31 146 36 162 C41 151 46 141 52 133 C51 129 50 125 49 122 Z",
    b: "M49 122 C40 134 36 150 44 164 C46 152 50 142 54 134 C52 129 50 125 49 122 Z",
    dur: 5.8,
  },
  {
    a: "M171 122 C182 132 189 146 184 162 C179 151 174 141 168 133 C169 129 170 125 171 122 Z",
    b: "M171 122 C180 134 184 150 176 164 C174 152 170 142 166 134 C168 129 170 125 171 122 Z",
    dur: 6.3,
  },
];

/**
 * The troupe's mascot: a hooded black wraith torn from the reference —
 * slotted burning eyes under angry brows, a jagged toothy maw, and a
 * cloak that dissolves into swaying flame tendrils. The dark body only
 * reads against the void because of the violet aura bleeding around it.
 */
export function Ghost({ className, parallax = 18 }: GhostProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parallax) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tx = nx * parallax;
      ty = ny * parallax * 0.6;
    };
    const loop = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [parallax]);

  return (
    <div ref={ref} className={className} aria-hidden>
      <div className="ghost-float relative" style={{ perspective: "700px" }}>
        <div className="ghost-tilt relative">
          {/* spectral aura behind the dark body — this is what carves the silhouette */}
          <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_36%,rgba(124,95,214,0.30),transparent_62%)] blur-2xl" />
          <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_58%,rgba(116,242,164,0.12),transparent_66%)] blur-3xl" />

          <svg viewBox="0 0 220 284" className="ghost-glow-pulse h-auto w-full drop-shadow-[0_0_34px_rgba(124,95,214,0.35)]">
            <defs>
              <linearGradient id="cloakGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(58,44,100,0.97)" />
                <stop offset="42%" stopColor="rgba(28,19,52,0.95)" />
                <stop offset="100%" stopColor="rgba(8,4,18,0.9)" />
              </linearGradient>
              <radialGradient id="faceGlow" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="rgba(150,255,180,0.12)" />
                <stop offset="100%" stopColor="rgba(150,255,180,0)" />
              </radialGradient>
              <radialGradient id="mouthGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(116,242,164,0.4)" />
                <stop offset="100%" stopColor="rgba(116,242,164,0)" />
              </radialGradient>
              <filter id="ghostAura" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <filter id="ghostEyeGlow" x="-250%" y="-250%" width="600%" height="600%">
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* violet aura copy bleeding out from under the cloak */}
            <path d={CLOAK} fill="#7c5fd6" opacity="0.5" filter="url(#ghostAura)" />

            {/* the cloak — hooded head, ragged hem */}
            <path d={CLOAK} fill="url(#cloakGrad)" stroke="rgba(150,120,220,0.32)" strokeWidth="1.2" />

            {/* flame tendrils swaying under the hem */}
            {TENDRILS.map((t, i) => (
              <path key={i} d={t.a} fill="url(#cloakGrad)" opacity="0.92">
                <animate
                  attributeName="d"
                  dur={`${t.dur}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values={`${t.a};${t.b};${t.a}`}
                />
              </path>
            ))}

            {/* wisps tearing off the shoulders */}
            {WISPS.map((w, i) => (
              <path key={i} d={w.a} fill="url(#cloakGrad)" opacity="0.7">
                <animate
                  attributeName="d"
                  dur={`${w.dur}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values={`${w.a};${w.b};${w.a}`}
                />
              </path>
            ))}

            {/* faint spectral light behind the face */}
            <ellipse cx="110" cy="92" rx="46" ry="52" fill="url(#faceGlow)" />

            {/* hood creases */}
            <path d="M97 30 C92 46 90 58 92 70" stroke="rgba(4,2,10,0.55)" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M124 28 C129 44 131 56 129 68" stroke="rgba(4,2,10,0.55)" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* angry brows — heavy wedges slanting into the nose */}
            <path d="M62 72 L96 85 L94 95 L60 81 Z" fill="#05030d" opacity="0.9" />
            <path d="M158 72 L124 85 L126 95 L160 81 Z" fill="#05030d" opacity="0.9" />

            {/* burning slotted eyes under the brows */}
            <g filter="url(#ghostEyeGlow)">
              <path d="M66 91 Q81 84 95 94 Q81 102 66 91 Z" fill="#dcffe6" />
              <path d="M154 91 Q139 84 125 94 Q139 102 154 91 Z" fill="#dcffe6" />
            </g>
            <circle cx="82" cy="94" r="2" fill="#ffffff" />
            <circle cx="138" cy="94" r="2" fill="#ffffff" />

            {/* jagged toothy maw */}
            <path d="M84 118 Q110 108 136 118 L129 146 Q110 156 91 146 Z" fill="#05030d" opacity="0.94" />
            <ellipse cx="110" cy="133" rx="15" ry="9" fill="url(#mouthGlow)" />
            <g fill="#e6ecd8" opacity="0.92">
              <path d="M92 118 L96 131 L101 118 Z" />
              <path d="M105 116 L109 130 L114 116 Z" />
              <path d="M119 118 L124 131 L128 118 Z" />
            </g>
            <g fill="#dfe6d2" opacity="0.8">
              <path d="M97 148 L100 139 L104 147 Z" />
              <path d="M114 147 L118 138 L121 147 Z" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
