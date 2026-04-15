#!/bin/bash
###############################################################################
# OpenRealm — nginx HTTPS reverse proxy setup (Amazon Linux 2023)
#
# Idempotent — safe to run multiple times. Installs nginx + certbot,
# writes the config, obtains a Let's Encrypt cert, migrates the data
# service from port 80 → 8080 (behind nginx), and sets up auto-renewal.
#
# Run standalone:   sudo ./setup-nginx.sh
# Or via deploy:    deploy-remote.bat data  (calls this automatically)
#
# After running:
#   https://openrealm.net        → data service (port 8080)
#   wss://openrealm.net/ws/useast → game server US East (ws://100.55.103.226:2223)
#   wss://openrealm.net/ws/euwest → game server EU West (ws://51.24.13.231:2223)
###############################################################################
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "ERROR: Run as root (sudo ./setup-nginx.sh)"
  exit 1
fi

### ── Configuration ─────────────────────────────────────────────────────────
DOMAIN="openrealm.net"
DATA_PORT=8080
GS_USEAST="100.55.103.226:2223"
GS_EUWEST="51.24.13.231:2223"
APP_ENV="/opt/openrealm-data/env"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

echo "============================================="
echo " OpenRealm — nginx HTTPS setup"
echo "============================================="

### ── 1. Install nginx ──────────────────────────────────────────────────────
echo "[1/5] Installing nginx..."
if ! command -v nginx &>/dev/null; then
  dnf install -y -q nginx
fi
echo "  nginx $(nginx -v 2>&1 | cut -d/ -f2)"

### ── 2. Install certbot ────────────────────────────────────────────────────
echo "[2/5] Installing certbot..."
if ! command -v certbot &>/dev/null; then
  dnf install -y -q python3-pip augeas-libs
  pip3 install -q certbot certbot-nginx
fi
echo "  certbot $(certbot --version 2>&1 | awk '{print $NF}')"

### ── 3. Obtain TLS cert (certonly — does NOT touch nginx config) ───────────
echo "[3/5] Checking TLS certificate..."
mkdir -p /var/www/html/.well-known/acme-challenge

if [[ -f "${CERT_DIR}/fullchain.pem" ]]; then
  echo "  TLS certificate already exists — skipping certbot."
  HAS_CERT=true
else
  echo "  Requesting Let's Encrypt cert for ${DOMAIN}..."
  echo "  (DNS must point ${DOMAIN} → this server's public IP)"

  # Stop nginx temporarily so certbot can bind to port 80 (standalone mode)
  systemctl stop nginx 2>/dev/null || true

  if certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email; then
    echo "  TLS certificate obtained."
    HAS_CERT=true
  else
    echo ""
    echo "  WARNING: certbot failed — HTTPS will not be available."
    echo "  Fix DNS and run: sudo certbot certonly --standalone -d ${DOMAIN}"
    HAS_CERT=false
  fi
fi

### ── 4. Write nginx config (both 80 + 443, fully controlled by us) ────────
echo "[4/5] Writing nginx config..."

# Shared proxy block for WebSocket + data service (used in both 80 and 443)
# Written as an include file to avoid duplication
mkdir -p /etc/nginx/snippets

cat > /etc/nginx/snippets/openrealm-proxy.conf <<PROXYEOF
# WebSocket routes — WSS/WS → plain WS to game servers
location /ws/useast {
    proxy_pass http://gs_useast;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
location /ws/euwest {
    proxy_pass http://gs_euwest;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
location /ws/local {
    proxy_pass http://gs_local;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}

# Data service — everything else
location / {
    proxy_pass http://data_service;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_buffering off;
}
PROXYEOF

# Main nginx config — we own this entirely, certbot never touches it
cat > /etc/nginx/conf.d/openrealm.conf <<NGINXEOF
# OpenRealm reverse proxy — managed by setup-nginx.sh
# Do not edit manually; re-run setup-nginx.sh to regenerate.

upstream data_service {
    server 127.0.0.1:${DATA_PORT};
}
upstream gs_useast {
    server ${GS_USEAST};
}
upstream gs_euwest {
    server ${GS_EUWEST};
}
upstream gs_local {
    server 127.0.0.1:2223;
}

NGINXEOF

if [[ "${HAS_CERT}" == "true" ]]; then
  # Full setup: 80 redirects to 443, 443 terminates TLS
  cat >> /etc/nginx/conf.d/openrealm.conf <<NGINXEOF
# HTTP — redirect to HTTPS (except game server internal calls via IP)
server {
    listen 80 default_server;
    server_name ${DOMAIN} _;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy locations on port 80 too — game servers call the data service
    # via http://IP:80 and don't follow redirects
    include snippets/openrealm-proxy.conf;
}

# HTTPS — TLS termination
server {
    listen 443 ssl http2 default_server;
    server_name ${DOMAIN} _;

    ssl_certificate     ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;

    # Mozilla Modern TLS config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    include snippets/openrealm-proxy.conf;
}
NGINXEOF
else
  # No cert yet — serve everything on HTTP
  cat >> /etc/nginx/conf.d/openrealm.conf <<NGINXEOF
server {
    listen 80 default_server;
    server_name ${DOMAIN} _;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    include snippets/openrealm-proxy.conf;
}
NGINXEOF
fi

# Remove default site
rm -f /etc/nginx/conf.d/default.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

### ── 5. Migrate data service to port 8080 + start nginx ────────────────────
echo "[5/5] Configuring data service + starting nginx..."

if [[ -f "${APP_ENV}" ]]; then
  if grep -q "^DATA_PORT=" "${APP_ENV}"; then
    sed -i "s|^DATA_PORT=.*|DATA_PORT=${DATA_PORT}|" "${APP_ENV}"
  else
    echo "DATA_PORT=${DATA_PORT}" >> "${APP_ENV}"
  fi

  if [[ -f /etc/systemd/system/openrealm-data.service ]]; then
    sed -i '/AmbientCapabilities=CAP_NET_BIND_SERVICE/d' /etc/systemd/system/openrealm-data.service
    systemctl daemon-reload
  fi
  systemctl restart openrealm-data
  echo "  Data service restarted on port ${DATA_PORT}."
else
  echo "  WARNING: ${APP_ENV} not found — data service not installed yet."
  echo "  Run deploy-remote.bat data first, then re-run this script."
fi

# Test and start nginx
nginx -t
systemctl enable nginx
systemctl restart nginx

# Auto-renewal cron
if ! crontab -l 2>/dev/null | grep -q certbot; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
  echo "  Auto-renewal cron added (daily 3 AM)."
fi

# Firewall
if command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-port=80/tcp  2>/dev/null || true
  firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
  firewall-cmd --reload
fi

echo ""
echo "============================================="
echo " HTTPS SETUP COMPLETE"
echo "============================================="
echo ""
if [[ "${HAS_CERT}" == "true" ]]; then
  echo " https://${DOMAIN}/            → data service (:${DATA_PORT})"
  echo " wss://${DOMAIN}/ws/useast     → ${GS_USEAST}"
  echo " wss://${DOMAIN}/ws/euwest     → ${GS_EUWEST}"
else
  echo " http://${DOMAIN}/             → data service (:${DATA_PORT})"
  echo " ws://${DOMAIN}/ws/useast      → ${GS_USEAST} (no TLS yet)"
fi
echo ""
echo " AWS Security Groups — ensure ports 80 + 443 are open."
echo "============================================="
