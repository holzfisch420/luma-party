import type { CoverProps } from '../../game-types';

/** Kachel: Nebel, Kapuzen-Silhouette mit leuchtenden Augen */
export function ImposterCover({ focused }: CoverProps) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="img" aria-label="Imposter">
      <defs>
        <radialGradient id="imp-bg" cx="50%" cy="85%" r="80%">
          <stop offset="0%" stopColor="#5b21b6" />
          <stop offset="55%" stopColor="#1e0b3a" />
          <stop offset="100%" stopColor="#09050f" />
        </radialGradient>
        <radialGradient id="imp-fog" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
        <filter id="imp-blur"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="imp-glow"><feGaussianBlur stdDeviation="2.5" /></filter>
      </defs>
      <rect width="200" height="200" fill="url(#imp-bg)" />
      <ellipse cx="45" cy="150" rx="70" ry="22" fill="url(#imp-fog)" filter="url(#imp-blur)">
        {focused && <animate attributeName="cx" values="40;60;40" dur="6s" repeatCount="indefinite" />}
      </ellipse>
      <ellipse cx="160" cy="120" rx="60" ry="18" fill="url(#imp-fog)" filter="url(#imp-blur)" opacity="0.8">
        {focused && <animate attributeName="cx" values="165;140;165" dur="7s" repeatCount="indefinite" />}
      </ellipse>
      {/* Kapuze */}
      <path d="M100 38 C70 38 54 64 54 96 C54 128 46 150 34 172 L166 172 C154 150 146 128 146 96 C146 64 130 38 100 38 Z" fill="#05030a" />
      <path d="M100 58 C80 58 70 76 70 98 C70 118 80 132 100 132 C120 132 130 118 130 98 C130 76 120 58 100 58 Z" fill="#000" />
      {/* Augen */}
      <g fill="#e9d5ff">
        <ellipse cx="86" cy="98" rx="7" ry="3.2" filter="url(#imp-glow)" />
        <ellipse cx="114" cy="98" rx="7" ry="3.2" filter="url(#imp-glow)" />
        <ellipse cx="86" cy="98" rx="4.5" ry="1.8" />
        <ellipse cx="114" cy="98" rx="4.5" ry="1.8" />
      </g>
      <text x="100" y="194" textAnchor="middle" fontSize="26" fontWeight="800" fill="#c084fc" fontFamily="Cinzel, Georgia, serif" opacity="0.9">?</text>
      <ellipse cx="100" cy="185" rx="110" ry="20" fill="url(#imp-fog)" filter="url(#imp-blur)" opacity="0.9" />
    </svg>
  );
}
