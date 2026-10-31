import { Reveal } from "./reveal";
import { Particles } from "./particles";
import { RisingHand } from "./rising-hand";
import { Zombie } from "./zombie";

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border/60 bg-tomb/90">
      <div className="fog-layer opacity-40" aria-hidden />
      <Particles className="absolute inset-0 h-full w-full opacity-60" density={40} mode="spectre" />
      {/* miniature graveyard — a small hand that keeps trying to escape */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28" aria-hidden>
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-full w-full opacity-80">
          <g fill="#0a0616">
            <path d="M60 110 V66 Q60 52 74 52 Q88 52 88 66 V110 Z" />
            <path d="M210 110 V76 Q210 66 220 66 Q230 66 230 76 V110 Z" />
            <path d="M420 110 V58 L452 58 L452 70 L436 70 L436 110 Z" />
            <path d="M700 110 V70 Q700 56 714 56 Q728 56 728 70 V110 Z" />
            <path d="M960 110 V62 L986 62 L986 72 L972 72 L972 110 Z" />
            <path d="M1180 110 V72 Q1180 60 1192 60 Q1204 60 1204 72 V110 Z" />
            <path d="M1330 110 V64 Q1330 50 1344 50 Q1358 50 1358 64 V110 Z" />
          </g>
        </svg>
        <div className="absolute bottom-0 left-[16%] h-24 w-20 opacity-90">
          <RisingHand loop whisper={false} interactive={false} className="h-full w-full" />
        </div>
        <Zombie size={64} bottom="4%" delay={9} className="opacity-70" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-14 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-center gap-6 text-center">
            <img src="/sigil.svg" alt="" className="h-12 w-12 opacity-80" />
            <p className="max-w-xl text-balance font-[family-name:var(--font-cinzel)] text-lg text-bone sm:text-xl">
              “What the shell forgets, the troupe remembers.”
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-widest text-ash">
              <a href="#troupe" className="hover:text-marigold">The Troupe</a>
              <a href="#seance" className="hover:text-marigold">Séance</a>
              <a href="#download" className="hover:text-marigold">Summon</a>
              <a href="#grimoire" className="hover:text-marigold">Docs</a>
              <a href="#research" className="hover:text-marigold">Research</a>
            </div>
            <div className="hairline-t w-full max-w-2xl pt-6">
              <p className="text-[12px] leading-relaxed text-ash/70">
                Runs on open-weight models and open-source agent infrastructure. Your bones stay on
                your machine. MIT licensed.
              </p>
              <p className="mt-2 font-[family-name:var(--font-geist-mono)] text-[11px] text-ash/50">
                © {new Date().getFullYear()} Phantom Troupe · no cookies, no trackers, no cloud
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
