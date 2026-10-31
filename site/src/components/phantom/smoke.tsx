"use client";

import { useEffect, useRef } from "react";

type SmokeProps = {
  className?: string;
  /** number of puffs alive at once — 0 renders nothing */
  density?: number;
  /** css color of the smoke, any alpha < 0.5 */
  tint?: string;
  /** 0 = horizontal roll (Death-Eater style), 1 = strong upward billow */
  rise?: number;
  /** drift speed multiplier */
  speed?: number;
  /** seed the plumes from the bottom edge instead of the sides */
  fromBottom?: boolean;
};

type Puff = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  wob: number;
  life: number;
  maxLife: number;
  alpha: number;
};

/**
 * Cinematic smoke — soft overlapping puffs that roll across the frame with a
 * slow turbulent churn, like a horror-film title sequence. Pure canvas 2D:
 * DPR-clamped, paused off-screen, static frame under reduced motion.
 */
export function Smoke({
  className,
  density = 26,
  tint = "rgba(178,168,208,0.11)",
  rise = 0.25,
  speed = 1,
  fromBottom = false,
}: SmokeProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (density <= 0) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let visible = true;
    const puffs: Puff[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (edge = false): Puff => {
      const maxLife = rand(340, 620);
      const x0 = fromBottom || edge ? rand(-0.1 * w, 1.1 * w) : Math.random() < 0.5 ? rand(-w * 0.25, -w * 0.02) : rand(w * 1.02, w * 1.25);
      return {
        x: x0,
        y: fromBottom ? h + rand(0, h * 0.25) : rand(h * 0.42, h * 1.08),
        r: rand(w * 0.045, w * 0.11) + 40,
        vx: (x0 < 0 ? rand(0.22, 0.65) : rand(-0.65, -0.22)) * speed,
        vy: (-rand(0.04, 0.16) - rise * rand(0.12, 0.4)) * speed,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.002, 0.002),
        wob: rand(0, Math.PI * 2),
        life: edge ? rand(0, 60) : 0,
        maxLife,
        alpha: rand(0.55, 1),
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawPuff = (p: Puff) => {
      const fadeIn = Math.min(1, p.life / 70);
      const fadeOut = Math.min(1, (p.maxLife - p.life) / (p.maxLife * 0.3));
      const a = p.alpha * Math.max(0, Math.min(fadeIn, fadeOut));
      if (a <= 0.01) return;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, tint.replace(/[\d.]+\)$/, `${a * 0.55})`));
      g.addColorStop(0.55, tint.replace(/[\d.]+\)$/, `${a * 0.3})`));
      g.addColorStop(1, tint.replace(/[\d.]+\)$/, "0)"));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.62); // flattened puffs read as rolling banks, not bubbles
      ctx.translate(-p.x, -p.y);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const step = () => {
      if (!running || !visible) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < puffs.length; i++) {
        const p = puffs[i];
        p.life += 1;
        p.wob += 0.008;
        p.x += p.vx + Math.sin(p.wob * 2.1) * 0.35;
        p.y += p.vy + Math.cos(p.wob * 1.7) * 0.12;
        p.r *= 1.0016; // slow expansion
        p.rot += p.vr;
        if (p.life > p.maxLife || p.x < -w * 0.4 || p.x > w * 1.4 || p.y < -h * 0.35) {
          puffs[i] = spawn();
        }
        drawPuff(p);
      }
      raf = requestAnimationFrame(step);
    };

    resize();
    for (let i = 0; i < density; i++) puffs.push(spawn());
    if (reduce) {
      // one still, fully-formed frame
      puffs.forEach((p) => {
        p.life = p.maxLife * 0.4;
        drawPuff(p);
      });
      return;
    }
    raf = requestAnimationFrame(step);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver((es) => {
      const v = es[0]?.isIntersecting ?? true;
      if (v && !visible) {
        visible = true;
        raf = requestAnimationFrame(step);
      } else if (!v) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);
    const onVis = () => {
      if (document.hidden) {
        visible = false;
        cancelAnimationFrame(raf);
      } else if (!visible) {
        visible = true;
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density, tint, rise, speed, fromBottom]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
