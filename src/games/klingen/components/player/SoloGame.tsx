import { useEffect, useRef, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { TIMING } from '../../game-config';
import { angleAt, collides, localImpact, makeStage, type Stage } from '../../logic/wheel';
import { drawKnife, drawWheel, fitCanvas, type StuckKnife } from '../draw';
import { klingenSounds } from '../sounds';

type Mode = 'play' | 'clear' | 'fail' | 'over';

interface Props {
  seed: number;
  /** Stufe laut Server (Start bzw. nach Neuverbindung) */
  startStage: number;
  lives: number;
  maxLives: number;
  active: boolean;
  color: string;
  onProgress: (stage: number, stuck: number) => void;
  onClear: (stage: number) => void;
  onFail: (stage: number) => void;
}

/**
 * Einzelspiel auf dem Handy: komplett lokal berechnet (keine Verzögerung).
 * Tippen irgendwo = Messer werfen.
 */
export function SoloGame({ seed, startStage, lives, maxLives, active, color, onProgress, onClear, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ stage: startStage, left: 0, mode: 'play' as Mode });
  const game = useRef({
    stage: makeStage(seed, startStage) as Stage,
    knives: [] as StuckKnife[],
    left: 0,
    startedAt: performance.now(),
    flying: null as number | null,
    mode: 'play' as Mode,
    modeAt: 0,
    bounce: null as { a: number } | null,
  });
  const cb = useRef({ onProgress, onClear, onFail, active, lives });
  cb.current = { onProgress, onClear, onFail, active, lives };

  const loadStage = (n: number) => {
    const g = game.current;
    g.stage = makeStage(seed, n);
    g.knives = g.stage.obstacles.map((a) => ({ a, color: '#5b6170', fixed: true }));
    g.left = g.stage.knives;
    g.startedAt = performance.now();
    g.flying = null;
    g.bounce = null;
    g.mode = 'play';
    setHud({ stage: n, left: g.left, mode: 'play' });
  };

  useEffect(() => {
    loadStage(startStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  // Zeichnen + Spiellogik
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { w, h, dpr } = fitCanvas(canvas);
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const g = game.current;
      const now = performance.now();
      const r = Math.min(w * 0.3, h * 0.22);
      const cx = w / 2;
      const cy = h * 0.32;
      const len = r * 0.95;
      const angle = g.mode === 'play' || g.mode === 'fail' ? angleAt(g.stage.spin, (now - g.startedAt) / 1000) : angleAt(g.stage.spin, (g.modeAt - g.startedAt) / 1000);
      // Messer liegt unten bereit – ganz sichtbar (Griff endet über dem unteren Rand)
      const startY = h - len - 34;
      const impactY = cy + r * 0.72;

      // Messer kommt an?
      if (g.mode === 'play' && g.flying !== null && now - g.flying >= TIMING.flightMs) {
        g.flying = null;
        const local = localImpact(angle);
        if (collides(local, g.knives.map((k) => k.a))) {
          g.mode = 'fail';
          g.modeAt = now;
          g.bounce = { a: local };
          klingenSounds.clang();
          haptics.play('error');
          setHud((s) => ({ ...s, mode: 'fail' }));
        } else {
          g.knives.push({ a: local, color });
          g.left--;
          klingenSounds.stick();
          haptics.play('light');
          setHud((s) => ({ ...s, left: g.left }));
          cb.current.onProgress(g.stage.n, g.stage.knives - g.left);
          if (g.left === 0) {
            g.mode = 'clear';
            g.modeAt = now;
            klingenSounds.clear();
            haptics.play('success');
            setHud((s) => ({ ...s, mode: 'clear' }));
          }
        }
      }
      // Übergänge
      if (g.mode === 'clear' && now - g.modeAt > 900) {
        const n = g.stage.n;
        cb.current.onClear(n);
        loadStage(n + 1);
      }
      if (g.mode === 'fail' && now - g.modeAt > 1000) {
        const n = g.stage.n;
        cb.current.onFail(n);
        if (cb.current.lives - 1 > 0) loadStage(n);
        else {
          g.mode = 'over';
          setHud((s) => ({ ...s, mode: 'over' }));
        }
      }

      // Rad (bei „geschafft“ zerspringt es)
      if (g.mode === 'clear') {
        const k = Math.min(1, (now - g.modeAt) / 600);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        drawWheel(ctx, cx, cy - k * 30, r * (1 + k * 0.3), angle, g.knives, { boss: g.stage.boss, flash: 0.6 * (1 - k), knifeLen: len });
        ctx.restore();
      } else drawWheel(ctx, cx, cy, r, angle, g.knives, { boss: g.stage.boss, knifeLen: len });

      // abprallendes Messer
      if (g.mode === 'fail' && g.bounce) {
        const k = (now - g.modeAt) / 1000;
        drawKnife(ctx, cx + k * 160, impactY + k * k * 900, -Math.PI / 2 + k * 9, len, color, Math.max(0, 1 - k));
      }
      // fliegendes oder bereitliegendes Messer
      if (g.mode === 'play') {
        if (g.flying !== null) {
          const k = Math.min(1, (now - g.flying) / TIMING.flightMs);
          drawKnife(ctx, cx, startY + (impactY - startY) * k, -Math.PI / 2, len, color);
        } else if (g.left > 0 && cb.current.active) drawKnife(ctx, cx, startY, -Math.PI / 2, len, color);
      }
      // übrige Messer links unten
      for (let i = 0; i < g.left - (g.flying !== null ? 1 : 0) - 1 && g.mode === 'play'; i++) {
        drawKnife(ctx, 20 + i * 13, h - 76, -Math.PI / 2, 44, 'rgba(255,247,230,0.8)');
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  const throwKnife = () => {
    const g = game.current;
    if (!cb.current.active || g.mode !== 'play' || g.flying !== null || g.left <= 0) return;
    g.flying = performance.now();
    klingenSounds.throw();
    haptics.play('tick');
  };

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        throwKnife();
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <div className="pointer-events-none absolute inset-x-0 top-[58%] flex flex-col items-center gap-1 text-center text-white">
        <div className="text-4xl font-black drop-shadow">{hud.mode === 'clear' ? 'Geschafft!' : hud.mode === 'fail' ? 'Klirr!' : hud.mode === 'over' ? 'Vorbei!' : `Stufe ${hud.stage}`}</div>
        {hud.mode === 'play' && game.current.stage.boss && <div className="rounded-full bg-[#f2b84b] px-3 py-0.5 text-sm font-black text-[#5e2f12]">Käse-Boss!</div>}
        <div className="flex gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <span key={i} className={`text-xl ${i < lives ? '' : 'opacity-25 grayscale'}`}>
              ❤️
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
