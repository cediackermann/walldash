import { useSize } from '../../hooks/useSize';
import { DepartureItem } from '../molecules/DepartureItem';
import { Departure } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

// text-2xl (line-height 2rem = 32px) + py-3 (2 × 12px) = 56 px per row
const ROW_H    = 56;
// text-xl header + pb-1 + a little breathing room
const HEADER_H = 38;

export const DepartureList = ({
  departures,
  loading,
  stationName,
}: {
  departures: Departure[];
  loading: boolean;
  stationName?: string;
}) => {
  const alwaysOn = useAlwaysOn();
  const { h, ref } = useSize();
  const effectiveH = h || 300;

  const listH   = effectiveH - (stationName ? HEADER_H : 0);
  const maxRows = Math.max(1, Math.floor(listH / ROW_H));
  const visible = departures.slice(0, maxRows);

  return (
    <div ref={ref} className="w-full h-full flex flex-col overflow-hidden">
      {stationName && (
        <h2 className={`text-xl uppercase tracking-wider shrink-0 pb-1 ${alwaysOn ? 'font-normal' : 'font-bold'}`}>
          {stationName}
        </h2>
      )}
      {loading && departures.length === 0 ? (
        <p className="text-gray-500 text-xl mt-4">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-gray-500 text-xl mt-4">No departures</p>
      ) : (
        visible.map((dep, i) => (
          <DepartureItem key={`${dep.line.designation}-${dep.scheduled}-${i}`} departure={dep} />
        ))
      )}
    </div>
  );
};
