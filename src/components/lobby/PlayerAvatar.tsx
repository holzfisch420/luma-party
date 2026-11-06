import { initials } from '../../shared/utils/text';

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-24 text-3xl',
};

/**
 * Avatar mit Initialen. `variant="home"` für den Launcher (weicher Rand),
 * `variant="comic"` für Spiele (schwarze Kontur).
 */
export function PlayerAvatar({ name, color, size = 'md', dimmed, variant = 'home' }: { name: string; color: string; size?: keyof typeof SIZES; dimmed?: boolean; variant?: 'home' | 'comic' }) {
  const style =
    variant === 'comic'
      ? 'border-[2.5px] border-ink font-bangers text-ink shadow-[2px_2px_0_#161616]'
      : 'border-2 border-white font-black text-white shadow-[0_3px_8px_-2px_rgba(40,50,70,0.4)] [text-shadow:0_1px_1px_rgba(0,0,0,0.25)]';
  return (
    <div
      className={`${SIZES[size]} ${style} relative grid shrink-0 place-items-center rounded-full transition-all duration-300 ${dimmed ? 'opacity-40 grayscale' : ''}`}
      style={{ background: variant === 'comic' ? color : `linear-gradient(150deg, color-mix(in srgb, ${color} 85%, #fff), color-mix(in srgb, ${color} 80%, #000))` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
