import type { CoverProps } from '../../games/game-types';
import { getClientGame } from '../../games/game-registry';
import { DEFAULT_COVER_ICON, FUTURE_GAME_ICONS } from '../../games/future-games/covers';

/** Generisches Cover aus den Theme-Farben eines Spiels. */
export function GenericCover({ meta, focused }: CoverProps) {
  const Icon = FUTURE_GAME_ICONS[meta.id] ?? DEFAULT_COVER_ICON;
  const { from, via, to } = meta.theme;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(135deg, ${from}, ${via ?? from} 55%, ${to})` }}>
      <div className="absolute -right-[12%] -top-[20%] size-[80%] rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-[30%] -left-[10%] size-[70%] rounded-full bg-black/20 blur-3xl" />
      <Icon
        className="absolute right-[8%] top-1/2 size-[46%] -translate-y-1/2 text-white/90 transition-transform duration-700"
        strokeWidth={1.25}
        style={{ transform: `translateY(-50%) rotate(${focused ? -6 : 0}deg) scale(${focused ? 1.06 : 1})` }}
      />
      <div className="absolute bottom-[10%] left-[7%] max-w-[55%]">
        <div className="text-[clamp(1.25rem,2.6vw,2.6rem)] font-bold leading-none tracking-tight text-white drop-shadow">{meta.name}</div>
      </div>
    </div>
  );
}

export function GameCover(props: CoverProps) {
  const Cover = getClientGame(props.meta.id)?.Cover ?? GenericCover;
  return <Cover {...props} />;
}
