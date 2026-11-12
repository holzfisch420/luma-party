import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Pencil } from 'lucide-react';
import { Burst } from '../../../../components/comic/Burst';
import { fitWord } from '../../../../components/comic/fit-text';
import { ComicCountdown } from '../../../../components/comic/ComicCountdown';
import { ComicScoreboard } from '../../../../components/comic/ComicScoreboard';
import { PaperSheet } from '../../../../components/comic/PaperSheet';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { HostViewProps } from '../../../game-types';
import { useRemoteCanvas } from '../../hooks/useRemoteCanvas';
import type { MontagsmalerPublicState } from '../../types';
import { CanvasView } from '../CanvasView';
import { DrawingSheet } from '../DrawingSheet';
import { WordMask } from '../WordMask';
import { BubbleStack, useChatBubbles } from './ChatBubbles';
import { useCountUp, useLastSeconds, usePhaseSfx } from '../../../../app/audio/hooks';
import { playSfx, preloadSfx } from '../../../../app/audio/sfx';
import { useGameEvent } from '../../../../app/session/hooks';
import { MM_EVENTS } from '../../types';

preloadSfx(['draw-scribble', 'draw-correct', 'draw-round', 'page-flip', 'whoosh', 'applause', 'aww', 'reveal', 'clock-tick', 'draw-crumple']);
let lastScribble = 0;

const REASONS: Record<string, string> = {
  time: 'Zeit abgelaufen!',
  'all-guessed': 'Alle haben es erraten!',
  'drawer-left': 'Zeichner ist weg …',
  skipped: 'Zug übersprungen',
};

export function MontagsmalerHostView({ room, state }: HostViewProps<MontagsmalerPublicState>) {
  const pub = state.public;
  const model = useRemoteCanvas(pub.turn);
  const bubbles = useChatBubbles(pub.turn);
  const drawer = room.players.find((p) => p.id === pub.drawerId);
  const guessers = room.players.filter((p) => p.id !== pub.drawerId && p.isConnected);
  const correctIds = new Set(pub.correctGuesses.map((c) => c.playerId));

  // Geräusche
  usePhaseSfx(pub.phase, pub.turn, {
    choosing: () => playSfx('page-flip', { vol: 0.8 }),
    drawing: () => playSfx('draw-round', { vol: 0.6 }),
    reveal: () =>
      pub.reveal?.reason === 'all-guessed'
        ? playSfx('applause', { vol: 0.6 })
        : pub.correctGuesses.length > 0
          ? playSfx('reveal', { vol: 0.7 })
          : playSfx('aww', { vol: 0.6 }),
  });
  useCountUp(pub.correctGuesses.length, () => playSfx('draw-correct', { vol: 0.8 }));
  useLastSeconds(pub.phaseEndsAt, 5, () => playSfx('clock-tick', { vol: 0.6 }), pub.phase === 'drawing');
  // Kritzeln, während gezeichnet wird
  useGameEvent(MM_EVENTS.draw, () => {
    const now = performance.now();
    if (now - lastScribble < 650) return;
    lastScribble = now;
    playSfx('draw-scribble', { vol: 0.25, vary: 0.15 });
  });

  const rows = pub.scores
    .map((s) => {
      const player = room.players.find((p) => p.id === s.playerId);
      if (!player) return null;
      return {
        player,
        score: s.score,
        gain: pub.phase === 'reveal' ? pub.turnGains[s.playerId] : undefined,
        highlight: correctIds.has(s.playerId) ? ('success' as const) : s.playerId === pub.drawerId ? ('active' as const) : null,
        badge: s.playerId === pub.drawerId ? <Pencil className="size-4" aria-label="zeichnet" /> : correctIds.has(s.playerId) ? <CheckCircle2 className="size-5 text-[#1a9c4a]" aria-label="erraten" /> : undefined,
      };
    })
    .filter((r) => r !== null);
  const upcoming = pub.upcomingDrawerIds.map((id) => room.players.find((p) => p.id === id)).filter((p) => !!p);

  return (
    <PaperSheet>
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 pb-5 pt-4">
        {/* Kopfzeile */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="comic-box-sm -rotate-3 bg-pop-yellow px-4 py-1.5 text-center">
              <div className="font-bangers text-lg leading-none">Runde</div>
              <div className="font-bangers text-4xl leading-none">
                {pub.round}/{pub.totalRounds}
              </div>
            </div>
            {drawer && (
              <div className="flex items-center gap-3">
                <PlayerAvatar name={drawer.name} color={drawer.avatarColor} avatar={drawer.avatar} size="lg" variant="comic" />
                <div>
                  <div className="text-base font-bold">Es zeichnet:</div>
                  <div className="font-bangers text-4xl leading-none">{drawer.name}</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex min-h-[5rem] items-center justify-center">
            {pub.phase === 'drawing' && pub.wordMask && <WordMask mask={pub.wordMask} size="lg" />}
            {pub.phase === 'choosing' && <div className="font-bangers text-3xl">Wort wird gewählt …</div>}
          </div>
          <div className="flex items-center justify-end gap-4">
            {pub.category && pub.phase === 'drawing' && (
              <div className="comic-box-sm rotate-2 bg-pop-pink px-4 py-1.5 text-lg font-bold">Kategorie: {pub.category}</div>
            )}
            {pub.phase !== 'reveal' && <ComicCountdown endsAt={pub.phaseEndsAt} durationMs={pub.phaseDurationMs} size={96} />}
          </div>
        </div>

        {/* Spielfläche */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
            <div className="max-h-[52%] min-h-0 overflow-hidden p-1">
              <ComicScoreboard rows={rows} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden p-1">
              <BubbleStack bubbles={bubbles} side="left" players={room.players} />
            </div>
          </aside>

          <div className="relative mx-auto w-[min(100%,calc(100dvh-14rem))] lg:w-[min(calc(100dvh-14rem),44vw)]">
            <DrawingSheet>
              <CanvasView model={model} />
            </DrawingSheet>

            <AnimatePresence>
              {pub.phase === 'choosing' && drawer && (
                <motion.div key="choosing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center rounded-[18px] bg-paper/70 backdrop-blur-[2px]">
                  <motion.div initial={{ scale: 0.3, rotate: -15 }} animate={{ scale: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="flex flex-col items-center gap-4">
                    <PlayerAvatar name={drawer.name} color={drawer.avatarColor} avatar={drawer.avatar} size="xl" variant="comic" />
                    <Burst className="aspect-[1.7] w-[26rem]" spikes={18}>
                      <div className="font-bangers text-5xl leading-none">{drawer.name} ist dran!</div>
                      <div className="mt-1 text-lg font-bold">wählt ein Wort auf dem Handy …</div>
                    </Burst>
                  </motion.div>
                </motion.div>
              )}
              {pub.phase === 'reveal' && pub.reveal && (
                <motion.div key={`reveal-${pub.turn}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center rounded-[18px] bg-paper/60">
                  <motion.div initial={{ scale: 0.2, rotate: 20 }} animate={{ scale: 1, rotate: 2 }} transition={{ type: 'spring', stiffness: 260, damping: 13 }} className="flex flex-col items-center gap-3">
                    <div className="comic-box-sm -rotate-2 bg-white px-4 py-1 text-xl font-bold">{REASONS[pub.reveal.reason]}</div>
                    <Burst color="#ffd93b" spikes={20} className="aspect-[1.6] w-[34rem] max-w-[90%]">
                      <div className="text-xl font-bold">Das Wort war:</div>
                      <div className="font-bangers leading-none" style={{ fontSize: fitWord(pub.reveal.word, 4.5, 9) }}>{pub.reveal.word}</div>
                    </Burst>
                    <div className="comic-box-sm rotate-1 px-4 py-1 text-lg font-bold">
                      {pub.correctGuesses.length} von {Math.max(guessers.length, pub.correctGuesses.length)} haben's erraten
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* schmale Bildschirme: Bubbles über den unteren Ecken */}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 grid grid-cols-2 gap-3 lg:hidden">
              <BubbleStack bubbles={bubbles} side="left" players={room.players} />
              <BubbleStack bubbles={bubbles} side="right" players={room.players} />
            </div>
          </div>

          <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
            <div className="self-end rotate-[-2deg] rounded-[10px] border-2 border-ink bg-white px-3 py-1 text-base font-bold shadow-[2px_2px_0_#161616]">
              Mitspielen? Code <span className="font-bangers text-xl tracking-widest">{room.code}</span>
            </div>
            <div className="comic-box rotate-1 p-4">
              <div className="font-bangers text-2xl">Richtig geraten</div>
              <div className="flex items-baseline gap-2">
                <span className="font-bangers text-6xl leading-none">{pub.correctGuesses.length}</span>
                <span className="font-bangers text-3xl text-ink/50">/ {guessers.length}</span>
              </div>
              <div className="mt-3 h-5 overflow-hidden rounded-full border-[3px] border-ink bg-white">
                <motion.div className="halftone h-full bg-pop-green" animate={{ width: `${guessers.length ? (pub.correctGuesses.length / guessers.length) * 100 : 0}%` }} />
              </div>
            </div>
            {upcoming.length > 0 && (
              <div className="comic-box-sm -rotate-1 p-3">
                <div className="font-bangers mb-2 text-xl">Als Nächstes</div>
                <div className="flex flex-wrap gap-2">
                  {upcoming.slice(0, 6).map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white py-0.5 pl-0.5 pr-2.5">
                      <PlayerAvatar name={p.name} color={p.avatarColor} avatar={p.avatar} size="xs" variant="comic" />
                      <span className="text-sm font-bold">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden p-1">
              <BubbleStack bubbles={bubbles} side="right" players={room.players} />
            </div>
          </aside>
        </div>
      </div>

    </PaperSheet>
  );
}
