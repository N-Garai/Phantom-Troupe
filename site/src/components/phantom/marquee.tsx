const PHRASES = [
  "every command leaves a corpse",
  "the shell remembers what you forget",
  "dead scripts don't stay buried",
  "rm -rf has a witness now",
  "your failures, filed and searchable",
  "the dead ones whisper fixes",
  "local bones. local brains.",
  "the Coroner never sleeps",
  "~/.phantom owns your bones",
];

export function Marquee() {
  const strip = [...PHRASES, ...PHRASES];
  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-tomb/70 py-5" aria-hidden>
      {/* fog rolling behind the text */}
      <div className="fog-layer opacity-50 pointer-events-none" />
      <div className="fog-layer fog-2 opacity-40 pointer-events-none" />
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {strip.map((p, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-[family-name:var(--font-cinzel)] text-sm uppercase tracking-[0.35em] text-bone/90"
          >
            {p}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-marigold/80">
              <path d="M12 2C7 2 3.5 6 3.5 11c0 2.6.9 4 1.7 5.2.6.9 1.2 1.7 1.4 2.9.2.9 1 1.4 1.9 1.4h7c.9 0 1.7-.5 1.9-1.4.2-1.2.8-2 1.4-2.9.8-1.2 1.7-2.6 1.7-5.2C20.5 6 17 2 12 2z" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9.5" cy="11" r="1" fill="currentColor" />
              <circle cx="14.5" cy="11" r="1" fill="currentColor" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
