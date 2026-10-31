"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#troupe", label: "The Troupe" },
  { href: "#seance", label: "Séance" },
  { href: "#download", label: "Summon" },
  { href: "#architecture", label: "Anatomy" },
  { href: "#grimoire", label: "Docs" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "backdrop-blur-md bg-void/70 border-b border-border/60" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="group flex items-center gap-2.5" aria-label="Phantom Troupe home">
          <img src="/sigil.svg" alt="" className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[360deg]" />
          <span className="font-[family-name:var(--font-cinzel)] text-sm font-bold tracking-[0.22em] text-bone">
            PHANTOM<span className="text-marigold">·</span>TROUPE
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] uppercase tracking-widest text-ash transition-colors hover:text-marigold"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#download"
            className="rounded-md bg-marigold px-4 py-2 text-[13px] font-semibold uppercase tracking-widest text-void transition-all hover:bg-candle hover:shadow-[0_0_24px_rgba(247,155,46,0.5)]"
          >
            Install
          </a>
        </div>

        <button
          className="md:hidden text-bone p-2"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-border/60 bg-void/95 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-6 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm uppercase tracking-widest text-ash hover:text-marigold"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
