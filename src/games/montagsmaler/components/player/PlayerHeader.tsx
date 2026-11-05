import type { ReactNode } from 'react';
import { Countdown } from '../../../../components/ui/Countdown';
import type { MontagsmalerPublicState } from '../../types';

export function PlayerHeader({ state, right, children }: { state: MontagsmalerPublicState; right?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-4 pb-2 safe-pt">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Runde {state.round}/{state.totalRounds}
        </div>
        {children}
      </div>
      {right}
      {state.phase !== 'reveal' && <Countdown endsAt={state.phaseEndsAt} durationMs={state.phaseDurationMs} size={52} stroke={5} />}
    </header>
  );
}
