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
export function ensureHome() {
    fs.mkdirSync(PHANTOM_HOME, { recursive: true });
}
export function touchFile(p) {
    if (!fs.existsSync(p))
        fs.writeFileSync(p, "");
}
export const DEFAULT_CONFIG = {
    provider: "ollama",
    model: "gemma3:4b",
    ollamaUrl: "http://127.0.0.1:11434",
    port: DEFAULT_PORT,
    idleUnloadMinutes: 10,
    keepWakeWord: true,
};
export function loadConfig() {
    ensureHome();
    try {
        const raw = JSON.parse(fs.readFileSync(FILES.config, "utf8"));
        return { ...DEFAULT_CONFIG, ...raw };
    }
    catch {
        return { ...DEFAULT_CONFIG };
    }
}
export function saveConfig(cfg) {
    ensureHome();
    fs.writeFileSync(FILES.config, JSON.stringify(cfg, null, 2) + "\n");
}
