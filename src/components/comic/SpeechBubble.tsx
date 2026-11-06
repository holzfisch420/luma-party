import type { ReactNode } from 'react';

/** Comic-Sprechblase mit Schwänzchen nach links oder rechts unten. */
export function SpeechBubble({ children, side = 'left', tone = 'white', className = '' }: { children: ReactNode; side?: 'left' | 'right'; tone?: 'white' | 'yellow' | 'green'; className?: string }) {
  const bg = { white: '#ffffff', yellow: '#ffd93b', green: '#7dea9f' }[tone];
  return (
    <div className={`relative ${className}`}>
      <div className="relative z-10 rounded-[22px] border-[3px] border-ink px-4 py-2.5 shadow-[4px_4px_0_#161616]" style={{ background: bg }}>
        {children}
      </div>
      {/* Schwänzchen */}
      <svg
        viewBox="0 0 40 30"
        className={`absolute -bottom-[22px] z-20 h-[26px] w-[34px] ${side === 'left' ? 'left-5' : 'right-5 -scale-x-100'}`}
        aria-hidden
      >
        <path d="M2 0 L10 0 L4 28 Z" fill="#161616" transform="translate(3 1)" />
        <path d="M0 -2 L18 -2 L4 26 Z" fill={bg} stroke="#161616" strokeWidth="3" strokeLinejoin="round" />
        <rect x="1.6" y="-4" width="15" height="3.4" fill={bg} />
      </svg>
    </div>
  );
}
