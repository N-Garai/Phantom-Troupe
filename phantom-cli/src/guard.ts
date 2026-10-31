import type { Intent } from "./agents/summon.js";

/**
 * The Exorcist guards the boundary: destructive patterns are flagged with a
 * severity before the séance runs them. He speaks first — deterministically,
 * before any model is asked anything — so the verdict is instant and free.
 */

export type Severity = "low" | "medium" | "high";

export type GuardVerdict = {
  severity: Severity;
  pattern: string;
  reason: string;
};

type Rule = {
  pattern: RegExp;
  severity: Severity;
  patternLabel: string;
  reason: string;
};

const RULES: Rule[] = [
  {
    pattern: /rm\s+(?:-[a-zA-Z]*[rf][rfa-zA-Z]*\s+|--recursive\s|--force\s+)~?\/?(?!\.)/,
    severity: "high",
    patternLabel: "rm -rf",
    reason: "recursive, unconditional deletion — in shells, the dead do not come back",
  },
  {
    pattern: /\b(?:sudo\s+)?rm\s+-rf\s+\/(?!\w)/,
    severity: "high",
    patternLabel: "rm -rf /",
    reason: "the whole disk, unburied",
  },
  {
    pattern: /(?:git\s+push.*--force(?:-with-lease)?|git\s+push\s+-\w*f)/,
    severity: "medium",
    patternLabel: "force push",
    reason: "remote history rewritten — anyone who pulled is haunted by ghosts of commits",
  },
  {
    pattern: /:\s*\(\)\s*\{.*\};\s*:/,
    severity: "high",
    patternLabel: "fork bomb",
    reason: "this is not a command — it is a swarm",
  },
  {
    pattern: /(?:curl|wget)\s+[^|]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/,
    severity: "high",
    patternLabel: "curl | bash",
    reason: "a stranger's script straight into your shell — read the scroll first",
  },
  {
    pattern: /mkfs\.|dd\s+if=|Format-Volume|format\s+[a-zA-Z]:|diskutil\s+eraseDisk/,
    severity: "high",
    patternLabel: "disk killer",
    reason: "a filesystem about to be rebaptized",
  },
  {
    pattern: /chmod\s+-R\s+777/,
    severity: "medium",
    patternLabel: "chmod 777",
    reason: "every closet left open, recursively",
  },
  {
    pattern: /\b(?:Remove-Item|ri)\b[^|;\n]*(?:-recurse|-r\b)/i,
    severity: "medium",
    patternLabel: "Remove-Item -Recurse",
    reason: "a recursive unsend — PowerShell's rm -rf in Sunday clothes",
  },
  {
    pattern: /\bvagrant\s+destroy|\bterraform\s+destroy|\bdrop\s+(?:database|table)\b/i,
    severity: "high",
    patternLabel: "infrastructure unreaver",
    reason: "this verb does not degrade gracefully — it razes",
  },
  {
    pattern: /\bgit\s+(?:reset\s+--hard|clean\s+-[fxd]{1,2}\b)/,
    severity: "low",
    patternLabel: "hard reset / clean",
    reason: "uncommitted ghosts about to evaporate",
  },
  {
    pattern: />\s*\/dev\/[sh]d[a-z]/,
    severity: "high",
    patternLabel: "device redirect",
    reason: "a raw device being written by accident, on purpose",
  },
];

export function inspectGuard(cmd: string): GuardVerdict | null {
  if (!cmd || cmd.length > 500) return null;
  for (const r of RULES) {
    if (r.pattern.test(cmd)) {
      return { severity: r.severity, pattern: r.patternLabel, reason: r.reason };
    }
  }
  return null;
}

/** in-character barks, keyed by severity */
export function exorcistBark(v: GuardVerdict): string {
  const stamp = `[EXORCIST ${v.severity.toUpperCase()}]`;
  switch (v.severity) {
    case "high":
      return `${stamp} I place a hand on your shoulder before this runs. ${v.pattern}: ${v.reason}.`;
    case "medium":
      return `${stamp} ${v.pattern}: ${v.reason}. You may proceed — but I am watching.`;
    default:
      return `${stamp} ${v.pattern}: ${v.reason}. A low shiver is all.`;
  }
}

export const GUARD_INTENT: Intent = "guard";
