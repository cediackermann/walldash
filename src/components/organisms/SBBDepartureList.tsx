import { useSize } from '../../hooks/useSize';
import { SBBDepartureItem } from '../molecules/SBBDepartureItem';
import { SBBDeparture } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

const ROW_H    = 56;
const HEADER_H = 38;

export const SBBDepartureList = ({
  departures,
  loading,
  stationName,
}: {
  departures: SBBDeparture[];
  loading: boolean;
  stationName?: string;
}) => {
  const alwaysOn = useAlwaysOn();
  const { h, w, ref } = useSize();
  const effectiveH = h || 300;

  const listH      = effectiveH - (stationName ? HEADER_H : 0);
  const maxRows    = Math.max(1, Math.floor(listH / ROW_H));
  // Platform column only when the slot is wide enough to show it comfortably
  const showPlatform = (w || 0) > 320;
  const visible    = departures.slice(0, maxRows);

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
          <SBBDepartureItem
            key={`${dep.name}-${dep.stop.departure}-${i}`}
            departure={dep}
            showPlatform={showPlatform}
          />
        ))
      )}
    </div>
  );
};
