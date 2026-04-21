import { useQuery } from '@tanstack/react-query';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';
import { useSize } from '../../hooks/useSize';
import { SpotifyNowPlaying } from '../../types';

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const SpotifyWidget = () => {
  const alwaysOn = useAlwaysOn();
  const { w, h, ref } = useSize();
  const { data } = useQuery<SpotifyNowPlaying>({
    queryKey: ['spotify-now-playing'],
    queryFn: () => fetch('/api/spotify/now-playing').then(r => r.json()),
    refetchInterval: alwaysOn ? 30_000 : 1_000,
  });

  const effectiveH = h || 100;
  const effectiveW = w || 300;

  // Progressive disclosure — text sizes are fixed, only visibility changes
  const showAlbum    = effectiveH > 110 && effectiveW > 260;
  const showProgress = !alwaysOn && effectiveH > 90 && effectiveW > 200;
  const showTimes    = showProgress && effectiveW > 280;

  return (
    <div ref={ref} className="w-full h-full flex flex-col justify-center overflow-hidden">
      <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-1 font-normal">Now Playing</h2>
      {data?.playing && data.track ? (
        <>
          <p className={`text-2xl leading-tight truncate ${alwaysOn ? 'font-normal' : 'font-bold'}`}>
            {data.track.name}
          </p>
          <p className="text-lg text-gray-300 mt-0.5 truncate">{data.track.artist}</p>
          {showAlbum && (
            <p className="text-sm text-gray-500 truncate">{data.track.album}</p>
          )}
          {showProgress && (
            <div className="mt-1.5 flex items-center gap-2">
              {showTimes && (
                <span className="text-xs text-gray-500 font-mono w-10 shrink-0">
                  {fmtMs(data.track.progressMs)}
                </span>
              )}
              <div className="flex-1 h-1.5 bg-zinc-800 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-white"
                  style={{ width: `${(data.track.progressMs / data.track.durationMs) * 100}%` }}
                />
              </div>
              {showTimes && (
                <span className="text-xs text-gray-500 font-mono w-10 shrink-0 text-right">
                  {fmtMs(data.track.durationMs)}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-lg">Nothing playing</p>
      )}
    </div>
  );
};
