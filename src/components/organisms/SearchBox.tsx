import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StopLocation } from '../../types';

interface SearchBoxProps {
  onSelect: (stop: StopLocation) => void;
  endpoint: string;
  placeholder?: string;
}

export const SearchBox = ({ onSelect, endpoint, placeholder = 'Search for a station...' }: SearchBoxProps) => {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 350);
    return () => clearTimeout(timer);
  }, [input]);

  const { data, isFetching } = useQuery<{ StopLocation: StopLocation[] }>({
    queryKey: ['search', endpoint, query],
    queryFn: () => fetch(`${endpoint}?q=${encodeURIComponent(query)}`).then((r) => r.json()),
    enabled: query.length > 0,
    staleTime: 60_000,
  });

  const results = data?.StopLocation ?? [];

  return (
    <div className="w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black text-white px-4 py-2 border border-white outline-none text-lg"
      />

      <div className="mt-2 flex flex-col">
        {isFetching && <p className="text-gray-500 py-2">Searching...</p>}
        {!isFetching && results.map((stop) => (
          <div
            key={stop.id}
            onClick={() => onSelect(stop)}
            className="flex justify-between items-center py-3 border-b border-zinc-700 cursor-pointer text-lg"
          >
            <span>{stop.name}</span>
            <span className="text-gray-500 text-sm">{stop.id}</span>
          </div>
        ))}
        {!isFetching && query && results.length === 0 && (
          <p className="text-gray-500 py-2">No stations found.</p>
        )}
      </div>
    </div>
  );
};
