/** Eigene, flache Schachfiguren als SVG (viewBox 0 0 100 100). */
import type { ReactNode } from 'react';
import type { Side } from '../types';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

const BASE = <rect x="22" y="76" width="56" height="12" rx="5" />;

const SHAPES: Record<PieceType, ReactNode> = {
  p: (
    <>
      <circle cx="50" cy="30" r="13" />
      <path d="M34 76 Q38 50 50 42 Q62 50 66 76 Z" />
      {BASE}
    </>
  ),
  r: (
    <>
      <path d="M27 18 h11 v9 h6 v-9 h12 v9 h6 v-9 h11 v22 h-46 Z" />
      <rect x="33" y="40" width="34" height="36" rx="3" />
      {BASE}
    </>
  ),
  b: (
    <>
      <circle cx="50" cy="15" r="6" />
      <path d="M36 76 Q28 54 50 22 Q72 54 64 76 Z" />
      {BASE}
    </>
  ),
  n: (
    <>
      <path d="M30 76 L70 76 Q73 56 68 40 Q62 22 50 16 L46 8 L41 18 Q29 24 25 42 Q24 50 30 52 L40 46 Q44 52 38 60 Q32 66 30 76 Z" />
      {BASE}
    </>
  ),
  q: (
    <>
      <circle cx="25" cy="28" r="6" />
      <circle cx="40" cy="20" r="6" />
      <circle cx="60" cy="20" r="6" />
      <circle cx="75" cy="28" r="6" />
      <path d="M34 76 L26 34 L40 54 L42 24 L50 50 L58 24 L60 54 L74 34 L66 76 Z" />
      {BASE}
    </>
  ),
  k: (
    <>
      <rect x="46" y="6" width="8" height="26" rx="2" />
      <rect x="37" y="13" width="26" height="8" rx="2" />
      <path d="M33 76 Q26 46 50 36 Q74 46 67 76 Z" />
      {BASE}
    </>
  ),
};

/** Details in Gegenfarbe (Augen, Schlitz, Ringe) */
const DETAILS: Partial<Record<PieceType, ReactNode>> = {
  b: <path d="M45 44 L58 34" strokeWidth="4" strokeLinecap="round" fill="none" />,
  n: <circle cx="44" cy="30" r="3.5" />,
  k: <path d="M36 62 Q50 56 64 62" strokeWidth="3.5" fill="none" />,
  q: <path d="M36 64 Q50 58 64 64" strokeWidth="3.5" fill="none" />,
  r: <path d="M34 48 H66" strokeWidth="3.5" fill="none" />,
};

export function Piece({ type, color, className = '' }: { type: PieceType; color: Side; className?: string }) {
  const white = color === 'w';
  const id = `pg-${color}`;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label={`${white ? 'weiß' : 'schwarz'} ${type}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={white ? '#ffffff' : '#5a5a5a'} />
          <stop offset="1" stopColor={white ? '#d9d3c7' : '#1f1f1f'} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`} stroke={white ? '#3b3b3b' : '#0d0d0d'} strokeWidth="3" strokeLinejoin="round">
        {SHAPES[type]}
      </g>
      <g fill={white ? '#3b3b3b' : '#e8e2d6'} stroke={white ? '#3b3b3b' : '#e8e2d6'}>
        {DETAILS[type]}
      </g>
    </svg>
  );
}
