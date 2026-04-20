import { useQuery } from '@tanstack/react-query';
import { WeatherData } from '../../types';

// 5-line ASCII art keyed by condition keyword
const ASCII: Record<string, string[]> = {
  sunny: [
    '    \\   /   ',
    '     .-.    ',
    '  ― (   ) ―',
    '     `-\'    ',
    '    /   \\   ',
  ],
  partlycloudy: [
    '   \\  /     ',
    ' _ /"".--.  ',
    '   \\_( {  ) ',
    '     `-\'--\'  ',
    '             ',
  ],
  cloudy: [
    '             ',
    '    .--.     ',
    ' .-(    ).   ',
    '(___.__)__)  ',
    '             ',
  ],
  overcast: [
    '             ',
    '   .------.  ',
    '.-(         ).',
    '(__________.) ',
    '             ',
  ],
  rain: [
    '    .--.     ',
    ' .-(    ).   ',
    '(___.__)__)  ',
    " ʻ ʻ ʻ ʻ    ",
    " ʻ ʻ ʻ ʻ    ",
  ],
  drizzle: [
    '    .--.     ',
    ' .-(    ).   ',
    '(___.__)__)  ',
    "  , , , ,    ",
    "             ",
  ],
  snow: [
    '    .--.     ',
    ' .-(    ).   ',
    '(___.__)__)  ',
    '  *  *  *    ',
    '*  *  *  *   ',
  ],
  thunder: [
    '    .--.     ',
    ' .-(    ).   ',
    '(___.__)__)  ',
    '    /  \\     ',
    '   /    \\    ',
  ],
  fog: [
    '             ',
    ' _ - _ - _ -',
    '  _ - _ - _ ',
    ' _ - _ - _ -',
    '             ',
  ],
  sleet: [
    '    .--.     ',
    ' .-(    ).   ',
    '(___.__)__)  ',
    "  * ʻ * ʻ    ",
    " ʻ * ʻ *     ",
  ],
};

const MOON_CHAR: Record<string, string> = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};

function getAsciiKey(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('thunder')) return 'thunder';
  if (d.includes('snow')) return 'snow';
  if (d.includes('sleet')) return 'sleet';
  if (d.includes('drizzle')) return 'drizzle';
  if (d.includes('rain')) return 'rain';
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) return 'fog';
  if (d.includes('overcast')) return 'overcast';
  if (d.includes('mostly cloudy') || d.includes('very cloudy')) return 'cloudy';
  if (d.includes('partly cloudy') || d.includes('mostly sunny')) return 'partlycloudy';
  if (d.includes('cloudy')) return 'cloudy';
  if (d.includes('sunny') || d.includes('clear')) return 'sunny';
  return 'cloudy';
}

export const WeatherWidget = () => {
  const { data, isError } = useQuery<WeatherData>({
    queryKey: ['weather'],
    queryFn: () => fetch('/api/weather').then(r => r.json()),
    refetchInterval: 10 * 60 * 1000,
  });

  if (isError || !data || (data as any).error) {
    return <div className="text-gray-500 text-sm">Weather unavailable</div>;
  }

  const art = ASCII[getAsciiKey(data.description)] ?? ASCII.cloudy;
  const moon = MOON_CHAR[data.moonPhase] ?? data.moonPhase;

  return (
    <div className="flex items-start gap-4">
      <pre className="text-gray-300 text-[11px] leading-tight select-none font-mono">{art.join('\n')}</pre>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold">{data.temperature}°C</span>
          <span className="text-lg text-gray-300">{data.description}</span>
        </div>
        <div className="flex gap-4 text-sm text-gray-400 font-mono">
          <span>↑ {data.sunrise}</span>
          <span>↓ {data.sunset}</span>
          <span title={data.moonPhase}>{moon} {data.moonPhase}</span>
        </div>
        {data.hourly.length > 0 && (
          <div className="flex gap-3 mt-1">
            {data.hourly.map((h, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-gray-500">{h.time}</div>
                <div className="text-sm font-bold">{h.temp}°</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
