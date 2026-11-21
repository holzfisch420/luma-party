import { motion, type TargetAndTransition } from 'framer-motion';
import { avatarFromSeed, type AvatarConfig } from '../../shared/avatar';
import type { EmoteDef } from '../../shared/emotes';
import { AvatarFace, avatarBackground } from '../avatar/AvatarFace';

const ANIMS: Record<EmoteDef['anim'], TargetAndTransition> = {
  bounce: { y: [0, -14, 0, -8, 0], transition: { duration: 0.9, repeat: Infinity } },
  shake: { rotate: [0, -10, 10, -10, 10, 0], transition: { duration: 0.6, repeat: Infinity } },
  jump: { y: [0, -26, 0], scale: [1, 1.08, 1], transition: { duration: 0.55, repeat: Infinity } },
  wiggle: { rotate: [-12, 12], x: [-4, 4], transition: { duration: 0.35, repeat: Infinity, repeatType: 'reverse' } },
  pop: { scale: [1, 1.25, 1], transition: { duration: 0.7, repeat: Infinity } },
  sway: { rotate: [-8, 8], transition: { duration: 1.1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
  spin: { rotate: [0, 360], transition: { duration: 1.2, repeat: Infinity, ease: 'linear' } },
  nod: { y: [0, 6, 0], rotate: [0, 6, 0], transition: { duration: 0.5, repeat: Infinity } },
};

/** eigener Avatar, der ein Emote „spielt“ (Gesicht + Bewegung + kleine Teilchen) */
export function EmoteAvatar({ avatar, seed, emote, size = 96, still }: { avatar?: AvatarConfig | null; seed: string; emote: EmoteDef; size?: number; still?: boolean }) {
  const base = avatar ?? avatarFromSeed(seed);
  const face = { ...base, ...emote.face };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div animate={still ? undefined : ANIMS[emote.anim]} className="relative size-full overflow-hidden rounded-full border-[3px] border-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.5)]" style={{ background: avatarBackground(face) }}>
        <AvatarFace avatar={face} crop="bust" className="absolute inset-0 size-full" />
      </motion.div>
      {!still && emote.fx && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute select-none"
              style={{ left: `${15 + i * 32}%`, top: '10%', fontSize: size * 0.24 }}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 0], y: -size * 0.55, scale: 1.1 }}
              transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
            >
              {emote.fx}
            </motion.span>
          ))}
        </>
      )}
    </div>
  );
}
