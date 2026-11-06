import { motion } from 'framer-motion';
import { Crown, Home, RotateCcw } from 'lucide-react';
import { Burst } from '../../../components/comic/Burst';
import { ComicButton } from '../../../components/comic/ComicButton';
import { PaperSheet } from '../../../components/comic/PaperSheet';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import type { ResultsViewProps } from '../../game-types';

const PODIUM = [
  { idx: 1, h: 'h-24', color: '#dfe6ee', rot: -2 },
  { idx: 0, h: 'h-32', color: '#ffd93b', rot: 1 },
  { idx: 2, h: 'h-20', color: '#f3c299', rot: 2 },
];

/** Endstand im Comic-Stil (TV und Handy). */
export function MontagsmalerResultsView({ results, device, meId, canControl, onRestart, onBack }: ResultsViewProps) {
  const winners = results.entries.filter((e) => results.winnerIds.includes(e.playerId));
  const headline = winners.length === 0 ? 'Unentschieden!' : winners.length === 1 ? `${winners[0]!.name} gewinnt!` : `${winners.map((w) => w.name).join(' & ')} gewinnen!`;
  const host = device === 'host';
  const me = results.entries.find((e) => e.playerId === meId);

  return (
    <PaperSheet compact={!host}>
      <div className={`flex min-h-0 flex-1 flex-col items-center overflow-y-auto ${host ? 'gap-4 px-10 py-4' : 'gap-5 px-5 py-5'}`}>
        <motion.div initial={{ scale: 0.2, rotate: -20 }} animate={{ scale: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
          <Burst className={host ? 'aspect-[2.6] w-[36rem]' : 'aspect-[1.7] w-80'} spikes={22}>
            <div className="text-lg font-bold">Montagsmaler · Endstand</div>
            <div className={`font-bangers leading-none ${host ? 'text-6xl' : 'text-4xl'}`}>{headline}</div>
            {results.summary && <div className="text-sm font-bold">{results.summary}</div>}
          </Burst>
        </motion.div>

        {host && (
          <div className="flex items-end gap-5">
            {PODIUM.map(({ idx, h, color, rot }) => {
              const e = results.entries[idx];
              if (!e) return <div key={idx} className="w-44" />;
              return (
                <motion.div
                  key={e.playerId}
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + (2 - idx) * 0.2, type: 'spring', stiffness: 180, damping: 15 }}
                  className="flex w-44 flex-col items-center gap-2"
                >
                  {results.winnerIds.includes(e.playerId) && <Crown className="size-10 fill-pop-yellow stroke-ink stroke-[2.5]" />}
                  <PlayerAvatar name={e.name} color={e.avatarColor} avatar={e.avatar} size="lg" variant="comic" />
                  <div className="font-bangers max-w-full truncate text-3xl">{e.name}</div>
                  <div className={`comic-box flex w-full flex-col items-center justify-start pt-3 ${h}`} style={{ background: color, transform: `rotate(${rot}deg)` }}>
                    <span className="font-bangers text-5xl leading-none">{e.rank}.</span>
                    <span className="font-bangers text-2xl">{e.score} Pkt.</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!host && me && (
          <div className="comic-box rotate-1 bg-pop-yellow px-6 py-2 text-center">
            <div className="text-sm font-bold">Dein Platz</div>
            <div className="font-bangers text-5xl leading-none">
              {me.rank}. <span className="text-3xl">· {me.score} Pkt.</span>
            </div>
          </div>
        )}

        <div className={`comic-box w-full -rotate-[0.5deg] p-3 ${host ? 'max-w-2xl' : ''}`}>
          {results.entries.map((e, i) => (
            <motion.div
              key={e.playerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06 }}
              className={`flex items-center gap-3 rounded-lg border-2 px-2 py-1.5 ${e.playerId === meId ? 'border-ink bg-pop-yellow/60' : 'border-transparent'}`}
            >
              <span className="font-bangers w-8 text-center text-2xl">{e.rank}.</span>
              <PlayerAvatar name={e.name} color={e.avatarColor} avatar={e.avatar} size="sm" variant="comic" />
              <span className="flex-1 truncate text-lg font-bold">{e.name}</span>
              {results.winnerIds.includes(e.playerId) && <Crown className="size-5 fill-pop-yellow stroke-ink" />}
              <span className="font-bangers text-2xl">{e.score}</span>
            </motion.div>
          ))}
        </div>

        {canControl ? (
          <div className={`flex gap-4 ${host ? '' : 'w-full flex-col'}`}>
            <ComicButton tone="yellow" size="lg" icon={<RotateCcw className="size-6" />} onClick={onRestart}>
              Nochmal!
            </ComicButton>
            <ComicButton tone="white" size="lg" icon={<Home className="size-6" />} onClick={onBack}>
              Home-Menü
            </ComicButton>
          </div>
        ) : (
          <p className="comic-box-sm px-3 py-1 text-center font-bold">Warte auf den Host …</p>
        )}
      </div>
    </PaperSheet>
  );
}
