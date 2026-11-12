import { motion } from 'framer-motion';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import type { RoomSnapshot } from '../../../shared/types/room';
import { MAX_GUESSES, WORD_LENGTH } from '../game-config';
import type { Mark } from '../types';

export const MARK_COLORS: Record<Mark | 'empty' | 'typing', { bg: string; border: string; text: string }> = {
  g: { bg: '#2fb67c', border: '#2fb67c', text: '#ffffff' },
  y: { bg: '#f2b33d', border: '#f2b33d', text: '#ffffff' },
  x: { bg: '#4a5672', border: '#4a5672', text: '#ffffff' },
  empty: { bg: 'transparent', border: 'rgba(255,255,255,0.18)', text: '#ffffff' },
  typing: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.55)', text: '#ffffff' },
};

export function nameOf(room: RoomSnapshot, id: string | null | undefined) {
  return room.players.find((p) => p.id === id)?.name ?? '?';
}

export function Avatar({ room, id, size = 'md' }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const p = room.players.find((x) => x.id === id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#2fb67c'} avatar={p?.avatar} size={size} dimmed={p ? !p.isConnected : true} />;
}

/** ein Feld; mit `flip` dreht es sich beim Aufdecken */
export function Tile({ letter, mark, size, flipDelay = 0, typing = false }: { letter?: string; mark?: Mark; size: number; flipDelay?: number; typing?: boolean }) {
  const c = MARK_COLORS[mark ?? (typing && letter ? 'typing' : 'empty')];
  return (
    <motion.div
      initial={mark ? { rotateX: 90 } : false}
      animate={{ rotateX: 0, scale: typing && letter ? [1.08, 1] : 1 }}
      transition={{ delay: flipDelay, duration: 0.28 }}
      className="grid place-items-center rounded-[22%] border-2 font-black uppercase"
      style={{ width: size, height: size, background: c.bg, borderColor: c.border, color: c.text, fontSize: size * 0.52 }}
    >
      {letter}
    </motion.div>
  );
}

/** Raster mit Versuchen; `letters` fehlt auf dem Fernseher (nur Farben) */
export function Board({ marks, letters, current = '', size, gap = 4, showCurrent = false }: { marks: Mark[][]; letters?: string[]; current?: string; size: number; gap?: number; showCurrent?: boolean }) {
  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: MAX_GUESSES }).map((_, r) => {
        const done = r < marks.length;
        const isCurrent = showCurrent && r === marks.length;
        return (
          <div key={r} className="flex" style={{ gap }}>
            {Array.from({ length: WORD_LENGTH }).map((_, c) => (
              <Tile
                key={`${r}-${c}-${done ? 'd' : 'o'}`}
                size={size}
                mark={done ? marks[r]![c] : undefined}
                letter={done ? letters?.[r]?.[c] : isCurrent ? current[c] : undefined}
                typing={isCurrent}
                flipDelay={done ? c * 0.12 : 0}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
