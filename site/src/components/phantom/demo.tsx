"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { Ghost } from "./ghost";
import { cn } from "@/lib/utils";

/* ---------------------------------- data ---------------------------------- */

type Line = { id: number; kind: "in" | "out" | "err" | "agent" | "sys"; text: string };
type Os = "windows" | "mac" | "linux";

const LABEL: Record<Os, string> = { windows: "Windows", mac: "macOS", linux: "Linux" };
const PROMPT: Record<Os, string> = {
  mac: "ghost@machine:~$",
  linux: "ghost@machine:~$",
  windows: "PS C:\\Users\\haunter>",
};

const BOOT_BY_OS: Record<Os, Omit<Line, "id">[]> = {
  mac: [
    { kind: "sys", text: "phantom daemon v1.1.0 — the troupe is awake (pid 1312)" },
    { kind: "sys", text: "brain: gemma3:4b via ollama, local · memory: ~/.phantom (plain files)" },
    { kind: "sys", text: "hooks: zsh preexec/precmd armed · nightly séance via launchd, 02:17" },
  ],
  linux: [
    { kind: "sys", text: "phantom daemon v1.1.0 — the troupe is awake (pid 1312)" },
    { kind: "sys", text: "brain: gemma3:4b via ollama, local · memory: ~/.phantom (plain files)" },
    { kind: "sys", text: "hooks: bash DEBUG-trap armed · nightly séance via systemd user timer, 02:17" },
  ],
  windows: [
    { kind: "sys", text: "phantom daemon v1.1.0 — the troupe is awake (pid 1312)" },
    { kind: "sys", text: "brain: gemma3:4b via ollama, local · memory: C:\\Users\\haunter\\.phantom" },
    { kind: "sys", text: "hooks: PowerShell prompt armed (both PS 7 & 5.1) · nightly séance via schtasks, 02:17" },
  ],
};

const LS_OUT: Record<Os, string[]> = {
  mac: ["graves.jsonl  morgue.jsonl  memory.db  config.json", "fix-wifi.sh  alias-backup.txt  resurrect-me.sh"],
  linux: ["graves.jsonl  morgue.jsonl  memory.db  config.json", "fix-wifi.sh  alias-backup.txt  resurrect-me.sh"],
  windows: [
    "    Directory: C:\\Users\\haunter\\.phantom",
    "Mode                 LastWriteTime         Length Name",
    "----                 -------------         ------ ----",
    "-a---        27-10-2026   03:12          18432 graves.jsonl",
    "-a---        27-10-2026   01:40           9216 morgue.jsonl",
  ],
};

const NOT_FOUND: Record<Os, string> = {
  mac: 'zsh: command not found: {0} — the spirit was never on this PATH.',
  linux: 'bash: command not found: {0} — the spirit was never on this PATH.',
  windows: "{0} : The term '{0}' is not recognized as a name of a cmdlet — the spirit was never installed here.",
};

const CHIPS: Record<Os, string[]> = {
  mac: ["gti status", "rm -rf ~/projects", "git push --force origin main", "phantom seance"],
  linux: ["gti status", "rm -rf ./build", "docker compose up", "phantom seance"],
  windows: ["gti status", "Remove-Item -Recurse -Force C:\\projects", "git push --force origin main", "phantom seance"],
};

const HELP_COMMON = [
  "  help                  this séance menu",
  "  phantom status        troupe roster & health",
  "  phantom seance        nightly graveyard sweep, run now",
  "  phantom graveyard     the real tool serves this UI at 127.0.0.1:7313",
  "  phantom stop          put the troupe to sleep (bones are kept)",
  "  ls / cat morgue.jsonl poke around the local files",
  "  history               what the dead have been saying",
  "  clear                 sweep the screen",
  "  …or type anything broken. the Coroner is waiting.",
];

const MORGUE = [
  '{"ts":"2026-10-27T03:12:44Z","cmd":"python3 train.py --epochs 40","exit":137,"stderr_tail":"Killed","dx":"OOM — died of a slain process (SIGKILL). Treatment that worked on Mar 4: --batch-size 16"}',
  '{"ts":"2026-10-26T22:41:02Z","cmd":"git push origin main","exit":1,"stderr_tail":"! [rejected]","dx":"force needed. the Exorcist would like a word first."}',
  '{"ts":"2026-10-25T09:03:19Z","cmd":"docker compose up","exit":1,"stderr_tail":"port is already allocated","dx":"ghost process on :5432 from a past life. exorcise: docker rm -f pg-ghost"}',
];

const EXPLAIN: Record<string, { title: string; what: string; when: string; warn?: string }> = {
  "git push --force": {
    title: "git push --force",
    what: "Overwrites the remote branch with your local history, destroying any commits you don't have.",
    when: "Only on branches nobody else builds on, after an interactive rebase.",
    warn: "Prefer --force-with-lease: it refuses if someone pushed in the meantime.",
  },
  "rm -rf": {
    title: "rm -rf",
    what: "Recursive, unconditional deletion. In shells, the dead do not come back — there is no graveyard bin here.",
    when: "When you are absolutely certain of the path. Quote globs; expand variables twice.",
    warn: "A variable that expands to empty turns 'rm -rf $X/' into 'rm -rf /'. The Exorcist flags exactly this.",
  },
  curl: {
    title: "curl … | bash",
    what: "Streams a remote script straight into your shell. Convenient — and a classic haunting vector.",
    when: "Trusted sources only. Pin versions, read the script once, prefer package managers.",
    warn: "The Exorcist stops this by default and asks for a typed confirmation.",
  },
  chmod: {
    title: "chmod 777",
    what: "Grants every user read, write, and execute. The file is now public property.",
    when: "Almost never. 755 for executables, 644 for data.",
    warn: "If a tool demands 777, the real bug lives elsewhere.",
  },
  tar: {
    title: "tar",
    what: "Tape ARchive — bundles many files into one stream, optionally compressed.",
    when: "tar -czf out.tgz dir/ to pack; tar -xzf out.tgz to unpack. -C changes destination.",
    warn: "The eternal mnemonic: eXtract = x, Create = c, File = f — and f always comes last.",
  },
};

const SUITS = ["♠", "♣", "♠", "♣", "?"];

/* ------------------------------- component -------------------------------- */

export function SeanceDemo() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [dealt, setDealt] = useState(false);
  const [dealFor, setDealFor] = useState<string>("tar -xzf archive.tgz");
  const [ascend, setAscend] = useState(false);
  const [ttl, setTtl] = useState(10);
  const [os, setOs] = useState<Os>("mac");
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const push = useCallback((kind: Line["kind"], text: string) => {
    setLines((l) => [...l.slice(-160), { id: ++idRef.current, kind, text }]);
  }, []);

  /* auto-detect the visitor's own system — they can switch below */
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Win/i.test(ua)) setOs("windows");
    else if (/Mac|iPhone|iPad/i.test(ua)) setOs("mac");
    else if (/X11|Linux|Android/i.test(ua)) setOs("linux");
  }, []);

  /* boot whenever the OS changes — a fresh séance on a fresh machine */
  useEffect(() => {
    const seq = [...BOOT_BY_OS[os], { kind: "sys" as const, text: "type 'help' — or type something broken and watch the Coroner work" }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    seq.forEach((l, i) => {
      timers.current.push(setTimeout(() => push(l.kind, l.text), 350 + i * 420));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [os, push]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;
      push("in", cmd);

      const c = cmd.toLowerCase();
      if (c === "clear" || c === "cls") return setLines([]);
      if (c === "help") return HELP_COMMON.forEach((l) => push("out", l));
      if (["ls", "dir", "get-childitem", "gci"].includes(c)) {
        LS_OUT[os].forEach((f) => push("out", f));
        return;
      }
      if (c.startsWith("cat morgue")) return MORGUE.forEach((m) => push("out", m));
      if (c === "history") {
        [...lines.filter((l) => l.kind === "in").slice(-5).map((l) => l.text), cmd].forEach((h, i) =>
          push("out", `  ${500 + i}  ${h}`)
        );
        return;
      }
      if (c === "phantom status") {
        [
          "troupe: AWAKE · uptime 4h 12m · pid 1312",
          "coroner: 34 corpses filed · medium: 61 graves tended · understudy: armed",
          "brain: gemma3:4b (ollama, local) · idle unload in " + ttl + " min",
        ].forEach((l) => push("agent", l));
        return;
      }
      if (c === "phantom seance") {
        [
          "sweep: 3 graves condition changed tonight:",
          "  ✝ ~/bin/fix-wifi.sh  — 387 days dead, still valid → resurrect candidate",
          "  ✝ alias gg          — 214 days unused → requiem proposed",
          "  ✝ cron backup.sh    — erroring since June → coroner report attached",
        ].forEach((l) => push(l.startsWith("  ✝") ? "err" : "agent", l));
        return;
      }
      if (c === "phantom graveyard" || c === "phantom web") {
        push("agent", "the real troupe serves this UI on http://127.0.0.1:7313 — you are in the simulation.");
        return;
      }
      if (c === "phantom stop") {
        push("agent", "troupe sleeps. all memory kept in ~/.phantom — 'phantom' wakes them again.");
        return;
      }
      if (c.includes("rm -rf") && (c.includes("/ ") || c.endsWith("rm -rf /") || c.includes("~") || c.includes("./"))) {
        push("err", "⛔ THE EXORCIST BLOCKS: severity HIGH — recursive delete on a sacred path.");
        push("out", "   type the path in full or use ./ — nothing leaves the shell unhaunted.");
        return;
      }
      if (/(?:remove-item|ri)\b.*-(?:recurse|\br\b)|remove-item.*-force/i.test(c)) {
        push("err", "⛔ THE EXORCIST: PowerShell's rm -rf, in Sunday clothes — severity MEDIUM.");
        push("out", "   -Recurse deletes the whole subtree. The Coroner files nothing back from that.");
        return;
      }
      if (/push\b.*(?:--force|\s-f\b)|--force.*\bpush\b/.test(c)) {
        push("err", "⛔ THE EXORCIST: force-push detected. Try --force-with-lease (it checks for others' work).");
        return;
      }
      if (/(npm isntall|git comit|pyhton|gti |grep -r . --include)/.test(c)) {
        push("err", NOT_FOUND[os].replace(/\{0\}/g, cmd.split(" ")[0]));
        push("agent", "UNDERSTUDY: you typed a corpse. did you mean — " + fixTypo(c) + " ?  [press ↑ to amend]");
        return;
      }
      if (c === "phantom" || c.startsWith("phantom ")) {
        push("out", `unknown séance: '${cmd}' — try 'help'`);
        return;
      }
      push("err", `exit 1 — ${cmd.split(" ")[0]}: vanished into the dark`);
      push(
        "agent",
        `CORONER: cause of death — plausible flag/argument error. filed to morgue.jsonl. ask the Dead Man's Hand to explain '${cmd.split(" ")[0]}'.`
      );
      setDealFor(cmd.split(" ")[0]);
    },
    [lines, push, ttl, os]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(input);
    setInput("");
  };

  const dealCards = () => {
    setDealt(false);
    setTimeout(() => setDealt(true), 60);
  };

  const releaseSpirits = () => {
    setAscend(true);
    push("agent", `🪦 idle reaper: brain unloaded after ${ttl} min of silence. RAM returned to the living.`);
    setTimeout(() => setAscend(false), 5400);
  };

  const ex = EXPLAIN[dealFor] ?? {
    title: dealFor,
    what: "A shell incantation. In the real CLI, your local model explains it against your own history — including the times it failed you.",
    when: "Where and when it is used — with citations from your own corpse records.",
  };

  return (
    <section id="seance" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="the séance · trial"
        title="Sit at the table — on your own system"
        blurb="A faithful browser simulation of the local web UI the real tool serves on your machine. It auto-detected your system; switch between Windows, macOS and Linux above and watch the troupe work the same way it will in your shell."
      />

      <Reveal>
        <div className="relative rounded-xl border border-border/70 bg-tomb/90 shadow-[0_0_80px_rgba(109,75,180,0.12)]">
          {/* window chrome */}
          <div className="flex items-center justify-between rounded-t-xl border-b border-border/60 bg-crypt/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blood/80" />
              <span className="h-3 w-3 rounded-full bg-marigold/80" />
              <span className="h-3 w-3 rounded-full bg-spectre/80" />
            </div>
            <p className="hidden font-[family-name:var(--font-geist-mono)] text-xs text-ash sm:block">
              {os === "windows" ? "Windows PowerShell — phantom graveyard" : "ghost@localhost — phantom graveyard"}
            </p>
            <div className="flex items-center gap-1" role="tablist" aria-label="choose your system">
              {(Object.keys(LABEL) as Os[]).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={os === k}
                  onClick={() => setOs(k)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-widest transition-all",
                    os === k
                      ? "border-marigold/60 bg-marigold/15 text-marigold"
                      : "border-border/60 text-ash hover:border-marigold/40 hover:text-bone"
                  )}
                >
                  {LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <p className="sr-only">
            The simulation auto-detected {LABEL[os]}; switch with the tabs in the corner — the troupe haunts every shell the same way.
          </p>

          <div className="grid lg:grid-cols-[1.6fr_1fr]">
            {/* terminal */}
            <div className="relative border-b border-border/60 lg:border-b-0 lg:border-r">
              <div
                ref={scrollRef}
                className="term-scroll h-[420px] overflow-y-auto bg-void/80 p-4 font-[family-name:var(--font-geist-mono)] text-[13px] leading-relaxed sm:h-[480px]"
                role="log"
                aria-live="polite"
              >
                {lines.map((l) => (
                  <motion.p
                    key={l.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "whitespace-pre-wrap break-words",
                      l.kind === "in" && "text-bone",
                      l.kind === "out" && "text-ash",
                      l.kind === "err" && "text-blood/90",
                      l.kind === "agent" && "text-spectre",
                      l.kind === "sys" && "text-violetsmoke"
                    )}
                  >
                    {l.kind === "in" && <span className="mr-2 whitespace-pre text-marigold">{PROMPT[os]}</span>}
                    {l.text}
                  </motion.p>
                ))}
              </div>

              {/* ghost ascension overlay */}
              <AnimatePresence>
                {ascend && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(116,242,164,0.12),transparent_55%)]" />
                    <div className="ascension absolute bottom-0 left-6 w-16 sm:w-20">
                      <Ghost className="w-full" parallax={0} />
                    </div>
                    <p className="absolute bottom-6 left-28 font-[family-name:var(--font-cinzel)] text-sm text-spectre text-glow-spectre">
                      gone to the light… memory returned to the living
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border/60 bg-crypt/70 px-4 py-3">
                <label htmlFor="seance-input" className="sr-only">
                  Type a command
                </label>
                <span className="whitespace-pre font-[family-name:var(--font-geist-mono)] text-sm text-marigold">{PROMPT[os]}</span>
                <input
                  id="seance-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="type a command… try 'help'"
                  className="w-full bg-transparent font-[family-name:var(--font-geist-mono)] text-sm text-bone outline-none placeholder:text-ash/40"
                />
              </form>
              {/* quick-try chips — one tap, one haunting */}
              <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 bg-void/60 px-4 py-2.5">
                <span className="mr-1 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.25em] text-ash/70">
                  try
                </span>
                {CHIPS[os].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => run(chip)}
                    className="rounded-full border border-border/60 px-3 py-1 font-[family-name:var(--font-geist-mono)] text-[11px] text-ash transition-all hover:border-spectre/50 hover:text-spectre"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* side panel */}
            <div className="space-y-6 p-5 sm:p-6">
              {/* dead man's hand */}
              <div>
                <p className="mb-2 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.3em] text-marigold">
                  the dead man's hand
                </p>
                <p className="mb-3 text-[13px] leading-relaxed text-ash">
                  Aces and eights — the fifth card is the command's secret. Deal it to get{" "}
                  <span className="text-bone">what / when / danger</span> for any command, straight from your own history.
                </p>
                <button
                  onClick={dealCards}
                  className="w-full rounded-md border border-marigold/40 bg-marigold/10 px-4 py-2.5 font-[family-name:var(--font-geist-mono)] text-xs font-bold uppercase tracking-widest text-marigold transition-all hover:bg-marigold hover:text-void"
                >
                  ☠ deal the hand
                </button>

                <div className="mt-4 flex h-24 items-center justify-center gap-1.5">
                  {SUITS.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={
                        dealt
                          ? { rotate: (i - 2) * 8, y: -6, opacity: 1 }
                          : { rotate: 0, y: 18, opacity: 0.25 }
                      }
                      transition={{ delay: dealt ? i * 0.12 : 0, type: "spring", stiffness: 260, damping: 18 }}
                      className={cn(
                        "flex h-20 w-14 flex-col justify-between rounded-md border bg-[#efe6d4] p-1.5 font-[family-name:var(--font-geist-mono)] shadow-lg",
                        i === 4 ? "border-blood/60" : "border-black/30"
                      )}
                    >
                      <span className={cn("text-sm font-bold", i < 2 || i === 2 ? "text-[#1a1a1a]" : "text-blood")}>
                        {i < 4 ? "A" : "?"}
                      </span>
                      <span className={cn("self-center text-lg", i === 4 ? "text-blood" : "text-[#1a1a1a]")}>{s}</span>
                      <span className="rotate-180 self-end text-sm font-bold text-[#1a1a1a]">{i < 4 ? "A" : "?"}</span>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {dealt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-border/60 bg-void/70 p-4"
                    >
                      <p className="font-[family-name:var(--font-cinzel)] text-sm font-bold text-marigold">{ex.title}</p>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-ash">
                        <span className="text-spectre">what —</span> {ex.what}
                      </p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ash">
                        <span className="text-spectre">when —</span> {ex.when}
                      </p>
                      {ex.warn && (
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-blood/90">
                          <span className="font-bold">danger —</span> {ex.warn}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* memory reaper */}
              <div className="hairline-t pt-5">
                <p className="mb-2 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.3em] text-marigold">
                  the idle reaper
                </p>
                <p className="mb-3 text-[13px] leading-relaxed text-ash">
                  When the brain sits silent past your threshold, the reaper unloads it and returns the RAM —
                  and the dead are shown going to the light.
                </p>
                <label htmlFor="ttl" className="flex items-center justify-between text-[12px] text-ash">
                  <span>idle unload after</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-spectre">{ttl} min</span>
                </label>
                <input
                  id="ttl"
                  type="range"
                  min={1}
                  max={60}
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="mt-2 w-full accent-[#f79b2e]"
                />
                <button
                  onClick={releaseSpirits}
                  className="mt-3 w-full rounded-md border border-spectre/40 bg-spectre/10 px-4 py-2.5 font-[family-name:var(--font-geist-mono)] text-xs font-bold uppercase tracking-widest text-spectre transition-all hover:bg-spectre hover:text-void"
                >
                  🪦 release the spirits
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function fixTypo(c: string): string {
  if (c.includes("isntall")) return "npm install";
  if (c.includes("comit")) return "git commit";
  if (c.includes("pyhton")) return "python3";
  if (c.startsWith("gti")) return "git";
  return "(check spelling)";
}
