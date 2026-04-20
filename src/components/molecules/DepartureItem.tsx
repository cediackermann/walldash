import { LineBadge } from '../atoms/LineBadge';
import { Departure } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

export const DepartureItem = ({ departure }: { departure: Departure }) => {
  const alwaysOn = useAlwaysOn();
  const depTime = new Date(departure.scheduled);
  const diffMin = Math.round((depTime.getTime() - Date.now()) / 60000);
  const timeText = diffMin <= 0 ? 'Now' : `${diffMin} min`;

  return (
    <div className={`flex justify-between items-center py-3 border-b border-zinc-700 text-2xl ${alwaysOn ? 'font-light' : ''}`}>
      <div className="flex items-center gap-4">
        <LineBadge designation={departure.line.designation} mode={departure.line.transport_mode} groupOfLines={departure.line.group_of_lines} />
        <span>{departure.destination}</span>
      </div>
      <span className={alwaysOn ? 'font-normal' : 'font-bold'}>{timeText}</span>
    </div>
  );
};
