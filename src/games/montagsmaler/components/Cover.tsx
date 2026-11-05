import type { CoverProps } from '../../game-types';

/** Eigenes, gezeichnetes Cover für Montagsmaler. */
export function MontagsmalerCover({ meta, focused }: CoverProps) {
  const { from, via, to } = meta.theme;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(130deg, ${from}, ${via} 50%, ${to})` }}>
      <div className="absolute -left-[10%] -top-[30%] size-[70%] rounded-full bg-white/20 blur-3xl" />
      <svg viewBox="0 0 400 250" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="mm-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* Zeichenblatt */}
        <g filter="url(#mm-shadow)" style={{ transition: 'transform 0.8s cubic-bezier(.2,.8,.2,1)', transformOrigin: '290px 120px', transform: focused ? 'rotate(-4deg) scale(1.04)' : 'rotate(-1deg)' }}>
          <rect x="205" y="38" width="170" height="160" rx="16" fill="#fff" />
          {/* Gekritzel: Haus, Sonne, Wolke */}
          <path d="M240 160 L240 118 L268 92 L296 118 L296 160 Z" fill="none" stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <rect x="259" y="132" width="18" height="28" rx="3" fill="none" stroke="#ff5a7a" strokeWidth="5" />
          <circle cx="335" cy="78" r="16" fill="none" stroke="#ffb020" strokeWidth="5" />
          <path d="M335 52 v-8 M335 112 v-8 M361 78 h8 M301 78 h8" stroke="#ffb020" strokeWidth="5" strokeLinecap="round" />
          <path d="M226 176 q40 -14 80 0 t70 0" fill="none" stroke="#2f9e44" strokeWidth="5" strokeLinecap="round" />
        </g>
        {/* Stift */}
        <g style={{ transition: 'transform 0.9s cubic-bezier(.2,.8,.2,1)', transform: focused ? 'translate(-6px,-10px) rotate(-4deg)' : 'translate(0,0)' }}>
          <g transform="translate(300 150) rotate(35)" filter="url(#mm-shadow)">
            <rect x="0" y="-9" width="110" height="18" rx="4" fill="#ffd43b" />
            <rect x="92" y="-9" width="18" height="18" rx="3" fill="#ff8fab" />
            <path d="M0 -9 L-22 0 L0 9 Z" fill="#f4d3a1" />
            <path d="M-14 -3.5 L-22 0 L-14 3.5 Z" fill="#111" />
          </g>
        </g>
      </svg>
      <div className="absolute bottom-[9%] left-[7%] max-w-[50%]">
        <div className="mb-1 text-[clamp(0.6rem,0.9vw,0.85rem)] font-semibold uppercase tracking-[0.2em] text-white/80">Zeichnen &amp; Raten</div>
        <div className="text-[clamp(1.4rem,3vw,3rem)] font-bold leading-[0.95] tracking-tight text-white drop-shadow-lg">Montags&shy;maler</div>
      </div>
    </div>
  );
}
