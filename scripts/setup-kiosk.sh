#!/bin/bash

# Configuration
URL="http://localhost:3000"
USER_NAME=$(whoami)
AUTOSTART_DIR="/home/$USER_NAME/.config/autostart"
DESKTOP_FILE="$AUTOSTART_DIR/kiosk.desktop"

# Create autostart directory if it doesn't exist
mkdir -p "$AUTOSTART_DIR"

# Create the .desktop file for Chromium kiosk mode
cat <<DESKTOPTEMPLATE > "$DESKTOP_FILE"
[Desktop Entry]
Type=Application
Name=Walldash Kiosk
Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk $URL
X-GNOME-Autostart-enabled=true
DESKTOPTEMPLATE

# Disable screen blanking and screensaver
# This configuration may vary depending on the display manager (X11, Wayland)
# For Raspberry Pi OS (Standard X11):
if [ -f "/etc/xdg/lxsession/LXDE-pi/autostart" ]; then
    sudo sed -i 's/@xscreensaver -no-splash/# @xscreensaver -no-splash/' /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset s off" | sudo tee -a /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset -dpms" | sudo tee -a /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset s noblank" | sudo tee -a /etc/xdg/lxsession/LXDE-pi/autostart
fi

# Optional: Install unclutter to hide mouse cursor
# sudo apt-get update && sudo apt-get install -y unclutter
# echo "@unclutter -idle 0.1 -root" >> /etc/xdg/lxsession/LXDE-pi/autostart

echo "Kiosk setup complete. Chromium will launch $URL on the next login."
