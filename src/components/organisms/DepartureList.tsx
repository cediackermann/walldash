import { DepartureItem } from '../molecules/DepartureItem';
import { Departure } from '../../types';

export const DepartureList = ({ departures, loading }: { departures: Departure[]; loading: boolean }) => {
  return (
    <div className="flex flex-col gap-4 mt-8">
      {loading && departures.length === 0 && (
        <div className="flex justify-center p-12 text-gray-500 text-2xl animate-pulse">
          Fetching departures...
        </div>
      )}
      {!loading && departures.length === 0 && (
        <div className="flex justify-center p-12 text-gray-400 text-2xl bg-surface rounded-xl">
          No upcoming departures found.
        </div>
      )}
      {departures.slice(0, 5).map((dep, i) => (
        <DepartureItem key={`${dep.line.designation}-${i}`} departure={dep} />
      ))}
    </div>
  );
};
