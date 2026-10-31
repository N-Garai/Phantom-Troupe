"use client";

import type { CSSProperties } from "react";

type BatDef = {
  top: string;
  left: string;
  w: number;
  dur: number;
  delay: number;
  wave: number;
  amp: string;
  flap: number;
  opacity: number;
  toward?: boolean;
};

/* A larger colony of bats — some crossing the sky, others diving toward
 * the viewer for a more immersive horror feel. */
const BATS: BatDef[] = [
  // crossing bats (right → left)
  { top: "14%", left: "100%", w: 88, dur: 16, delay: 0.5, wave: 3.6, amp: "-26px", flap: 0.4, opacity: 0.9 },
  { top: "22%", left: "100%", w: 60, dur: 22, delay: 4, wave: 4.4, amp: "-18px", flap: 0.34, opacity: 0.6 },
  { top: "10%", left: "100%", w: 74, dur: 19, delay: 8, wave: 3.1, amp: "-32px", flap: 0.46, opacity: 0.75 },
  { top: "30%", left: "100%", w: 52, dur: 24, delay: 12, wave: 5, amp: "-14px", flap: 0.3, opacity: 0.55 },
  { top: "16%", left: "100%", w: 66, dur: 17, delay: 16, wave: 3.9, amp: "-24px", flap: 0.42, opacity: 0.7 },
  // bats diving toward the screen (center-ish)
  { top: "8%", left: "42%", w: 34, dur: 10, delay: 1, toward: true, wave: 3, amp: "-20px", flap: 0.38, opacity: 0.8 },
  { top: "12%", left: "58%", w: 46, dur: 11, delay: 3, toward: true, wave: 3.4, amp: "-16px", flap: 0.4, opacity: 0.85 },
  { top: "6%", left: "30%", w: 28, dur: 12, delay: 5, toward: true, wave: 2.8, amp: "-28px", flap: 0.36, opacity: 0.7 },
  { top: "14%", left: "72%", w: 52, dur: 10.5, delay: 6.5, toward: true, wave: 3.2, amp: "-22px", flap: 0.44, opacity: 0.8 },
];

/** Shared silhouette: scalloped wing membranes, hooked tips, glowing eyes. */
export function BatSvg() {
  return (
    <svg viewBox="0 0 100 44" className="h-auto w-full" style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.9))" }}>
      <g fill="#0a0714">
        {/* left wing — leading edge out to a hooked tip, scalloped trailing edge home */}
        <path d="M50 20 C44 11 33 5.5 19 5 C11 4.7 4.5 7.5 0.8 12.5 L6.2 13.4 C3.8 16.2 3.8 19.4 6.4 22.4 C12.4 19.6 16.4 20.6 18.6 24.8 C24.2 21.4 28.2 23.2 29.4 28.4 C34 25.2 38 27 39.2 31.2 C42 28.2 46 27 48.8 28.2 Z" />
        {/* right wing — mirrored */}
        <path d="M50 20 C56 11 67 5.5 81 5 C89 4.7 95.5 7.5 99.2 12.5 L93.8 13.4 C96.2 16.2 96.2 19.4 93.6 22.4 C87.6 19.6 83.6 20.6 81.4 24.8 C75.8 21.4 71.8 23.2 70.6 28.4 C66 25.2 62 27 60.8 31.2 C58 28.2 54 27 51.2 28.2 Z" />
        {/* body */}
        <ellipse cx="50" cy="24" rx="4.6" ry="7.6" />
        {/* head + ears */}
        <circle cx="50" cy="15.4" r="4.1" />
        <path d="M46.6 13.2 L44.2 6.4 L49.2 10.4 Z M53.4 13.2 L55.8 6.4 L50.8 10.4 Z" />
        {/* little feet */}
        <path d="M46.4 31.2 l-1.6 3.2 M53.6 31.2 l1.6 3.2" stroke="#0a0714" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      </g>
      {/* eyes catch the moonlight */}
      <circle cx="48.3" cy="14.7" r="0.95" fill="#74f2a4" opacity="0.9" />
      <circle cx="51.7" cy="14.7" r="0.95" fill="#74f2a4" opacity="0.9" />
    </svg>
  );
}

/**
 * A colony of bats: some cross the sky on lazy sine waves, others swoop
 * toward the viewer (growing larger) for a startling, immersive effect.
 * Pure CSS on three nested layers: path (X traverse) → wave (Y bob) → flap (wingbeat squash).
 */
export function Bats({ className }: { className?: string }) {
  return (
    <div className={`bat-colony ${className ?? ""}`} aria-hidden>
      {BATS.map((b, i) => (
        <div
          key={i}
          className={`bat-path ${b.toward ? "bat-toward" : ""}`}
          style={{
            top: b.top,
            left: b.toward ? b.left : "100%",
            width: b.w,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
          } as CSSProperties}
          aria-hidden
        >
          <div
            className="bat-wave"
            style={{ ["--wave"]: `${b.wave}s`, ["--amp"]: b.amp, opacity: b.opacity } as CSSProperties}
          >
            <div className="bat-flap" style={{ ["--flap"]: `${b.flap}s` } as CSSProperties}>
              <BatSvg />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
