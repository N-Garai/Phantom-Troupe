import readline from "node:readline/promises";
import { ensureHome, loadConfig, saveConfig } from "../util/paths.js";
import { say } from "../util/log.js";
/**
 * Interactive setup for the troupe's brain.
 * Prompts once for provider (Ollama local vs Gemma API) and, if Gemma API,
 * the API key which is stored in ~/.phantom/config.json (local only, never
 * sent anywhere except the model endpoint). Re-run anytime via `phantom settings`.
 */
export async function settings() {
    ensureHome();
    const cfg = loadConfig();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (q) => rl.question(q);
    const hide = (q) => {
        return new Promise((resolve) => {
            process.stdout.write(q);
            process.stdin.setRawMode?.(true);
            process.stdin.pause();
            const chunks = [];
            const onData = (d) => {
                const b = d;
                if (b.equals(Buffer.from("\u0003"))) {
                    process.stdin.removeListener("data", onData);
                    process.stdin.setRawMode?.(false);
                    process.stdin.resume();
                    rl.close();
                    process.exit(130);
                }
                if (b.equals(Buffer.from("\r")) || b.equals(Buffer.from("\n"))) {
                    process.stdout.write("\n");
                    process.stdin.removeListener("data", onData);
                    process.stdin.setRawMode?.(false);
                    process.stdin.resume();
                    resolve(Buffer.concat(chunks).toString().trim());
                    return;
                }
                if (b.equals(Buffer.from("\u007f")) || b.equals(Buffer.from("\b"))) {
                    if (chunks.length > 0) {
                        chunks.pop();
                        process.stdout.write("\b \b");
                    }
                    return;
                }
                chunks.push(b);
            };
            process.stdin.on("data", onData);
        });
    };
    say.bone("┌─ Phantom Troupe — Settings");
    say.dim("│");
    say.dim(`│ Current provider: ${cfg.provider}`);
    say.dim(`│ Current model: ${cfg.model}`);
    if (cfg.provider === "gemma-api")
        say.dim("│ Gemma API key:  •••••••• (stored locally)");
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
        say.dim("│ Enter your Gemma API key (input hidden — stored in ~/.phantom/config.json):");
        gemmaApiKey = await hide("│ API key: ");
        say.dim("│");
        model = (await question("│ Model [gemma-2b-it]: ")).trim() || "gemma-2b-it";
    }
    else {
        model = (await question("│ Model [gemma3:4b]: ")).trim() || "gemma3:4b";
    }
    const idle = (await question(`│ Idle unload minutes [${cfg.idleUnloadMinutes}]: `)).trim();
    const idleUnloadMinutes = idle ? Math.min(60, Math.max(1, parseInt(idle, 10))) : cfg.idleUnloadMinutes;
    rl.close();
    const next = {
        ...cfg,
        provider,
        model,
        idleUnloadMinutes,
        ...(provider === "gemma-api" && gemmaApiKey ? { gemmaApiKey } : {}),
    };
    saveConfig(next);
    say.gold("└ Settings saved to ~/.phantom/config.json");
    say.dim(`   provider: ${provider}  model: ${model}`);
    if (provider === "gemma-api" && gemmaApiKey)
        say.dim("   gemma-api key: stored locally");
    say.dim("   Run 'phantom' to wake the troupe with the new brain.");
}
