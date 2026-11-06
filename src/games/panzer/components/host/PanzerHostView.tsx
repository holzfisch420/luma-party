import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCountdown, useGameEvent } from '../../../../app/session/hooks';
import { Burst } from '../../../../components/comic/Burst';
import { ComicCountdown } from '../../../../components/comic/ComicCountdown';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { HostViewProps } from '../../../game-types';
import { POWER_IDS, POWERUPS, TANK_COLORS } from '../../game-config';
import { getMap } from '../../maps';
import { PZ_EVENTS, type PanzerFrame, type PanzerPublicState, type RoundStartEvent } from '../../types';
import { panzerColorCache } from '../colors-cache';
import { TankIcon } from '../TankIcon';
import { ArenaRenderer } from './renderer';
import { panzerSounds } from './sounds';

export function PanzerHostView({ room, state }: HostViewProps<PanzerPublicState>) {
  const pub = state.public;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ArenaRenderer | null>(null);
  const [muted, setMuted] = useState(panzerSounds.isMuted());
  const nameOf = (id: string | null) => room.players.find((p) => p.id === id)?.name ?? '';
  const playerOf = (id: string) => room.players.find((p) => p.id === id);

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

  // Countdown-Pieps
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

  return (
    <div className="comic relative flex h-dvh flex-col overflow-hidden bg-[#2d2a26] [background-image:radial-gradient(rgba(255,255,255,0.05)_1.5px,transparent_1.6px)] [background-size:22px_22px]">
      {/* Anzeigetafel */}
      <div className="flex shrink-0 items-center gap-4 px-6 pt-4">
        <div className="comic-box-sm -rotate-2 bg-pop-yellow px-3 py-1 text-center">
          <div className="font-bangers text-sm leading-none">Runde</div>
          <div className="font-bangers text-3xl leading-none">{Math.max(1, pub.round)}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2.5">
          {sorted.map((p) => {
            const player = playerOf(p.playerId);
            const out = pub.phase !== 'colors' && pub.round > 0 && (!p.inRound || !p.alive);
            return (
              <div key={p.playerId} className={`comic-box-sm flex items-center gap-2 px-2 py-1 transition ${out ? 'opacity-55' : ''}`} style={{ background: out ? '#ddd' : '#fff' }}>
                <TankIcon color={p.color} className="size-9" dead={out} />
                <div className="min-w-0">
                  <div className="max-w-[8rem] truncate text-sm font-bold leading-tight">{player?.name ?? '?'}</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: pub.winScore }).map((_, i) => (
                      <span key={i} className={`size-2.5 rounded-full border-[1.5px] border-ink ${i < p.score ? '' : 'bg-white'}`} style={i < p.score ? { background: TANK_COLORS[p.color]!.hex } : undefined} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => {
            panzerSounds.setMuted(!muted);
            setMuted(!muted);
          }}
          className="comic-box-sm grid size-11 place-items-center"
          aria-label={muted ? 'Ton an' : 'Ton aus'}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      {/* Arena */}
      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />

        <AnimatePresence>
          {pub.phase === 'colors' && <ColorLobby key="colors" pub={pub} room={room} />}

          {pub.phase === 'countdown' && (
            <motion.div key={`cd-${pub.round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-4">
                <div className="comic-box -rotate-1 bg-white px-6 py-2 text-center">
                  <div className="text-lg font-bold">Runde {pub.round} · Arena</div>
                  <div className="font-bangers text-5xl leading-none">{map.name}</div>
                </div>
                <motion.div key={secs} initial={{ scale: 2.4, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
                  <Burst className="aspect-square w-48" spikes={16}>
                    <span className="font-bangers text-8xl leading-none">{secs || 'LOS!'}</span>
                  </Burst>
                </motion.div>
              </div>
            </motion.div>
          )}

          {pub.phase === 'roundEnd' && (
            <motion.div key={`end-${pub.round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
              <motion.div initial={{ scale: 0.2, rotate: 20 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 13 }} className="flex flex-col items-center gap-3">
                {pub.roundWinnerId && (() => {
                  const w = pub.players.find((p) => p.playerId === pub.roundWinnerId)!;
                  const player = playerOf(w.playerId);
                  return (
                    <div className="flex items-center gap-3">
                      <TankIcon color={w.color} className="size-24 drop-shadow-lg" angle={-60} />
                      {player && <PlayerAvatar name={player.name} color={player.avatarColor} avatar={player.avatar} size="lg" variant="comic" />}
                    </div>
                  );
                })()}
                <Burst className="aspect-[2] w-[32rem]" spikes={20}>
                  {pub.roundWinnerId ? (
                    <>
                      <div className="font-bangers text-6xl leading-none">{nameOf(pub.roundWinnerId)}</div>
                      <div className="text-xl font-bold">gewinnt die Runde!</div>
                    </>
                  ) : (
                    <div className="font-bangers text-6xl leading-none">Unentschieden!</div>
                  )}
                </Burst>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fußzeile */}
      <div className="flex shrink-0 items-center justify-between gap-4 px-6 pb-3 pt-2 text-sm font-bold text-white/80">
        <div className="rounded-lg border-2 border-ink bg-white px-2.5 py-0.5 text-ink shadow-[2px_2px_0_#161616]">
          Mitspielen? Code <span className="font-bangers text-base tracking-widest">{room.code}</span>
        </div>
        {pub.powerupsEnabled && (
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {POWER_IDS.map((id) => (
              <span key={id} className="flex items-center gap-1">
                <span>{POWERUPS[id].icon}</span>
                {POWERUPS[id].name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ColorLobby({ pub, room }: { pub: PanzerPublicState; room: HostViewProps['room'] }) {
  const sorted = [...pub.players].sort((a, b) => a.slot - b.slot);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#2d2a26]/95 p-8">
      <motion.div initial={{ scale: 0.4, rotate: -10 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
        <Burst className="aspect-[2.6] w-[36rem]" spikes={22}>
          <div className="font-bangers text-7xl leading-none">Kettenchaos</div>
          <div className="text-lg font-bold">Wählt eure Panzerfarbe auf dem Handy!</div>
        </Burst>
      </motion.div>
      <div className="grid grid-cols-4 gap-4">
        {sorted.map((p) => {
          const player = room.players.find((x) => x.id === p.playerId);
          return (
            <motion.div key={p.playerId} layout className={`comic-box flex w-44 flex-col items-center gap-1 p-3 ${p.ready ? 'bg-[#c9f7d6]' : 'bg-white'}`}>
              <TankIcon color={p.color} className="size-20" angle={-60} />
              <div className="max-w-full truncate text-lg font-bold">{player?.name}</div>
              <div className="font-bangers text-lg">{p.ready ? '✔ Bereit' : TANK_COLORS[p.color]!.name}</div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-6">
        <ComicCountdown endsAt={pub.phaseEndsAt} durationMs={pub.phaseDurationMs} size={84} />
        <div className="comic-box max-w-xl px-5 py-3 text-base font-bold">
          📱 Handy <b>quer</b> halten: links Joystick zum Fahren · <b>A</b> Feuer · <b>B</b> Power-up · <b>X</b> Turbo · <b>Y</b> Hupe. Kugeln prallen ab – Vorsicht vor den eigenen!
        </div>
      </div>
    </motion.div>
  );
}
