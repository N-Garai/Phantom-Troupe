"use client";

import { useState } from "react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

const METHODS = [
  {
    label: "macOS / Linux — curl, one line",
    cmd: "curl -fsSL https://raw.githubusercontent.com/N-Garai/Phantom-Troupe/main/phantom-cli/install.sh | bash",
    note: "Detects Node, shell, and package manager, installs the CLI, writes your shell hooks, then runs phantom init.",
  },
  {
    label: "Windows PowerShell — one line",
    cmd: "irm https://raw.githubusercontent.com/N-Garai/Phantom-Troupe/main/phantom-cli/install.ps1 | iex",
    note: "Installs the CLI, writes the PowerShell prompt hooks into your profile, and schedules nothing without asking.",
  },
  {
    label: "npm — already have Node",
    cmd: "npm i -g phantom-troupe && phantom init",
    note: "Same result, more explicit. bun works too: bun i -g phantom-troupe. Run phantom to wake the troupe.",
  },
];

export function Download() {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable — user can still select the text */
    }
  };

  return (
    <section id="download" className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="summoning ritual"
        title="One line. It wakes up."
        blurb="The installer detects your OS, shell, and package manager — then writes the hooks and asks nothing else. No accounts. No API keys. No cloud."
      />

      <div className="space-y-4">
        {METHODS.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.1}>
            <div className="rounded-xl border border-border/70 bg-crypt/80 p-5 sm:p-6">
              <p className="mb-3 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.3em] text-marigold">
                {m.label}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="term-scroll w-full overflow-x-auto whitespace-nowrap rounded-lg border border-border/50 bg-void/80 px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[12.5px] text-spectre sm:text-[13px]">
                  <span className="select-none text-ash/60">$ </span>
                  {m.cmd}
                </code>
                <button
                  onClick={() => copy(i, m.cmd)}
                  className={cn(
                    "shrink-0 rounded-md border px-4 py-2.5 font-[family-name:var(--font-geist-mono)] text-xs font-bold uppercase tracking-widest transition-all",
                    copied === i
                      ? "border-spectre/60 bg-spectre/15 text-spectre"
                      : "border-border text-bone hover:border-marigold/60 hover:text-marigold"
                  )}
                  aria-live="polite"
                >
                  {copied === i ? "copied ✓" : "copy"}
                </button>
              </div>
              <p className="mt-3 text-[13px] text-ash">{m.note}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-crypt/60 p-5">
            <p className="font-[family-name:var(--font-cinzel)] text-sm font-bold text-bone">Runs on a potato</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ash">
              Default brain is a 4B open-weight model — a few GB of RAM. No GPU required; capture and
              storage work even with the brain offline (lazy autopsies later).
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-crypt/60 p-5">
            <p className="font-[family-name:var(--font-cinzel)] text-sm font-bold text-bone">Choose your brain</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ash">
              Ollama (local, default) or a Gemma API key if you want the bigger sibling to do the
              thinking. One line in <span className="font-[family-name:var(--font-geist-mono)] text-spectre">~/.phantom/config.json</span>.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-crypt/60 p-5">
            <p className="font-[family-name:var(--font-cinzel)] text-sm font-bold text-bone">Bones are yours</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ash">
              Everything lands in <span className="font-[family-name:var(--font-geist-mono)] text-spectre">~/.phantom</span> as
              plain files. Delete them and the ghosts are truly gone — no server to petition.
            </p>
          </div>
        </div>
      </Reveal>

      {/* the full bundle */}
      <Reveal delay={0.2}>
        <div className="mt-8 overflow-hidden rounded-xl border border-marigold/25 bg-[linear-gradient(160deg,rgba(247,155,46,0.08),rgba(13,9,20,0.92))]">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.3em] text-marigold">
                the whole graveyard, in one coffin
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-cinzel)] text-xl font-bold text-bone sm:text-2xl">
                phantom-troupe.zip
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ash">
                Every necessary file in one bundle: the CLI source <span className="text-bone">and</span> its
                compiled build, the local séance web UI, shell hooks, docs, CI workflows, this very
                website&apos;s source, and a per-device install guide. Works offline end to end.
              </p>
              <ul className="mt-4 grid gap-1.5 text-[12.5px] text-ash sm:grid-cols-2">
                <li className="flex items-center gap-2"><span className="text-spectre">✝</span> phantom-cli/ — src + dist + hooks + web UI</li>
                <li className="flex items-center gap-2"><span className="text-spectre">✝</span> site/ — this landing page (Next.js)</li>
                <li className="flex items-center gap-2"><span className="text-spectre">✝</span> docs/ — architecture + privacy</li>
                <li className="flex items-center gap-2"><span className="text-spectre">✝</span> INSTALL.md — macOS · Linux · Windows</li>
              </ul>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-3">
              <a
                href="/phantom-troupe.zip"
                download
                className="pulse-ring rounded-md bg-marigold px-7 py-3.5 font-[family-name:var(--font-geist-mono)] text-sm font-bold uppercase tracking-widest text-void transition-all hover:bg-candle"
              >
                ⬇ download the bundle
              </a>
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-ash/70">
                MIT · no account · no telemetry
              </p>
            </div>
          </div>

          {/* per-device quick guide */}
          <div className="grid gap-px border-t border-border/50 bg-border/50 sm:grid-cols-3">
            {[
              {
                os: "macOS / Linux",
                steps: [
                  "unzip phantom-troupe.zip",
                  "cd phantom-troupe/phantom-cli && npm install",
                  "npm link   # puts `phantom` on your PATH",
                  "phantom init && phantom",
                ],
              },
              {
                os: "Windows (PowerShell)",
                steps: [
                  "Install Node 18+ (nodejs.org or winget)",
                  "Expand-Archive phantom-troupe.zip",
                  "cd phantom-troupe\\phantom-cli; npm install; npm link",
                  "phantom init   # writes your PowerShell hooks natively",
                ],
              },
              {
                os: "Any device (try it here)",
                steps: [
                  "Open this site in any browser",
                  "Scroll to the séance and type 'help'",
                  "The real UI is the same, at 127.0.0.1:7313",
                  "Your bones never leave the machine",
                ],
              },
            ].map((g) => (
              <div key={g.os} className="bg-void/60 p-5">
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.25em] text-spectre">
                  {g.os}
                </p>
                <ol className="mt-3 space-y-1.5 font-[family-name:var(--font-geist-mono)] text-[12px] leading-relaxed text-ash">
                  {g.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 text-marigold/70">{i + 1}.</span>
                      <span className="break-words">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
