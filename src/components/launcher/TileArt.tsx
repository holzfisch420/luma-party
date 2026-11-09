import { Sparkles } from 'lucide-react';
import type { CoverProps } from '../../games/game-types';
import { getClientGame } from '../../games/game-registry';

/** Generische, quadratische Kachel-Grafik aus den Theme-Farben eines Spiels. */
export function GenericTileArt({ meta, focused }: CoverProps) {
  const Icon = Sparkles;
  const { from, via, to } = meta.theme;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(145deg, ${from}, ${via ?? from} 55%, ${to})` }}>
      <div className="absolute -left-1/4 -top-1/3 size-[90%] rounded-full bg-white/25 blur-xl" />
      <Icon
        className="absolute left-1/2 top-1/2 size-[55%] text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] transition-transform duration-500"
        strokeWidth={1.75}
        style={{ transform: `translate(-50%,-50%) rotate(${focused ? -8 : 0}deg) scale(${focused ? 1.08 : 1})` }}
      />
    </div>
  );
}

export function TileArt(props: CoverProps) {
  const Art = getClientGame(props.meta.id)?.Cover ?? GenericTileArt;
  return <Art {...props} />;
}
