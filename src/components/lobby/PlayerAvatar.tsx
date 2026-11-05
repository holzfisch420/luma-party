import { initials } from '../../shared/utils/text';

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-24 text-3xl',
};

export function PlayerAvatar({ name, color, size = 'md', dimmed, ring }: { name: string; color: string; size?: keyof typeof SIZES; dimmed?: boolean; ring?: boolean }) {
  return (
    <div
      className={`${SIZES[size]} relative grid shrink-0 place-items-center rounded-full font-bold text-black/80 transition-all duration-300 ${dimmed ? 'opacity-35 grayscale' : ''} ${ring ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : ''}`}
      style={{ background: `linear-gradient(140deg, ${color}, color-mix(in srgb, ${color} 60%, #000))` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
