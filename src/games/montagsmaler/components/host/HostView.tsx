import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Pencil, Tag } from 'lucide-react';
import { GameScoreboard } from '../../../../components/game/GameScoreboard';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import { Countdown } from '../../../../components/ui/Countdown';
import type { HostViewProps } from '../../../game-types';
import { useRemoteCanvas } from '../../hooks/useRemoteCanvas';
import type { MontagsmalerPublicState } from '../../types';
import { CanvasView } from '../CanvasView';
import { WordMask } from '../WordMask';
import { BubbleStack, useChatBubbles } from './ChatBubbles';

const REASONS: Record<string, string> = {
  time: 'Zeit abgelaufen',
  'all-guessed': 'Alle haben es erraten!',
  'drawer-left': 'Zeichner hat die Verbindung verloren',
  skipped: 'Zug übersprungen',
};

export function MontagsmalerHostView({ room, state }: HostViewProps<MontagsmalerPublicState>) {
  const pub = state.public;
  const model = useRemoteCanvas(pub.turn);
  const bubbles = useChatBubbles(pub.turn);
  const drawer = room.players.find((p) => p.id === pub.drawerId);
  const guessers = room.players.filter((p) => p.id !== pub.drawerId && p.isConnected);
  const correctIds = new Set(pub.correctGuesses.map((c) => c.playerId));
  const showGains = pub.phase === 'reveal';

  const rows = pub.scores
    .map((s) => {
      const player = room.players.find((p) => p.id === s.playerId);
      if (!player) return null;
      return {
        player,
        score: s.score,
        gain: showGains ? pub.turnGains[s.playerId] : undefined,
        highlight: correctIds.has(s.playerId) ? ('success' as const) : s.playerId === pub.drawerId ? ('active' as const) : null,
        badge:
          s.playerId === pub.drawerId ? (
            <Pencil className="size-4 text-white/60" aria-label="zeichnet" />
          ) : correctIds.has(s.playerId) ? (
            <CheckCircle2 className="size-4 text-emerald-300" aria-label="erraten" />
          ) : undefined,
      };
    })
    .filter((r) => r !== null);

  const upcoming = pub.upcomingDrawerIds.map((id) => room.players.find((p) => p.id === id)).filter((p) => !!p);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {/* Kopfzeile */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/[0.07] px-4 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Runde</div>
            <div className="text-2xl font-semibold tabular-nums">
              {pub.round}
              <span className="text-white/35">/{pub.totalRounds}</span>
            </div>
          </div>
          {drawer && (
            <div className="flex items-center gap-3">
              <PlayerAvatar name={drawer.name} color={drawer.avatarColor} size="md" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Es zeichnet</div>
                <div className="text-2xl font-semibold tracking-tight">{drawer.name}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex min-h-[4.5rem] items-center justify-center">
          {pub.phase === 'drawing' && pub.wordMask && <WordMask mask={pub.wordMask} size="lg" />}
          {pub.phase === 'choosing' && <div className="text-xl text-white/60">Wort wird gewählt …</div>}
        </div>
        <div className="flex items-center justify-end gap-4">
          {pub.category && pub.phase === 'drawing' && (
            <div className="flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-white/75">
              <Tag className="size-4" /> {pub.category}
            </div>
          )}
          {pub.phase !== 'reveal' && <Countdown endsAt={pub.phaseEndsAt} durationMs={pub.phaseDurationMs} size={84} stroke={7} />}
        </div>
      </div>

      {/* Spielfläche */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
          <div className="max-h-[55%] min-h-0 overflow-hidden">
            <GameScoreboard rows={rows} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
            <BubbleStack bubbles={bubbles} side="left" players={room.players} />
          </div>
        </aside>

        <div className="relative mx-auto w-[min(100%,calc(100dvh-15.5rem))] lg:w-[min(calc(100dvh-15.5rem),46vw)]">
          <div className="relative">
            <div className="overflow-hidden rounded-[32px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
              <CanvasView model={model} />
            </div>

            <AnimatePresence>
              {pub.phase === 'choosing' && drawer && (
                <motion.div
                  key="choosing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[32px] bg-ink-900/85 backdrop-blur-sm"
                >
                  <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <PlayerAvatar name={drawer.name} color={drawer.avatarColor} size="xl" />
                  </motion.div>
                  <div className="text-center">
                    <div className="text-4xl font-semibold tracking-tight">{drawer.name} ist dran</div>
                    <div className="mt-2 text-lg text-white/55">wählt gerade ein Wort auf dem Smartphone …</div>
                  </div>
                </motion.div>
              )}
              {pub.phase === 'reveal' && pub.reveal && (
                <motion.div
                  key={`reveal-${pub.turn}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[32px] bg-ink-900/80 backdrop-blur-[2px]"
                >
                  <div className="text-lg font-medium text-white/60">{REASONS[pub.reveal.reason]}</div>
                  <div className="text-sm uppercase tracking-[0.2em] text-white/45">Das Wort war</div>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                    className="px-6 text-center text-7xl font-bold tracking-tight"
                  >
                    {pub.reveal.word}
                  </motion.div>
                  <div className="mt-2 text-white/55">
                    {pub.correctGuesses.length} von {Math.max(guessers.length, pub.correctGuesses.length)} haben es erraten
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* auf schmalen Bildschirmen liegen die Bubbles über den unteren Ecken */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 grid grid-cols-2 gap-3 lg:hidden">
            <BubbleStack bubbles={bubbles} side="left" players={room.players} />
            <BubbleStack bubbles={bubbles} side="right" players={room.players} />
          </div>
        </div>

        <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
          <div className="glass rounded-[28px] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Richtig geraten</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tabular-nums">{pub.correctGuesses.length}</span>
              <span className="text-xl text-white/40">/ {guessers.length}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                animate={{ width: `${guessers.length ? (pub.correctGuesses.length / guessers.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          {upcoming.length > 0 && (
            <div className="glass rounded-[28px] p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Als Nächstes zeichnen</div>
              <div className="flex flex-wrap gap-2">
                {upcoming.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1 pr-3">
                    <PlayerAvatar name={p.name} color={p.avatarColor} size="xs" />
                    <span className="text-sm">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
            <BubbleStack bubbles={bubbles} side="right" players={room.players} />
          </div>
        </aside>
      </div>
    </div>
  );
}
