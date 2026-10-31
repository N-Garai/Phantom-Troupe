/* Minimal spooky console helpers — used by every command. */
const DIM = "\x1b[2m";
const MARIGOLD = "\x1b[38;5;214m";
const SPECTRE = "\x1b[38;5;120m";
const BLOOD = "\x1b[38;5;167m";
const BONE = "\x1b[38;5;223m";
const RESET = "\x1b[0m";
export const say = {
    dim: (s) => console.log(`${DIM}${s}${RESET}`),
    bone: (s) => console.log(`${BONE}${s}${RESET}`),
    gold: (s) => console.log(`${MARIGOLD}${s}${RESET}`),
    spectre: (s) => console.log(`${SPECTRE}${s}${RESET}`),
    blood: (s) => console.log(`${BLOOD}${s}${RESET}`),
};
export function sigil() {
    return String.raw `
   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   █  P H A N T O M · T R O U P E  █
   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
     every command leaves a corpse
  `;
}
export function tombstone(lines) {
    const width = Math.max(...lines.map((l) => l.length)) + 4;
    const top = "┌" + "─".repeat(width) + "┐";
    const bottom = "└" + "─".repeat(width) + "┘";
    const body = lines.map((l) => "│  " + l.padEnd(width - 2) + "│").join("\n");
    return [top, body, bottom].join("\n");
}
/** shown by the reaper when the brain is unloaded */
export function ascensionArt() {
    return String.raw `
        .-.
       (   )      the spirit departs —
        '-'       RAM returned to the living
       \ | /
        \|/
       ^^^^^^^
  `;
}
