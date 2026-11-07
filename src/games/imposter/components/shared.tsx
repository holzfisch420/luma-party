import type { PublicPlayer, RoomSnapshot } from '../../../shared/types/room';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';

export function playerOf(room: RoomSnapshot, id: string | null | undefined): PublicPlayer | undefined {
  return id ? room.players.find((p) => p.id === id) : undefined;
}

export function nameOf(room: RoomSnapshot, id: string | null | undefined): string {
  return playerOf(room, id)?.name ?? '?';
}

export function Avatar({ room, id, size = 'md', dimmed }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; dimmed?: boolean }) {
  const p = playerOf(room, id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#7c3aed'} avatar={p?.avatar} size={size} dimmed={dimmed || (p ? !p.isConnected : true)} />;
}

/** runder Countdown-Ring */
export function TimerRing({ remainingMs, totalMs, size = 64 }: { remainingMs: number; totalMs: number; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const secs = Math.ceil(remainingMs / 1000);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(192,132,252,0.18)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={secs <= 5 ? '#f472b6' : '#c084fc'} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: 'stroke-dashoffset 0.25s linear' }} />
      </svg>
      <span className="font-mystery font-extrabold" style={{ fontSize: size * 0.34 }}>
        {secs}
      </span>
    </div>
  );
}
