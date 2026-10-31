"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Smoke } from "./smoke";
import { HauntAudio } from "./haunt-audio";

type Phase = "scene" | "break" | "title" | "vanish" | "exit";

const SESSION_KEY = "phantom-loader-seen";

/* 12 dirt clods bursting outward from the broken grave. */
const CLODS = [
  { left: "46%", "--dx": "-92px", "--dy": "-110px", s: 7, d: 0 },
  { left: "50%", "--dx": "-40px", "--dy": "-150px", s: 5, d: 40 },
  { left: "53%", "--dx": "22px", "--dy": "-140px", s: 8, d: 12 },
  { left: "56%", "--dx": "88px", "--dy": "-96px", s: 6, d: 55 },
  { left: "44%", "--dx": "-130px", "--dy": "-30px", s: 6, d: 25 },
  { left: "58%", "--dx": "128px", "--dy": "-42px", s: 7, d: 8 },
  { left: "47%", "--dx": "-66px", "--dy": "-58px", s: 5, d: 70 },
  { left: "55%", "--dx": "58px", "--dy": "-70px", s: 9, d: 0 },
  { left: "49%", "--dx": "-16px", "--dy": "-170px", s: 4, d: 90 },
  { left: "52%", "--dx": "104px", "--dy": "-20px", s: 5, d: 60 },
  { left: "45%", "--dx": "-108px", "--dy": "-74px", s: 5, d: 45 },
  { left: "57%", "--dx": "48px", "--dy": "-120px", s: 6, d: 30 },
];

const TITLE_A = "PHANTOM";
const TITLE_B = "TROUPE";

/* — bone palette shared by every skeletal piece — */
const BONE = "#d3c8b0";
const BONE_DARK = "#948871";
const BONE_SHADOW = "#5c5344";

/** One true skeletal finger: metacarpal head, three phalanges, joint gaps,
 *  spade-shaped distal tip. Curled more at every joint — a dead claw. */
function ClawFinger({
  kx,
  ky,
  angle,
  segs,
  w,
  curl,
}: {
  kx: number;
  ky: number;
  angle: number;
  segs: [number, number, number];
  w: number;
  curl: number;
}) {
  // drawn imperatively below — transforms chain per phalanx
  return (
    <g transform={`translate(${kx} ${ky}) rotate(${angle})`}>
      {/* knuckle head */}
      <circle r={w * 0.62} fill={BONE} />
      {/* proximal phalanx */}
      <g>
        <rect x={-w / 2} y={-segs[0]} width={w} height={segs[0] - 1.5} rx={w * 0.45} fill={BONE} />
        <rect x={w * 0.18} y={-segs[0] + 2} width={w * 0.32} height={segs[0] - 5} rx={w * 0.16} fill={BONE_SHADOW} opacity={0.35} />
        {/* middle phalanx — curled inward */}
        <g transform={`translate(0 ${-segs[0] + 1.5}) rotate(${-curl})`}>
          <circle r={w * 0.5} fill={BONE_DARK} />
          <rect x={-w * 0.42} y={-segs[1]} width={w * 0.84} height={segs[1] - 1.5} rx={w * 0.4} fill={BONE} />
          <rect x={w * 0.08} y={-segs[1] + 2} width={w * 0.26} height={segs[1] - 5} rx={w * 0.13} fill={BONE_SHADOW} opacity={0.32} />
          {/* distal phalanx — the claw tip, hooked */}
          <g transform={`translate(0 ${-segs[1] + 1.5}) rotate(${-curl * 1.9})`}>
            <circle r={w * 0.4} fill={BONE_DARK} />
            <path
              d={`M ${-w * 0.38} 0 C ${-w * 0.42} ${-segs[2] * 0.6} ${-w * 0.3} ${-segs[2] * 0.9} 0 ${-segs[2]}
                  C ${w * 0.3} ${-segs[2] * 0.9} ${w * 0.42} ${-segs[2] * 0.6} ${w * 0.38} 0
                  C ${w * 0.2} ${-segs[2] * 0.3} ${-w * 0.2} ${-segs[2] * 0.3} ${-w * 0.38} 0 Z`}
              fill={BONE}
            />
            {/* spade tuft */}
            <ellipse cy={-segs[2] + 1.2} rx={w * 0.34} ry={w * 0.24} fill={BONE_DARK} />
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * The summoning — a one-per-session loading rite. Smoke rolls across a dead
 * graveyard, the grave cracks, the dead man's hand bursts through in true
 * skeletal anatomy, the troupe's name flickers in like film, then dissolves
 * like a spirit. A synthesized score swells beneath it (first user gesture).
 */
export function LoadingScreen() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("scene");
  const [soundOn, setSoundOn] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<HauntAudio | null>(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /* ---- show once per session, then run the rite ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    document.body.style.overflow = "hidden";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe once-per-session gate: sessionStorage is only readable after mount
    setVisible(true);
    setPhase(reduce ? "title" : "scene");

    audio.current = new HauntAudio();
    setSoundOn(audio.current.start()); // begins now if policy allows, or arms on first gesture

    if (reduce) {
      at(200, () => setPhase("title"));
      at(1500, () => setPhase("vanish"));
      at(2100, () => setPhase("exit"));
    } else {
      at(650, () => setPhase("break"));
      at(700, () => audio.current?.toll()); // the bell answers the break
      at(1650, () => setPhase("title"));
      at(3300, () => setPhase("vanish"));
      at(4250, () => setPhase("exit"));
    }
    return clearTimers;
  }, [at, reduce]);

  /* ---- free the page once the overlay is gone ---- */
  useEffect(() => {
    if (phase === "exit") {
      audio.current?.stop();
      at(reduce ? 500 : 800, () => {
        document.body.style.overflow = "";
        setVisible(false);
      });
    }
  }, [phase, at, reduce]);

  const skip = useCallback(() => {
    clearTimers();
    setPhase("exit");
  }, []);

  const toggleSound = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (soundOn) {
      a.stop();
      setSoundOn(false);
    } else {
      setSoundOn(a.start());
    }
  }, [soundOn]);

  /* ---- skip on any key ---- */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, skip]);

  const broken = phase === "break" || phase === "title" || phase === "vanish" || phase === "exit";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          data-testid="loading-screen"
          onClick={skip}
          className="loader-stage fixed inset-0 z-[200] cursor-pointer overflow-hidden bg-void"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.045, filter: "blur(6px)" }}
          transition={{ duration: reduce ? 0.4 : 0.8, ease: [0.4, 0, 0.2, 1] }}
          role="status"
          aria-label="Summoning the Phantom Troupe"
        >
          {/* sky + moon glow */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#020105_0%,#0a0616_42%,#100a1c_68%,#050309_100%)]" />
          <div className="absolute left-1/2 top-[16%] h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(253,246,227,0.10),transparent_62%)] blur-md sm:h-80 sm:w-80" />

          {/* ambient haze drifting over everything, like the film intro */}
          <Smoke className="pointer-events-none absolute inset-0 h-full w-full" density={9} tint="rgba(148,138,188,0.07)" rise={0.06} speed={0.75} />

          {/* the scene — shakes when the grave breaks */}
          <div className={broken && !reduce ? "loader-shake absolute inset-0" : "absolute inset-0"}>
            {/* graveyard silhouettes */}
            <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="absolute bottom-[16%] left-0 h-[26%] w-full opacity-70">
              <path d="M0 240 L140 190 L280 235 L430 175 L580 225 L740 160 L900 220 L1060 170 L1220 225 L1360 185 L1440 230 L1440 300 L0 300 Z" fill="#0b0714" />
            </svg>
            <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute bottom-[13%] left-0 h-[22%] w-full" aria-hidden>
              <g fill="#0a0616">
                <path d="M120 260 V170 Q120 148 148 148 Q176 148 176 170 V260 Z" />
                <path d="M330 260 V186 Q330 172 348 172 Q366 172 366 186 V260 Z" />
                <path d="M1120 260 V178 L1160 178 L1160 194 L1136 194 L1136 260 Z" />
                <path d="M1290 260 V164 Q1290 142 1318 142 Q1346 142 1346 164 V260 Z" />
                {/* crooked cross */}
                <path d="M980 260 V120 L1002 120 L1002 150 L1030 150 L1030 172 L1002 172 L1002 260 Z" transform="rotate(4 1000 190)" />
              </g>
            </svg>
            {/* dead tree */}
            <svg viewBox="0 0 200 260" className="absolute bottom-[15%] left-[7%] w-28 opacity-90 sm:w-36" aria-hidden>
              <g fill="#070410">
                <path d="M96 260 L100 150 L74 108 L86 114 L102 142 L106 88 L112 142 L132 106 L142 112 L114 152 L108 260 Z" />
                <path d="M100 150 L48 118 L58 110 L104 138 M106 88 L152 52 L160 62 L112 96" />
              </g>
            </svg>

            {/* the rolling banks — Death-Eater style, curling up from the ground */}
            <Smoke
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] w-full"
              density={26}
              tint="rgba(172,162,205,0.12)"
              rise={0.55}
              speed={1.2}
              fromBottom
            />

            {/* flat fog keeps the ground planar */}
            <div className="fog-layer opacity-80" aria-hidden />

            {/* the grave that breaks */}
            <div className="absolute bottom-[24%] left-1/2 -translate-x-1/2">
              {/* spectre flash at the break */}
              {broken && !reduce && <div className="loader-flash" aria-hidden />}

              {/* mound halves — split apart once broken */}
              <div className={broken && !reduce ? "loader-mound-l" : ""}>
                <svg viewBox="0 0 90 44" className="h-9 w-20 sm:h-11 sm:w-24" aria-hidden>
                  <path d="M2 44 Q4 26 22 18 Q42 8 52 22 Q58 32 62 44 Z" fill="#120c1f" />
                </svg>
              </div>
              <div className={broken && !reduce ? "loader-mound-r" : ""}>
                <svg viewBox="0 0 90 44" className="absolute bottom-0 left-[calc(100%-58px)] h-9 w-20 sm:h-11 sm:w-24" aria-hidden>
                  <path d="M28 44 Q30 24 52 16 Q74 10 88 44 Z" fill="#120c1f" />
                </svg>
              </div>

              {/* crack lines — drawn the instant the hand claws through */}
              {broken && (
                <svg viewBox="0 0 200 60" className="absolute -bottom-1 left-1/2 h-12 w-48 -translate-x-1/2" aria-hidden>
                  <g stroke="#74f2a4" strokeWidth="2" fill="none" strokeLinecap="round" className="loader-crack">
                    <path d="M100 6 L88 24 L96 38 L80 54" />
                    <path d="M100 6 L114 20 L108 36 L124 52" />
                    <path d="M100 14 L82 10 M100 22 L120 12" opacity="0.6" />
                  </g>
                  <g stroke="#2a2036" strokeWidth="3" fill="none" strokeLinecap="round" className="loader-crack loader-crack-dark">
                    <path d="M40 56 L74 48 M132 50 L168 56 M10 58 L36 52" />
                  </g>
                </svg>
              )}

              {/* the dead man's hand — real bones, clawed, bursting through */}
              <div className={`absolute bottom-1 left-1/2 h-44 w-28 -translate-x-1/2 sm:h-52 sm:w-32 ${broken ? "loader-hand" : "loader-hand-wait"} hand-3d`}>
                <svg viewBox="0 0 140 200" className="h-full w-full loader-hand-glow" aria-hidden>
                  <g transform="rotate(-2 70 200)">
                    {/* radius + ulna — two true forearm bones with knobs */}
                    <path d="M57 200 C56 172 58 150 61 134 L58 132 C55 128 56 124 60 123 L70 122 C74 122 76 125 75 129 L72 132 C74 150 75 172 74 200 Z" fill={BONE} />
                    <path d="M80 200 C80 174 81 152 84 136 L81 133 C78 130 79 126 83 125 L92 124 C96 124 98 127 97 131 L94 134 C96 152 97 174 97 200 Z" fill={BONE_DARK} />
                    {/* interosseous shadow between the bones */}
                    <rect x="74" y="136" width="7" height="60" fill={BONE_SHADOW} opacity="0.25" />
                    {/* soil line where the arm exits the grave */}
                    <rect x="55" y="188" width="43" height="12" rx="5" fill="#1a1329" opacity="0.9" />
                    <ellipse cx="68" cy="124" rx="5.4" ry="3.6" fill={BONE} />
                    <ellipse cx="89" cy="126" rx="4.6" ry="3.2" fill={BONE_DARK} />

                    {/* carpal cluster — the pebbles of the wrist */}
                    <g fill={BONE}>
                      <ellipse cx="65" cy="115" rx="6.4" ry="5" />
                      <ellipse cx="76" cy="112" rx="6.8" ry="5.4" />
                      <ellipse cx="87" cy="115" rx="6" ry="4.8" />
                      <ellipse cx="71" cy="106" rx="5" ry="4" />
                      <ellipse cx="82" cy="105" rx="5.2" ry="4.2" />
                    </g>
                    <g fill={BONE_SHADOW} opacity="0.4">
                      <circle cx="68" cy="113" r="1.1" />
                      <circle cx="80" cy="110" r="1.2" />
                      <circle cx="85" cy="116" r="1" />
                    </g>

                    {/* metacarpals fanning to the knuckles */}
                    <g stroke={BONE} strokeWidth="5" strokeLinecap="round">
                      <line x1="66" y1="104" x2="55" y2="76" />
                      <line x1="74" y1="102" x2="70" y2="66" />
                      <line x1="82" y1="103" x2="85" y2="68" />
                      <line x1="89" y1="106" x2="98" y2="80" />
                    </g>
                    {/* thumb metacarpal, out to the side */}
                    <g stroke={BONE_DARK} strokeWidth="6" strokeLinecap="round">
                      <line x1="63" y1="107" x2="47" y2="94" />
                    </g>

                    {/* four clawed fingers */}
                    <ClawFinger kx={55} ky={76} angle={-10} segs={[20, 15, 12]} w={8} curl={14} />
                    <ClawFinger kx={70} ky={66} angle={-3} segs={[23, 18, 13]} w={9} curl={12} />
                    <ClawFinger kx={85} ky={68} angle={4} segs={[21, 16, 12]} w={9} curl={13} />
                    <ClawFinger kx={98} ky={80} angle={12} segs={[17, 13, 10]} w={7.5} curl={15} />

                    {/* the thumb — two phalanges, opposed */}
                    <g transform="translate(47 94) rotate(-58)">
                      <circle r={4.4} fill={BONE} />
                      <rect x={-3.8} y={-15} width={7.6} height={13.5} rx={3.4} fill={BONE} />
                      <g transform={`translate(0 -15) rotate(-18)`}>
                        <circle r={3.4} fill={BONE_DARK} />
                        <path d="M -3 0 C -3.4 -6.5 -2 -9 0 -9.5 C 2 -9 3.4 -6.5 3 0 C 1.4 -1.8 -1.4 -1.8 -3 0 Z" fill={BONE} />
                      </g>
                    </g>

                    {/* the stolen ring survived the burial */}
                    <rect x="51.5" y="86" width="8" height="4" rx="2" fill="#f79b2e" opacity="0.9" transform="rotate(-8 55 88)" />
                  </g>
                </svg>
              </div>

              {/* dirt burst */}
              {broken && !reduce && (
                <div className="pointer-events-none absolute bottom-2 left-1/2 h-0 w-0" aria-hidden>
                  {CLODS.map((c, i) => (
                    <span
                      key={i}
                      className="loader-clod"
                      style={{
                        left: c.left,
                        width: c.s,
                        height: c.s * 0.8,
                        animationDelay: `${c.d}ms`,
                        ["--dx"]: c["--dx"],
                        ["--dy"]: c["--dy"],
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ground shadow line */}
            <div className="absolute bottom-[22%] left-0 h-px w-full bg-gradient-to-r from-transparent via-spectre/20 to-transparent" />
          </div>

          {/* the name — fades in like a spirit, flickers like film, dissolves like smoke */}
          <div className="absolute inset-x-0 bottom-[13%] text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "title" || phase === "vanish" ? 0.85 : 0 }}
              transition={{ duration: 0.6 }}
              className="mb-3 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.6em] text-ash/80 sm:text-[11px]"
            >
              the graveyard is opening
            </motion.p>
            <h1
              className={`font-[family-name:var(--font-cinzel)] text-[13vw] font-black leading-[0.95] text-bone sm:text-6xl md:text-7xl ${phase === "title" && !reduce ? "loader-flicker" : ""} ${phase === "vanish" ? "spirit-ascend" : ""}`}
              aria-label="Phantom Troupe"
            >
              <span className="block">
                {Array.from(TITLE_A).map((ch, i) => (
                  <SpiritLetter key={i} ch={ch} phase={phase} delay={i * 0.05} reduce={!!reduce} />
                ))}
              </span>
              <span className="mt-1 block text-marigold">
                {Array.from(TITLE_B).map((ch, i) => (
                  <SpiritLetter key={i} ch={ch} phase={phase} delay={0.35 + i * 0.05} reduce={!!reduce} />
                ))}
              </span>
            </h1>
          </div>

          {/* score toggle — the music needs a gesture; this is its honest door */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            className="loader-sound absolute bottom-5 left-6 z-10 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.3em] text-ash transition-colors hover:text-marigold"
            aria-pressed={soundOn}
          >
            {soundOn ? "sound: on" : "sound: off"}
          </button>

          {/* skip hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "exit" ? 0 : 0.55 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-5 right-6 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.3em] text-ash"
          >
            click anywhere to pass on
          </motion.p>

          {/* film grain — the whole rite runs through old celluloid */}
          <div className="film-grain pointer-events-none absolute inset-0 z-10" aria-hidden />
          <div className="vignette pointer-events-none absolute inset-0 z-10" aria-hidden />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One letter of the troupe's name: materializes from mist, later sublimates. */
function SpiritLetter({
  ch,
  phase,
  delay,
  reduce,
}: {
  ch: string;
  phase: Phase;
  delay: number;
  reduce: boolean;
}) {
  const shown = phase === "title" || phase === "vanish";
  const gone = phase === "vanish" || phase === "exit";

  if (reduce) {
    return (
      <motion.span
        aria-hidden
        className="inline-block"
        initial={{ opacity: 0 }}
        animate={{ opacity: shown && !gone ? 1 : 0 }}
        transition={{ duration: 0.45, delay: shown && !gone ? delay * 0.5 : 0 }}
      >
        {ch === " " ? "\u00A0" : ch}
      </motion.span>
    );
  }

  return (
    <motion.span
      aria-hidden
      className="inline-block will-change-transform"
      initial={{ opacity: 0, y: 26, filter: "blur(14px)", scale: 1.12 }}
      animate={
        gone
          ? { opacity: 0, y: -34, filter: "blur(16px)", scale: 0.96, x: 8 }
          : shown
            ? { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, x: 0 }
            : {}
      }
      transition={
        gone
          ? { duration: 0.9, delay: delay * 0.4, ease: [0.4, 0, 0.6, 1] }
          : { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {ch === " " ? "\u00A0" : ch}
    </motion.span>
  );
}
