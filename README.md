# Phantom Troupe — the graveyard of CLI scripts

A troupe of local AI agents that haunts your shell: it captures failed commands,
autopsies dead scripts, buries the ones nobody calls anymore, and resurrects the
ones you still need. Everything runs on your machine — plain files, local models,
no accounts, no telemetry, no cloud.

## What's in the coffin

```
phantom-troupe/
├── phantom-cli/     the CLI + local web UI + Mastra agents (TypeScript)
│   ├── src/         source
│   ├── dist/        compiled build — runs bare; `npm install` adds agents + telemetry
│   ├── webui/       the séance UI served at 127.0.0.1:7313
│   └── docs/        ARCHITECTURE.md + PRIVACY.md
├── site/            this landing page (Next.js 16 + Tailwind 4)
├── .github/         CI (cross-shell matrix tests) + npm release workflow
├── render.yaml      one-click Render deploy blueprint for the landing site
├── INSTALL.md       step-by-step per-device guide (macOS · Linux · Windows)
└── README.md        you are here
```

## Quick start (60 seconds)

**From the release zip (every device):**

```bash
unzip phantom-troupe.zip
cd phantom-troupe/phantom-cli
npm install && npm link
phantom                       # wake the troupe (background, loopback-only)
phantom graveyard             # open the séance UI in your browser
```

**Or, one-liner installers (macOS / Linux / Windows):**

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/N-Garai/Phantom-Troupe/main/phantom-cli/install.sh | bash

# Windows PowerShell
irm https://raw.githubusercontent.com/N-Garai/Phantom-Troupe/main/phantom-cli/install.ps1 | iex
```

Prefer doing it by hand? See [INSTALL.md](./INSTALL.md) for every platform and troubleshooting.

## Requirements

- Node.js 18.17+ — that's it for capture, storage and the UI
- Optional brain: [Ollama](https://ollama.com) with `ollama pull gemma3:4b`
  (~4.6 GB, runs on CPU), or a Gemma API key in `GEMMA_API_KEY` — choose in
  `~/.phantom/config.json` or the séance UI's Memory tab
- 4 GB RAM is comfortable; capture works even with the brain offline
  (failures are stored, autopsied lazily when the model wakes)

## The commands

| command | what it does |
|---|---|
| `phantom` | wake the troupe in the background, work from your shell |
| `phantom graveyard` | open the local séance UI (same machine, same data) |
| `phantom web` | same UI, explicit |
| `phantom seance` | run the nightly graveyard sweep right now |
| `phantom stop` | put them to sleep — all memory is kept |
| `phantom uninstall` | remove hooks + timer; asks before deleting `~/.phantom` |
| `phantom init` | (re)install hooks + config |
| `phantom settings` | choose brain (ollama vs gemma-api) + store API key |
| `phantom guard <cmd>` | Exorcist pre-run gate — inspect before execution |
| `phantom autopsy <cmd>` | Coroner cause-of-death report for any command |
| `phantom explain <cmd>` | Interpreter: WHAT / WHEN / DANGER for any command |

## License

MIT. Your bones stay on your machine.
