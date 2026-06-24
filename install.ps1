$ErrorActionPreference = "Stop"

$REPO = "https://github.com/x3rud/Obsbot-manager.git"
$INSTALL_DIR = if ($env:OBSBOT_DIR) { $env:OBSBOT_DIR } else { "$HOME\.obsbot" }

# Prefer pnpm, fall back to npm
$PM = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } `
      elseif (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } `
      else { throw "Neither pnpm nor npm found. Install Node.js first." }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git not found."
}

if (Test-Path "$INSTALL_DIR\.git") {
  Write-Host "==> Existing install found at $INSTALL_DIR - pulling latest..."
  git -C $INSTALL_DIR pull
} else {
  Write-Host "==> Cloning into $INSTALL_DIR..."
  git clone $REPO $INSTALL_DIR
}

Write-Host "==> Installing server dependencies..."
& $PM install --prefix $INSTALL_DIR

Write-Host "==> Building frontend..."
Set-Location "$INSTALL_DIR\app"
& $PM install
& $PM run build

Write-Host ""
Write-Host "ObsBot Manager installed."
Write-Host ""
Write-Host "  Start:   cd $INSTALL_DIR; $PM start"
Write-Host "  Update:  re-run this script, or use the Update button in the UI"
