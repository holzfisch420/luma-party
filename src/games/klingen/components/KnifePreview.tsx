import { useEffect, useRef } from 'react';
import { drawKnife } from './draw';

/** ein Messer als kleines Bild (Spitze nach oben) */
export function KnifePreview({ skin, height = 90, accent, className = '' }: { skin: number; height?: number; accent?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(height * 0.42);
    c.width = w * dpr;
    c.height = height * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${height}px`;
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, height);
    const len = height * 0.9;
    drawKnife(g, w / 2, (height - len) / 2, -Math.PI / 2, len, skin, 1, accent);
  }, [skin, height, accent]);
  return <canvas ref={ref} className={className} />;
}
