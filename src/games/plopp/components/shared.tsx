import { useEffect, useState } from 'react';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import { useSession } from '../../../app/session/session-store';
import type { RoomSnapshot } from '../../../shared/types/room';
import type { PloppPublicState } from '../types';

export function nameOf(room: RoomSnapshot, id: string | null | undefined) {
  return room.players.find((p) => p.id === id)?.name ?? '?';
}

export function Avatar({ room, id, size = 'md' }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const p = room.players.find((x) => x.id === id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#1576a8'} avatar={p?.avatar} size={size} dimmed={p ? !p.isConnected : true} />;
}

/**
 * Wie prall der Fisch ist (0–1). Gemessen an der längsten möglichen Zündschnur –
 * verrät also nicht, wann er wirklich platzt.
 */
export function useTension(fuse: PloppPublicState['fuse']): number {
  const offset = useSession((s) => s.clockOffset);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!fuse) {
      setT(0);
      return;
    }
    // nur in kleinen Stufen aktualisieren (≈ 6× pro Sekunde) – sonst rechnet die ganze Ansicht jedes Bild neu
    let timer: ReturnType<typeof setTimeout>;
    let last = -1;
    const loop = () => {
      const now = fuse.pausedAt ?? Date.now() + offset;
      const v = Math.min(1, Math.max(0, (now - fuse.startedAt - fuse.pausedMs) / fuse.max));
      const q = Math.round(v * 120) / 120;
      if (q !== last) {
        last = q;
        setT(q);
      }
      if (fuse.pausedAt === null) timer = setTimeout(loop, 160);
    };
    loop();
    return () => clearTimeout(timer);
  }, [fuse, offset]);
  return t;
}

/** Leben als kleine Luftblasen */
export function Lives({ left, max, size = 14 }: { left: number; max: number; size?: number }) {
  return (
    <span className="inline-flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="rounded-full border-2"
          style={{
            width: size,
            height: size,
            borderColor: i < left ? '#ffffff' : 'rgba(255,255,255,0.3)',
            background: i < left ? 'radial-gradient(circle at 35% 30%, #fff, #7fe3ff 45%, #1aa6d6)' : 'transparent',
          }}
        />
      ))}
    </span>
  );
}

/**
 * Kugelfisch als SVG. `tension` 0–1: wird runder, Stacheln länger, Backen röter.
 * `popped` zeigt die Explosion.
 */
export function Puffer({ tension = 0, popped = false, size = 300, className = '' }: { tension?: number; popped?: boolean; size?: number; className?: string }) {
  const t = Math.min(1, Math.max(0, tension));
  if (popped)
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} className={className} aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <path key={i} d={`M${100 + Math.cos(a) * 30} ${100 + Math.sin(a) * 30} L${100 + Math.cos(a + 0.12) * 92} ${100 + Math.sin(a + 0.12) * 92} L${100 + Math.cos(a - 0.1) * 70} ${100 + Math.sin(a - 0.1) * 70}Z`} fill={i % 2 ? '#ffd23f' : '#ff8a3d'} />;
        })}
        <circle cx="100" cy="100" r="42" fill="#fff6c8" />
        <text x="100" y="114" textAnchor="middle" fontSize="38" fontWeight="900" fill="#e8590c" fontFamily="Nunito, sans-serif">
          PLOPP!
        </text>
      </svg>
    );
  const rx = 52 + t * 22;
  const ry = 40 + t * 34;
  const spikes = 18;
  const spikeLen = 4 + t * 16;
  const cheek = `rgba(255, 80, 80, ${0.15 + t * 0.6})`;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id="pf-body" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="0.55" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#f29e0c" />
        </radialGradient>
        <radialGradient id="pf-belly" cx="50%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fff1c4" />
        </radialGradient>
      </defs>
      {/* Schwanz */}
      <path d={`M${100 - rx + 6} 100 L${100 - rx - 26} ${78 - t * 4} Q${100 - rx - 16} 100 ${100 - rx - 26} ${122 + t * 4}Z`} fill="#f29e0c" stroke="#c46d00" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Stacheln */}
      {Array.from({ length: spikes }).map((_, i) => {
        const a = (i / spikes) * Math.PI * 2;
        const x = 100 + Math.cos(a) * rx * 0.96;
        const y = 100 + Math.sin(a) * ry * 0.96;
        const ox = 100 + Math.cos(a) * (rx + spikeLen);
        const oy = 100 + Math.sin(a) * (ry + spikeLen);
        const px = -Math.sin(a) * 4;
        const py = Math.cos(a) * 4;
        return <path key={i} d={`M${x + px} ${y + py} L${ox} ${oy} L${x - px} ${y - py}Z`} fill="#e08a00" />;
      })}
      {/* Körper */}
      <ellipse cx="100" cy="100" rx={rx} ry={ry} fill="url(#pf-body)" stroke="#c46d00" strokeWidth="3" />
      <ellipse cx="102" cy={100 + ry * 0.38} rx={rx * 0.72} ry={ry * 0.5} fill="url(#pf-belly)" opacity="0.9" />
      {/* Punkte */}
      {[
        [-0.35, -0.55],
        [0.05, -0.7],
        [-0.6, -0.2],
        [0.4, -0.5],
      ].map(([dx, dy], i) => (
        <circle key={i} cx={100 + dx! * rx} cy={100 + dy! * ry} r={3 + t * 1.5} fill="#c46d00" opacity="0.45" />
      ))}
      {/* Flosse */}
      <path d={`M${96} ${106} q${-14} ${10} ${-4} ${22} q${8} ${-4} ${14} ${-14}Z`} fill="#ffb02e" stroke="#c46d00" strokeWidth="2" />
      {/* Backe */}
      <ellipse cx={100 + rx * 0.52} cy={100 + ry * 0.12} rx={9 + t * 4} ry={6 + t * 3} fill={cheek} />
      {/* Auge */}
      <circle cx={100 + rx * 0.42} cy={100 - ry * 0.3} r={11 + t * 3} fill="#fff" stroke="#c46d00" strokeWidth="2" />
      <circle cx={100 + rx * 0.46 + t * 2} cy={100 - ry * 0.3} r={5.5 + t * 1.5} fill="#1d2433" />
      <circle cx={100 + rx * 0.49 + t * 2} cy={100 - ry * 0.34} r={1.8} fill="#fff" />
      {/* Schweißtropfen, wenn es eng wird */}
      {t > 0.55 && <path d={`M${100 + rx * 0.1} ${100 - ry - 6} q-5 8 0 11 q5 -3 0 -11Z`} fill="#7fe3ff" opacity={(t - 0.55) * 2} />}
      {/* Mund */}
      <ellipse cx={100 + rx * 0.9} cy={100 + ry * 0.05} rx={4 + t * 2} ry={3 + t * 4} fill="#7a2e00" />
    </svg>
  );
}

/** Unterwasser-Hintergrund mit Lichtstrahlen und Blasen */
export function Ocean() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,#5fd4e8_0%,#1576a8_38%,#0b3d6b_75%,#071f3a_100%)]" />
      <div className="plopp-rays absolute inset-0" />
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="plopp-bubble absolute bottom-[-40px] rounded-full border border-white/50 bg-white/10"
          style={{ left: `${(i * 61) % 100}%`, width: 8 + ((i * 7) % 22), height: 8 + ((i * 7) % 22), animationDelay: `${(i * 1.7) % 9}s`, animationDuration: `${8 + ((i * 3) % 7)}s` }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[radial-gradient(ellipse_at_50%_100%,#d9b76a_0%,#a8843f_45%,transparent_72%)] opacity-60" />
    </div>
  );
}

export const PACK_COLORS: Record<string, string> = {
  alltag: '#ffb02e',
  essen: '#ff7a59',
  welt: '#4cc38a',
  natur: '#7ed957',
  pop: '#b583ff',
  musik: '#ff5fa2',
  sport: '#3fc1ff',
  szene: '#9be15d',
};
