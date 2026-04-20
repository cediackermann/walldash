#!/bin/bash
# Wrapper launched by the autostart .desktop entry.
# Waits for the walldash server, then runs Chromium in kiosk mode.
# If Chromium exits or crashes, it restarts automatically.

URL="http://localhost:3000"
DISPLAY="${DISPLAY:-:0}"
export DISPLAY

# Detect chromium binary
if command -v chromium-browser &>/dev/null; then
    CHROMIUM=chromium-browser
elif command -v chromium &>/dev/null; then
    CHROMIUM=chromium
else
    echo "ERROR: chromium / chromium-browser not found" >&2
    exit 1
fi

# Disable screen blanking / DPMS
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor (requires unclutter)
if command -v unclutter &>/dev/null; then
    unclutter -idle 0.5 -root &
fi

# Wait until the walldash server is accepting connections
echo "Waiting for $URL ..."
until curl -sf "$URL" -o /dev/null; do
    sleep 2
done
echo "Server ready."

# Remove stale Chromium crash/exit flags so it doesn't show the "restore" prompt
CHROMIUM_PROFILE="$HOME/.config/chromium/Default"
if [ -f "$CHROMIUM_PROFILE/Preferences" ]; then
    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_PROFILE/Preferences"
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_PROFILE/Preferences"
fi

# Run Chromium in a loop so a crash restarts it automatically
while true; do
    $CHROMIUM \
        --noerrdialogs \
        --disable-infobars \
        --kiosk \
        --no-first-run \
        --disable-default-apps \
        --disable-component-update \
        --check-for-update-interval=31536000 \
        --disable-features=TranslateUI \
        --disable-pinch \
        --overscroll-history-navigation=0 \
        --autoplay-policy=no-user-gesture-required \
        "$URL"
    echo "Chromium exited — restarting in 5 s..."
    sleep 5
done
