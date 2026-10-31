"use client";

import { useId } from "react";

type MoonProps = {
  className?: string;
  style?: React.CSSProperties;
};

/** A pockmarked harvest moon — grain-textured sphere, correctly lit craters, deep terminator. */
export function Moon({ className, style }: MoonProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const body = `moon-body-${uid}`;
  const mare = `moon-mare-${uid}`;
  const crater = `moon-crater-${uid}`;
  const shade = `moon-shade-${uid}`;
  const clip = `moon-clip-${uid}`;
  const tex = `moon-tex-${uid}`;
  const rim = `moon-rim-${uid}`;

  /* light falls from the upper left, so each crater's shadowed wall sits
     upper-left inside the bowl and its lit rim catches on the lower right */
  const CRATERS = [
    { x: 56, y: 96, r: 13 },
    { x: 92, y: 60, r: 9 },
    { x: 118, y: 92, r: 16 },
    { x: 74, y: 138, r: 11 },
    { x: 142, y: 146, r: 8 },
    { x: 46, y: 52, r: 7 },
    { x: 104, y: 118, r: 6 },
    { x: 156, y: 108, r: 6.5 },
    { x: 84, y: 26, r: 5 },
    { x: 36, y: 120, r: 4.5 },
  ];

  return (
    <div className={className} style={style} aria-hidden>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          <radialGradient id={body} cx="34%" cy="30%" r="82%">
            <stop offset="0%" stopColor="#fffbee" />
            <stop offset="30%" stopColor="#f4e9c8" />
            <stop offset="56%" stopColor="#dcc99c" />
            <stop offset="79%" stopColor="#ac9668" />
            <stop offset="100%" stopColor="#6e5c42" />
          </radialGradient>
          <radialGradient id={mare} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(114,96,70,0.4)" />
            <stop offset="70%" stopColor="rgba(104,86,62,0.26)" />
            <stop offset="100%" stopColor="rgba(104,86,62,0)" />
          </radialGradient>
          <radialGradient id={crater} cx="62%" cy="64%" r="70%">
            <stop offset="0%" stopColor="rgba(88,72,50,0.18)" />
            <stop offset="55%" stopColor="rgba(70,56,38,0.4)" />
            <stop offset="100%" stopColor="rgba(52,40,26,0.05)" />
          </radialGradient>
          <radialGradient id={shade} cx="30%" cy="26%" r="92%">
            <stop offset="58%" stopColor="rgba(16,10,3,0)" />
            <stop offset="86%" stopColor="rgba(14,8,2,0.42)" />
            <stop offset="100%" stopColor="rgba(6,4,1,0.78)" />
          </radialGradient>
          <clipPath id={clip}>
            <circle cx="100" cy="100" r="98" />
          </clipPath>
          <filter id={tex} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="9" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.5 0" />
          </filter>
          <filter id={rim} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        <circle cx="100" cy="100" r="98" fill={`url(#${body})`} />

        <g clipPath={`url(#${clip})`}>
          {/* regolith grain — fractal noise seated into the surface */}
          <rect x="0" y="0" width="200" height="200" filter={`url(#${tex})`} opacity="0.22" />

          {/* dark maria — the moon's great plains */}
          <ellipse cx="70" cy="70" rx="36" ry="27" fill={`url(#${mare})`} />
          <ellipse cx="126" cy="130" rx="42" ry="31" fill={`url(#${mare})`} />
          <ellipse cx="138" cy="60" rx="23" ry="17" fill={`url(#${mare})`} />
          <ellipse cx="52" cy="150" rx="20" ry="14" fill={`url(#${mare})`} />

          {/* craters: dark bowl offset to the light side, lit rim lower-right */}
          {CRATERS.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r={c.r} fill={`url(#${crater})`} />
              <circle cx={c.x - c.r * 0.18} cy={c.y - c.r * 0.18} r={c.r * 0.62} fill="rgba(46,35,22,0.34)" />
              <path
                d={`M ${c.x + c.r * 0.82} ${c.y + c.r * 0.34} A ${c.r * 0.9} ${c.r * 0.9} 0 0 1 ${c.x - c.r * 0.3} ${c.y + c.r * 0.85}`}
                fill="none"
                stroke="rgba(255,246,218,0.55)"
                strokeWidth={c.r * 0.17}
                strokeLinecap="round"
              />
              <path
                d={`M ${c.x - c.r * 0.8} ${c.y - c.r * 0.42} A ${c.r * 0.88} ${c.r * 0.88} 0 0 1 ${c.x + c.r * 0.42} ${c.y - c.r * 0.8}`}
                fill="none"
                stroke="rgba(58,45,28,0.5)"
                strokeWidth={c.r * 0.14}
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* terminator — long night rolling across the lower limb */}
          <circle cx="100" cy="100" r="98" fill={`url(#${shade})`} />
        </g>

        {/* sun-side limb light — the thin brilliant edge of the lit crescent */}
        <path
          d="M 4 96 A 96 96 0 0 1 92 4"
          fill="none"
          stroke="rgba(255,250,228,0.6)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter={`url(#${rim})`}
        />
      </svg>
    </div>
  );
}
