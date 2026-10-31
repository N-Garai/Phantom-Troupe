"use client";

import { useEffect, useRef } from "react";

type ParticleProps = {
  /** particles per million px² — tuned low for potato machines */
  density?: number;
  className?: string;
  /** marigold embers by default; "spectre" gives green wisps */
  mode?: "ember" | "spectre";
};

type P = {
  x: number; y: number; vx: number; vy: number;
  r: number; life: number; maxLife: number; hue: number;
};

/**
 * Lightweight canvas particle field (rising embers / marigold motes).
 * - DPR clamped to 1.5, particle count scaled by area + density
 * - pauses when tab hidden, honors prefers-reduced-motion
 */
export function Particles({ density = 90, className, mode = "ember" }: ParticleProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const running = useRef(true);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let particles: P[] = [];
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const spawn = (initial: boolean): P => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 12,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.25 + Math.random() * 0.55),
      r: 0.6 + Math.random() * 1.8,
      life: 0,
      maxLife: 320 + Math.random() * 340,
      hue: mode === "ember" ? 18 + Math.random() * 24 : 130 + Math.random() * 30,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.max(24, Math.floor((w * h) / 1_000_000 * density)));
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const tick = () => {
      if (!running.current) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin((p.life + i * 7) * 0.02) * 0.14;
        p.y += p.vy;
        const fade = 1 - p.life / p.maxLife;
        if (p.life > p.maxLife || p.y < -14) {
          particles[i] = spawn(false);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 92%, 62%, ${0.5 * fade})`;
        ctx.shadowColor = `hsla(${p.hue}, 92%, 55%, 0.8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf.current = requestAnimationFrame(tick);
    };

    const onVis = () => {
      running.current = !document.hidden;
      if (running.current) raf.current = requestAnimationFrame(tick);
    };

    resize();
    raf.current = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density, mode]);

  return <canvas ref={ref} aria-hidden className={className ?? "absolute inset-0 h-full w-full"} />;
}
