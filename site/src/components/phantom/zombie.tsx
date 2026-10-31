"use client";

type ZombieProps = {
  className?: string;
  /** overall pixel width of the corpse */
  size?: number;
  /** vertical position from the container bottom */
  bottom?: string;
  /** run the long cross-graveyard journey (disable for static cameos) */
  walk?: boolean;
  /** loop delay before the corpse sets off (seconds) */
  delay?: number;
};

/**
 * A shambling zombie corpse. Fully articulated: swinging legs, hunched
 * torso, reaching arm, lolling head, guttering eye, ragged coat. Walks
 * left → right across the graveyard then sinks back into the earth.
 */
export function Zombie({
  className,
  size = 120,
  bottom = "6%",
  walk = true,
  delay = 0,
}: ZombieProps) {
  return (
    <div
      className={`zombie ${className ?? ""}`}
      style={{ bottom, width: size, left: 0 }}
      aria-hidden
    >
      <div className={walk ? "zombie-cross" : ""} style={walk ? { animationDelay: `${delay}s` } : undefined}>
        <div className="zombie-bob">
          <svg viewBox="0 0 150 200" className="h-auto w-full">
            <defs>
              <filter id="z-eye-glow2" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g fill="#060410">
              {/* back leg */}
              <g className="zombie-leg-b">
                <path d="M86 128 L94 160 L88 186 L80 186 L84 160 L74 130 Z" />
                <path d="M78 184 h20 l4 8 h-28 z" />
              </g>

              {/* ragged coat tail flapping behind the hips */}
              <g className="zombie-coat">
                <path d="M58 120 L42 154 L52 156 L44 176 L58 172 L56 190 L66 182 L68 124 Z" />
                <path d="M44 156 Q48 136 56 140 Q52 148 46 152" fill="none" stroke="#0a0614" strokeWidth="1.5" opacity="0.6" />
              </g>

              {/* hunched torso */}
              <path d="M56 124 C52 102 56 82 70 72 L96 78 C106 92 108 108 104 124 C90 132 70 132 56 124 Z" />
              {/* ribcage suggestion */}
              <path d="M68 84 Q74 82 80 84 M70 92 Q76 90 82 92 M72 100 Q78 98 84 100" fill="none" stroke="#2a2036" strokeWidth="2" opacity="0.7" />

              {/* front leg */}
              <g className="zombie-leg-a">
                <path d="M68 126 L62 154 L68 182 L76 182 L72 154 L82 128 Z" />
                <path d="M64 180 h22 l4 8 h-30 z" />
              </g>

              {/* back arm, dangling */}
              <g className="zombie-arm-back">
                <path d="M68 76 C58 88 52 104 52 120 L60 124 C62 110 66 96 72 84 Z" />
                <path d="M51 120 l12 2 -4 8 -12 -2 z" fill="#0a0614" />
              </g>

              {/* head — tilted, jaw hanging open, decayed */}
              <g className="zombie-head">
                <path d="M88 32 C102 32 110 42 108 54 C106 64 98 70 88 70 C80 70 74 62 76 50 C78 38 84 32 88 32 Z" />
                {/* hanging jaw */}
                <path d="M82 64 L98 66 L96 76 L86 74 Z" fill="#0a0614" />
                {/* scalp strands */}
                <path d="M80 34 l-6 -9 M88 32 l-2 -10 M94 32 l2 -8" stroke="#060410" strokeWidth="2.8" strokeLinecap="round" />
                {/* guttering eye — sickly green */}
                <circle className="zombie-eye" cx="100" cy="46" r="3" fill="#74f2a4" filter="url(#z-eye-glow2)" />
                <circle cx="90" cy="48" r="2" fill="#74f2a4" opacity="0.5" />
                {/* decay patches */}
                <ellipse cx="96" cy="52" rx="4" ry="3" fill="#0a0614" opacity="0.4" />
              </g>

              {/* front arm — reaching for the living */}
              <g className="zombie-arm-front">
                <path d="M96 76 C110 78 124 82 136 86 L134 96 C122 92 108 88 94 86 Z" />
                {/* grasping hand with long fingers */}
                <path d="M136 84 l12 -2 -1 6 8 -3 -1 6 7 0 -4 6 -16 4 z" fill="#0a0614" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
