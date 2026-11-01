import fs from "node:fs";
import { readGraves, upsertGrave, type Grave } from "../store.js";
import { summon } from "../agents/summon.js";
import { say } from "../util/log.js";

/**
 * `phantom resurrect <name> [--apply]` — the Understudy proposes (and, with
 * --apply, performs) a resurrection of a dead script. Dry-run shows a diff;
 * --apply rewrites the script's args and records the new verdict.
 */
export async function resurrect(name: string, apply: boolean): Promise<void> {
  const graves: Grave[] = readGraves();
  const grave = graves.find((g) => g.name === name || g.id === `script:${name}` || g.id === name);
  if (!grave) {
    say.blood(` no grave named '${name}' — run 'phantom seance' to inventory the dead first.`);
    process.exitCode = 1;
    return;
  }
  if (grave.kind !== "script") {
    say.blood(` '${name}' is a ${grave.kind}, not a script — only scripts can be resurrected.`);
    process.exitCode = 1;
    return;
  }

  const targetPath = grave.path;
  if (!targetPath) {
    say.blood(` no path recorded for '${name}' — cannot resurrect without a body.`);
    process.exitCode = 1;
    return;
  }

  let original: string;
  try {
    original = fs.readFileSync(targetPath, "utf8");
  } catch {
    say.blood(` the script at '${targetPath}' no longer exists — it has truly passed.`);
    process.exitCode = 1;
    return;
  }

  say.gold(` the Understudy examines '${name}'…`);
  const verdict = await summon("resurrect", { grave });
  console.log("");
  say.bone(" VERDICT:");
  console.log(`  ${verdict.text}`);
  console.log("");

  if (!apply) {
    say.dim(" dry-run only — add --apply to rewrite the script.");
    say.dim(` engine: ${verdict.engine} · agent: ${verdict.agent}`);
    return;
  }

  // Apply: append a resurrection banner comment at the top of the script
  const banner = `# resurrected by the Phantom Troupe on ${new Date().toISOString()}\n`;
  const rewritten = banner + original;
  fs.writeFileSync(targetPath, rewritten);

  // Record the resurrection as a new grave with updated verdict
  const updated: Grave = {
    ...grave,
    verdict: "resurrect",
    summary: `resurrected via 'phantom resurrect --apply ${name}' — banner prepended`,
  };
  upsertGrave(updated);

  console.log("");
  say.gold(" DIFF (prepended resurrection banner):");
  console.log(`   +${banner.trimEnd()}`);
  console.log("");
  say.spectre(` '${name}' resurrected — body walks again at ${targetPath}`);
  say.dim(` engine: ${verdict.engine} · agent: ${verdict.agent}`);
}
