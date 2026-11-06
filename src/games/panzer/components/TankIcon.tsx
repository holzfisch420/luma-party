import { TANK_COLORS } from '../game-config';

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Panzer in Draufsicht – flach, ohne Konturen. */
export function TankIcon({ color, className = '', angle = -90, dead }: { color: number; className?: string; angle?: number; dead?: boolean }) {
  const hex = TANK_COLORS[color]?.hex ?? '#888888';
  return (
    <svg viewBox="-50 -50 100 100" className={`${className} ${dead ? 'opacity-35 grayscale' : ''}`} aria-hidden>
      <g transform={`rotate(${angle})`}>
        <rect x="-38" y="-35" width="76" height="20" rx="8" fill="#4a4f55" />
        <rect x="-38" y="15" width="76" height="20" rx="8" fill="#4a4f55" />
        <rect x="-32" y="-21" width="62" height="42" rx="10" fill={shade(hex, -0.12)} />
        <rect x="-32" y="-21" width="62" height="34" rx="10" fill={hex} />
        <rect x="4" y="-6" width="46" height="12" rx="5" fill={shade(hex, -0.28)} />
        <circle r="17" cy="2" fill={shade(hex, -0.12)} />
        <circle r="17" fill={shade(hex, 0.22)} />
      </g>
    </svg>
  );
}
