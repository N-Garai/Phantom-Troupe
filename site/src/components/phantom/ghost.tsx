"use client";

import { useEffect, useRef } from "react";

type GhostProps = {
  className?: string;
  /** parallax strength (px). 0 disables mouse-follow */
  parallax?: number;
};

/** The troupe's mascot: a spectral wispy ghost with glowing eyes. */
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
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
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
      <div className="ghost-float relative" style={{ perspective: "600px" }}>
        <div className="ghost-tilt relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(116,242,164,0.22),transparent_65%)] blur-xl" />
          <svg viewBox="0 0 200 240" className="ghost-glow-pulse h-auto w-full drop-shadow-[0_0_35px_rgba(116,242,164,0.25)]">
          <defs>
            <linearGradient id="ghostBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(233,225,210,0.92)" />
              <stop offset="70%" stopColor="rgba(233,225,210,0.55)" />
              <stop offset="100%" stopColor="rgba(233,225,210,0.06)" />
            </linearGradient>
          </defs>
          <path
            d="M100 18c-44 0-72 33-72 76 0 29 10 45 20 59 7 10 13 19 15 32 1 7 7 11 14 11h46c7 0 13-4 14-11 2-13 8-22 15-32 10-14 20-30 20-59 0-43-28-76-72-76z"
            fill="url(#ghostBody)"
          />
          <ellipse cx="74" cy="96" rx="9" ry="14" fill="#050309" opacity="0.85" />
          <ellipse cx="126" cy="96" rx="9" ry="14" fill="#050309" opacity="0.85" />
          <circle cx="76.5" cy="92" r="3" fill="#74f2a4" />
          <circle cx="128.5" cy="92" r="3" fill="#74f2a4" />
          <path d="M84 132c6 6 11 8.5 16 8.5s10-2.5 16-8.5" stroke="#050309" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M42 200c8 10 18 12 28 6m60 6c8-6 16-6 24 2m-96-18c6 8 14 10 22 6m52 8c6-8 14-10 22-6" stroke="rgba(233,225,210,0.5)" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
        </div>
      </div>
    </div>
  );
}
