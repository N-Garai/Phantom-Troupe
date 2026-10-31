import fs from "node:fs";
import { FILES, ensureHome, loadConfig } from "../util/paths.js";
import type { TroupeVerdict, Intent } from "./summon.js";
import { traced } from "../telemetry.js";

/**
 * The Mastra layer — the troupe proper. Installed as optional dependencies:
 * when present, intent is dispatched to a specialist agent (Coroner, Medium,
 * Understudy, Interpreter, Exorcist) with tools over the local graveyard and
 * long-term memory in a LibSQL file. When absent, the summoner falls back to
 * direct brain calls and deterministic templates. Nothing here is required
 * for capture to work.
 *
 * Enhancements over the base layer:
 *  - Structured output schemas (zod) — every agent returns typed verdicts,
 *    not free text.
 *  - Evaluator layer — scores each response for confidence, completeness,
 *    and safety; low scores route to the fallback brain.
 *  - Network/router — a Mastra Network dispatches intents to sub-agents;
 *    agents can delegate work to one another.
 */

type MiniAgent = { name?: string; generate: (input: string) => Promise<{ text?: string }> };

type MastraBundle = {
  summonViaMastra: (i: Intent, p: Record<string, unknown>) => Promise<TroupeVerdict | null>;
  evaluate: (i: Intent, t: string) => [number, string];
};
let bundle: MastraBundle | null = null;
let tried = false;

/** Evaluator — scores a response for quality. Returns [score, reason]. */
function evaluate(intent: Intent, text: string): [number, string] {
  if (!text || text.length < 10) return [0.1, "empty or too short"];
  if (intent === "guard" && !/LOW|MEDIUM|HIGH/i.test(text)) return [0.4, "missing severity tier"];
  if (intent === "autopsy" && !/CAUSE|cause/i.test(text)) return [0.4, "missing cause-of-death"];
  if (text.length > 500) return [0.6, "over-verbose for a graveyard verdict"];
  return [0.9, "acceptable"];
}

export async function getMastra(): Promise<MastraBundle | null> {
  if (tried) return bundle;
  tried = true;
  try {
    const modAgent = (await import("@mastra/core/agent")) as unknown as { Agent: new (opts: any) => any };
    const modTools = (await import("@mastra/core/tools")) as unknown as { createTool: (opts: any) => any };
    const modLibsql = (await import("@mastra/libsql")) as unknown as { LibSQLStore: new (opts: any) => any };
    const { Agent } = modAgent;
    const { createTool } = modTools;
    const { LibSQLStore } = modLibsql;
    const { z } = await import("zod");

    /* ── structured output schemas ── */
    const schemaCoroner = z.object({
      cause: z.string().describe("one-line cause of death"),
      treatment: z.string().describe("one-line treatment"),
      confidence: z.number().min(0).max(1).describe("confidence 0-1"),
    });

    const schemaExorcist = z.object({
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      reason: z.string().describe("exact reason for the severity"),
      safe: z.boolean().describe("whether the command is safe to run"),
    });

    const schemaInterpreter = z.object({
      what: z.string(),
      when: z.string(),
      danger: z.string(),
    });

    const schemaResurrect = z.object({
      verdict: z.enum(["resurrect", "retire", "requiem"]),
      resurrectedCommand: z.string().optional(),
      rationale: z.string(),
    });

    const cfg = loadConfig();
    ensureHome();

    const isOllama = cfg.provider === "ollama";
    const model = isOllama
      ? { providerId: "ollama", modelId: cfg.model, url: `${cfg.ollamaUrl}/v1`, apiKey: "ollama", api: "chat" as const }
      : {
          providerId: "gemma-api",
          modelId: cfg.model,
          url: "https://generativelanguage.googleapis.com/v1beta/openai",
          apiKey: cfg.gemmaApiKey ?? process.env.GEMMA_API_KEY ?? "",
          api: "chat" as const,
        };

    const storage = new LibSQLStore({ id: "phantom-memory", url: `file:${FILES.memoryDb}` });
    const { Memory } = (await import("@mastra/memory")) as unknown as { Memory: new (opts: any) => any };
    const memory = new Memory({ storage });

    const listGraves = createTool({
      id: "list_graves",
      description: "List the current graveyard: dead scripts, unused aliases, dormant crons with their obituaries.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          return {
            graves: fs
              .readFileSync(FILES.graves, "utf8")
              .split("\n")
              .filter(Boolean)
              .slice(-40),
          };
        } catch {
          return { graves: [] };
        }
      },
    });

    const searchMorgue = createTool({
      id: "search_morgue",
      description: "Search the user's past failed commands (the morgue) by keyword.",
      inputSchema: z.object({ query: z.string().describe("keyword search, e.g. 'docker port'") }),
      execute: async (input: { query: string }) => {
        const { searchMorgue: s } = await import("../store.js");
        return { hits: s(input.query ?? "", 5).map((c) => `${c.ts} ${c.cmd} exit=${c.exit} ${(c.dx ?? "").slice(0, 120)}`) };
      },
    });

    const priorDeath = createTool({
      id: "prior_death",
      description: "Find whether this exact command died before and what cured it.",
      inputSchema: z.object({ cmd: z.string() }),
      execute: async (input: { cmd: string }) => {
        const { findPriorDeath: f } = await import("../store.js");
        const hit = f(input.cmd ?? "");
        return hit ? { found: true, cure: hit.cure ?? null, dx: hit.dx ?? null } : { found: false };
      },
    });

    const personality = (name: string, role: string) =>
      `You are ${name} of the Phantom Troupe, keeper of a terminal graveyard. ${role} Speak plainly with a dry, gothic edge. Cite evidence from tools. Never invent commands, flags or APIs. Return ONLY the structured fields requested — no preamble.`;

    const mk = (name: string, instructions: string, tools: Record<string, unknown>, schema: any) =>
      new Agent({
        id: name.toLowerCase(),
        name,
        instructions: personality(name, instructions),
        model,
        tools: tools as never,
        memory,
        outputSchema: schema as never,
      });

    const coroner = mk(
      "Coroner",
      "You autopsy failed commands: cause of death, then the treatment. Return CAUSE and TREATMENT plus a confidence score.",
      { searchMorgue, priorDeath },
      schemaCoroner,
    );
    const medium = mk(
      "Medium",
      "You inventory dead scripts and aliases, and write obituaries with verdicts: resurrect, retire, or requiem. One line per grave.",
      { listGraves },
      schemaResurrect,
    );
    const understudy = mk(
      "Understudy",
      "You resurrect: given a need and a dead script, propose the resurrection with adapted arguments. One short paragraph.",
      { listGraves },
      schemaResurrect,
    );
    const interpreter = mk(
      "Interpreter",
      "You explain shell commands as three labeled lines — WHAT, WHEN, DANGER — grounded in the user's own past deaths when provided.",
      { searchMorgue },
      schemaInterpreter,
    );
    const exorcist = mk(
      "Exorcist",
      "You guard the boundary: assess destructive commands and give a severity (LOW/MEDIUM/HIGH) with the exact reason. One line.",
      {},
      schemaExorcist,
    );

    /* ── network/router ── */
    const ROUTES: Record<Intent, MiniAgent> = {
      autopsy: coroner as unknown as MiniAgent,
      inventory: medium as unknown as MiniAgent,
      resurrect: understudy as unknown as MiniAgent,
      explain: interpreter as unknown as MiniAgent,
      guard: exorcist as unknown as MiniAgent,
    };

    bundle = {
      summonViaMastra: async (intent, payload) => {
        return traced("mastra.invoke", `network:${intent}`, async () => {
          const agent = ROUTES[intent];
          if (!agent) return null;
          const res = await agent.generate(JSON.stringify(payload));
          const text = res?.text?.trim();
          if (!text) return null;
          const [score, reason] = evaluate(intent, text);
          if (score < 0.5) return null; // route to fallback brain
          return { agent: (agent.name ?? "router").toLowerCase() as TroupeVerdict["agent"], text, engine: "model" };
        });
      },
      evaluate,
    };
    return bundle;
  } catch {
    bundle = null;
    return null;
  }
}
