import type { CoverProps } from '../../game-types';

/** Kachel: Huhn springt über einen Polizisten, Blaulicht im Hintergrund */
export function HuhnCover({ focused }: CoverProps) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="size-full" role="img" aria-label="Hühnerjagd">
      <defs>
        <linearGradient id="hj-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ec8f7" />
          <stop offset="1" stopColor="#e3f4ff" />
        </linearGradient>
        <radialGradient id="hj-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#hj-sky)" />
      <path d="M0 140 Q50 112 100 140 T200 136 V200 H0 Z" fill="#9ed67a" />
      <rect y="150" width="200" height="50" fill="#6b7178" />
      {[10, 60, 110, 160].map((x) => (
        <rect key={x} x={x} y="172" width="26" height="4" rx="2" fill="#f4f4f4" />
      ))}
      {/* Polizist */}
      <g transform="translate(118 92)">
        <circle cx="30" cy="-12" r="30" fill="url(#hj-blue)">
          {focused && <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />}
        </circle>
        <line x1="22" y1="40" x2="16" y2="60" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <line x1="30" y1="40" x2="38" y2="60" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <rect x="12" y="8" width="30" height="36" rx="8" fill="#2563eb" />
        <line x1="18" y1="16" x2="-6" y2="22" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" />
        <circle cx="-8" cy="22" r="4" fill="#f1c27d" />
        <circle cx="27" cy="-2" r="11" fill="#f1c27d" />
        <ellipse cx="21" cy="3" rx="6" ry="2.4" fill="#5b3a1e" />
        <circle cx="22" cy="-4" r="1.8" fill="#1f2937" />
        <rect x="15" y="-17" width="24" height="9" rx="3" fill="#1e3a8a" />
        <rect x="10" y="-10" width="16" height="3" rx="1.5" fill="#111827" />
        <circle cx="27" cy="-13" r="2.4" fill="#facc15" />
      </g>
      {/* Huhn im Sprung */}
      <g>
        {focused && <animateTransform attributeName="transform" type="translate" values="0 0; 4 -12; 0 0" dur="0.9s" repeatCount="indefinite" />}
      <g transform="translate(36 52) rotate(-12)">
        <path d="M14 44 L2 28 L8 44 L0 48 Z" fill="#d9cfbb" />
        <ellipse cx="40" cy="56" rx="30" ry="22" fill="#fbf7ee" />
        <ellipse cx="34" cy="54" rx="16" ry="8" fill="#d9cfbb" transform="rotate(-30 34 54)" />
        <circle cx="64" cy="32" r="14" fill="#fbf7ee" />
        <circle cx="58" cy="17" r="5" fill="#ef4444" />
        <circle cx="65" cy="15" r="5.5" fill="#ef4444" />
        <circle cx="72" cy="18" r="4.5" fill="#ef4444" />
        <path d="M76 30 L90 34 L76 39 Z" fill="#f59e0b" />
        <circle cx="68" cy="29" r="3.2" fill="#1f2937" />
        <line x1="36" y1="76" x2="30" y2="86" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        <line x1="46" y1="76" x2="44" y2="88" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
      </g>
      </g>
    </svg>
  );
}
