import type { CoverProps } from '../../game-types';

/** Kachel: drei gefächerte Plakate mit Herz */
export function KinoCover({ focused }: CoverProps) {
  const cards = [
    { c: '#1c7ed6', e: '🚀', r: -14, x: -22 },
    { c: '#f59f00', e: '😂', r: 12, x: 22 },
    { c: '#e8590c', e: '💥', r: 0, x: 0 },
  ];
  return (
    <div className="relative size-full overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#a61e4d,#2b0718)]">
      {cards.map((k, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-[14%] h-[66%] w-[46%] rounded-[14%] border-2 border-white/40 shadow-xl transition-transform duration-500"
          style={{
            background: `linear-gradient(160deg, ${k.c}, #1a0a14)`,
            transform: `translateX(calc(-50% + ${focused ? k.x * 1.5 : k.x}%)) rotate(${focused ? k.r * 1.4 : k.r}deg)`,
          }}
        >
          <div className="grid size-full place-items-center text-[2.6rem]">{k.e}</div>
        </div>
      ))}
      <div className={`absolute bottom-[8%] left-1/2 grid size-[30%] -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-[#ff8fa3] to-[#ff2e63] text-[2rem] text-white shadow-lg transition-transform duration-500 ${focused ? 'scale-110' : ''}`}>
        ♥
      </div>
    </div>
  );
}
