import { FILES, ensureHome } from "../util/paths.js";
export async function buildSeanceWorkflow(collectors) {
    try {
        const wfMod = (await import("@mastra/core/workflows"));
        const { createStep, createWorkflow } = wfMod;
        // Mastra's engine speaks the zod v4 dialect; without it, no trace layer —
        // the fallback engine in seance.ts takes over.
        const { z } = await import("zod");
        const fs = (await import("node:fs")).default;
        let found = [];
        let added = 0;
        const Count = z.object({ count: z.number() });
        const Added = z.object({ added: z.number(), total: z.number() });
        const inventory = createStep({
            id: "inventory-the-dead",
            description: "Sweep ~/bin, ~/.local/bin, rc-file aliases and the crontab for the dead.",
            inputSchema: Count,
            outputSchema: Count,
            execute: async () => {
                found = await collectors.inventory();
                return { count: found.length };
            },
        });
        const obituaries = createStep({
            id: "write-the-obituaries",
            description: "Interrogate every new ghost and file a verdict: resurrect, retire, or requiem.",
            inputSchema: Count,
            outputSchema: Added,
            execute: async () => {
                try {
                    const prior = await fs.promises.readFile(FILES.graves, "utf8").catch(() => "");
                    const beforeIds = new Set(prior
                        .split("\n")
                        .filter(Boolean)
                        .map((l) => {
                        try {
                            return JSON.parse(l).id;
                        }
                        catch {
                            return "";
                        }
                    })
                        .filter(Boolean));
                    added = await collectors.applyObituaries(found, beforeIds);
                    return { added, total: added + beforeIds.size };
                }
                finally {
                    found = [];
                }
            },
        });
        const ledger = createStep({
            id: "stamp-the-ledger",
            description: "Write the séance stamp so the graveyard knows when it was last tended.",
            inputSchema: Added,
            outputSchema: Added,
            execute: async (ctx) => {
                ensureHome();
                fs.writeFileSync(FILES.seanceStamp, new Date().toISOString());
                return ctx.inputData;
            },
        });
        const wf = createWorkflow({
            id: "phantom-seance",
            description: "The nightly graveyard sweep: inventory the dead, write obituaries, stamp the ledger.",
            inputSchema: Count,
            outputSchema: Added,
        });
        wf.then(inventory)
            .then(obituaries)
            .then(ledger)
            .commit();
        return {
            run: async () => {
                const run = await wf.createRun();
                const res = (await run.start({ inputData: { count: 0 } }));
                if (res?.status !== "success")
                    return null;
                return { added: res.result?.added ?? added, total: res.result?.total ?? 0 };
            },
        };
    }
    catch {
        return null;
    }
}
