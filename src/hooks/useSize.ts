import { useCallback, useRef, useState } from 'react';

/** Measures a div's content box via ResizeObserver. Attach `ref` to the element. */
export function useSize() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const roRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    roRef.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    roRef.current.observe(el);
  }, []);

  return { ...size, ref };
}
