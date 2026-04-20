import { useQuery } from '@tanstack/react-query';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';
import { SpotifyNowPlaying } from '../../types';

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const SpotifyWidget = () => {
  const alwaysOn = useAlwaysOn();

  const { data } = useQuery<SpotifyNowPlaying>({
    queryKey: ['spotify-now-playing'],
    queryFn: () => fetch('/api/spotify/now-playing').then(r => r.json()),
    refetchInterval: alwaysOn ? 30_000 : 1_000,
  });

  return (
    <div className="h-full flex flex-col justify-center">
      <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-1 font-normal">Now Playing</h2>
      {data?.playing && data.track ? (
        <>
          <p className={`text-2xl leading-tight ${alwaysOn ? 'font-normal' : 'font-bold'}`}>{data.track.name}</p>
          <p className="text-lg text-gray-300 mt-0.5">{data.track.artist}</p>
          <p className="text-sm text-gray-500">{data.track.album}</p>
          {!alwaysOn && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono w-10 shrink-0">{fmtMs(data.track.progressMs)}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-white"
                  style={{ width: `${(data.track.progressMs / data.track.durationMs) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono w-10 shrink-0 text-right">{fmtMs(data.track.durationMs)}</span>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-lg">Nothing playing</p>
      )}
    </div>
  );
};
