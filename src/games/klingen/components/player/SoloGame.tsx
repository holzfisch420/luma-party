import { useEffect, useRef, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { TIMING } from '../../game-config';
import { BOSSES } from '../../logic/bosses';
import { WheelSim, type Outcome } from '../../logic/sim';
import { makeStage } from '../../logic/wheel';
import { BOSS_ART } from '../bosses-draw';
import { drawKnife, drawWheel, fitCanvas, KNIFE_LEN } from '../draw';
import { klingenSounds } from '../sounds';
import type { LiveFrame } from '../../types';

type Mode = 'intro' | 'play' | 'clear' | 'over';

interface Props {
  seed: number;
  /** Stufe laut Server (Start bzw. nach Neuverbindung) */
  startStage: number;
  lives: number;
  maxLives: number;
  active: boolean;
  /** gewähltes Messer */
  skin: number;
  /** auf Platz 1: Spiel live an den Fernseher schicken */
  live: boolean;
  onLive: (frame: Omit<LiveFrame, 'playerId'>) => void;
  onProgress: (stage: number, stuck: number) => void;
  onClear: (stage: number, stars: number) => void;
  onFail: (stage: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
  kind: 'chip' | 'spark' | 'shard';
}

interface Hud {
  stage: number;
  left: number;
  mode: Mode;
  lives: number;
  stars: number;
  bomb: number | null;
  msg: string | null;
}

const WOOD = ['#c98a4b', '#8a4b24', '#f3e3c3', '#b3161f'];

/**
 * Einzelspiel auf dem Handy: komplett lokal berechnet (keine Verzögerung).
 * Tippen irgendwo = Messer werfen. Ein Treffer kostet ein Leben – die Stufe läuft aber weiter.
 */
export function SoloGame({ seed, startStage, lives, maxLives, active, skin, live, onLive, onProgress, onClear, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<Hud>({ stage: startStage, left: 0, mode: 'play', lives, stars: 0, bomb: null, msg: null });
  const game = useRef({
    sim: new WheelSim(makeStage(seed, startStage)),
    left: 0,
    lives,
    starsInStage: 0,
    flying: null as null | { at: number; mid: WheelSim | null },
    mode: 'play' as Mode,
    modeAt: 0,
    stunUntil: 0,
    attemptStart: 0,
    bounce: null as null | { at: number; kind: Outcome },
    shakeUntil: 0,
    bump: 0,
    particles: [] as Particle[],
    last: performance.now(),
    lastBomb: -1,
    lastLive: 0,
  });
  const cb = useRef({ onProgress, onClear, onFail, onLive, active, live });
  cb.current = { onProgress, onClear, onFail, onLive, active, live };

  /** Momentaufnahme an den Fernseher (nur auf Platz 1) */
  const sendLive = (ev?: LiveFrame['ev'], hit?: string) => {
    if (!cb.current.live) return;
    const g = game.current;
    g.lastLive = performance.now();
    const r3 = (v: number) => Math.round(v * 1000) / 1000;
    cb.current.onLive({
      stage: g.sim.stage.n,
      t: r3(g.sim.t),
      angle: r3(g.sim.angle),
      knives: g.sim.knives.filter((k) => !k.fixed).map((k) => r3(k.base)),
      stars: g.sim.stars.map(r3),
      left: g.left,
      lives: g.lives,
      mode: g.mode,
      ev,
      hit,
    });
  };

  const patchHud = (p: Partial<Hud>) => setHud((s) => ({ ...s, ...p }));

  const loadStage = (n: number) => {
    const g = game.current;
    g.sim = new WheelSim(makeStage(seed, n));
    g.left = g.sim.stage.knives;
    g.starsInStage = 0;
    g.flying = null;
    g.bounce = null;
    g.attemptStart = 0;
    g.lastBomb = -1;
    const boss = g.sim.stage.boss;
    g.mode = boss ? 'intro' : 'play';
    g.modeAt = performance.now();
    if (boss) klingenSounds.bossIntro();
    patchHud({ stage: n, left: g.left, mode: g.mode, bomb: null, msg: null });
  };

  useEffect(() => {
    game.current.lives = lives;
    loadStage(startStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const burst = (x: number, y: number, n: number, colors: string[], kind: Particle['kind'], speed = 260) => {
    const g = game.current;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random());
      g.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - (kind === 'shard' ? 120 : 60),
        life: 0,
        max: kind === 'shard' ? 1.1 : 0.6 + Math.random() * 0.3,
        size: kind === 'shard' ? 8 + Math.random() * 14 : kind === 'spark' ? 2 + Math.random() * 3 : 3 + Math.random() * 4,
        color: colors[i % colors.length]!,
        spin: (Math.random() - 0.5) * 12,
        kind,
      });
    }
    if (g.particles.length > 260) g.particles.splice(0, g.particles.length - 260);
  };

  const loseLife = (kind: Outcome | 'bomb', now: number) => {
    const g = game.current;
    g.lives--;
    g.shakeUntil = now + 380;
    g.stunUntil = now + 650;
    g.attemptStart = g.sim.t;
    haptics.play('error');
    cb.current.onFail(g.sim.stage.n);
    sendLive('hit', kind);
    const msg = kind === 'bomb' ? 'BUMM! Zu langsam!' : kind === 'shield' ? 'Am Schild abgeprallt!' : kind === 'moon' ? 'Mond im Weg!' : kind === 'tentacle' ? 'Vom Fangarm erwischt!' : 'Klirr!';
    if (g.lives <= 0) {
      g.mode = 'over';
      patchHud({ lives: 0, mode: 'over', msg });
    } else patchHud({ lives: g.lives, msg });
    setTimeout(() => patchHud({ msg: null }), 1100);
  };

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
      const dt = Math.min(0.05, (now - g.last) / 1000);
      g.last = now;
      const sim = g.sim;
      const def = sim.def;
      const r0 = Math.min(w * 0.3, h * 0.22);
      const r = r0 * sim.radiusScale();
      const cx = w / 2;
      const cy = h * 0.32;
      const len = r0 * KNIFE_LEN;
      const startY = h - len - 34;
      const impactY = cy + r * 0.72;

      // Rad läuft weiter (außer nach dem Sieg)
      if (g.mode === 'play' || g.mode === 'intro') sim.step(dt);

      if (g.mode === 'intro' && now - g.modeAt > 2000) {
        g.mode = 'play';
        g.attemptStart = sim.t;
        patchHud({ mode: 'play' });
      }

      // Bombe: Zeitlimit pro Versuch
      if (g.mode === 'play' && def?.timeLimit) {
        const leftSec = Math.max(0, def.timeLimit - (sim.t - g.attemptStart));
        const shown = Math.ceil(leftSec);
        if (shown !== g.lastBomb) {
          g.lastBomb = shown;
          patchHud({ bomb: shown });
          if (shown <= 3 && shown > 0) klingenSounds.beep(false);
        }
        if (leftSec <= 0) {
          klingenSounds.bomb();
          burst(cx, cy, 40, ['#ffb02e', '#ff6b1a', '#2b2b2b'], 'spark', 420);
          loseLife('bomb', now);
        }
      }

      // Messer unterwegs: Zustand auf halber Strecke merken, bei Ankunft auswerten
      if (g.mode === 'play' && g.flying) {
        const k = (now - g.flying.at) / TIMING.flightMs;
        if (k >= 0.5 && !g.flying.mid) g.flying.mid = sim.clone();
        if (k >= 1) {
          const outcome = sim.outcome(g.flying.mid ?? undefined);
          g.flying = null;
          if (outcome === 'stick') {
            const star = sim.stick(skin);
            g.left--;
            g.bump = 1;
            klingenSounds.stick();
            haptics.play('light');
            burst(cx, impactY, 7, def ? BOSS_ART[def.id].chips : WOOD, 'chip', 200);
            if (star) {
              g.starsInStage++;
              klingenSounds.star();
              burst(cx, impactY, 16, ['#ffd23f', '#fff3b0', '#ffffff'], 'spark', 320);
              setHud((s) => ({ ...s, stars: s.stars + 1 }));
            }
            setHud((s) => ({ ...s, left: g.left }));
            cb.current.onProgress(sim.stage.n, sim.stage.knives - g.left);
            sendLive(g.left === 0 ? 'clear' : star ? 'star' : 'stick');
            if (g.left === 0) {
              g.mode = 'clear';
              g.modeAt = now;
              haptics.play('success');
              if (def) {
                klingenSounds.bossDown();
                burst(cx, cy, 34, BOSS_ART[def.id].chips, 'shard', 380);
                burst(cx, cy, 30, ['#ffd23f', '#ffffff'], 'spark', 520);
              } else {
                klingenSounds.clear();
                burst(cx, cy, 18, WOOD, 'shard', 300);
              }
              patchHud({ mode: 'clear' });
            }
          } else {
            g.bounce = { at: now, kind: outcome };
            if (outcome === 'knife') klingenSounds.clang();
            else klingenSounds.blocked(outcome);
            burst(cx, outcome === 'knife' || outcome === 'shield' ? impactY : impactY + r * 0.4, 12, ['#ffffff', '#ffd23f', '#c3ccd8'], 'spark', 300);
            loseLife(outcome, now);
          }
        }
      }

      // live an den Fernseher
      if (cb.current.live && now - g.lastLive > TIMING.liveEveryMs) sendLive();

      // Übergänge
      if (g.mode === 'clear' && now - g.modeAt > (def ? 1500 : 850)) {
        const n = sim.stage.n;
        cb.current.onClear(n, g.starsInStage);
        loadStage(n + 1);
        return;
      }

      // Wackeln nach einem Fehlwurf
      ctx.save();
      if (now < g.shakeUntil) {
        const k = (g.shakeUntil - now) / 380;
        ctx.translate((Math.random() - 0.5) * 16 * k, (Math.random() - 0.5) * 16 * k);
      }
      g.bump = Math.max(0, g.bump - dt * 7);

      // Rad (beim Sieg zerspringt es)
      if (g.mode === 'clear') {
        const k = Math.min(1, (now - g.modeAt) / 350);
        if (k < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - k;
          drawWheel(ctx, cx, cy, r * (1 + k * 0.25), sim.angle, sim.knives, { bossId: def?.id, sim, flash: 0.8 * (1 - k), knifeLen: len });
          ctx.restore();
        }
      } else {
        drawWheel(ctx, cx, cy - g.bump * 6, r, sim.angle, sim.knives, { bossId: def?.id, sim, stars: sim.stars, knifeLen: len, alpha: sim.alpha() });
      }

      // abprallendes Messer
      if (g.bounce) {
        const k = (now - g.bounce.at) / 1000;
        if (k > 1) g.bounce = null;
        else drawKnife(ctx, cx + k * 170, impactY + 40 + k * k * 900, -Math.PI / 2 + k * 10, len, skin, Math.max(0, 1 - k));
      }
      // fliegendes oder bereitliegendes Messer
      if (g.mode === 'play') {
        if (g.flying) {
          const k = Math.min(1, (now - g.flying.at) / TIMING.flightMs);
          drawKnife(ctx, cx, startY + (impactY - startY) * k, -Math.PI / 2, len, skin);
        } else if (g.left > 0 && cb.current.active) {
          const ready = now >= g.stunUntil;
          drawKnife(ctx, cx, startY + (ready ? 0 : 20), -Math.PI / 2, len, skin, ready ? 1 : 0.35);
        }
      }
      // übrige Messer unten links
      if (g.mode === 'play' || g.mode === 'intro') {
        const rest = g.left - (g.flying ? 1 : 0) - 1;
        for (let i = 0; i < rest; i++) drawKnife(ctx, 20 + i * 13, h - 76, -Math.PI / 2, 44, skin, 0.85);
      }

      // Partikel
      for (const p of g.particles) {
        p.life += dt;
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = Math.max(0, 1 - p.life / p.max);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * p.spin);
        ctx.fillStyle = p.color;
        if (p.kind === 'shard') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.8, p.size * 0.6);
          ctx.lineTo(-p.size * 0.7, p.size * 0.4);
          ctx.closePath();
          ctx.fill();
        } else if (p.kind === 'spark') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      g.particles = g.particles.filter((p) => p.life < p.max);
      ctx.restore();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin]);

  const throwKnife = () => {
    const g = game.current;
    const now = performance.now();
    if (!cb.current.active || g.mode !== 'play' || g.flying || g.left <= 0 || now < g.stunUntil) return;
    g.flying = { at: now, mid: null };
    sendLive('throw');
    klingenSounds.throw();
    haptics.play('tick');
  };

  const boss = game.current.sim.def;
  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        throwKnife();
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />

      {/* Boss-Vorstellung */}
      {hud.mode === 'intro' && boss && (
        <div className="pointer-events-none absolute inset-x-4 top-[56%] flex flex-col items-center gap-1 rounded-3xl border-4 border-[#e8b84a] bg-[#2b0609]/90 px-4 py-4 text-center text-[#fff7e6] shadow-2xl [animation:klingen-pop_0.5s_ease-out]">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#e8b84a]">Boss {hud.stage / 3}</div>
          <div className="text-5xl">{boss.emoji}</div>
          <div className="font-stage text-3xl font-black">{boss.name}</div>
          <div className="text-base font-bold text-[#ffe9a8]">{boss.hint}</div>
        </div>
      )}

      <div className={`pointer-events-none absolute inset-x-0 top-[57%] flex flex-col items-center gap-1 text-center text-white ${hud.mode === 'intro' ? 'invisible' : ''}`}>
        {hud.mode !== 'intro' && (
          <div className="text-4xl font-black drop-shadow">
            {hud.mode === 'clear' ? (boss ? 'BOSS BESIEGT!' : 'Geschafft!') : hud.mode === 'over' ? 'Vorbei!' : boss ? `${boss.emoji} ${boss.name}` : `Stufe ${hud.stage}`}
          </div>
        )}
        {hud.msg && <div className="rounded-full bg-[#b3161f] px-4 py-1 text-lg font-black [animation:klingen-pop_0.3s_ease-out]">{hud.msg}</div>}
        {hud.bomb !== null && hud.mode === 'play' && (
          <div className={`rounded-full px-4 py-1 text-2xl font-black tabular-nums ${hud.bomb <= 3 ? 'bg-[#ff3b1a] [animation:klingen-pop_0.4s_ease-out_infinite]' : 'bg-black/50'}`}>💣 {hud.bomb}</div>
        )}
        <div className="flex items-center gap-3">
          <span className="flex gap-1">
            {Array.from({ length: maxLives }).map((_, i) => (
              <span key={i} className={`text-xl ${i < hud.lives ? '' : 'opacity-25 grayscale'}`}>
                ❤️
              </span>
            ))}
          </span>
          {hud.stars > 0 && <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-base font-black text-[#ffd23f]">★ {hud.stars}</span>}
        </div>
      </div>
    </div>
  );
}

/** Name und Symbol eines Bosses (für Anzeigen) */
export function bossLabel(id: keyof typeof BOSSES) {
  return `${BOSSES[id].emoji} ${BOSSES[id].name}`;
}
