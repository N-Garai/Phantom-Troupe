import { loadConfig, type Config } from "./util/paths.js";
import { askOllama, ollamaAlive } from "./providers/ollama.js";
import { askGemmaApi } from "./providers/gemma.js";

export type Brain = {
  available: () => Promise<boolean>;
  ask: (system: string, user: string, timeoutMs?: number) => Promise<{ text: string }>;
};

/** The brain never leaves the machine unless the user opts into the Gemma API. */
export function getBrain(cfg = loadConfig()): Brain {
  if (cfg.provider === "gemma-api") {
    return {
      available: async () => Boolean(cfg.gemmaApiKey ?? process.env.GEMMA_API_KEY),
      ask: (system, user, timeoutMs) => askGemmaApi(cfg, system, user, timeoutMs),
    };
  }
  return {
    available: () => ollamaAlive(cfg),
    ask: (system, user, timeoutMs) => askOllama(cfg, system, user, timeoutMs),
  };
}

export type { Config };
