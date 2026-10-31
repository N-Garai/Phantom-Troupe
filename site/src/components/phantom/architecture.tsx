"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const FLOW = [
  {
    step: "01",
    title: "Hooks capture the dying breath",
    body: "A precmd hook (zsh) or DEBUG trap (bash) fires on every command that exits non-zero. It appends command, exit code, stderr tail, cwd and duration to ~/.phantom/morgue.jsonl — a plain file you own. Zero idle cost: nothing runs between commands.",
  },
  {
    step: "02",
    title: "The router wakes one ghost",
    body: "An orchestration framework dispatches to exactly one sub-agent — Coroner for failures, Medium for the nightly inventory, Exorcist before danger. Idle agents cost nothing; the troupe is asleep until summoned.",
  },
  {
    step: "03",
    title: "Memory that survives reboots",
    body: "A local SQL store (LibSQL file) holds the semantic morgue: embeddings of failures and obituaries, so 'the docker port thing from June' is one search away. JSONL files remain the source of truth; the index is always rebuildable.",
  },
  {
    step: "04",
    title: "The idle reaper returns your RAM",
    body: "A watchdog records the last moment the brain was used. Past your threshold (default 10 min, user-set), it unloads the model, clears caches, and the web UI shows the ghost ascending — gone to the light, memory returned to the living.",
  },
  {
    step: "05",
    title: "The local séance UI",
    body: "phantom graveyard serves a single-page séance table on 127.0.0.1:7313 — bound to loopback only. Run real commands, deal the Dead Man's Hand for explanations, and watch the graveyard tend itself. The public site is only a landing page; the séance never leaves localhost.",
  },
];

export function Architecture() {
  return (
    <section id="architecture" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="anatomy of the haunting"
        title="How the machine is haunted"
        blurb="Five moving parts, all local, all inspectable. If you can read a log file, you can audit everything the troupe knows."
      />

      <div className="relative">
        {/* spine */}
        <div className="absolute left-[19px] top-0 h-full w-px bg-gradient-to-b from-marigold/60 via-violetsmoke/50 to-transparent sm:left-1/2" aria-hidden />

        <div className="space-y-10">
          {FLOW.map((f, i) => (
            <Reveal key={f.step} delay={0.05}>
              <div className={`relative flex gap-6 sm:items-center ${i % 2 ? "sm:flex-row-reverse" : ""}`}>
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-marigold/50 bg-void font-[family-name:var(--font-geist-mono)] text-xs font-bold text-marigold sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                  {f.step}
                </div>
                <div className={`ml-14 w-full rounded-xl border border-border/70 bg-crypt/70 p-5 sm:ml-0 sm:w-[calc(50%-2.5rem)] ${i % 2 ? "" : ""}`}>
                  <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-bone">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ash">{f.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal delay={0.15}>
        <div className="mt-12 rounded-xl border border-border/70 bg-void/80 p-5 sm:p-6">
          <p className="mb-3 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.3em] text-marigold">
            the entire capture surface — one shell snippet
          </p>
          <pre className="term-scroll overflow-x-auto font-[family-name:var(--font-geist-mono)] text-[12.5px] leading-relaxed text-spectre">
{`# >>> phantom-troupe >>> (managed block — do not edit)
precmd() {                       # zsh; bash uses a DEBUG trap
  local ec=$?
  (( ec != 0 )) && phantom _capture "$?" "$1"
}
# <<< phantom-troupe <<<`}
          </pre>
          <p className="mt-3 text-[13px] text-ash">
            No resident daemon between commands. No telemetry. The hook is a marked block that{" "}
            <span className="font-[family-name:var(--font-geist-mono)] text-spectre">phantom unhook</span> removes cleanly.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
