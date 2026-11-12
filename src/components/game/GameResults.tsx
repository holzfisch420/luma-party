import { motion } from 'framer-motion';
import { Crown, Home, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { getGameMeta } from '../../games/game-catalog';
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

const MEDAL = ['#f5c542', '#c9d3de', '#e0a272'];
/** dunklere Medaillenfarben für Text auf Weiß */
const MEDAL_TEXT = ['#c99a12', '#7d8a99', '#b0682c'];

/** Rangliste mit Siegertreppchen und Konfetti in den Farben des Spiels. */
export function GameResults({ results, gameName, canControl, onRestart, onBack, compact, meId }: Props) {
  const theme = getGameMeta(results.gameId)?.theme ?? { from: '#1fb3d4', to: '#7be0f5', accent: '#1fb3d4' };
  const winners = results.entries.filter((e) => results.winnerIds.includes(e.playerId));
  const title = winners.length === 0 ? 'Unentschieden' : winners.length === 1 ? `${winners[0]!.name} gewinnt!` : `${winners.map((w) => w.name).join(' & ')} gewinnen!`;
  const podium = results.entries.slice(0, 3);
  const rest = results.entries.slice(3);
  const me = results.entries.find((e) => e.playerId === meId);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden" style={{ background: `linear-gradient(160deg, ${theme.from}, ${theme.via ?? theme.from} 50%, ${theme.to})` }}>
      <Confetti colors={[theme.accent, '#ffffff', '#f5c542', theme.to, '#ff7eb6']} count={compact ? 28 : 70} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
      <div className={`relative mx-auto flex w-full flex-col items-center gap-6 px-5 ${compact ? 'max-w-md py-8' : 'max-w-5xl py-10'}`}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center text-white">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-1.5 text-sm font-black uppercase tracking-[0.2em] backdrop-blur">
            {gameName} · Endstand
          </div>
          <h1 className={`${compact ? 'text-4xl' : 'text-7xl'} font-black tracking-tight drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]`}>{title}</h1>
          {results.summary && <p className="mt-2 font-bold text-white/85">{results.summary}</p>}
        </motion.div>

        {/* Handy: eigener Platz groß */}
        {compact && me && (
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="flex flex-col items-center gap-2 rounded-[28px] bg-white/95 px-8 py-5 text-home-text shadow-2xl">
            <PlayerAvatar name={me.name} color={me.avatarColor} avatar={me.avatar} size="lg" />
            <div className="text-5xl font-black" style={{ color: MEDAL_TEXT[me.rank - 1] ?? theme.accent }}>
              {me.rank}. Platz
            </div>
            <div className="font-black text-home-muted">{me.score} Punkte</div>
          </motion.div>
        )}

        {/* Siegertreppchen (2 · 1 · 3) */}
        {!compact && (
          <div className="flex items-end justify-center gap-4 pt-6">
            {[podium[1], podium[0], podium[2]].map((e, col) => {
              if (!e) return <div key={col} className="w-48" />;
              const place = e.rank;
              const h = place === 1 ? 'h-56' : place === 2 ? 'h-40' : 'h-28';
              return (
                <motion.div
                  key={e.playerId}
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 16, delay: place === 1 ? 0.9 : place === 2 ? 0.5 : 0.2 }}
                  className="flex w-48 flex-col items-center"
                >
                  <div className="relative mb-3">
                    {results.winnerIds.includes(e.playerId) && (
                      <motion.div initial={{ y: -40, rotate: -30, opacity: 0 }} animate={{ y: 0, rotate: -12, opacity: 1 }} transition={{ delay: 1.4, type: 'spring' }} className="absolute -top-10 left-1/2 -translate-x-1/2">
                        <Crown className="size-14 fill-[#f5c542] text-[#b8860b] drop-shadow-lg" />
                      </motion.div>
                    )}
                    <div className="rounded-full bg-white p-1.5 shadow-xl">
                      <PlayerAvatar name={e.name} color={e.avatarColor} avatar={e.avatar} size={place === 1 ? 'xl' : 'lg'} />
                    </div>
                  </div>
                  <div className="max-w-full truncate text-2xl font-black text-white drop-shadow">{e.name}</div>
                  <div className="mb-2 text-lg font-black text-white/85">{e.score} Punkte</div>
                  <div
                    className={`${h} flex w-full items-start justify-center rounded-t-3xl pt-3 text-6xl font-black text-white/90 shadow-[inset_0_6px_0_rgba(255,255,255,0.35),0_20px_40px_-10px_rgba(0,0,0,0.35)]`}
                    style={{ background: `linear-gradient(180deg, ${MEDAL[place - 1] ?? '#ddd'}, color-mix(in srgb, ${MEDAL[place - 1] ?? '#ddd'} 65%, #000))` }}
                  >
                    {place}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* übrige Plätze (auf dem Handy alle) */}
        {(compact ? results.entries : rest).length > 0 && (
          <div className="w-full rounded-[28px] bg-white/92 p-3 text-home-text shadow-xl backdrop-blur">
            {(compact ? results.entries : rest).map((e, i) => (
              <motion.div
                key={e.playerId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.06 }}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${e.playerId === meId ? 'bg-cyan/10' : ''}`}
              >
                <span className="w-7 text-center font-black tabular-nums text-home-muted">{e.rank}.</span>
                <PlayerAvatar name={e.name} color={e.avatarColor} avatar={e.avatar} size="sm" />
                <span className="flex-1 truncate font-extrabold">{e.name}</span>
                {results.winnerIds.includes(e.playerId) && <Crown className="size-4 text-amber-500" />}
                <span className="text-lg font-black tabular-nums">{e.score}</span>
              </motion.div>
            ))}
          </div>
        )}

        {canControl ? (
          <div className={`flex w-full gap-3 ${compact ? 'flex-col' : 'justify-center'}`}>
            <Button variant="primary" size="lg" className="pulse-glow" icon={<RotateCcw className="size-5" />} onClick={onRestart}>
              Nochmal spielen
            </Button>
            <Button size="lg" icon={<Home className="size-5" />} onClick={onBack}>
              Zum Home-Menü
            </Button>
          </div>
        ) : (
          <p className="rounded-full bg-black/20 px-4 py-2 text-center font-bold text-white">Warte auf den Host oder die auswahlberechtigte Person …</p>
        )}
      </div>
    </div>
  );
}

/** fallendes Konfetti (leichtgewichtig, nur CSS-Transformationen) */
function Confetti({ colors, count }: { colors: string[]; count: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        dur: 3.5 + Math.random() * 3,
        size: 6 + Math.random() * 8,
        rot: Math.random() * 360,
        color: colors[i % colors.length]!,
        round: Math.random() < 0.3,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-[-5%]"
          style={{ left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 0.45, background: p.color, borderRadius: p.round ? '50%' : 2 }}
          initial={{ y: '-10vh', rotate: p.rot, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rot + 540, x: [0, 30, -20, 15, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}
