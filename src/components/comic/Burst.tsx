import type { ReactNode } from 'react';

function starPoints(spikes: number, outer: number, inner: number, jitter = 0.08) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0 ? outer : inner) * (1 + (Math.sin(i * 12.9898) * jitter));
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

/** Comic-Explosionsstern („BÄM!“) mit Text in der Mitte. */
export function Burst({ children, color = '#ffd93b', spikes = 14, className = '' }: { children: ReactNode; color?: string; spikes?: number; className?: string }) {
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <polygon points={starPoints(spikes, 50, 36)} fill="#161616" transform="translate(3 3)" />
        <polygon points={starPoints(spikes, 50, 36)} fill={color} stroke="#161616" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative px-[20%] py-[12%] text-center">{children}</div>
    </div>
  );
}
