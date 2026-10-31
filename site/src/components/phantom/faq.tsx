"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const QA = [
  {
    q: "Do I need any API key or account to run it?",
    a: "No. The default brain is an open-weight model served locally on your own machine — no key, no account, no bill. The only optional keys are for extras you explicitly turn on (e.g., spoken whispers), and the tool is fully functional without them.",
  },
  {
    q: "Does something run in the background all the time?",
    a: "No resident daemon is needed for capture — a shell hook fires only when a command exits non-zero, which costs nothing between commands. 'phantom' starts a small detached helper that serves the local UI and runs the nightly sweep; 'phantom stop' ends it. The model brain loads on demand and unloads after your idle threshold.",
  },
  {
    q: "How do I stop it or remove it completely?",
    a: "'phantom stop' puts the troupe to sleep (all memory is kept). 'phantom unhook' removes shell capture only. 'phantom uninstall' removes hooks, schedules and the binary — and asks you once, explicitly, whether to delete ~/.phantom as well. Your data, your call.",
  },
  {
    q: "Will it run on a low-spec computer?",
    a: "Yes — that was a design constraint, not an afterthought. Capture, storage and search are plain file operations. The default model is a 4B-parameter open-weight model that runs on CPU; you can go even smaller. And if the brain is offline, failures are still captured and autopsied lazily the next time it wakes.",
  },
  {
    q: "What does 'the ghost goes to heaven' mean?",
    a: "When the brain sits unused past your chosen idle threshold, it is unloaded from memory to give your RAM back. In the terminal and in the local UI, this is shown as a little spirit ascending — gone to the light. It comes back instantly on the next failure.",
  },
  {
    q: "Can I run commands from the web UI?",
    a: "Yes — 'phantom graveyard' (alias 'phantom web') serves a séance table on 127.0.0.1:7313 where you can run real shell commands and watch the troupe react. It binds to loopback only, so nothing on your network can reach it. The public website you're reading is just a landing page; the séance lives on your machine.",
  },
  {
    q: "Which platforms are supported?",
    a: "Linux, macOS, and Windows — all with native shell hooks. zsh and bash on Linux/macOS use preexec/precmd and DEBUG traps; Windows PowerShell (7 and 5.1) uses a prompt hook that reads $LASTEXITCODE. WSL follows the Linux path. The installer auto-detects your OS, shell, and package manager.",
  },
  {
    q: "Where exactly is my data, and who can read it?",
    a: "In ~/.phantom — plain JSONL files and one local SQL index. You can audit everything with cat. Nothing is sent anywhere unless you opt into a documented extra. Delete the folder and the ghosts are truly gone.",
  },
  {
    q: "Can I host the landing page myself?",
    a: "Yes — the source zip includes the site/ folder. It's a static Next.js export: run npm install && npm run build, then serve site/out with any static host (Render static site, GitHub Pages, Netlify, Cloudflare Pages, or a plain file server). Because the download bundle is served from /public, your self-hosted copy serves its own zip automatically.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="questions from the living"
        title="Séance etiquette"
      />
      <Reveal>
        <Accordion type="single" collapsible className="w-full">
          {QA.map((item, i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-border/60">
              <AccordionTrigger className="text-left font-[family-name:var(--font-geist-mono)] text-[13.5px] text-bone hover:text-marigold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[13.5px] leading-relaxed text-ash">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
