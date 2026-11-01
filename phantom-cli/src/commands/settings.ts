import readline from "node:readline/promises";
import { FILES, ensureHome, loadConfig, saveConfig } from "../util/paths.js";
import { say } from "../util/log.js";

/**
 * Interactive setup for the troupe's brain.
 * Prompts once for provider (Ollama local vs Gemma API) and, if Gemma API,
 * the API key which is stored in ~/.phantom/config.json (local only, never
 * sent anywhere except the model endpoint). Re-run anytime via `phantom settings`.
 */
export async function settings(): Promise<void> {
  ensureHome();
  const cfg = loadConfig();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q: string): Promise<string> => rl.question(q);

  say.bone("┌─ Phantom Troupe — Settings");
  say.dim("│");
  say.dim(`│ Current provider: ${cfg.provider}`);
  say.dim(`│ Current model: ${cfg.model}`);
  if (cfg.provider === "gemma-api") say.dim("│ Gemma API key:  •••••••• (stored locally)");
  say.dim("│");
  say.dim("│ Choose your brain:");
  say.dim("│   1) Ollama — local model (gemma3:4b), offline, free, nothing leaves your machine");
  say.dim("│   2) Gemma API — remote open-weight model via Google's API (needs API key)");
  say.dim("│");

  const choice = (await question("│ Select (1 or 2): ")).trim();
  const provider = choice === "2" ? "gemma-api" : "ollama";
  let model = "";
  let gemmaApiKey = cfg.gemmaApiKey ?? "";

  if (provider === "gemma-api") {
    say.dim("│");
    say.dim("│ Enter your Gemma API key — stored in ~/.phantom/config.json (local only):");
    gemmaApiKey = (await question("│ API key: ")).trim();
    say.dim("│");
    model = (await question("│ Model [gemma-4-26b-a4b-it]: ")).trim() || "gemma-4-26b-a4b-it";
  } else {
    model = (await question("│ Model [gemma3:4b]: ")).trim() || "gemma3:4b";
  }

  const idle = (await question(`│ Idle unload minutes [${cfg.idleUnloadMinutes}]: `)).trim();
  const idleUnloadMinutes = idle ? Math.min(60, Math.max(1, parseInt(idle, 10))) : cfg.idleUnloadMinutes;

  rl.close();

  const next: typeof cfg = {
    ...cfg,
    provider,
    model,
    idleUnloadMinutes,
    ...(provider === "gemma-api" && gemmaApiKey ? { gemmaApiKey } : {}),
  };

  saveConfig(next);

  say.gold("└ Settings saved to ~/.phantom/config.json");
  say.dim(`   provider: ${provider}  model: ${model}`);
  if (provider === "gemma-api" && gemmaApiKey) say.dim("   gemma-api key: stored locally");
  say.dim("   Run 'phantom' to wake the troupe with the new brain.");
}
