import { useEffect, useState } from 'react';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';
import { useSize } from '../../hooks/useSize';

export const Clock = () => {
  const alwaysOn = useAlwaysOn();
  const { h, ref } = useSize();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!alwaysOn) {
      const id = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(id);
    }
    let interval: ReturnType<typeof setInterval>;
    const now = new Date();
    const msUntilNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => {
      setTime(new Date());
      interval = setInterval(() => setTime(new Date()), 60_000);
    }, msUntilNext);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [alwaysOn]);

  const effectiveH = h || 80;

  // Show seconds when not in alwaysOn and there is enough vertical room
  const showSeconds = !alwaysOn && effectiveH > 90;
  // Stack time and date vertically when tall enough; otherwise inline
  const stacked     = effectiveH > 110;
  // Show full weekday + month name when stacked, short otherwise
  const longDate    = stacked;

  const timeStr = time.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  });
  const dateStr = time.toLocaleDateString('en-GB', {
    weekday: longDate ? 'long' : 'short',
    day: 'numeric',
    month: longDate ? 'long' : 'short',
    ...(effectiveH > 160 ? { year: 'numeric' } : {}),
  });

  return (
    <div ref={ref} className="w-full h-full flex flex-col justify-center overflow-hidden">
      {stacked ? (
        <>
          <div className={`text-7xl tabular-nums leading-none ${alwaysOn ? 'font-light' : 'font-bold'}`}>
            {timeStr}
          </div>
          <div className="text-2xl text-gray-400 mt-2">{dateStr}</div>
        </>
      ) : (
        <div className="flex items-baseline gap-6 flex-wrap">
          <div className={`text-7xl tabular-nums ${alwaysOn ? 'font-light' : 'font-bold'}`}>
            {timeStr}
          </div>
          <div className="text-2xl text-gray-400">{dateStr}</div>
        </div>
      )}
    </div>
  );
};
