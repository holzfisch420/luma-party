import type { AvatarConfig } from '../../shared/avatar';
import { initials } from '../../shared/utils/text';
import { AvatarFace, avatarBackground } from '../avatar/AvatarFace';

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-24 text-3xl',
};

/**
 * Runder Spieler-Avatar: eigene Figur (Konto) oder Initialen (Gast).
 * `variant="home"` für den Launcher (weicher Rand), `variant="comic"` für Spiele (schwarze Kontur).
 */
export function PlayerAvatar({
  name,
  color,
  avatar,
  size = 'md',
  dimmed,
  variant = 'home',
}: {
  name: string;
  color: string;
  avatar?: AvatarConfig | null;
  size?: keyof typeof SIZES;
  dimmed?: boolean;
  variant?: 'home' | 'comic';
}) {
  const frame =
    variant === 'comic'
      ? 'border-[2.5px] border-ink shadow-[2px_2px_0_#161616]'
      : 'border-2 border-white shadow-[0_3px_8px_-2px_rgba(40,50,70,0.4)]';
  const state = dimmed ? 'opacity-40 grayscale' : '';

  if (avatar) {
    return (
      <div className={`${SIZES[size]} ${frame} ${state} relative shrink-0 overflow-hidden rounded-full transition-all duration-300`} style={{ background: avatarBackground(avatar) }} aria-hidden>
        <AvatarFace avatar={avatar} look={variant} crop="bust" className="absolute inset-0 size-full" title={name} />
      </div>
    );
  }

  const text = variant === 'comic' ? 'font-bangers text-ink' : 'font-black text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.25)]';
  return (
    <div
      className={`${SIZES[size]} ${frame} ${text} ${state} relative grid shrink-0 place-items-center rounded-full transition-all duration-300`}
      style={{ background: variant === 'comic' ? color : `linear-gradient(150deg, color-mix(in srgb, ${color} 85%, #fff), color-mix(in srgb, ${color} 80%, #000))` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
