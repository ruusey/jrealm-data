#!/bin/bash
###############################################################################
# OpenRealm Data Service — Amazon Linux 2023 deployment script
#
# Installs: JDK 17, Maven, MongoDB 7, builds the jar, configures MongoDB
# with authentication, and registers a systemd service.
#
# Usage:
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# After running, the service is managed with:
#   sudo systemctl start|stop|restart|status openrealm-data
#
# MongoDB credentials are written to /opt/openrealm-data/env and printed
# at the end. The connection URI is passed to the app via MONGO_URI.
###############################################################################
set -euo pipefail

### ── Require root ──────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "ERROR: Run this script as root (sudo ./deploy.sh)"
  exit 1
fi

### ── Configuration ─────────────────────────────────────────────────────────
APP_NAME="openrealm-data"
APP_DIR="/opt/${APP_NAME}"
APP_USER="openrealm"
MONGO_DB="jrealm"
MONGO_PORT=27017
APP_PORT=80

# Generate secure random credentials
MONGO_USER="openrealm_admin"
MONGO_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================="
echo " OpenRealm Data — Amazon Linux Deploy"
echo "============================================="

### ── 1. System packages ────────────────────────────────────────────────────
echo "[1/8] Installing system dependencies..."
dnf update -y -q
dnf install -y -q java-17-amazon-corretto-devel git openssl

### ── 2. Maven ──────────────────────────────────────────────────────────────
echo "[2/8] Installing Maven..."
if ! command -v mvn &>/dev/null; then
  MVN_VER="3.9.9"
  cd /tmp
  curl -sLO "https://dlcdn.apache.org/maven/maven-3/${MVN_VER}/binaries/apache-maven-${MVN_VER}-bin.tar.gz"
  tar -xzf "apache-maven-${MVN_VER}-bin.tar.gz" -C /opt
  ln -sf "/opt/apache-maven-${MVN_VER}/bin/mvn" /usr/local/bin/mvn
  rm -f "apache-maven-${MVN_VER}-bin.tar.gz"
  echo "Maven ${MVN_VER} installed."
else
  echo "Maven already installed: $(mvn -version | head -1)"
fi

### ── 3. MongoDB 7 ──────────────────────────────────────────────────────────
echo "[3/8] Installing MongoDB 7..."
if ! command -v mongod &>/dev/null; then
  cat > /etc/yum.repos.d/mongodb-org-7.0.repo <<'REPO'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
REPO
  dnf install -y -q mongodb-org
  echo "MongoDB 7 installed."
else
  echo "MongoDB already installed: $(mongod --version | head -1)"
fi

### ── 4. Configure & start MongoDB ──────────────────────────────────────────
echo "[4/8] Configuring MongoDB..."

# Back up original config
cp -n /etc/mongod.conf /etc/mongod.conf.bak 2>/dev/null || true

cat > /etc/mongod.conf <<MONGOCFG
# OpenRealm MongoDB configuration
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

storage:
  dbPath: /var/lib/mongo

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

net:
  port: ${MONGO_PORT}
  bindIp: 0.0.0.0

security:
  authorization: enabled
MONGOCFG

# Start MongoDB without auth first to create the user
# Temporarily disable auth for user creation
sed -i 's/authorization: enabled/authorization: disabled/' /etc/mongod.conf

systemctl daemon-reload
systemctl enable mongod
systemctl restart mongod

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
for i in {1..30}; do
  if mongosh --quiet --eval "db.runCommand({ping:1})" &>/dev/null; then
    break
  fi
  sleep 1
done

# Create admin user and app user
echo "Creating MongoDB users..."
mongosh --quiet <<MONGOJS
use admin
db.dropUser("${MONGO_USER}", { w: "majority" }) || true
db.createUser({
  user: "${MONGO_USER}",
  pwd: "${MONGO_PASS}",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" },
    { role: "clusterMonitor", db: "admin" }
  ]
})

use ${MONGO_DB}
db.dropUser("${MONGO_USER}", { w: "majority" }) || true
db.createUser({
  user: "${MONGO_USER}",
  pwd: "${MONGO_PASS}",
  roles: [
    { role: "readWrite", db: "${MONGO_DB}" },
    { role: "dbAdmin", db: "${MONGO_DB}" }
  ]
})
MONGOJS

# Re-enable auth and restart
sed -i 's/authorization: disabled/authorization: enabled/' /etc/mongod.conf
systemctl restart mongod

echo "Waiting for MongoDB (auth mode)..."
for i in {1..30}; do
  if mongosh --quiet -u "${MONGO_USER}" -p "${MONGO_PASS}" --authenticationDatabase admin --eval "db.runCommand({ping:1})" &>/dev/null; then
    break
  fi
  sleep 1
done
echo "MongoDB ready with authentication."

### ── 5. Build the application ──────────────────────────────────────────────
echo "[5/8] Building openrealm-data..."

# Install the openrealm dependency if present alongside this repo
if [[ -d "${SCRIPT_DIR}/../openrealm/pom.xml" ]] || [[ -f "${SCRIPT_DIR}/../openrealm/pom.xml" ]]; then
  echo "  Building openrealm dependency..."
  mvn -B clean install -DskipTests -f "${SCRIPT_DIR}/../openrealm/pom.xml"
fi

# Build the data service
mvn -B clean package -DskipTests -f "${SCRIPT_DIR}/pom.xml"

### ── 6. Install the application ────────────────────────────────────────────
echo "[6/8] Installing application to ${APP_DIR}..."
mkdir -p "${APP_DIR}"

cp "${SCRIPT_DIR}/target/jrealm-data.jar" "${APP_DIR}/${APP_NAME}.jar"

# Create system user
if ! id "${APP_USER}" &>/dev/null; then
  useradd --system --no-create-home --shell /sbin/nologin "${APP_USER}"
fi

# Build the MONGO_URI
MONGO_URI="mongodb://${MONGO_USER}:${MONGO_PASS}@127.0.0.1:${MONGO_PORT}/${MONGO_DB}?authSource=admin"

# Write environment file (restricted permissions)
cat > "${APP_DIR}/env" <<ENVFILE
MONGO_URI=${MONGO_URI}
MONGO_HOST=127.0.0.1
ENVFILE

chmod 600 "${APP_DIR}/env"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

### ── 7. Systemd service ───────────────────────────────────────────────────
echo "[7/8] Creating systemd service..."
cat > /etc/systemd/system/${APP_NAME}.service <<UNIT
[Unit]
Description=OpenRealm Data Service
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/env
ExecStart=/usr/bin/java -Xms256m -Xmx1024m -jar ${APP_DIR}/${APP_NAME}.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${APP_NAME}

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${APP_DIR}

# Allow binding to port 80
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "${APP_NAME}"
systemctl start "${APP_NAME}"

### ── 8. Firewall ───────────────────────────────────────────────────────────
echo "[8/8] Configuring firewall..."

# Open app port and MongoDB port (for remote management)
if command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-port=${APP_PORT}/tcp
  firewall-cmd --permanent --add-port=${MONGO_PORT}/tcp
  firewall-cmd --reload
  echo "firewalld rules added."
else
  echo "NOTE: No firewalld found. If using AWS Security Groups, open ports ${APP_PORT} and ${MONGO_PORT}."
fi

### ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "============================================="
echo " DEPLOYMENT COMPLETE"
echo "============================================="
echo ""
echo " App service:  sudo systemctl status ${APP_NAME}"
echo " App logs:     sudo journalctl -u ${APP_NAME} -f"
echo " App port:     ${APP_PORT}"
echo ""
echo " MongoDB port: ${MONGO_PORT} (exposed for remote access)"
echo " MongoDB user: ${MONGO_USER}"
echo " MongoDB pass: ${MONGO_PASS}"
echo " MongoDB URI:  ${MONGO_URI}"
echo ""
echo " Credentials saved to: ${APP_DIR}/env"
echo ""
echo " !! IMPORTANT — AWS Security Groups !!"
echo " You MUST open the following ports in your EC2 Security Group:"
echo "   - TCP ${APP_PORT}   (app API — restrict to your game server IPs)"
echo "   - TCP ${MONGO_PORT} (MongoDB — restrict to your management IP)"
echo ""
echo " To change the MongoDB password later:"
echo "   mongosh -u ${MONGO_USER} -p '<old_pass>' --authenticationDatabase admin"
echo "   use admin"
echo "   db.changeUserPassword('${MONGO_USER}', '<new_pass>')"
echo "   Then update ${APP_DIR}/env and restart:"
echo "   sudo systemctl restart ${APP_NAME}"
echo "============================================="
