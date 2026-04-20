import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SearchBox } from '../components/organisms/SearchBox';
import { Config, StopLocation, WidgetId, WidgetLayout, ZoneId } from '../types';

// ── Layout Editor ─────────────────────────────────────────────────────────────

const ALL_WIDGETS: WidgetId[] = ['clock', 'weather', 'sl', 'sbb', 'spotify', 'system', 'spacer'];

const WIDGET_LABELS: Record<WidgetId, string> = {
  clock: 'Clock', weather: 'Weather', sl: 'SL Departures',
  sbb: 'SBB Departures', spotify: 'Spotify', system: 'System', spacer: 'Spacer',
};

const ZONE_LABELS: Record<ZoneId, string> = {
  'header-left': 'Header Left', 'header-right': 'Header Right',
  'main-1': 'Main Col 1', 'main-2': 'Main Col 2',
  'footer-1': 'Footer 1', 'footer-2': 'Footer 2', 'footer-3': 'Footer 3',
};

// 6-col grid positions for the visual layout preview
const ZONE_GRID_STYLE: Record<ZoneId, React.CSSProperties> = {
  'header-left':  { gridColumn: '1 / 4', gridRow: '1' },
  'header-right': { gridColumn: '4 / 7', gridRow: '1' },
  'main-1':       { gridColumn: '1 / 4', gridRow: '2' },
  'main-2':       { gridColumn: '4 / 7', gridRow: '2' },
  'footer-1':     { gridColumn: '1 / 3', gridRow: '3' },
  'footer-2':     { gridColumn: '3 / 5', gridRow: '3' },
  'footer-3':     { gridColumn: '5 / 7', gridRow: '3' },
};

const ALL_ZONES: ZoneId[] = ['header-left', 'header-right', 'main-1', 'main-2', 'footer-1', 'footer-2', 'footer-3'];

interface LayoutEditorProps {
  layout: WidgetLayout;
  onChange: (l: WidgetLayout) => void;
}

const LayoutEditor = ({ layout, onChange }: LayoutEditorProps) => {
  const [dragOver, setDragOver] = useState<ZoneId | 'palette' | null>(null);

  const placedSet = new Set(Object.values(layout).filter(Boolean) as WidgetId[]);
  // Spacer can be placed multiple times; all other widgets can only appear once
  const paletteWidgets = ALL_WIDGETS.filter(w => w === 'spacer' || !placedSet.has(w));

  const startDrag = (e: React.DragEvent, widgetId: WidgetId, fromZone: ZoneId | 'palette') => {
    e.dataTransfer.setData('widgetId', widgetId);
    e.dataTransfer.setData('fromZone', fromZone);
  };

  const dropOnZone = (e: React.DragEvent, targetZone: ZoneId) => {
    e.preventDefault();
    setDragOver(null);
    const widgetId = e.dataTransfer.getData('widgetId') as WidgetId;
    const fromZone = e.dataTransfer.getData('fromZone') as ZoneId | 'palette';
    if (!widgetId) return;

    const next = { ...layout };
    const existing = next[targetZone];

    if (fromZone !== 'palette') {
      // Swap: place existing widget into the source zone
      if (existing) next[fromZone as ZoneId] = existing;
      else delete next[fromZone as ZoneId];
    }
    next[targetZone] = widgetId;
    onChange(next);
  };

  const dropOnPalette = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const fromZone = e.dataTransfer.getData('fromZone') as ZoneId | 'palette';
    if (fromZone === 'palette') return;
    const next = { ...layout };
    delete next[fromZone as ZoneId];
    onChange(next);
  };

  const removeFromZone = (zone: ZoneId) => {
    const next = { ...layout };
    delete next[zone];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Visual grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'auto minmax(100px, auto) auto',
          gap: '4px',
        }}
      >
        {ALL_ZONES.map(zone => {
          const widgetId = layout[zone];
          const over = dragOver === zone;
          return (
            <div
              key={zone}
              style={ZONE_GRID_STYLE[zone]}
              className={`border p-2 flex flex-col gap-1 min-h-[56px] transition-colors ${over ? 'border-white bg-zinc-900' : 'border-zinc-700'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(zone); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => dropOnZone(e, zone)}
            >
              <span className="text-[10px] text-gray-600 uppercase tracking-wider leading-none">{ZONE_LABELS[zone]}</span>
              {widgetId ? (
                <div className="flex items-center justify-between mt-auto">
                  <span
                    draggable
                    onDragStart={e => startDrag(e, widgetId, zone)}
                    className={`text-sm font-bold cursor-grab px-2 py-0.5 select-none ${widgetId === 'spacer' ? 'border border-dashed border-zinc-600 text-zinc-500' : 'border border-zinc-500'}`}
                  >
                    {WIDGET_LABELS[widgetId]}
                  </span>
                  <button
                    onClick={() => removeFromZone(zone)}
                    className="text-gray-600 hover:text-white text-base leading-none ml-1"
                  >×</button>
                </div>
              ) : (
                <span className="text-[10px] text-zinc-700 mt-auto">drop here</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Palette */}
      <div
        className={`border p-3 min-h-[52px] transition-colors ${dragOver === 'palette' ? 'border-white bg-zinc-900' : 'border-zinc-700'}`}
        onDragOver={e => { e.preventDefault(); setDragOver('palette'); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={dropOnPalette}
      >
        <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Available (drag to dashboard)</span>
        <div className="flex flex-wrap gap-2">
          {paletteWidgets.map(w => (
            <span
              key={w}
              draggable
              onDragStart={e => startDrag(e, w, 'palette')}
              className={`text-sm font-bold cursor-grab px-3 py-1 select-none ${w === 'spacer' ? 'border border-dashed border-zinc-600 text-zinc-500' : 'border border-zinc-500'}`}
            >
              {WIDGET_LABELS[w]}
            </span>
          ))}
          {paletteWidgets.length === 0 && (
            <span className="text-xs text-zinc-700">all widgets placed — drag from grid to remove</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!enabled)} className="border border-white px-4 py-1 text-lg font-bold">
    {enabled ? 'ON' : 'OFF'}
  </button>
);

const Section = ({ title, children, fullWidth }: { title: string; children: React.ReactNode; fullWidth?: boolean }) => (
  <section className="border-b border-zinc-800 pb-8" style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    {children}
  </section>
);

const Field = ({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-sm text-gray-400 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-black text-white px-4 py-2 border border-zinc-700 outline-none text-lg focus:border-white"
    />
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

export const Settings = () => {
  const qc = useQueryClient();

  const { data: config } = useQuery<Config>({
    queryKey: ['config'],
    queryFn: () => fetch('/api/config').then(r => r.json()),
  });

  const { data: spotifyStatus, refetch: refetchSpotifyStatus } = useQuery<{ connected: boolean }>({
    queryKey: ['spotify-status'],
    queryFn: () => fetch('/api/spotify/status').then(r => r.json()),
  });

  const { mutate: save } = useMutation({
    mutationFn: (updated: Config) =>
      fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }),
    onMutate: (updated) => qc.setQueryData(['config'], updated),
  });

  const [localLayout, setLocalLayout] = useState<WidgetLayout>({});
  useEffect(() => { if (config) setLocalLayout(config.layout ?? {}); }, [config]);

  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
  const [weatherPlz, setWeatherPlz] = useState('');

  if (!config) return <div className="p-8 text-gray-500">Loading...</div>;

  const saveSpotifyCredentials = () => {
    save({ ...config, spotify: { clientId: spotifyClientId || config.spotify.clientId, clientSecret: spotifyClientSecret || config.spotify.clientSecret } });
  };

  const disconnectSpotify = async () => {
    await fetch('/api/spotify/disconnect');
    refetchSpotifyStatus();
  };

  const handleLayoutChange = (newLayout: WidgetLayout) => {
    setLocalLayout(newLayout);
    save({ ...config, layout: newLayout });
  };

  return (
    <div className="flex flex-col h-screen w-screen p-8 overflow-auto bg-black text-white">
      <div className="flex items-center gap-6 mb-8 border-b border-white pb-4">
        <Link to="/" className="text-2xl">←</Link>
        <h1 className="text-4xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))' }}>

        {/* Always-on mode */}
        <Section title="Always-on Mode" fullWidth>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">Minute-aligned updates, thinner text, no progress bars</p>
            <Toggle enabled={config.alwaysOn ?? false} onChange={v => save({ ...config, alwaysOn: v })} />
          </div>
        </Section>

        {/* Layout */}
        <Section title="Dashboard Layout" fullWidth>
          <p className="text-gray-400 mb-4 text-sm">Drag widgets into zones. Drag back to the palette to hide. Zones can be swapped by dropping onto an occupied zone.</p>
          <LayoutEditor layout={localLayout} onChange={handleLayoutChange} />
        </Section>

        {/* SL */}
        <Section title="SL Departures">
          <p className="text-gray-400 mb-3">{config.sl.stationName || 'No station selected'}</p>
          <SearchBox
            endpoint="/api/sl/search"
            placeholder="Search SL station..."
            onSelect={(stop: StopLocation) => save({ ...config, sl: { stationId: stop.id, stationName: stop.name } })}
          />
        </Section>

        {/* SBB */}
        <Section title="SBB Departures">
          <p className="text-gray-400 mb-3">{config.sbb.stationName || 'No station selected'}</p>
          <SearchBox
            endpoint="/api/sbb/search"
            placeholder="Search SBB station..."
            onSelect={(stop: StopLocation) => save({ ...config, sbb: { stationId: stop.id, stationName: stop.name } })}
          />
        </Section>

        {/* Weather */}
        <Section title="Weather (Meteoswiss)">
          <p className="text-gray-400 mb-3">{config.weather.plz ? `PLZ ${config.weather.plz}` : 'No PLZ configured'}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={weatherPlz || config.weather.plz}
              onChange={e => setWeatherPlz(e.target.value)}
              placeholder="e.g. 8001"
              maxLength={4}
              className="bg-black text-white px-4 py-2 border border-zinc-700 outline-none text-lg focus:border-white w-32"
            />
            <button
              onClick={() => { save({ ...config, weather: { plz: weatherPlz || config.weather.plz } }); setWeatherPlz(''); }}
              className="border border-white px-4 py-2 font-bold"
            >
              Save
            </button>
          </div>
        </Section>

        {/* Spotify */}
        <Section title="Spotify Now Playing">
          <p className="text-gray-400 mb-4">
            {spotifyStatus?.connected ? 'Connected' : config.spotify.clientId ? 'Not connected' : 'Not configured'}
          </p>
          <div className="flex flex-col gap-4">
            {!spotifyStatus?.connected ? (
              <>
                <p className="text-sm text-gray-500">
                  Create an app at <span className="text-white">developer.spotify.com</span> and add{' '}
                  <span className="text-white font-mono text-xs">http://127.0.0.1:3000/api/spotify/callback</span> as a redirect URI.
                </p>
                <Field label="Client ID" value={spotifyClientId} onChange={setSpotifyClientId} placeholder={config.spotify.clientId ? '(saved)' : ''} />
                <Field label="Client Secret" value={spotifyClientSecret} onChange={setSpotifyClientSecret} type="password" placeholder={config.spotify.clientSecret ? '(saved)' : ''} />
                <div className="flex gap-2">
                  <button onClick={saveSpotifyCredentials} className="border border-white px-4 py-2 font-bold">Save Credentials</button>
                  {config.spotify.clientId && (
                    <a href="/api/spotify/auth" className="border border-white px-4 py-2 font-bold">Connect Spotify</a>
                  )}
                </div>
              </>
            ) : (
              <button onClick={disconnectSpotify} className="border border-zinc-600 px-4 py-2 text-gray-400 w-fit">
                Disconnect
              </button>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
};
