#!/bin/bash

# Configuration
SERVICE_NAME="walldash"
USER_NAME=$(whoami)
DIR_PATH=$(pwd)
BUN_PATH=$(which bun)

if [ -z "$BUN_PATH" ]; then
    echo "Error: Bun not found. Please install Bun first."
    exit 1
fi

# Create systemd service file
cat <<SERVICETEMPLATE | sudo tee /etc/systemd/system/$SERVICE_NAME.service
[Unit]
Description=Walldash Express Dashboard Server
After=network.target

[Service]
ExecStart=$BUN_PATH run src/server.ts
WorkingDirectory=$DIR_PATH
Restart=always
User=$USER_NAME
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
SERVICETEMPLATE

# Reload and enable service
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME.service
sudo systemctl start $SERVICE_NAME.service

echo "Walldash service setup complete and started."
echo "Check status with: systemctl status $SERVICE_NAME.service"
