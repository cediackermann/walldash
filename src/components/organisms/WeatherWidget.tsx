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
  if (d.includes('thunder'))                               return 'thunder';
  if (d.includes('snow'))                                  return 'snow';
  if (d.includes('sleet'))                                 return 'sleet';
  if (d.includes('drizzle'))                               return 'drizzle';
  if (d.includes('rain'))                                  return 'rain';
  if (d.includes('fog') || d.includes('mist'))             return 'fog';
  if (d.includes('overcast'))                              return 'overcast';
  if (d.includes('mostly cloudy') || d.includes('very'))  return 'cloudy';
  if (d.includes('partly') || d.includes('mostly sunny')) return 'partlycloudy';
  if (d.includes('cloudy'))                                return 'cloudy';
  return 'sunny';
}

export const WeatherWidget = () => {
  const { w, h, ref } = useSize();
  const { data, isError } = useQuery<WeatherData>({
    queryKey: ['weather'],
    queryFn: () => fetch('/api/weather').then(r => r.json()),
    refetchInterval: 10 * 60 * 1000,
  });

  if (isError || !data || (data as any).error) {
    return (
      <div ref={ref} className="w-full h-full flex items-center">
        <span className="text-gray-500 text-sm">Weather unavailable</span>
      </div>
    );
  }

  const effectiveH = h || 80;
  const effectiveW = w || 350;

  // Progressive disclosure — everything is the same size, just more/less shown
  const showAscii   = effectiveH > 180 && effectiveW > 380;
  const showHourly  = effectiveH > 120 && effectiveW > 260;
  const showSunMoon = effectiveH > 80  || effectiveW > 460;
  const maxHours    = effectiveW > 500 ? 6 : effectiveW > 380 ? 4 : 3;

  const art  = ASCII[getAsciiKey(data.description)] ?? ASCII.cloudy;
  const moon = MOON_CHAR[data.moonPhase] ?? data.moonPhase;

  return (
    <div ref={ref} className="w-full h-full flex items-center gap-4 overflow-hidden">
      {showAscii && (
        <pre className="text-gray-300 text-[11px] leading-tight select-none font-mono shrink-0">
          {art.join('\n')}
        </pre>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl font-bold">{data.temperature}°C</span>
          <span className="text-lg text-gray-300">{data.description}</span>
        </div>
        {showSunMoon && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-mono">
            <span>↑ {data.sunrise}</span>
            <span>↓ {data.sunset}</span>
            <span title={data.moonPhase}>{moon} {data.moonPhase}</span>
          </div>
        )}
        {showHourly && data.hourly.length > 0 && (
          <div className="flex gap-3 mt-1">
            {data.hourly.slice(0, maxHours).map((entry, i) => (
              <div key={i} className="text-center shrink-0">
                <div className="text-xs text-gray-500">{entry.time}</div>
                <div className="text-sm font-bold">{entry.temp}°</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
