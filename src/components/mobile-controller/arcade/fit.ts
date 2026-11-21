import { useLayoutEffect, useRef, useState } from 'react';

/** größtmögliche Fläche mit festem Seitenverhältnis (Breite/Höhe) im Container */
export function useFit(aspect: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      let w = W;
      let h = W / aspect;
      if (h > H) {
        h = H;
        w = H * aspect;
      }
      setSize((s) => (s.w === Math.floor(w) && s.h === Math.floor(h) ? s : { w: Math.floor(w), h: Math.floor(h) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);
  return [ref, size] as const;
}
