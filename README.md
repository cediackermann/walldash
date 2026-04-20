# walldash

A full-screen kiosk dashboard for a Raspberry Pi, showing public transit departures (SL and SBB), weather, Spotify now-playing, and system stats.

## Prerequisites

- [Bun](https://bun.sh) runtime
- Raspberry Pi running Raspberry Pi OS (tested on Bookworm/Lite + LXDE desktop)
- Chromium or chromium-browser installed

## Quick start (development)

```bash
bun install
cp config.example.json config.json   # then fill in your credentials
bun run start
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Copy `config.example.json` to `config.json` and fill in your values:

| Field | Description |
|---|---|
| `spotify.clientId` / `spotify.clientSecret` | Spotify app credentials from [developer.spotify.com](https://developer.spotify.com/dashboard) |
| `weather.plz` | Swiss postal code (PLZ) for MeteoSwiss forecasts |
| `sl.stationId` / `sl.stationName` | Stockholm Lokaltrafik site ID (find via Settings > Search) |
| `sbb.stationId` / `sbb.stationName` | Swiss Federal Railways station ID (find via Settings > Search) |
| `refreshRate` | Polling interval in milliseconds (default: `10000`) |
| `alwaysOn` | `true` reduces animations and refresh rates for burn-in prevention |
| `layout` | Maps widget zone names to widget IDs |

`config.json` and `tokens.json` are gitignored — never commit real credentials.

## Raspberry Pi deployment

### 1. Install the server as a systemd service

```bash
bash scripts/setup-systemd.sh
```

This creates `/etc/systemd/system/walldash.service`, enables it, and starts it. The server auto-restarts on crash and starts on boot.

```bash
systemctl status walldash.service
journalctl -u walldash.service -f
```

### 2. Set up the kiosk browser

```bash
bash scripts/setup-kiosk.sh
```

This installs `unclutter` (hides the cursor), disables screen blanking, and adds a `~/.config/autostart/walldash-kiosk.desktop` entry that launches `scripts/start-kiosk.sh` on login.

`start-kiosk.sh` waits until the server is ready, then opens Chromium in kiosk mode. If Chromium crashes it restarts automatically.

### 3. Configure auto-login

Use `raspi-config` → **System Options → Boot / Auto Login → Desktop Autologin** so the kiosk browser starts without manual interaction.

### 4. Set credentials

Copy and edit `config.json` on the Pi:

```bash
cp config.example.json config.json
nano config.json
```

For Spotify, open `http://<pi-ip>:3000/settings` in a browser and follow the OAuth link.

## Uninstall

```bash
bash scripts/uninstall.sh
```

Removes the systemd service and autostart entry. The project directory is left untouched.

## Build

To regenerate the bundled frontend:

```bash
bun run build
```

Output goes to `public/main.js`.

## Widget zones

```
┌──────────────────────────────────────────┐
│  header-left          header-right       │
├────────────────────┬─────────────────────┤
│  main-1            │  main-2             │
│                    │                     │
├──────────┬─────────┴──────┬──────────────┤
│ footer-1 │   footer-2     │   footer-3   │
└──────────┴────────────────┴──────────────┘
```

Available widget IDs: `clock`, `weather`, `sl`, `sbb`, `spotify`, `system`, `spacer`.
