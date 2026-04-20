import { SBBDepartureItem } from '../molecules/SBBDepartureItem';
import { SBBDeparture } from '../../types';

export const SBBDepartureList = ({ departures, loading }: { departures: SBBDeparture[]; loading: boolean }) => {
  if (loading && departures.length === 0) return <p className="text-gray-500 text-xl mt-4">Loading...</p>;
  if (!loading && departures.length === 0) return <p className="text-gray-500 text-xl mt-4">No departures.</p>;
  return (
    <div className="flex-1 overflow-hidden">
      {departures.map((dep, i) => (
        <SBBDepartureItem key={`${dep.name}-${i}`} departure={dep} />
      ))}
    </div>
  );
};
