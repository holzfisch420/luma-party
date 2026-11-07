import type { CoverProps } from '../../game-types';

/** Kachel-Grafik im flachen Stil: Schachbrett-Wiese, Panzer, Reifenspur, fliegende Kugel. */
export function PanzerCover({ focused }: CoverProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#aad751]">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
        {Array.from({ length: 64 }).map((_, i) => (
          <rect key={i} x={(i % 8) * 25} y={Math.floor(i / 8) * 25} width="25" height="25" fill={(i % 8) + Math.floor(i / 8) * 1 === 0 || ((i % 8) + Math.floor(i / 8)) % 2 === 0 ? '#aad751' : '#a2d149'} />
        ))}
        {/* Reifenspuren */}
        <g fill="rgba(70,100,30,0.3)">
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i}>
              <rect x={12 + i * 9} y={122 - i * 2.4} width="6" height="6" transform={`rotate(-14 ${15 + i * 9} ${125 - i * 2.4})`} />
              <rect x={16 + i * 9} y={142 - i * 2.4} width="6" height="6" transform={`rotate(-14 ${19 + i * 9} ${145 - i * 2.4})`} />
            </g>
          ))}
        </g>
        {/* Block */}
        <rect x="150" y="24" width="30" height="78" rx="4" fill="#4a752c" />
        <rect x="150" y="24" width="30" height="72" rx="4" fill="#5c8f37" />
        {/* Kugel mit Leuchtspur */}
        <path d="M120 104 L148 66" stroke="rgba(234,67,53,0.35)" strokeWidth="5" strokeLinecap="round" />
        <path d="M148 66 L124 36" stroke="rgba(234,67,53,0.7)" strokeWidth="7" strokeLinecap="round" />
        <circle cx="148" cy="66" r="4" fill="#fff" />
        <circle cx="124" cy="36" r="10" fill="rgba(234,67,53,0.35)" />
        <circle cx="124" cy="36" r="5.5" fill="#fff" />
        {/* Panzer */}
        <g style={{ transformOrigin: '96px 126px', transform: focused ? 'rotate(-4deg) scale(1.05)' : 'none', transition: 'transform .5s cubic-bezier(.2,.8,.2,1)' }}>
          <ellipse cx="98" cy="134" rx="44" ry="38" fill="rgba(0,0,0,0.15)" />
          <g transform="translate(96 126) rotate(-52)">
            <rect x="-45" y="-42" width="90" height="22" rx="9" fill="#4a4f55" />
            <rect x="-45" y="20" width="90" height="22" rx="9" fill="#4a4f55" />
            <rect x="-38" y="-26" width="74" height="52" rx="12" fill="#c62828" />
            <rect x="-38" y="-26" width="74" height="42" rx="12" fill="#ea4335" />
            <rect x="4" y="-7" width="58" height="14" rx="6" fill="#a52714" />
            <circle r="21" cy="3" fill="#c62828" />
            <circle r="21" fill="#f28b82" />
          </g>
        </g>
      </svg>
    </div>
  );
}
