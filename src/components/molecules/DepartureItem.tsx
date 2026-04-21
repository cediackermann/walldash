import { LineBadge } from '../atoms/LineBadge';
import { Departure } from '../../types';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

export const DepartureItem = ({
  departure,
  rowHeight = 48,
}: {
  departure: Departure;
  rowHeight?: number;
}) => {
  const alwaysOn = useAlwaysOn();
  const depTime  = new Date(departure.scheduled);
  const diffMin  = Math.round((depTime.getTime() - Date.now()) / 60000);
  const timeText = diffMin <= 0 ? 'Now' : `${diffMin} min`;

  return (
    <div
      className="flex justify-between items-center border-b border-zinc-700 shrink-0"
      style={{ height: rowHeight, fontSize: Math.max(11, rowHeight * 0.40) }}
    >
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <LineBadge
          designation={departure.line.designation}
          mode={departure.line.transport_mode}
          groupOfLines={departure.line.group_of_lines}
          size={rowHeight * 0.65}
        />
        <span className="truncate">{departure.destination}</span>
      </div>
      <span className={`shrink-0 ml-3 ${alwaysOn ? '' : 'font-bold'}`}>{timeText}</span>
    </div>
  );
};
