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

const PODIUM_HEIGHT = ['h-40', 'h-28', 'h-20'];
const PODIUM_ORDER = [1, 0, 2];

/** Generische Rangliste am Spielende – funktioniert für jedes Spiel. */
export function GameResults({ results, gameName, canControl, onRestart, onBack, compact, meId }: Props) {
  const top = results.entries.slice(0, 3);
  const winners = results.entries.filter((e) => results.winnerIds.includes(e.playerId));
  const winnerText =
    winners.length === 0 ? 'Unentschieden' : winners.length === 1 ? `${winners[0]!.name} gewinnt!` : `${winners.map((w) => w.name).join(' & ')} gewinnen!`;

  return (
    <div className={`mx-auto flex w-full flex-col items-center ${compact ? 'max-w-md gap-6' : 'max-w-5xl gap-10'}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/70">
          <Trophy className="size-4 text-amber-300" /> {gameName} · Endstand
        </div>
        <h1 className={`${compact ? 'text-3xl' : 'text-6xl'} font-semibold tracking-tight text-balance`}>{winnerText}</h1>
        {results.summary && <p className="mt-2 text-white/50">{results.summary}</p>}
      </motion.div>

      {!compact && (
        <div className="flex items-end justify-center gap-5">
          {PODIUM_ORDER.map((idx) => {
            const e = top[idx];
            if (!e) return <div key={idx} className="w-44" />;
            const isWinner = results.winnerIds.includes(e.playerId);
            return (
              <motion.div
                key={e.playerId}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + (2 - idx) * 0.18, type: 'spring', stiffness: 160, damping: 18 }}
                className="flex w-44 flex-col items-center gap-3"
              >
                {isWinner && <Crown className="size-9 text-amber-300 drop-shadow-[0_0_18px_rgba(252,211,77,0.6)]" />}
                <PlayerAvatar name={e.name} color={e.avatarColor} size={idx === 0 ? 'xl' : 'lg'} />
                <div className="max-w-full truncate text-lg font-semibold">{e.name}</div>
                <div
                  className={`glass flex w-full flex-col items-center justify-start rounded-t-3xl pt-4 ${PODIUM_HEIGHT[idx]}`}
                  style={isWinner ? { background: 'linear-gradient(180deg, rgba(252,211,77,0.25), rgba(252,211,77,0.05))' } : undefined}
                >
                  <span className="text-4xl font-bold tabular-nums">{e.rank}.</span>
                  <span className="text-white/60 tabular-nums">{e.score} Pkt.</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className={`glass w-full rounded-[28px] p-3 ${compact ? '' : 'max-w-2xl'}`}>
        {results.entries.map((e, i) => (
          <motion.div
            key={e.playerId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${e.playerId === meId ? 'bg-white/10' : ''}`}
          >
            <span className="w-7 text-center font-semibold tabular-nums text-white/50">{e.rank}.</span>
            <PlayerAvatar name={e.name} color={e.avatarColor} size="sm" />
            <span className="flex-1 truncate font-medium">{e.name}</span>
            {results.winnerIds.includes(e.playerId) && <Crown className="size-4 text-amber-300" />}
            <span className="text-lg font-semibold tabular-nums">{e.score}</span>
          </motion.div>
        ))}
      </div>

      {canControl ? (
        <div className={`flex w-full gap-3 ${compact ? 'flex-col' : 'justify-center'}`}>
          <Button variant="primary" size={compact ? 'lg' : 'xl'} icon={<RotateCcw className="size-5" />} onClick={onRestart}>
            Nochmal spielen
          </Button>
          <Button variant="secondary" size={compact ? 'lg' : 'xl'} icon={<Home className="size-5" />} onClick={onBack}>
            Zurück zum Launcher
          </Button>
        </div>
      ) : (
        <p className="text-center text-white/50">Warte auf den Host oder den auswahlberechtigten Spieler …</p>
      )}
    </div>
  );
}
