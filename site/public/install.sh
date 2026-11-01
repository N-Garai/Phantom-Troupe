#!/usr/bin/env bash
# phantom-troupe install — macOS / Linux
# One curl, everything else follows. Requires Node 18.17+.
set -euo pipefail

REQUIRED_NODE="18.17"

echo "[phantom-troupe] checking Node.js…"
if ! command -v node >/dev/null 2>&1; then
  echo "[phantom-troupe] Node.js not found. Install it first:"
  echo "  macOS:   brew install node"
  echo "  Debian:  sudo apt install nodejs npm"
  echo "  Arch:    sudo pacman -S nodejs npm"
  echo "  or get it at https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
NODE_MINOR=$(echo "$NODE_VERSION" | cut -d. -f2)
REQ_MAJOR=$(echo "$REQUIRED_NODE" | cut -d. -f1)
REQ_MINOR=$(echo "$REQUIRED_NODE" | cut -d. -f2)

if [ "$NODE_MAJOR" -lt "$REQ_MAJOR" ] || { [ "$NODE_MAJOR" -eq "$REQ_MAJOR" ] && [ "$NODE_MINOR" -lt "$REQ_MINOR" ]; }; then
  echo "[phantom-troupe] Node $NODE_VERSION is too old — need $REQUIRED_NODE+"
  exit 1
fi

echo "[phantom-troupe] Node $NODE_VERSION OK"

# Resolve the directory this script lives in (works with curl | bash too)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[phantom-troupe] installing dependencies…"
npm install --prefix "$SCRIPT_DIR"

echo "[phantom-troupe] building…"
npm run build --prefix "$SCRIPT_DIR"

echo "[phantom-troupe] linking binary…"
npm link --prefix "$SCRIPT_DIR"

echo "[phantom-troupe] initializing hooks and config…"
phantom init

echo ""
echo "[phantom-troupe] installed."
echo "  phantom            — wake the troupe"
echo "  phantom graveyard  — local séance UI at http://127.0.0.1:7313"
echo "  phantom stop       — sleep the troupe"
echo ""
echo "Optional local brain: ollama pull gemma3:4b"
echo "Or switch to Gemma API key in ~/.phantom/config.json"
