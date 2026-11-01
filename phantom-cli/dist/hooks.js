import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const BEGIN = "# >>> phantom-troupe >>> (managed block — do not edit)";
const END = "# <<< phantom-troupe <<<";
/**
 * Absolute path to the compiled entry point, so the hooks can call the CLI
 * even when PowerShell's execution policy would refuse a .ps1 shim.
 */
export function cliEntry() {
    const self = process.argv[1] ?? "";
    const ext = path.extname(self).toLowerCase();
    if ((ext === ".js" || ext === ".mjs") && !self.includes("node_modules/.bin"))
        return path.resolve(self);
    // running from source (tsx/bun) — climb out of src/ to the sibling dist
    const here = path.dirname(fileURLToPath(import.meta.url)); // dist/commands or src/commands
    const candidate = path.resolve(here, "..", ext === ".js" ? "index.js" : "..", "dist", "index.js");
    if (fs.existsSync(candidate))
        return candidate;
    return self || "phantom";
}
/* ------------------------------------------------------------------ zsh ---- */
function zshSnippet() {
    return [
        BEGIN,
        "autoload -Uz add-zsh-hook",
        "phantom_preexec() { PHANTOM_LAST_CMD=\"$1\"; }",
        "phantom_precmd() {",
        "  local ec=$?",
        "  if [ \"$ec\" -ne 0 ] && [ -n \"${PHANTOM_LAST_CMD:-}\" ]; then",
        `    phantom _capture "$ec" "$PHANTOM_LAST_CMD" >/dev/null 2>&1 &!`,
        "  fi",
        "  PHANTOM_LAST_CMD=\"\"",
        "}",
        "add-zsh-hook preexec phantom_preexec",
        "add-zsh-hook precmd phantom_precmd",
        END,
    ].join("\n");
}
/* ----------------------------------------------------------------- bash ---- */
function bashSnippet() {
    return [
        BEGIN,
        "# Fires only on non-zero exits — zero idle cost.",
        "__phantom_dedup() {",
        '  case "$BASH_COMMAND" in',
        "    \"phantom_precmd\"|\"__phantom_dedup\"|__phantom_*|phantom\\ *) return;;",
        "  esac",
        "  PHANTOM_LAST_CMD=\"$BASH_COMMAND\"",
        "}",
        "__phantom_precmd() {",
        "  local ec=$?",
        "  if [ \"$ec\" -ne 0 ] && [ -n \"${PHANTOM_LAST_CMD:-}\" ]; then",
        `    phantom _capture \"$ec\" \"$PHANTOM_LAST_CMD\" >/dev/null 2>&1 &`,
        "  fi",
        "  PHANTOM_LAST_CMD=\"\"",
        "}",
        "trap __phantom_dedup DEBUG",
        "PROMPT_COMMAND=\"__phantom_precmd;$PROMPT_COMMAND\"",
        END,
    ].join("\n");
}
/* ---------------------------------------------------------- powershell ---- */
/**
 * PowerShell has no preexec hook, so we dress the prompt: it reads the last
 * HISTORY entry and the native command's `$LASTEXITCODE`. cmdlet failures are
 * invisible to `$LASTEXITCODE`; those live in the Error stream — a follow-up
 * hook could catch them, but native exit codes cover the bulk of the deaths.
 * Every call restores `$LASTEXITCODE` so the prompt stays honest.
 */
function powershellSnippet() {
    return [
        BEGIN,
        "$Global:__PhantomHistId = $null",
        "$Global:__PhantomPrevPrompt = (Get-Command prompt -CommandType Function -ErrorAction SilentlyContinue).ScriptBlock",
        "if ($null -eq $Global:__PhantomPrevPrompt) { $Global:__PhantomPrevPrompt = { \"PS $($executionContext.SessionState.Path.CurrentLocation)>\" } }",
        "function Global:phantom_capture {",
        "  param([int]$ec, [string]$cmd)",
        "  if ($cmd -match '^phantom\\b') { return }",
        "  try {",
        "    $__savedExit = $Global:LASTEXITCODE",
        `    & node '${cliEntry().replace(/'/g, "''")}' _capture $ec \"$cmd\" 2>$null | Out-Null`,
        "    $Global:LASTEXITCODE = $__savedExit",
        "  } catch { }",
        "}",
        "function Global:prompt {",
        "  $ec = $Global:LASTEXITCODE",
        "  $h  = Get-History -Count 1",
        "  if ($h -and $h.Id -ne $Global:__PhantomHistId) {",
        "    $Global:__PhantomHistId = $h.Id",
        "    if ($ec -and $ec -ne 0) { Global:phantom_capture $ec ($h.CommandLine + \"\") }",
        "  }",
        "  return & $Global:__PhantomPrevPrompt",
        "}",
        END,
    ].join("\n");
}
/* ----------------------------------------------------------- fish ----------- */
/**
 * Fish has no preexec hook; it uses fish_postexec which runs after every
 * command with $status holding the exit code. We track the last command via
 * fish_preexec (before it runs) and capture on fish_postexec when $status != 0.
 */
function fishSnippet() {
    return [
        BEGIN,
        "function fish_preexec --on-event fish_preexec",
        "  set -g __phantom_last_cmd $argv[1]",
        "end",
        "function fish_postexec --on-event fish_postexec",
        "  set -l ec $status",
        "  if test $ec -ne 0",
        "    and set -q __phantom_last_cmd",
        "    and not string match -q 'phantom*' $__phantom_last_cmd",
        "    phantom _capture $ec \"$__phantom_last_cmd\" >/dev/null 2>&1 &",
        "    set -e __phantom_last_cmd",
        "  end",
        "end",
        END,
    ].join("\n");
}
/* ----------------------------------------------------------- dispatch ------ */
export function snippetFor(kind) {
    switch (kind) {
        case "zsh":
            return zshSnippet();
        case "bash":
            return bashSnippet();
        case "powershell":
            return powershellSnippet();
        case "fish":
            return fishSnippet();
        default:
            return bashSnippet();
    }
}
/* ----------------------------------------------------------- detection ---- */
function pwshProfiles() {
    if (process.platform !== "win32") {
        // cross-platform pwsh still exists for some masochists — honor it
        const doc = process.env.XDG_DOCUMENTS_DIR ?? path.join(os.homedir(), "Documents");
        const p7 = path.join(doc, "PowerShell", "profile.ps1");
        return fs.existsSync(p7) ? [p7] : [];
    }
    const docs = path.join(os.homedir(), "Documents");
    const candidates = [
        path.join(docs, "PowerShell", "profile.ps1"), // PowerShell 7 (all hosts)
        path.join(docs, "WindowsPowerShell", "profile.ps1"), // Windows PowerShell 5.1 (all hosts)
    ];
    // OneDrive sometimes relocates Documents — ask the registry, politely
    try {
        const raw = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders" /v Personal', { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
        const m = raw.match(/REG_EXPAND_SZ\s+(\S.*)/);
        if (m) {
            const docDir = m[1].trim().replace(/%USERPROFILE%/gi, os.homedir()).replace(/%OneDriveCommercial%/gi, process.env.OneDrive ?? os.homedir());
            for (const sub of ["PowerShell", "WindowsPowerShell"]) {
                candidates.push(path.join(docDir, sub, "profile.ps1"));
            }
        }
    }
    catch {
        /* reg query is a nicety, not a requirement */
    }
    return candidates;
}
/** Every rc/profile the managed block might live in (install or uninstall). */
export function rcCandidates() {
    const home = os.homedir();
    const out = [
        { kind: "bash", rc: path.join(home, ".bashrc") },
        { kind: "bash", rc: path.join(home, ".bash_profile") },
        { kind: "bash", rc: path.join(home, ".profile") },
        { kind: "zsh", rc: path.join(home, ".zshrc") },
        { kind: "fish", rc: path.join(home, ".config", "fish", "config.fish") },
    ];
    for (const rc of pwshProfiles())
        out.push({ kind: "powershell", rc });
    return out;
}
export function detectShell() {
    if (process.platform === "win32")
        return { kind: "powershell", rc: pwshProfiles()[0] ?? "" };
    const shell = process.env.SHELL ?? "";
    if (shell.includes("zsh"))
        return { kind: "zsh", rc: path.join(os.homedir(), ".zshrc") };
    if (shell.includes("fish"))
        return { kind: "fish", rc: path.join(os.homedir(), ".config", "fish", "config.fish") };
    return { kind: "bash", rc: path.join(os.homedir(), ".bashrc") };
}
export function installHooks(opts = {}) {
    if (process.platform === "win32") {
        let last = { kind: "powershell", rc: "" };
        const targets = pwshProfiles();
        if (!targets.length) {
            // neither profile exists yet — create the PowerShell 7 one, else the 5.1 one
            const docs = path.join(os.homedir(), "Documents");
            const p7 = path.join(docs, "PowerShell", "profile.ps1");
            const rc = fs.existsSync(path.join(docs, "WindowsPowerShell", "profile.ps1"))
                ? path.join(docs, "WindowsPowerShell", "profile.ps1")
                : p7;
            return installBlock(rc, "powershell");
        }
        for (const rc of targets)
            last = installBlock(rc, "powershell");
        return last;
    }
    const detected = detectShell();
    const kind = opts.kind ?? detected.kind;
    const rc = opts.rc ?? detected.rc;
    return installBlock(rc, kind);
}
function installBlock(rc, kind) {
    let content = "";
    try {
        content = fs.readFileSync(rc, "utf8");
    }
    catch {
        /* new rc file */
    }
    if (content.includes(BEGIN))
        return { kind, rc }; // idempotent
    const block = snippetFor(kind);
    fs.mkdirSync(path.dirname(rc), { recursive: true });
    const nl = rc.endsWith(".ps1") ? "\r\n" : "\n";
    fs.writeFileSync(rc, content + (content.endsWith("\n") || content === "" ? "" : nl) + nl + block.split("\n").join(nl) + nl);
    return { kind, rc };
}
const ESC = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function uninstallHooks() {
    const touched = [];
    for (const { rc } of rcCandidates()) {
        if (!rc || !fs.existsSync(rc))
            continue;
        const content = fs.readFileSync(rc, "utf8");
        if (!content.includes(BEGIN))
            continue;
        const re = new RegExp(`\\r?\\n?${ESC(BEGIN)}[\\s\\S]*?${ESC(END)}\\r?\\n?`, "g");
        fs.writeFileSync(rc, content.replace(re, ""));
        touched.push(rc);
    }
    return touched;
}
export function hooksInstalled() {
    let home = os.homedir();
    if (process.platform === "win32") {
        for (const { rc } of rcCandidates()) {
            try {
                if (fs.readFileSync(rc, "utf8").includes(BEGIN))
                    return true;
            }
            catch { }
        }
        void home;
        return false;
    }
    const { rc } = detectShell();
    try {
        return fs.readFileSync(rc, "utf8").includes(BEGIN);
    }
    catch {
        return false;
    }
}
