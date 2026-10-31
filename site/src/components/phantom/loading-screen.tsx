"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RisingHand } from "./rising-hand";
import { BatSvg } from "./bats";
import { Moon } from "./moon";
import { HauntAudio } from "./haunt-audio";

type Phase = "forest" | "burst" | "title" | "smoke-out" | "exit";

/* deterministic PRNG — the forest is organic but identical on every load */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* a jagged conifer treeline as a single silhouette path */
function treelinePath(seed: number, base: number, minH: number, maxH: number, step: number) {
  const rnd = mulberry32(seed);
  let d = `M0 320 L0 ${(base - 6 - rnd() * 10).toFixed(1)}`;
  let x = 0;
  while (x < 1440) {
    const h = minH + rnd() * (maxH - minH);
    const w = step * (0.72 + rnd() * 0.56);
    const apex = base - h;
    const sagL = base - h * (0.16 + rnd() * 0.22);
    const sagR = base - h * (0.16 + rnd() * 0.22);
    d += ` L${(x + w / 2).toFixed(1)} ${apex.toFixed(1)} L${(x + w).toFixed(1)} ${sagR.toFixed(1)}`;
    x += w;
  }
  d += ` L1440 ${base} L1440 320 Z`;
  return d;
}

const FAR_TREELINE = treelinePath(7, 208, 30, 66, 34);
const MID_TREELINE = treelinePath(23, 252, 44, 100, 46);
const NEAR_TREELINE = treelinePath(41, 300, 56, 128, 62);

/** A gnarled, leafless tree — tapered strokes, crooked forks, reaching twigs. */
function DeadTree({
  className,
  style,
  flip = false,
}: {
  className?: string;
  style?: React.CSSProperties;
  flip?: boolean;
}) {
  return (
    <svg viewBox="0 0 200 260" className={className} style={style} aria-hidden>
      <g
        stroke="#070310"
        fill="none"
        strokeLinecap="round"
        transform={flip ? "translate(200 0) scale(-1 1)" : undefined}
      >
        {/* trunk */}
        <path d="M100 260 C101 224 99 196 100 168 C101 148 97 132 99 112" strokeWidth="15" />
        {/* primary forks */}
        <path d="M99 112 C94 92 84 76 66 62" strokeWidth="9" />
        <path d="M99 112 C104 90 116 74 136 60" strokeWidth="9" />
        <path d="M100 168 C88 158 72 152 50 148" strokeWidth="7" />
        <path d="M100 172 C114 164 130 162 150 156" strokeWidth="6.5" />
        {/* secondary branches */}
        <path d="M66 62 C56 50 44 44 28 42" strokeWidth="4.5" />
        <path d="M66 62 C62 46 64 34 58 20" strokeWidth="4" />
        <path d="M136 60 C146 46 158 40 174 38" strokeWidth="4.5" />
        <path d="M136 60 C140 44 136 30 142 16" strokeWidth="4" />
        <path d="M50 148 C40 140 28 136 14 136" strokeWidth="3.5" />
        <path d="M150 156 C160 148 172 146 186 142" strokeWidth="3.5" />
        {/* reaching twigs */}
        <path d="M28 42 C20 38 12 38 4 42" strokeWidth="2" />
        <path d="M58 20 C54 12 48 8 40 6" strokeWidth="2" />
        <path d="M174 38 C182 32 188 24 190 14" strokeWidth="2" />
        <path d="M142 16 C146 8 152 4 160 2" strokeWidth="2" />
        <path d="M14 136 C8 132 2 132 -4 134" strokeWidth="1.8" />
        <path d="M186 142 C192 138 198 138 204 140" strokeWidth="1.8" />
        {/* a few broken stubs on the trunk */}
        <path d="M100 200 C106 196 110 190 112 182" strokeWidth="3.4" />
        <path d="M99 224 C92 220 88 214 86 206" strokeWidth="3" />
      </g>
    </svg>
  );
}

/* smoke puffs rolling through the whole frame */
function SmokePuff({
  delay,
  dur,
  x,
  y,
  size,
  rotate,
  tint,
}: {
  delay: number;
  dur: number;
  x: string;
  y: string;
  size: number;
  rotate: number;
  tint?: string;
}) {
  return (
    <div
      className="smoke-puff absolute"
      style={
        {
          left: x,
          top: y,
          width: size,
          height: size * 0.55,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
          transform: `rotate(${rotate}deg)`,
          ...(tint ? { background: tint } : null),
        } as React.CSSProperties
      }
      aria-hidden
    />
  );
}

/* one bat swooping toward the viewer */
function BatToward({
  delay,
  dur,
  width,
  top,
  left,
  flap = 0.4,
}: {
  delay: number;
  dur: number;
  width: number;
  top: string;
  left: string;
  flap?: number;
}) {
  return (
    <div
      className="bat-toward absolute"
      style={
        {
          top,
          left,
          width,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <div className="bat-flap" style={{ ["--flap"]: `${flap}s` } as React.CSSProperties}>
        <BatSvg />
      </div>
    </div>
  );
}

/* one letter materializing from — and dissolving into — smoke */
function SmokeLetter({
  ch,
  delay,
  shown,
  gone,
  reduce,
  drift,
}: {
  ch: string;
  delay: number;
  shown: boolean;
  gone: boolean;
  reduce: boolean;
  drift: number;
}) {
  if (reduce) {
    return (
      <motion.span
        aria-hidden
        className="inline-block"
        initial={{ opacity: 0 }}
        animate={{ opacity: shown && !gone ? 1 : 0 }}
        transition={{ duration: 0.4, delay: shown ? delay * 0.5 : 0 }}
      >
        {ch === " " ? "\u00A0" : ch}
      </motion.span>
    );
  }

  return (
    <motion.span
      aria-hidden
      className="inline-block will-change-transform"
      initial={{ opacity: 0, y: 30, filter: "blur(20px)", scale: 1.3, rotateX: 45 }}
      animate={
        gone
          ? {
              opacity: 0,
              y: -70,
              x: drift,
              filter: "blur(24px)",
              scale: 0.7,
              rotateX: -40,
            }
          : shown
            ? { opacity: 0.96, y: 0, x: 0, filter: "blur(0px)", scale: 1, rotateX: 0 }
            : {}
      }
      transition={
        gone
          ? { duration: 1.25, delay: delay * 0.4, ease: [0.4, 0, 0.6, 1] }
          : { duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {ch === " " ? "\u00A0" : ch}
    </motion.span>
  );
}

/* dirt clods flung out when the grave breaks */
const CLODS = [
  { left: "28%", dx: "-46px", dy: "-26px", s: 1.05, delay: 0 },
  { left: "37%", dx: "-20px", dy: "-56px", s: 0.8, delay: 0.05 },
  { left: "46%", dx: "4px", dy: "-68px", s: 1.2, delay: 0.02 },
  { left: "55%", dx: "28px", dy: "-50px", s: 0.9, delay: 0.09 },
  { left: "63%", dx: "50px", dy: "-24px", s: 1.1, delay: 0.04 },
  { left: "50%", dx: "-6px", dy: "-74px", s: 0.7, delay: 0.12 },
];

export function LoadingScreen({ onComplete }: { onComplete?: () => void } = {}) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("forest");
  const [reduce, setReduce] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioRef = useRef<HauntAudio | null>(null);
  const phaseRef = useRef<Phase>("forest");

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /* ---- the loader plays on every visit — a rite, not a gate ---- */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const full = new URLSearchParams(window.location.search).get("motion") === "full";
    const r = mq.matches && !full;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only rite state must start after hydration
    setReduce(r);

    document.body.style.overflow = "hidden";
    setVisible(true);
    setPhase("forest");
    phaseRef.current = "forest";

    const audio = new HauntAudio();
    audioRef.current = audio;
    setSoundOn(audio.start());

    const total = r ? 2800 : 8300;

    if (r) {
      at(300, () => setPhase("burst"));
      at(700, () => setPhase("title"));
      at(1800, () => setPhase("smoke-out"));
      at(2300, () => setPhase("exit"));
    } else {
      at(1400, () => {
        setPhase("burst");
        audio.toll();
      });
      at(2600, () => setPhase("title"));
      at(6400, () => setPhase("smoke-out"));
      at(7600, () => setPhase("exit"));
    }

    at(total, () => {
      document.body.style.overflow = "";
      audio.stop();
      setVisible(false);
      // let the exit animation play before the page reveals
      timers.current.push(setTimeout(() => onComplete?.(), reduce ? 350 : 800));
    });

    return () => {
      clearTimers();
      document.body.style.overflow = "";
      audio.stop();
    };
  }, [at]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!visible) return;
    const skip = () => {
      if (phaseRef.current === "exit") return;
      clearTimers();
      document.body.style.overflow = "";
      audioRef.current?.stop();
      setPhase("exit");
      // fire completion after the exit animation finishes
      timers.current.push(setTimeout(() => onComplete?.(), reduce ? 300 : 750));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (soundOn) {
      audio.stop();
      setSoundOn(false);
    } else {
      setSoundOn(audio.start());
    }
  };

  const burstStarted = phase !== "forest";
  const showTitle = phase === "title" || phase === "smoke-out";
  const gone = phase === "smoke-out" || phase === "exit";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          data-testid="loading-screen"
          className="loader-stage fixed inset-0 z-[200] cursor-pointer overflow-hidden bg-void"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(10px)" }}
          transition={{ duration: reduce ? 0.3 : 0.75, ease: [0.4, 0, 0.2, 1] }}
          role="status"
          aria-label="Summoning the Phantom Troupe"
          onClick={() => {
            if (phaseRef.current === "exit") return;
            clearTimers();
            document.body.style.overflow = "";
            audioRef.current?.stop();
            setPhase("exit");
          }}
        >
          {/* ================= deep void sky ================= */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,#0c0718_0%,#070410_48%,#030108_100%)]" />
          {/* dusk bleeding over the horizon so the forest silhouettes can read */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#020105_0%,#080410_38%,#150e2a_68%,#221845_88%,#1a1132_100%)]" />
          {/* moon-glow backlight pooled behind the treeline */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-[26%] h-[42%] blur-md"
            style={{
              background:
                "radial-gradient(ellipse 85% 90% at 50% 100%, rgba(150,118,214,0.34), rgba(96,72,158,0.16) 52%, transparent 78%)",
            }}
            aria-hidden
          />

          {/* svg filter defs — the turbulence that gives the smoke its edges */}
          <svg width="0" height="0" className="absolute" aria-hidden>
            <defs>
              <filter id="smoke-turb" x="-30%" y="-30%" width="160%" height="160%">
                <feTurbulence type="fractalNoise" baseFrequency="0.011 0.026" numOctaves="3" seed="11" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="110" />
              </filter>
            </defs>
          </svg>

          {/* ================= the moon, smoked over ================= */}
          <Moon
            className="absolute right-[8%] top-[6%] h-28 w-28 rounded-full opacity-90 sm:h-36 sm:w-36"
            style={{
              boxShadow:
                "0 0 46px 16px rgba(255, 236, 190, 0.16), 0 0 120px 60px rgba(247,155,46,0.07)",
            }}
          />
          <div
            className="absolute right-[5%] top-[3%] h-40 w-40 rounded-full blur-2xl sm:h-52 sm:w-52"
            style={{ background: "radial-gradient(circle, rgba(253,246,227,0.12), transparent 62%)", opacity: 0.7 }}
            aria-hidden
          />

          {/* ================= the dark forest ================= */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0.4 : 2.2, ease: "easeOut" }}
          >
            {/* far treeline — palest, blurred: it swims in the dusk haze */}
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-[52%] w-full opacity-90 blur-[1.5px]" aria-hidden>
              <path d={FAR_TREELINE} fill="#2b2148" />
            </svg>
            {/* haze bank veiling the far trees' feet */}
            <div
              className="pointer-events-none absolute bottom-[38%] left-0 h-[16%] w-full blur-lg"
              style={{ background: "linear-gradient(180deg, transparent, rgba(146,122,196,0.14) 55%, transparent)" }}
              aria-hidden
            />
            {/* mid treeline + bare trees */}
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-[62%] w-full" aria-hidden>
              <path d={MID_TREELINE} fill="#170f2c" />
            </svg>
            <DeadTree className="absolute bottom-[10%] left-[7%] w-32 opacity-90 sm:w-44" />
            <DeadTree className="absolute bottom-[9%] right-[9%] w-28 opacity-85 sm:w-40" flip />
            {/* near treeline */}
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-[78%] w-full" aria-hidden>
              <path d={NEAR_TREELINE} fill="#0d0819" />
            </svg>
            {/* huge foreground trees framing the frame */}
            <DeadTree className="absolute -bottom-[4%] -left-[3%] w-56 opacity-95 sm:w-72" />
            <DeadTree className="absolute -bottom-[5%] -right-[4%] w-60 opacity-95 sm:w-80" flip />
          </motion.div>

          {/* ================= heavy smoke, everywhere ================= */}
          <div className="pointer-events-none absolute inset-0 z-[2]">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SmokePuff
                key={i}
                delay={i * 0.7}
                dur={13 + i * 2}
                x={`-${8 + i * 11}%`}
                y={`${34 + i * 7}%`}
                size={440 + i * 170}
                rotate={-14 + i * 8}
              />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <SmokePuff
                key={`r${i}`}
                delay={1.6 + i * 1.2}
                dur={15 + i * 3}
                x="82%"
                y={`${16 + i * 15}%`}
                size={320 + i * 120}
                rotate={18 - i * 6}
              />
            ))}
          </div>

          {/* rolling ground fog */}
          <div className="pointer-events-none absolute bottom-0 left-0 z-[3] h-[38%] w-full">
            <div
              className="smoke-puff absolute"
              style={
                {
                  left: "0",
                  bottom: "0",
                  width: "200%",
                  height: "150%",
                  animationDelay: "0s",
                  animationDuration: "12s",
                  transform: "rotate(-5deg) scaleX(1.4)",
                } as React.CSSProperties
              }
              aria-hidden
            />
            <div
              className="smoke-puff absolute"
              style={
                {
                  left: "-20%",
                  bottom: "-6%",
                  width: "240%",
                  height: "160%",
                  animationDelay: "3.6s",
                  animationDuration: "15s",
                  transform: "rotate(8deg) scaleX(1.6)",
                } as React.CSSProperties
              }
              aria-hidden
            />
          </div>

          {/* ================= the grave that breaks open ================= */}
          <div
            className={`absolute bottom-[3%] left-1/2 z-[4] w-[min(400px,72vw)] -translate-x-1/2 ${
              phase === "burst" && !reduce ? "loader-shake" : ""
            }`}
            aria-hidden
          >
            <div className="relative h-44 sm:h-52">
              {/* the dead man's hand, clawing free — knuckles clear the mound */}
              {burstStarted && (
                <div className="loader-hand hand-3d pointer-events-none absolute bottom-3 left-1/2 z-[1] h-52 w-40">
                  <RisingHand loop={false} interactive={false} whisper={false} className="h-full w-full" />
                </div>
              )}

              {/* spectre flash leaking from the crack */}
              {burstStarted && <div className="loader-flash" />}

              {/* the mound — two halves heave apart */}
              <svg viewBox="0 0 240 32" preserveAspectRatio="none" className="absolute bottom-0 left-0 z-[2] w-full" aria-hidden>
                <path
                  d="M120 14 Q98 10 76 15 Q48 22 20 32 L120 32 Z"
                  fill="#0e0918"
                  className={`grave-mound-half ${burstStarted ? "loader-mound-l" : ""}`}
                />
                <path
                  d="M120 14 Q142 10 164 15 Q192 22 220 32 L120 32 Z"
                  fill="#0e0918"
                  className={`grave-mound-half ${burstStarted ? "loader-mound-r" : ""}`}
                />
                <path d="M120 14 Q98 10 76 15" fill="none" stroke="rgba(233,225,210,0.12)" strokeWidth="1.3" className={burstStarted ? "loader-mound-l" : ""} />
                <path d="M120 14 Q142 10 164 15" fill="none" stroke="rgba(233,225,210,0.12)" strokeWidth="1.3" className={burstStarted ? "loader-mound-r" : ""} />
              </svg>

              {/* cracks that draw themselves just before the split */}
              {burstStarted && (
                <svg viewBox="0 0 200 26" className="loader-crack absolute bottom-0 left-1/2 z-[3] w-[52%] -translate-x-1/2" aria-hidden>
                  <path d="M100 26 L96 18 L102 12 L98 5 L101 0" fill="none" stroke="#3a2c52" strokeWidth="2.4" strokeLinecap="round" />
                  <path className="loader-crack-dark" d="M100 26 L108 16 L104 8 L111 1" fill="none" stroke="#241b33" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M100 24 L90 18 L87 12" fill="none" stroke="#2a2036" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}

              {/* dirt clods burst outward */}
              {burstStarted &&
                CLODS.map((c, i) => (
                  <span
                    key={i}
                    className="loader-clod z-[3]"
                    style={
                      {
                        left: c.left,
                        bottom: "26%",
                        width: 7 * c.s + 3,
                        height: 6 * c.s + 2,
                        ["--dx"]: c.dx,
                        ["--dy"]: c.dy,
                        animationDelay: `${c.delay}s`,
                      } as React.CSSProperties
                    }
                  />
                ))}
            </div>
          </div>

          {/* ================= bats swarming toward the camera ================= */}
          <div className="pointer-events-none absolute inset-0 z-[5]">
            <BatToward delay={0.4} dur={9} width={64} top="14%" left="10%" flap={0.36} />
            <BatToward delay={1.3} dur={10} width={86} top="30%" left="24%" flap={0.42} />
            <BatToward delay={2.2} dur={8.5} width={52} top="7%" left="44%" flap={0.34} />
            <BatToward delay={3.1} dur={11} width={104} top="20%" left="60%" flap={0.46} />
            <BatToward delay={4.0} dur={9.5} width={74} top="38%" left="76%" flap={0.4} />
            <BatToward delay={4.9} dur={12} width={92} top="10%" left="86%" flap={0.38} />
            <BatToward delay={5.8} dur={10} width={60} top="46%" left="6%" flap={0.44} />
            <BatToward delay={6.7} dur={9} width={78} top="24%" left="34%" flap={0.4} />
            <BatToward delay={2.8} dur={11.5} width={70} top="52%" left="68%" flap={0.36} />
          </div>

          {/* ================= PHANTOM TROUPE — a name made of smoke ================= */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-[16%] z-[6] text-center transition-opacity duration-1000 ${
              showTitle ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showTitle ? 0.65 : 0, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-4 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.8em] text-ash/70 sm:text-[11px]"
            >
              the veil is lifting…
            </motion.p>
            <h1
              className="loader-flicker font-[family-name:var(--font-cinzel)] text-[13vw] font-black leading-[0.9] tracking-[0.05em] text-bone sm:text-7xl md:text-8xl"
              aria-label="Phantom Troupe"
            >
              <span className="block text-glow-bone">
                {Array.from("PHANTOM").map((ch, i) => (
                  <SmokeLetter
                    key={i}
                    ch={ch}
                    delay={0.15 + i * 0.12}
                    shown={showTitle}
                    gone={gone}
                    reduce={reduce}
                    drift={i % 2 ? 16 : -12}
                  />
                ))}
              </span>
              <span className="mt-1 block tracking-[0.12em] text-marigold text-glow-marigold">
                {Array.from("TROUPE").map((ch, i) => (
                  <SmokeLetter
                    key={i}
                    ch={ch}
                    delay={0.95 + i * 0.12}
                    shown={showTitle}
                    gone={gone}
                    reduce={reduce}
                    drift={i % 2 ? -14 : 12}
                  />
                ))}
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: showTitle ? 0.55 : 0, y: 0 }}
              transition={{ duration: 0.8, delay: 1.9 }}
              className="mt-6 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.5em] text-spectre/70 sm:text-[12px]"
            >
              every command leaves a corpse
            </motion.p>
          </div>

          {/* ================= wisps that carry the name away ================= */}
          {gone && !reduce && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[10%] z-[6] h-[46%]" aria-hidden>
              {[
                { left: "18%", size: 130, delay: 0 },
                { left: "32%", size: 90, delay: 0.18 },
                { left: "46%", size: 170, delay: 0.05 },
                { left: "58%", size: 110, delay: 0.26 },
                { left: "70%", size: 150, delay: 0.1 },
                { left: "80%", size: 95, delay: 0.34 },
              ].map((w, i) => (
                <div
                  key={i}
                  className="smoke-wisp"
                  style={{
                    left: w.left,
                    bottom: "20%",
                    width: w.size,
                    height: w.size * 0.6,
                    animationDelay: `${w.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* ================= sound rite ================= */}
          <button
            type="button"
            className="loader-sound absolute right-6 top-6 z-[8] font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.3em] text-ash transition-colors hover:text-bone"
            onClick={toggleSound}
            aria-pressed={soundOn}
          >
            {soundOn ? "◉ haunt on" : "○ sound on?"}
          </button>

          {/* ================= skip hint ================= */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="absolute bottom-7 right-7 z-[8] font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.3em] text-ash"
          >
            click anywhere to pass on
          </motion.p>

          {/* ================= film grain + vignette ================= */}
          <div className="film-grain pointer-events-none absolute inset-0 z-10" aria-hidden />
          <div className="vignette pointer-events-none absolute inset-0 z-10" aria-hidden />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
