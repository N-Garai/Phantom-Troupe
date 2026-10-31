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
      {/* sky */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020105_0%,#0a0616_38%,#120a20_62%,#050309_100%)]" />
      {/* moon — pockmarked, halo breathing, crossed by a slow cloud */}
      <div
        className="absolute right-[12%] top-[12%] h-28 w-28 rounded-full sm:h-40 sm:w-40"
        style={{
          background: "radial-gradient(circle at 38% 34%, #fdf6e3 0%, #e7d9b8 45%, #b9a67e 100%)",
          boxShadow: "0 0 60px 18px rgba(255, 236, 190, 0.22), 0 0 160px 60px rgba(247,155,46,0.10)",
          transform: "translate3d(calc(var(--mx) * -14px), calc(var(--my) * -10px + var(--sy) * -0.06px), 0)",
        }}
        aria-hidden
      >
        {/* craters */}
        <span className="absolute left-[22%] top-[30%] h-[14%] w-[14%] rounded-full bg-[rgba(146,127,94,0.4)]" />
        <span className="absolute left-[56%] top-[22%] h-[9%] w-[9%] rounded-full bg-[rgba(146,127,94,0.35)]" />
        <span className="absolute left-[48%] top-[58%] h-[18%] w-[18%] rounded-full bg-[rgba(146,127,94,0.28)]" />
        <span className="absolute left-[26%] top-[64%] h-[8%] w-[8%] rounded-full bg-[rgba(146,127,94,0.32)]" />
      </div>
      <div
        className="moon-halo absolute right-[10%] top-[9%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(253,246,227,0.10),transparent_62%)] blur-md sm:h-64 sm:w-64"
        aria-hidden
      />
      {/* a slow cloud wisp crossing the moon's face */}
      <div className="absolute right-[4%] top-[10%] h-40 w-72 overflow-hidden sm:h-56 sm:w-96" aria-hidden>
        <div
          className="moon-wisp absolute left-0 top-[30%] h-10 w-full rounded-full bg-[rgba(8,5,18,0.55)] blur-xl sm:h-14"
          style={{ transform: "translateX(-160%)" }}
        />
      </div>

      {/* a spider, patient on its thread */}
      <div className="absolute right-[24%] top-0 z-[2] hidden origin-top lg:block" aria-hidden>
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

      {/* bat colony crossing the moon */}
      <Bats className="absolute right-[16%] top-[14%] z-[1] h-24 w-[60vw]" />

      {/* fog */}
      <div className="fog-layer" aria-hidden />
      <div className="fog-layer fog-2" aria-hidden />
      {/* rolling smoke banks — cinematic, low, slow */}
      <Smoke
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[46%] w-full"
        density={14}
        tint="rgba(168,158,205,0.09)"
        rise={0.3}
        speed={0.9}
        fromBottom
      />

      {/* the 3D graveyard world (back row + extruded stones + candles) */}
      <GraveyardScene />

      {/* the shambling dead — walks behind the iron fence */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-[30%]" aria-hidden>
        <Zombie size={104} bottom="12%" delay={2} />
      </div>

      {/* iron fence in front of everything that moves below it */}
      <div className="absolute inset-x-0 bottom-0 z-[2] h-[26%]">
        <GraveyardFence />
      </div>

      {/* the dead man's hand — hover to raise it, click to sit at the séance */}
      <div className="absolute bottom-[4%] left-[7%] z-[3] hidden h-44 w-36 sm:block md:left-[11%]">
        <RisingHand className="h-full w-full" />
      </div>

      {/* ground fog + vignette */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-[3] h-40 w-full bg-[linear-gradient(180deg,transparent,rgba(5,3,9,0.9))]" aria-hidden />
      <div className="vignette pointer-events-none absolute inset-0 z-[3]" aria-hidden />

      {/* embers + roaming spirits */}
      <Particles className="pointer-events-none absolute inset-0 z-[4] h-full w-full" density={140} />
      <Spirits className="pointer-events-none absolute inset-0 z-[4] h-full w-full" count={14} graveSpawn={0.55} />

      {/* film grain — the whole graveyard breathes through old celluloid */}
      <div className="film-grain film-grain-soft pointer-events-none absolute inset-0 z-[5]" aria-hidden />

      {/* ghosts — now with real 3D tilt */}
      <Ghost
        parallax={22}
        className="pointer-events-none absolute left-[8%] top-[22%] z-[4] w-24 opacity-70 sm:left-[14%] sm:w-32 md:w-40"
        aria-hidden
      />
      <Ghost
        parallax={34}
        className="pointer-events-none absolute right-[7%] top-[40%] z-[4] w-14 opacity-40 sm:w-20"
        aria-hidden
      />
      <Ghost
        parallax={12}
        className="pointer-events-none absolute left-[38%] top-[14%] z-[4] hidden w-10 opacity-25 lg:block"
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
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-5 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.5em] text-ash sm:text-xs"
        >
          your terminal is a haunted house
        </motion.p>

        <h1 className="glitch-hover relative font-[family-name:var(--font-cinzel)] text-[13vw] font-black leading-[0.95] text-bone sm:text-7xl md:text-8xl">
          <span className="glitch-a block"><SplitText text="PHANTOM" delay={0.3} /></span>
          <span className="glitch-b mt-1 block text-marigold text-glow-marigold"><SplitText text="TROUPE" delay={0.65} /></span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.8 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-ash sm:text-lg"
        >
          A troupe of local AI agents that haunts your shell — autopsying failed commands,
          burying dead scripts, and <span className="text-spectre">resurrecting the ones you still need</span>.
          Nothing leaves your machine. Nothing costs a cent.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.8 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="#download"
            className="pulse-ring w-full rounded-md bg-marigold px-7 py-3.5 font-[family-name:var(--font-geist-mono)] text-sm font-bold uppercase tracking-widest text-void transition-all hover:bg-candle sm:w-auto"
          >
            Summon it — one line
          </a>
          <a
            href="#seance"
            className="w-full rounded-md border border-border px-7 py-3.5 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-widest text-bone transition-all hover:border-marigold/60 hover:text-marigold sm:w-auto"
          >
            Enter the graveyard
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-10 font-[family-name:var(--font-geist-mono)] text-xs text-ash/70"
        >
          <span className="text-spectre">$</span> phantom <span className="blink-caret text-marigold">▌</span>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
        aria-hidden
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-ash/40 p-1.5">
          <motion.div
            animate={{ y: [0, 14, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-1 rounded-full bg-marigold"
          />
        </div>
      </motion.div>
    </section>
  );
}
