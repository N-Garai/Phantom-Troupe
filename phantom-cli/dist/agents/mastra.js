import fs from "node:fs";
import { FILES, ensureHome, loadConfig } from "../util/paths.js";
let bundle = null;
let tried = false;
export async function getMastra() {
    if (tried)
        return bundle;
    tried = true;
    try {
        const modAgent = (await import("@mastra/core/agent"));
        const modTools = (await import("@mastra/core/tools"));
        const modLibsql = (await import("@mastra/libsql"));
        const { Agent } = modAgent;
        const { createTool } = modTools;
        const { LibSQLStore } = modLibsql;
        const { z } = await import("zod");
        const cfg = loadConfig();
        ensureHome();
        const isOllama = cfg.provider === "ollama";
        const model = isOllama
            ? { providerId: "ollama", modelId: cfg.model, url: `${cfg.ollamaUrl}/v1`, apiKey: "ollama", api: "chat" }
            : {
                providerId: "gemma-api",
                modelId: cfg.model,
                url: "https://generativelanguage.googleapis.com/v1beta/openai",
                apiKey: process.env.GEMMA_API_KEY ?? "",
                api: "chat",
            };
        const storage = new LibSQLStore({ id: "phantom-memory", url: `file:${FILES.memoryDb}` });
        const { Memory } = (await import("@mastra/memory"));
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
                }
                catch {
                    return { graves: [] };
                }
            },
        });
        const searchMorgue = createTool({
            id: "search_morgue",
            description: "Search the user's past failed commands (the morgue) by keyword.",
            inputSchema: z.object({ query: z.string().describe("keyword search, e.g. 'docker port'") }),
            execute: async (input) => {
                const { searchMorgue: s } = await import("../store.js");
                return { hits: s(input.query ?? "", 5).map((c) => `${c.ts} ${c.cmd} exit=${c.exit} ${(c.dx ?? "").slice(0, 120)}`) };
            },
        });
        const priorDeath = createTool({
            id: "prior_death",
            description: "Find whether this exact command died before and what cured it.",
            inputSchema: z.object({ cmd: z.string() }),
            execute: async (input) => {
                const { findPriorDeath: f } = await import("../store.js");
                const hit = f(input.cmd ?? "");
                return hit ? { found: true, cure: hit.cure ?? null, dx: hit.dx ?? null } : { found: false };
            },
        });
        const personality = (name, role) => `You are ${name} of the Phantom Troupe, keeper of a terminal graveyard. ${role} Speak plainly with a dry, gothic edge. Cite evidence from tools. Never invent commands, flags or APIs.`;
        const mk = (name, instructions, tools) => new Agent({
            id: name.toLowerCase(),
            name,
            instructions: personality(name, instructions),
            model,
            tools: tools,
            memory,
        });
        const coroner = mk("Coroner", "You autopsy failed commands: cause of death, then the treatment. Two lines: CAUSE, TREATMENT.", { searchMorgue, priorDeath });
        const medium = mk("Medium", "You inventory dead scripts and aliases, and write obituaries with verdicts: resurrect, retire, or requiem. One line per grave.", {
            listGraves,
        });
        const understudy = mk("Understudy", "You resurrect: given a need and a dead script, propose the resurrection with adapted arguments. One short paragraph.", {
            listGraves,
        });
        const interpreter = mk("Interpreter", "You explain shell commands as three labeled lines — WHAT, WHEN, DANGER — grounded in the user's own past deaths when provided.", {
            searchMorgue,
        });
        const exorcist = mk("Exorcist", "You guard the boundary: assess destructive commands and give a severity (LOW/MEDIUM/HIGH) with the exact reason. One line.", {});
        const ROUTES = {
            autopsy: coroner,
            inventory: medium,
            resurrect: understudy,
            explain: interpreter,
            guard: exorcist,
        };
        bundle = {
            summonViaMastra: async (intent, payload) => {
                const agent = ROUTES[intent];
                if (!agent)
                    return null;
                const res = await agent.generate(JSON.stringify(payload));
                const text = res?.text?.trim();
                if (!text)
                    return null;
                return { agent: (agent.name ?? "router").toLowerCase(), text, engine: "model" };
            },
        };
        return bundle;
    }
    catch {
        bundle = null;
        return null;
    }
}
