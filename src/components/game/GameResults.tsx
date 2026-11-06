import { motion } from 'framer-motion';
import { Crown, Home, RotateCcw, Trophy } from 'lucide-react';
import type { GameResults as Results } from '../../shared/types/game';
import { PlayerAvatar } from '../lobby/PlayerAvatar';
import { Button } from '../ui/Button';

interface Props {
  results: Results;
  gameName: string;
  canControl: boolean;
  onRestart?: () => void;
  onBack?: () => void;
  compact?: boolean;
  meId?: string;
}

/** Neutrale Rangliste im Launcher-Stil – für Spiele ohne eigene Ergebnis-Ansicht. */
export function GameResults({ results, gameName, canControl, onRestart, onBack, compact, meId }: Props) {
  const winners = results.entries.filter((e) => results.winnerIds.includes(e.playerId));
  const title = winners.length === 0 ? 'Unentschieden' : winners.length === 1 ? `${winners[0]!.name} gewinnt!` : `${winners.map((w) => w.name).join(' & ')} gewinnen!`;
  return (
    <div className={`mx-auto flex w-full flex-col items-center gap-6 ${compact ? 'max-w-md' : 'max-w-2xl'}`}>
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-home-line bg-white px-4 py-1.5 text-sm font-extrabold text-home-muted">
          <Trophy className="size-4 text-amber-500" /> {gameName} · Endstand
        </div>
        <h1 className={`${compact ? 'text-3xl' : 'text-5xl'} font-black tracking-tight`}>{title}</h1>
        {results.summary && <p className="mt-1 font-bold text-home-muted">{results.summary}</p>}
      </div>
      <div className="home-panel w-full rounded-[28px] p-3">
        {results.entries.map((e, i) => (
          <motion.div key={e.playerId} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${e.playerId === meId ? 'bg-cyan/10' : ''}`}>
            <span className="w-7 text-center font-black tabular-nums text-home-muted">{e.rank}.</span>
            <PlayerAvatar name={e.name} color={e.avatarColor} size="sm" />
            <span className="flex-1 truncate font-extrabold">{e.name}</span>
            {results.winnerIds.includes(e.playerId) && <Crown className="size-4 text-amber-500" />}
            <span className="text-lg font-black tabular-nums">{e.score}</span>
          </motion.div>
        ))}
      </div>
      {canControl ? (
        <div className={`flex w-full gap-3 ${compact ? 'flex-col' : 'justify-center'}`}>
          <Button variant="primary" size="lg" icon={<RotateCcw className="size-5" />} onClick={onRestart}>Nochmal spielen</Button>
          <Button size="lg" icon={<Home className="size-5" />} onClick={onBack}>Zum Home-Menü</Button>
        </div>
      ) : (
        <p className="text-center font-bold text-home-muted">Warte auf den Host oder die auswahlberechtigte Person …</p>
      )}
    </div>
  );
}
