# Phantom Troupe — one-line installer for Windows PowerShell.
# Detects the environment, installs the CLI, writes the PowerShell hooks,
# and leaves the troupe ready to wake.  irm <url>/install.ps1 | iex

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$GOLD    = "`e[38;5;214m"; $SPECTRE = "`e[38;5;120m"; $DIM = "`e[2m"; $BOLD = "`e[1m"; $RESET = "`e[0m"
if ($PSVersionTable.PSVersion.Major -lt 7 -or -not $PSStyle) {
    $GOLD = ""; $SPECTRE = ""; $DIM = ""; $BOLD = ""; $RESET = ""  # no ansi, no drama
}

Write-Host ""
Write-Host "  $BOLD$GOLD   ___              _                      _             $RESET"
Write-Host "$BOLD$GOLD  | _ \_ _ _____ __| |__ _ _  _ _ __  __ _| |___ _ _  ___ $RESET"
Write-Host "$GOLD  |  _/ '_/ -_) V  / _ \ '_| || '  \/ _` | / _ \ ' \/ -)$RESET"
Write-Host "$GOLD  |_| |_|\___|\_/|\___/_|  \_,_|_|\__,_|_\\___/_||_\___|$RESET"
Write-Host "$DIM   the graveyard of CLI scripts — local, open, yours$RESET"
Write-Host ""

# --- node check --------------------------------------------------------------
function Have-Node {
    try { $null = & node -v; return $true } catch { return $false }
}

if (-not (Have-Node)) {
    Write-Host "$SPECTRE no Node.js found. install it (18+) with:$RESET" >&2
    Write-Host "  winget install OpenJS.NodeJS.LTS      # or https://nodejs.org" >&2
    exit 1
}
Write-Host "$SPECTRE· node $(node -v) answered$RESET"

# --- install -----------------------------------------------------------------
$withTimer = if ($env:PHANTOM_WITH_TIMER) { "--with-timer" } else { "" }
$done = $false
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "$SPECTRE· pulling the troupe from the registry (npm)…$RESET"
    try { npm i -g phantom-troupe; if ($LASTEXITCODE -eq 0) { $done = $true } } catch { }
}
if (-not $done) {
    Write-Host "$SPECTRE· registry refused — resurrecting from the source tarball…$RESET"
    $tmp = Join-Path ([IO.Path]::GetTempPath()) "phantom-troupe-install"
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force $tmp | Out-Null
    $zip = Join-Path $tmp "troupe.zip"
    $branch = if ($env:PHANTOM_RELEASE) { $env:PHANTOM_RELEASE } else { "main" }
    Invoke-WebRequest -UseBasicParsing "https://codeload.github.com/N-Garai/Phantom-Troupe/zip/refs/heads/$branch" -OutFile $zip
    Expand-Archive -Force $zip $tmp
    $dir = Get-ChildItem $tmp -Directory | Where-Object Name -like "Phantom-Troupe*" | Select-Object -First 1
    Push-Location (Join-Path $dir.FullName "phantom-cli")
    npm install
    npm link
    Pop-Location
    $done = $true
}

# --- init (bypass the .ps1 shim: execution policies bite shims) ---------------
Write-Host "$SPECTRE· haunting your shell…$RESET"
$globalRoot = (& npm prefix -g).Trim()
$entry = Join-Path $globalRoot "node_modules\phantom-troupe\dist\index.js"
if (-not (Test-Path $entry)) { $entry = $script:entryFallback }
if ($done -and (Test-Path $entry)) {
    & node $entry init $withTimer
} else {
    phantom init $withTimer
}

Write-Host ""
Write-Host "$GOLD the troupe is ready.$RESET $DIM Wake them:$RESET"
Write-Host "  $BOLD phantom$RESET              $DIM wake the helper in the background$RESET"
Write-Host "  $BOLD phantom graveyard$RESET    $DIM the séance UI (site or grid)$RESET"
Write-Host "  $BOLD phantom stop$RESET         $DIM sleep — the bones are kept$RESET"
Write-Host ""
Write-Host "$DIM open a NEW PowerShell window so the hooks load, then break a command:$RESET"
Write-Host "$DIM   gti status     <- a misspelled corpse for the Coroner$RESET"
Write-Host ""
