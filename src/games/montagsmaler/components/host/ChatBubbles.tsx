import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameEvent } from '../../../../app/session/hooks';
import type { PublicPlayer } from '../../../../shared/types/room';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import { MM_EVENTS, type ChatEvent, type CorrectEvent } from '../../types';

export type BubbleSide = 'left' | 'right';

export interface Bubble {
  id: string;
  side: BubbleSide;
  kind: 'chat' | 'correct';
  playerId: string;
  text: string;
  rank?: number;
  points?: number;
}

const MAX_PER_SIDE = 4;
const CHAT_TTL = 5500;
const CORRECT_TTL = 7000;

/**
 * Warteschlange für Chat-Bubbles: jede neue Nachricht landet zufällig links oder rechts unten.
 * Pro Seite wird gestapelt (neueste unten); ältere werden verdrängt – so überlappt nichts.
 */
export function useChatBubbles(turn: number) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: string) => {
    setBubbles((list) => list.filter((b) => b.id !== id));
    timers.current.delete(id);
  }, []);

  const add = useCallback(
    (b: Omit<Bubble, 'side'>, ttl: number) => {
      const side: BubbleSide = Math.random() < 0.5 ? 'left' : 'right';
      setBubbles((list) => {
        const next = [...list, { ...b, side }];
        const sameSide = next.filter((x) => x.side === side);
        const overflow = sameSide.length - MAX_PER_SIDE;
        return overflow > 0 ? next.filter((x) => !sameSide.slice(0, overflow).includes(x)) : next;
      });
      timers.current.set(b.id, setTimeout(() => remove(b.id), ttl));
    },
    [remove],
  );

  useGameEvent<ChatEvent>(MM_EVENTS.chat, (e) => add({ id: e.id, kind: 'chat', playerId: e.playerId, text: e.text }, CHAT_TTL));
  useGameEvent<CorrectEvent>(MM_EVENTS.correct, (e) =>
    add({ id: e.id, kind: 'correct', playerId: e.playerId, text: '', rank: e.rank, points: e.points }, CORRECT_TTL),
  );

  // neuer Zug → alte Nachrichten verschwinden
  useEffect(() => {
    setBubbles([]);
  }, [turn]);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  return bubbles;
}

export function BubbleStack({ bubbles, side, players }: { bubbles: Bubble[]; side: BubbleSide; players: PublicPlayer[] }) {
  const items = bubbles.filter((b) => b.side === side);
  return (
    <div className={`flex flex-col justify-end gap-3 ${side === 'left' ? 'items-start' : 'items-end'}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((b) => {
          const player = players.find((p) => p.id === b.playerId);
          const name = player?.name ?? 'Jemand';
          const color = player?.avatarColor ?? '#888';
          return (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, y: 36, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.92, transition: { duration: 0.35 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`flex max-w-full items-end gap-2.5 ${side === 'right' ? 'flex-row-reverse' : ''}`}
            >
              <PlayerAvatar name={name} color={color} size="sm" />
              {b.kind === 'chat' ? (
                <div
                  className={`max-w-[22rem] rounded-[22px] bg-white px-4 py-2.5 text-black shadow-xl shadow-black/30 ${side === 'left' ? 'rounded-bl-md' : 'rounded-br-md'}`}
                >
                  <div className="text-xs font-semibold" style={{ color: `color-mix(in srgb, ${color} 70%, #000)` }}>
                    {name}
                  </div>
                  <div className="break-words text-lg font-medium leading-snug">{b.text}</div>
                </div>
              ) : (
                <motion.div
                  initial={{ boxShadow: '0 0 0 0 rgba(52,211,153,0.7)' }}
                  animate={{ boxShadow: ['0 0 0 0 rgba(52,211,153,0.6)', '0 0 0 16px rgba(52,211,153,0)'] }}
                  transition={{ duration: 1.2, repeat: 1 }}
                  className={`flex max-w-[24rem] items-center gap-3 rounded-[22px] bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-3 text-black shadow-xl ${side === 'left' ? 'rounded-bl-md' : 'rounded-br-md'}`}
                >
                  <PartyPopper className="size-6 shrink-0" />
                  <div>
                    <div className="text-lg font-bold leading-tight">{name} hat das Wort erraten!</div>
                    <div className="text-sm font-semibold text-black/60">
                      {b.rank === 1 ? 'Als Erste:r · ' : `Platz ${b.rank} · `}+{b.points} Punkte
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
