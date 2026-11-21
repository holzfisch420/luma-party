import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { playSfx, type SfxKey } from '../../app/audio/sfx';
import { getSocket } from '../../app/session/socket';
import { EFFECTS, EMOTES, type EmoteEvent } from '../../shared/emotes';
import type { RoomSnapshot } from '../../shared/types/room';
import { EmoteAvatar } from './EmoteAvatar';
// Effekte erst bei Bedarf laden
const ScreenEffect = lazy(() => import('./ScreenEffect').then((m) => ({ default: m.ScreenEffect })));
const EFFECT_MS = 5500;

/** feste Plätze am Rand – links, rechts und unten, nie in der Mitte */
const SLOTS: { left?: string; right?: string; top?: string; bottom?: string; tail: 'left' | 'right' | 'down' }[] = [
  { left: '1.5vw', top: '26%', tail: 'left' },
  { left: '1.5vw', top: '52%', tail: 'left' },
  { right: '1.5vw', top: '26%', tail: 'right' },
  { right: '1.5vw', top: '52%', tail: 'right' },
  { left: '14%', bottom: '2vh', tail: 'down' },
  { right: '14%', bottom: '2vh', tail: 'down' },
  { left: '1.5vw', top: '76%', tail: 'left' },
  { right: '1.5vw', top: '76%', tail: 'right' },
];
const SHOW_MS = 3600;

const EFFECT_SOUND: Record<string, SfxKey> = { konfetti: 'cheer', laser: 'laser', disco: 'drumroll', feuerwerk: 'explosion-small', herzen: 'ooh', blasen: 'bubble-2' };

interface Shown extends EmoteEvent {
  slot: number;
}

/** Fernseher: Emotes der Zuschauer am Rand und kurze Vollbild-Effekte */
export function HostEmoteLayer({ room }: { room: RoomSnapshot }) {
  const [emotes, setEmotes] = useState<Shown[]>([]);
  const [effects, setEffects] = useState<EmoteEvent[]>([]);
  const used = useRef(new Set<number>());

  useEffect(() => {
    const s = getSocket();
    const on = (e: EmoteEvent) => {
      if (e.kind === 'effect') {
        setEffects((list) => [...list.filter((x) => x.id !== e.id), e]);
        playSfx(EFFECT_SOUND[e.id] ?? 'pop', { vol: 0.8 });
        setTimeout(() => setEffects((list) => list.filter((x) => x.key !== e.key)), EFFECT_MS);
        return;
      }
      // freien Platz nehmen (sonst einen zufälligen)
      const free = SLOTS.map((_, i) => i).filter((i) => !used.current.has(i));
      const slot = free.length ? free[Math.floor(Math.random() * free.length)]! : Math.floor(Math.random() * SLOTS.length);
      used.current.add(slot);
      setEmotes((list) => [...list, { ...e, slot }]);
      playSfx('pop', { vol: 0.6, rate: 1.3, vary: 0.1 });
      setTimeout(() => {
        used.current.delete(slot);
        setEmotes((list) => list.filter((x) => x.key !== e.key));
      }, SHOW_MS);
    };
    s.on('room:emote', on);
    return () => {
      s.off('room:emote', on);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
      {effects.map((e) => (
        <div key={e.key} className="absolute inset-0">
          <Suspense fallback={null}>
            <ScreenEffect id={e.id} />
          </Suspense>
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/55 px-4 py-1.5 text-lg font-black text-white backdrop-blur"
          >
            {EFFECTS.find((f) => f.id === e.id)?.emoji} {EFFECTS.find((f) => f.id === e.id)?.label} von {room.players.find((p) => p.id === e.playerId)?.name ?? '?'}
          </motion.div>
        </div>
      ))}
      <AnimatePresence>
        {emotes.map((e) => {
          const emote = EMOTES.find((x) => x.id === e.id);
          const p = room.players.find((x) => x.id === e.playerId);
          if (!emote) return null;
          const slot = SLOTS[e.slot]!;
          const right = slot.tail === 'right';
          return (
            <motion.div
              key={e.key}
              className={`absolute flex items-end gap-2 ${right ? 'flex-row-reverse' : ''}`}
              style={{ left: slot.left, right: slot.right, top: slot.top, bottom: slot.bottom }}
              // kommt von unten herein geflogen – aus Richtung der Handys
              initial={{ y: '70vh', scale: 0.4, opacity: 0, rotate: right ? 20 : -20 }}
              animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 170, damping: 16 }}
            >
              <div className="flex flex-col items-center">
                <EmoteAvatar avatar={p?.avatar} seed={e.playerId} emote={emote} size={86} />
                <span className="mt-1 max-w-28 truncate rounded-full bg-black/55 px-2 text-xs font-black text-white">{p?.name ?? '?'}</span>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 14 }}
                className={`relative mb-10 whitespace-nowrap rounded-2xl bg-white px-4 py-2 text-2xl font-black text-[#1b1530] shadow-xl ${right ? 'origin-bottom-right' : 'origin-bottom-left'}`}
              >
                {emote.emoji} {emote.bubble}
                <span className={`absolute -bottom-2 size-4 rotate-45 bg-white ${right ? 'right-4' : 'left-4'}`} />
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
