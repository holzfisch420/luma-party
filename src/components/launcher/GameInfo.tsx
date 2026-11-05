import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Users } from 'lucide-react';
import type { GameMeta } from '../../shared/types/game';

export function GameMetaChips({ meta }: { meta: GameMeta }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
      <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5">
        <Users className="size-4" /> {meta.minPlayers}–{meta.maxPlayers} Spieler
      </span>
      <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5">
        <Clock className="size-4" /> {meta.durationMinutes[0]}–{meta.durationMinutes[1]} Min.
      </span>
      {meta.tags.map((t) => (
        <span key={t} className="rounded-full border border-white/10 px-3 py-1.5">
          {t}
        </span>
      ))}
    </div>
  );
}

/** Spielname, Beschreibung und Eckdaten unter dem Carousel – mit sanftem Übergang. */
export function GameInfo({ meta, size = 'lg' }: { meta: GameMeta; size?: 'md' | 'lg' }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={meta.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-col gap-3"
      >
        <div>
          <h2 className={`${size === 'lg' ? 'text-5xl' : 'text-3xl'} font-semibold tracking-tight`}>{meta.name}</h2>
          <p className={`${size === 'lg' ? 'text-xl' : 'text-base'} mt-1 font-medium`} style={{ color: meta.theme.accent }}>
            {meta.tagline}
          </p>
        </div>
        <p className={`${size === 'lg' ? 'max-w-2xl text-lg' : 'text-[15px]'} text-white/60 text-balance`}>{meta.description}</p>
        <GameMetaChips meta={meta} />
      </motion.div>
    </AnimatePresence>
  );
}
