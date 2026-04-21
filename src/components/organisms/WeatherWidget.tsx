import { useQuery } from '@tanstack/react-query';
import { useSize } from '../../hooks/useSize';
import { WeatherData } from '../../types';

const ASCII: Record<string, string[]> = {
  sunny:        ['    \\   /   ', '     .-.    ', '  ― (   ) ―', '     `-\'    ', '    /   \\   '],
  partlycloudy: ['   \\  /     ', ' _ /"".--.  ', '   \\_( {  ) ', '     `-\'--\'  ', '             '],
  cloudy:       ['             ', '    .--.     ', ' .-(    ).   ', '(___.__)__)  ', '             '],
  overcast:     ['             ', '   .------.  ', '.-(         ).', '(__________.) ', '             '],
  rain:         ['    .--.     ', ' .-(    ).   ', '(___.__)__)  ', " ʻ ʻ ʻ ʻ    ", " ʻ ʻ ʻ ʻ    "],
  drizzle:      ['    .--.     ', ' .-(    ).   ', '(___.__)__)  ', "  , , , ,    ", "             "],
  snow:         ['    .--.     ', ' .-(    ).   ', '(___.__)__)  ', '  *  *  *    ', '*  *  *  *   '],
  thunder:      ['    .--.     ', ' .-(    ).   ', '(___.__)__)  ', '    /  \\     ', '   /    \\    '],
  fog:          ['             ', ' _ - _ - _ -', '  _ - _ - _ ', ' _ - _ - _ -', '             '],
  sleet:        ['    .--.     ', ' .-(    ).   ', '(___.__)__)  ', "  * ʻ * ʻ    ", " ʻ * ʻ *     "],
};

const MOON_CHAR: Record<string, string> = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓', 'Waxing Gibbous': '🌔',
  'Full Moon': '🌕', 'Waning Gibbous': '🌖', 'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};

function getAsciiKey(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('thunder'))                              return 'thunder';
  if (d.includes('snow'))                                 return 'snow';
  if (d.includes('sleet'))                                return 'sleet';
  if (d.includes('drizzle'))                              return 'drizzle';
  if (d.includes('rain'))                                 return 'rain';
  if (d.includes('fog') || d.includes('mist'))            return 'fog';
  if (d.includes('overcast'))                             return 'overcast';
  if (d.includes('mostly cloudy') || d.includes('very')) return 'cloudy';
  if (d.includes('partly') || d.includes('mostly sunny')) return 'partlycloudy';
  if (d.includes('cloudy'))                               return 'cloudy';
  if (d.includes('sunny') || d.includes('clear'))        return 'sunny';
  return 'cloudy';
}

export const WeatherWidget = () => {
  const { w, h, ref } = useSize();
  const { data, isError } = useQuery<WeatherData>({
    queryKey: ['weather'],
    queryFn: () => fetch('/api/weather').then(r => r.json()),
    refetchInterval: 10 * 60 * 1000,
  });

  const effectiveH = h || 100;
  const effectiveW = w || 350;

  if (isError || !data || (data as any).error) {
    return (
      <div ref={ref} className="w-full h-full flex items-center">
        <span className="text-gray-500 text-sm">Weather unavailable</span>
      </div>
    );
  }

  // Progressive disclosure based on available space
  const showAscii   = effectiveH > 200 && effectiveW > 380;
  const showHourly  = effectiveH > 140 && effectiveW > 260;
  const showSunMoon = effectiveH > 95  || effectiveW > 460;

  // Font sizes derived from container
  const tempFontSize = Math.min(effectiveH * (showAscii ? 0.34 : 0.42), 84);
  const descFontSize = Math.max(12, tempFontSize * 0.36);
  const metaFontSize = Math.max(10, tempFontSize * 0.27);
  const asciiFontSize = Math.max(9, effectiveH / 8);
  const maxHours = effectiveW > 500 ? 6 : effectiveW > 380 ? 4 : 3;

  const art  = ASCII[getAsciiKey(data.description)] ?? ASCII.cloudy;
  const moon = MOON_CHAR[data.moonPhase] ?? data.moonPhase;

  return (
    <div ref={ref} className="w-full h-full flex items-center gap-5 overflow-hidden">
      {showAscii && (
        <pre
          className="text-gray-300 shrink-0 select-none font-mono leading-tight"
          style={{ fontSize: asciiFontSize }}
        >
          {art.join('\n')}
        </pre>
      )}
      <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span style={{ fontSize: tempFontSize, fontWeight: 700, lineHeight: 1 }}>{data.temperature}°C</span>
          <span style={{ fontSize: descFontSize }} className="text-gray-300">{data.description}</span>
        </div>
        {showSunMoon && (
          <div className="flex flex-wrap gap-3 text-gray-400 font-mono" style={{ fontSize: metaFontSize }}>
            <span>↑ {data.sunrise}</span>
            <span>↓ {data.sunset}</span>
            <span title={data.moonPhase}>{moon} {data.moonPhase}</span>
          </div>
        )}
        {showHourly && data.hourly.length > 0 && (
          <div className="flex gap-4 mt-1">
            {data.hourly.slice(0, maxHours).map((entry, i) => (
              <div key={i} className="text-center shrink-0">
                <div style={{ fontSize: metaFontSize * 0.85 }} className="text-gray-500">{entry.time}</div>
                <div style={{ fontSize: metaFontSize }} className="font-bold">{entry.temp}°</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
