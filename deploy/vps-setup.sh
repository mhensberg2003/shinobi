#!/usr/bin/env bash
# vps-setup.sh — one-time VPS setup (run as root on the server)
set -euo pipefail

# --- Node.js (via NodeSource) ---
if ! command -v node &>/dev/null; then
  echo "==> Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node --version

# --- shinobi user ---
if ! id shinobi &>/dev/null; then
  echo "==> Creating shinobi user..."
  useradd --system --shell /bin/false --home /opt/shinobi --create-home shinobi
fi

# --- App directories ---
mkdir -p /opt/shinobi /opt/shinobi-backend
mkdir -p /var/lib/shinobi-backend /var/cache/shinobi-backend
mkdir -p /etc/shinobi /etc/shinobi-backend
chown -R shinobi:shinobi /opt/shinobi /opt/shinobi-backend
chown -R shinobi:shinobi /var/lib/shinobi-backend /var/cache/shinobi-backend

# --- Env file stubs (fill these in!) ---
if [ ! -f /etc/shinobi/shinobi.env ]; then
  cat > /etc/shinobi/shinobi.env <<'EOF'
SHINOBI_BACKEND_URL=http://127.0.0.1:9241
SHINOBI_BACKEND_SECRET=CHANGE_ME
TMDB_READ_ACCESS_TOKEN=CHANGE_ME
DATABASE_URL=CHANGE_ME
EOF
  chmod 600 /etc/shinobi/shinobi.env
  echo "==> EDIT /etc/shinobi/shinobi.env with real values!"
fi

if [ ! -f /etc/shinobi-backend/shinobi-backend.env ]; then
  cat > /etc/shinobi-backend/shinobi-backend.env <<'EOF'
PORT=9241
HOST=0.0.0.0
SHINOBI_SHARED_SECRET=CHANGE_ME
SHINOBI_WORK_ROOT=/var/lib/shinobi-backend
SHINOBI_CACHE_ROOT=/var/cache/shinobi-backend
PUBLIC_BASE_URL=http://188.245.226.225:9241
REAL_DEBRID_API_BASE_URL=https://api.real-debrid.com/rest/1.0
REAL_DEBRID_API_TOKEN=CHANGE_ME
INSPECT_CACHE_TTL_MS=600000
INSPECT_COMMAND_TIMEOUT_MS=20000
EOF
  chmod 600 /etc/shinobi-backend/shinobi-backend.env
  echo "==> EDIT /etc/shinobi-backend/shinobi-backend.env with real values!"
fi

echo ""
echo "==> VPS setup complete."
echo "    Next steps:"
echo "    1. Fill in /etc/shinobi/shinobi.env"
echo "    2. Fill in /etc/shinobi-backend/shinobi-backend.env"
echo "    3. Run ./deploy/deploy.sh from each project on your local machine"
