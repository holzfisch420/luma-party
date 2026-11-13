import { AnimatePresence, motion } from 'framer-motion';
import { Check, PenLine, Smartphone } from 'lucide-react';
import { useSecondsLeft } from '../../../../app/session/hooks';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { HostViewProps } from '../../../game-types';
import type { EchtPublicState } from '../../types';
import { AnswerParts, Avatar, LETTERS, nameOf, NOTE_COLORS, Statement, Sticky, tilt } from '../shared';
import { useCountUp, useLastSeconds, usePhaseSfx } from '../../../../app/audio/hooks';
import { playSfx, preloadSfx } from '../../../../app/audio/sfx';

preloadSfx(['page-flip', 'question', 'drumroll', 'stamp', 'sax-win', 'note-stick', 'ui-tap', 'clock-tick']);

/** Fernseher: Pinnwand mit Satzkarte, Notizzetteln, Abstimmung und Auflösung. */
export function EchtHostView({ room, state }: HostViewProps<EchtPublicState>) {
  const pub = state.public;
  const secs = useSecondsLeft(pub.phaseEndsAt);
  const hero = nameOf(room, pub.heroId);

  // Geräusche
  usePhaseSfx(pub.phase, `${pub.turn}-${pub.step}`, {
    write: () => playSfx('page-flip', { vol: 0.7 }),
    vote: () => playSfx('question', { vol: 0.7 }),
    reveal: () => {
      playSfx('drumroll', { vol: 0.5 });
      playSfx('stamp', { vol: 0.9, delay: 1.2 });
      playSfx('sax-win', { vol: 0.6, delay: 1.6 });
    },
  });
  useCountUp(pub.submitted.length, () => playSfx('note-stick', { vol: 0.7, vary: 0.1 }));
  useCountUp(pub.voted.length, () => playSfx('ui-tap', { vol: 0.6 }));
  useLastSeconds(pub.phaseEndsAt, 5, () => playSfx('clock-tick', { vol: 0.5 }), pub.phase !== 'reveal');

  return (
    <div className="corkboard relative flex h-dvh flex-col overflow-hidden">
      {/* Kopf */}
      <header className="flex items-center justify-between gap-6 pl-[3vw] pr-[max(3vw,12rem)] pt-5">
        <div className="font-hand text-5xl font-bold text-white drop-shadow-[0_3px_0_rgba(80,40,10,0.45)]">Echt jetzt?</div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-black/25 px-4 py-1.5 text-lg font-black text-white">
            Zug {pub.turn}/{pub.totalTurns} · Satz {pub.step}/{pub.perTurn}
          </span>
          {pub.phase !== 'reveal' && pub.phaseEndsAt && (
            <span className={`grid size-14 place-items-center rounded-full text-2xl font-black text-white shadow-lg ${secs <= 10 ? 'bg-[#e03131]' : 'bg-[#e8590c]'}`}>{secs}</span>
          )}
        </div>
      </header>

      {/* Satzkarte mit der Person, die dran ist */}
      <div className="flex items-center justify-center gap-6 px-[4vw] pt-4">
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-white p-1.5 shadow-xl">
            <Avatar room={room} id={pub.heroId} size="xl" />
          </div>
          <span className="font-hand text-3xl font-bold text-white drop-shadow">{hero} ist dran</span>
        </div>
        <motion.div key={`${pub.turn}-${pub.step}`} initial={{ rotate: -6, y: -30, opacity: 0 }} animate={{ rotate: -1.2, y: 0, opacity: 1 }} className="index-card max-w-5xl flex-1 rounded-md px-10 py-7">
          <div className="text-sm font-black uppercase tracking-[0.25em] text-[#e8590c]">{hero} ergänzt ehrlich – alle anderen fälschen</div>
          <div className="mt-2 text-[clamp(1.8rem,3.2vw,3.4rem)] font-black leading-tight text-[#3b2a1a]">
            <Statement text={pub.statement} fill={pub.phase === 'reveal' ? pub.reveal?.options.find((o) => o.real)?.parts : undefined} />
          </div>
        </motion.div>
      </div>

      <main className="relative flex min-h-0 flex-1 items-center justify-center px-[4vw] pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={`${pub.turn}-${pub.step}-${pub.phase}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
            {pub.phase === 'write' && <WritePhase room={room} pub={pub} />}
            {pub.phase === 'vote' && <VotePhase room={room} pub={pub} />}
            {pub.phase === 'reveal' && <RevealPhase room={room} pub={pub} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex items-center justify-between gap-4 bg-black/25 px-[3vw] py-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {Object.entries(pub.scores)
            .filter(([id]) => room.players.some((p) => p.id === id))
            .sort((a, b) => b[1] - a[1])
            .map(([id, score]) => (
              <span key={id} className="flex items-center gap-2 rounded-full bg-white/90 py-0.5 pl-0.5 pr-3 text-base font-black text-[#3b2a1a]">
                <Avatar room={room} id={id} size="xs" /> {nameOf(room, id)} <span className="text-[#e8590c]">{score}</span>
              </span>
            ))}
        </div>
        <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-white/80">
          <Smartphone className="size-4" /> Code <span className="tracking-[0.2em] text-[#ffe066]">{room.code}</span>
        </span>
      </footer>
    </div>
  );
}

function WritePhase({ room, pub }: { room: RoomSnapshot; pub: EchtPublicState }) {
  const players = room.players.filter((p) => p.isConnected || pub.submitted.includes(p.id));
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-xl font-black text-[#3b2a1a] shadow">
        <PenLine className="size-5 text-[#e8590c]" /> Alle schreiben auf dem Handy …
      </div>
      <div className="flex flex-wrap justify-center gap-5">
        {players.map((p, i) => {
          const done = pub.submitted.includes(p.id);
          return (
            <Sticky key={p.id} color={done ? NOTE_COLORS[i % NOTE_COLORS.length]! : '#ffffffaa'} rotate={tilt(p.id)} className="flex w-36 flex-col items-center gap-2 px-3 pb-3 pt-5">
              <Avatar room={room} id={p.id} size="lg" />
              <span className="max-w-full truncate font-hand text-2xl font-bold">{p.name}</span>
              <span className={`flex items-center gap-1 text-sm font-black ${done ? 'text-[#2b8a3e]' : 'text-[#3b2a1a]/40'}`}>
                {done ? (
                  <>
                    <Check className="size-4" strokeWidth={3} /> fertig
                  </>
                ) : (
                  'schreibt …'
                )}
              </span>
            </Sticky>
          );
        })}
      </div>
    </div>
  );
}

function VotePhase({ room, pub }: { room: RoomSnapshot; pub: EchtPublicState }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-full bg-white/90 px-5 py-2 text-xl font-black text-[#3b2a1a] shadow">Welche Antwort ist von {nameOf(room, pub.heroId)}? Stimmt auf dem Handy ab!</div>
      <div className="flex flex-wrap justify-center gap-6">
        {pub.options.map((o, i) => (
          <motion.div key={o.id} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 18 }}>
            <Sticky color={NOTE_COLORS[i % NOTE_COLORS.length]!} rotate={tilt(o.id)} className="flex min-h-36 w-64 flex-col px-5 pb-4 pt-6">
              <span className="absolute left-3 top-2 text-lg font-black text-[#3b2a1a]/45">{LETTERS[i]}</span>
              <AnswerParts parts={o.parts} className="m-auto text-center font-hand text-4xl font-bold leading-tight" />
            </Sticky>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-lg font-bold text-white">
        {pub.voted.map((id) => (
          <Avatar key={id} room={room} id={id} size="sm" />
        ))}
        <span className="ml-1">haben abgestimmt</span>
      </div>
    </div>
  );
}

function RevealPhase({ room, pub }: { room: RoomSnapshot; pub: EchtPublicState }) {
  const r = pub.reveal;
  if (!r) return null;
  if (r.skipped)
    return (
      <div className="text-center font-hand text-5xl font-bold text-white drop-shadow">
        {nameOf(room, pub.heroId)} hat nichts geschrieben – nächster Satz!
      </div>
    );
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-start justify-center gap-6">
        {r.options.map((o, i) => (
          <motion.div key={o.id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.25 }}>
            <Sticky color={o.real ? '#fff3a0' : NOTE_COLORS[(i + 1) % NOTE_COLORS.length]!} rotate={tilt(o.id)} className={`flex w-64 flex-col gap-2 px-5 pb-4 pt-6 ${o.real ? 'ring-4 ring-[#2b8a3e]' : ''}`}>
              <AnswerParts parts={o.parts} className="text-center font-hand text-4xl font-bold leading-tight" />
              <div className="flex items-center justify-center gap-1.5 text-sm font-black">
                {o.real ? (
                  <span className="text-[#2b8a3e]">echt von {nameOf(room, pub.heroId)}</span>
                ) : (
                  <span className="text-[#c92a2a]">Fälschung von {o.authors.map((a) => nameOf(room, a)).join(' & ')}</span>
                )}
              </div>
              {o.real && o.authors.length > 1 && (
                <div className="text-center text-xs font-black text-[#7a3c00]">Genau gleich geschrieben: {o.authors.filter((a) => a !== pub.heroId).map((a) => nameOf(room, a)).join(', ')}</div>
              )}
              <div className="flex min-h-8 flex-wrap justify-center gap-1">
                {o.voters.map((v) => (
                  <Avatar key={v} room={room} id={v} size="sm" />
                ))}
              </div>
              {o.real && (
                <motion.span
                  initial={{ scale: 3, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: -14 }}
                  transition={{ delay: 1.2, type: 'spring', stiffness: 300, damping: 14 }}
                  className="absolute -right-5 -top-4 rounded-lg border-4 border-[#2b8a3e] bg-white/80 px-3 py-0.5 text-2xl font-black text-[#2b8a3e]"
                >
                  ECHT!
                </motion.span>
              )}
            </Sticky>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="flex flex-wrap justify-center gap-2">
        {Object.entries(r.gained)
          .sort((a, b) => b[1] - a[1])
          .map(([id, n]) => (
            <span key={id} className="flex items-center gap-2 rounded-full bg-[#2b8a3e] py-0.5 pl-0.5 pr-3 font-black text-white shadow">
              <Avatar room={room} id={id} size="xs" /> {nameOf(room, id)} +{n}
            </span>
          ))}
      </motion.div>
    </div>
  );
}
