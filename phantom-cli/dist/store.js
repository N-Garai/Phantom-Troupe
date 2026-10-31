import fs from "node:fs";
import { FILES, ensureHome, touchFile } from "./util/paths.js";
export function appendCorpus(c) {
    ensureHome();
    touchFile(FILES.morgue);
    touchFile(FILES.commands);
    fs.appendFileSync(FILES.morgue, JSON.stringify(c) + "\n");
    fs.appendFileSync(FILES.commands, JSON.stringify({ ts: c.ts, cmd: c.cmd, exit: c.exit }) + "\n");
    // commands.jsonl rolls at ~4000 lines — low-spec friendly
    const lines = fs.readFileSync(FILES.commands, "utf8").split("\n");
    if (lines.length > 4000)
        fs.writeFileSync(FILES.commands, lines.slice(-3000).join("\n"));
}
export function readMorgue(limit = 50) {
    try {
        return fs
            .readFileSync(FILES.morgue, "utf8")
            .split("\n")
            .filter(Boolean)
            .slice(-limit)
            .map((l) => JSON.parse(l))
            .reverse();
    }
    catch {
        return [];
    }
}
export function readGraves() {
    try {
        return fs
            .readFileSync(FILES.graves, "utf8")
            .split("\n")
            .filter(Boolean)
            .map((l) => JSON.parse(l));
    }
    catch {
        return [];
    }
}
export function writeGraves(g) {
    ensureHome();
    fs.writeFileSync(FILES.graves, g.map((x) => JSON.stringify(x)).join("\n") + (g.length ? "\n" : ""));
}
export function upsertGrave(g) {
    const all = readGraves().filter((x) => x.id !== g.id);
    all.unshift(g);
    writeGraves(all);
    return all;
}
/** keyword search across the morgue — the fallback when embeddings are unavailable */
export function searchMorgue(query, limit = 5) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = readMorgue(400).map((c) => {
        const hay = `${c.cmd} ${c.stderrTail ?? ""} ${c.dx ?? ""}`.toLowerCase();
        return { c, score: terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0) };
    });
    return scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.c);
}
/** find a previous identical failure and its recorded cure */
export function findPriorDeath(cmd) {
    return readMorgue(400).find((c) => c.cmd === cmd && (c.cure || c.dx));
}
/** rolling command log as plain strings (usage stats for the Medium) */
export async function readCommandsForUsage() {
    try {
        return fs
            .readFileSync(FILES.commands, "utf8")
            .split("\n")
            .filter(Boolean)
            .map((l) => {
            try {
                return JSON.parse(l).cmd ?? "";
            }
            catch {
                return "";
            }
        });
    }
    catch {
        return [];
    }
}
/** patch the most recent matching corpse (used when the Coroner files its report) */
export function updateLastCorpse(cmd, patch) {
    try {
        const lines = fs.readFileSync(FILES.morgue, "utf8").split("\n").filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
            const c = JSON.parse(lines[i]);
            if (c.cmd === cmd) {
                lines[i] = JSON.stringify({ ...c, ...patch });
                break;
            }
        }
        fs.writeFileSync(FILES.morgue, lines.join("\n") + "\n");
    }
    catch {
        /* the morgue is empty — nothing to patch */
    }
}
