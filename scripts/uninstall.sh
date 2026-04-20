#!/bin/bash
# Removes all walldash system integrations installed by setup-systemd.sh and setup-kiosk.sh.
# Does NOT delete the project directory itself.

set -e

SERVICE_NAME="walldash"
USER_NAME=$(whoami)

# Stop and remove the systemd service
if systemctl list-unit-files "${SERVICE_NAME}.service" &>/dev/null; then
    echo "Stopping and disabling ${SERVICE_NAME} service..."
    sudo systemctl stop "${SERVICE_NAME}.service" 2>/dev/null || true
    sudo systemctl disable "${SERVICE_NAME}.service" 2>/dev/null || true
    sudo rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    sudo systemctl daemon-reload
    echo "Systemd service removed."
else
    echo "No systemd service found for ${SERVICE_NAME}, skipping."
fi

# Remove the kiosk autostart entry
DESKTOP_FILE="/home/${USER_NAME}/.config/autostart/walldash-kiosk.desktop"
if [ -f "$DESKTOP_FILE" ]; then
    rm -f "$DESKTOP_FILE"
    echo "Autostart entry removed: $DESKTOP_FILE"
else
    echo "No autostart entry found, skipping."
fi

# Undo screen blanking changes in LXDE autostart
LXDE_AUTOSTART="/etc/xdg/lxsession/LXDE-pi/autostart"
if [ -f "$LXDE_AUTOSTART" ]; then
    sudo sed -i '/^@xset s off$/d'    "$LXDE_AUTOSTART"
    sudo sed -i '/^@xset -dpms$/d'   "$LXDE_AUTOSTART"
    sudo sed -i '/^@xset s noblank$/d' "$LXDE_AUTOSTART"
    sudo sed -i 's/^# @xscreensaver/@xscreensaver/' "$LXDE_AUTOSTART"
    echo "LXDE autostart screen-blanking settings restored."
fi

echo ""
echo "Uninstall complete. The project directory has not been touched."
echo "You can safely delete it manually if no longer needed."
