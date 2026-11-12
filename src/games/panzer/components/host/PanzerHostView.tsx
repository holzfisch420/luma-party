import { AnimatePresence, motion } from 'framer-motion';
import { Check, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCountdown, useGameEvent } from '../../../../app/session/hooks';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { HostViewProps } from '../../../game-types';
import { POWER_IDS, POWERUPS, TANK_COLORS } from '../../game-config';
import { getMap } from '../../maps';
import { PZ_EVENTS, type PanzerFrame, type PanzerPublicState, type RoundStartEvent } from '../../types';
import { panzerColorCache } from '../colors-cache';
import { TankIcon } from '../TankIcon';
import { ArenaRenderer } from './renderer';
import { panzerSounds } from './sounds';

const HEADER = '#4a752c';
const FIELD = '#578a34';

export function PanzerHostView({ room, state }: HostViewProps<PanzerPublicState>) {
  const pub = state.public;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ArenaRenderer | null>(null);
  const [muted, setMuted] = useState(panzerSounds.isMuted());
  const playerOf = (id: string | null) => room.players.find((p) => p.id === id);

  useEffect(() => {
    const r = new ArenaRenderer(canvasRef.current!);
    rendererRef.current = r;
    return () => r.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current?.setColors(pub.players);
    panzerColorCache.set(pub.players);
  }, [pub.players]);

  useEffect(() => {
    if (pub.round > 0) rendererRef.current?.setMap(getMap(pub.mapId));
  }, [pub.mapId, pub.round]);

  useGameEvent<RoundStartEvent>(PZ_EVENTS.round, (e) => {
    const r = rendererRef.current;
    if (!r) return;
    r.setMap(getMap(e.mapId));
    r.clearRound();
  });
  useGameEvent<PanzerFrame>(PZ_EVENTS.frame, (f) => rendererRef.current?.pushFrame(f));

  const remaining = useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 100);
  const secs = Math.ceil(remaining / 1000);
  useEffect(() => {
    if (pub.phase === 'countdown' && secs > 0) panzerSounds.beep(false);
  }, [secs, pub.phase]);
  useEffect(() => {
    if (pub.phase === 'battle') panzerSounds.beep(true);
  }, [pub.phase]);

  const map = getMap(pub.mapId);
  const sorted = [...pub.players].sort((a, b) => a.slot - b.slot);
  const winner = pub.players.find((p) => p.playerId === pub.roundWinnerId);

  return (
    <div className="flat relative flex h-dvh flex-col overflow-hidden" style={{ background: FIELD }}>
      {/* Kopfleiste im Stil der Google-Minispiele */}
      <header className="flex h-16 shrink-0 items-center gap-6 pl-6 pr-48 shadow-[0_2px_6px_rgba(0,0,0,0.25)]" style={{ background: HEADER }}>
        <div className="flex items-center gap-2 text-xl font-black">
          <span className="text-white/70">Runde</span> {Math.max(1, pub.round)}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-5">
          {sorted.map((p) => {
            const out = pub.phase !== 'colors' && pub.round > 0 && (!p.inRound || !p.alive);
            return (
              <div key={p.playerId} className={`flex items-center gap-1.5 transition-opacity ${out ? 'opacity-40' : ''}`} title={playerOf(p.playerId)?.name}>
                <TankIcon color={p.color} className="size-9" dead={out} />
                <span className="text-2xl font-black tabular-nums">{p.score}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 text-xl font-black" title="Siege zum Gewinnen">
          <Trophy className="size-6 text-[#ffd54f]" fill="#ffd54f" /> {pub.winScore}
        </div>
        <button
          onClick={() => {
            panzerSounds.setMuted(!muted);
            setMuted(!muted);
          }}
          className="grid size-10 place-items-center rounded-full text-white/90 transition hover:bg-white/10"
          aria-label={muted ? 'Ton an' : 'Ton aus'}
        >
          {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
        </button>
      </header>

      {/* Spielfeld */}
      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />

        <AnimatePresence>
          {pub.phase === 'colors' && <ColorLobby key="colors" pub={pub} room={room} />}

          {pub.phase === 'countdown' && (
            <motion.div key={`cd-${pub.round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
              <div className="flex flex-col items-center gap-5">
                <div className="flat-card px-7 py-3 text-center">
                  <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#5f6368]">Runde {pub.round}</div>
                  <div className="text-4xl font-black">{map.name}</div>
                </div>
                <motion.div
                  key={secs}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="grid size-40 place-items-center rounded-full bg-white text-8xl font-black text-[#4a752c] shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
                >
                  {secs || 'Los!'}
                </motion.div>
              </div>
            </motion.div>
          )}

          {pub.phase === 'roundEnd' && (
            <motion.div key={`end-${pub.round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center bg-black/35">
              <motion.div initial={{ y: 30, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="flat-card flex min-w-[26rem] flex-col items-center gap-3 px-10 py-7">
                {winner ? (
                  <>
                    <div className="flex items-center gap-3">
                      <TankIcon color={winner.color} className="size-20" angle={-60} />
                      {playerOf(winner.playerId) && (
                        <PlayerAvatar name={playerOf(winner.playerId)!.name} color={playerOf(winner.playerId)!.avatarColor} avatar={playerOf(winner.playerId)!.avatar} size="lg" />
                      )}
                    </div>
                    <div className="text-5xl font-black" style={{ color: TANK_COLORS[winner.color]!.hex === '#f2f2f2' ? '#3c4043' : TANK_COLORS[winner.color]!.hex }}>
                      {playerOf(winner.playerId)?.name}
                    </div>
                    <div className="text-xl font-bold text-[#5f6368]">gewinnt die Runde</div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: pub.winScore }).map((_, i) => (
                        <Trophy key={i} className="size-7" color={i < winner.score ? '#f9ab00' : '#dadce0'} fill={i < winner.score ? '#fbbc04' : '#f1f3f4'} />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl font-black">Unentschieden</div>
                    <div className="text-xl font-bold text-[#5f6368]">Niemand hat überlebt</div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fußzeile */}
      <footer className="flex h-11 shrink-0 items-center justify-between gap-4 px-6 text-sm font-bold" style={{ background: HEADER }}>
        <div>
          Mitspielen: Code <span className="ml-1 rounded bg-white/15 px-2 py-0.5 tracking-[0.2em]">{room.code}</span>
        </div>
        {pub.powerupsEnabled && (
          <div className="flex flex-wrap items-center justify-end gap-x-4 text-white/85">
            {POWER_IDS.map((id) => (
              <span key={id} className="flex items-center gap-1">
                <span className="grid size-5 place-items-center rounded text-[11px]" style={{ background: POWERUPS[id].color }}>
                  {POWERUPS[id].icon}
                </span>
                {POWERUPS[id].name}
              </span>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}

function ColorLobby({ pub, room }: { pub: PanzerPublicState; room: HostViewProps['room'] }) {
  const sorted = [...pub.players].sort((a, b) => a.slot - b.slot);
  const remaining = useCountdown(pub.phaseEndsAt, 250);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="camo absolute inset-0 flex flex-col items-center justify-center gap-7 p-8">
      <div className="hazard absolute inset-x-0 top-0 h-4 opacity-90" />
      <div className="hazard absolute inset-x-0 bottom-0 h-4 opacity-90" />
      <div className="text-center">
        <motion.div initial={{ scale: 1.6, rotate: -6, opacity: 0 }} animate={{ scale: 1, rotate: -3, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }} className="stencil text-[9rem] leading-none">
          KETTENCHAOS
        </motion.div>
        <div className="mx-auto mt-3 w-fit rounded bg-[#1e1e1e]/80 px-4 py-1 font-bangers text-2xl tracking-[0.15em] text-[#f2c12e]">Wählt eure Panzerfarbe auf dem Handy</div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {sorted.map((p) => {
          const player = room.players.find((x) => x.id === p.playerId);
          return (
            <motion.div key={p.playerId} layout className="flat-card relative flex w-44 flex-col items-center gap-1 px-3 pb-3 pt-4">
              {p.ready && (
                <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#34a853] text-white">
                  <Check className="size-4" strokeWidth={3.5} />
                </span>
              )}
              <TankIcon color={p.color} className="size-20" angle={-60} />
              <div className="max-w-full truncate text-lg font-black">{player?.name}</div>
              <div className="text-sm font-bold text-[#5f6368]">{p.ready ? 'Bereit' : TANK_COLORS[p.color]!.name}</div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-5">
        <div className="grid size-16 place-items-center rounded-full bg-white text-2xl font-black text-[#4a752c] shadow">{Math.ceil(remaining / 1000)}</div>
        <div className="flat-card max-w-2xl px-5 py-3 text-base font-bold">
          📱 <b>Fahrknopf</b> halten = fahren, loslassen = drehen, tippen = Richtung wechseln · <b>Feuer</b> · <b>Item</b>
        </div>
      </div>
    </motion.div>
  );
}
