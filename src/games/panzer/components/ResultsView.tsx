import { motion } from 'framer-motion';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import type { ResultsViewProps } from '../../game-types';
import { panzerColorCache } from './colors-cache';
import { TankIcon } from './TankIcon';

/** Endstand im flachen Stil (TV und Handy). */
export function PanzerResultsView({ results, device, meId, canControl, onRestart, onBack }: ResultsViewProps) {
  const host = device === 'host';
  const winners = results.entries.filter((e) => results.winnerIds.includes(e.playerId));
  const headline = winners.length === 1 ? `${winners[0]!.name} ist Champion!` : winners.length ? `${winners.map((w) => w.name).join(' & ')} sind Champions!` : 'Unentschieden';
  const champColor = winners[0] ? panzerColorCache.get(winners[0].playerId) : undefined;
  return (
    <div className="flat fixed inset-0 overflow-y-auto bg-[#578a34]">
      <div className="flex h-14 items-center justify-center bg-[#4a752c] text-xl font-black shadow-[0_2px_6px_rgba(0,0,0,0.25)]">Kettenchaos · Endstand</div>
      <div className={`mx-auto flex flex-col items-center ${host ? 'max-w-3xl gap-6 p-10' : 'max-w-md gap-5 p-5'}`}>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} className="flex flex-col items-center gap-2 text-center">
          {champColor !== undefined && (
            <motion.div initial={{ rotate: -90, scale: 0.5 }} animate={{ rotate: -60, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
              <TankIcon color={champColor} className={host ? 'size-36' : 'size-24'} angle={0} />
            </motion.div>
          )}
          <Trophy className={host ? 'size-14' : 'size-10'} color="#f9ab00" fill="#fbbc04" />
          <div className={`font-black ${host ? 'text-6xl' : 'text-4xl'}`}>{headline}</div>
          {results.summary && <div className="text-lg font-bold text-white/85">{results.summary}</div>}
        </motion.div>
        <div className="flat-card w-full p-2">
          {results.entries.map((e, i) => {
            const color = panzerColorCache.get(e.playerId);
            return (
              <motion.div
                key={e.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${e.playerId === meId ? 'bg-[#e8f0fe]' : ''}`}
              >
                <span className="w-7 text-center text-xl font-black text-[#5f6368]">{e.rank}</span>
                {color !== undefined && <TankIcon color={color} className="size-10" angle={-60} />}
                <PlayerAvatar name={e.name} color={e.avatarColor} avatar={e.avatar} size="sm" />
                <span className="flex-1 truncate text-lg font-bold">{e.name}</span>
                <span className="flex items-center gap-1 text-xl font-black">
                  <Trophy className="size-5" color="#f9ab00" fill="#fbbc04" /> {e.score}
                </span>
              </motion.div>
            );
          })}
        </div>
        {canControl ? (
          <div className={`flex gap-4 ${host ? '' : 'w-full flex-col'}`}>
            <button onClick={onRestart} className="flex items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-8 py-3.5 text-xl font-black text-white shadow-[0_5px_0_#1557b0]">
              <RotateCcw className="size-6" /> Revanche
            </button>
            <button onClick={onBack} className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-xl font-black text-[#4a752c] shadow-[0_5px_0_rgba(0,0,0,0.2)]">
              <Home className="size-6" /> Home-Menü
            </button>
          </div>
        ) : (
          <p className="font-bold text-white/85">Warte auf den Host …</p>
        )}
      </div>
    </div>
  );
}
