import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useSecondsLeft } from '../../../../app/session/hooks';
import type { HostViewProps } from '../../../game-types';
import { MAX_GUESSES } from '../../game-config';
import type { WortPublicState } from '../../types';
import { Avatar, Board, MARK_COLORS, nameOf, Tile } from '../shared';
import { useCountUp, useLastSeconds, usePhaseSfx } from '../../../../app/audio/hooks';
import { playSfx, preloadSfx } from '../../../../app/audio/sfx';

preloadSfx(['key-enter', 'level-up', 'typewriter', 'success', 'fail', 'clock-tick']);

/** Fernseher: alle Raster nebeneinander (nur Farben), danach Auflösung mit Buchstaben */
export function WortHostView({ room, state }: HostViewProps<WortPublicState>) {
  const pub = state.public;
  const secs = useSecondsLeft(pub.phaseEndsAt);

  // Geräusche: jeder Versuch klackt, jedes Knacken klingelt, Auflösung mit Tusch
  const guessCount = Object.values(pub.boards).reduce((n, b) => n + b.marks.length, 0);
  const solvedCount = Object.values(pub.boards).filter((b) => b.solved).length;
  useCountUp(guessCount, () => playSfx('key-enter', { vol: 0.5, vary: 0.08 }));
  useCountUp(solvedCount, () => playSfx('level-up', { vol: 0.7 }));
  usePhaseSfx(pub.phase, pub.round, {
    play: () => playSfx('typewriter', { vol: 0.6 }),
    reveal: () => (solvedCount > 0 ? playSfx('success', { vol: 0.7 }) : playSfx('fail', { vol: 0.6 })),
  });
  useLastSeconds(pub.phaseEndsAt, 10, () => playSfx('clock-tick', { vol: 0.5 }), pub.phase === 'play');
  const ids = Object.keys(pub.boards).filter((id) => room.players.some((p) => p.id === id));
  const n = Math.max(1, ids.length);
  // Feldgröße so, dass alle Raster in 1–2 Reihen passen
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const rows = n <= 4 ? 1 : 2;
  const tile = Math.max(14, Math.min(56, Math.floor(Math.min((window.innerWidth * 0.9) / perRow / 6.2, (window.innerHeight * (rows === 1 ? 0.52 : 0.3)) / 7.2))));
  const reveal = pub.phase === 'reveal' ? pub.reveal : null;
  const solved = ids.filter((id) => pub.boards[id]?.solved).length;

  const today = new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="newsprint relative flex h-dvh flex-col overflow-hidden">
      {/* Zeitungskopf */}
      <header className="px-[4vw] pt-5">
        <div className="flex items-end justify-between gap-6 text-sm font-bold uppercase tracking-[0.25em] text-[#2a241c]/70">
          <span>{today}</span>
          <span>Rätselteil · Ausgabe Nr. {pub.round} von {pub.rounds}</span>
          <span>Gratis</span>
        </div>
        <div className="news-rule mt-2" />
        <div className="flex items-center justify-center gap-6 py-2">
          <h1 className="font-stage text-[clamp(3rem,6vw,6.5rem)] font-black leading-none tracking-tight">Der Wortknacker</h1>
          {pub.phase === 'play' && (
            <motion.div
              key={secs <= 20 ? 'eilig' : 'ruhig'}
              initial={{ scale: 1.4, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: 1 }}
              className={`grid size-24 shrink-0 place-items-center rounded-full border-4 border-double font-typewriter text-3xl ${secs <= 20 ? 'border-[#b3261e] text-[#b3261e]' : 'border-[#2a241c] text-[#2a241c]'}`}
            >
              {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
            </motion.div>
          )}
        </div>
        <div className="news-rule" />
      </header>

      <div className="flex justify-center pt-4">
        <AnimatePresence mode="wait">
          {reveal ? (
            <motion.div key="word" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
              <div className="font-stage text-2xl font-bold italic">Auflösung: Das gesuchte Wort lautete</div>
              <div className="flex gap-2">
                {[...reveal.word].map((ch, i) => (
                  <Tile key={i} letter={ch} mark="g" size={80} flipDelay={0.2 + i * 0.15} rot={((i * 7) % 5) - 2} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
              <div className="font-stage text-3xl font-bold italic">
                Gesucht: ein Wort mit fünf Buchstaben · {solved} von {ids.length} haben es geknackt
              </div>
              <div className="flex items-center gap-5 font-typewriter text-lg">
                <span className="flex items-center gap-2"><span className="inline-block size-5 rounded-sm" style={{ background: MARK_COLORS.g.bg }} /> richtig</span>
                <span className="flex items-center gap-2"><span className="inline-block size-5 rounded-sm" style={{ background: MARK_COLORS.y.bg }} /> woanders</span>
                <span className="flex items-center gap-2"><span className="inline-block size-5 rounded-sm" style={{ background: MARK_COLORS.x.bg }} /> nicht im Wort</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex min-h-0 flex-1 flex-wrap content-center items-start justify-center gap-x-[2.5vw] gap-y-5 px-[3vw] py-4">
        {ids.map((id, i) => {
          const b = pub.boards[id]!;
          const gained = reveal?.gained[id];
          return (
            <motion.div
              key={id}
              style={{ rotate: ((i * 5) % 3) - 1 }}
              className={`relative flex flex-col items-center gap-2 border-2 bg-[#fbf6e9] p-3 shadow-[3px_4px_0_rgba(42,36,28,0.25)] ${b.solved ? 'border-[#2f7d4f]' : 'border-[#2a241c]/60'}`}
            >
              <div className="flex w-full items-center gap-2 border-b-2 border-[#2a241c]/40 pb-1.5">
                <Avatar room={room} id={id} size="sm" />
                <span className="max-w-[10rem] truncate font-stage text-xl font-black">{nameOf(room, id)}</span>
                <span className="ml-auto font-typewriter text-lg">{pub.scores[id] ?? 0} P.</span>
              </div>
              <Board marks={b.marks} letters={reveal?.guesses[id]} size={tile} gap={Math.max(3, tile * 0.1)} />
              <div className="h-7 font-typewriter text-base">
                {gained ? (
                  <span className="bg-[#2f7d4f] px-2 py-0.5 text-[#f6efdc]">+{gained} Punkte</span>
                ) : b.solved ? (
                  <span className="text-[#2f7d4f]">{b.place === 1 ? '★ Erste/r! ' : ''}geknackt in {b.marks.length}</span>
                ) : b.failed ? (
                  <span className="text-[#2a241c]/60">keine Versuche mehr</span>
                ) : (
                  <span className="text-[#2a241c]/60">Versuch {b.marks.length + 1}/{MAX_GUESSES}</span>
                )}
              </div>
              {b.solved && (
                <motion.div initial={{ scale: 2.4, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 0.9, rotate: -14 }} className="absolute -right-4 -top-4 rounded border-4 border-[#2f7d4f] bg-[#fbf6e9]/80 px-2 font-typewriter text-xl text-[#2f7d4f]">
                  GEKNACKT
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </main>

      <footer className="mx-[4vw] flex items-center justify-between gap-4 border-t-2 border-[#2a241c] py-2.5 font-typewriter text-base text-[#2a241c]/80">
        <span>Punkte: im 1. Versuch 6, im 6. Versuch 1 · +2 für die schnellste, +1 für die zweitschnellste Person</span>
        <span className="flex shrink-0 items-center gap-2">
          <Smartphone className="size-4" /> Mitraten mit Code <b className="tracking-[0.2em]">{room.code}</b>
        </span>
      </footer>
    </div>
  );
}
