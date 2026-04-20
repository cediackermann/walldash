#!/bin/bash

set -e

SERVICE_NAME="walldash"
USER_NAME=$(whoami)
# Use the project directory relative to this script, not wherever the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUN_PATH=$(which bun)

if [ -z "$BUN_PATH" ]; then
    echo "Error: Bun not found. Please install Bun first."
    exit 1
fi

# Create systemd service file
cat <<SERVICETEMPLATE | sudo tee /etc/systemd/system/$SERVICE_NAME.service
[Unit]
Description=Walldash Dashboard Server
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=$BUN_PATH run src/server.ts
WorkingDirectory=$PROJECT_DIR
Restart=always
RestartSec=5
User=$USER_NAME
Environment=NODE_ENV=production
Environment=PORT=3000
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICETEMPLATE

# Reload and enable service
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME.service
sudo systemctl restart $SERVICE_NAME.service

echo "Walldash service installed and started."
echo "Check status : systemctl status $SERVICE_NAME.service"
echo "Follow logs  : journalctl -u $SERVICE_NAME.service -f"
