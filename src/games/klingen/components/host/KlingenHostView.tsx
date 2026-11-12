import { motion } from 'framer-motion';
import { Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendGameAction, useCountdown, useGameEvent } from '../../../../app/session/hooks';
import { useSession } from '../../../../app/session/session-store';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { HostViewProps } from '../../../game-types';
import { TIMING } from '../../game-config';
import { angleAt, collides, localImpact, makeStage, sharedSpin } from '../../logic/wheel';
import type { KlingenPublicState, ThrowEvent } from '../../types';
import { drawKnife, drawWheel, fitCanvas, type StuckKnife } from '../draw';
import { klingenSounds } from '../sounds';

function Avatar({ room, id, size = 'md' }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const p = room.players.find((x) => x.id === id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#e8590c'} avatar={p?.avatar} size={size} dimmed={p ? !p.isConnected : true} />;
}
const nameOf = (room: RoomSnapshot, id: string | null) => room.players.find((p) => p.id === id)?.name ?? '?';

export function KlingenHostView({ room, state }: HostViewProps<KlingenPublicState>) {
  const pub = state.public;
  const secs = Math.ceil(useCountdown(pub.phaseEndsAt, 250) / 1000);
  const [muted, setMuted] = useState(klingenSounds.isMuted());
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#4a2a18_0%,#2a160c_60%,#160b05_100%)] text-white">
      <header className="relative z-10 flex items-center gap-4 px-[3vw] pt-4">
        <span className="text-5xl font-black tracking-tight">Klingenrad</span>
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-lg font-black">{pub.mode === 'solo' ? 'Einzeln – wer schafft die meisten Stufen?' : `Gemeinsames Rad · Runde ${pub.round}`}</span>
        {pub.mode === 'solo' && pub.phase === 'play' && (
          <span className={`rounded-full px-4 py-1.5 text-2xl font-black tabular-nums ${secs <= 20 ? 'bg-[#e03131]' : 'bg-[#e8590c]'}`}>
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </span>
        )}
        <button
          onClick={() => {
            klingenSounds.setMuted(!muted);
            setMuted(!muted);
          }}
          className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label={muted ? 'Ton an' : 'Ton aus'}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </header>
      {pub.mode === 'solo' ? <SoloBoard room={room} pub={pub} secs={secs} /> : <SharedWheel room={room} pub={pub} secs={secs} />}
      <footer className="relative z-10 flex items-center justify-between gap-4 bg-black/30 px-[3vw] py-2.5 text-sm font-bold text-white/80">
        <span>{pub.mode === 'solo' ? 'Jede Person spielt auf dem eigenen Handy – tippen zum Werfen. Alle 5 Stufen ein Käse-Boss.' : 'Auf dem Handy „Werfen“ tippen. Wer ein Messer trifft, ist raus. Jede Runde ein Messer mehr pro Person.'}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Smartphone className="size-4" /> Code <span className="tracking-[0.2em] text-[#f2c14e]">{room.code}</span>
        </span>
      </footer>
    </div>
  );
}

// ------------------------------------------------------------------ Einzeln: Rangliste

function SoloBoard({ room, pub, secs }: { room: RoomSnapshot; pub: KlingenPublicState; secs: number }) {
  const rows = Object.entries(pub.solo)
    .filter(([id]) => room.players.some((p) => p.id === id))
    .sort((a, b) => b[1].cleared - a[1].cleared || b[1].stuck - a[1].stuck);
  if (pub.phase === 'countdown')
    return (
      <main className="relative z-10 grid flex-1 place-items-center">
        <div className="text-center">
          <motion.div key={secs} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-[12rem] font-black leading-none">
            {Math.max(1, secs)}
          </motion.div>
          <div className="text-3xl font-black text-white/80">Alle bekommen dieselben Stufen – los geht’s auf dem Handy!</div>
        </div>
      </main>
    );
  return (
    <main className="relative z-10 flex min-h-0 flex-1 items-center gap-[3vw] px-[4vw] py-4">
      <DecoWheel seed={pub.seed} stage={Math.max(1, ...rows.map(([, r]) => r.stage))} />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {rows.map(([id, r], i) => {
          const st = makeStage(pub.seed, r.stage);
          return (
            <motion.div key={id} layout className={`flex items-center gap-4 rounded-2xl px-4 py-2.5 ${r.done ? 'bg-white/5 opacity-60' : 'bg-white/10'}`}>
              <span className="w-8 text-2xl font-black text-white/60">{i + 1}.</span>
              <Avatar room={room} id={id} size="md" />
              <span className="w-40 truncate text-2xl font-black">{nameOf(room, id)}</span>
              <span className="w-32 text-2xl font-black text-[#f2c14e]">{r.cleared} {r.cleared === 1 ? 'Stufe' : 'Stufen'}</span>
              <div className="flex flex-1 items-center gap-1">
                {r.done ? (
                  <span className="text-lg font-black text-white/70">fertig</span>
                ) : (
                  <>
                    <span className="mr-2 text-sm font-black text-white/60">Stufe {r.stage}{st.boss ? ' 🧀' : ''}</span>
                    {Array.from({ length: st.knives }).map((_, k) => (
                      <span key={k} className={`h-5 w-2 rounded-full ${k < r.stuck ? 'bg-[#f2c14e]' : 'bg-white/15'}`} />
                    ))}
                  </>
                )}
              </div>
              <span className="text-xl">
                {Array.from({ length: pub.maxLives }).map((_, k) => (
                  <span key={k} className={k < r.lives ? '' : 'opacity-20 grayscale'}>
                    ❤️
                  </span>
                ))}
              </span>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}

/** drehendes Schmuck-Rad mit der Stufe der führenden Person */
function DecoWheel({ seed, stage }: { seed: number; stage: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const st = makeStage(seed, stage);
    const t0 = performance.now();
    const knives: StuckKnife[] = st.obstacles.map((a) => ({ a, color: '#5b6170', fixed: true }));
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const c = ref.current;
      if (!c) return;
      const { w, h, dpr } = fitCanvas(c);
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const r = Math.min(w, h) * 0.3;
      drawWheel(ctx, w / 2, h / 2, r, angleAt(st.spin, (performance.now() - t0) / 1000), knives, { boss: st.boss });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seed, stage]);
  return <canvas ref={ref} className="aspect-square h-full max-h-[60vh] shrink-0" />;
}

// ------------------------------------------------------------------ Gemeinsames Rad

interface Flying {
  id: number;
  playerId: string;
  color: string;
  at: number;
}

function SharedWheel({ room, pub, secs }: { room: RoomSnapshot; pub: KlingenPublicState; secs: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const offset = useSession((s) => s.clockOffset);
  const sim = useRef({ round: 0, knives: [] as (StuckKnife & { pid: string })[], flying: [] as Flying[], bouncing: [] as (Flying & { a: number; t: number })[], flash: 0 });
  const live = useRef({ pub, room, offset });
  live.current = { pub, room, offset };
  const [lastHit, setLastHit] = useState<{ id: number; playerId: string; ok: boolean } | null>(null);

  // neues Rad je Runde
  if (sim.current.round !== pub.round) {
    sim.current.round = pub.round;
    sim.current.knives = [];
    sim.current.flying = [];
    sim.current.bouncing = [];
  }

  useGameEvent<ThrowEvent>('throw', (e) => {
    const color = live.current.room.players.find((p) => p.id === e.playerId)?.avatarColor ?? '#e8590c';
    sim.current.flying.push({ id: e.id, playerId: e.playerId, color, at: performance.now() });
    klingenSounds.throw();
  });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const c = ref.current;
      if (!c) return;
      const { w, h, dpr } = fitCanvas(c);
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { pub: p } = live.current;
      const s = sim.current;
      const spin = sharedSpin(p.seed, p.round);
      const t = p.spinStartedAt ? (Date.now() + live.current.offset - p.spinStartedAt) / 1000 : 0;
      const angle = angleAt(spin, Math.max(0, t));
      const r = Math.min(w * 0.2, h * 0.27);
      const cx = w / 2;
      const cy = h * 0.47;
      const len = r * 0.8;
      const startY = h - len * 0.25;
      const impactY = cy + r * 0.72;
      const now = performance.now();

      // ankommende Messer auswerten
      s.flying = s.flying.filter((f) => {
        if (now - f.at < TIMING.flightMs) return true;
        const local = localImpact(angle);
        const ok = !collides(local, s.knives.map((k) => k.a));
        if (ok) {
          s.knives.push({ a: local, color: f.color, pid: f.playerId });
          klingenSounds.stick();
        } else {
          s.bouncing.push({ ...f, a: local, t: now });
          s.flash = now;
          klingenSounds.clang();
        }
        setLastHit({ id: f.id, playerId: f.playerId, ok });
        sendGameAction('result', { id: f.id, ok });
        return false;
      });

      drawWheel(ctx, cx, cy, r, angle, s.knives, { knifeLen: len, flash: Math.max(0, 0.5 - (now - s.flash) / 600) });
      for (const f of s.flying) {
        const k = Math.min(1, (now - f.at) / TIMING.flightMs);
        drawKnife(ctx, cx, startY + (impactY - startY) * k, -Math.PI / 2, len, f.color);
      }
      s.bouncing = s.bouncing.filter((b) => now - b.t < 1200);
      for (const b of s.bouncing) {
        const k = (now - b.t) / 1000;
        drawKnife(ctx, cx - k * 260, impactY + k * k * 900, -Math.PI / 2 - k * 10, len, b.color, Math.max(0, 1 - k));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rows = Object.entries(pub.shared).filter(([id]) => room.players.some((p) => p.id === id));
  return (
    <main className="relative z-10 flex min-h-0 flex-1">
      <canvas ref={ref} className="absolute inset-0 size-full" />
      {/* Spieler links */}
      <div className="relative z-10 flex w-[24vw] flex-col gap-2 px-[2vw] py-4">
        {rows.map(([id, r]) => (
          <div key={id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${r.alive ? 'bg-white/10' : 'bg-white/5 opacity-50'}`}>
            <Avatar room={room} id={id} size="sm" />
            <span className="min-w-0 flex-1 truncate text-xl font-black">{nameOf(room, id)}</span>
            {r.alive ? (
              <span className="flex gap-0.5">
                {Array.from({ length: Math.min(pub.round, 10) }).map((_, k) => (
                  <span key={k} className="h-5 w-1.5 rounded-full" style={{ background: k < r.left ? (room.players.find((p) => p.id === id)?.avatarColor ?? '#fff') : 'rgba(255,255,255,0.15)' }} />
                ))}
              </span>
            ) : (
              <span className="text-sm font-black uppercase text-white/70">raus</span>
            )}
          </div>
        ))}
      </div>
      {/* Meldungen */}
      <div className="pointer-events-none absolute right-[2vw] top-4 z-10 flex w-[24vw] flex-col items-stretch gap-3">
        {pub.phase === 'countdown' && (
          <motion.div key={`r${pub.round}`} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-[#e8590c] px-8 py-3 text-center shadow-2xl">
            <div className="text-4xl font-black">Runde {pub.round}</div>
            <div className="text-xl font-bold">
              Jede Person hat {pub.round} {pub.round === 1 ? 'Messer' : 'Messer'} · los in {Math.max(1, secs)}
            </div>
          </motion.div>
        )}
        {pub.phase === 'roundEnd' && <div className="rounded-3xl bg-black/60 px-8 py-3 text-3xl font-black">Runde {pub.round} überstanden!</div>}
        {lastHit && !lastHit.ok && pub.phase !== 'countdown' && (
          <motion.div key={lastHit.id} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl bg-[#e03131] px-6 py-2 text-center text-2xl font-black shadow-xl">
            Klirr! {nameOf(room, lastHit.playerId)} ist raus
          </motion.div>
        )}
      </div>
    </main>
  );
}
