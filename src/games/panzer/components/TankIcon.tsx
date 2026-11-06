import { TANK_COLORS } from '../game-config';

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Panzer in Draufsicht als SVG (für HUD, Farbwahl, Rangliste). */
export function TankIcon({ color, className = '', angle = -90, dead }: { color: number; className?: string; angle?: number; dead?: boolean }) {
  const hex = TANK_COLORS[color]?.hex ?? '#888';
  return (
    <svg viewBox="-50 -50 100 100" className={`${className} ${dead ? 'opacity-35 grayscale' : ''}`} aria-hidden>
      <g transform={`rotate(${angle})`} stroke="#161616" strokeWidth="5" strokeLinejoin="round">
        <rect x="-37" y="-35" width="74" height="18" rx="6" fill="#2b2b2b" />
        <rect x="-37" y="17" width="74" height="18" rx="6" fill="#2b2b2b" />
        <rect x="-32" y="-22" width="62" height="44" rx="8" fill={hex} />
        <rect x="2" y="-5.5" width="46" height="11" rx="3" fill={shade(hex, -0.3)} />
        <circle r="17" fill={shade(hex, 0.18)} />
      </g>
    </svg>
  );
}
