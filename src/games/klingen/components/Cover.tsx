import { useEffect, useRef } from 'react';
import type { CoverProps } from '../../game-types';
import { drawKnife, drawWheel, fitCanvas } from './draw';

const KNIVES = [0.3, 1.4, 2.2, 3.5, 4.6, 5.5].map((a, i) => ({ a, color: ['#e8590c', '#36a9f0', '#2fb67c', '#f2c14e', '#b583ff', '#ff5fa2'][i]! }));

/** Kachel: Holzrad mit Messern, dreht sich bei Auswahl */
export function KlingenCover({ focused }: CoverProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const c = ref.current;
      if (!c) return;
      const { w, h, dpr } = fitCanvas(c);
      // Größe noch unbekannt (Kachel wird gerade aufgebaut) – nächstes Bild nochmal
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const r = Math.min(w, h) * 0.26;
      const angle = focused ? (performance.now() - t0) / 700 : 0.4;
      drawWheel(ctx, w / 2, h * 0.4, r, angle, KNIVES, { knifeLen: r * 0.85 });
      drawKnife(ctx, w / 2, h * 0.86, -Math.PI / 2, r * 0.85, '#e8590c');
      if (focused) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [focused]);
  return (
    <div className="circus-bg relative size-full">
      <canvas ref={ref} className="absolute inset-0 size-full" role="img" aria-label="Klingenrad" />
    </div>
  );
}
