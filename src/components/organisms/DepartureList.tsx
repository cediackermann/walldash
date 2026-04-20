import { DepartureItem } from '../molecules/DepartureItem';
import { Departure } from '../../types';

export const DepartureList = ({ departures, loading }: { departures: Departure[]; loading: boolean }) => {
  if (loading && departures.length === 0) return <p className="text-gray-500 text-xl mt-4">Loading...</p>;
  if (!loading && departures.length === 0) return <p className="text-gray-500 text-xl mt-4">No departures.</p>;
  return (
    <div className="flex-1 overflow-hidden">
      {departures.map((dep, i) => (
        <DepartureItem key={`${dep.line.designation}-${i}`} departure={dep} />
      ))}
    </div>
  );
};
