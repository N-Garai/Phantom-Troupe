# Architecture

```
┌────────────────────────── your terminal ──────────────────────────┐
│                                                                   │
│  shell (zsh / bash / PowerShell)                                  │
│    └─ hooks (preexec/precmd · DEBUG trap · prompt history read)   │
│                                                 ← zero idle cost  │
│         └─ phantom _capture ⟨exit⟩ ⟨cmd⟩                          │
│              ├─ ~/.phantom/morgue.jsonl      (failures)           │
│              ├─ ~/.phantom/commands.jsonl    (rolling log)        │
│              └─ POST 127.0.0.1:7313/api/autopsy  (if helper up)   │
│                                                                   │
│  helper daemon ("phantom", detached, loopback-only)               │
│    ├─ local séance UI + API (http://127.0.0.1:7313)               │
│    │     - executes real commands (PowerShell on Windows,         │
│    │       /bin/sh elsewhere) — loopback only                     │
│    ├─ router → Coroner / Medium / Understudy /                    │
│    │            Interpreter / Exorcist                            │
│    │      (open agent framework, optional;                        │
│    │       deterministic fallbacks always available)              │
│    ├─ Exorcist pre-run guard                                     │
│    │      — /api/exec inspects every command before execution;   │
│    │      lethal/grave commands are blocked unless confirmed     │
│    │      with the Dead Man's Hand (confirm: true)               │
│    ├─ brain: local open-weight model (ollama)                     │
│    │         or hosted open-weight model (gemma-api)              │
│    ├─ idle reaper → unloads model after ⟨idleUnloadMinutes⟩       │
│    │                 → broadcasts "ascension" event               │
│    └─ nightly séance sweep                                        │
│          (agent-framework workflow when installed,                │
│           otherwise the same three acts by hand;                  │
│           scheduled via systemd timer / launchd / schtasks)       │
│                                                                   │
│  ~/.phantom — plain files you own:                                │
│    morgue.jsonl · graves.jsonl · commands.jsonl                   │
│    config.json · memory.db (agent memory, LibSQL)                 │
└───────────────────────────────────────────────────────────────────┘
```

## Data flow of a failed command

1. Hook fires with `$?` and the command line. **The prompt never blocks** — capture is a background append.
2. The corpse is appended to `morgue.jsonl` (and the rolling command log).
3. If the helper is awake, `/api/autopsy` is notified; the router wakes the Coroner; the verdict is patched into the corpse record and pushed to any open séance UI over SSE.
4. Repeat deaths are matched before the model is ever consulted — `cure` fields carry forward what worked last time.

## Failure posture

- Brain offline → capture continues; autopsies run lazily with deterministic templates; the UI marks the brain as resting.
- Helper not running → hooks still file corpses; nothing else is affected.
- Agent framework not installed → direct brain calls; then templates. Capture never depends on any of this.

## Grounding

The Coroner's premise — that failure-handling knowledge evaporates because
nothing around the shell remembers it — follows published security research:
Fischer, F., et al., *"Stack Overflow Considered Harmful? The Impact of
Copy–Paste on Android Application Security"*, IEEE Symposium on Security &
Privacy, 2017 (<https://doi.org/10.1109/SP.2017.31>): developers paste
working-looking code without understanding it, and the copy rides along with
what they don't know. The whole troupe exists to keep that understanding
inside the local shell instead.

## Command reference

| Command | Purpose |
|---------|---------|
| `phantom` / `phantom start` | Wake the helper in the background |
| `phantom graveyard` / `phantom web` | Open local séance UI at 127.0.0.1:7313 |
| `phantom status` | Roster: brain, corpses, graves |
| `phantom seance` | Run the nightly sweep now |
| `phantom stop` | Sleep — all memory kept |
| `phantom unhook` | Remove shell capture only |
| `phantom uninstall` | Remove hooks, timers — asks before deleting `~/.phantom` |
| `phantom init` | (Re)install hooks + config |
| `phantom settings` | Choose brain (ollama vs gemma-api) + store API key |
| `phantom guard <cmd>` | Exorcist pre-run gate — inspect before execution |
| `phantom autopsy <cmd>` | Coroner cause-of-death report for any command |
| `phantom explain <cmd>` | Interpreter: WHAT / WHEN / DANGER for any command |
| `phantom _capture <exit> <cmd>` | Internal: shell-hook capture (not for direct use) |
