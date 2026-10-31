import { readGraves, readMorgue, searchMorgue, findPriorDeath, type Grave, type Corpse } from "../store.js";
import { traced } from "../telemetry.js";

/**
 * The five specialists. They run on the open agent framework when it is
 * installed; otherwise the troupe falls back to deterministic templates so
 * capture, memory and the UI work on even the humblest machine.
 * Every degree of intelligence is wrapped in a trace span (opt-in Sentry),
 * so the séance is always auditable after the fact.
 */

export type Intent = "autopsy" | "inventory" | "resurrect" | "explain" | "guard";

export type TroupeVerdict = {
  agent: "coroner" | "medium" | "understudy" | "interpreter" | "exorcist" | "router";
  text: string;
  engine: "model" | "fallback";
};

const CORONER_SYSTEM = `You are the Coroner of a terminal graveyard. Given a failed command, its exit code and stderr tail, write a cause-of-death report: one line for cause, one line for the likely treatment. Be exact, dry, slightly gothic. Never invent flags or APIs. If unsure, say what you would check first.`;

const INTERPRETER_SYSTEM = `You are the Interpreter of a terminal graveyard. Explain a shell command: WHAT it does, WHEN to use it, and its DANGERS. Three short labeled lines (what / when / danger). Ground every claim; cite the user's own past failures when provided. Never invent flags.`;

const EXORCIST_SYSTEM = `You are the Exorcist, guardian of the boundary of a terminal graveyard. Given a command (and a deterministic severity flag), write ONE line: confirm, correct, or deepen the severity assessment. Dry, gothic, exact. Never invent flags.`;

function summarizeCorpse(c: Corpse): string {
  return `command: ${c.cmd}\nexit: ${c.exit}\nstderr: ${(c.stderrTail ?? "(none)").slice(0, 400)}`;
}

export async function summon(intent: Intent, payload: Record<string, unknown>): Promise<TroupeVerdict> {
  return traced("ai.invoke", `troupe:${intent}`, async () => {
    const { getBrain } = await import("../brain.js");
    const brain = getBrain();

    const brainUp = await brain.available().catch(() => false);
    if (!brainUp) return fallback(intent, payload);

    // 1) the troupe proper (open agent framework) — if installed
    try {
      const { getMastra } = await import("./mastra.js");
      const m = await getMastra();
      if (m) {
        const viaMastra = await m.summonViaMastra(intent, payload);
        if (viaMastra) return viaMastra;
      }
    } catch {
      /* fall through */
    }

    // 2) direct brain call
    try {
      if (brainUp) {
        if (intent === "autopsy") {
          const prior = findPriorDeath(String(payload.cmd ?? ""));
          const user =
            summarizeCorpse(payload as unknown as Corpse) +
            (prior?.cure ? `\n\nA prior identical death was cured with: ${prior.cure}` : "") +
            `\n\nReply in exactly two lines:\nCAUSE: ...\nTREATMENT: ...`;
          const r = await brain.ask(CORONER_SYSTEM, user);
          return { agent: "coroner", text: r.text, engine: "model" };
        }
        if (intent === "explain") {
          const hits = searchMorgue(String(payload.cmd ?? ""), 3);
          const user =
            `Command: ${payload.cmd}\n` +
            (hits.length ? `The user's own deaths involving this:\n${hits.map(summarizeCorpse).join("\n")}` : "") +
            `\n\nReply as:\nWHAT: ...\nWHEN: ...\nDANGER: ...`;
          const r = await brain.ask(INTERPRETER_SYSTEM, user);
          return { agent: "interpreter", text: r.text, engine: "model" };
        }
        if (intent === "guard") {
          const g = payload.guard as { severity?: string; pattern?: string; reason?: string } | undefined;
          const user = `Command: ${payload.cmd ?? ""}\nDeterministic verdict: ${g?.severity ?? "unknown"} — ${g?.pattern ?? ""}: ${g?.reason ?? ""}\nConfirm or correct in ONE line, in character.`;
          const r = await brain.ask(EXORCIST_SYSTEM, user);
          return { agent: "exorcist", text: r.text, engine: "model" };
        }
      }
    } catch {
      /* fall through to fallback engine */
    }

    return fallback(intent, payload);
  });
}

async function fallback(intent: Intent, payload: Record<string, unknown>): Promise<TroupeVerdict> {
  if (intent === "autopsy") {
    const c = payload as unknown as Corpse;
    const tail = (c.stderrTail ?? "").toLowerCase();
    let cause = "cause of death: unknown — the body offers no confession.";
    if (tail.includes("not found")) cause = "cause of death: the invoked spirit does not exist on this PATH.";
    else if (tail.includes("command not found") || tail.includes("no such file or directory"))
      cause = "cause of death: the invoked spirit does not exist on this PATH.";
    else if (tail.includes("unrecognized option") || tail.includes("unknown option") || tail.includes("invalid option"))
      cause = "cause of death: handed a flag this spirit never learned (check --help).";
    else if (tail.includes("permission denied")) cause = "cause of death: the gatekeeper refused (permissions).";
    else if (tail.includes("econnrefused")) cause = "cause of death: nothing was listening where it knocked (connection refused).";
    else if (tail.includes("enoent")) cause = "cause of death: a path was named that has no body (ENOENT).";
    else if (tail.includes("port is already allocated") || tail.includes("address already in use"))
      cause = "cause of death: the port is haunted by a previous tenant.";
    else if (c.exit === 137 || tail.includes("killed")) cause = "cause of death: slain by the reaper of RAM (SIGKILL / OOM).";
    const prior = findPriorDeath(String(c.cmd ?? ""));
    const cure = prior?.cure ? `treatment that worked before: ${prior.cure}` : "treatment: inspect the stderr trail; the Coroner will file this death for next time.";
    return { agent: "coroner", text: `${cause}\n${cure}`, engine: "fallback" };
  }
  if (intent === "explain") {
    return {
      agent: "interpreter",
      text: `WHAT: (offline brain) install a local open-weight model, or set provider to gemma-api, for full explanations.\nWHEN: capture continues regardless — every failure is already filed.\nDANGER: none of this leaves your machine either way.`,
      engine: "fallback",
    };
  }
  if (intent === "inventory") {
    const graves: Grave[] = readGraves();
    const dead = graves.filter((g) => (g.daysDead ?? 0) > 90).length;
    return { agent: "medium", text: `${graves.length} graves tended, ${dead} older than 90 days.`, engine: "fallback" };
  }
  if (intent === "guard") {
    const { exorcistBark } = await import("../guard.js");
    const g = payload.guard as Parameters<typeof exorcistBark>[0] | undefined;
    return g
      ? { agent: "exorcist", text: exorcistBark(g), engine: "fallback" }
      : { agent: "exorcist", text: "[EXORCIST] nothing here that I fear.", engine: "fallback" };
  }
  return { agent: "router", text: "the troupe heard you.", engine: "fallback" };
}

export function morgueContext(): Corpse[] {
  return readMorgue(20);
}
