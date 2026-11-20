import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { haptics } from '../../../app/haptics';
import { getBest, submitScore } from './scores';

/** „Flatterflug“: tippen zum Flattern, durch die Lücken fliegen. */
const W = 300;
const H = 420;
const GRAVITY = 1150;
const FLAP = -360;
const GAP = 118;
const PIPE_W = 52;
const SPEED = 128;
const SPACING = 172;
const GROUND = 44;

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

export function Flap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [best, setBest] = useState(() => getBest('flap'));
  const tapRef = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d')!;
    g.scale(dpr, dpr);

    let mode: 'ready' | 'play' | 'dead' = 'ready';
    let y = H * 0.42;
    let vy = 0;
    let pipes: Pipe[] = [];
    let score = 0;
    let t = 0;
    let deadAt = 0;
    let groundX = 0;
    let bestLocal = getBest('flap');

    const reset = () => {
      mode = 'ready';
      y = H * 0.42;
      vy = 0;
      score = 0;
      pipes = [];
    };
    const spawn = (x: number) => pipes.push({ x, gapY: 80 + Math.random() * (H - GROUND - 160 - GAP * 0.5) + GAP / 2, passed: false });

    tapRef.current = () => {
      if (mode === 'dead') {
        if (t - deadAt < 0.6) return;
        reset();
        return;
      }
      if (mode === 'ready') {
        mode = 'play';
        spawn(W + 40);
      }
      vy = FLAP;
      playSfx('swish', { vol: 0.35, vary: 0.12, rate: 1.4 });
      haptics.play('tick');
    };

    const die = () => {
      mode = 'dead';
      deadAt = t;
      playSfx('bonk', { vol: 0.7 });
      haptics.play('error');
      if (submitScore('flap', score)) {
        bestLocal = score;
        setBest(score);
      }
    };

    const update = (dt: number) => {
      t += dt;
      if (mode !== 'dead') groundX = (groundX - SPEED * dt) % 24;
      if (mode === 'ready') {
        y = H * 0.42 + Math.sin(t * 4) * 6;
        return;
      }
      vy += GRAVITY * dt;
      y += vy * dt;
      if (mode === 'dead') {
        y = Math.min(y, H - GROUND - 12);
        return;
      }
      for (const p of pipes) {
        p.x -= SPEED * dt;
        if (!p.passed && p.x + PIPE_W < 80) {
          p.passed = true;
          score++;
          playSfx('points', { vol: 0.4, rate: 1.2 });
        }
      }
      if (pipes.length && pipes[pipes.length - 1]!.x < W - SPACING) spawn(W + 10);
      pipes = pipes.filter((p) => p.x > -PIPE_W - 10);
      // Kollision (Vogel = Kreis r=12 bei x=80)
      if (y > H - GROUND - 12 || y < -40) return die();
      for (const p of pipes) {
        if (80 + 11 > p.x && 80 - 11 < p.x + PIPE_W && (y - 11 < p.gapY - GAP / 2 || y + 11 > p.gapY + GAP / 2)) return die();
      }
    };

    const draw = () => {
      // Himmel
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#2b1055');
      sky.addColorStop(0.6, '#d7517a');
      sky.addColorStop(1, '#ffb36b');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);
      // Sonne + Hügel
      g.fillStyle = '#ffe08a';
      g.beginPath();
      g.arc(W * 0.72, H * 0.6, 48, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#7b2d68';
      g.beginPath();
      g.moveTo(0, H - GROUND);
      for (let x = 0; x <= W; x += 10) g.lineTo(x, H - GROUND - 34 - Math.sin((x + t * 12) * 0.03) * 16);
      g.lineTo(W, H - GROUND);
      g.fill();
      // Röhren (Kristallsäulen)
      for (const p of pipes) {
        const top = p.gapY - GAP / 2;
        const bot = p.gapY + GAP / 2;
        const grad = g.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        grad.addColorStop(0, '#1fb3d4');
        grad.addColorStop(0.5, '#8ef0ff');
        grad.addColorStop(1, '#138fae');
        g.fillStyle = grad;
        g.fillRect(p.x, 0, PIPE_W, top);
        g.fillRect(p.x, bot, PIPE_W, H - GROUND - bot);
        g.fillStyle = '#0d5f75';
        g.fillRect(p.x - 4, top - 14, PIPE_W + 8, 14);
        g.fillRect(p.x - 4, bot, PIPE_W + 8, 14);
      }
      // Boden
      g.fillStyle = '#3a1c4a';
      g.fillRect(0, H - GROUND, W, GROUND);
      g.fillStyle = '#56306b';
      for (let x = groundX; x < W; x += 24) g.fillRect(x, H - GROUND, 12, 6);
      // Vogel
      g.save();
      g.translate(80, y);
      g.rotate(mode === 'ready' ? 0 : Math.max(-0.5, Math.min(1.3, vy / 520)));
      g.fillStyle = '#ffd23f';
      g.beginPath();
      g.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ff9f1c';
      const flap = Math.sin(t * 22) * (mode === 'play' && vy < 0 ? 6 : 2);
      g.beginPath();
      g.ellipse(-4, 2 + flap * 0.4, 8, 5 + flap * 0.3, -0.3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(6, -4, 5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#222';
      g.beginPath();
      g.arc(mode === 'dead' ? 6 : 7.5, -4, 2.2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ff5a5f';
      g.beginPath();
      g.moveTo(12, 0);
      g.lineTo(21, 3);
      g.lineTo(12, 6);
      g.fill();
      g.restore();
      // Texte
      g.textAlign = 'center';
      g.fillStyle = '#fff';
      g.strokeStyle = 'rgba(0,0,0,.45)';
      g.lineWidth = 5;
      g.font = '900 44px Nunito, system-ui, sans-serif';
      if (mode !== 'ready') {
        g.strokeText(String(score), W / 2, 64);
        g.fillText(String(score), W / 2, 64);
      }
      g.font = '900 20px Nunito, system-ui, sans-serif';
      if (mode === 'ready') {
        g.strokeText('Tippen zum Flattern', W / 2, H * 0.27);
        g.fillText('Tippen zum Flattern', W / 2, H * 0.27);
      }
      if (mode === 'dead') {
        g.fillStyle = 'rgba(20,6,40,.55)';
        g.fillRect(0, 0, W, H);
        g.fillStyle = '#fff';
        g.font = '900 30px Nunito, system-ui, sans-serif';
        g.fillText('Autsch!', W / 2, H * 0.36);
        g.font = '800 18px Nunito, system-ui, sans-serif';
        g.fillText(`Punkte ${score} · Rekord ${bestLocal}`, W / 2, H * 0.36 + 34);
        if (t - deadAt > 0.6) g.fillText('Tippen für Neustart', W / 2, H * 0.36 + 66);
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={ref}
        style={{ width: 'min(100%, 340px, calc(62dvh * 300 / 420))' }}
        className="aspect-[300/420] touch-none select-none rounded-2xl shadow-lg"
        onPointerDown={(e) => {
          e.preventDefault();
          tapRef.current();
        }}
      />
      <div className="text-xs font-extrabold text-white/60">Rekord: {best}</div>
    </div>
  );
}
