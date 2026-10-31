import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { FILES, loadConfig, ensureHome } from "../util/paths.js";
import { uninstallHooks } from "../hooks.js";
import { say } from "../util/log.js";

/** `phantom stop` — the troupe sleeps; every bone is kept. */
export function stop(): void {
  try {
    const pid = parseInt(fs.readFileSync(FILES.daemonPid, "utf8").trim(), 10);
    process.kill(pid, "SIGTERM");
    say.gold(` the troupe sleeps (pid ${pid} released).`);
  } catch {
    say.dim(" no troupe was awake.");
  }
  say.dim(" all memory kept in ~/.phantom — 'phantom' wakes them again.");
}

/** `phantom status` — the roster. */
export function status(): void {
  const cfg = loadConfig();
  const alive = isAlive();
  let corpses = 0;
  let graves = 0;
  try {
    corpses = fs.readFileSync(FILES.morgue, "utf8").split("\n").filter(Boolean).length;
  } catch {}
  try {
    graves = fs.readFileSync(FILES.graves, "utf8").split("\n").filter(Boolean).length;
  } catch {}
  say.bone("┌─ troupe roster " + "─".repeat(34));
  say.bone(`│ helper      : ${alive ? "awake" : "asleep"}${alive ? ` (pid ${fs.readFileSync(FILES.daemonPid, "utf8").trim()})` : ""}`);
  say.bone(`│ brain       : ${cfg.provider} · ${cfg.model} · idle unload ${cfg.idleUnloadMinutes} min`);
  say.bone(`│ corpses     : ${corpses} filed in morgue.jsonl`);
  say.bone(`│ graves      : ${graves} tended in graves.jsonl`);
  say.bone("└" + "─".repeat(50));
}

function isAlive(): boolean {
  try {
    const pid = parseInt(fs.readFileSync(FILES.daemonPid, "utf8").trim(), 10);
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** `phantom uninstall` — hooks + timer + binary; asks before deleting bones. */
export async function uninstall(flags: { yes?: boolean }): Promise<void> {
  const touched = uninstallHooks();
  if (touched.length) say.gold(` hooks removed from: ${touched.join(", ")}`);
  else say.dim(" no hooks found");

  // stop the helper first
  try {
    const pid = parseInt(fs.readFileSync(FILES.daemonPid, "utf8").trim(), 10);
    process.kill(pid, "SIGTERM");
  } catch {}

  // timers
  try {
    execSync("systemctl --user disable --now phantom-seance.timer", { stdio: "ignore" });
    fs.rmSync(path.join(os.homedir(), ".config/systemd/user/phantom-seance.timer"), { force: true });
    fs.rmSync(path.join(os.homedir(), ".config/systemd/user/phantom-seance.service"), { force: true });
    say.dim(" nightly timer removed (systemd)");
  } catch {}
  try {
    execSync(`launchctl unload ${os.homedir()}/Library/LaunchAgents/dev.phantom.troupe.plist`, { stdio: "ignore" });
    fs.rmSync(path.join(os.homedir(), "Library/LaunchAgents/dev.phantom.troupe.plist"), { force: true });
    say.dim(" nightly timer removed (launchd)");
  } catch {}
  if (process.platform === "win32") {
    try {
      execSync("schtasks /delete /f /tn PhantomTroupeSeance", { stdio: "ignore" });
      say.dim(" nightly timer removed (schtasks)");
    } catch {
      /* no task */
    }
  }

  say.dim(" binary: npm i -g left in place — remove with: npm uninstall -g phantom-troupe");

  // the bones
  ensureHome();
  const bones = process.env.PHANTOM_HOME ?? path.join(os.homedir(), ".phantom");
  const removeBones = () => {
    fs.rmSync(bones, { recursive: true, force: true });
    say.blood(` bones deleted (${bones}) — the dead are truly gone.`);
  };
  if (flags.yes) {
    removeBones();
    return;
  }
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(` delete all graveyard data (${bones})? [y/N] `)).trim().toLowerCase();
  rl.close();
  if (answer === "y" || answer === "yes") {
    removeBones();
  } else {
    say.dim(" bones kept. the graveyard waits.");
  }
}
