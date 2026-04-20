import { LineBadge } from '../atoms/LineBadge';
import { Departure } from '../../types';

export const DepartureItem = ({ departure }: { departure: Departure }) => {
  const depTime = new Date(departure.scheduled);
  const diffMin = Math.round((depTime.getTime() - Date.now()) / 60000);
  const timeText = diffMin <= 0 ? 'Nu' : `${diffMin} min`;

  return (
    <div className="flex justify-between items-center px-5 py-4 bg-surface rounded-xl text-3xl font-medium transition hover:bg-zinc-800">
      <div className="flex items-center gap-6">
        <LineBadge designation={departure.line.designation} mode={departure.line.transport_mode} />
        <span className="truncate max-w-[45vw]">{departure.destination}</span>
      </div>
      <span className="font-bold text-sl-green whitespace-nowrap ml-6">
        {timeText}
      </span>
    </div>
  );
};
