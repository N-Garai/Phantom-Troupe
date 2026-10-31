import type { CSSProperties } from "react";

type Shape = "round" | "cross" | "slab" | "broken";

type Stone = {
  left: string;
  bottom: string;
  w: number;
  h: number;
  d: number;
  tilt: number;
  shape: Shape;
  engrave?: boolean;
};

/* Hand-plotted grave row — spacing tuned so stones never crowd the copy. */
const STONES: Stone[] = [
  { left: "4%", bottom: "7%", w: 76, h: 98, d: 20, tilt: -2, shape: "round", engrave: true },
  { left: "16%", bottom: "6.2%", w: 54, h: 62, d: 16, tilt: 3, shape: "broken" },
  { left: "28%", bottom: "7.6%", w: 90, h: 112, d: 22, tilt: 1.5, shape: "cross" },
  { left: "46.5%", bottom: "6.4%", w: 66, h: 80, d: 18, tilt: -1, shape: "slab", engrave: true },
  { left: "59%", bottom: "7.8%", w: 98, h: 120, d: 24, tilt: 2, shape: "round", engrave: true },
  { left: "75%", bottom: "6.2%", w: 58, h: 68, d: 16, tilt: -3, shape: "broken" },
  { left: "86%", bottom: "7.4%", w: 84, h: 106, d: 20, tilt: 2, shape: "cross" },
];

const MOUNDS: Array<{ left: string; bottom: string; w: number; h: number }> = [
  { left: "10.5%", bottom: "5.6%", w: 120, h: 34 },
  { left: "55%", bottom: "5.8%", w: 140, h: 38 },
  { left: "80%", bottom: "5.4%", w: 110, h: 30 },
];

const CANDLES: Array<{ left: string; bottom: string }> = [
  { left: "9.2%", bottom: "7.2%" },
  { left: "63.5%", bottom: "7.6%" },
  { left: "84.5%", bottom: "6.8%" },
];

const FACE_CLASS: Record<Shape, string> = {
  round: "gy-face-rounded",
  cross: "gy-face-rounded",
  slab: "gy-face-slab",
  broken: "gy-face-broken",
};

/** Skeletal engraving on a stone face (font-independent, pure paths). */
function Engraving({ shape }: { shape: Shape }) {
  if (shape === "cross") return null;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMin meet" className="absolute inset-0 h-full w-full opacity-45">
      <g stroke="#4a3f66" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M34 34 H66 M50 20 V52" strokeWidth="4" />
        <path d="M32 64 h36 M32 72 h28 M32 80 h33" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

function Stone3D({ s }: { s: Stone }) {
  const style = {
    left: s.left,
    bottom: s.bottom,
    width: s.w,
    height: s.h,
    ["--d"]: `${s.d}px`,
    ["--tilt"]: `${s.tilt}deg`,
  } as CSSProperties;

  const isCross = s.shape === "cross";

  return (
    <div className="gy-stone" style={style}>
      {/* top cap */}
      <div className={isCross ? "gy-top" : "gy-top gy-face-rounded"} style={isCross ? undefined : { borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />
      {/* right extrusion */}
      <div className="gy-side" />
      {/* front face */}
      <div className={`gy-face ${FACE_CLASS[s.shape]}`}>
        {isCross ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {/* cross carved as negative space glow */}
            <path d="M42 8 h16 v22 h22 v16 h-22 v46 h-16 v-46 h-22 v-16 h22 z" fill="#060310" />
            <path d="M42 8 h16 v22 h22 v16 h-22 v46 h-16 v-46 h-22 v-16 h22 z" fill="none" stroke="rgba(116,242,164,0.14)" strokeWidth="1.5" />
          </svg>
        ) : (
          <Engraving shape={s.shape} />
        )}
        {/* moss + crack texture */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-60">
          <path d="M0 100 L0 82 Q14 88 22 100 Z" fill="#0d1524" opacity="0.7" />
          <path d="M78 100 Q88 84 100 80 L100 100 Z" fill="#101a2c" opacity="0.55" />
          <path d="M30 12 q6 10 -2 22 M66 30 q-8 8 -3 20" stroke="#060310" strokeWidth="1.6" fill="none" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}

function Mound({ left, bottom, w, h }: { left: string; bottom: string; w: number; h: number }) {
  return (
    <svg
      viewBox="0 0 140 40"
      preserveAspectRatio="none"
      className="absolute"
      style={{ left, bottom, width: w, height: h } as CSSProperties}
      aria-hidden
    >
      <path d="M2 40 Q6 22 32 14 Q70 2 108 14 Q134 22 138 40 Z" fill="#0b0716" />
      <path d="M2 40 Q6 22 32 14" fill="none" stroke="#171028" strokeWidth="2" />
      <g stroke="#131022" strokeWidth="2.4" strokeLinecap="round">
        <path d="M30 16 q-2 -7 -6 -9 M36 15 q1 -7 5 -9 M100 13 q-2 -6 -5 -8 M108 14 q2 -6 6 -7" />
      </g>
    </svg>
  );
}

function Candle({ left, bottom }: { left: string; bottom: string }) {
  return (
    <div className="absolute" style={{ left, bottom } as CSSProperties} aria-hidden>
      <div className="gy-candle-glow" style={{ left: -22, top: -34, width: 52, height: 52 }} />
      <div className="gy-candle h-9" />
      <div
        className="candle-flicker absolute left-1/2 top-0 h-3 w-1.5 -translate-x-1/2 -translate-y-full rounded-full"
        style={{ background: "linear-gradient(180deg,#fff3c4 0%,#ffb347 60%,#ff6d1f 100%)" }}
      />
    </div>
  );
}

/** A jack-o'-lantern left on a grave — carved face lit from inside. */
function JackOLantern({ left, bottom, size = 46 }: { left: string; bottom: string; size?: number }) {
  return (
    <div className="absolute" style={{ left, bottom, width: size } as CSSProperties} aria-hidden>
      <div
        className="pumpkin-glow absolute -inset-8 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(247,155,46,0.28), transparent 68%)" }}
      />
      <svg viewBox="0 0 60 52" className="relative w-full">
        {/* stem */}
        <path d="M28 8 q2 -6 6 -7 q-1 4 0 8 Z" fill="#1c1426" />
        {/* three-lobed body */}
        <g fill="#241531">
          <ellipse cx="17" cy="32" rx="13" ry="17" />
          <ellipse cx="30" cy="30" rx="15" ry="19" />
          <ellipse cx="44" cy="32" rx="13" ry="17" />
        </g>
        <g fill="#311d3f">
          <ellipse cx="23" cy="31" rx="11" ry="16.5" />
          <ellipse cx="37" cy="31" rx="11" ry="16.5" />
          <ellipse cx="30" cy="30" rx="10" ry="17.5" />
        </g>
        {/* the candle inside — warm inner light */}
        <g className="pumpkin-glow">
          <path d="M17 25 l7 -7 v7 Z M43 25 l-7 -7 v7 Z" fill="none" />
          <path d="M19 26 l6 -6 v6 Z" fill="#ffd27a" />
          <path d="M41 26 l-6 -6 v6 Z" fill="#ffd27a" />
          <path d="M21 38 l4 -5 l4 5 l5 -5 l4 5 l-2 6 l-18 0 Z" fill="#ffd27a" transform="translate(0 -1)" />
          <path d="M22 38 l3.4 -4.4 M38 38 l-3.4 -4.4" stroke="#ff9b3d" strokeWidth="1.6" />
        </g>
      </svg>
    </div>
  );
}

/** Back row: hills, mausoleum with a lit door, gnarled dead trees, distant stones. */
function BackRow() {
  return (
    <>
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute bottom-[18%] left-0 h-[30%] w-full opacity-70"
      >
        <path d="M0 260 L120 210 L240 250 L390 190 L520 240 L700 170 L860 230 L1020 180 L1180 235 L1330 195 L1440 240 L1440 320 L0 320 Z" fill="#0b0714" />
      </svg>

      {/* mausoleum */}
      <svg viewBox="0 0 260 200" className="absolute bottom-[19%] left-[38%] w-40 opacity-95 sm:w-56" aria-hidden>
        <g fill="#0a0616">
          <path d="M20 200 V86 L130 30 L240 86 V200 Z" />
          <path d="M14 92 L130 28 L246 92 L246 78 L130 16 L14 78 Z" fill="#0d0918" />
          <rect x="46" y="110" width="18" height="90" fill="#080512" />
          <rect x="196" y="110" width="18" height="90" fill="#080512" />
        </g>
        {/* door with faint inner light */}
        <path d="M112 200 V138 Q130 122 148 138 V200 Z" fill="#050309" />
        <path d="M116 200 V140 Q130 127 144 140 V200 Z" fill="#241a3e" />
        <path d="M120 200 V143 Q130 133 140 143 V200 Z" fill="url(#mausoleumLight)" />
        <defs>
          <linearGradient id="mausoleumLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(247,155,46,0.5)" />
            <stop offset="100%" stopColor="rgba(247,155,46,0.06)" />
          </linearGradient>
        </defs>
      </svg>

      {/* two big dead trees */}
      <svg viewBox="0 0 200 260" className="absolute bottom-[17%] left-[6%] w-28 opacity-90 sm:w-36" aria-hidden>
        <g fill="#070410">
          <path d="M96 260 L100 150 L74 108 L86 114 L102 142 L106 88 L112 142 L132 106 L142 112 L114 152 L108 260 Z" />
          <path d="M100 150 L48 118 L58 110 L104 138 M106 88 L152 52 L160 62 L112 96 M112 142 L166 170 L160 180 L110 156" />
        </g>
      </svg>
      <svg viewBox="0 0 200 260" className="absolute bottom-[16%] right-[5%] w-24 opacity-80 sm:w-32" aria-hidden>
        <g fill="#070410" transform="scale(-1,1) translate(-200,0)">
          <path d="M96 260 L100 150 L74 108 L86 114 L102 142 L106 88 L112 142 L132 106 L142 112 L114 152 L108 260 Z" />
          <path d="M100 150 L48 118 L58 110 L104 138 M106 88 L152 52 L160 62 L112 96 M112 142 L166 170 L160 180 L110 156" />
        </g>
      </svg>

      {/* far small stones */}
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-[17.5%] left-0 h-[10%] w-full opacity-55" aria-hidden>
        <g fill="#0a0616">
          <path d="M180 120 V70 Q180 56 192 56 Q204 56 204 70 V120 Z" />
          <path d="M420 120 V80 Q420 70 429 70 Q438 70 438 80 V120 Z" />
          <path d="M760 120 V64 L790 64 L790 76 L772 76 L772 120 Z" />
          <path d="M1010 120 V74 Q1010 62 1021 62 Q1032 62 1032 74 V120 Z" />
          <path d="M1240 120 V58 L1262 58 L1262 68 L1250 68 L1250 120 Z" />
        </g>
      </svg>
    </>
  );
}

/**
 * The 3D graveyard world. Pure CSS-3D: a perspective stage, three parallax
 * depth layers, and tombstones built as real extruded cuboids that slowly
 * turn toward the cursor. Sits inside the hero and inherits --mx/--my/--sy.
 */
export function GraveyardScene() {
  return (
    <div className="gy-perspective" aria-hidden>
      <div className="gy-world">
        {/* depth layer 1 — skyline */}
        <div className="gy-layer gy-layer-back">
          <BackRow />
        </div>

        {/* depth layer 2 — the grave row with extruded stones */}
        <div className="gy-layer gy-layer-mid">
          {MOUNDS.map((m, i) => (
            <Mound key={i} {...m} />
          ))}
          {STONES.map((s, i) => (
            <Stone3D key={i} s={s} />
          ))}
          {CANDLES.map((c, i) => (
            <Candle key={i} {...c} />
          ))}
          {/* a jack-o'-lantern keeping the raven company */}
          <JackOLantern left="42%" bottom="7.4%" size={44} />
          {/* a raven keeping watch */}
          <svg viewBox="0 0 40 34" className="absolute bottom-[18.4%] left-[31.5%] w-5 opacity-90" aria-hidden>
            <path
              d="M6 30 Q4 22 12 18 Q20 12 26 14 L34 8 L30 16 Q32 24 24 28 Q16 32 6 30 Z M12 18 L4 12"
              fill="#050309"
            />
            <circle cx="27" cy="13" r="1.2" fill="#74f2a4" opacity="0.9" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Front-most iron fence — rendered above the zombie so it walks behind it. */
export function GraveyardFence() {
  return (
    <div className="gy-perspective" aria-hidden>
      <div className="gy-layer gy-layer-front">
        <svg viewBox="0 0 1440 130" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-[17%] w-full" style={{ opacity: 0.92 }}>
          <g stroke="#060310" strokeWidth="7">
            {Array.from({ length: 27 }).map((_, i) => {
              const x = 26 + i * 54;
              return (
                <g key={i}>
                  <line x1={x} y1="34" x2={x} y2="128" />
                  <circle cx={x} cy="30" r="5" fill="#060310" strokeWidth="0" />
                </g>
              );
            })}
          </g>
          <line x1="0" y1="52" x2="1440" y2="52" stroke="#060310" strokeWidth="6" />
          <line x1="0" y1="96" x2="1440" y2="96" stroke="#060310" strokeWidth="6" />
          <rect x="0" y="122" width="1440" height="10" fill="#060310" />
        </svg>
      </div>
    </div>
  );
}
