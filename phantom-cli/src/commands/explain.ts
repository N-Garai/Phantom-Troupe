import { summon } from "../agents/summon.js";
import { say } from "../util/log.js";

/**
 * `phantom explain "<cmd>"` — let the Interpreter break down a command:
 * WHAT it does, WHEN to use it, DANGERS. Grounded in your own morgue.
 */
export async function explain(cmd: string): Promise<void> {
  if (!cmd) {
    say.blood(" the Interpreter needs words — pass a command: phantom explain 'tar -xzf'");
    process.exitCode = 1;
    return;
  }

  say.gold(" the Interpreter reads the scroll…");
  const verdict = await summon("explain", { cmd });

  console.log("");
  say.bone(" WHAT / WHEN / DANGER:");
  verdict.text.split("\n").forEach((l) => console.log("  " + l));
  console.log("");
  say.dim(" engine: " + verdict.engine + " · agent: " + verdict.agent);
}
