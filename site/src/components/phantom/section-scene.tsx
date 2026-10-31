"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Zombie } from "./zombie";
import { Spirits } from "./spirits";

/* ========================================================================== *
 * SECTION SCENES — animated spooky backdrops for every section below the hero.
 *
 * One component, seven worlds. Each scene is a fully staged diorama: a
 * perspective-tilted ground, mid-depth props, and far-depth sky — pure CSS 3D
 * with transform/opacity-only animation so potato machines stay at 60fps.
 * The stage pauses every animation when it scrolls out of view and honors
 * prefers-reduced-motion with static compositions.
 * ========================================================================== */

/* ------------------------------- shared bits ------------------------------ */

/** Drifting ground fog. Reuses the hero's fog engine, tinted per scene. */
function FogBank({ className }: { className?: string }) {
  return (
    <>
      <div className={`fog-layer ${className ?? ""}`} aria-hidden />
      <div className={`fog-layer fog-2 ${className ?? ""}`} aria-hidden />
    </>
  );
}

/** A bank of blurred clouds that crosses the whole stage, front of the moon. */
function CloudDrift({
  top,
  dur,
  delay,
  scale = 1,
  blur = 14,
  opacity = 0.85,
  from = "right",
}: {
  top: string;
  dur: number;
  delay: number;
  scale?: number;
  blur?: number;
  opacity?: number;
  from?: "right" | "left";
}) {
  return (
    <div
      className="ss-cloud"
      style={
        {
          top,
          ["--dur"]: `${dur}s`,
          ["--delay"]: `${delay}s`,
          ["--from"]: from === "right" ? "130%" : "-130%",
          ["--to"]: from === "right" ? "-130%" : "130%",
          ["--cs"]: scale,
          filter: `blur(${blur}px)`,
          opacity,
        } as CSSProperties
      }
      aria-hidden
    >
      <span className="ss-cloud-puff" style={{ left: "0%", width: 180, height: 54, top: 8 }} />
      <span className="ss-cloud-puff" style={{ left: "34%", width: 260, height: 70, top: 0 }} />
      <span className="ss-cloud-puff" style={{ left: "62%", width: 200, height: 58, top: 14 }} />
      <span className="ss-cloud-puff" style={{ left: "18%", width: 150, height: 44, top: 26 }} />
    </div>
  );
}

/** The hooded wraith — a specter that surfaces from nothing, drifts, dissolves. */
function Wraith({ left, bottom, size, dur, delay, tint = "bone" }: {
  left: string; bottom: string; size: number; dur: number; delay: number; tint?: "bone" | "violet";
}) {
  const gid = `ss-wraith-g-${left.replace(/[^a-z0-9]/gi, "")}${tint}`;
  return (
    <div
      className="ss-wraith"
      style={{ left, bottom, width: size, ["--dur"]: `${dur}s`, ["--delay"]: `${delay}s` } as CSSProperties}
      aria-hidden
    >
      <svg viewBox="0 0 140 200" className="h-auto w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            {tint === "violet" ? (
              <>
                <stop offset="0%" stopColor="rgba(178,158,226,0.6)" />
                <stop offset="60%" stopColor="rgba(150,128,210,0.28)" />
                <stop offset="100%" stopColor="rgba(150,128,210,0.02)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="rgba(233,225,210,0.62)" />
                <stop offset="60%" stopColor="rgba(233,225,210,0.26)" />
                <stop offset="100%" stopColor="rgba(233,225,210,0.02)" />
              </>
            )}
          </linearGradient>
        </defs>
        <path
          d="M70 12 C34 12 16 44 18 84 C19 108 26 122 22 140 C19 154 8 166 12 182 C24 172 34 176 40 188 C48 176 60 180 66 192 C74 180 86 178 94 190 C100 178 112 174 126 182 C124 164 114 154 112 140 C109 122 116 108 118 84 C122 44 106 12 70 12 Z"
          fill={`url(#${gid})`}
        />
        {/* hollow eyes + a wailing mouth */}
        <ellipse cx="54" cy="62" rx="7" ry="11" fill="#050309" opacity="0.9" />
        <ellipse cx="86" cy="62" rx="7" ry="11" fill="#050309" opacity="0.9" />
        <circle cx="56" cy="58" r="2" fill="#74f2a4" opacity="0.75" />
        <circle cx="88" cy="58" r="2" fill="#74f2a4" opacity="0.75" />
        <path d="M60 92 Q70 104 80 92 Q75 100 70 100 Q65 100 60 92 Z" fill="#050309" opacity="0.75" />
        {/* shroud tatters */}
        <path d="M28 120 q10 8 6 22 M46 132 q8 10 4 24 M96 128 q-8 12 -4 26 M112 116 q10 10 8 22"
          stroke="rgba(233,225,210,0.3)" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

/** A small ghost that phases across the moon's face. */
function MoonGhost({ top, dur, delay, size = 64 }: { top: string; dur: number; delay: number; size?: number }) {
  return (
    <div
      className="ss-moon-ghost"
      style={{ top, width: size, ["--dur"]: `${dur}s`, ["--delay"]: `${delay}s` } as CSSProperties}
      aria-hidden
    >
      <svg viewBox="0 0 120 140" className="h-auto w-full">
        <defs>
          <linearGradient id="ss-moon-ghost-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(233,225,210,0.85)" />
            <stop offset="65%" stopColor="rgba(233,225,210,0.4)" />
            <stop offset="100%" stopColor="rgba(233,225,210,0.03)" />
          </linearGradient>
        </defs>
        <path d="M60 8 C26 8 8 38 10 74 C11 96 18 108 14 122 C22 114 30 118 34 128 C40 118 50 122 56 132 C62 122 72 120 78 130 C84 120 94 116 104 124 C100 110 94 100 94 84 C96 44 88 8 60 8 Z" fill="url(#ss-moon-ghost-body)" />
        <ellipse cx="44" cy="52" rx="5.5" ry="9" fill="#050309" opacity="0.8" />
        <ellipse cx="76" cy="52" rx="5.5" ry="9" fill="#050309" opacity="0.8" />
        <path d="M50 76 Q60 86 70 76" stroke="#050309" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
      </svg>
    </div>
  );
}

/* --------------------- 1 · TROUPE — the dead breaks ground -------------------- */

/** Zombie bust clawing out of a cracked grave, dirt spraying, looped eternally. */
function ZombieGroundScene() {
  const CLODS = [
    { left: "46%", dx: -66, dy: -120, s: 1.15, d: 0 },
    { left: "50%", dx: 58, dy: -138, s: 0.9, d: 0.04 },
    { left: "48%", dx: -18, dy: -152, s: 1.3, d: 0.02 },
    { left: "52%", dx: 24, dy: -108, s: 0.8, d: 0.06 },
    { left: "44%", dx: -92, dy: -88, s: 0.7, d: 0.09 },
    { left: "54%", dx: 84, dy: -96, s: 1, d: 0.05 },
    { left: "47%", dx: -44, dy: -140, s: 0.65, d: 0.12 },
    { left: "51%", dx: 12, dy: -160, s: 0.55, d: 0.1 },
    { left: "49%", dx: 96, dy: -66, s: 0.85, d: 0.14 },
    { left: "45%", dx: -108, dy: -52, s: 0.6, d: 0.11 },
  ];
  return (
    <>
      {/* deep-violet floor glow, seats the diorama */}
      <div className="ss-ground-glow" aria-hidden />

      {/* perspective ground plane */}
      <div className="ss-ground" aria-hidden>
        <div className="ss-ground-rows" />
      </div>

      {/* the eruption stage */}
      <div className="ss-erupt-stage" aria-hidden>
        {/* pit — an ellipse receding into the earth (rotateX reads as 3D depth) */}
        <div className="ss-pit" />

        {/* crack lines draw themselves before the burst */}
        <svg viewBox="0 0 220 70" className="ss-cracks" aria-hidden>
          <g className="ss-crack-path" stroke="#3d2f58" strokeWidth="2.6" fill="none" strokeLinecap="round">
            <path d="M8 44 L38 36 L64 44 L92 30 L118 42 L150 32 L178 44 L212 36" />
            <path d="M64 44 L72 58 M118 42 L110 60 M150 32 L158 18" />
          </g>
          <g className="ss-crack-path ss-crack-late" stroke="#241b33" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M20 52 L52 48 L80 54 M132 52 L166 48 L196 54" />
          </g>
        </svg>

        {/* dirt mound — splits apart as the corpse claws through */}
        <svg viewBox="0 0 120 46" className="ss-mound ss-mound-l" aria-hidden>
          <path d="M118 46 Q70 40 34 26 Q12 16 0 6 L0 46 Z" fill="#120c1f" />
          <path d="M34 26 q-4 -9 -12 -12 M52 32 q-2 -8 -8 -11" stroke="#1d1530" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 120 46" className="ss-mound ss-mound-r" aria-hidden>
          <path d="M2 46 Q50 40 86 26 Q108 16 120 6 L120 46 Z" fill="#120c1f" />
          <path d="M86 26 q4 -9 12 -12 M68 32 q2 -8 8 -11" stroke="#1d1530" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </svg>

        {/* the grave's own breath — a violet burst that lights the corpse at rise */}
        <div className="ss-burst-glow" aria-hidden />

        {/* the corpse itself — a bust, legs still buried */}
        <div className="ss-corpse">
          <div className="ss-corpse-sway">
            <svg viewBox="0 0 170 190" className="h-auto w-full">
              <defs>
                <filter id="ss-z-eye" x="-140%" y="-140%" width="380%" height="380%">
                  <feGaussianBlur stdDeviation="2.4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g fill="#0b0716">
                {/* torso bursting up, hunched left */}
                <path d="M62 190 C56 150 58 118 74 96 L108 92 C126 110 132 146 128 190 Z" />
                {/* torn ribs catching moonlight */}
                <path d="M78 116 q14 -6 26 -2 M76 132 q14 -6 28 -2 M78 148 q13 -5 26 -2"
                  stroke="#3a2d58" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* back arm braced on the grave edge */}
                <g className="zombie-arm-back" style={{ transformOrigin: "78% 20%" }}>
                  <path d="M72 104 C58 96 46 86 40 72 L48 66 C56 78 66 88 78 96 Z" />
                  <path d="M40 70 l10 -8 5 7 -10 8 z" />
                </g>
                {/* head — craned back, jaw hanging */}
                <g className="zombie-head">
                  <path d="M96 18 C112 14 124 22 126 36 C128 48 120 58 106 60 C92 62 82 54 82 42 C82 28 86 20 96 18 Z" />
                  {/* hanging jaw */}
                  <path d="M92 56 L108 58 L106 70 L92 68 Z" />
                  <path d="M90 22 l-6 -9 M98 19 l-3 -10 M106 19 l1 -10" stroke="#0b0716" strokeWidth="2.6" strokeLinecap="round" />
                  <circle className="zombie-eye" cx="116" cy="36" r="3" fill="#74f2a4" filter="url(#ss-z-eye)" />
                  <circle cx="103" cy="40" r="1.8" fill="#74f2a4" opacity="0.55" />
                </g>
                {/* front arm — clawing at the world above */}
                <g className="zombie-arm-front" style={{ transformOrigin: "18% 84%" }}>
                  <path d="M106 98 C118 84 128 66 132 44 L142 46 C140 70 130 92 116 106 Z" />
                  {/* grasping fingers */}
                  <path d="M130 46 l2 -12 5 3 0 -11 5 4 2 -10 4 7 -6 22 z" />
                </g>
              </g>
              {/* moonlit rim — the graveyard's only kindness */}
              <g stroke="rgba(233,225,210,0.35)" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M96 18 C112 14 124 22 126 36" />
                <path d="M74 96 L108 92" opacity="0.65" />
                <path d="M108 92 C126 110 132 146 128 190" opacity="0.5" />
                <path d="M142 46 C140 70 130 92 116 106" opacity="0.55" />
              </g>
            </svg>
          </div>
        </div>

        {/* dirt clods flung out by the burst — synced to the same cycle */}
        <div className="ss-clods" aria-hidden>
          {CLODS.map((c, i) => (
            <span
              key={i}
              className="ss-clod"
              style={
                {
                  left: c.left,
                  ["--dx"]: `${c.dx}px`,
                  ["--dy"]: `${c.dy}px`,
                  ["--s"]: c.s,
                  ["--d"]: `${c.d}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* dust puff at the moment of breaking */}
        <div className="ss-dust" aria-hidden />
        <div className="ss-dust ss-dust-2" aria-hidden />
      </div>

      {/* two grave wisps rising nearby */}
      <span className="ss-grave-wisp" style={{ left: "72%", animationDelay: "3s" }} aria-hidden />
      <span className="ss-grave-wisp" style={{ left: "12%", animationDelay: "11s" }} aria-hidden />

      <FogBank className="opacity-70" />
    </>
  );
}

/* ------------------ 2 · SÉANCE — bats pour out of the house ------------------ */

function HouseScene() {
  const BATS = [
    { dur: 15, delay: 0.6, size: 30, top: "93%", amp: "-30px" },
    { dur: 15, delay: 2.4, size: 22, top: "95%", amp: "-22px" },
    { dur: 15, delay: 4.1, size: 26, top: "94%", amp: "-26px" },
    { dur: 15, delay: 6.2, size: 19, top: "97%", amp: "-18px" },
    { dur: 15, delay: 8.3, size: 33, top: "93.5%", amp: "-28px" },
    { dur: 15, delay: 10.6, size: 24, top: "96%", amp: "-20px" },
  ];
  return (
    <>
      {/* hill the house sits on */}
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="ss-hill" aria-hidden>
        <path d="M0 160 L0 108 Q240 66 520 84 Q860 104 1120 78 Q1300 62 1440 92 L1440 160 Z" fill="#0a0614" />
      </svg>

      {/* warm leakage the house throws into the night */}
      <div className="ss-house-glow" aria-hidden />

      {/* the haunted house — crooked, lit, waiting */}
      <div className="ss-house" aria-hidden>
        <div className="ss-house-shiver">
          <svg viewBox="0 0 320 300" className="h-auto w-full">
            <defs>
              <linearGradient id="ss-house-win" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,210,122,0.95)" />
                <stop offset="100%" stopColor="rgba(255,109,31,0.55)" />
              </linearGradient>
            </defs>
            <g fill="#0b0714">
              {/* main body */}
              <path d="M40 300 V150 L160 78 L280 150 V300 Z" />
              {/* crooked tower */}
              <path d="M226 300 V96 L262 70 L298 96 V300 Z" />
              <path d="M222 100 L262 44 L302 100 L294 100 L262 62 L230 100 Z" />
              {/* roof crest + eaves */}
              <path d="M28 158 L160 68 L292 158 L284 162 L160 80 L36 162 Z" />
              {/* chimneys */}
              <path d="M84 128 h18 v-34 h-18 z M240 84 h16 v-28 h-16 z" />
            </g>
            {/* lit windows — the flicker carries the whole scene */}
            <g>
              <rect className="ss-window" x="70" y="180" width="26" height="34" rx="3" fill="url(#ss-house-win)" />
              <rect className="ss-window" x="124" y="180" width="26" height="34" rx="3" fill="url(#ss-house-win)" style={{ animationDelay: "-1.8s" }} />
              <rect className="ss-window" x="97" y="232" width="26" height="30" rx="3" fill="url(#ss-house-win)" style={{ animationDelay: "-3.1s" }} />
              <rect className="ss-window" x="246" y="130" width="24" height="30" rx="3" fill="url(#ss-house-win)" style={{ animationDelay: "-2.4s" }} />
              {/* mullions */}
              <g stroke="#0b0714" strokeWidth="3">
                <path d="M83 180 v34 M70 197 h26 M137 180 v34 M124 197 h26 M110 232 v30 M97 247 h26 M258 130 v30 M246 145 h24" />
              </g>
            </g>
            {/* the door, ajar with cold light spilling out */}
            <path d="M176 300 V244 Q190 232 204 244 V300 Z" fill="#241a3e" />
            <path d="M180 300 V247 Q190 238 200 247 V300 Z" fill="rgba(116,242,164,0.35)" />
            <path d="M204 244 L232 236 L232 300 L204 300 Z" fill="rgba(116,242,164,0.10)" />
            {/* attic vent — bats roost here */}
            <path d="M148 128 Q160 118 172 128 L172 142 L148 142 Z" fill="#050309" stroke="#1d1530" strokeWidth="2" />
            {/* moonrim on the roof edges */}
            <g stroke="rgba(233,225,210,0.24)" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M30 156 L160 70 L290 156" />
              <path d="M226 98 L262 48 L298 98" opacity="0.8" />
              <path d="M280 150 V296" opacity="0.45" />
            </g>
          </svg>
        </div>
      </div>

      {/* bats boil out of the attic vent and stream up-left */}
      <div className="ss-bat-out-stage" aria-hidden>
        {BATS.map((b, i) => (
          <div
            key={i}
            className="ss-bat-out"
            style={{ top: b.top, ["--dur"]: `${b.dur}s`, ["--delay"]: `${b.delay}s` } as CSSProperties}
          >
            <div className="ss-bat-out-wave" style={{ ["--amp"]: b.amp } as CSSProperties}>
              <div className="bat-flap" style={{ width: b.size, ["--flap"]: `${0.36 + i * 0.04}s` } as CSSProperties}>
                <svg viewBox="0 0 64 28" className="h-auto w-full">
                  <g fill="#0a0614">
                    <path d="M30 14 C24 6 14 2 4 6 C10 8 12 12 10 16 C16 14 20 15 22 18 C24 16 27 15 30 16 Z" />
                    <path d="M34 14 C40 6 50 2 60 6 C54 8 52 12 54 16 C48 14 44 15 42 18 C40 16 37 15 34 16 Z" />
                    <ellipse cx="32" cy="15" rx="4.6" ry="7" />
                    <path d="M28 9 L27 3 L31 7 Z M36 9 L37 3 L33 7 Z" />
                  </g>
                  <circle cx="30.4" cy="12.6" r="0.8" fill="#74f2a4" opacity="0.85" />
                  <circle cx="33.6" cy="12.6" r="0.8" fill="#74f2a4" opacity="0.85" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* a wraith drifting past the fence */}
      <Wraith left="8%" bottom="4%" size={72} dur={26} delay={4} tint="violet" />

      {/* dead trees flanking */}
      <svg viewBox="0 0 200 260" className="ss-tree" style={{ left: "3%" }} aria-hidden>
        <g fill="#070410">
          <path d="M96 260 L100 150 L74 108 L86 114 L102 142 L106 88 L112 142 L132 106 L142 112 L114 152 L108 260 Z" />
          <path d="M100 150 L48 118 L58 110 L104 138 M106 88 L152 52 L160 62 L112 96 M112 142 L166 170 L160 180 L110 156" />
        </g>
      </svg>
      <svg viewBox="0 0 200 260" className="ss-tree" style={{ left: "88%" }} aria-hidden>
        <g fill="#070410" transform="scale(-1,1) translate(-200,0)">
          <path d="M96 260 L100 150 L74 108 L86 114 L102 142 L106 88 L112 142 L132 106 L142 112 L114 152 L108 260 Z" />
          <path d="M100 150 L48 118 L58 110 L104 138 M106 88 L152 52 L160 62 L112 96 M112 142 L166 170 L160 180 L110 156" />
        </g>
      </svg>

      <FogBank className="opacity-60" />
    </>
  );
}

/* --------------- 3 · DOWNLOAD — moon devoured by clouds + ghost --------------- */

function MoonCloudScene() {
  const STARS = [
    { left: "12%", top: "16%", s: 1.6, d: 0 }, { left: "22%", top: "8%", s: 1.1, d: 1.4 },
    { left: "34%", top: "20%", s: 1.3, d: 2.8 }, { left: "47%", top: "10%", s: 1, d: 0.7 },
    { left: "58%", top: "24%", s: 1.7, d: 3.6 }, { left: "66%", top: "7%", s: 1.2, d: 2.1 },
    { left: "78%", top: "18%", s: 1.4, d: 4.4 }, { left: "88%", top: "11%", s: 1, d: 1.1 },
    { left: "94%", top: "26%", s: 1.5, d: 3.2 }, { left: "6%", top: "30%", s: 1, d: 2.5 },
    { left: "41%", top: "32%", s: 0.9, d: 4 }, { left: "72%", top: "33%", s: 1.1, d: 0.4 },
  ];
  return (
    <>
      {/* deep-sky wash */}
      <div className="ss-night-wash" aria-hidden />

      {/* stars */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="ss-star"
          style={{ left: s.left, top: s.top, width: s.s * 2, height: s.s * 2, animationDelay: `${s.d}s` } as CSSProperties}
          aria-hidden
        />
      ))}

      {/* the moon — big, close, waiting to be devoured */}
      <div className="ss-moon" aria-hidden>
        <span className="absolute left-[22%] top-[30%] h-[14%] w-[14%] rounded-full bg-[rgba(146,127,94,0.42)]" />
        <span className="absolute left-[56%] top-[22%] h-[9%] w-[9%] rounded-full bg-[rgba(146,127,94,0.36)]" />
        <span className="absolute left-[46%] top-[56%] h-[18%] w-[18%] rounded-full bg-[rgba(146,127,94,0.3)]" />
        <span className="absolute left-[26%] top-[62%] h-[8%] w-[8%] rounded-full bg-[rgba(146,127,94,0.34)]" />
        <span className="absolute left-[64%] top-[46%] h-[7%] w-[7%] rounded-full bg-[rgba(146,127,94,0.3)]" />
      </div>
      <div className="ss-moon-halo" aria-hidden />

      {/* clouds at three depths, slowly devouring it */}
      <CloudDrift top="14%" dur={38} delay={-6} scale={1.15} blur={10} opacity={0.9} />
      <CloudDrift top="22%" dur={52} delay={-26} scale={0.85} blur={18} opacity={0.65} from="left" />
      <CloudDrift top="6%" dur={64} delay={-44} scale={0.7} blur={22} opacity={0.45} />

      {/* the ghost that haunts the moonlight */}
      <MoonGhost top="34%" dur={31} delay={-9} size={58} />
      <MoonGhost top="24%" dur={43} delay={-31} size={34} />

      {/* low ground fog */}
      <div className="ss-floor-fog" aria-hidden />
      <FogBank className="opacity-50" />
    </>
  );
}

/* ------------------- 4 · ARCHITECTURE — spirits roam the field ------------------- */

function SpiritsRoamScene() {
  return (
    <>
      {/* grave row silhouette the spirits rise from */}
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="ss-stone-row" aria-hidden>
        <g fill="#0a0616">
          <path d="M120 120 V64 Q120 46 138 46 Q156 46 156 64 V120 Z" />
          <path d="M330 120 V74 L362 74 L362 86 L346 86 L346 120 Z" />
          <path d="M560 120 V58 Q560 40 576 40 Q592 40 592 58 V120 Z" />
          <path d="M820 120 V70 L848 70 L848 82 L834 82 L834 120 Z" />
          <path d="M1050 120 V52 Q1050 34 1066 34 Q1082 34 1082 52 V120 Z" />
          <path d="M1290 120 V66 Q1290 50 1305 50 Q1320 50 1320 66 V120 Z" />
        </g>
        {/* mounds */}
        <g fill="#0b0716">
          <path d="M170 120 Q200 104 236 120 Z" />
          <path d="M610 120 Q640 106 674 120 Z" />
          <path d="M1100 120 Q1130 106 1166 120 Z" />
        </g>
      </svg>

      {/* the roaming dead-light canvas — pauses off-screen by itself */}
      <Spirits className="absolute inset-0 h-full w-full" count={7} graveSpawn={0.55} />

      {/* one candle keeping watch */}
      <div className="ss-candle" aria-hidden>
        <div className="gy-candle-glow" style={{ left: -26, top: -40, width: 60, height: 60 }} />
        <div className="gy-candle h-10" />
        <div className="candle-flicker absolute left-1/2 top-0 h-3.5 w-1.5 -translate-x-1/2 -translate-y-full rounded-full"
          style={{ background: "linear-gradient(180deg,#fff3c4 0%,#ffb347 60%,#ff6d1f 100%)" }} />
      </div>

      <FogBank className="opacity-60" />
    </>
  );
}

/* ---------------------- 5 · GRIMOIRE — ghosts walk the rows ---------------------- */

function GhostHauntScene() {
  const EMBERS = [
    { left: "14%", d: 0, s: 1 }, { left: "30%", d: 2.2, s: 0.8 }, { left: "47%", d: 4.1, s: 1.2 },
    { left: "63%", d: 1.3, s: 0.9 }, { left: "78%", d: 3.4, s: 1.1 }, { left: "90%", d: 5.2, s: 0.7 },
  ];
  return (
    <>
      <Wraith left="6%" bottom="20%" size={88} dur={27} delay={0} />
      <Wraith left="82%" bottom="26%" size={64} dur={27} delay={9} tint="violet" />
      <Wraith left="42%" bottom="14%" size={52} dur={27} delay={17} />

      {/* candle row — the scribes' light */}
      {[
        { left: "18%" }, { left: "70%" }, { left: "88%" },
      ].map((c, i) => (
        <div key={i} className="ss-candle" style={{ left: c.left }} aria-hidden>
          <div className="gy-candle-glow" style={{ left: -22, top: -36, width: 52, height: 52 }} />
          <div className="gy-candle h-8" />
          <div className="candle-flicker absolute left-1/2 top-0 h-3 w-1.5 -translate-x-1/2 -translate-y-full rounded-full"
            style={{ background: "linear-gradient(180deg,#fff3c4 0%,#ffb347 60%,#ff6d1f 100%)", animationDelay: `${-i * 1.1}s` }} />
        </div>
      ))}

      {/* rising embers */}
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="ss-ember"
          style={{ left: e.left, ["--s"]: e.s, animationDelay: `${e.d}s` } as CSSProperties}
          aria-hidden
        />
      ))}

      <FogBank className="opacity-55" />
    </>
  );
}

/* ---------------------- 6 · RESEARCH — the dead walk outside ---------------------- */

function NightWalkScene() {
  return (
    <>
      {/* road the zombie walks */}
      <div className="ss-road" aria-hidden />

      {/* lamppost with a guttering halo */}
      <div className="ss-lamp" aria-hidden>
        <div className="ss-lamp-halo candle-flicker" />
        <svg viewBox="0 0 60 220" className="relative h-auto w-full">
          <g fill="#0b0714">
            <rect x="26" y="34" width="8" height="186" />
            <path d="M14 34 L30 6 L46 34 Z" />
            <path d="M20 34 h20 v10 h-20 z" fill="#241a3e" />
            <circle cx="30" cy="39" r="4.5" fill="#ffd27a" opacity="0.95" />
            <rect x="18" y="218" width="24" height="6" rx="2" />
          </g>
        </svg>
      </div>

      {/* violet wash so the shambler reads against the dark */}
      <div className="ss-walk-glow" aria-hidden />

      {/* the shambler crosses behind the copy */}
      <div className="absolute inset-x-0 bottom-0 h-[34%]" aria-hidden>
        <Zombie size={96} bottom="10%" delay={4} className="opacity-80" />
      </div>

      {/* fence he ignores */}
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="ss-walk-fence" aria-hidden>
        <g stroke="#0a0616" strokeWidth="6">
          {Array.from({ length: 25 }).map((_, i) => {
            const x = 18 + i * 60;
            return <line key={i} x1={x} y1="18" x2={x} y2="88" />;
          })}
        </g>
        <line x1="0" y1="34" x2="1440" y2="34" stroke="#0a0616" strokeWidth="5" />
        <line x1="0" y1="66" x2="1440" y2="66" stroke="#0a0616" strokeWidth="5" />
      </svg>

      <Wraith left="72%" bottom="22%" size={58} dur={31} delay={12} />
      <FogBank className="opacity-60" />
    </>
  );
}

/* ----------------------------- 7 · FAQ — the storm ----------------------------- */

function StormScene() {
  return (
    <>
      {/* storm wash — cold blue */}
      <div className="ss-storm-wash" aria-hidden />

      {/* hill + dead tree silhouettes the lightning reveals */}
      <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="ss-storm-hill" aria-hidden>
        <path d="M0 180 L0 120 Q300 70 640 96 Q980 122 1240 84 Q1360 68 1440 96 L1440 180 Z" fill="#080512" />
      </svg>
      <svg viewBox="0 0 200 260" className="ss-storm-tree" aria-hidden>
        <g fill="#070410">
          <path d="M96 260 L100 150 L74 108 L86 114 L102 142 L106 88 L112 142 L132 106 L142 112 L114 152 L108 260 Z" />
          <path d="M100 150 L48 118 L58 110 L104 138 M106 88 L152 52 L160 62 L112 96 M112 142 L166 170 L160 180 L110 156" />
        </g>
      </svg>

      {/* the flash — two strobes then long dark, 19s cycle */}
      <div className="ss-lightning" aria-hidden />

      {/* bats spooked by the flash */}
      <div className="ss-bat-out-stage" aria-hidden>
        {[
          { dur: 19, delay: 5.2, size: 26, top: "30%", amp: "-40px" },
          { dur: 19, delay: 12.8, size: 20, top: "38%", amp: "-56px" },
        ].map((b, i) => (
          <div key={i} className="ss-bat-out ss-bat-out-wide" style={{ top: b.top, ["--dur"]: `${b.dur}s`, ["--delay"]: `${b.delay}s` } as CSSProperties}>
            <div className="ss-bat-out-wave" style={{ ["--amp"]: b.amp } as CSSProperties}>
              <div className="bat-flap" style={{ width: b.size, ["--flap"]: `${0.4 + i * 0.05}s` } as CSSProperties}>
                <svg viewBox="0 0 64 28" className="h-auto w-full">
                  <g fill="#0a0614">
                    <path d="M30 14 C24 6 14 2 4 6 C10 8 12 12 10 16 C16 14 20 15 22 18 C24 16 27 15 30 16 Z" />
                    <path d="M34 14 C40 6 50 2 60 6 C54 8 52 12 54 16 C48 14 44 15 42 18 C40 16 37 15 34 16 Z" />
                    <ellipse cx="32" cy="15" rx="4.6" ry="7" />
                    <path d="M28 9 L27 3 L31 7 Z M36 9 L37 3 L33 7 Z" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* one distant wraith between flashes */}
      <Wraith left="24%" bottom="16%" size={54} dur={33} delay={7} tint="violet" />

      <FogBank className="opacity-75" />
    </>
  );
}

/* ------------------------------- scene registry ------------------------------- */

const SCENES: Record<string, ReactNode> = {
  troupe: <ZombieGroundScene />,
  seance: <HouseScene />,
  download: <MoonCloudScene />,
  architecture: <SpiritsRoamScene />,
  grimoire: <GhostHauntScene />,
  research: <NightWalkScene />,
  faq: <StormScene />,
};

export type SceneVariant = keyof typeof SCENES;

/* ------------------------------- the stage ------------------------------- */

/**
 * Full-bleed animated backdrop for a section. Renders the scene behind
 * `children`, pauses all animation while off-screen (data-on), and gives
 * each section its own mood gradient via .sc-<variant>.
 */
export function SceneStage({
  variant,
  children,
  className,
}: {
  variant: keyof typeof SCENES;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        el.setAttribute("data-on", entry.isIntersecting ? "1" : "0");
      },
      { rootMargin: "160px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-on="1" className={`relative overflow-hidden ${className ?? ""}`}>
      <div className={`scene-stage sc-${variant}`} aria-hidden>
        {SCENES[variant]}
      </div>
      {children}
    </div>
  );
}

/** Loose bits for bespoke spots (marquee, footer). */
export { FogBank, CloudDrift, Wraith, MoonGhost };
