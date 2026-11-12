import type { CoverProps } from '../../game-types';
import { Puffer } from './shared';

/** Kachel: Kugelfisch unter Wasser mit Antwort-Blasen */
export function PloppCover({ focused }: CoverProps) {
  return (
    <div className="relative size-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#5fd4e8_0%,#1576a8_45%,#0b3d6b_100%)]" role="img" aria-label="Plopp!">
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <path d="M0 175 Q50 160 100 172 T200 168 V200 H0Z" fill="#d9b76a" opacity="0.8" />
        <path d="M20 200 q-6 -30 6 -52 q4 22 -2 52Z M34 200 q4 -24 -4 -40 q10 12 10 40Z" fill="#2fbf71" />
        <path d="M168 200 q-4 -34 8 -58 q2 28 -2 58Z" fill="#2fbf71" />
        {[
          [36, 46, 7],
          [52, 24, 4],
          [160, 40, 9],
          [176, 70, 5],
          [146, 18, 4],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <Puffer tension={focused ? 0.85 : 0.5} size={200} className="size-[86%]" />
      </div>
    </div>
  );
}
