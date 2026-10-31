import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { FILES, loadConfig, saveConfig, ensureHome, DEFAULT_CONFIG } from "../util/paths.js";
import { installHooks, hooksInstalled, snippetFor } from "../hooks.js";
import { say, sigil } from "../util/log.js";
/** `phantom init` — detect the environment, write hooks and config. */
export async function init(flags) {
    console.log(sigil());
    ensureHome();
    if (!fs.existsSync(FILES.config))
        saveConfig({ ...DEFAULT_CONFIG });
    const cfg = loadConfig();
    // environment detection
    const { kind, rc } = installHooks();
    say.gold(` haunt installed → ${rc} (${kind})`);
    if (kind === "zsh") {
        // hooks load at shell startup — tell the zsh user to re-enter the shell
        say.dim(" note: restart your shell or run: exec zsh (bash: source ~/.bashrc)");
    }
    else if (kind === "bash") {
        say.dim(" note: restart your shell or run: source ~/.bashrc");
    }
    else if (kind === "powershell") {
        say.dim(" note: open a NEW PowerShell window so the hooks load");
    }
    // brain probe — pure node fetch, no curl on the PATH required
    if (cfg.provider === "ollama") {
        const { ollamaAlive } = await import("../providers/ollama.js");
        const up = await ollamaAlive(cfg);
        if (up) {
            say.spectre(` brain: local model server awake at ${cfg.ollamaUrl} (${cfg.model})`);
        }
        else {
            say.blood(" brain: no local model server detected — capture still works, autopsies wait for the brain");
            say.dim("   install ollama, then: ollama pull " + cfg.model);
        }
    }
    else {
        say.spectre(process.env.GEMMA_API_KEY
            ? ` brain: gemma-api (${cfg.model}) — key found in environment`
            : " brain: gemma-api selected but GEMMA_API_KEY is not set — export it, or switch provider to ollama");
    }
    if (flags.withTimer) {
        try {
            installNightlyTimer();
            say.gold(" nightly séance scheduled (systemd · launchd · schtasks — user level, no admins asked)");
        }
        catch (e) {
            say.dim(` nightly timer not installed: ${e.message}`);
        }
    }
    say.dim("");
    say.dim(" the troupe wakes when you speak:");
    say.dim("   phantom            wake the helper (background, loopback-only)");
    say.dim("   phantom graveyard  open the local séance UI");
    say.dim("   phantom stop       put them back to sleep");
    say.dim("");
    say.dim(" everything is filed in ~/.phantom — plain files, yours to audit.");
    console.log("");
    console.log(snippetFor(kind));
    void hooksInstalled;
}
/** systemd user timer (linux) / launchd plist (macOS) / printed schtasks hint (windows) */
export function installNightlyTimer() {
    const platform = process.platform;
    if (platform === "linux") {
        const dir = `${process.env.HOME}/.config/systemd/user`;
        fs.mkdirSync(dir, { recursive: true });
        const bin = process.argv[1] ?? "phantom";
        fs.writeFileSync(`${dir}/phantom-seance.service`, `[Unit]\nDescription=Phantom Troupe nightly seance\n\n[Service]\nType=oneshot\nExecStart=${bin} seance\n`);
        fs.writeFileSync(`${dir}/phantom-seance.timer`, `[Unit]\nDescription=Run the phantom seance nightly\n\n[Timer]\nOnCalendar=*-*-* 02:17:00\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n`);
        execSync("systemctl --user daemon-reload && systemctl --user enable --now phantom-seance.timer", { stdio: "ignore" });
        return;
    }
    if (platform === "darwin") {
        const dir = `${process.env.HOME}/Library/LaunchAgents`;
        fs.mkdirSync(dir, { recursive: true });
        const bin = process.argv[1] ?? "phantom";
        fs.writeFileSync(`${dir}/dev.phantom.troupe.plist`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>dev.phantom.troupe</string>
  <key>ProgramArguments</key><array><string>${bin}</string><string>seance</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>2</integer><key>Minute</key><integer>17</integer></dict>
</dict></plist>\n`);
        execSync(`launchctl load ${dir}/dev.phantom.troupe.plist`, { stdio: "ignore" });
        return;
    }
    if (platform === "win32") {
        installWindowsTimer(process.argv[1] ?? "phantom");
        return;
    }
    throw new Error("no user-level scheduler found");
}
/** Windows: a real scheduled task — schtasks, no admin rights needed. */
function installWindowsTimer(bin) {
    const name = "PhantomTroupeSeance";
    try {
        execSync(`schtasks /delete /f /tn ${name}`, { stdio: "ignore" });
    }
    catch {
        /* no previous task */
    }
    const run = `node "${bin}" seance`;
    execSync(`schtasks /create /f /sc daily /st 02:17 /tn ${name} /tr "${run.replace(/"/g, '\\"')}"`, { stdio: "ignore" });
}
/** `phantom` / `phantom start` — wake the helper in the background */
export function start() {
    if (isDaemonAlive()) {
        say.spectre(" the troupe is already awake. 'phantom graveyard' to sit at the table.");
        return;
    }
    const self = process.argv[1] ?? "";
    const child = spawn(process.execPath, [self, "--daemon"], { detached: true, stdio: "ignore" });
    child.unref();
    say.gold(" the troupe is waking in the dark…");
    say.dim(`   helper: background, loopback-only, pid written to ~/.phantom/daemon.pid`);
    say.dim("   nothing runs between your commands — hooks are event-driven");
    say.dim(`   'phantom graveyard' → local UI · 'phantom stop' → sleep`);
}
export function isDaemonAlive() {
    try {
        const pid = parseInt(fs.readFileSync(FILES.daemonPid, "utf8").trim(), 10);
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
