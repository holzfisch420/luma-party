import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameEvent } from '../../../../app/session/hooks';
import type { PublicPlayer } from '../../../../shared/types/room';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import { Burst } from '../../../../components/comic/Burst';
import { SpeechBubble } from '../../../../components/comic/SpeechBubble';
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

const MAX_PER_SIDE = 3;
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

const EXCLAMATIONS = ['BÄM!', 'ZACK!', 'WOW!', 'TREFFER!', 'JAWOLL!'];

export function BubbleStack({ bubbles, side, players }: { bubbles: Bubble[]; side: BubbleSide; players: PublicPlayer[] }) {
  const items = bubbles.filter((b) => b.side === side);
  return (
    <div className={`flex flex-col justify-end gap-7 ${side === 'left' ? 'items-start' : 'items-end'}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((b) => {
          const player = players.find((p) => p.id === b.playerId);
          const name = player?.name ?? 'Jemand';
          const color = player?.avatarColor ?? '#888';
          // leichte, stabile Schräglage je Nachricht
          const tilt = ((b.id.charCodeAt(b.id.length - 1) % 5) - 2) * 0.9;
          return (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.4, rotate: tilt * 4 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
              exit={{ opacity: 0, scale: 0.7, y: -10, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              className={`flex max-w-full items-end gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}
            >
              <PlayerAvatar name={name} color={color} avatar={player?.avatar} size="md" variant="comic" />
              {b.kind === 'chat' ? (
                <SpeechBubble side={side} className="mb-6 max-w-[22rem]">
                  <div className="text-sm font-bold" style={{ color: `color-mix(in srgb, ${color} 60%, #000)` }}>
                    {name}
                  </div>
                  <div className="break-words text-2xl font-bold leading-tight">{b.text}</div>
                </SpeechBubble>
              ) : (
                <Burst color="#7dea9f" spikes={16} className="mb-2 aspect-[1.6] w-[19rem] max-w-full">
                  <div className="font-bangers text-3xl leading-none">{EXCLAMATIONS[(b.rank ?? 1) % EXCLAMATIONS.length]}</div>
                  <div className="text-base font-bold leading-tight">{name} hat's erraten!</div>
                  <div className="font-bangers text-xl">+{b.points}</div>
                </Burst>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
