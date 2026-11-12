import type { CoverProps } from '../../game-types';

/** Kachel: Vollmond über Dorf, Wolfsaugen im Wald */
export function VollmondCover({ focused }: CoverProps) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="img" aria-label="Vollmond">
      <defs>
        <radialGradient id="vm-sky" cx="65%" cy="20%" r="90%">
          <stop offset="0" stopColor="#3a4280" />
          <stop offset="1" stopColor="#0b1026" />
        </radialGradient>
        <radialGradient id="vm-moon" cx="40%" cy="35%" r="60%">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="1" stopColor="#e3cf86" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#vm-sky)" />
      <circle cx="132" cy="62" r={focused ? 38 : 34} fill="url(#vm-moon)" opacity="0.95" />
      <circle cx="120" cy="52" r="5" fill="#d8c27a" opacity="0.6" />
      <circle cx="142" cy="74" r="7" fill="#d8c27a" opacity="0.5" />
      {/* Wald */}
      <path d="M0 150 L14 112 L28 150 L40 104 L56 150 L70 118 L84 150 L98 108 L112 150 L126 116 L140 150 L156 102 L172 150 L186 114 L200 150 V200 H0Z" fill="#0d1a2a" />
      {/* Dorfhäuser */}
      <g fill="#162238">
        <path d="M20 200 V170 L40 156 L60 170 V200Z" />
        <path d="M130 200 V176 L148 162 L166 176 V200Z" />
      </g>
      <rect x="34" y="176" width="8" height="8" fill="#f3d27a" />
      <rect x="144" y="182" width="7" height="7" fill="#f3d27a" />
      {/* Wolfsaugen */}
      <g fill="#ff5a4e">
        <ellipse cx="88" cy="140" rx="3.4" ry="2" />
        <ellipse cx="99" cy="140" rx="3.4" ry="2" />
      </g>
      {focused && (
        <g fill="#ffd06b">
          <ellipse cx="62" cy="134" rx="2.6" ry="1.6" />
          <ellipse cx="71" cy="134" rx="2.6" ry="1.6" />
        </g>
      )}
    </svg>
  );
}
