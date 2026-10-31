# Installing the Troupe — every device, every path

Pick the path that matches your device. The result is identical everywhere:
hooks that watch for failed commands, a local UI on `127.0.0.1:7313`, and all
data in `~/.phantom` as plain files you can read and delete.

---

## 0. Requirements (all platforms)

- **Node.js 18.17 or newer** — check with `node -v`. Get it at
  <https://nodejs.org> (or via `brew install node`, `apt install nodejs npm`,
  `winget install OpenJS.NodeJS.LTS`).
- ~150 MB disk for the tool; **optional** +4.6 GB if you want the local brain
  via Ollama (`ollama pull gemma3:4b`).
- A terminal. That's the whole point.

---

## 1. macOS

```bash
unzip phantom-troupe.zip
cd phantom-troupe/phantom-cli
npm install
npm link                 # adds the `phantom` command to your PATH
phantom init             # writes hooks into ~/.zshrc (auto-detects zsh/bash)
exec $SHELL              # reload your shell so hooks load
phantom                  # wake the troupe
phantom graveyard        # open the séance UI in your browser
```

Optional local brain:

```bash
brew install ollama && brew services start ollama
ollama pull gemma3:4b
```

Prefer the bigger sibling? Edit `~/.phantom/config.json` →
`{"provider": "gemma-api", "model": "gemma-2b-it"}` and export
`GEMMA_API_KEY` in your shell. Switch back with `"provider": "ollama"`.

---

## 2. Linux

Identical to macOS, with your package manager for Node if you don't have it:

```bash
sudo apt install nodejs npm        # Debian/Ubuntu
# sudo dnf install nodejs npm      # Fedora
# sudo pacman -S nodejs npm        # Arch

unzip phantom-troupe.zip
cd phantom-troupe/phantom-cli
npm install && npm link
phantom init && exec $SHELL
phantom
```

The nightly séance is scheduled with a **systemd user timer** (created by
`phantom init` when systemd is present). It is optional — remove it anytime
with `phantom uninstall`.

---

## 3. Windows

Native PowerShell, full experience — no WSL required:

```powershell
winget install OpenJS.NodeJS.LTS                               # once, if Node isn't there yet
irm https://raw.githubusercontent.com/N-Garai/Phantom-Troupe/main/phantom-cli/install.ps1 | iex
```

Or the manual route:

```powershell
Expand-Archive phantom-troupe.zip
cd phantom-troupe\phantom-cli
npm install && npm link
phantom init          # writes hooks into Documents\...\profile.ps1 (both PS 7 & 5.1)
phantom graveyard
```

Capture works differently on Windows — PowerShell has no `preexec`, so the
hook dresses your prompt: it reads the last history entry and its native
`$LASTEXITCODE`, and only phones the helper when a command actually died
(`exit != 0`). Cmdlet-level exceptions (non-native errors) are not captured by
the prompt hook; the séance UI catches every failure itself, since it executes
commands through PowerShell directly.

The nightly séance is scheduled with **schtasks** (`PhantomTroupeSeance`,
02:17 daily, user level). Remove it with `phantom uninstall`.

WSL still gets the zsh/bash hook experience if you prefer it — follow the
Linux section from inside WSL — but native Windows is now complete.

---

## 4. Phone / tablet / any device — try it without installing

The hosted landing page includes a faithful **browser simulation** of the
séance UI — scroll to the trial section and type `help`. The real local UI is
the same experience, served by your own machine at `http://127.0.0.1:7313`
after `phantom graveyard`.

---

## 5. Self-hosting the landing site (optional)

The `site/` folder builds to a **fully static bundle** (`out/`): plain HTML, CSS
and JS with no server runtime. Build and serve it anywhere:

```bash
cd site
npm install
npm run build      # → site/out, including the /phantom-troupe.zip download
npx serve out      # any static file server, serves on :3000
```

**Deploying to Render (recommended, free tier):**

- **Easiest:** commit the shipped `render.yaml`, then Render dashboard →
  **New → Blueprint** → point at the repo. It reads the blueprint and creates a
  **static site** that runs `cd site && npm install && npm run build` and serves
  `site/out` from a global CDN. Zero config beyond that.
- **Manual equivalent:** New → **Static Site** → build command
  `cd site && npm install && npm run build`, publish directory `site/out`.
- Node version: 22 (set `NODE_VERSION` env var). No environment keys, no
  database, **nothing sleeps** — static sites on Render don't spin down, so the
  page is always instantly up.

A web service (Node) also still works — any Node host (Fly.io, Railway, a $0
VPS) can serve the `out/` directory — but it buys you nothing for this site and
idle-spins on free tiers. Prefer static. (GitHub Pages, Netlify and
Cloudflare Pages all work the same way: publish `site/out`.)

---

## 6. Troubleshooting

- **`phantom: command not found` after `npm link`** — reopen the terminal, or
  add npm's global bin to PATH (`npm bin -g` shows where).
- **Hooks don't seem to fire** — run `exec $SHELL` after `phantom init`, then
  test with a deliberately broken command (`gti status`). If nothing is
  captured, re-run `phantom init`.
- **Brain won't start** — the troupe works without it: failures are captured
  first and diagnosed lazily. Check `ollama list` shows `gemma3:4b`.
- **Port 7313 busy** — `phantom stop` first; the UI binds loopback only.
- **Nuclear option** — `phantom uninstall` removes hooks, timers and the
  binary, then asks *once* whether to delete `~/.phantom`. Nothing is removed
  without that explicit confirmation.
