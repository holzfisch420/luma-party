import { motion } from 'framer-motion';
import { Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendGameAction, useGameEvent, useSecondsLeft } from '../../../../app/session/hooks';
import { useSession } from '../../../../app/session/session-store';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { HostViewProps } from '../../../game-types';
import { TIMING } from '../../game-config';
import { angleAt, collides, localImpact, makeStage, sharedBoss, sharedSpin } from '../../logic/wheel';
import { BOSSES } from '../../logic/bosses';
import { WheelSim } from '../../logic/sim';
import type { KlingenPublicState, LiveFrame, ThrowEvent } from '../../types';
import { KNIFE_SKINS } from '../../logic/knives';
import { KnifePreview } from '../KnifePreview';
import { drawKnife, drawWheel, fitCanvas, KNIFE_LEN, type StuckKnife } from '../draw';
import { klingenSounds } from '../sounds';

function Avatar({ room, id, size = 'md' }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const p = room.players.find((x) => x.id === id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#e8590c'} avatar={p?.avatar} size={size} dimmed={p ? !p.isConnected : true} />;
}
const nameOf = (room: RoomSnapshot, id: string | null) => room.players.find((p) => p.id === id)?.name ?? '?';

export function KlingenHostView({ room, state }: HostViewProps<KlingenPublicState>) {
  const pub = state.public;
  const secs = useSecondsLeft(pub.phaseEndsAt);
  const [muted, setMuted] = useState(klingenSounds.isMuted());
  return (
    <div className="circus-bg relative flex h-dvh flex-col overflow-hidden">
      <header className="relative z-10 flex items-center gap-4 px-[3vw] pt-5">
        <span className="marquee font-stage text-5xl font-black tracking-tight text-[#ffe9a8] [text-shadow:0_0_14px_rgba(255,213,107,0.7)]">Klingenrad</span>
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
      {pub.phase === 'pick' ? <PickBoard room={room} pub={pub} secs={secs} /> : pub.mode === 'solo' ? <SoloBoard room={room} pub={pub} secs={secs} /> : <SharedWheel room={room} pub={pub} secs={secs} />}
      <footer className="relative z-10 flex items-center justify-between gap-4 bg-black/30 px-[3vw] py-2.5 text-sm font-bold text-white/80">
        <span>{pub.mode === 'solo' ? 'Jede Person spielt auf dem eigenen Handy – tippen zum Werfen. Jede 3. Stufe ein Boss (15 verschiedene), Sterne treffen gibt Bonuspunkte.' : 'Auf dem Handy „Werfen“ tippen. Wer ein Messer trifft, ist raus. Jede Runde ein Messer mehr pro Person.'}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Smartphone className="size-4" /> Code <span className="tracking-[0.2em] text-[#f2c14e]">{room.code}</span>
        </span>
      </footer>
    </div>
  );
}

// ------------------------------------------------------------------ Messer aussuchen

function PickBoard({ room, pub, secs }: { room: RoomSnapshot; pub: KlingenPublicState; secs: number }) {
  const ids = Object.keys(pub.knives).filter((id) => room.players.some((p) => p.id === id));
  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-[4vw]">
      <div className="flex items-center gap-6">
        <div className="font-stage text-6xl font-black text-[#ffe9a8] [text-shadow:0_3px_0_#4a0d12]">Wählt euer Messer!</div>
        <motion.span key={secs} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className={`grid size-24 place-items-center rounded-full text-5xl font-black tabular-nums shadow-xl ${secs <= 3 ? 'bg-[#e03131]' : 'bg-[#e8590c]'}`}>
          {Math.max(0, secs)}
        </motion.span>
      </div>
      <div className="text-2xl font-bold text-white/80">16 Messer zur Auswahl – auf dem Handy antippen.</div>
      <div className="flex flex-wrap justify-center gap-5">
        {ids.map((id) => {
          const skin = pub.knives[id] ?? 0;
          const done = pub.picked.includes(id);
          return (
            <motion.div key={id} layout className={`flex w-44 flex-col items-center gap-2 rounded-3xl border-4 px-3 pb-3 pt-4 ${done ? 'border-[#ffd23f] bg-[#2b0609]/90' : 'border-white/15 bg-[#2b0609]/60'}`}>
              <motion.div key={skin} initial={{ y: -30, opacity: 0, rotate: -20 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
                <KnifePreview skin={skin} height={130} />
              </motion.div>
              <div className="text-center text-base font-black text-[#ffd23f]">{KNIFE_SKINS[skin]?.name}</div>
              <div className="flex max-w-full items-center gap-2">
                <Avatar room={room} id={id} size="xs" />
                <span className="truncate text-lg font-black">{nameOf(room, id)}</span>
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${done ? 'text-[#7ee787]' : 'text-white/50'}`}>{done ? '✓ gewählt' : 'wählt …'}</span>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}

// ------------------------------------------------------------------ Einzeln: Rangliste

function SoloBoard({ room, pub, secs }: { room: RoomSnapshot; pub: KlingenPublicState; secs: number }) {
  const rows = Object.entries(pub.solo)
    .filter(([id]) => room.players.some((p) => p.id === id))
    .sort((a, b) => b[1].cleared - a[1].cleared || (b[1].stars ?? 0) - (a[1].stars ?? 0) || b[1].stuck - a[1].stuck);
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
      <LiveWheel room={room} pub={pub} />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {rows.map(([id, r], i) => {
          const st = makeStage(pub.seed, r.stage);
          return (
            <motion.div key={id} layout className={`flex items-center gap-4 rounded-2xl border-2 border-[#e8b84a]/40 px-4 py-2.5 shadow-lg ${r.done ? 'bg-[#2b0609]/70 opacity-60' : 'bg-[#2b0609]/88'}`}>
              <span className="w-8 text-2xl font-black text-white/60">{i + 1}.</span>
              <Avatar room={room} id={id} size="md" />
              <span className="w-40 truncate text-2xl font-black">{nameOf(room, id)}</span>
              <span className="w-32 text-2xl font-black text-[#f2c14e]">{r.cleared} {r.cleared === 1 ? 'Stufe' : 'Stufen'}</span>
              <div className="flex flex-1 items-center gap-1">
                {r.done ? (
                  <span className="text-lg font-black text-white/70">fertig</span>
                ) : (
                  <>
                    {st.boss ? (
                      <span className="mr-2 rounded-full bg-[#e8b84a] px-2.5 py-0.5 text-sm font-black text-[#2b0609]">
                        {BOSSES[st.boss].emoji} {BOSSES[st.boss].name}
                      </span>
                    ) : (
                      <span className="mr-2 text-sm font-black text-white/60">Stufe {r.stage}</span>
                    )}
                    {Array.from({ length: st.knives }).map((_, k) => (
                      <span key={k} className={`h-5 w-2 rounded-full ${k < r.stuck ? 'bg-[#f2c14e]' : 'bg-white/15'}`} />
                    ))}
                  </>
                )}
              </div>
              {(r.stars ?? 0) > 0 && <span className="text-lg font-black text-[#ffd23f]">★ {r.stars}</span>}
              {(r.bosses ?? 0) > 0 && <span className="text-lg font-black text-[#ffe9a8]">👑 {r.bosses}</span>}
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

/**
 * Live-Übertragung: das Spiel der führenden Person, wie es auf ihrem Handy läuft.
 * Das Handy schickt ~10 Bilder pro Sekunde (Stufe, Zeit, Winkel, Messer); dazwischen rechnet der
 * Fernseher mit derselben Simulation weiter, damit es flüssig aussieht.
 */
function LiveWheel({ room, pub }: { room: RoomSnapshot; pub: KlingenPublicState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spot = pub.spotlight;
  const live = useRef({
    pub,
    playerId: null as string | null,
    sim: null as WheelSim | null,
    skin: 0,
    frameAt: 0,
    mode: 'play' as LiveFrame['mode'],
    flying: 0,
    bounce: 0,
    flash: 0,
    bump: 0,
  });
  live.current.pub = pub;
  const [info, setInfo] = useState<{ playerId: string; stage: number; left: number; lives: number; mode: LiveFrame['mode'] } | null>(null);
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);

  useGameEvent<LiveFrame>('live', (f) => {
    const L = live.current;
    const p = L.pub;
    if (f.playerId !== p.spotlight) return;
    const now = performance.now();
    const fresh = !L.sim || L.playerId !== f.playerId || L.sim.stage.n !== f.stage;
    if (fresh) {
      L.sim = new WheelSim(makeStage(p.seed, f.stage));
      L.playerId = f.playerId;
      L.flying = 0;
    }
    const sim = L.sim!;
    L.skin = p.knives[f.playerId] ?? 0;
    // Messer und Sterne übernehmen (Hindernisse stehen schon in der Stufe)
    const fixed = sim.knives.filter((k) => k.fixed);
    sim.knives = [...fixed, ...f.knives.map((a) => ({ a, base: a, skin: L.skin }))];
    sim.stars = [...f.stars];
    // Zeit/Winkel: große Abweichung = hart setzen, sonst sanft nachführen (kein Ruckeln)
    if (fresh || Math.abs(sim.t - f.t) > 0.35) {
      sim.t = f.t;
      sim.angle = f.angle;
    } else {
      const target = f.angle + sim.omega() * (sim.t - f.t);
      sim.angle += (target - sim.angle) * 0.5;
      sim.t += (f.t - sim.t) * 0.2;
    }
    sim.step(0); // Pendel-Messer neu ausrichten
    L.frameAt = now;
    L.mode = f.mode;
    if (f.ev === 'throw') L.flying = now;
    if (f.ev === 'stick' || f.ev === 'star' || f.ev === 'clear') {
      L.flying = 0;
      L.bump = 1;
      klingenSounds.stick();
      if (f.ev === 'star') klingenSounds.star();
    }
    if (f.ev === 'clear') {
      L.flash = now;
      if (sim.def) klingenSounds.bossDown();
      else klingenSounds.clear();
      setMsg({ id: now, text: sim.def ? 'BOSS BESIEGT!' : 'Geschafft!' });
    }
    if (f.ev === 'hit') {
      L.flying = 0;
      L.bounce = now;
      L.flash = now;
      klingenSounds.clang();
      const text = f.hit === 'bomb' ? 'BUMM! Zu langsam!' : f.hit === 'shield' ? 'Am Schild abgeprallt!' : f.hit === 'moon' ? 'Mond im Weg!' : f.hit === 'tentacle' ? 'Vom Fangarm erwischt!' : 'Klirr! Ein Leben weg';
      setMsg({ id: now, text });
    }
    setInfo((old) =>
      old && old.playerId === f.playerId && old.stage === f.stage && old.left === f.left && old.lives === f.lives && old.mode === f.mode
        ? old
        : { playerId: f.playerId, stage: f.stage, left: f.left, lives: f.lives, mode: f.mode },
    );
  });

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 1300);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const c = ref.current;
      if (!c) return;
      const { w, h, dpr } = fitCanvas(c);
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const L = live.current;
      const p = L.pub;
      // noch kein Bild (oder Funkstille): Stufe der führenden Person einfach drehen lassen
      if (!L.sim || L.playerId !== p.spotlight || now - L.frameAt > 4000) {
        const row = p.spotlight ? p.solo[p.spotlight] : null;
        const n = row?.stage ?? 1;
        if (!L.sim || L.sim.stage.n !== n || L.playerId !== null) {
          L.sim = new WheelSim(makeStage(p.seed, n));
          L.playerId = null;
        }
      }
      const sim = L.sim;
      if (L.mode === 'play' || L.mode === 'intro' || L.playerId === null) sim.step(dt);
      const r0 = Math.min(w * 0.36, h * 0.3);
      const r = r0 * sim.radiusScale();
      const cx = w / 2;
      const cy = h * 0.4;
      const len = r0 * KNIFE_LEN;
      // bereitliegendes Messer unter dem Rad (über der Info-Leiste)
      const startY = Math.min(h - len - 70, cy + r0 * 1.15 + 30);
      const impactY = cy + r * 0.72;
      L.bump = Math.max(0, L.bump - dt * 7);
      const flash = Math.max(0, 0.6 - (now - L.flash) / 500);
      drawWheel(ctx, cx, cy - L.bump * 6, r, sim.angle, sim.knives, { bossId: sim.def?.id, sim, stars: sim.stars, knifeLen: len, alpha: Math.max(0.25, sim.alpha()), flash });
      if (L.flying && now - L.flying < 400) {
        const k = Math.min(1, (now - L.flying) / TIMING.flightMs);
        drawKnife(ctx, cx, startY + (impactY - startY) * k, -Math.PI / 2, len, L.skin);
      } else if (L.playerId && L.mode === 'play') {
        drawKnife(ctx, cx, startY, -Math.PI / 2, len, L.skin);
      }
      if (L.bounce && now - L.bounce < 1000) {
        const k = (now - L.bounce) / 1000;
        drawKnife(ctx, cx + k * 200, impactY + 30 + k * k * 900, -Math.PI / 2 + k * 10, len, L.skin, 1 - k);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const row = spot ? pub.solo[spot] : null;
  const shown = info && info.playerId === spot ? info : null;
  const stage = shown?.stage ?? row?.stage ?? 1;
  const st = makeStage(pub.seed, stage);
  return (
    <div className="relative flex h-full w-[40vw] max-w-[78vh] shrink-0 flex-col items-center">
      <canvas ref={ref} className="absolute inset-0 size-full" />
      {spot && (
        <div className="relative z-10 mt-1 flex items-center gap-3 rounded-full bg-[#2b0609]/85 py-1.5 pl-1.5 pr-5 shadow-xl ring-2 ring-[#e8b84a]/60">
          <Avatar room={room} id={spot} size="sm" />
          <span className="text-2xl font-black">{nameOf(room, spot)}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#e03131] px-2.5 py-0.5 text-sm font-black uppercase tracking-widest">
            <span className="size-2 animate-pulse rounded-full bg-white" /> Live · Platz 1
          </span>
        </div>
      )}
      <div className="relative z-10 mt-auto mb-2 flex flex-col items-center gap-1.5">
        {msg && (
          <motion.div key={msg.id} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full bg-[#b3161f] px-5 py-1 text-2xl font-black shadow-lg">
            {msg.text}
          </motion.div>
        )}
        <div className="flex items-center gap-3 rounded-full bg-black/45 px-4 py-1 text-xl font-black">
          <span className="text-[#f2c14e]">{st.boss ? `${BOSSES[st.boss].emoji} ${BOSSES[st.boss].name}` : `Stufe ${stage}`}</span>
          {shown && <span className="text-white/80">noch {shown.left} 🔪</span>}
          <span>
            {Array.from({ length: pub.maxLives }).map((_, k) => (
              <span key={k} className={k < (shown?.lives ?? row?.lives ?? 0) ? '' : 'opacity-20 grayscale'}>
                ❤️
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Gemeinsames Rad

interface Flying {
  id: number;
  playerId: string;
  color: string;
  skin: number;
  at: number;
}

function SharedWheel({ room, pub, secs }: { room: RoomSnapshot; pub: KlingenPublicState; secs: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const offset = useSession((s) => s.clockOffset);
  const sim = useRef({ look: null as WheelSim | null, round: 0, knives: [] as (StuckKnife & { pid: string })[], flying: [] as Flying[], bouncing: [] as (Flying & { a: number; t: number })[], flash: 0 });
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
    const skin = live.current.pub.knives[e.playerId] ?? 0;
    sim.current.flying.push({ id: e.id, playerId: e.playerId, color, skin, at: performance.now() });
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
      const len = r * KNIFE_LEN;
      const startY = h - len - 12;
      const impactY = cy + r * 0.72;
      const now = performance.now();

      // ankommende Messer auswerten
      s.flying = s.flying.filter((f) => {
        if (now - f.at < TIMING.flightMs) return true;
        const local = localImpact(angle);
        const ok = !collides(local, s.knives.map((k) => k.a));
        if (ok) {
          s.knives.push({ a: local, skin: f.skin, accent: f.color, pid: f.playerId });
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

      // Boss-Look (nur Aussehen): eigene kleine Simulation für Augen & Co.
      const look = sharedBoss(p.seed, p.round);
      if (look && s.look?.def?.id !== look) s.look = new WheelSim({ ...makeStage(p.seed, 3), boss: look, obstacles: [], stars: [] });
      if (!look) s.look = null;
      s.look?.step(1 / 60);
      drawWheel(ctx, cx, cy, r, angle, s.knives, { knifeLen: len, flash: Math.max(0, 0.5 - (now - s.flash) / 600), bossId: look, sim: s.look ?? undefined, visualOnly: true });
      for (const f of s.flying) {
        const k = Math.min(1, (now - f.at) / TIMING.flightMs);
        drawKnife(ctx, cx, startY + (impactY - startY) * k, -Math.PI / 2, len, f.skin, 1, f.color);
      }
      s.bouncing = s.bouncing.filter((b) => now - b.t < 1200);
      for (const b of s.bouncing) {
        const k = (now - b.t) / 1000;
        drawKnife(ctx, cx - k * 260, impactY + k * k * 900, -Math.PI / 2 - k * 10, len, b.skin, Math.max(0, 1 - k), b.color);
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
            {sharedBoss(pub.seed, pub.round) && (
              <div className="text-xl font-black text-[#ffe9a8]">
                Im Look von {BOSSES[sharedBoss(pub.seed, pub.round)!].emoji} {BOSSES[sharedBoss(pub.seed, pub.round)!].name}
              </div>
            )}
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
