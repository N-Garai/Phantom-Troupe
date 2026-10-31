import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec as cpExec, execFile, spawn } from "node:child_process";
import os from "node:os";
import { FILES, loadConfig, saveConfig, ensureHome } from "./util/paths.js";
import { appendCorpus, readMorgue, readGraves, updateLastCorpse } from "./store.js";
import { summon } from "./agents/summon.js";
import { inspectGuard, exorcistBark } from "./guard.js";
import { runSeance } from "./seance.js";
import { Reaper } from "./reaper.js";
import { initSentry } from "./telemetry.js";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEBUI = path.join(HERE, "..", "webui", "index.html");
const clients = new Set();
let sseId = 0;
function broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const c of clients) {
        try {
            c.res.write(payload);
        }
        catch {
            clients.delete(c);
        }
    }
}
const reaper = new Reaper(broadcast);
const bootedAt = Date.now();
function json(res, code, body) {
    const buf = JSON.stringify(body);
    res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(buf) });
    res.end(buf);
}
function readBody(req) {
    return new Promise((resolve) => {
        let raw = "";
        req.on("data", (d) => (raw += d));
        req.on("end", () => {
            try {
                resolve(JSON.parse(raw || "{}"));
            }
            catch {
                resolve({});
            }
        });
    });
}
function runShell(cmd) {
    return new Promise((resolve) => {
        // On Windows the séance table speaks PowerShell — native tools and
        // cmdlets both answer; elsewhere the /bin/sh takes the oath.
        const done = (err, stdout, stderr) => {
            const code = err ? Number(err.code) : 0;
            resolve({ stdout, stderr, exit: Number.isFinite(code) && code !== 0 ? code : err ? 1 : 0 });
        };
        if (process.platform === "win32") {
            execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { cwd: os.homedir(), timeout: 30_000, maxBuffer: 1024 * 1024 }, done);
            return;
        }
        cpExec(cmd, { timeout: 30_000, maxBuffer: 1024 * 1024 }, done);
    });
}
function isLoopback(addr) {
    return addr === "127.0.0.1" || addr === "::1" || addr.startsWith("::ffff:127.");
}
export function createServer() {
    return http.createServer(async (req, res) => {
        // loopback only — the séance never leaves this machine
        const addr = req.socket.remoteAddress ?? "";
        if (!isLoopback(addr)) {
            return json(res, 403, { error: "the séance is bound to this machine" });
        }
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        if (req.url?.startsWith("/api/events")) {
            res.writeHead(200, {
                "content-type": "text/event-stream",
                "cache-control": "no-cache",
                connection: "keep-alive",
            });
            res.write(`event: hello\ndata: {"ok":true}\n\n`);
            const client = { id: ++sseId, res };
            clients.add(client);
            req.on("close", () => clients.delete(client));
            return;
        }
        if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
            try {
                const html = fs.readFileSync(WEBUI);
                res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                return res.end(html);
            }
            catch {
                res.writeHead(500);
                return res.end("webui missing — reinstall the troupe");
            }
        }
        if (url.pathname === "/api/health" && req.method === "GET")
            return json(res, 200, { ok: true });
        if (url.pathname === "/api/state" && req.method === "GET") {
            const cfg = loadConfig();
            let lastSeance = null;
            try {
                lastSeance = fs.readFileSync(FILES.seanceStamp, "utf8").trim() || null;
            }
            catch { }
            return json(res, 200, {
                provider: cfg.provider,
                model: cfg.model,
                idleUnloadMinutes: cfg.idleUnloadMinutes,
                uptimeSec: Math.round((Date.now() - bootedAt) / 1000),
                corpses: readMorgue(1000).length,
                graves: readGraves().length,
                lastSeance,
            });
        }
        if (url.pathname === "/api/morgue" && req.method === "GET") {
            return json(res, 200, { corpses: readMorgue(Number(url.searchParams.get("limit") ?? 40)) });
        }
        if (url.pathname === "/api/graves" && req.method === "GET") {
            return json(res, 200, { graves: readGraves() });
        }
        if (url.pathname === "/api/exec" && req.method === "POST") {
            const body = await readBody(req);
            const cmd = String(body.cmd ?? "").trim();
            if (!cmd)
                return json(res, 400, { error: "the void cannot be executed" });
            if (cmd.length > 2000)
                return json(res, 400, { error: "even ghosts have limits (2000 chars)" });
            // the Exorcist speaks BEFORE the shell does — deterministic bark first
            // (instant), then the model voice deepens the verdict when it matters
            const guard = inspectGuard(cmd);
            if (guard) {
                broadcast("verdict", { agent: "exorcist", text: exorcistBark(guard), engine: "fallback" });
                if (guard.severity !== "low") {
                    void summon("guard", { cmd, guard }).then((v) => broadcast("verdict", { ...v, agent: "exorcist" }));
                }
            }
            reaper.touch();
            const t0 = Date.now();
            const out = await runShell(cmd);
            if (out.exit !== 0) {
                const corpse = {
                    ts: new Date().toISOString(),
                    cmd,
                    exit: out.exit,
                    stderrTail: out.stderr.slice(-400),
                };
                appendCorpus(corpse);
                // let the Coroner speak — async, so the shell reply is instant
                void summon("autopsy", corpse).then((v) => {
                    updateLastCorpse(cmd, { dx: v.text });
                    broadcast("verdict", v);
                });
            }
            return json(res, 200, { ...out, ms: Date.now() - t0, guard });
        }
        if (url.pathname === "/api/autopsy" && req.method === "POST") {
            // hook notification: a command just died — let the Coroner speak
            const body = await readBody(req);
            const cmd = String(body.cmd ?? "");
            const exit = Number(body.exit ?? 1);
            const corpse = { ts: new Date().toISOString(), cmd, exit, stderrTail: String(body.stderrTail ?? "") };
            reaper.touch();
            void summon("autopsy", corpse).then((v) => {
                updateLastCorpse(cmd, { dx: v.text });
                broadcast("verdict", v);
            });
            return json(res, 202, { accepted: true });
        }
        if (url.pathname === "/api/explain" && req.method === "POST") {
            const body = await readBody(req);
            const cmd = String(body.cmd ?? "").trim();
            reaper.touch();
            const v = await summon("explain", { cmd });
            return json(res, 200, v);
        }
        if (url.pathname === "/api/seance" && req.method === "POST") {
            const result = await runSeance();
            broadcast("seance", result);
            return json(res, 200, result);
        }
        if (url.pathname === "/api/memory/flush" && req.method === "POST") {
            reaper.touch();
            const cfg = loadConfig();
            const { unloadOllama } = await import("./providers/ollama.js");
            const ok = cfg.provider === "ollama" ? await unloadOllama(cfg) : true;
            broadcast("ascension", { minutesIdle: 0, message: ok ? "released by hand — RAM returned to the living" : "nothing was loaded" });
            return json(res, 200, { ok });
        }
        if (url.pathname === "/api/config" && (req.method === "POST" || req.method === "GET")) {
            if (req.method === "GET")
                return json(res, 200, loadConfig());
            const body = await readBody(req);
            const cfg = { ...loadConfig() };
            if (typeof body.idleUnloadMinutes === "number")
                cfg.idleUnloadMinutes = Math.min(60, Math.max(1, Math.round(body.idleUnloadMinutes)));
            if (body.provider === "ollama" || body.provider === "gemma-api")
                cfg.provider = body.provider;
            if (typeof body.model === "string" && body.model.trim())
                cfg.model = body.model.trim();
            saveConfig(cfg);
            reaper.restart();
            return json(res, 200, cfg);
        }
        json(res, 404, { error: "no such haunt" });
    });
}
export function startDaemon() {
    ensureHome();
    initSentry();
    const cfg = loadConfig();
    const server = createServer();
    server.listen(cfg.port, "127.0.0.1", () => {
        fs.writeFileSync(FILES.daemonPid, String(process.pid));
        console.log(`[phantom] the troupe is awake — http://127.0.0.1:${cfg.port} (pid ${process.pid})`);
        reaper.restart();
    });
    const stop = () => {
        try {
            fs.rmSync(FILES.daemonPid, { force: true });
        }
        catch { }
        process.exit(0);
    };
    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);
    // a stray daemon from a previous life must not linger
    process.on("exit", () => {
        try {
            const pid = fs.readFileSync(FILES.daemonPid, "utf8").trim();
            if (pid === String(process.pid))
                fs.rmSync(FILES.daemonPid, { force: true });
        }
        catch { }
    });
}
/** used by `phantom graveyard` — ensure daemon, then open the browser */
export async function ensureDaemonAndOpen() {
    const cfg = loadConfig();
    const alive = await new Promise((resolve) => {
        const req = http.get({ host: "127.0.0.1", port: cfg.port, path: "/api/health", timeout: 800 }, (r) => {
            resolve(r.statusCode === 200);
            r.resume();
        });
        req.on("error", () => resolve(false));
        req.on("timeout", () => {
            req.destroy();
            resolve(false);
        });
    });
    if (!alive) {
        const child = spawn(process.execPath, [process.argv[1] ?? "", "--daemon"], {
            detached: true,
            stdio: "ignore",
        });
        child.unref();
        await new Promise((r) => setTimeout(r, 900));
    }
    const open = process.platform === "darwin"
        ? spawn("open", [`http://127.0.0.1:${cfg.port}`], { detached: true, stdio: "ignore" })
        : process.platform === "win32"
            ? spawn("cmd", ["/c", "start", "", `http://127.0.0.1:${cfg.port}`], { detached: true, stdio: "ignore" })
            : spawn("xdg-open", [`http://127.0.0.1:${cfg.port}`], { detached: true, stdio: "ignore" });
    // headless boxes have no opener — the URL was already printed; never crash for that
    open.on("error", () => { });
    open.unref();
}
