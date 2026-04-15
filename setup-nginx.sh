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

### ── 3. Write nginx config ─────────────────────────────────────────────────
echo "[3/5] Writing nginx config..."

cat > /etc/nginx/conf.d/openrealm.conf <<'NGINXEOF'
# OpenRealm HTTPS reverse proxy — managed by setup-nginx.sh
# Do not edit manually; re-run setup-nginx.sh to regenerate.

upstream data_service {
    server 127.0.0.1:DATA_PORT_PLACEHOLDER;
}
upstream gs_useast {
    server GS_USEAST_PLACEHOLDER;
}
upstream gs_euwest {
    server GS_EUWEST_PLACEHOLDER;
}
upstream gs_local {
    server 127.0.0.1:2223;
}

server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # WebSocket routes
    location /ws/useast {
        proxy_pass http://gs_useast;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    location /ws/euwest {
        proxy_pass http://gs_euwest;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    location /ws/local {
        proxy_pass http://gs_local;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Data service
    location / {
        proxy_pass http://data_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
NGINXEOF

# Substitute placeholders (can't use shell vars inside a quoted heredoc)
sed -i "s|DATA_PORT_PLACEHOLDER|${DATA_PORT}|g" /etc/nginx/conf.d/openrealm.conf
sed -i "s|GS_USEAST_PLACEHOLDER|${GS_USEAST}|g" /etc/nginx/conf.d/openrealm.conf
sed -i "s|GS_EUWEST_PLACEHOLDER|${GS_EUWEST}|g" /etc/nginx/conf.d/openrealm.conf
sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g"       /etc/nginx/conf.d/openrealm.conf

# Remove default site
rm -f /etc/nginx/conf.d/default.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

### ── 4. Migrate data service to port 8080 ──────────────────────────────────
echo "[4/5] Configuring data service for port ${DATA_PORT}..."

if [[ -f "${APP_ENV}" ]]; then
  # Add or update DATA_PORT in env file
  if grep -q "^DATA_PORT=" "${APP_ENV}"; then
    sed -i "s|^DATA_PORT=.*|DATA_PORT=${DATA_PORT}|" "${APP_ENV}"
  else
    echo "DATA_PORT=${DATA_PORT}" >> "${APP_ENV}"
  fi

  # Remove the CAP_NET_BIND_SERVICE line from the systemd unit (no longer
  # needs port 80) and restart the data service on the new port
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

### ── 5. Start nginx + obtain TLS cert ──────────────────────────────────────
echo "[5/5] Starting nginx and obtaining TLS certificate..."

mkdir -p /var/www/html/.well-known/acme-challenge
nginx -t
systemctl enable nginx
systemctl restart nginx

# Only run certbot if we don't already have a cert
if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "  TLS certificate already exists — skipping certbot."
else
  echo "  Requesting Let's Encrypt cert for ${DOMAIN}..."
  echo "  (DNS must point ${DOMAIN} → this server's public IP)"
  if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email; then
    echo "  TLS certificate obtained."
  else
    echo ""
    echo "  WARNING: certbot failed — site works on HTTP only."
    echo "  Fix DNS and run: sudo certbot --nginx -d ${DOMAIN}"
  fi
fi

# Auto-renewal cron
if ! crontab -l 2>/dev/null | grep -q certbot; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
  echo "  Auto-renewal cron added (daily 3 AM)."
fi

# Open firewall ports
if command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-port=80/tcp  2>/dev/null || true
  firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
  firewall-cmd --reload
fi

systemctl reload nginx

echo ""
echo "============================================="
echo " HTTPS SETUP COMPLETE"
echo "============================================="
echo ""
echo " https://${DOMAIN}/            → data service (:${DATA_PORT})"
echo " wss://${DOMAIN}/ws/useast     → ${GS_USEAST}"
echo " wss://${DOMAIN}/ws/euwest     → ${GS_EUWEST}"
echo ""
echo " AWS Security Groups — ensure ports 80 + 443 are open."
echo "============================================="
