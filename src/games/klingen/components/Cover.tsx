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
    <div className="relative size-full bg-[radial-gradient(ellipse_at_50%_30%,#6b3a1f_0%,#2a160c_75%)]">
      <canvas ref={ref} className="absolute inset-0 size-full" role="img" aria-label="Klingenrad" />
    </div>
  );
}
