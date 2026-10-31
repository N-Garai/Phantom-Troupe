"use client";

import { useRef } from "react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

const GHOSTS = [
  {
    name: "The Coroner",
    role: "failure autopsy",
    color: "text-blood",
    glow: "group-hover:shadow-[0_0_44px_rgba(194,40,54,0.22)]",
    border: "group-hover:border-blood/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 3c-4.4 0-7.5 3.4-7.5 7.7 0 2.4 1 3.9 2 5.1.6.8 1.2 1.6 1.4 2.7.1.6.7 1 1.3 1h5.6c.6 0 1.2-.4 1.3-1 .2-1.1.8-1.9 1.4-2.7 1-1.2 2-2.7 2-5.1C19.5 6.4 16.4 3 12 3z" />
        <path d="M9 21h6M10 17v4M14 17v4" />
        <path d="M9.5 10.5h5M12 8v5" />
      </svg>
    ),
    lines: [
      "exit code 1, stderr: ENOSPC — died of a full disk",
      "this failure has died 3 times before",
      "the treatment that worked on Mar 4: ulimit -n 4096",
    ],
  },
  {
    name: "The Medium",
    role: "graveyard inventory",
    color: "text-violetsmoke",
    glow: "group-hover:shadow-[0_0_44px_rgba(109,75,180,0.25)]",
    border: "group-hover:border-violetsmoke/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="7" r="3.4" />
        <path d="M5.5 21c.7-4 3.2-6.5 6.5-6.5s5.8 2.5 6.5 6.5" />
        <path d="M4 4l16 16" opacity="0.45" />
      </svg>
    ),
    lines: [
      "~/bin/fix-wifi.sh — untouched 387 days, still valid",
      "alias gg → git gui — unused 214 days. verdict: requiem?",
      "cron @weekly backup.sh — erroring since June. resurrect?",
    ],
  },
  {
    name: "The Understudy",
    role: "resurrection engine",
    color: "text-spectre",
    glow: "group-hover:shadow-[0_0_44px_rgba(116,242,164,0.2)]",
    border: "group-hover:border-spectre/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-2.6-6.3" />
        <path d="M21 3v6h-6" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
    lines: [
      "you wrote a script for exactly this in March",
      "resurrect ~/bin/mass-rename and adapt args? [Y/n]",
      "graveyard → first-class completion candidate",
    ],
  },
  {
    name: "The Interpreter",
    role: "where & when, not just what",
    color: "text-marigold",
    glow: "group-hover:shadow-[0_0_44px_rgba(247,155,46,0.22)]",
    border: "group-hover:border-marigold/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5z" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-4.5" />
        <path d="M9 8h7M9 12h5" />
      </svg>
    ),
    lines: [
      "xargs — use when args overflow the limit",
      "warning: this bit you on Feb 12 with filenames containing spaces",
      "your own corpse records, cited inline",
    ],
  },
  {
    name: "The Exorcist",
    role: "guardian at the gate",
    color: "text-ember",
    glow: "group-hover:shadow-[0_0_44px_rgba(255,109,31,0.25)]",
    border: "group-hover:border-ember/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2l8 3.5v5.2c0 5-3.4 9.3-8 11.3-4.6-2-8-6.3-8-11.3V5.5z" />
        <path d="M12 8v4M12 15.5v.5" />
      </svg>
    ),
    lines: [
      "severity: HIGH — rm -rf /var/* with a variable",
      "curl | bash detected — review before summoning",
      "git push --force on main. sure? [type the branch name]",
    ],
  },
];

/** 3D tilt-on-hover card wrapper */
function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-4px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("grave-card", className)}>
      {children}
    </div>
  );
}

export function Troupe() {
  return (
    <section id="troupe" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="the troupe"
        title="Five spirits. One shell."
        blurb="A router agent wakes whichever ghost the moment requires — each one a specialist with its own tools, its own memory, and its own grudge."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GHOSTS.map((g, i) => (
          <Reveal key={g.name} delay={i * 0.08} className={cn(i === 0 && "sm:col-span-2 lg:col-span-1")}>
            <Tilt
              className={cn(
                "group h-full rounded-xl border border-border/70 bg-crypt/80 p-6 backdrop-blur-sm",
                g.glow,
                g.border
              )}
            >
              <div className={cn("mb-5 h-11 w-11 rounded-lg border border-border/60 bg-void/60 p-2.5", g.color)}>
                {g.icon}
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-bone">{g.name}</h3>
              <p className={cn("mt-1 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.25em]", g.color)}>
                {g.role}
              </p>
              <div className="mt-5 space-y-2 rounded-lg border border-border/40 bg-void/70 p-4 font-[family-name:var(--font-geist-mono)] text-[12.5px] leading-relaxed text-ash">
                {g.lines.map((l, j) => (
                  <p key={j}>
                    <span className="mr-2 text-marigold/70">›</span>
                    {l}
                  </p>
                ))}
              </div>
            </Tilt>
          </Reveal>
        ))}

        <Reveal delay={0.4}>
          <div className="flex h-full flex-col justify-between rounded-xl border border-marigold/25 bg-[linear-gradient(160deg,rgba(247,155,46,0.10),rgba(13,9,20,0.9))] p-6">
            <div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-bone">The Router</h3>
              <p className="mt-1 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.25em] text-marigold">
                keeper of the troupe
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ash">
                One dispatching agent reads the moment — a failed command, a repeated death, a nightly
                sweep — and wakes the right ghost. Sub-agents never run unless summoned, so your
                laptop stays cold and quiet.
              </p>
            </div>
            <p className="mt-5 font-[family-name:var(--font-geist-mono)] text-xs text-ash/70">
              orchestrated on an open agent framework · memory in a local SQL store
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
