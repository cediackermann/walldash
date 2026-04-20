import { useEffect, useState } from 'react';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

export const Clock = () => {
  const alwaysOn = useAlwaysOn();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!alwaysOn) {
      const id = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(id);
    }

    // Sync to the next full minute, then tick every 60 s
    let interval: ReturnType<typeof setInterval>;
    const now = new Date();
    const msUntilNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => {
      setTime(new Date());
      interval = setInterval(() => setTime(new Date()), 60_000);
    }, msUntilNext);

    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [alwaysOn]);

  const timeStr = alwaysOn
    ? time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    : time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const dateStr = time.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex items-baseline gap-6">
      <div className={`text-7xl ${alwaysOn ? 'font-light' : 'font-bold'}`}>{timeStr}</div>
      <div className="text-2xl text-gray-400">{dateStr}</div>
    </div>
  );
};
