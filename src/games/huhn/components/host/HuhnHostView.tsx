import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCountdown, useGameEvent } from '../../../../app/session/hooks';
import type { HostViewProps } from '../../../game-types';
import { CHICKEN_COLORS } from '../../game-config';
import { DIFFICULTY_LABEL, getMap } from '../../maps';
import { HUHN_EVENTS, type HuhnFrame, type HuhnPublicState, type HuhnRoundEvent } from '../../types';
import { ChickenIcon, Stars } from '../ChickenIcon';
import { ChaseRenderer } from './renderer';
import { huhnSounds } from './sounds';

export function HuhnHostView({ room, state }: HostViewProps<HuhnPublicState>) {
  const pub = state.public;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ChaseRenderer | null>(null);
  const [muted, setMuted] = useState(huhnSounds.isMuted());
  const map = getMap(pub.mapId);
  const nameOf = (id: string | null) => room.players.find((p) => p.id === id)?.name ?? '?';

  useEffect(() => {
    const r = new ChaseRenderer(canvasRef.current!);
    rendererRef.current = r;
    return () => {
      r.destroy();
      huhnSounds.stopMusic();
    };
  }, []);

  useGameEvent<HuhnRoundEvent>(HUHN_EVENTS.round, (e) => rendererRef.current?.setRound(e.mapId, e.seed));
  const [meters, setMeters] = useState(0);
  const lastMeters = useRef(0);
  useGameEvent<HuhnFrame>(HUHN_EVENTS.frame, (f) => {
    rendererRef.current?.pushFrame(f);
    const now = performance.now();
    if (now - lastMeters.current > 200) {
      lastMeters.current = now;
      setMeters(Math.round(f.cx));
    }
  });

  useEffect(() => {
    rendererRef.current?.setRound(pub.mapId, pub.seed);
  }, [pub.mapId, pub.seed]);

  // Namensschilder
  useEffect(() => {
    rendererRef.current?.setNames(new Map(pub.players.map((p) => [p.slot, nameOf(p.playerId)])));
    const w = pub.players.find((p) => p.playerId === pub.roundWinnerId);
    rendererRef.current?.setWinner(w ? w.slot : -1);
  });

  // Countdown-Töne, Musik, Fanfare
  const remaining = useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 100);
  const secs = Math.ceil(remaining / 1000);
  useEffect(() => {
    if (pub.phase === 'countdown' && secs > 0 && secs <= 3) huhnSounds.beep(false);
  }, [secs, pub.phase]);
  useEffect(() => {
    if (pub.phase === 'run') {
      huhnSounds.beep(true);
      huhnSounds.startMusic(0.9 + map.difficulty * 0.08);
    } else huhnSounds.stopMusic();
    if (pub.phase === 'roundEnd') huhnSounds.fanfare();
  }, [pub.phase, map.difficulty]);

  const ranking = [...pub.players].filter((p) => p.inRound).sort((a, b) => (a.place || 0) - (b.place || 0));

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#1f2937] font-sans text-white">
      <header className="flex h-16 shrink-0 items-center gap-5 bg-[#111827] pl-6 pr-48 shadow-lg">
        <div className="flex items-center gap-3">
          <ChickenIcon className="size-10" />
          <div>
            <div className="text-xl font-black leading-none">Hühnerjagd</div>
            <div className="text-sm font-bold text-white/60">
              Runde {Math.max(1, pub.round)} / {pub.totalRounds}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
          <span className="text-lg font-black">{map.name}</span>
          <Stars n={map.difficulty} />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          <span className="text-2xl font-black tabular-nums text-[#ffd23f]">{pub.phase === 'run' ? meters : pub.meters} m</span>
          <button
            onClick={() => {
              huhnSounds.setMuted(!muted);
              setMuted(!muted);
              if (muted && pub.phase === 'run') huhnSounds.startMusic(0.9 + map.difficulty * 0.08);
            }}
            className="grid size-10 place-items-center rounded-full text-white/90 transition hover:bg-white/10"
            aria-label={muted ? 'Ton an' : 'Ton aus'}
          >
            {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />

        <AnimatePresence>
          {pub.phase === 'countdown' && (
            <motion.div key={`cd-${pub.round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-black/35">
              <div className="flex flex-col items-center text-center">
                <div className="text-2xl font-black uppercase tracking-[0.3em] text-white/80">Runde {pub.round}</div>
                <div className="mt-1 text-6xl font-black drop-shadow-lg">{map.name}</div>
                <div className="mt-3 flex items-center gap-3 rounded-full bg-black/40 px-5 py-2 text-xl font-black">
                  <Stars n={map.difficulty} size="size-6" /> {DIFFICULTY_LABEL[map.difficulty]}
                </div>
                <p className="mt-4 max-w-2xl text-xl font-bold text-white/85">{map.blurb}</p>
                <motion.div key={secs} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6 text-[9rem] font-black leading-none text-[#ffd23f] drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]">
                  {secs > 3 ? '' : secs || 'LOS!'}
                </motion.div>
                <div className="mt-2 text-xl font-bold text-white/80">📱 Knopf = Schwerkraft umdrehen (Boden ↔ Decke)</div>
              </div>
            </motion.div>
          )}
          {pub.phase === 'roundEnd' && (
            <motion.div key={`end-${pub.round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-black/45">
              <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className="rounded-[32px] bg-white px-12 py-8 text-center text-[#1f2937] shadow-2xl">
                <div className="text-lg font-black uppercase tracking-[0.25em] text-[#ff8c42]">{pub.roundWinnerId ? 'Entkommen!' : 'Alle erwischt!'}</div>
                <div className="mt-1 text-5xl font-black">{pub.roundWinnerId ? `${nameOf(pub.roundWinnerId)} ist frei!` : 'Die Polizei war schneller'}</div>
                <div className="mt-1 text-xl font-bold text-gray-500">{pub.meters} m geflüchtet</div>
                <div className="mt-6 flex flex-col gap-2">
                  {ranking.map((p) => (
                    <div key={p.playerId} className="flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-2 text-xl font-black">
                      <span className="w-8 text-gray-400">{p.place || '–'}.</span>
                      <span className="size-6 rounded-full" style={{ background: CHICKEN_COLORS[p.slot]?.body }} />
                      <span className="flex-1 text-left">
                        {nameOf(p.playerId)}
                        {p.out && <span className="ml-2 text-base font-bold text-gray-400">{p.out === 'fell' ? 'abgestürzt' : 'geschnappt'}</span>}
                      </span>
                      <span className="tabular-nums text-[#ff8c42]">{p.score}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="flex h-10 shrink-0 items-center justify-between bg-[#111827] px-6 text-sm font-bold text-white/60">
        <span>Mitspielen: Code <span className="tracking-[0.2em] text-[#ffd23f]">{room.code}</span></span>
        <span>Nicht in Lücken fallen · Polizisten ausweichen · Absperrungen bremsen · nicht abhängen lassen!</span>
      </footer>
    </div>
  );
}
