import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { GameMeta } from '../../shared/types/game';
import { GameCover } from './GameCover';

interface GameCardProps {
  meta: GameMeta;
  focused: boolean;
  onClick?: () => void;
  className?: string;
}

/** Großes Game-Cover mit Apple-TV-ähnlichem Parallax-Tilt und Glanzeffekt. */
export function GameCard({ meta, focused, onClick, className = '' }: GameCardProps) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 220, damping: 20 });
  const shineX = useTransform(mx, [0, 1], ['0%', '100%']);
  const shineY = useTransform(my, [0, 1], ['0%', '100%']);
  const shine = useTransform([shineX, shineY], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.35), transparent 55%)`);

  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!focused) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };
  const reset = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const comingSoon = meta.status === 'coming-soon';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      aria-label={`${meta.name}${comingSoon ? ' (bald verfügbar)' : ''}`}
      aria-current={focused}
      tabIndex={-1}
      style={{ rotateX: focused ? rotateX : 0, rotateY: focused ? rotateY : 0, transformPerspective: 1100 }}
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-[28px] text-left outline-none ${className}`}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ filter: focused ? 'saturate(1.1) brightness(1)' : comingSoon ? 'saturate(0.5) brightness(0.55)' : 'saturate(0.85) brightness(0.7)' }}
        transition={{ duration: 0.5 }}
      >
        <GameCover meta={meta} focused={focused} />
      </motion.div>
      {focused && <motion.div className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: shine }} />}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/15" />
      {comingSoon && (
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
          <Lock className="size-3" /> Bald verfügbar
        </div>
      )}
    </motion.button>
  );
}
