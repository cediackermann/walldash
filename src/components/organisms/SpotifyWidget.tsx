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

  // Progressive disclosure
  const showLabel        = effectiveH > 80;
  const showArtist       = effectiveH > 65  || effectiveW > 240;
  const showAlbum        = effectiveH > 120 && effectiveW > 260;
  const showProgress     = !alwaysOn && effectiveH > 95 && effectiveW > 200;
  const showProgressTime = showProgress && effectiveW > 280;

  // Font sizes derived from container
  const trackFS  = Math.min(effectiveH * 0.28, effectiveW * 0.10, 40);
  const artistFS = Math.max(11, trackFS * 0.70);
  const albumFS  = Math.max(10, trackFS * 0.55);
  const labelFS  = Math.max(9,  trackFS * 0.45);
  const barH     = Math.max(2, effectiveH * 0.018);

  return (
    <div ref={ref} className="w-full h-full flex flex-col justify-center overflow-hidden">
      {showLabel && (
        <div className="text-gray-400 uppercase tracking-wider" style={{ fontSize: labelFS, marginBottom: '0.3em' }}>
          Now Playing
        </div>
      )}
      {data?.playing && data.track ? (
        <>
          <div
            className="leading-tight truncate"
            style={{ fontSize: trackFS, fontWeight: alwaysOn ? 400 : 700 }}
          >
            {data.track.name}
          </div>
          {showArtist && (
            <div className="text-gray-300 truncate" style={{ fontSize: artistFS, marginTop: '0.15em' }}>
              {data.track.artist}
            </div>
          )}
          {showAlbum && (
            <div className="text-gray-500 truncate" style={{ fontSize: albumFS, marginTop: '0.1em' }}>
              {data.track.album}
            </div>
          )}
          {showProgress && (
            <div className="flex items-center gap-2" style={{ marginTop: '0.4em' }}>
              {showProgressTime && (
                <span className="text-gray-500 font-mono shrink-0" style={{ fontSize: albumFS }}>
                  {fmtMs(data.track.progressMs)}
                </span>
              )}
              <div className="flex-1 bg-zinc-800 relative" style={{ height: barH }}>
                <div
                  className="absolute inset-y-0 left-0 bg-white"
                  style={{ width: `${(data.track.progressMs / data.track.durationMs) * 100}%` }}
                />
              </div>
              {showProgressTime && (
                <span className="text-gray-500 font-mono shrink-0 text-right" style={{ fontSize: albumFS }}>
                  {fmtMs(data.track.durationMs)}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-500" style={{ fontSize: artistFS }}>Nothing playing</div>
      )}
    </div>
  );
};
