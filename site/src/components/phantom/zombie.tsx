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
 * A shambling zombie silhouette. Walks the whole graveyard left → right,
 * stops mid-way to reconsider its unlifes, then shambles on. Fully
 * articulated: swinging legs, reaching arm, lolling head, guttering eye.
 */
export function Zombie({
  className,
  size = 120,
  bottom = "6.5%",
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
          <svg viewBox="0 0 130 170" className="h-auto w-full">
            <defs>
              <filter id="z-eye-glow" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g fill="#0a0614">
              {/* back leg */}
              <g className="zombie-leg-b">
                <path d="M76 108 L82 134 L76 158 L70 158 L74 134 L66 110 Z" />
                <path d="M70 156 h16 l2 6 h-20 z" />
              </g>

              {/* ragged coat tail flapping behind the hips */}
              <g className="zombie-coat">
                <path d="M52 100 L38 128 L46 130 L40 148 L50 144 L48 162 L56 156 L58 104 Z" />
              </g>

              {/* torso — hunched forward toward the right */}
              <path d="M50 104 C46 84 50 64 62 54 L84 58 C92 70 94 88 90 106 C78 112 62 112 50 104 Z" />

              {/* front leg */}
              <g className="zombie-leg-a">
                <path d="M58 106 L54 132 L58 156 L64 156 L62 132 L70 108 Z" />
                <path d="M56 154 h18 l2 6 h-22 z" />
              </g>

              {/* back arm, dangling and useless */}
              <g className="zombie-arm-back">
                <path d="M60 62 C52 72 48 86 48 98 L54 100 C56 88 60 76 66 66 Z" />
                <path d="M47 98 l9 2 -2 7 -9 -2 z" />
              </g>

              {/* head — tilted, jaw hanging open */}
              <g className="zombie-head">
                <path d="M78 26 C90 26 97 34 96 44 C95 52 88 57 79 57 C70 57 64 50 65 41 C66 32 70 26 78 26 Z" />
                {/* hanging jaw */}
                <path d="M72 52 L84 53 L83 62 L74 61 Z" />
                {/* a few scalp strands */}
                <path d="M70 28 l-5 -7 M76 26 l-2 -8 M83 26 l2 -7" stroke="#0a0614" strokeWidth="2.4" strokeLinecap="round" />
                {/* guttering eye */}
                <circle className="zombie-eye" cx="88" cy="40" r="2.6" fill="#74f2a4" filter="url(#z-eye-glow)" />
                <circle cx="78" cy="42" r="1.6" fill="#74f2a4" opacity="0.5" />
              </g>

              {/* front arm — reaching for the living */}
              <g className="zombie-arm-front">
                <path d="M84 62 C96 64 108 68 118 72 L116 80 C106 76 94 73 82 72 Z" />
                {/* grasping hand */}
                <path d="M116 70 l10 -3 -1 5 6 -2 -1 5 5 0 -3 5 -14 3 z" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
