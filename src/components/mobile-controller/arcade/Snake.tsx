import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { haptics } from '../../../app/haptics';
import { getBest, submitScore } from './scores';

/** „Schlange“: wischen oder Pfeiltasten, Früchte fressen, nicht beißen. */
const N = 15;
const CELL = 20;
const SIZE = N * CELL;
type Dir = [number, number];
const DIRS: Record<'up' | 'down' | 'left' | 'right', Dir> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function Snake() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [best, setBest] = useState(() => getBest('snake'));
  const api = useRef<{ turn: (d: Dir) => void; tap: () => void }>({ turn: () => {}, tap: () => {} });
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const cv = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = SIZE * dpr;
    cv.height = SIZE * dpr;
    const g = cv.getContext('2d')!;
    g.scale(dpr, dpr);

    let mode: 'ready' | 'play' | 'dead' = 'ready';
    let body: [number, number][] = [];
    let dir: Dir = DIRS.right;
    let queue: Dir[] = [];
    let food: [number, number] = [0, 0];
    let acc = 0;
    let t = 0;
    let deadAt = 0;
    let eatFx = 0;
    let bestLocal = getBest('snake');

    const placeFood = () => {
      for (;;) {
        const f: [number, number] = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)];
        if (!body.some(([x, y]) => x === f[0] && y === f[1])) return void (food = f);
      }
    };
    const reset = () => {
      body = [[6, 7], [5, 7], [4, 7]];
      dir = DIRS.right;
      queue = [];
      placeFood();
      acc = 0;
    };
    reset();
    const score = () => body.length - 3;
    const interval = () => Math.max(0.065, 0.15 - score() * 0.003);

    api.current.turn = (d) => {
      if (mode === 'dead') return;
      if (mode === 'ready') mode = 'play';
      const lastDir = queue[queue.length - 1] ?? dir;
      if (d[0] === -lastDir[0] && d[1] === -lastDir[1]) return;
      if (d[0] === lastDir[0] && d[1] === lastDir[1]) return;
      if (queue.length < 3) queue.push(d);
      haptics.play('tick');
    };
    api.current.tap = () => {
      if (mode === 'dead' && t - deadAt > 0.6) {
        reset();
        mode = 'ready';
      } else if (mode === 'ready') mode = 'play';
    };

    const tick = () => {
      dir = queue.shift() ?? dir;
      const [hx, hy] = body[0]!;
      const nx = (hx + dir[0] + N) % N;
      const ny = (hy + dir[1] + N) % N;
      const grows = nx === food[0] && ny === food[1];
      const rest = grows ? body : body.slice(0, -1);
      if (rest.some(([x, y]) => x === nx && y === ny)) {
        mode = 'dead';
        deadAt = t;
        playSfx('fail', { vol: 0.6 });
        haptics.play('error');
        if (submitScore('snake', score())) {
          bestLocal = score();
          setBest(score());
        }
        return;
      }
      body = [[nx, ny], ...rest];
      if (grows) {
        placeFood();
        eatFx = 1;
        playSfx('pop', { vol: 0.5, rate: 1 + Math.min(0.6, score() * 0.02) });
        haptics.play('light');
      }
    };

    const draw = () => {
      g.fillStyle = '#0f2a1d';
      g.fillRect(0, 0, SIZE, SIZE);
      for (let x = 0; x < N; x++)
        for (let y = 0; y < N; y++) {
          if ((x + y) % 2) continue;
          g.fillStyle = '#123323';
          g.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      // Frucht
      const pulse = 1 + Math.sin(t * 6) * 0.08;
      g.fillStyle = '#ff4d6d';
      g.beginPath();
      g.arc(food[0] * CELL + CELL / 2, food[1] * CELL + CELL / 2 + 1, 7 * pulse, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#7bd389';
      g.fillRect(food[0] * CELL + CELL / 2, food[1] * CELL + 3, 3, 5);
      // Schlange
      body.forEach(([x, y], i) => {
        const k = i / Math.max(1, body.length - 1);
        g.fillStyle = `hsl(${140 - k * 40} 70% ${58 - k * 18}%)`;
        const pad = i === 0 ? 1 : 2 + k * 1.5;
        g.beginPath();
        g.roundRect(x * CELL + pad, y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 6);
        g.fill();
      });
      const [hx, hy] = body[0]!;
      const cx = hx * CELL + CELL / 2;
      const cy = hy * CELL + CELL / 2;
      g.fillStyle = '#fff';
      for (const s of [-1, 1]) {
        const ex = cx + dir[0] * 3 + dir[1] * s * 4;
        const ey = cy + dir[1] * 3 + dir[0] * s * 4;
        g.beginPath();
        g.arc(ex, ey, 3, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#111';
        g.beginPath();
        g.arc(ex + dir[0], ey + dir[1], 1.5, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#fff';
      }
      if (eatFx > 0) {
        g.strokeStyle = `rgba(255,255,255,${eatFx})`;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(cx, cy, 12 + (1 - eatFx) * 14, 0, Math.PI * 2);
        g.stroke();
      }
      g.textAlign = 'center';
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.font = '900 16px Nunito, system-ui, sans-serif';
      g.fillText(String(score()), SIZE - 18, 20);
      if (mode !== 'play') {
        g.fillStyle = 'rgba(5,20,12,.6)';
        g.fillRect(0, 0, SIZE, SIZE);
        g.fillStyle = '#fff';
        g.font = '900 26px Nunito, system-ui, sans-serif';
        g.fillText(mode === 'dead' ? 'Gebissen!' : 'Schlange', SIZE / 2, SIZE * 0.42);
        g.font = '800 15px Nunito, system-ui, sans-serif';
        g.fillText(mode === 'dead' ? `Länge ${score()} · Rekord ${bestLocal}` : 'Wischen oder Pfeile tippen', SIZE / 2, SIZE * 0.42 + 28);
        if (mode === 'dead' && t - deadAt > 0.6) g.fillText('Tippen für Neustart', SIZE / 2, SIZE * 0.42 + 54);
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      eatFx = Math.max(0, eatFx - dt * 3);
      if (mode === 'play') {
        acc += dt;
        while (acc >= interval() && mode === 'play') {
          acc -= interval();
          tick();
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const btn = (d: keyof typeof DIRS, icon: React.ReactNode, cls: string) => (
    <button
      aria-label={d}
      className={`grid size-14 place-items-center rounded-2xl bg-white/15 text-white active:bg-white/30 ${cls}`}
      onPointerDown={(e) => {
        e.preventDefault();
        api.current.turn(DIRS[d]);
      }}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={ref}
        style={{ width: 'min(100%, 320px, 48dvh)' }}
        className="aspect-square touch-none select-none rounded-2xl shadow-lg"
        onPointerDown={(e) => {
          touch.current = { x: e.clientX, y: e.clientY };
          api.current.tap();
        }}
        onPointerMove={(e) => {
          const s = touch.current;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.hypot(dx, dy) < 22) return;
          api.current.turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS.right : DIRS.left) : dy > 0 ? DIRS.down : DIRS.up);
          touch.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (touch.current = null)}
        onPointerCancel={() => (touch.current = null)}
      />
      <div className="grid grid-cols-3 gap-1.5">
        {btn('up', <ChevronUp className="size-7" />, 'col-start-2')}
        {btn('left', <ChevronLeft className="size-7" />, 'col-start-1 row-start-2')}
        {btn('down', <ChevronDown className="size-7" />, 'col-start-2 row-start-2')}
        {btn('right', <ChevronRight className="size-7" />, 'col-start-3 row-start-2')}
      </div>
      <div className="text-xs font-extrabold text-white/60">Rekord: {best}</div>
    </div>
  );
}
