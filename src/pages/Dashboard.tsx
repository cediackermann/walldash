import { useEffect, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from '../components/molecules/Clock';
import { DepartureList } from '../components/organisms/DepartureList';
import { SBBDepartureList } from '../components/organisms/SBBDepartureList';
import { SpotifyWidget } from '../components/organisms/SpotifyWidget';
import { WeatherWidget } from '../components/organisms/WeatherWidget';
import { SystemWidget } from '../components/organisms/SystemWidget';
import { AlwaysOnContext } from '../contexts/AlwaysOnContext';
import { Config, Departure, SBBDeparture, WidgetId, ZoneId } from '../types';

const fetchJson = (url: string) => fetch(url).then(r => r.json());

const FOOTER_ZONES: ZoneId[]  = ['footer-1', 'footer-2', 'footer-3'];
const DEPARTURE_IDS: WidgetId[] = ['sl', 'sbb'];

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { data: config } = useQuery<Config>({
    queryKey: ['config'],
    queryFn: () => fetchJson('/api/config'),
  });

  const alwaysOn = !!config?.alwaysOn;
  const layout   = config?.layout ?? {};
  const inLayout = (id: WidgetId) => Object.values(layout).includes(id);

  // In alwaysOn mode, tick once per minute to keep departure times current
  const [, tick] = useReducer(x => x + 1, 0);
  useEffect(() => {
    if (!alwaysOn) return;
    let interval: ReturnType<typeof setInterval>;
    const now = new Date();
    const msUntilNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => { tick(); interval = setInterval(tick, 60_000); }, msUntilNext);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [alwaysOn]);

  // Data fetching — only enabled when the widget is actually in the layout
  const { data: slData,  isLoading: slLoading  } = useQuery<{ departures: Departure[] }>({
    queryKey: ['sl-departures', config?.sl?.stationId],
    queryFn:  () => fetchJson(`/api/sl/departures/${config!.sl.stationId}`),
    enabled:  inLayout('sl') && !!config?.sl?.stationId,
    refetchInterval: alwaysOn ? 60_000 : (config?.refreshRate ?? 30_000),
  });

  const { data: sbbData, isLoading: sbbLoading } = useQuery<{ stationboard: SBBDeparture[] }>({
    queryKey: ['sbb-departures', config?.sbb?.stationId],
    queryFn:  () => fetchJson(`/api/sbb/departures/${config!.sbb.stationId}`),
    enabled:  inLayout('sbb') && !!config?.sbb?.stationId,
    refetchInterval: alwaysOn ? 60_000 : (config?.refreshRate ?? 30_000),
  });

  const slName  = slData?.departures[0]?.stop_area?.name || config?.sl?.stationName  || 'SL';
  const sbbName = config?.sbb?.stationName || 'SBB';

  // ── Widget factory ───────────────────────────────────────────────────────────

  const renderWidget = (id: WidgetId | undefined) => {
    if (!id || id === 'spacer') return null;
    switch (id) {
      case 'clock':   return <Clock />;
      case 'weather': return <WeatherWidget />;
      case 'spotify': return <SpotifyWidget />;
      case 'system':  return <SystemWidget />;
      case 'sl':      return <DepartureList   departures={slData?.departures ?? []}      loading={slLoading}  stationName={slName}  />;
      case 'sbb':     return <SBBDepartureList departures={sbbData?.stationboard ?? []} loading={sbbLoading} stationName={sbbName} />;
    }
  };

  // ── Layout derivations ───────────────────────────────────────────────────────

  const headerLeft    = layout['header-left'];
  const headerRight   = layout['header-right'];
  const main1         = layout['main-1'];
  const main2         = layout['main-2'];
  const footerWidgets = FOOTER_ZONES.map(z => layout[z]).filter((w): w is WidgetId => w != null);

  const hasHeader     = !!(headerLeft || headerRight);
  const hasMain       = !!(main1 && main1 !== 'spacer') || !!(main2 && main2 !== 'spacer');
  const hasFooter     = footerWidgets.some(w => w !== 'spacer');
  const footerHasDeps = footerWidgets.some(w => DEPARTURE_IDS.includes(w));

  // Zone class: fills its grid/flex cell and prevents content from overflowing
  const zone = 'h-full min-h-0 min-w-0 overflow-hidden';

  // Footer height: departure lists need more room; info-only widgets get 20 vh
  const footerStyle: React.CSSProperties = !hasMain
    ? { flex: '1 1 0', minHeight: 0 }
    : footerHasDeps
    ? { flex: '0 0 40%', minHeight: 0 }
    : { flex: '0 0 20%', minHeight: '120px' };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AlwaysOnContext.Provider value={alwaysOn}>
      <div className="flex flex-col h-screen w-screen p-6 gap-4 overflow-hidden">

        {hasHeader && (
          <div
            className="flex items-stretch justify-between border-b border-white pb-4 shrink-0"
            style={{ minHeight: '72px' }}
          >
            <div className={`flex-1 ${zone}`}>{renderWidget(headerLeft)}</div>
            {headerRight && (
              <div className={`flex-shrink-0 ml-8 ${zone}`}>{renderWidget(headerRight)}</div>
            )}
          </div>
        )}

        {hasMain && (
          <div
            className={main1 && main2 ? 'grid grid-cols-2 gap-6' : 'flex'}
            style={{ flex: '1 1 0', minHeight: 0 }}
          >
            {main1 && <div className={`${!main2 ? 'flex-1' : ''} ${zone}`}>{renderWidget(main1)}</div>}
            {main2 && <div className={zone}>{renderWidget(main2)}</div>}
          </div>
        )}

        {hasFooter && (
          <div
            className="border-t border-white pt-4 grid gap-6"
            style={{ ...footerStyle, gridTemplateColumns: `repeat(${footerWidgets.length}, 1fr)` }}
          >
            {footerWidgets.map((w, i) => (
              <div key={`${w}-${i}`} className={zone}>{renderWidget(w)}</div>
            ))}
          </div>
        )}

      </div>
    </AlwaysOnContext.Provider>
  );
};
