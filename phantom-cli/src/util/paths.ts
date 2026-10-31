import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/** The bones live here. Everything is plain files you own. */
export const PHANTOM_HOME = process.env.PHANTOM_HOME ?? path.join(os.homedir(), ".phantom");

export const FILES = {
  config: path.join(PHANTOM_HOME, "config.json"),
  morgue: path.join(PHANTOM_HOME, "morgue.jsonl"),
  commands: path.join(PHANTOM_HOME, "commands.jsonl"),
  graves: path.join(PHANTOM_HOME, "graves.jsonl"),
  memoryDb: path.join(PHANTOM_HOME, "memory.db"),
  daemonPid: path.join(PHANTOM_HOME, "daemon.pid"),
  daemonLog: path.join(PHANTOM_HOME, "daemon.log"),
  seanceStamp: path.join(PHANTOM_HOME, "last-seance"),
};

export const DEFAULT_PORT = 7313;

export function ensureHome(): void {
  fs.mkdirSync(PHANTOM_HOME, { recursive: true });
}

export function touchFile(p: string): void {
  if (!fs.existsSync(p)) fs.writeFileSync(p, "");
}

export type Config = {
  provider: "ollama" | "gemma-api";
  model: string;
  ollamaUrl: string;
  port: number;
  /** minutes of brain silence before the reaper unloads it */
  idleUnloadMinutes: number;
  /** keep hooks armed even when the daemon is down (capture-only mode) */
  keepWakeWord: boolean;
  /** optional: sentry DSN for the tool's own crash telemetry (off by default) */
  sentryDsn?: string;
};

export const DEFAULT_CONFIG: Config = {
  provider: "ollama",
  model: "gemma3:4b",
  ollamaUrl: "http://127.0.0.1:11434",
  port: DEFAULT_PORT,
  idleUnloadMinutes: 10,
  keepWakeWord: true,
};

export function loadConfig(): Config {
  ensureHome();
  try {
    const raw = JSON.parse(fs.readFileSync(FILES.config, "utf8")) as Partial<Config>;
    return { ...DEFAULT_CONFIG, ...raw };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(cfg: Config): void {
  ensureHome();
  fs.writeFileSync(FILES.config, JSON.stringify(cfg, null, 2) + "\n");
}
