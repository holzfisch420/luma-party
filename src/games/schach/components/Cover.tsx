import type { CoverProps } from '../../game-types';
import { Piece } from './pieces';

/** Kachel: Brettausschnitt mit Springer und König */
export function SchachCover({ focused }: CoverProps) {
  return (
    <div className="relative size-full overflow-hidden bg-[#302e2b]">
      <div className="absolute inset-[-10%] grid rotate-[-8deg] grid-cols-5 grid-rows-5">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} style={{ background: (Math.floor(i / 5) + i) % 2 ? '#769656' : '#eeeed2' }} />
        ))}
      </div>
      <div className={`absolute bottom-[10%] left-[12%] w-[42%] transition-transform duration-500 ${focused ? '-translate-y-[6%] -rotate-6' : ''}`}>
        <Piece type="n" color="w" className="w-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)]" />
      </div>
      <div className="absolute bottom-[14%] right-[10%] w-[40%]">
        <Piece type="k" color="b" className="w-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)]" />
      </div>
    </div>
  );
}
