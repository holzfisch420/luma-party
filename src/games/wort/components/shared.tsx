import { motion } from 'framer-motion';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import type { RoomSnapshot } from '../../../shared/types/room';
import { MAX_GUESSES, WORD_LENGTH } from '../game-config';
import type { Mark } from '../types';

/** Farben wie gedruckte Stempel auf Zeitungspapier */
export const MARK_COLORS: Record<Mark | 'empty' | 'typing', { bg: string; border: string; text: string }> = {
  g: { bg: '#2f7d4f', border: '#1f5a37', text: '#f6efdc' },
  y: { bg: '#d9a21b', border: '#a87a0e', text: '#2a241c' },
  x: { bg: '#4a4540', border: '#2a241c', text: '#f6efdc' },
  empty: { bg: 'rgba(255,255,255,0.35)', border: 'rgba(42,36,28,0.35)', text: '#2a241c' },
  typing: { bg: '#fffaf0', border: '#2a241c', text: '#2a241c' },
};

/** kleine, feste Schiefstellung je Feld – wirkt wie von Hand gestempelt */
const tilt = (r: number, c: number) => (((r * 7 + c * 13) % 5) - 2) * 0.6;

export function nameOf(room: RoomSnapshot, id: string | null | undefined) {
  return room.players.find((p) => p.id === id)?.name ?? '?';
}

export function Avatar({ room, id, size = 'md' }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const p = room.players.find((x) => x.id === id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#2fb67c'} avatar={p?.avatar} size={size} dimmed={p ? !p.isConnected : true} />;
}

/** ein Feld; mit `flip` dreht es sich beim Aufdecken */
export function Tile({ letter, mark, size, flipDelay = 0, typing = false, rot = 0 }: { letter?: string; mark?: Mark; size: number; flipDelay?: number; typing?: boolean; rot?: number }) {
  const c = MARK_COLORS[mark ?? (typing && letter ? 'typing' : 'empty')];
  return (
    <motion.div
      initial={mark ? { rotateX: 90 } : false}
      animate={{ rotateX: 0, scale: typing && letter ? [1.12, 1] : 1, rotate: mark ? rot : 0 }}
      transition={{ delay: flipDelay, duration: 0.28 }}
      className="grid place-items-center rounded-[10%] font-typewriter uppercase"
      style={{
        width: size,
        height: size,
        background: c.bg,
        color: c.text,
        fontSize: size * 0.6,
        border: `${Math.max(1.5, size * 0.05)}px solid ${c.border}`,
        boxShadow: mark ? `inset 0 0 ${size * 0.25}px rgba(0,0,0,0.25), 1px 2px 0 rgba(42,36,28,0.25)` : 'none',
        borderStyle: mark || (typing && letter) ? 'solid' : 'dashed',
      }}
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
                rot={tilt(r, c)}
                flipDelay={done ? c * 0.12 : 0}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
