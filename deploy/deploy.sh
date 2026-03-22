#!/usr/bin/env bash
# deploy.sh — build and deploy Shinobi frontend to VPS
# Usage: ./deploy/deploy.sh <user@host>
# Example: ./deploy/deploy.sh root@188.245.226.225
set -euo pipefail

HOST="${1:?Usage: $0 <user@host>}"
REMOTE_DIR="/opt/shinobi"

echo "==> Building frontend..."
pnpm install --frozen-lockfile
pnpm build

echo "==> Syncing standalone build to $HOST:$REMOTE_DIR..."
# Standalone server
rsync -az --delete .next/standalone/ "$HOST:$REMOTE_DIR/"
# Static assets (not included in standalone)
rsync -az --delete .next/static/ "$HOST:$REMOTE_DIR/.next/static/"
# Public folder
rsync -az --delete public/ "$HOST:$REMOTE_DIR/public/"

echo "==> Installing service file..."
rsync -az deploy/shinobi.service "$HOST:/etc/systemd/system/shinobi.service"

echo "==> Restarting service on remote..."
ssh "$HOST" "
  chown -R shinobi:shinobi $REMOTE_DIR
  systemctl daemon-reload
  systemctl enable shinobi
  systemctl restart shinobi
  systemctl status shinobi --no-pager
"

echo "==> Done."
