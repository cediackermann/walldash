import { SBBLineBadge } from '../atoms/SBBLineBadge';
import { SBBDeparture } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

export const SBBDepartureItem = ({
  departure,
  showPlatform = false,
}: {
  departure: SBBDeparture;
  showPlatform?: boolean;
}) => {
  const alwaysOn = useAlwaysOn();
  const dep      = departure.stop.departure ? new Date(departure.stop.departure) : null;
  const diffMin  = dep ? Math.round((dep.getTime() - Date.now()) / 60000) : null;
  const timeText = diffMin === null ? '—' : diffMin <= 0 ? 'Now' : `${diffMin} min`;
  const delay    = departure.stop.delay;

  return (
    <div className={`flex justify-between items-center py-3 border-b border-zinc-700 text-2xl ${alwaysOn ? 'font-light' : ''}`}>
      <div className="flex items-center gap-4 min-w-0 overflow-hidden">
        <SBBLineBadge name={`${departure.category} ${departure.number}`} category={departure.category} />
        <span className="truncate">{departure.to}</span>
      </div>
      <div className={`flex items-center gap-2 shrink-0 ml-4 ${alwaysOn ? 'font-normal' : 'font-bold'}`}>
        {showPlatform && departure.stop.platform && (
          <span className="text-sm text-gray-400 font-normal">Pl.{departure.stop.platform}</span>
        )}
        {delay != null && delay > 0 && (
          <span className="text-lg text-orange-400 font-normal">+{delay}'</span>
        )}
        <span>{timeText}</span>
      </div>
    </div>
  );
};
