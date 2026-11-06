import type { CoverProps } from '../../game-types';

/** Quadratische Kachel-Grafik: Karopapier mit Kritzelei und Stift. */
export function MontagsmalerCover({ focused }: CoverProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#fcfcf7]">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <pattern id="mm-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="#a9d9ee" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#mm-grid)" />
        <line x1="0" y1="34" x2="200" y2="34" stroke="#e2565c" strokeWidth="2" />
        {/* Kritzel-Haus */}
        <g fill="none" stroke="#161616" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M44 160 L44 104 L86 66 L128 104 L128 160 Z" />
          <path d="M74 160 L74 128 L98 128 L98 160" stroke="#ff4b4b" />
        </g>
        <circle cx="156" cy="66" r="16" fill="#ffd93b" stroke="#161616" strokeWidth="6" />
        <path d="M24 176 q40 -14 80 0 t80 0" fill="none" stroke="#3fd07a" strokeWidth="7" strokeLinecap="round" />
        {/* Stift */}
        <g style={{ transition: 'transform .6s cubic-bezier(.2,.8,.2,1)', transformOrigin: '150px 140px', transform: focused ? 'rotate(-10deg) translate(-4px,-6px)' : 'none' }}>
          <g transform="translate(118 118) rotate(40)">
            <rect x="0" y="-10" width="80" height="20" rx="4" fill="#ffd93b" stroke="#161616" strokeWidth="5" />
            <rect x="62" y="-10" width="18" height="20" rx="3" fill="#ff7ab8" stroke="#161616" strokeWidth="5" />
            <path d="M0 -10 L-24 0 L0 10 Z" fill="#f4d3a1" stroke="#161616" strokeWidth="5" strokeLinejoin="round" />
            <path d="M-15 -4 L-24 0 L-15 4 Z" fill="#161616" />
          </g>
        </g>
      </svg>
    </div>
  );
}
