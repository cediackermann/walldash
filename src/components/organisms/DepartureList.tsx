import { useSize } from '../../hooks/useSize';
import { DepartureItem } from '../molecules/DepartureItem';
import { Departure } from '../../types';

export const DepartureList = ({
  departures,
  loading,
  stationName,
}: {
  departures: Departure[];
  loading: boolean;
  stationName?: string;
}) => {
  const { h, w, ref } = useSize();
  const effectiveH = h || 200;

  // Header sizing
  const headerH      = stationName ? Math.max(24, Math.min(effectiveH * 0.17, 44)) : 0;
  const headerFontSz = Math.max(11, headerH * 0.55);

  // Row sizing: taller containers get bigger rows
  const listH   = effectiveH - headerH - (headerH ? 6 : 0);
  const rowH    = listH > 500 ? 68 : listH > 360 ? 54 : listH > 240 ? 42 : listH > 150 ? 34 : 27;
  const maxRows = Math.max(1, Math.floor(listH / rowH));
  const visible = departures.slice(0, maxRows);

  if (loading && departures.length === 0) {
    return (
      <div ref={ref} className="w-full h-full flex items-center">
        <span className="text-gray-500 text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full h-full flex flex-col overflow-hidden">
      {stationName && (
        <div
          className="text-gray-200 uppercase tracking-wider font-bold shrink-0 flex items-center border-b border-zinc-600"
          style={{ height: headerH, fontSize: headerFontSz }}
        >
          {stationName}
        </div>
      )}
      {visible.length === 0 ? (
        <span className="text-gray-500 mt-2 text-sm">No departures</span>
      ) : (
        visible.map((dep, i) => (
          <DepartureItem
            key={`${dep.line.designation}-${dep.scheduled}-${i}`}
            departure={dep}
            rowHeight={rowH}
          />
        ))
      )}
    </div>
  );
};
