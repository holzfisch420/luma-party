import { Clock, Users } from 'lucide-react';
import type { GameMeta } from '../../shared/types/game';

export function GameMetaChips({ meta }: { meta: GameMeta }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-home-muted">
      <span className="flex items-center gap-1.5 rounded-full border border-home-line bg-white px-3 py-1.5">
        <Users className="size-4 text-cyan" /> {meta.minPlayers}–{meta.maxPlayers} Spieler
      </span>
      <span className="flex items-center gap-1.5 rounded-full border border-home-line bg-white px-3 py-1.5">
        <Clock className="size-4 text-cyan" /> {meta.durationMinutes[0]}–{meta.durationMinutes[1]} Min.
      </span>
      {meta.tags.map((t) => (
        <span key={t} className="rounded-full bg-[#e6eaee] px-3 py-1.5">
          {t}
        </span>
      ))}
    </div>
  );
}
