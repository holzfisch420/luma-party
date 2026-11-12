import type { CoverProps } from '../../game-types';
import { MARK_COLORS } from './shared';

const ROWS: { l: string; m: string }[] = [
  { l: 'KRAFT', m: 'xyxxg' },
  { l: 'STEIN', m: 'xgxxx' },
  { l: 'WURST', m: 'ggggg' },
];

/** Kachel: drei Zeilen Raster mit Farbhinweisen */
export function WortCover({ focused }: CoverProps) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="img" aria-label="Wortknacker">
      <defs>
        <radialGradient id="wk-bg" cx="50%" cy="0%" r="110%">
          <stop offset="0" stopColor="#2c4a7a" />
          <stop offset="1" stopColor="#111a30" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#wk-bg)" />
      {ROWS.map((row, r) =>
        [...row.l].map((ch, c) => {
          const mk = (row.m[c] ?? 'x') as 'g' | 'y' | 'x';
          const solved = r === 2 && focused;
          const color = r === 2 ? (focused ? MARK_COLORS.g.bg : 'transparent') : MARK_COLORS[mk].bg;
          return (
            <g key={`${r}-${c}`}>
              <rect x={22 + c * 32} y={38 + r * 42} width="28" height="36" rx="6" fill={color} stroke={r === 2 && !solved ? 'rgba(255,255,255,0.5)' : 'none'} strokeWidth="2" />
              <text x={36 + c * 32} y={63 + r * 42} textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" fontFamily="Nunito, sans-serif">
                {r === 2 && !focused ? (c < 3 ? ch : '') : ch}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
