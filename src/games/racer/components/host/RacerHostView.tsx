import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useCountdown, useGameEvent } from '../../../../app/session/hooks';
import { useSession } from '../../../../app/session/session-store';
import type { HostViewProps } from '../../../game-types';
import { CAR_COLORS } from '../../game-config';
import { DIFFICULTY_LABEL, getTrack } from '../../tracks';
import { CAR_FLAG, RACER_EVENTS, type RacerFrame, type RacerPublicState } from '../../types';
import { RaceScene, type CarView, type Viewport } from './scene';
import { raceSounds } from './sounds';

export function formatTime(ms: number | null | undefined) {
  if (ms == null || ms < 0) return '–';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

/** Fernseher: Splitscreen oder gemeinsame Kamera, HUD je Ansicht, Minikarte, Countdown, Ergebnisse. */
export function RacerHostView({ room, state }: HostViewProps<RacerPublicState>) {
  const pub = state.public;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<RaceScene | null>(null);
  const [views, setViews] = useState<Viewport[]>([]);
  const [cars, setCars] = useState<Map<number, CarView>>(new Map());
  const [flash, setFlash] = useState<Record<number, { text: string; at: number }>>({});
  const offset = useSession((s) => s.clockOffset);
  const track = getTrack(pub.trackId);
  const nameOf = (id: string) => room.players.find((p) => p.id === id)?.name ?? '?';
  const bySlot = new Map(pub.players.map((p) => [p.slot, p]));

  useEffect(() => {
    const scene = new RaceScene(canvasRef.current!, miniRef.current ?? undefined);
    sceneRef.current = scene;
    // HUD gedrosselt aktualisieren (React muss nicht jedes Bild neu rendern)
    const id = setInterval(() => {
      setViews([...scene.views]);
      setCars(new Map(scene.latest));
    }, 120);
    return () => {
      clearInterval(id);
      scene.destroy();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setTrack(track);
    scene.setCars(pub.players.filter((p) => p.inRace).map((p) => p.slot));
    scene.mode = pub.view;
    const leader = [...pub.players].filter((p) => p.inRace).sort((a, b) => a.place - b.place)[0];
    scene.leaderSlot = leader?.slot ?? 0;
    scene.onFx = (fx) => {
      if (fx.t === 'cp') raceSounds.checkpoint();
      if (fx.t === 'lap') raceSounds.lap();
      if (fx.t === 'bump' || fx.t === 'wall') raceSounds.bump();
      if (fx.t === 'fall') raceSounds.fall();
      if (fx.t === 'finish') raceSounds.finish();
      const text = fx.t === 'cp' ? 'Checkpoint!' : fx.t === 'lap' ? 'Neue Runde!' : fx.t === 'fall' ? 'Runtergefallen!' : fx.t === 'finish' ? `Ziel! Platz ${fx.place}` : null;
      if (text) setFlash((f) => ({ ...f, [fx.s]: { text, at: Date.now() } }));
    };
  });

  useGameEvent<RacerFrame>(RACER_EVENTS.frame, (f) => sceneRef.current?.pushFrame(f));

  const remaining = useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 100);
  const secs = Math.ceil(remaining / 1000);
  useEffect(() => {
    if (pub.phase === 'countdown' && secs > 0 && secs <= 3) raceSounds.beep(false);
    if (pub.phase === 'race') raceSounds.beep(true);
  }, [secs, pub.phase]);

  // Rennzeit
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  const raceMs = pub.raceStartAt ? now + offset - pub.raceStartAt : 0;
  const grace = pub.finishDeadline ? Math.max(0, Math.ceil((pub.finishDeadline - now - offset) / 1000)) : null;
  const ranking = [...pub.players].filter((p) => p.inRace).sort((a, b) => a.place - b.place);

  return (
    <div className="relative h-dvh overflow-hidden bg-black font-sans text-white">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />

      {/* HUD je Ansicht */}
      {pub.phase !== 'intro' &&
        views.map((v) => {
          const p = bySlot.get(v.slot);
          const car = cars.get(v.slot);
          const color = CAR_COLORS[v.slot % CAR_COLORS.length]!.hex;
          const f = flash[v.slot];
          const showFlash = f && Date.now() - f.at < 1600;
          const small = v.h < 400;
          return (
            <div key={v.slot} className="pointer-events-none absolute border border-black/40" style={{ left: v.x, top: v.y, width: v.w, height: v.h }}>
              {p && pub.view === 'split' && (
                <div className={`absolute left-2 top-2 flex items-center gap-2 rounded-xl bg-black/55 px-3 py-1.5 ${small ? 'text-sm' : 'text-lg'} font-black`}>
                  <span className={`${small ? 'text-2xl' : 'text-4xl'} tabular-nums`}>{p.finished ? '🏁' : `${p.place}.`}</span>
                  <span className="size-3 rounded-full" style={{ background: color }} />
                  <span className="max-w-[10rem] truncate">{nameOf(p.playerId)}</span>
                </div>
              )}
              {p && pub.view === 'split' && (
                <div className={`absolute right-2 top-10 rounded-xl bg-black/55 px-3 py-1.5 text-right font-black ${small ? 'text-sm' : 'text-lg'}`}>
                  {track.closed ? `Runde ${p.lap}/${track.laps}` : `${Math.round(p.progress * 100)} %`}
                  <div className="text-xs font-bold text-white/70 tabular-nums">{p.finished ? formatTime(p.finishMs) : formatTime(raceMs)}</div>
                </div>
              )}
              {car && (
                <div className={`absolute bottom-2 left-2 rounded-xl bg-black/55 px-3 py-1 font-black tabular-nums ${small ? 'text-lg' : 'text-3xl'}`}>
                  {car.kmh}
                  <span className="ml-1 text-xs text-white/70">km/h</span>
                  {car.flags & CAR_FLAG.boost ? <span className="ml-2 text-[#ffd43b]">TURBO</span> : null}
                </div>
              )}
              {car && car.flags & CAR_FLAG.wrongWay ? (
                <div className={`absolute inset-x-0 top-1/3 text-center font-black text-[#ff6b6b] drop-shadow ${small ? 'text-xl' : 'text-4xl'}`}>Falsche Richtung!</div>
              ) : null}
              {showFlash && (
                <motion.div key={f.at} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`absolute inset-x-0 top-[22%] text-center font-black text-[#ffd43b] drop-shadow-[0_3px_0_rgba(0,0,0,0.6)] ${small ? 'text-2xl' : 'text-5xl'}`}>
                  {f.text}
                </motion.div>
              )}
            </div>
          );
        })}

      {/* Rangliste (gemeinsame Kamera) */}
      {pub.view === 'shared' && pub.phase === 'race' && (
        <div className="absolute left-4 top-4 flex flex-col gap-1">
          {ranking.map((p) => (
            <div key={p.playerId} className="flex items-center gap-2 rounded-lg bg-black/55 px-3 py-1 text-lg font-black">
              <span className="w-7 tabular-nums">{p.place}.</span>
              <span className="size-3 rounded-full" style={{ background: CAR_COLORS[p.slot % 8]!.hex }} />
              {nameOf(p.playerId)}
              <span className="ml-2 text-sm text-white/70">{p.finished ? formatTime(p.finishMs) : track.closed ? `R${p.lap}` : `${Math.round(p.progress * 100)}%`}</span>
            </div>
          ))}
        </div>
      )}

      {/* Minikarte */}
      <canvas ref={miniRef} className="pointer-events-none absolute bottom-3 right-3 size-[180px] rounded-2xl bg-black/30" />

      {/* Kopfinfo */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-sm font-black">
        {track.name} · Rennen {pub.race}/{pub.totalRaces}
        {grace !== null && pub.phase === 'race' && <span className="ml-3 text-[#ffd43b]">Ziel schließt in {grace} s</span>}
      </div>

      <AnimatePresence>
        {pub.phase === 'intro' && (
          <motion.div key={`intro-${pub.race}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-black/55">
            <div className="text-center">
              <div className="text-2xl font-black uppercase tracking-[0.3em] text-white/70">Rennen {pub.race}</div>
              <div className="mt-1 text-7xl font-black">{track.name}</div>
              <div className="mt-3 inline-flex gap-3 rounded-full bg-white/15 px-5 py-2 text-xl font-black">
                {'★'.repeat(track.difficulty)}
                <span className="text-white/40">{'★'.repeat(5 - track.difficulty)}</span>
                {DIFFICULTY_LABEL[track.difficulty]} · {track.closed ? `${track.laps} Runden` : 'Sprint'}
              </div>
              <p className="mt-4 text-2xl font-bold text-white/85">{track.blurb}</p>
              <p className="mt-6 text-lg font-bold text-white/60">📱 Handy quer halten · neigen zum Lenken oder klassisch mit Joystick</p>
            </div>
          </motion.div>
        )}
        {pub.phase === 'countdown' && secs <= 3 && (
          <motion.div key={`cd-${secs}`} initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="text-[12rem] font-black text-[#ffd43b] drop-shadow-[0_8px_0_rgba(0,0,0,0.5)]">{secs || 'LOS!'}</span>
          </motion.div>
        )}
        {pub.phase === 'results' && (
          <motion.div key={`res-${pub.race}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-black/60">
            <motion.div initial={{ y: 30, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className="w-[min(90vw,720px)] rounded-[28px] bg-white p-8 text-[#1f2430] shadow-2xl">
              <div className="text-center text-sm font-black uppercase tracking-[0.25em] text-[#7c5cff]">Ergebnis · {track.name}</div>
              <div className="mt-4 flex flex-col gap-2">
                {ranking.map((p) => (
                  <div key={p.playerId} className="flex items-center gap-3 rounded-2xl bg-[#f1f3f5] px-4 py-2 text-xl font-black">
                    <span className="w-8 text-[#868e96]">{p.dnf ? '–' : `${p.place}.`}</span>
                    <span className="size-5 rounded-full" style={{ background: CAR_COLORS[p.slot % 8]!.hex }} />
                    <span className="flex-1 truncate">{nameOf(p.playerId)}</span>
                    <span className="tabular-nums text-[#868e96]">{p.dnf ? 'nicht im Ziel' : formatTime(p.finishMs)}</span>
                    <span className="w-14 text-right text-[#2b8a3e]">+{p.gained}</span>
                    <span className="w-12 text-right tabular-nums text-[#7c5cff]">{p.points}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
