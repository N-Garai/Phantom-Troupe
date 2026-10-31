import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const PAPERS = [
  {
    cite: "Fischer, F., Böttinger, K., Xiao, H., Stransky, C., Acar, Y., Backes, M., & Fahl, S. — “Stack Overflow Considered Harmful? The Impact of Copy-Paste on Android Application Security”",
    venue: "IEEE Symposium on Security & Privacy, 2017 · doi:10.1109/SP.2017.31 · pp. 121–136",
    insight:
      "Developers paste working-looking code without understanding it, and vulnerabilities ride along. The terminal is the purest form of this behavior — which is why explanations must arrive inside the shell, not in another tab.",
  },
  {
    cite: "Potdar, A. & Shihab, E. — “An Exploratory Study of Self-Admitted Technical Debt”",
    venue: "IEEE ICSME, 2014",
    insight:
      "Thousands of TODO/FIXME comments across major codebases are developers confessing debt in place — and almost none of it is ever tracked. Dead scripts and half-finished helpers are the shell equivalent; the Medium files them instead of letting them rot.",
  },
  {
    cite: "Avelino, G., et al. — “On the Abandonment and Survival of Open Source Projects”",
    venue: "ESEM, 2019",
    insight:
      "Abandoned work survives only when someone new inherits it — and the bottleneck is tacit knowledge transfer. Resurrection with context (why it was written, what it fixed) is exactly what the graveyard stores.",
  },
  {
    cite: "Coelho, J. & Valente, M. T. — “Why Modern Open Source Projects Fail”",
    venue: "ACM FSE, 2017",
    insight:
      "Loss of maintainer interest — not technical failure — kills most projects. Personal tooling dies the same quiet death: the utility script you loved and forgot. The troupe keeps its obituary warm.",
  },
  {
    cite: "Luo, Q., Hariri, F., Eloussi, L., & Marinov, D. — “An Empirical Analysis of Flaky Tests”",
    venue: "ACM FSE, 2014 · doi:10.1145/2635868.2635920 · pp. 643–653",
    insight:
      "Intermittent failures consume enormous engineering time because context dies with each occurrence. The Coroner's repeat-death memory applies the same lesson to your shell: recurring deaths are recognized, and the prior cure is recalled.",
  },
];

export function Research() {
  return (
    <section id="research" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHeading
        eyebrow="the scholarly dead"
        title="Buried in the literature"
        blurb="The troupe isn't a vibe — each ghost is built on published findings about how developers actually fail, paste, abandon, and forget."
      />

      <div className="space-y-4">
        {PAPERS.map((p, i) => (
          <Reveal key={p.venue} delay={i * 0.05}>
            <article className="rounded-xl border border-border/70 bg-crypt/70 p-5 transition-colors hover:border-marigold/40 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="max-w-3xl font-[family-name:var(--font-geist-mono)] text-[13.5px] font-semibold leading-relaxed text-bone">
                  {p.cite}
                </h3>
                <span className="shrink-0 rounded-full border border-violetsmoke/50 bg-violetsmoke/10 px-3 py-1 font-[family-name:var(--font-geist-mono)] text-[10.5px] uppercase tracking-widest text-violetsmoke">
                  {p.venue}
                </span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ash">{p.insight}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
