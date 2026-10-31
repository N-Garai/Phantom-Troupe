"use client";

import { useEffect, useRef } from "react";

type SpiritProps = {
  className?: string;
  /** number of roaming wisps — keep low, they're ghosts not tourists */
  count?: number;
  /** fraction of wisps that rise out of the ground instead of roaming */
  graveSpawn?: number;
};

type Wisp = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  alpha: number;
  phase: number;
  freq: number;
  amp: number;
  grave: boolean;
  life: number;
  maxLife: number;
  tail: Array<{ x: number; y: number }>;
};

/**
 * Roaming spirits — glowing wisps that drift across the graveyard on
 * erratic sine paths, leaving fading trails. A share of them rise straight
 * out of the ground and dissolve into the dark. Canvas-based, DPR-clamped,
 * pauses when hidden or scrolled away.
 */
export function Spirits({ className, count = 9, graveSpawn = 0.4 }: SpiritProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const running = useRef(true);
  const visible = useRef(true);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const spawn = (initial: boolean): Wisp => {
      const grave = Math.random() < graveSpawn;
      const maxLife = grave ? 380 + Math.random() * 260 : 900 + Math.random() * 700;
      return {
        x: initial ? Math.random() * w : w * (0.08 + Math.random() * 0.84),
        y: initial ? Math.random() * h * 0.8 : h * (0.82 + Math.random() * 0.12),
        vx: (Math.random() - 0.5) * (grave ? 0.14 : 0.3),
        vy: grave ? -(0.24 + Math.random() * 0.3) : -(0.04 + Math.random() * 0.12),
        r: 1.6 + Math.random() * 3.2,
        hue: Math.random() < 0.62 ? 130 + Math.random() * 32 : 268 + Math.random() * 18,
        alpha: 0.32 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        freq: 0.008 + Math.random() * 0.016,
        amp: 14 + Math.random() * 30,
        grave,
        life: 0,
        maxLife,
        tail: [],
      };
    };

    let wisps: Wisp[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (wisps.length === 0) wisps = Array.from({ length: count }, () => spawn(true));
    };

    const drawWisp = (p: Wisp, fade: number) => {
      // trail
      for (let i = 0; i < p.tail.length; i++) {
        const t = p.tail[i];
        const tt = (i + 1) / p.tail.length;
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.r * tt * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, ${0.1 * tt * fade})`;
        ctx.fill();
      }
      // head — layered glow
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.hue}, 95%, 82%, ${0.75 * p.alpha * fade})`);
      g.addColorStop(0.35, `hsla(${p.hue}, 90%, 65%, ${0.32 * p.alpha * fade})`);
      g.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsla(${p.hue}, 100%, 88%, ${0.85 * p.alpha * fade})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = () => {
      if (!running.current || !visible.current) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < wisps.length; i++) {
        const p = wisps[i];
        p.life++;
        p.phase += p.freq;
        // erratic horizontal wander + vertical sine
        p.x += p.vx + Math.sin(p.phase * 2.1) * 0.3;
        p.y += p.vy + Math.cos(p.phase) * (p.amp * 0.02);
        p.tail.unshift({ x: p.x, y: p.y });
        if (p.tail.length > 9) p.tail.pop();

        const fade =
          p.life < 40 ? p.life / 40 : Math.max(0, 1 - Math.max(0, p.life - p.maxLife * 0.72) / (p.maxLife * 0.28));

        if (p.grave) {
          if (p.life > p.maxLife || p.y < h * 0.08) {
            wisps[i] = spawn(false);
            continue;
          }
        } else {
          if (p.x < -30) p.x = w + 30;
          if (p.x > w + 30) p.x = -30;
          if (p.y < h * 0.05) p.y = h * 0.75;
          if (p.life > p.maxLife) {
            wisps[i] = spawn(true);
            continue;
          }
        }

        drawWisp(p, Math.min(1, fade));
      }
      raf.current = requestAnimationFrame(tick);
    };

    // draw one static frame for reduced motion
    const still = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of wisps) drawWisp(p, 0.8);
    };

    const onVis = () => {
      running.current = !document.hidden;
      if (running.current && visible.current && !reduce) raf.current = requestAnimationFrame(tick);
    };

    resize();

    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        if (visible.current && running.current && !reduce) raf.current = requestAnimationFrame(tick);
      },
      { threshold: 0.02 }
    );
    io.observe(canvas);

    if (reduce) {
      still();
    } else {
      raf.current = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [count, graveSpawn]);

  return <canvas ref={ref} aria-hidden className={className ?? "absolute inset-0 h-full w-full"} />;
}
