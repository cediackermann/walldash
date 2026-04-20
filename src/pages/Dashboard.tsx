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

const FOOTER_ZONES: ZoneId[] = ['footer-1', 'footer-2', 'footer-3'];
const DEPARTURE_WIDGETS: WidgetId[] = ['sl', 'sbb'];

export const Dashboard = () => {
  const { data: config } = useQuery<Config>({
    queryKey: ['config'],
    queryFn: () => fetchJson('/api/config'),
  });

  const alwaysOn = !!config?.alwaysOn;
  const layout = config?.layout ?? {};

  const inLayout = (id: WidgetId) => Object.values(layout).includes(id);

  const [, tick] = useReducer(x => x + 1, 0);
  useEffect(() => {
    if (!alwaysOn) return;
    let id: ReturnType<typeof setInterval>;
    const schedule = () => {
      const now = new Date();
      const msUntilNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      return setTimeout(() => { tick(); id = setInterval(tick, 60_000); }, msUntilNext);
    };
    const timeout = schedule();
    return () => { clearTimeout(timeout); clearInterval(id); };
  }, [alwaysOn]);

  const { data: slData, isLoading: slLoading } = useQuery<{ departures: Departure[] }>({
    queryKey: ['sl-departures', config?.sl?.stationId],
    queryFn: () => fetchJson(`/api/sl/departures/${config!.sl.stationId}`),
    enabled: inLayout('sl') && !!config?.sl?.stationId,
    refetchInterval: alwaysOn ? 60_000 : (config?.refreshRate ?? 30_000),
  });

  const { data: sbbData, isLoading: sbbLoading } = useQuery<{ stationboard: SBBDeparture[] }>({
    queryKey: ['sbb-departures', config?.sbb?.stationId],
    queryFn: () => fetchJson(`/api/sbb/departures/${config!.sbb.stationId}`),
    enabled: inLayout('sbb') && !!config?.sbb?.stationId,
    refetchInterval: alwaysOn ? 60_000 : (config?.refreshRate ?? 30_000),
  });

  const renderWidget = (id: WidgetId | undefined) => {
    if (!id || id === 'spacer') return null;
    switch (id) {
      case 'clock':   return <div className="h-full flex items-center"><Clock /></div>;
      case 'weather': return <div className="h-full flex items-center"><WeatherWidget /></div>;
      case 'spotify': return <SpotifyWidget />;
      case 'system':  return <SystemWidget />;
      case 'sl':
        return (
          <div className="h-full flex flex-col">
            <h2 className={`text-xl uppercase tracking-wider shrink-0 pb-1 ${alwaysOn ? 'font-normal' : 'font-bold'}`}>
              {slData?.departures[0]?.stop_area?.name || config?.sl?.stationName || 'SL'}
            </h2>
            <DepartureList departures={slData?.departures ?? []} loading={slLoading} />
          </div>
        );
      case 'sbb':
        return (
          <div className="h-full flex flex-col">
            <h2 className={`text-xl uppercase tracking-wider shrink-0 pb-1 ${alwaysOn ? 'font-normal' : 'font-bold'}`}>
              {config?.sbb?.stationName || 'SBB'}
            </h2>
            <SBBDepartureList departures={sbbData?.stationboard ?? []} loading={sbbLoading} />
          </div>
        );
    }
  };

  const headerLeft    = layout['header-left'];
  const headerRight   = layout['header-right'];
  const main1         = layout['main-1'];
  const main2         = layout['main-2'];
  // Keep spacers — they hold intentional empty slots, only collapse truly unset zones
  const footerWidgets = FOOTER_ZONES.map(z => layout[z]).filter(w => w != null) as WidgetId[];

  const hasHeader = headerLeft || headerRight;
  // spacer alone doesn't count as real content
  const hasMain   = (main1 && main1 !== 'spacer') || (main2 && main2 !== 'spacer');
  const hasFooter = footerWidgets.filter(w => w !== 'spacer').length > 0;

  const footerHasDeps = footerWidgets.some(w => DEPARTURE_WIDGETS.includes(w));

  // Footer sizing: takes 40% of viewport when holding departure lists so rows are visible.
  // When only info widgets: auto-height. When no main: expands to fill.
  const footerStyle: React.CSSProperties = !hasMain
    ? { flex: '1 1 0', minHeight: 0 }
    : footerHasDeps
    ? { flex: '0 0 40%', minHeight: 0 }
    : { flex: '0 0 auto', minHeight: '140px' };

  // Zone wrapper: min-h-0 prevents a child from inflating beyond the slot
  const zoneClass = 'min-h-0 min-w-0 overflow-hidden';

  return (
    <AlwaysOnContext.Provider value={alwaysOn}>
      <div className="flex flex-col h-screen w-screen p-6 gap-4 overflow-hidden">

        {hasHeader && (
          <div className="flex items-center justify-between border-b border-white pb-4 shrink-0">
            <div className={`flex-1 ${zoneClass}`}>{renderWidget(headerLeft)}</div>
            {headerRight && <div className={`flex-shrink-0 ml-8 ${zoneClass}`}>{renderWidget(headerRight)}</div>}
          </div>
        )}

        {hasMain && (
          <div
            className={`${main1 && main2 ? 'grid grid-cols-2 gap-6' : 'flex'}`}
            style={{ flex: '1 1 0', minHeight: 0 }}
          >
            {main1 && <div className={`${main1 && main2 ? '' : 'flex-1'} ${zoneClass}`}>{renderWidget(main1)}</div>}
            {main2 && <div className={zoneClass}>{renderWidget(main2)}</div>}
          </div>
        )}

        {hasFooter && (
          <div
            className="border-t border-white pt-4 grid gap-6"
            style={{
              ...footerStyle,
              gridTemplateColumns: `repeat(${footerWidgets.length}, 1fr)`,
            }}
          >
            {footerWidgets.map((w, i) => (
              <div key={`${w}-${i}`} className={`${zoneClass} h-full`}>{renderWidget(w)}</div>
            ))}
          </div>
        )}

      </div>
    </AlwaysOnContext.Provider>
  );
};
