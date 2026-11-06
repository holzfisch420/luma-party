import type { ReactNode } from 'react';
import { ComicCountdown } from '../../../../components/comic/ComicCountdown';
import type { MontagsmalerPublicState } from '../../types';

export function PlayerHeader({ state, right, children }: { state: MontagsmalerPublicState; right?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-4 pb-2 pt-2">
      <div className="min-w-0 flex-1">
        <div className="font-bangers inline-block -rotate-2 rounded-md border-2 border-ink bg-pop-yellow px-2 text-base leading-tight shadow-[2px_2px_0_#161616]">
          Runde {state.round}/{state.totalRounds}
        </div>
        {children}
      </div>
      {right}
      {state.phase !== 'reveal' && <ComicCountdown endsAt={state.phaseEndsAt} durationMs={state.phaseDurationMs} size={58} />}
    </header>
  );
}
