import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;

interface Config {
  stationId: string;
  stationName: string;
  refreshRate: number;
}

app.use(express.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, '../public')));

// API Endpoints
app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../config.json');
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load config' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../config.json');
    const newConfig = req.body as Config;
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

app.get('/api/sl/departures/:siteId', async (req, res) => {
  try {
    const response = await fetch(`https://transport.integration.sl.se/v1/sites/${req.params.siteId}/departures`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SL data' });
  }
});

app.get('/api/sl/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: 'Query required' });
  
  try {
    const response = await fetch(`https://journeyplanner.integration.sl.se/v2/stop-finder?name_sf=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search for station' });
  }
});

// Serve the app for all other routes (SPA fallback)
// The most reliable catch-all for Express 5 is using a regex or simple string with middleware
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="sv">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Walldash</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        window.tailwind = window.tailwind || {};
        window.tailwind.config = {
          theme: {
            extend: {
              colors: {
                'sl-blue': '#005293',
                'sl-red': '#e30613',
                'sl-green': '#76b82a',
                'sl-orange': '#f58220',
                'background': '#000000',
                'surface': '#1a1a1a',
              },
            },
          },
        }
      </script>
      <style>
        body { background-color: #000; color: #fff; margin: 0; padding: 0; font-family: sans-serif; overflow: hidden; }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script src="/main.js"></script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log('Walldash dashboard is running at http://localhost:' + port);
});
