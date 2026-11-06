import type { CoverProps } from '../../game-types';

/** Kachel-Grafik: Panzer mit Reifenspuren im Sand, abprallende Kugel. */
export function PanzerCover({ focused }: CoverProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#ecd9a7]">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
        <rect width="200" height="200" fill="#ecd9a7" />
        {Array.from({ length: 30 }).map((_, i) => (
          <ellipse key={i} cx={(i * 67) % 200} cy={(i * 41) % 200} rx="5" ry="3" fill="#dcc48b" />
        ))}
        {/* Reifenspuren */}
        <g fill="rgba(92,62,30,0.35)">
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i}>
              <rect x={14 + i * 9} y={118 - i * 2.2} width="6" height="5" transform={`rotate(-14 ${17 + i * 9} ${120 - i * 2.2})`} />
              <rect x={18 + i * 9} y={136 - i * 2.2} width="6" height="5" transform={`rotate(-14 ${21 + i * 9} ${138 - i * 2.2})`} />
            </g>
          ))}
        </g>
        {/* Wand */}
        <rect x="150" y="18" width="30" height="80" fill="#c4703f" stroke="#161616" strokeWidth="5" />
        <rect x="154" y="22" width="22" height="68" fill="#de8b55" />
        {/* Kugelbahn mit Abpraller */}
        <path d="M118 104 L150 64 L120 34" fill="none" stroke="#161616" strokeWidth="3" strokeDasharray="6 6" />
        <circle cx="120" cy="34" r="7" fill="#1b1b1b" stroke="#fff" strokeWidth="2.5" />
        {/* Panzer */}
        <g style={{ transformOrigin: '96px 120px', transform: focused ? 'rotate(-4deg) scale(1.05)' : 'none', transition: 'transform .5s cubic-bezier(.2,.8,.2,1)' }}>
          <g transform="translate(96 122) rotate(-52)" stroke="#161616" strokeWidth="5" strokeLinejoin="round">
            <rect x="-44" y="-42" width="88" height="20" rx="7" fill="#2b2b2b" />
            <rect x="-44" y="22" width="88" height="20" rx="7" fill="#2b2b2b" />
            <rect x="-38" y="-27" width="74" height="54" rx="9" fill="#e53935" />
            <rect x="2" y="-7" width="58" height="14" rx="4" fill="#a22a27" />
            <circle r="21" fill="#ef6461" />
          </g>
        </g>
      </svg>
    </div>
  );
}
