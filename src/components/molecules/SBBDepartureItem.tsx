import { SBBLineBadge } from '../atoms/SBBLineBadge';
import { SBBDeparture } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

export const SBBDepartureItem = ({
  departure,
  rowHeight = 48,
  showPlatform = false,
}: {
  departure: SBBDeparture;
  rowHeight?: number;
  showPlatform?: boolean;
}) => {
  const alwaysOn = useAlwaysOn();
  const dep      = departure.stop.departure ? new Date(departure.stop.departure) : null;
  const diffMin  = dep ? Math.round((dep.getTime() - Date.now()) / 60000) : null;
  const timeText = diffMin === null ? '—' : diffMin <= 0 ? 'Now' : `${diffMin} min`;
  const delay    = departure.stop.delay;
  const fontSize = Math.max(11, rowHeight * 0.40);

  return (
    <div
      className="flex justify-between items-center border-b border-zinc-700 shrink-0"
      style={{ height: rowHeight, fontSize }}
    >
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <SBBLineBadge
          name={`${departure.category} ${departure.number}`}
          category={departure.category}
          size={rowHeight * 0.65}
        />
        <span className="truncate">{departure.to}</span>
      </div>
      <div className={`flex items-center gap-2 shrink-0 ml-3 ${alwaysOn ? '' : 'font-bold'}`}>
        {showPlatform && departure.stop.platform && (
          <span className="text-gray-400 font-normal" style={{ fontSize: fontSize * 0.75 }}>
            Pl.{departure.stop.platform}
          </span>
        )}
        {delay != null && delay > 0 && (
          <span className="text-orange-400 font-normal" style={{ fontSize: fontSize * 0.75 }}>
            +{delay}'
          </span>
        )}
        <span>{timeText}</span>
      </div>
    </div>
  );
};
