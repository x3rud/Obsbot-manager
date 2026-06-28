$ErrorActionPreference = "Stop"

$REPO = "https://github.com/x3rud/Obsbot-manager.git"
$INSTALL_DIR = if ($env:OBSBOT_DIR) { $env:OBSBOT_DIR } else { "$HOME\.obsbot" }

# ── Node.js check / auto-install ────────────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "==> Node.js not found. Installing..."

  # Try winget (Windows 10 1709+ / Windows 11)
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "==> Using winget to install Node.js LTS..."
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  }
  # Try Chocolatey
  elseif (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "==> Using Chocolatey to install Node.js LTS..."
    choco install nodejs-lts -y
  }
  # Fall back: download MSI directly from nodejs.org
  else {
    Write-Host "==> Downloading Node.js LTS installer from nodejs.org..."
    try {
      $index   = Invoke-RestMethod "https://nodejs.org/dist/index.json"
      $lts     = $index | Where-Object { $_.lts } | Select-Object -First 1
      $ver     = $lts.version
      $msiUrl  = "https://nodejs.org/dist/$ver/node-$ver-x64.msi"
      $msiPath = "$env:TEMP\nodejs_lts.msi"
      Write-Host "==> Fetching $msiUrl ..."
      Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
      Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /quiet /norestart" -Wait
      Remove-Item $msiPath -Force -ErrorAction SilentlyContinue
    } catch {
      throw "Could not download Node.js: $_`nPlease install manually from https://nodejs.org and re-run this script."
    }
  }

  # Refresh PATH so node/npm are visible in this session
  $env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path","User")

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js installed but 'node' is still not on PATH. Open a new terminal and re-run this script."
  }
  Write-Host "==> Node.js $(node --version) ready."
} else {
  Write-Host "==> Node.js $(node --version) already installed."
}

# ── Package-manager selection ────────────────────────────────────────────────
$PM = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } `
      elseif (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } `
      else { throw "Neither pnpm nor npm found after Node.js install — something went wrong." }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git not found. Please install Git from https://git-scm.com and re-run this script."
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
