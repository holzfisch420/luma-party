import { motion } from 'framer-motion';
import { Crown, Home, RotateCcw } from 'lucide-react';
import { Burst } from '../../../components/comic/Burst';
import { ComicButton } from '../../../components/comic/ComicButton';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import type { ResultsViewProps } from '../../game-types';
import { panzerColorCache } from './colors-cache';
import { TankIcon } from './TankIcon';

/** Endstand im Arena-Stil (TV und Handy). */
export function PanzerResultsView({ results, device, meId, canControl, onRestart, onBack }: ResultsViewProps) {
  const host = device === 'host';
  const winners = results.entries.filter((e) => results.winnerIds.includes(e.playerId));
  const headline = winners.length === 1 ? `${winners[0]!.name} ist Champion!` : winners.length ? `${winners.map((w) => w.name).join(' & ')} sind Champions!` : 'Unentschieden!';
  return (
    <div className="comic fixed inset-0 overflow-y-auto bg-[#2d2a26] [background-image:radial-gradient(rgba(255,255,255,0.06)_1.5px,transparent_1.6px)] [background-size:22px_22px]">
      <div className={`mx-auto flex flex-col items-center ${host ? 'max-w-4xl gap-6 p-10' : 'max-w-md gap-5 p-5'}`}>
        <motion.div initial={{ scale: 0.2, rotate: -20 }} animate={{ scale: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
          <Burst className={host ? 'aspect-[2.4] w-[38rem]' : 'aspect-[1.7] w-80'} spikes={22}>
            <div className="text-lg font-bold">Kettenchaos · Endstand</div>
            <div className={`font-bangers leading-none ${host ? 'text-6xl' : 'text-4xl'}`}>{headline}</div>
            {results.summary && <div className="text-sm font-bold">{results.summary}</div>}
          </Burst>
        </motion.div>
        <div className="comic-box w-full p-3">
          {results.entries.map((e, i) => {
            const color = panzerColorCache.get(e.playerId);
            return (
              <motion.div
                key={e.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className={`flex items-center gap-3 rounded-lg border-2 px-2 py-1.5 ${e.playerId === meId ? 'border-ink bg-pop-yellow/60' : 'border-transparent'}`}
              >
                <span className="font-bangers w-8 text-center text-2xl">{e.rank}.</span>
                {color !== undefined ? <TankIcon color={color} className="size-10" angle={-60} /> : null}
                <PlayerAvatar name={e.name} color={e.avatarColor} avatar={e.avatar} size="sm" variant="comic" />
                <span className="flex-1 truncate text-lg font-bold">{e.name}</span>
                {results.winnerIds.includes(e.playerId) && <Crown className="size-5 fill-pop-yellow stroke-ink" />}
                <span className="font-bangers text-2xl">{e.score} ★</span>
              </motion.div>
            );
          })}
        </div>
        {canControl ? (
          <div className={`flex gap-4 ${host ? '' : 'w-full flex-col'}`}>
            <ComicButton tone="yellow" size="lg" icon={<RotateCcw className="size-6" />} onClick={onRestart}>
              Revanche!
            </ComicButton>
            <ComicButton tone="white" size="lg" icon={<Home className="size-6" />} onClick={onBack}>
              Home-Menü
            </ComicButton>
          </div>
        ) : (
          <p className="comic-box-sm px-3 py-1 font-bold">Warte auf den Host …</p>
        )}
      </div>
    </div>
  );
}
