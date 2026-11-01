import { summon } from "../agents/summon.js";
import { say } from "../util/log.js";
/**
 * `phantom autopsy "<cmd>"` — let the Coroner write a cause-of-death
 * report for any command you name. Reads prior deaths from the morgue
 * if the command died before; otherwise asks the Coroner to hypothesize.
 */
export async function autopsy(cmd) {
    if (!cmd) {
        say.blood(" the Coroner needs a body — pass a command: phantom autopsy 'ls --not-a-flag'");
        process.exitCode = 1;
        return;
    }
    say.gold(" the Coroner examines the body…");
    const verdict = await summon("autopsy", {
        cmd,
        exit: 1,
        stderrTail: "command examined on request — no live failure captured",
    });
    console.log("");
    say.bone(" CAUSE:");
    const lines = verdict.text.split("\n");
    console.log("  " + (lines[0] ?? verdict.text));
    if (lines.length > 1) {
        say.bone(" TREATMENT:");
        console.log("  " + lines[1]);
    }
    console.log("");
    say.dim(" engine: " + verdict.engine + " · agent: " + verdict.agent);
}
