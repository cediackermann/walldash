import { LineBadge } from '../atoms/LineBadge';
import { Departure } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

export const DepartureItem = ({ departure }: { departure: Departure }) => {
  const alwaysOn = useAlwaysOn();
  const depTime  = new Date(departure.scheduled);
  const diffMin  = Math.round((depTime.getTime() - Date.now()) / 60000);
  const timeText = diffMin <= 0 ? 'Now' : `${diffMin} min`;

  return (
    <div className={`flex justify-between items-center py-3 border-b border-zinc-700 text-2xl ${alwaysOn ? 'font-light' : ''}`}>
      <div className="flex items-center gap-4 min-w-0 overflow-hidden">
        <LineBadge
          designation={departure.line.designation}
          mode={departure.line.transport_mode}
          groupOfLines={departure.line.group_of_lines}
        />
        <span className="truncate">{departure.destination}</span>
      </div>
      <span className={`shrink-0 ml-4 ${alwaysOn ? 'font-normal' : 'font-bold'}`}>{timeText}</span>
    </div>
  );
};
