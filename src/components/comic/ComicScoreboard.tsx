import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { PublicPlayer } from '../../shared/types/room';
import { PlayerAvatar } from '../lobby/PlayerAvatar';

export interface ScoreRow {
  player: PublicPlayer;
  score: number;
  gain?: number;
  highlight?: 'success' | 'active' | null;
  badge?: ReactNode;
}

/** Punktetafel im Comic-Stil – sortiert und animiert. */
export function ComicScoreboard({ rows, title = 'Punkte' }: { rows: ScoreRow[]; title?: string }) {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.player.joinedAt - b.player.joinedAt);
  return (
    <div className="comic-box -rotate-1 p-3">
      <div className="font-bangers mb-1 px-1 text-2xl">{title}</div>
      <div className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {sorted.map((r, i) => (
            <motion.div
              key={r.player.id}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`flex items-center gap-2.5 rounded-[10px] border-2 px-2 py-1.5 ${
                r.highlight === 'success' ? 'border-ink bg-[#c9f7d6]' : r.highlight === 'active' ? 'border-ink bg-pop-yellow/60' : 'border-transparent'
              }`}
            >
              <span className="font-bangers w-5 text-right text-xl text-ink/50">{i + 1}</span>
              <PlayerAvatar name={r.player.name} color={r.player.avatarColor} avatar={r.player.avatar} size="sm" variant="comic" dimmed={!r.player.isConnected} />
              <span className="min-w-0 flex-1 truncate text-lg font-bold">{r.player.name}</span>
              {r.badge}
              <AnimatePresence>
                {r.gain ? (
                  <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="font-bangers text-xl text-[#1a9c4a]">
                    +{r.gain}
                  </motion.span>
                ) : null}
              </AnimatePresence>
              <span className="font-bangers w-14 text-right text-2xl">{r.score}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
