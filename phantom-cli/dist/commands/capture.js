import { appendCorpus, findPriorDeath } from "../store.js";
import { loadConfig } from "../util/paths.js";
import { getBrain } from "../brain.js";
/**
 * Internal: the shell hook calls this on every non-zero exit.
 * Unlike the old fire-and-forget version, this runs the Coroner
 * directly and prints the cause-of-death report straight to the
 * terminal — exactly like Learn Again Shell's inline error explain.
 *
 * It is fast: prior-death cures print instantly; if no cure exists,
 * the brain is asked once with a short timeout.
 */
export async function capture(exitArg, cmd) {
    const exit = parseInt(exitArg, 10) || 1;
    if (!cmd || cmd.startsWith("phantom _capture"))
        return;
    const cfg = loadConfig();
    const prior = findPriorDeath(cmd);
    appendCorpus({ ts: new Date().toISOString(), cmd, exit, cure: prior?.cure, dx: prior?.dx });
    const brain = getBrain(cfg);
    const brainUp = await brain.available().catch(() => false);
    // 1) instant: show any previously-filed cure first
    if (prior?.dx) {
        console.error(`\n  [phantom] ${prior.dx}`);
        return;
    }
    // 2) ask the Coroner — but never block the prompt for long
    if (brainUp) {
        try {
            const user = `command: ${cmd}\nexit: ${exit}\n\nReply in exactly two lines:\nCAUSE: ...\nTREATMENT: ...`;
            const verdict = await brain.ask("You are the Coroner of a terminal graveyard. Given a failed command and its exit code, write a cause-of-death report: one line for cause, one line for likely treatment. Be exact, dry, slightly gothic. Never invent flags or APIs.", user, 8000);
            console.error(`\n  [phantom] ${verdict.text}`);
        }
        catch {
            console.error(`\n  [phantom] the Coroner could not be reached — the failure is filed, uncauterized.`);
        }
    }
    else {
        console.error(`\n  [phantom] failure filed (exit ${exit}). Start the brain with 'phantom' to get autopsies.`);
    }
}
