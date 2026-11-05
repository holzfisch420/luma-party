import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { PublicPlayer } from '../../shared/types/room';
import { PlayerAvatar } from '../lobby/PlayerAvatar';

export interface ScoreRow {
  player: PublicPlayer;
  score: number;
  /** z. B. "+120" in diesem Zug */
  gain?: number;
  highlight?: 'success' | 'active' | null;
  badge?: ReactNode;
}

/** Live-Punktestand – sortiert und animiert. */
export function GameScoreboard({ rows, title = 'Punkte' }: { rows: ScoreRow[]; title?: string }) {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.player.joinedAt - b.player.joinedAt);
  return (
    <div className="glass rounded-[28px] p-4">
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{title}</div>
      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {sorted.map((r, i) => (
            <motion.div
              key={r.player.id}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors duration-500 ${
                r.highlight === 'success' ? 'bg-emerald-400/15' : r.highlight === 'active' ? 'bg-white/10' : ''
              }`}
            >
              <span className="w-4 text-right text-sm font-semibold tabular-nums text-white/35">{i + 1}</span>
              <PlayerAvatar name={r.player.name} color={r.player.avatarColor} size="sm" dimmed={!r.player.isConnected} />
              <span className="min-w-0 flex-1 truncate font-medium">{r.player.name}</span>
              {r.badge}
              <AnimatePresence>
                {r.gain ? (
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-semibold text-emerald-300 tabular-nums"
                  >
                    +{r.gain}
                  </motion.span>
                ) : null}
              </AnimatePresence>
              <span className="w-14 text-right text-lg font-semibold tabular-nums">{r.score}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
