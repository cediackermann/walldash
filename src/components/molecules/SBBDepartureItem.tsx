import { SBBLineBadge } from '../atoms/SBBLineBadge';
import { SBBDeparture } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

export const SBBDepartureItem = ({ departure }: { departure: SBBDeparture }) => {
  const alwaysOn = useAlwaysOn();
  const dep = departure.stop.departure ? new Date(departure.stop.departure) : null;
  const diffMin = dep ? Math.round((dep.getTime() - Date.now()) / 60000) : null;
  const timeText = diffMin === null ? '—' : diffMin <= 0 ? 'Now' : `${diffMin} min`;
  const delay = departure.stop.delay;

  return (
    <div className={`flex justify-between items-center py-3 border-b border-zinc-700 text-2xl ${alwaysOn ? 'font-light' : ''}`}>
      <div className="flex items-center gap-4">
        <SBBLineBadge name={`${departure.category} ${departure.number}`} category={departure.category} />
        <span>{departure.to}</span>
      </div>
      <div className={`flex items-center gap-2 ${alwaysOn ? 'font-normal' : 'font-bold'}`}>
        {delay != null && delay > 0 && <span className="text-lg font-normal">+{delay}'</span>}
        <span>{timeText}</span>
      </div>
    </div>
  );
};
