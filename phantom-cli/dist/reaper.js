import { loadConfig } from "./util/paths.js";
import { unloadOllama } from "./providers/ollama.js";
import { ascensionArt } from "./util/log.js";
/**
 * The idle reaper: the brain is loaded on demand and unloaded after your
 * threshold. When it reaps, the living are told — the ghost is shown
 * ascending in the local UI, and the terminal prints the departure.
 */
export class Reaper {
    timer;
    lastUsed = Date.now();
    cfg = loadConfig();
    broadcast;
    loaded = false;
    constructor(broadcast) {
        this.broadcast = broadcast;
    }
    touch() {
        this.lastUsed = Date.now();
        this.loaded = true;
    }
    restart() {
        this.cfg = loadConfig();
        this.stop();
        this.timer = setInterval(() => void this.check(), 30_000);
    }
    async check() {
        const idleMs = Date.now() - this.lastUsed;
        const threshold = Math.max(1, this.cfg.idleUnloadMinutes) * 60_000;
        if (!this.loaded || idleMs < threshold)
            return;
        this.loaded = false;
        if (this.cfg.provider === "ollama") {
            const ok = await unloadOllama(this.cfg);
            if (!ok)
                return; // nothing loaded — no ghost to release
        }
        const mins = Math.round(idleMs / 60_000);
        this.broadcast("ascension", {
            minutesIdle: mins,
            message: `the brain rested ${mins} min in the dark — unloaded, RAM returned to the living`,
        });
        console.log(ascensionArt());
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
    }
}
