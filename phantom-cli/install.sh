#!/usr/bin/env bash
# Phantom Troupe — one-line installer for macOS & Linux.
# Detects the environment, installs the CLI, writes the shell hooks,
# and leaves the troupe ready to wake.  curl <url>/install.sh | bash
# No admin rights, no dialogs, no third party — npm does the lifting.
set -euo pipefail

BOLD=$'\033[1m'; GOLD=$'\033[38;5;214m'; SPECTRE=$'\033[38;5;120m'; DIM=$'\033[2m'; RESET=$'\033[0m'

printf '%s\n' "${BOLD}${GOLD}   ___              _                      _             "
printf '%s\n' "  | _ \\_ _ _____ __| |__ _ _  _ _ __  __ _| |___ _ _  ___"
printf '%s\n' "$GOLD  |  _/ '_/ -_) V  / _ \\ '_| || '  \\/ _\` | / _ \\ ' \\/ -)"
printf '%s\n' "$GOLD  |_| |_| \\___|\\_/|\\___/_|  \\_,_|_|\\_\\__,_|_\\___/_||_\\___|${RESET}"
printf '%s\n' "${DIM}   the graveyard of CLI scripts — local, open, yours${RESET}"
printf '\n'

if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' "phantom needs Node.js 18+ (or bun). Install it first:" >&2
  printf '%s\n' "  mac: brew install node      linux: sudo apt install nodejs npm" >&2
  printf '%s\n' "  or:  https://nodejs.org" >&2
  exit 1
fi
printf '%s\n' "${SPECTRE}· node $(node -v) answered${RESET}"

done=0
if command -v npm >/dev/null 2>&1; then
  printf '%s\n' "${SPECTRE}· pulling the troupe from the registry (npm)…${RESET}"
  if npm i -g phantom-troupe; then done=1; else printf '%s\n' "${DIM} registry refused — falling back to the source tarball…${RESET}"; fi
fi
if [ "$done" -eq 0 ]; then
  tmp="$(mktemp -d)"
  branch="${PHANTOM_RELEASE:-main}"
  printf '%s\n' "${SPECTRE}· resurrecting from the source tarball (${branch})…${RESET}"
  curl -fsSL "https://codeload.github.com/N-Garai/Phantom-Troupe/tar.gz/refs/heads/${branch}" | tar xzf - -C "$tmp"
  dir="$(find "$tmp" -maxdepth 1 -type d -name 'Phantom-Troupe*' | head -n1)"
  (cd "$dir/phantom-cli" && npm install --silent && npm link)
  printf '%s\n' "${SPECTRE}· the troupe assembled from bones.${RESET}"
  done=1
fi

printf '%s\n' "${SPECTRE}· haunting your shell…${RESET}"
phantom init ${PHANTOM_WITH_TIMER:+--with-timer}

printf '\n%s\n' "${GOLD}the troupe is ready.${RESET} ${DIM}Wake them:${RESET}"
printf '%s\n' "  ${BOLD}phantom${RESET}              ${DIM}wake the helper in the background${RESET}"
printf '%s\n' "  ${BOLD}phantom graveyard${RESET}    ${DIM}sit at the séance table (browser UI)${RESET}"
printf '%s\n' "  ${BOLD}phantom stop${RESET}         ${DIM}sleep — the bones are kept${RESET}"
printf '\n%s\n' "${DIM}restart your shell (or: exec \$SHELL) so the hooks load, then break a command:${RESET}"
printf '%s\n' "${DIM}  gti status    <- a misspelled corpse for the Coroner${RESET}"
