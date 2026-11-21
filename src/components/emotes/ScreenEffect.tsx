import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';

export const EFFECT_MS = 5500;

/** Vollbild-Effekt am Fernseher (blockiert keine Eingaben) */
export function ScreenEffect({ id }: { id: string }) {
  if (id === 'konfetti') return <Confetti />;
  if (id === 'feuerwerk') return <Fireworks />;
  if (id === 'laser') return <Lasers />;
  if (id === 'disco') return <Disco />;
  if (id === 'herzen') return <Rain chars={['💖', '💗', '❤️', '💕', '💘']} dir="down" />;
  return <Rain chars={['🫧']} dir="up" />;
}

function useCanvasLoop(draw: (g: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext('2d')!;
    g.scale(dpr, dpr);
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      g.clearRect(0, 0, w, h);
      draw(g, w, h, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 size-full" />;
}

const COLORS = ['#ff4d6d', '#ffd23f', '#4dabf7', '#51cf66', '#b197fc', '#ff922b', '#ffffff'];

function Confetti() {
  const parts = useMemo(
    () =>
      Array.from({ length: 220 }, (_, i) => ({
        x: Math.random(),
        side: i % 2,
        vx: (Math.random() * 0.5 + 0.25) * (i % 2 ? -1 : 1),
        vy: -(Math.random() * 0.9 + 0.7),
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 12,
        c: COLORS[i % COLORS.length]!,
        s: 6 + Math.random() * 8,
        d: Math.random() * 0.6,
      })),
    [],
  );
  return useCanvasLoop((g, w, h, t) => {
    for (const p of parts) {
      const tt = Math.max(0, t - p.d);
      if (tt <= 0) continue;
      // aus beiden unteren Ecken schießen, dann flattern sie herunter
      const x = (p.side ? w : 0) + p.vx * w * 0.55 * tt + Math.sin(tt * 3 + p.rot) * 20;
      const y = h + p.vy * h * 1.2 * tt + 0.5 * h * 0.55 * tt * tt;
      g.save();
      g.translate(x, y);
      g.rotate(p.rot + p.vr * tt);
      g.fillStyle = p.c;
      g.globalAlpha = Math.max(0, 1 - tt / 5);
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.restore();
    }
  });
}

function Fireworks() {
  const shells = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: 0.12 + Math.random() * 0.76,
        y: 0.15 + Math.random() * 0.35,
        t: i * 0.55,
        c: COLORS[i % COLORS.length]!,
        n: 46,
      })),
    [],
  );
  return useCanvasLoop((g, w, h, t) => {
    for (const s of shells) {
      const k = t - s.t;
      if (k < 0) continue;
      if (k < 0.6) {
        // aufsteigende Rakete
        const y = h - (h - s.y * h) * (k / 0.6);
        g.fillStyle = '#fff3bf';
        g.beginPath();
        g.arc(s.x * w, y, 3, 0, Math.PI * 2);
        g.fill();
        continue;
      }
      const e = k - 0.6;
      if (e > 2) continue;
      const r = Math.min(1, e / 0.7) * Math.min(w, h) * 0.18;
      g.globalAlpha = Math.max(0, 1 - e / 2);
      g.fillStyle = s.c;
      for (let i = 0; i < s.n; i++) {
        const a = (i / s.n) * Math.PI * 2;
        g.beginPath();
        g.arc(s.x * w + Math.cos(a) * r, s.y * h + Math.sin(a) * r + e * e * 40, 3.2, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
  });
}

function Lasers() {
  const beams = [
    { x: '6%', c: '#ff2e63', d: 0 },
    { x: '22%', c: '#2ee6ff', d: 0.25 },
    { x: '38%', c: '#5cff5c', d: 0.1 },
    { x: '62%', c: '#ffe14d', d: 0.35 },
    { x: '78%', c: '#c77dff', d: 0.05 },
    { x: '94%', c: '#ff2e63', d: 0.3 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute inset-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.45, 0.45, 0] }} transition={{ duration: EFFECT_MS / 1000, times: [0, 0.1, 0.85, 1] }} />
      {beams.map((b, i) => (
        <motion.div
          key={i}
          className="absolute bottom-[-6%] h-[150%] w-[22px] origin-bottom"
          style={{ left: b.x }}
          initial={{ rotate: i % 2 ? 40 : -40, opacity: 0 }}
          animate={{ rotate: i % 2 ? [40, -30, 40, -20] : [-40, 30, -40, 20], opacity: [0, 1, 1, 0] }}
          transition={{ duration: EFFECT_MS / 1000, delay: b.d, ease: 'easeInOut', times: [0, 0.35, 0.7, 1] }}
        >
          {/* farbiger Schein + heller Kern */}
          <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(to top, ${b.c}, ${b.c}cc 40%, transparent 92%)`, boxShadow: `0 0 40px 14px ${b.c}99`, filter: 'blur(2px)' }} />
          <div className="absolute inset-y-0 left-1/2 w-[4px] -translate-x-1/2 rounded-full" style={{ background: 'linear-gradient(to top, #fff, #ffffffcc 40%, transparent 90%)' }} />
        </motion.div>
      ))}
      {beams.map((b, i) => (
        <motion.div
          key={`g${i}`}
          className="absolute bottom-[-30px] size-[60px] -translate-x-1/2 rounded-full"
          style={{ left: `calc(${b.x} + 11px)`, background: `radial-gradient(circle, #fff, ${b.c} 40%, transparent 70%)` }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: EFFECT_MS / 1000, delay: b.d }}
        />
      ))}
    </div>
  );
}

function Disco() {
  const spots = useMemo(() => Array.from({ length: 26 }, () => ({ x: Math.random() * 100, y: Math.random() * 100, c: COLORS[Math.floor(Math.random() * 6)]!, s: 30 + Math.random() * 60 })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute inset-0 bg-[#0b0620]" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0.4, 0] }} transition={{ duration: EFFECT_MS / 1000, times: [0, 0.1, 0.85, 1] }} />
      <motion.div className="absolute left-1/2 top-0 -translate-x-1/2" initial={{ y: -200 }} animate={{ y: [-200, 0, 0, -200] }} transition={{ duration: EFFECT_MS / 1000, times: [0, 0.15, 0.85, 1] }}>
        <div className="mx-auto h-16 w-1 bg-white/50" />
        <motion.div
          className="size-32 rounded-full border-4 border-white/40 shadow-[0_0_60px_rgba(255,255,255,0.6)]"
          style={{ background: 'repeating-conic-gradient(#d0d7e2 0 10deg, #8a94a6 10deg 20deg), radial-gradient(circle, #fff, #9aa3b5)', backgroundBlendMode: 'multiply' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      <motion.div className="absolute inset-0" animate={{ rotate: 25 }} transition={{ duration: EFFECT_MS / 1000, ease: 'linear' }}>
        {spots.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full mix-blend-screen blur-[2px]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, background: s.c }}
            animate={{ opacity: [0, 0.8, 0.2, 0.8, 0], x: [0, 60, -40, 30] }}
            transition={{ duration: EFFECT_MS / 1000, delay: (i % 5) * 0.1 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function Rain({ chars, dir }: { chars: string[]; dir: 'down' | 'up' }) {
  const drops = useMemo(() => Array.from({ length: 46 }, (_, i) => ({ x: Math.random() * 100, d: Math.random() * 2.2, s: 28 + Math.random() * 40, c: chars[i % chars.length]!, sway: (Math.random() - 0.5) * 120 })), [chars]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((p, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{ left: `${p.x}%`, top: dir === 'down' ? '-10%' : '105%', fontSize: p.s }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: dir === 'down' ? '120vh' : '-125vh', x: p.sway, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3 + Math.random(), delay: p.d, ease: dir === 'down' ? 'easeIn' : 'easeOut' }}
        >
          {p.c}
        </motion.span>
      ))}
    </div>
  );
}
