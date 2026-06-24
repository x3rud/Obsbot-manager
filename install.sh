#!/usr/bin/env bash
set -e

REPO="https://github.com/x3rud/Obsbot-manager.git"
INSTALL_DIR="${OBSBOT_DIR:-$HOME/.obsbot}"

# Prefer pnpm, fall back to npm
if command -v pnpm &>/dev/null; then
  PM="pnpm"
elif command -v npm &>/dev/null; then
  PM="npm"
else
  echo "Error: neither pnpm nor npm found. Install Node.js first." >&2
  exit 1
fi

if ! command -v git &>/dev/null; then
  echo "Error: git not found." >&2
  exit 1
fi

if [ -d "$INSTALL_DIR/.git" ]; then
  echo "==> Existing install found at $INSTALL_DIR — pulling latest..."
  git -C "$INSTALL_DIR" pull
else
  echo "==> Cloning into $INSTALL_DIR..."
  git clone "$REPO" "$INSTALL_DIR"
fi

echo "==> Installing server dependencies..."
"$PM" install --prefix "$INSTALL_DIR"

echo "==> Building frontend..."
cd "$INSTALL_DIR/app"
"$PM" install
"$PM" run build

echo ""
echo "ObsBot Manager installed."
echo ""
echo "  Start:   cd $INSTALL_DIR && $PM start"
echo "  Update:  run this script again, or use the Update button in the UI"
