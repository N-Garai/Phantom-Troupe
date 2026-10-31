#!/usr/bin/env node
import { init, start } from "./commands/init.js";
import { stop, status, uninstall } from "./commands/lifecycle.js";
import { capture } from "./commands/capture.js";
import { runSeance } from "./seance.js";
import { startDaemon, ensureDaemonAndOpen } from "./server.js";
import { loadConfig } from "./util/paths.js";
import { say, sigil } from "./util/log.js";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const VERSION = require("../package.json");
const [, , cmd, ...rest] = process.argv;
const flags = new Set(rest ?? []);
async function main() {
    switch (cmd) {
        case undefined:
        case "start":
            start();
            return;
        case "--daemon":
            startDaemon();
            return;
        case "graveyard":
        case "web":
            await ensureDaemonAndOpen();
            const cfg = loadConfig();
            say.spectre(` the séance table is set → http://127.0.0.1:${cfg.port}`);
            say.dim(" loopback only. run real commands, deal the Dead Man's Hand, tend the graves.");
            return;
        case "stop":
            stop();
            return;
        case "status":
            status();
            return;
        case "seance":
            say.gold(" the Medium walks the graveyard…");
            const r = await runSeance();
            say.spectre(` ${r.added} new grave(s), ${r.graves.length} tended in total.`);
            return;
        case "unhook":
            {
                const { uninstallHooks } = await import("./hooks.js");
                const touched = uninstallHooks();
                say.gold(touched.length ? ` hooks removed from: ${touched.join(", ")} — open a new shell.` : " no hooks found.");
            }
            return;
        case "uninstall":
            await uninstall({ yes: flags.has("--yes") });
            return;
        case "init":
            await init({ yes: flags.has("--yes"), withTimer: flags.has("--with-timer") });
            return;
        case "_capture":
            await capture(rest[0] ?? "1", rest.slice(1).join(" "));
            return;
        case "--version":
        case "-v":
            console.log(VERSION.version);
            return;
        case "--help":
        case "-h":
        case "help":
            console.log(sigil());
            say.bone(" PHANTOM TROUPE — the graveyard of CLI scripts");
            say.dim("");
            say.dim("   phantom              wake the troupe (background helper)");
            say.dim("   phantom graveyard    local séance UI at 127.0.0.1:7313 (alias: web)");
            say.dim("   phantom status       roster: brain, corpses, graves");
            say.dim("   phantom seance       nightly sweep, run now");
            say.dim("   phantom stop         sleep — all memory kept");
            say.dim("   phantom unhook       remove shell capture only");
            say.dim("   phantom uninstall    remove everything (asks about the bones)");
            say.dim("   phantom init         (re)install hooks + config");
            return;
        default:
            say.blood(` unknown séance: '${cmd}' — try 'phantom help'`);
            process.exitCode = 1;
    }
}
main().catch((e) => {
    say.blood(` the spirits object: ${e.message}`);
    process.exit(1);
});
