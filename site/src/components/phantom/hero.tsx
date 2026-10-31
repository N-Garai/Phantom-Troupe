"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SplitText } from "./reveal";
import { Particles } from "./particles";
import { Ghost } from "./ghost";
import { GraveyardScene, GraveyardFence } from "./graveyard-scene";
import { RisingHand } from "./rising-hand";
import { Zombie } from "./zombie";
import { Spirits } from "./spirits";
import { Bats } from "./bats";
import { Smoke } from "./smoke";
import { Moon } from "./moon";

/** Hero: a living 3D graveyard — cursor-parallax world, shambling dead,
 *  a hand that claws out of its grave, roaming spirits, bats over the moon. */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const onMove = useCallback((e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - 0.5;
    const my = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--mx", mx.toFixed(3));
    el.style.setProperty("--my", my.toFixed(3));
  }, [reduce]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.setProperty("--sy", Math.min(y, 800).toFixed(0));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMove}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
      style={{ ["--mx" as string]: 0, ["--my" as string]: 0, ["--sy" as string]: 0 }}
    >
      {/* deep void sky */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#010003_0%,#040208_25%,#080514_55%,#050309_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(109,75,180,0.14),transparent_60%)]" />

      {/* moon — pockmarked, halo breathing, crossed by a slow cloud */}
      <Moon
        className="absolute right-[11%] top-[10%] h-30 w-30 rounded-full sm:h-44 sm:w-44"
        style={{
          boxShadow:
            "0 0 70px 24px rgba(255, 236, 190, 0.18), 0 0 180px 80px rgba(247,155,46,0.08)",
          transform: "translate3d(calc(var(--mx) * -16px), calc(var(--my) * -12px + var(--sy) * -0.07px), 0)",
        }}
      />
      <div
        className="moon-halo absolute right-[7%] top-[6%] h-52 w-52 rounded-full blur-2xl sm:h-64 sm:w-64"
        style={{
          background: "radial-gradient(circle, rgba(253,246,227,0.14), transparent 62%)",
          opacity: 0.8,
        }}
        aria-hidden
      />
      {/* a slow cloud wisp crossing the moon's face */}
      <div className="absolute right-[3%] top-[8%] h-44 w-80 overflow-hidden sm:h-60 sm:w-104" aria-hidden>
        <div
          className="moon-wisp absolute left-0 top-[30%] h-12 w-full rounded-full bg-[rgba(6,4,12,0.72)] blur-3xl sm:h-16"
          style={{ transform: "translateX(-170%)" }}
        />
      </div>

      {/* a patient spider on its thread */}
      <div className="absolute right-[22%] top-0 z-[2] hidden origin-top lg:block" aria-hidden>
        <svg viewBox="0 0 60 130" className="spider-sway h-32 w-14">
          <line x1="30" y1="0" x2="30" y2="86" stroke="#97907f" strokeWidth="0.7" opacity="0.5" />
          <g transform="translate(30 96)">
            <ellipse cx="0" cy="8" rx="7" ry="9" fill="#0b0714" />
            <circle cx="0" cy="-4" r="4.5" fill="#0b0714" />
            <g stroke="#0b0714" strokeWidth="1.6" strokeLinecap="round">
              <path d="M-4 -2 L-14 -10 M-5 2 L-16 0 M-5 6 L-15 10 M-4 10 L-12 18" />
              <path d="M4 -2 L14 -10 M5 2 L16 0 M5 6 L15 10 M4 10 L12 18" />
            </g>
            <circle cx="-1.6" cy="-4.6" r="0.7" fill="#74f2a4" opacity="0.85" />
            <circle cx="1.6" cy="-4.6" r="0.7" fill="#74f2a4" opacity="0.85" />
          </g>
        </svg>
      </div>

      {/* bat colony crossing the moon — denser, creepier */}
      <Bats className="absolute right-[14%] top-[12%] z-[1] h-24 w-[70vw]" />

      {/* fog */}
      <div className="fog-layer" aria-hidden />
      <div className="fog-layer fog-2" aria-hidden />
      {/* rolling smoke banks — cinematic, low, slow */}
      <Smoke
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[48%] w-full"
        density={20}
        tint="rgba(150,140,190,0.11)"
        rise={0.35}
        speed={1}
        fromBottom
      />

      {/* the 3D graveyard world (back row + extruded stones + candles) */}
      <GraveyardScene />

      {/* the shambling dead — walks behind the iron fence */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-[32%]" aria-hidden>
        <Zombie size={112} bottom="11%" delay={1.5} />
        <Zombie size={80} bottom="13%" delay={9} className="opacity-60" />
      </div>

      {/* iron fence in front of everything that moves below it */}
      <div className="absolute inset-x-0 bottom-0 z-[2] h-[28%]">
        <GraveyardFence />
      </div>

      {/* the dead man's hand — hover to raise it, click to sit at the séance */}
      <div className="absolute bottom-[3%] left-[6%] z-[3] hidden h-48 w-40 sm:block md:left-[10%]">
        <RisingHand className="h-full w-full" />
      </div>

      {/* ground fog + vignette */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-[3] h-48 w-full bg-[linear-gradient(180deg,transparent,rgba(5,3,9,0.92))]" aria-hidden />
      <div className="vignette pointer-events-none absolute inset-0 z-[3]" aria-hidden />

      {/* embers + roaming spirits */}
      <Particles className="pointer-events-none absolute inset-0 z-[4] h-full w-full" density={160} />
      <Spirits className="pointer-events-none absolute inset-0 z-[4] h-full w-full" count={16} graveSpawn={0.55} />

      {/* film grain — the whole graveyard breathes through old celluloid */}
      <div className="film-grain film-grain-soft pointer-events-none absolute inset-0 z-[5]" aria-hidden />

      {/* ghosts — spectral, 3D tilt */}
      <Ghost
        parallax={24}
        className="pointer-events-none absolute left-[9%] top-[24%] z-[4] w-28 opacity-75 sm:left-[14%] sm:w-36 md:w-44"
        aria-hidden
      />
      <Ghost
        parallax={36}
        className="pointer-events-none absolute right-[8%] top-[38%] z-[4] w-16 opacity-50 sm:w-22 md:w-28"
        aria-hidden
      />
      <Ghost
        parallax={14}
        className="pointer-events-none absolute left-[40%] top-[16%] z-[4] hidden w-12 opacity-30 lg:block"
        aria-hidden
      />
      <Ghost
        parallax={20}
        className="pointer-events-none absolute right-[30%] top-[55%] z-[4] hidden w-10 opacity-28 lg:block"
        aria-hidden
      />

      {/* content */}
      <div
        className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 floating-content"
        style={{ transform: "translate3d(calc(var(--mx) * 10px), calc(var(--my) * 8px + var(--sy) * 0.12px), 0)" }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="mb-5 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.6em] text-ash sm:text-xs"
        >
          your terminal is a haunted house
        </motion.p>

        <h1 className="glitch-hover relative font-[family-name:var(--font-cinzel)] text-[14vw] font-black leading-[0.92] text-bone sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="glitch-a block"><SplitText text="PHANTOM" delay={0.35} /></span>
          <span className="glitch-b mt-1 block text-marigold text-glow-marigold"><SplitText text="TROUPE" delay={0.75} /></span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.9 }}
          className="mx-auto mt-7 max-w-2xl text-balance text-base leading-relaxed text-ash sm:text-lg"
        >
          A troupe of local AI agents that haunts your shell — autopsying failed commands,
          burying dead scripts, and <span className="text-spectre">resurrecting the ones you still need</span>.
          Nothing leaves your machine. Nothing costs a cent.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.9 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#download"
            className="pulse-ring w-full rounded-md bg-marigold px-8 py-4 font-[family-name:var(--font-geist-mono)] text-sm font-bold uppercase tracking-widest text-void transition-all hover:bg-candle sm:w-auto"
          >
            Summon it — one line
          </a>
          <a
            href="#seance"
            className="w-full rounded-md border border-border px-8 py-4 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-widest text-bone transition-all hover:border-marigold/60 hover:text-marigold sm:w-auto"
          >
            Enter the graveyard
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-12 font-[family-name:var(--font-geist-mono)] text-xs text-ash/60"
        >
          <span className="text-spectre">$</span> phantom <span className="blink-caret text-marigold">▌</span>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2"
        aria-hidden
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-ash/40 p-1.5">
          <motion.div
            animate={{ y: [0, 16, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-1 rounded-full bg-marigold"
          />
        </div>
      </motion.div>
    </section>
  );
}
