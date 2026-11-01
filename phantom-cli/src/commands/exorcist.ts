import { inspectGuard } from "../guard.js";
import { say } from "../util/log.js";

/**
 * `phantom guard "<cmd>"` — inspect a command for destructive patterns
 * before it runs. Exit code 2 on lethal/grave, 0 on clean.
 * Pure deterministic check — no model needed, no network, instant.
 */
export async function guard(cmd: string): Promise<void> {
  if (!cmd || cmd.length > 500) {
    say.blood(" the void cannot be guarded — nothing to inspect.");
    process.exitCode = 0;
    return;
  }

  const verdict = inspectGuard(cmd);
  if (!verdict) {
    say.spectre(" the Exorcist finds nothing here that he fears.");
    process.exitCode = 0;
    return;
  }

  const stamp = `[EXORCIST ${verdict.severity.toUpperCase()}]`;
  const line = `${stamp} ${verdict.pattern}: ${verdict.reason}.`;

  if (verdict.severity === "high") {
    say.blood(line);
    say.dim(" severity: lethal — this will not run unless you accept the hand.");
    process.exitCode = 2;
    return;
  }

  if (verdict.severity === "medium") {
    say.spectre(line);
    say.dim(" severity: grave — proceed if you must, but I am watching.");
    process.exitCode = 2;
    return;
  }

  say.spectre(line);
  say.dim(" severity: wary — a low shiver only.");
  process.exitCode = 0;
}
