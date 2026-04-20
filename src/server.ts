import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';

const app = express();
const port = process.env.PORT || 3000;
const REDIRECT_URI = `http://127.0.0.1:${port}/api/spotify/callback`;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Config & Tokens ───────────────────────────────────────────────────────────

const configPath = path.join(__dirname, '../config.json');
const tokensPath = path.join(__dirname, '../tokens.json');

const DEFAULT_LAYOUT = {
  'header-left': 'clock',
  'header-right': 'weather',
  'main-1': 'sl',
  'main-2': 'sbb',
  'footer-1': 'spotify',
  'footer-2': 'system',
};

const DEFAULT_WIDGETS: Record<string, any> = {
  alwaysOn: false,
  layout: DEFAULT_LAYOUT,
  spotify: { clientId: '', clientSecret: '' },
  weather: { plz: '' },
  sl: { stationId: '', stationName: '' },
  sbb: { stationId: '', stationName: '' },
};

function readConfig() {
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  // Migrate old format: sl was top-level stationId
  if (!raw.sl) {
    const migrated = {
      refreshRate: raw.refreshRate ?? 30000,
      sl: { stationId: raw.stationId ?? '', stationName: raw.stationName ?? '' },
      sbb: { stationId: '', stationName: '' },
      ...DEFAULT_WIDGETS,
    };
    fs.writeFileSync(configPath, JSON.stringify(migrated, null, 2));
    return migrated;
  }
  // Strip old `enabled` flags from sub-configs, merge defaults
  const merged = { ...DEFAULT_WIDGETS, ...raw };
  // Normalise sl/sbb/spotify/weather: drop `enabled` field (layout is the source of truth now)
  if (merged.sl?.enabled !== undefined) { const { enabled: _, ...rest } = merged.sl; merged.sl = rest; }
  if (merged.sbb?.enabled !== undefined) { const { enabled: _, ...rest } = merged.sbb; merged.sbb = rest; }
  if (merged.spotify?.enabled !== undefined) { const { enabled: _, ...rest } = merged.spotify; merged.spotify = rest; }
  if (merged.weather?.enabled !== undefined) { const { enabled: _, ...rest } = merged.weather; merged.weather = rest; }
  // Drop old github/system keys not in new schema
  delete merged.github;
  delete merged.system;
  return merged;
}

function readTokens(): Record<string, any> {
  try { return JSON.parse(fs.readFileSync(tokensPath, 'utf8')); } catch { return {}; }
}
function writeTokens(t: Record<string, any>) {
  fs.writeFileSync(tokensPath, JSON.stringify(t, null, 2));
}

app.get('/api/config', (req, res) => {
  try { res.json(readConfig()); } catch { res.status(500).json({ error: 'Failed to load config' }); }
});
app.post('/api/config', (req, res) => {
  try { fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2)); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Failed to save config' }); }
});

// ── SL ────────────────────────────────────────────────────────────────────────

app.get('/api/sl/departures/:siteId', async (req, res) => {
  try { res.json(await fetch(`https://transport.integration.sl.se/v1/sites/${req.params.siteId}/departures`).then(r => r.json())); }
  catch { res.status(500).json({ error: 'Failed to fetch SL data' }); }
});

app.get('/api/sl/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: 'Query required' });
  try {
    const data = await fetch(`https://journeyplanner.integration.sl.se/v2/stop-finder?name_sf=${encodeURIComponent(query)}&format=json&type_sf=any&any_obj_filter_sf=2`).then(r => r.json());
    const StopLocation = (data.locations || [])
      .filter((l: any) => l.type === 'stop' && l.properties?.stopId)
      .map((l: any) => ({ id: l.properties.stopId.replace(/^1800/, ''), name: l.disassembledName || l.name }));
    res.json({ StopLocation });
  } catch { res.status(500).json({ error: 'Failed to search' }); }
});

// ── SBB ───────────────────────────────────────────────────────────────────────

app.get('/api/sbb/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: 'Query required' });
  try {
    const data = await fetch(`https://transport.opendata.ch/v1/locations?query=${encodeURIComponent(query)}`).then(r => r.json());
    const StopLocation = (data.stations || []).filter((s: any) => s.id && s.name).map((s: any) => ({ id: String(s.id), name: s.name }));
    res.json({ StopLocation });
  } catch { res.status(500).json({ error: 'Failed to search' }); }
});

app.get('/api/sbb/departures/:stationId', async (req, res) => {
  try { res.json(await fetch(`https://transport.opendata.ch/v1/stationboard?id=${encodeURIComponent(req.params.stationId)}&limit=20`).then(r => r.json())); }
  catch { res.status(500).json({ error: 'Failed to fetch SBB departures' }); }
});

// ── Spotify ───────────────────────────────────────────────────────────────────

async function refreshSpotifyToken(clientId: string, clientSecret: string, refreshToken: string) {
  const data = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  }).then(r => r.json()) as any;
  if (!data.access_token) throw new Error('Token refresh failed');
  return { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
}

async function getSpotifyToken(): Promise<string | null> {
  const cfg = readConfig();
  const { clientId, clientSecret } = cfg.spotify;
  if (!clientId || !clientSecret) return null;
  const tokens = readTokens();
  if (!tokens.spotify?.refreshToken) return null;
  if (!tokens.spotify.accessToken || Date.now() > tokens.spotify.expiresAt - 60_000) {
    const refreshed = await refreshSpotifyToken(clientId, clientSecret, tokens.spotify.refreshToken);
    writeTokens({ ...tokens, spotify: { ...tokens.spotify, ...refreshed } });
    return refreshed.accessToken;
  }
  return tokens.spotify.accessToken;
}

app.get('/api/spotify/status', (req, res) => {
  res.json({ connected: !!readTokens().spotify?.refreshToken });
});

app.get('/api/spotify/auth', (req, res) => {
  const { clientId } = readConfig().spotify;
  if (!clientId) return res.status(400).send('Client ID not configured');
  const params = new URLSearchParams({
    client_id: clientId, response_type: 'code', redirect_uri: REDIRECT_URI,
    scope: 'user-read-currently-playing user-read-playback-state',
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

app.get('/api/spotify/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.redirect('/settings');
  const { clientId, clientSecret } = readConfig().spotify;
  try {
    const data = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }),
    }).then(r => r.json()) as any;
    writeTokens({ ...readTokens(), spotify: { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 } });
  } catch {}
  res.redirect('/settings');
});

app.get('/api/spotify/disconnect', (req, res) => {
  const tokens = readTokens();
  delete tokens.spotify;
  writeTokens(tokens);
  res.json({ success: true });
});

app.get('/api/spotify/now-playing', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    if (!token) return res.json({ playing: false });
    const resp = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${token}` } });
    if (resp.status === 204 || resp.status === 404) return res.json({ playing: false });
    const data = await resp.json() as any;
    if (!data.is_playing || !data.item) return res.json({ playing: false });
    res.json({
      playing: true,
      track: {
        name: data.item.name,
        artist: data.item.artists.map((a: any) => a.name).join(', '),
        album: data.item.album.name,
        durationMs: data.item.duration_ms,
        progressMs: data.progress_ms,
      },
    });
  } catch { res.json({ playing: false }); }
});


// ── Weather ───────────────────────────────────────────────────────────────────

function getMoonPhase(date: Date): string {
  const knownNewMoon = new Date('2000-01-06').getTime();
  const phase = (((date.getTime() - knownNewMoon) / 86400000) % 29.53059 + 29.53059) % 29.53059;
  if (phase < 1.85) return 'New Moon';
  if (phase < 7.38) return 'Waxing Crescent';
  if (phase < 9.22) return 'First Quarter';
  if (phase < 14.77) return 'Waxing Gibbous';
  if (phase < 16.61) return 'Full Moon';
  if (phase < 22.15) return 'Waning Gibbous';
  if (phase < 23.99) return 'Last Quarter';
  return 'Waning Crescent';
}

function getSunTimes(lat: number, lon: number, date: Date) {
  const rad = Math.PI / 180;
  const J2000 = 2451545.0;
  const JD = date.getTime() / 86400000 + 2440587.5;
  const n = Math.round(JD - J2000 - 0.0009 - lon / 360);
  const Jstar = J2000 + 0.0009 + lon / 360 + n;
  const M = ((357.5291 + 0.98560028 * (Jstar - J2000)) % 360 + 360) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const Jtransit = Jstar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const sinDelta = Math.sin(lambda * rad) * Math.sin(23.4397 * rad);
  const cosH = (Math.sin(-0.8333 * rad) - Math.sin(lat * rad) * sinDelta) / (Math.cos(lat * rad) * Math.cos(Math.asin(sinDelta)));
  if (cosH > 1 || cosH < -1) return null;
  const w0 = Math.acos(cosH) / rad;
  const toTime = (jd: number) => {
    const d = new Date((jd - 2440587.5) * 86400000);
    return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
  };
  return { sunrise: toTime(Jtransit - w0 / 360), sunset: toTime(Jtransit + w0 / 360) };
}

const WEATHER_CODES: Record<number, string> = {
  1: 'Sunny', 2: 'Mostly Sunny', 3: 'Partly Cloudy', 4: 'Mostly Cloudy',
  5: 'Cloudy', 6: 'Overcast', 7: 'Light Rain', 8: 'Rain', 9: 'Heavy Rain',
  10: 'Thunderstorm', 11: 'Drizzle', 12: 'Sleet', 13: 'Snow', 14: 'Heavy Snow',
  15: 'Fog', 16: 'Freezing Rain',
};

app.get('/api/weather', async (req, res) => {
  const { plz } = readConfig().weather;
  if (!plz) return res.status(400).json({ error: 'PLZ not configured' });

  try {
    // Geocode PLZ to coordinates
    const geoData = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(plz + ', Switzerland')}&format=json&limit=1`,
      { headers: { 'User-Agent': 'walldash' } }
    ).then(r => r.json()) as any[];

    const lat = parseFloat(geoData[0]?.lat ?? '47.37');
    const lon = parseFloat(geoData[0]?.lon ?? '8.54');

    // Fetch Meteoswiss forecast
    const plz6 = plz.padStart(4, '0') + '00';
    const meteo = await fetch(
      `https://app-prod-ws.meteoswiss-app.ch/v1/forecast?plz=${plz6}`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'MeteoSwissApp' } }
    ).then(r => r.json()) as any;

    const current = meteo.currentWeather;
    const graphStart = meteo.graph?.start ?? 0;
    const temps: number[] = meteo.graph?.temperatureMean1h ?? [];
    const hourly = temps.slice(0, 6).map((temp, i) => {
      const t = new Date(graphStart + i * 3600000);
      return {
        time: t.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' }),
        temp: Math.round(temp),
      };
    });

    const sunTimes = getSunTimes(lat, lon, new Date());

    res.json({
      temperature: Math.round(current.temperature),
      description: WEATHER_CODES[current.icon] ?? `Symbol ${current.icon}`,
      sunrise: sunTimes?.sunrise ?? '—',
      sunset: sunTimes?.sunset ?? '—',
      moonPhase: getMoonPhase(new Date()),
      hourly,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// ── System ────────────────────────────────────────────────────────────────────

let prevCpu = { idle: 0, total: 0 };

async function readCpuStat() {
  const text = await Bun.file('/proc/stat').text();
  const vals = text.split('\n')[0].replace('cpu', '').trim().split(/\s+/).map(Number);
  const idle = vals[3] + (vals[4] ?? 0); // idle + iowait
  const total = vals.reduce((a, b) => a + b, 0);
  return { idle, total };
}

app.get('/api/system', async (req, res) => {
  try {
    const curr = await readCpuStat();
    const dTotal = curr.total - prevCpu.total;
    const dIdle = curr.idle - prevCpu.idle;
    const cpuPercent = dTotal > 0 ? Math.min(100, Math.round((1 - dIdle / dTotal) * 100)) : 0;
    prevCpu = curr;

    // Use MemAvailable from /proc/meminfo (matches btop) instead of os.freemem() which excludes cache
    const memText = await Bun.file('/proc/meminfo').text();
    const memMap = Object.fromEntries(
      memText.split('\n').filter(l => l.includes(':')).map(l => {
        const [k, v] = l.split(':');
        return [k.trim(), parseInt(v.trim())];
      })
    );
    const totalMem = (memMap['MemTotal'] ?? 0) * 1024;
    const usedMem = totalMem - (memMap['MemAvailable'] ?? 0) * 1024;

    const dfText = await Bun.$`df -B1 /`.quiet().text();
    const dfParts = dfText.trim().split('\n')[1].trim().split(/\s+/);
    const diskTotal = parseInt(dfParts[1]);
    const diskUsed = parseInt(dfParts[2]);

    const uptimeSec = os.uptime();
    const d = Math.floor(uptimeSec / 86400);
    const h = Math.floor((uptimeSec % 86400) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const uptime = [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');

    const [l1, l5, l15] = os.loadavg().map(l => l.toFixed(2));

    res.json({
      cpu: { percent: cpuPercent, load: [l1, l5, l15] },
      memory: {
        percent: Math.round(usedMem / totalMem * 100),
        usedGb: (usedMem / 1e9).toFixed(1),
        totalGb: (totalMem / 1e9).toFixed(1),
      },
      disk: {
        percent: Math.round(diskUsed / diskTotal * 100),
        usedGb: (diskUsed / 1e9).toFixed(0),
        totalGb: (diskTotal / 1e9).toFixed(0),
      },
      uptime,
      hostname: os.hostname(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.includes('.')) return next();
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Walldash</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
      theme: { extend: { colors: {
        'sl-blue': '#005293', 'sl-red': '#e30613', 'sl-green': '#76b82a',
        'sl-orange': '#f58220', 'sbb-red': '#eb0000',
        'background': '#000000', 'surface': '#1a1a1a',
      }}}
    }
  </script>
  <style>body { background-color: #000; color: #fff; margin: 0; padding: 0; font-family: sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script src="/main.js"></script>
</body>
</html>`);
});

app.listen(port, () => console.log('Walldash running at http://localhost:' + port));
