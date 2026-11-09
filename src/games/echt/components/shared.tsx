import type { ReactNode } from 'react';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import type { RoomSnapshot } from '../../../shared/types/room';
import { PLACEHOLDER } from '../game-config';

export const NOTE_COLORS = ['#fff3a0', '#ffd3e0', '#c8f2d6', '#cde6ff', '#ffe0b2', '#e4d4ff', '#f0f4c3', '#ffcdd2'] as const;
export const LETTERS = 'ABCDEFGHIJKLMNOP';

export function nameOf(room: RoomSnapshot, id: string | null | undefined) {
  return room.players.find((p) => p.id === id)?.name ?? '?';
}

export function Avatar({ room, id, size = 'md' }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const p = room.players.find((x) => x.id === id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#e8590c'} avatar={p?.avatar} size={size} dimmed={p ? !p.isConnected : true} />;
}

/** Satz mit hervorgehobenem Platzhalter (oder eingesetzter Antwort) */
export function Statement({ text, fill, className = '' }: { text: string; fill?: string; className?: string }) {
  const [before, after] = text.split('___');
  return (
    <span className={className}>
      {before}
      <span className={`mx-0.5 inline-block -rotate-1 rounded-md px-2 font-black ${fill ? 'bg-[#ffe066] text-[#7a3c00]' : 'bg-[#e8590c] tracking-wider text-white'}`}>{fill ?? PLACEHOLDER}</span>
      {after}
    </span>
  );
}

/** Notizzettel mit Pin */
export function Sticky({ color, rotate = 0, children, className = '', pin = true }: { color: string; rotate?: number; children: ReactNode; className?: string; pin?: boolean }) {
  return (
    <div className={`sticky relative rounded-[3px] ${className}`} style={{ background: color, transform: `rotate(${rotate}deg)` }}>
      {pin && (
        <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full shadow-[0_3px_3px_rgba(0,0,0,0.35)]" style={{ background: 'radial-gradient(circle at 35% 30%, #ff9a9a, #d62828 60%, #8b0f0f)' }} />
      )}
      {children}
    </div>
  );
}

/** leicht schiefe Drehung je Zettel – stabil pro Kennung */
export function tilt(seed: string, max = 3) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 100) / 100) * max * 2 - max;
}
