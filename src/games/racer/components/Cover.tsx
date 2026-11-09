import type { CoverProps } from '../../game-types';

/** Kachel: Low-Poly-Strecke mit Kurve und zwei Autos */
export function RacerCover({ focused }: CoverProps) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="img" aria-label="Kurvenrausch">
      <defs>
        <linearGradient id="kr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#3ec1f3" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#kr-sky)" />
      <polygon points="0,120 40,92 80,110 120,84 160,104 200,88 200,200 0,200" fill="#2f9e44" />
      <polygon points="0,140 50,118 100,132 150,112 200,126 200,200 0,200" fill="#37b24d" />
      {/* Straße */}
      <path d="M-10 200 C40 170 60 150 110 140 C150 132 170 118 210 110 L210 138 C175 146 155 160 115 168 C70 176 50 190 30 210 Z" fill="#4d5361" />
      <path d="M8 196 C50 172 72 158 112 151 C150 144 172 130 210 124" stroke="#ffd43b" strokeWidth="2.5" strokeDasharray="8 7" fill="none" />
      {/* Autos */}
      <g transform={`translate(${focused ? 92 : 86} 140) rotate(-12)`}>
        <rect x="-16" y="-8" width="32" height="13" rx="3" fill="#ef4444" />
        <rect x="-8" y="-15" width="16" height="8" rx="2" fill="#b91c1c" />
        <rect x="-13" y="3" width="7" height="6" fill="#1f2430" />
        <rect x="6" y="3" width="7" height="6" fill="#1f2430" />
      </g>
      <g transform={`translate(${focused ? 150 : 146} 118) rotate(-10) scale(0.75)`}>
        <rect x="-16" y="-8" width="32" height="13" rx="3" fill="#3b82f6" />
        <rect x="-8" y="-15" width="16" height="8" rx="2" fill="#1e40af" />
        <rect x="-13" y="3" width="7" height="6" fill="#1f2430" />
        <rect x="6" y="3" width="7" height="6" fill="#1f2430" />
      </g>
      <g fill="#ffffff" opacity="0.85">
        {[30, 48, 66].map((x) => (
          <rect key={x} x={x} y={160 - x * 0.2} width="12" height="3" rx="1.5" />
        ))}
      </g>
    </svg>
  );
}
