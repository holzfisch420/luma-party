import type { CoverProps } from '../../game-types';

/** Kachel: Pinnwand mit Notizzetteln, einer davon „ECHT!“ */
export function EchtCover({ focused }: CoverProps) {
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label="Echt jetzt?">
      <defs>
        <pattern id="ej-cork" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#c38a52" />
          <circle cx="2" cy="2" r="0.9" fill="#9a6532" />
          <circle cx="6" cy="5" r="0.7" fill="#e0b083" />
        </pattern>
        <radialGradient id="ej-pin" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ff9a9a" />
          <stop offset="0.6" stopColor="#d62828" />
          <stop offset="1" stopColor="#8b0f0f" />
        </radialGradient>
        <filter id="ej-sh" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#4a2408" floodOpacity="0.45" />
        </filter>
      </defs>
      <rect width="200" height="200" fill="url(#ej-cork)" />
      <g filter="url(#ej-sh)">
        <g transform="rotate(-8 60 70)">
          <rect x="22" y="34" width="76" height="68" rx="3" fill="#ffd3e0" />
          <path d="M34 62 q10 -8 20 0 t20 0" stroke="#3b2a1a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M34 78 q8 -6 16 0" stroke="#3b2a1a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
          <circle cx="60" cy="36" r="5" fill="url(#ej-pin)" />
        </g>
        <g transform="rotate(7 140 80)">
          <rect x="104" y="42" width="74" height="66" rx="3" fill="#c8f2d6" />
          <path d="M116 70 q10 -8 20 0 t20 0" stroke="#3b2a1a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
          <circle cx="141" cy="44" r="5" fill="url(#ej-pin)" />
        </g>
        <g transform={`rotate(${focused ? -2 : -4} 100 140)`}>
          <rect x="52" y="106" width="96" height="76" rx="3" fill="#fff3a0" />
          <path d="M66 138 q12 -9 24 0 t24 0 t20 0" stroke="#3b2a1a" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M66 156 q10 -7 20 0 t20 0" stroke="#3b2a1a" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.7" />
          <circle cx="100" cy="108" r="5.5" fill="url(#ej-pin)" />
          <g transform="rotate(-14 128 120)">
            <rect x="104" y="108" width="52" height="20" rx="4" fill="#ffffffcc" stroke="#2b8a3e" strokeWidth="3.5" />
            <text x="130" y="123.5" textAnchor="middle" fontSize="14" fontWeight="900" fill="#2b8a3e" fontFamily="Nunito, sans-serif">ECHT!</text>
          </g>
        </g>
      </g>
    </svg>
  );
}
