import type { CoverProps } from '../../game-types';
import { MillBoard } from './MillBoard';
import type { Cell } from '../logic/rules';

const BOARD: Cell[] = ['w', 'w', 'w', null, 'b', null, null, null, 'b', 'b', null, null, null, null, 'w', null, null, 'b', null, null, null, 'b', null, null];

export function MuehleCover({ focused }: CoverProps) {
  return (
    <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_50%_30%,#7a4a24,#2b170a)]">
      <MillBoard board={BOARD} className={`w-[86%] transition-transform duration-500 ${focused ? 'rotate-[-4deg] scale-105' : ''}`} />
    </div>
  );
}
