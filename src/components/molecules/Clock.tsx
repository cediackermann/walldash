import { useEffect, useState } from 'react';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';
import { useSize } from '../../hooks/useSize';

export const Clock = () => {
  const alwaysOn = useAlwaysOn();
  const { w, h, ref } = useSize();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!alwaysOn) {
      const id = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(id);
    }
    // In alwaysOn mode: sync to the next full minute, then tick every 60 s
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
  const effectiveW = w || 400;

  const showSeconds = !alwaysOn && effectiveH > 100;
  const showDate    = effectiveH > 55 || effectiveW > 280;
  const longDate    = effectiveH > 130;

  const timeStr = time.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  });
  const dateStr = time.toLocaleDateString('en-GB', {
    weekday: longDate ? 'long' : 'short',
    day: 'numeric',
    month: longDate ? 'long' : 'short',
    ...(effectiveH > 200 ? { year: 'numeric' } : {}),
  });

  // Fluid font size: fill width or height, whichever is tighter.
  // Each character is ~0.60 em wide in tabular-nums.
  const charCount = timeStr.length;
  const fontByW   = (effectiveW * 0.90) / (charCount * 0.60);
  const fontByH   = showDate ? effectiveH * 0.50 : effectiveH * 0.72;
  const fontSize  = Math.max(16, Math.min(fontByW, fontByH, 220));
  const dateFontSize = Math.max(12, Math.min(fontSize * 0.22, 32));

  return (
    <div ref={ref} className="w-full h-full flex flex-col justify-center overflow-hidden">
      <div
        className="tabular-nums leading-none"
        style={{ fontSize, fontWeight: alwaysOn ? 300 : 700, letterSpacing: '-0.02em' }}
      >
        {timeStr}
      </div>
      {showDate && (
        <div className="text-gray-400" style={{ fontSize: dateFontSize, marginTop: `${fontSize * 0.08}px` }}>
          {dateStr}
        </div>
      )}
    </div>
  );
};
