import type { CoverProps } from '../../game-types';

/** Kachel-Grafik: Bühne mit Vorhang, Spotlight und Textzeilen. */
export function TheaterCover({ focused }: CoverProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#160b0e]">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <radialGradient id="th-spot" cx="50%" cy="45%" r="55%">
            <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="th-velvet" x1="0" x2="1">
            <stop offset="0" stopColor="#5b0f1a" />
            <stop offset="0.5" stopColor="#9b1f33" />
            <stop offset="1" stopColor="#5b0f1a" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="#160b0e" />
        <ellipse cx="100" cy="95" rx={focused ? 95 : 85} ry="80" fill="url(#th-spot)" style={{ transition: 'rx .6s' }} />
        {/* Textzeilen */}
        <rect x="58" y="62" width="44" height="9" rx="4.5" fill="#e9b85b" />
        <rect x="58" y="80" width="88" height="10" rx="5" fill="#fbf5ec" />
        <rect x="58" y="96" width="70" height="10" rx="5" fill="#fbf5ec" />
        <rect x="58" y="122" width="36" height="7" rx="3.5" fill="#c9973b" opacity="0.5" />
        <rect x="58" y="136" width="80" height="7" rx="3.5" fill="#fbf5ec" opacity="0.25" />
        {/* Vorhänge */}
        <g style={{ transition: 'transform .6s cubic-bezier(.2,.8,.2,1)', transform: focused ? 'translateX(-8px)' : 'none' }}>
          <path d="M0 0 H46 C40 60 52 130 30 200 H0 Z" fill="url(#th-velvet)" />
        </g>
        <g style={{ transition: 'transform .6s cubic-bezier(.2,.8,.2,1)', transform: focused ? 'translateX(8px)' : 'none' }}>
          <path d="M200 0 H154 C160 60 148 130 170 200 H200 Z" fill="url(#th-velvet)" />
        </g>
        <rect width="200" height="22" fill="url(#th-velvet)" />
        <path d="M0 22 Q25 34 50 22 T100 22 T150 22 T200 22" fill="#7a1022" />
        <rect y="186" width="200" height="14" fill="#3a2418" />
      </svg>
    </div>
  );
}
