#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
URL="http://localhost:3000"
USER_NAME=$(whoami)
AUTOSTART_DIR="/home/$USER_NAME/.config/autostart"
DESKTOP_FILE="$AUTOSTART_DIR/walldash-kiosk.desktop"
KIOSK_WRAPPER="$SCRIPT_DIR/start-kiosk.sh"

# Ensure the wrapper is executable
chmod +x "$KIOSK_WRAPPER"

# Install unclutter if missing (hides the mouse cursor)
if ! command -v unclutter &>/dev/null; then
    echo "Installing unclutter..."
    sudo apt-get install -y unclutter
fi

# Install curl if missing (used by the wrapper to wait for the server)
if ! command -v curl &>/dev/null; then
    echo "Installing curl..."
    sudo apt-get install -y curl
fi

# Create autostart directory if it doesn't exist
mkdir -p "$AUTOSTART_DIR"

# Create the .desktop file pointing at our wrapper script
cat > "$DESKTOP_FILE" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Walldash Kiosk
Exec=$KIOSK_WRAPPER
X-GNOME-Autostart-enabled=true
DESKTOP

echo "Created autostart entry: $DESKTOP_FILE"

# Disable screen blanking / DPMS for LXDE-pi (X11)
LXDE_AUTOSTART="/etc/xdg/lxsession/LXDE-pi/autostart"
if [ -f "$LXDE_AUTOSTART" ]; then
    # Avoid duplicate entries
    for line in "@xset s off" "@xset -dpms" "@xset s noblank"; do
        grep -qF "$line" "$LXDE_AUTOSTART" || echo "$line" | sudo tee -a "$LXDE_AUTOSTART" > /dev/null
    done
    # Disable screensaver if present
    sudo sed -i 's/^@xscreensaver/# @xscreensaver/' "$LXDE_AUTOSTART"
    echo "Updated $LXDE_AUTOSTART for screen blanking."
fi

# Disable screen blanking for Wayfire / Labwc (Pi OS Bookworm Wayland)
WAYFIRE_INI="$HOME/.config/wayfire.ini"
if [ -f "$WAYFIRE_INI" ]; then
    if ! grep -q '\[idle\]' "$WAYFIRE_INI"; then
        cat >> "$WAYFIRE_INI" <<'INI'

[idle]
toggle = <super> KEY_Z
screensaver_timeout = -1
dpms_timeout = -1
INI
        echo "Disabled idle/screensaver in $WAYFIRE_INI."
    fi
fi

echo ""
echo "Kiosk setup complete."
echo "Chromium will open $URL automatically on the next login."
echo "To test now, run:  $KIOSK_WRAPPER"
