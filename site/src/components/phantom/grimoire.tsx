"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

function Cmd({ children }: { children: string }) {
  return (
    <code className="rounded bg-void/80 px-1.5 py-0.5 font-[family-name:var(--font-geist-mono)] text-[12px] text-spectre">
      {children}
    </code>
  );
}

function Block({ lines }: { lines: string }) {
  return (
    <pre className="term-scroll overflow-x-auto rounded-lg border border-border/50 bg-void/80 p-4 font-[family-name:var(--font-geist-mono)] text-[12.5px] leading-relaxed text-spectre">
      {lines}
    </pre>
  );
}

export function Grimoire() {
  const [tab, setTab] = useState("commands");

  return (
    <section id="grimoire" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="the grimoire"
        title="Docs for the living"
        blurb="Everything the troupe can do, every key it may ask for, and exactly how to make it stop."
      />

      <Reveal>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/60 bg-crypt/80 p-1">
            {[
              ["commands", "Commands"],
              ["providers", "Brains"],
              ["memory", "Memory & reaper"],
              ["privacy", "Privacy"],
            ].map(([v, label]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-lg px-4 py-2 font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-widest data-[state=active]:bg-marigold data-[state=active]:text-void"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="commands" className="mt-6">
            <div className="overflow-hidden rounded-xl border border-border/70 bg-crypt/70">
              {[
                ["phantom", "Wakes the troupe in the background (detached daemon). The hooks start working immediately."],
                ["phantom graveyard", "Serves the local séance UI at http://127.0.0.1:7313 and opens your browser. Alias: phantom web."],
                ["phantom status", "Troupe roster: uptime, counts of corpses and graves, brain health, idle timer."],
                ["phantom seance", "Run the nightly sweep now: inventory dead scripts, refresh obituaries, prune stale graves."],
                ["phantom stop", "Put the troupe to sleep. All memory is kept — wake them again with a single word."],
                ["phantom unhook", "Remove the shell hooks only. Capture stops for new terminals; data is untouched."],
                ["phantom uninstall", "Unhook + remove timers + remove the binary — then asks, once, whether to delete ~/.phantom too."],
              ].map(([cmd, desc], i) => (
                <div
                  key={cmd}
                  className={`grid gap-1 px-5 py-4 sm:grid-cols-[240px_1fr] sm:items-center ${i ? "border-t border-border/50" : ""}`}
                >
                  <Cmd>{cmd}</Cmd>
                  <p className="text-[13.5px] text-ash">{desc}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="mt-6">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-crypt/70 p-5">
                <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-bone">
                  Ollama — default, offline, free forever
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ash">
                  The default brain is a small open-weight model served on your own machine. Install
                  Ollama, pull the model, done — no key, no bill, works with the internet unplugged.
                  Swap models with one field.
                </p>
                <div className="mt-3">
                  <Block
                    lines={`~/.phantom/config.json
{
  "provider": "ollama",
  "model": "gemma3:4b",
  "ollamaUrl": "http://127.0.0.1:11434"
}`}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-crypt/70 p-5">
                <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-bone">
                  Gemma API — the bigger sibling
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ash">
                  Prefer heavier reasoning? Point the troupe at the Gemma API (an open-weight model
                  served by its maker). Set the key once; it is read from the environment, never
                  written to disk by the troupe. Note: with a remote brain, prompts leave your
                  machine — the reaper then also unloads nothing, since nothing was loaded.
                </p>
                <div className="mt-3">
                  <Block
                    lines={`export GEMMA_API_KEY=...        # in your shell rc
~/.phantom/config.json
{
  "provider": "gemma-api",
  "model": "gemma-3-27b-it"
}`}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="mt-6">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-crypt/70 p-5">
                <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-bone">The idle reaper</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ash">
                  The brain is loaded into memory on demand and unloaded after your idle threshold.
                  In the local UI the departing spirit is shown ascending — gone to the light — and
                  the RAM it held returns to your other work. You choose the threshold:
                </p>
                <div className="mt-3">
                  <Block
                    lines={`~/.phantom/config.json
{
  "idleUnloadMinutes": 10,     // 1–60, your call
  "keepWakeWord": true         // hooks stay armed even while the brain sleeps
}`}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-crypt/70 p-5">
                <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-bone">What is stored</h3>
                <ul className="mt-2 space-y-2 text-[13.5px] text-ash">
                  <li>
                    <Cmd>~/.phantom/morgue.jsonl</Cmd> — every failed command with exit code and stderr tail
                  </li>
                  <li>
                    <Cmd>~/.phantom/graves.jsonl</Cmd> — dead scripts, aliases, crons and their obituaries
                  </li>
                  <li>
                    <Cmd>~/.phantom/memory.db</Cmd> — the semantic index (rebuildable from the JSONL files anytime)
                  </li>
                  <li>
                    <Cmd>~/.phantom/config.json</Cmd> — provider, model, idle threshold
                  </li>
                </ul>
                <p className="mt-3 text-[13.5px] text-ash">
                  <Cmd>phantom stop</Cmd> — stops the daemon; bones stay.{" "}
                  <Cmd>phantom uninstall</Cmd> asks before deleting anything.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <div className="rounded-xl border border-spectre/25 bg-spectre/5 p-5 sm:p-6">
              <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-spectre">
                Shell history is the most sensitive data on your computer
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ash">
                Your terminal history contains secrets, client names, and the occasional password
                typed in the wrong window. That is precisely why the troupe is local-only: the
                default brain runs on your hardware, capture writes to files you own, and there is
                no account to breach because there is no account. Optional integrations (voice
                whispers, crash telemetry) are opt-in, off by default, and each one is documented
                with exactly what it sends.
              </p>
              <ul className="mt-4 space-y-2 text-[13.5px] text-ash">
                <li>✝ The séance UI binds to 127.0.0.1 only — it is unreachable from your network.</li>
                <li>✝ Crash telemetry is a single boolean, defaults to false, and shows its payload in the docs.</li>
                <li>✝ Every stored artifact is a plain file; audit it with cat, not with trust.</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </Reveal>
    </section>
  );
}
