import { appendCorpus, findPriorDeath } from "../store.js";
import http from "node:http";
import { loadConfig } from "../util/paths.js";
/**
 * Internal: the shell hook calls this on every non-zero exit.
 * Must be fast, never block the prompt, and never fail loudly.
 * If the helper is awake, it gets notified so the Coroner can speak.
 */
export async function capture(exitArg, cmd) {
    const exit = parseInt(exitArg, 10) || 1;
    if (!cmd || cmd.startsWith("phantom _capture"))
        return;
    const ts = new Date().toISOString();
    const prior = findPriorDeath(cmd);
    appendCorpus({ ts, cmd, exit, cure: prior?.cure, dx: prior?.dx });
    // notify the helper (fire and forget — capture must not wait on the brain)
    const cfg = loadConfig();
    const req = http.request({ host: "127.0.0.1", port: cfg.port, path: "/api/autopsy", method: "POST", timeout: 1200 }, (r) => r.resume());
    req.on("error", () => { });
    req.on("timeout", () => req.destroy());
    req.end(JSON.stringify({ cmd, exit }));
}
