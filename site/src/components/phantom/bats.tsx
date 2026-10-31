"use client";

import type { CSSProperties } from "react";

type BatDef = {
  top: string;
  scale: number;
  dur: number;
  delay: number;
  wave: number;
  amp: string;
  flap: number;
  opacity: number;
};

/* Three bats, staggered so the sky never feels empty but never feels busy. */
const BATS: BatDef[] = [
  { top: "16%", scale: 1, dur: 19, delay: 1.2, wave: 3.6, amp: "-26px", flap: 0.42, opacity: 0.95 },
  { top: "22%", scale: 0.62, dur: 26, delay: 7.5, wave: 4.4, amp: "-18px", flap: 0.36, opacity: 0.6 },
  { top: "12%", scale: 0.8, dur: 23, delay: 13.8, wave: 3.1, amp: "-34px", flap: 0.5, opacity: 0.75 },
];

function BatSvg() {
  return (
    <svg viewBox="0 0 64 28" className="h-auto w-full">
      <g fill="#0a0614">
        {/* left wing */}
        <path d="M30 14 C24 6 14 2 4 6 C10 8 12 12 10 16 C16 14 20 15 22 18 C24 16 27 15 30 16 Z" />
        {/* right wing */}
        <path d="M34 14 C40 6 50 2 60 6 C54 8 52 12 54 16 C48 14 44 15 42 18 C40 16 37 15 34 16 Z" />
        {/* body + ears */}
        <ellipse cx="32" cy="15" rx="4.6" ry="7" />
        <path d="M28 9 L27 3 L31 7 Z M36 9 L37 3 L33 7 Z" />
      </g>
      {/* tiny eyes catch the moonlight */}
      <circle cx="30.4" cy="12.6" r="0.8" fill="#74f2a4" opacity="0.85" />
      <circle cx="33.6" cy="12.6" r="0.8" fill="#74f2a4" opacity="0.85" />
    </svg>
  );
}

/**
 * A colony of bats that flaps out of the dark and crosses the sky on a
 * lazy sine wave, right → left, forever. Pure CSS animation on three
 * nested layers: path (X traverse) → wave (Y bob) → flap (wingbeat squash).
 */
export function Bats({ className }: { className?: string }) {
  return (
    <div className={`bat-colony ${className ?? ""}`} aria-hidden>
      {BATS.map((b, i) => (
        <div
          key={i}
          className="bat-path"
          style={{ top: b.top, right: "-6%", width: 64 * b.scale, ["--dur"]: `${b.dur}s`, ["--delay"]: `${b.delay}s` } as CSSProperties}
        >
          <div className="bat-wave" style={{ ["--wave"]: `${b.wave}s`, ["--amp"]: b.amp, opacity: b.opacity } as CSSProperties}>
            <div className="bat-flap" style={{ ["--flap"]: `${b.flap}s` } as CSSProperties}>
              <BatSvg />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
