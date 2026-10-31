import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { FILES, ensureHome } from "./util/paths.js";
import { upsertGrave, readCommandsForUsage, readGraves, type Grave } from "./store.js";
import { summon } from "./agents/summon.js";
import { traced } from "./telemetry.js";

const run = promisify(exec);

/**
 * The Medium's nightly sweep: inventory the dead of the shell — untouched
 * one-off scripts, unused aliases, dormant crons — interrogate each, and file
 * obituaries with verdicts: resurrect, retire, or requiem.
 *
 * Under the open agent framework this runs as a traced three-step workflow
 * (see workflows/seance.ts); without the machinery the exact same three acts
 * run by hand.
 */

type GraveCandidate = Grave;

async function collectCandidates(): Promise<GraveCandidate[]> {
  const found: GraveCandidate[] = [];

  // 1) dead one-off scripts
  for (const dir of ["bin", ".local/bin"].map((d) => path.join(os.homedir(), d))) {
    try {
      const entries = fs.readdirSync(dir);
      for (const name of entries) {
        const p = path.join(dir, name);
        try {
          const st = fs.statSync(p);
          if (!st.isFile()) continue;
          const days = Math.floor((Date.now() - st.mtimeMs) / 86_400_000);
          if (days < 90) continue;
          const usage = await usageCount(name);
          found.push({
            id: `script:${p}`,
            kind: "script",
            name,
            path: p,
            lastTouched: st.mtime.toISOString(),
            daysDead: days,
            summary: usage === 0 ? `untouched ${days} days, never seen in captured commands` : `untouched ${days} days, ${usage} captured uses`,
          });
        } catch {
          /* unreadable — skip */
        }
      }
    } catch {
      /* no such dir */
    }
  }

  // 2) aliases defined in the rc files
  const rcs = [".zshrc", ".bashrc", path.join(os.homedir(), "Documents", "PowerShell", "profile.ps1"), path.join(os.homedir(), "Documents", "WindowsPowerShell", "profile.ps1")];

  for (const f of rcs) {
    try {
      const content = fs.readFileSync(f, "utf8");
      const isPs = f.endsWith(".ps1");
      const re = isPs ? /(?:^|\n)\s*(?:Set-Alias|-Name|function)\s+([A-Za-z0-9_-]+)/g : /^\s*alias\s+([A-Za-z0-9_-]+)=/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content))) {
        const name = m[1];
        if (name.startsWith("phantom")) continue;
        const usage = await usageCount(name);
        if (usage > 0) continue;
        found.push({
          id: `alias:${name}`,
          kind: "alias",
          name,
          path: f,
          summary: `defined but never used in captured commands`,
        });
      }
    } catch {
      /* no rc */
    }
  }

  // 3) crontab entries (unix only)
  if (process.platform !== "win32") {
    try {
      const { stdout } = await run("crontab -l", { timeout: 4000 });
      for (const line of stdout.split("\n")) {
        const l = line.trim();
        if (!l || l.startsWith("#")) continue;
        const name = l.split(/\s+/).slice(5).join(" ").split("/").pop() ?? l;
        found.push({
          id: `cron:${l}`,
          kind: "cron",
          name: name.slice(0, 60),
          summary: `scheduled: ${l.slice(0, 40)}`,
        });
      }
    } catch {
      /* no crontab */
    }
  }

  return found;
}

export async function runSeance(): Promise<{ graves: Grave[]; added: number }> {
  ensureHome();
  const before = new Set(await traced("seance", "read existing graves", async () => readGraves().map((g) => g.id)));

  // the workflow engine, when installed; the acts below are its fallback
  const { buildSeanceWorkflow } = await import("./workflows/seance.js");
  const wf = await buildSeanceWorkflow({
    inventory: () => traced("seance", "inventory the dead", collectCandidates),
    applyObituaries: (found, beforeIds) =>
      traced("seance", "write the obituaries", async () => applyObituaries(found as GraveCandidate[], beforeIds as Set<string>)),
  }).catch(() => null);

  let added = 0;
  let graves: Grave[] = [];
  if (wf) {
    const viaWf = await wf.run().catch(() => null);
    if (viaWf) {
      added = viaWf.added;
      graves = readGraves();
      return { graves, added };
    }
  }

  // fallback: the three acts, by hand
  const candidates = await traced("seance", "inventory the dead", collectCandidates);
  added = await traced("seance", "write the obituaries", async () => applyObituaries(candidates, before));
  graves = readGraves();

  fs.writeFileSync(FILES.seanceStamp, new Date().toISOString());
  return { graves, added };
}

async function applyObituaries(found: GraveCandidate[], beforeIds: Set<string>): Promise<number> {
  let added = 0;
  for (const g of found) {
    if (beforeIds.has(g.id)) continue;
    added++;
    const v = await summon("inventory", { grave: g }).catch(() => null);
    g.verdict = guessVerdict(g, v?.text);
    g.summary = v?.text ? g.summary + " — " + v.text.split("\n")[0].slice(0, 120) : g.summary;
    upsertGrave(g);
  }
  return added;
}

function guessVerdict(g: Grave, mediumText?: string): Grave["verdict"] {
  const t = (mediumText ?? "").toLowerCase();
  if (t.includes("resurrect")) return "resurrect";
  if (t.includes("requiem") || t.includes("delete") || t.includes("remove")) return "requiem";
  if (t.includes("retire")) return "retire";
  if ((g.daysDead ?? 0) > 365) return "requiem";
  if ((g.daysDead ?? 0) > 90) return "retire";
  return "resurrect";
}

async function usageCount(needle: string): Promise<number> {
  try {
    const cmds = await readCommandsForUsage();
    const re = new RegExp(`(^|[\\s/"']|)${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s"']|$)`);
    return cmds.filter((c) => re.test(c)).length;
  } catch {
    return 0;
  }
}
