# phantom-troupe install — Windows PowerShell
# One command, everything else follows. Requires Node 18.17+.
$ErrorActionPreference = "Stop"

$REQUIRED_NODE = "18.17"

Write-Host "[phantom-troupe] checking Node.js…" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[phantom-troupe] Node.js not found. Install it first:"
  Write-Host "  winget install OpenJS.NodeJS.LTS"
  Write-Host "  or get it at https://nodejs.org" -ForegroundColor Yellow
  exit 1
}

$NODE_VERSION = (node -v).TrimStart('v')
$NODE_MAJOR = [int]($NODE_VERSION.Split('.')[0])
$NODE_MINOR = [int]($NODE_VERSION.Split('.')[1])
$REQ_MAJOR = [int]($REQUIRED_NODE.Split('.')[0])
$REQ_MINOR = [int]($REQUIRED_NODE.Split('.')[1])

if ($NODE_MAJOR -lt $REQ_MAJOR -or ($NODE_MAJOR -eq $REQ_MAJOR -and $NODE_MINOR -lt $REQ_MINOR)) {
  Write-Host "[phantom-troupe] Node $NODE_VERSION is too old — need $REQUIRED_NODE+" -ForegroundColor Red
  exit 1
}

Write-Host "[phantom-troupe] Node $NODE_VERSION OK" -ForegroundColor Green

# Resolve the directory this script lives in
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[phantom-troupe] installing dependencies…" -ForegroundColor Cyan
npm install --prefix "$SCRIPT_DIR"

Write-Host "[phantom-troupe] building…" -ForegroundColor Cyan
npm run build --prefix "$SCRIPT_DIR"

Write-Host "[phantom-troupe] linking binary…" -ForegroundColor Cyan
npm link --prefix "$SCRIPT_DIR"

Write-Host "[phantom-troupe] initializing hooks and config…" -ForegroundColor Cyan
phantom init

Write-Host ""
Write-Host "[phantom-troupe] installed." -ForegroundColor Green
Write-Host "  phantom            — wake the troupe"
Write-Host "  phantom graveyard  — local séance UI at http://127.0.0.1:7313"
Write-Host "  phantom stop       — sleep the troupe" -ForegroundColor Cyan
Write-Host ""
Write-Host "Optional local brain: ollama pull gemma3:4b"
Write-Host "Or switch to Gemma API key in ~/.phantom/config.json" -ForegroundColor Cyan
