import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useCountdown } from '../../../../app/session/hooks';
import type { HostViewProps } from '../../../game-types';
import { MAX_GUESSES } from '../../game-config';
import type { WortPublicState } from '../../types';
import { Avatar, Board, MARK_COLORS, nameOf, Tile } from '../shared';

/** Fernseher: alle Raster nebeneinander (nur Farben), danach Auflösung mit Buchstaben */
export function WortHostView({ room, state }: HostViewProps<WortPublicState>) {
  const pub = state.public;
  const secs = Math.ceil(useCountdown(pub.phaseEndsAt, 250) / 1000);
  const ids = Object.keys(pub.boards).filter((id) => room.players.some((p) => p.id === id));
  const n = Math.max(1, ids.length);
  // Feldgröße so, dass alle Raster in 1–2 Reihen passen
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const rows = n <= 4 ? 1 : 2;
  const tile = Math.max(14, Math.min(56, Math.floor(Math.min((window.innerWidth * 0.9) / perRow / 6.2, (window.innerHeight * (rows === 1 ? 0.52 : 0.3)) / 7.2))));
  const reveal = pub.phase === 'reveal' ? pub.reveal : null;
  const solved = ids.filter((id) => pub.boards[id]?.solved).length;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#2c4a7a_0%,#1b2a4a_55%,#111a30_100%)] text-white">
      <header className="flex items-center gap-4 px-[3vw] pt-4">
        <span className="text-5xl font-black tracking-tight">Wortknacker</span>
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-lg font-black">
          Wort {pub.round}/{pub.rounds}
        </span>
        {pub.phase === 'play' && (
          <span className={`grid size-14 place-items-center rounded-full text-2xl font-black shadow-lg ${secs <= 20 ? 'bg-[#e03131]' : 'bg-[#2fb67c]'}`}>{secs}</span>
        )}
      </header>

      <div className="flex justify-center pt-3">
        <AnimatePresence mode="wait">
          {reveal ? (
            <motion.div key="word" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
              <div className="text-sm font-black uppercase tracking-[0.25em] text-white/70">Das Wort war</div>
              <div className="flex gap-2">
                {[...reveal.word].map((ch, i) => (
                  <Tile key={i} letter={ch} mark="g" size={76} flipDelay={0.2 + i * 0.15} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 rounded-full bg-white/10 px-6 py-2 text-xl font-black">
              Alle raten dasselbe Wort auf dem Handy · {solved}/{ids.length} geknackt
              <span className="flex items-center gap-1.5 text-base font-bold text-white/75">
                <span className="inline-block size-4 rounded" style={{ background: MARK_COLORS.g.bg }} /> richtig
                <span className="ml-2 inline-block size-4 rounded" style={{ background: MARK_COLORS.y.bg }} /> woanders
                <span className="ml-2 inline-block size-4 rounded" style={{ background: MARK_COLORS.x.bg }} /> kommt nicht vor
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex min-h-0 flex-1 flex-wrap content-center items-start justify-center gap-x-[2.5vw] gap-y-5 px-[3vw] py-4">
        {ids.map((id) => {
          const b = pub.boards[id]!;
          const gained = reveal?.gained[id];
          return (
            <motion.div key={id} layout className={`flex flex-col items-center gap-2 rounded-3xl p-3 ${b.solved ? 'bg-[#2fb67c]/20 ring-2 ring-[#2fb67c]' : 'bg-white/5'}`}>
              <div className="flex items-center gap-2">
                <Avatar room={room} id={id} size="sm" />
                <span className="max-w-[10rem] truncate text-lg font-black">{nameOf(room, id)}</span>
                <span className="rounded-full bg-white/10 px-2 text-sm font-black">{pub.scores[id] ?? 0}</span>
              </div>
              <Board marks={b.marks} letters={reveal?.guesses[id]} size={tile} gap={Math.max(3, tile * 0.1)} />
              <div className="h-7 text-base font-black">
                {gained ? (
                  <span className="rounded-full bg-[#2fb67c] px-3 py-0.5">+{gained}</span>
                ) : b.solved ? (
                  <span className="text-[#7ff0b8]">{b.place === 1 ? '🥇 ' : ''}geknackt in {b.marks.length}</span>
                ) : b.failed ? (
                  <span className="text-white/60">keine Versuche mehr</span>
                ) : (
                  <span className="text-white/60">
                    Versuch {b.marks.length + 1}/{MAX_GUESSES}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </main>

      <footer className="flex items-center justify-between gap-4 bg-black/25 px-[3vw] py-2.5 text-sm font-bold text-white/80">
        <span>Punkte: im 1. Versuch 6, im 6. Versuch 1 · +2 für die schnellste, +1 für die zweitschnellste Person</span>
        <span className="flex shrink-0 items-center gap-2">
          <Smartphone className="size-4" /> Code <span className="tracking-[0.2em] text-[#7ff0b8]">{room.code}</span>
        </span>
      </footer>
    </div>
  );
}
