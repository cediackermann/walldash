import { useState } from 'react';
import { StopLocation } from '../../types';

interface SearchBoxProps {
  onSelect: (stop: StopLocation) => void;
}

export const SearchBox = ({ onSelect }: SearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StopLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/sl/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.StopLocation || []);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 px-4">
      <div className="flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && search()}
          placeholder="Search for a station..."
          className="flex-grow bg-surface text-white px-6 py-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-sl-blue transition-all text-xl"
        />
        <button
          onClick={search}
          className="bg-sl-blue px-8 py-4 rounded-xl font-bold text-xl hover:brightness-110 active:scale-95 transition-all"
        >
          Search
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {loading && <div className="p-6 bg-surface rounded-xl animate-pulse text-xl">Searching...</div>}
        {!loading && results.map((stop) => (
          <div
            key={stop.id}
            onClick={() => onSelect(stop)}
            className="flex justify-between items-center p-6 bg-surface rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors text-xl"
          >
            <span className="font-medium">{stop.name}</span>
            <span className="text-gray-500 text-sm">ID: {stop.id}</span>
          </div>
        ))}
        {!loading && query && results.length === 0 && (
          <div className="p-6 bg-surface rounded-xl text-gray-500 text-xl">No stations found.</div>
        )}
      </div>
    </div>
  );
};
