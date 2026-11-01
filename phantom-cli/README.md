# Phantom Troupe

**The graveyard of CLI scripts.** A local, multi-agent troupe that haunts your shell — autopsying failed commands, burying dead scripts, and resurrecting the ones you still need.

Runs open-weight models on your machine. Nothing leaves it.

## What it does

| Ghost | Job |
|---|---|
| **The Coroner** | Autopsies every failed command: cause of death + treatment. Remembers repeat deaths and recalls the cure that worked last time. |
| **The Medium** | Nightly sweep: inventories dead scripts, unused aliases, dormant crons. Files obituaries with verdicts — resurrect, retire, requiem. |
| **The Understudy** | Turns the graveyard into a resurrection engine: when a need matches a dead script, it proposes bringing it back with adapted arguments. |
| **The Interpreter** | Explains commands as what / when / danger — grounded in your own captured history. |
| **The Exorcist** | Guards the gate: flags destructive commands (recursive deletes, force-pushes, piped-from-curl) with severity before they run. |

A router dispatches each moment to exactly one ghost — idle agents cost nothing.

## Install

```bash
# From the release zip (every device):
unzip phantom-troupe.zip
cd phantom-troupe/phantom-cli
npm install && npm link
phantom init          # writes hooks for your shell
phantom graveyard     # local séance UI at http://127.0.0.1:7313
```

Or, if the troupe is published:

```bash
npm i -g phantom-troupe && phantom init
```

Requirements: Node 18+. For the brain, either [Ollama](https://ollama.com) with a small open-weight model (`ollama pull gemma3:4b` — default, offline, free) or a `GEMMA_API_KEY` environment variable if you prefer the hosted open-weight model. **The tool works without any brain** — capture, storage and search are plain file operations.

## Commands

| Command | Effect |
|---|---|
| `phantom` | Wake the helper in the background (loopback-only, pid in `~/.phantom/daemon.pid`) |
| `phantom graveyard` / `phantom web` | Local séance UI at `http://127.0.0.1:7313` — run real commands, deal the Dead Man's Hand, tend graves |
| `phantom status` | Roster: brain, corpse count, grave count |
| `phantom seance` | Run the nightly sweep now |
| `phantom stop` | Sleep the troupe — **all memory is kept** |
| `phantom unhook` | Remove shell capture only |
| `phantom uninstall` | Remove hooks, timers, binary — asks before deleting `~/.phantom` |

## Architecture (short version)

1. **Hooks** (zsh `preexec`/`precmd` via `add-zsh-hook`, bash `PROMPT_COMMAND`/`DEBUG` trap) fire only on non-zero exits — zero idle cost — appending to `~/.phantom/morgue.jsonl` and a rolling `commands.jsonl`.
2. **The helper** (`phantom`, detached) serves the loopback UI + API, runs the nightly sweep, and notifies the Coroner on every new death.
3. **Agents** run on an open agent framework (optional dependency) with tools over the graveyard and long-term memory in a local LibSQL file. Without it, deterministic fallbacks keep everything working.
4. **The idle reaper** unloads the model after your idle threshold (default 10 min, user-set) and shows the ghost ascending — RAM returned to the living.
5. **Storage is plain files** in `~/.phantom`: `morgue.jsonl`, `graves.jsonl`, `commands.jsonl`, `config.json`, `memory.db` (rebuildable index).

## Privacy

Shell history is the most sensitive data on a computer. That is why:
- the default brain is local and there is no account anywhere;
- the séance UI binds to `127.0.0.1` only;
- crash telemetry is opt-in (unset by default — `PHANTOM_SENTRY_DSN`), and documented;
- everything stored is a plain file you can `cat`.

## Development

```bash
npm install
npm run typecheck
npm run build
node dist/index.js help
```

CI (GitHub Actions) typechecks, builds, and smoke-tests hook idempotence, corpse capture, and a daemon round trip on Linux + macOS, bash + zsh. See `.github/workflows/ci.yml`.

## License

MIT
