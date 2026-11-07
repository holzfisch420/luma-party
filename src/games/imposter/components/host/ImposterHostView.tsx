import { AnimatePresence, motion } from 'framer-motion';
import { Check, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCountdown } from '../../../../app/session/hooks';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { HostViewProps } from '../../../game-types';
import { TIMING } from '../../game-config';
import type { ImposterPublicState } from '../../types';
import { Fog } from '../Fog';
import { Avatar, nameOf, TimerRing } from '../shared';

/** Fernseher: Nebel, wer ist dran, Abstimmung und die große Enthüllung. */
export function ImposterHostView({ room, state }: HostViewProps<ImposterPublicState>) {
  const pub = state.public;
  const remaining = useCountdown(pub.phaseEndsAt, 200);
  const total = usePhaseTotal(pub);

  return (
    <div className="mystery relative flex h-dvh flex-col overflow-hidden">
      <Fog />
      <header className="relative z-10 flex items-center justify-between gap-6 px-[4vw] pt-6">
        <div>
          <div className="font-mystery glow-violet text-4xl font-extrabold tracking-[0.25em] text-violet-100">IMPOSTER</div>
          <div className="mt-1 text-lg font-bold text-violet-200/70">
            Runde {pub.round} / {pub.totalRounds}
            {pub.category && (
              <span className="ml-3 rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-0.5 text-violet-100">Kategorie: {pub.category}</span>
            )}
          </div>
        </div>
        {pub.phaseEndsAt && pub.phase !== 'result' && <TimerRing remainingMs={remaining} totalMs={total} size={84} />}
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-[5vw]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pub.round}-${pub.phase}-${pub.phase === 'clues' ? `${pub.clueRound}-${pub.turn}` : ''}`}
            initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(10px)' }}
            transition={{ duration: 0.55 }}
            className="w-full"
          >
            <PhaseContent room={room} pub={pub} />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 flex items-center justify-between gap-4 px-[4vw] pb-5">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(pub.scores)
            .filter(([id]) => room.players.some((p) => p.id === id))
            .sort((a, b) => b[1] - a[1])
            .map(([id, score]) => (
              <span key={id} className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-base font-bold text-violet-100/85">
                <Avatar room={room} id={id} size="xs" />
                {nameOf(room, id)} <span className="text-violet-300">{score}</span>
              </span>
            ))}
        </div>
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-violet-200/50">
          <Smartphone className="size-4" /> Code <span className="tracking-[0.2em] text-violet-300">{room.code}</span>
        </span>
      </footer>
    </div>
  );
}

/** Gesamtdauer der aktuellen Phase (für den Ring) – gemerkt beim Phasenwechsel */
function usePhaseTotal(pub: ImposterPublicState) {
  const [total, setTotal] = useState(1);
  const key = `${pub.round}-${pub.phase}-${pub.turn}-${pub.clueRound}-${pub.phaseEndsAt}`;
  const last = useRef('');
  useEffect(() => {
    if (last.current === key) return;
    last.current = key;
    const fixed: Partial<Record<ImposterPublicState['phase'], number>> = {
      reveal: TIMING.revealSeconds,
      clues: TIMING.turnSeconds,
      vote: TIMING.voteSeconds,
      guess: TIMING.guessSeconds,
    };
    const secs = fixed[pub.phase];
    setTotal(secs ? secs * 1000 : Math.max(1, (pub.phaseEndsAt ?? 0) - Date.now()));
  }, [key, pub.phase, pub.phaseEndsAt]);
  return total;
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="text-center">
      <h1 className="font-mystery glow-violet text-[clamp(2.2rem,5vw,5rem)] font-extrabold leading-tight text-violet-50">{children}</h1>
      {sub && <p className="mx-auto mt-3 max-w-4xl text-[clamp(1rem,1.7vw,1.7rem)] font-semibold text-violet-200/75">{sub}</p>}
    </div>
  );
}

function PlayerRow({ room, ids, check }: { room: RoomSnapshot; ids: string[]; check: (id: string) => boolean }) {
  return (
    <div className="mt-10 flex flex-wrap justify-center gap-6">
      {ids.map((id) => (
        <div key={id} className="flex w-28 flex-col items-center gap-2">
          <div className="relative">
            <Avatar room={room} id={id} size="lg" />
            {check(id) && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-violet-500 text-white shadow-[0_0_14px_rgba(168,85,247,0.9)]">
                <Check className="size-4" strokeWidth={3} />
              </motion.span>
            )}
          </div>
          <span className="max-w-full truncate text-lg font-bold text-violet-100/85">{nameOf(room, id)}</span>
        </div>
      ))}
    </div>
  );
}

function PhaseContent({ room, pub }: { room: RoomSnapshot; pub: ImposterPublicState }) {
  switch (pub.phase) {
    case 'reveal':
      return (
        <>
          <Title sub="Haltet die Karte auf dem Handy gedrückt – heimlich! Alle sehen das geheime Wort … außer einer Person.">Schaut auf eure Handys</Title>
          <PlayerRow room={room} ids={pub.order} check={(id) => pub.ready.includes(id)} />
        </>
      );
    case 'clues': {
      const current = pub.order[pub.turn];
      return (
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold uppercase tracking-[0.3em] text-violet-300/80">
            Hinweisrunde {pub.clueRound} / {pub.clueRounds}
          </div>
          {current && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mt-6 rounded-full p-2 shadow-[0_0_60px_rgba(168,85,247,0.7)]">
              <Avatar room={room} id={current} size="xl" />
            </motion.div>
          )}
          <Title sub="Sag ein Wort, das zum geheimen Wort passt – nicht zu deutlich, sonst errät es der Imposter!">{nameOf(room, current)} ist dran</Title>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {pub.order.map((id, i) => (
              <span
                key={id}
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-4 text-lg font-bold transition ${i === pub.turn ? 'bg-violet-500/40 text-white ring-2 ring-violet-300' : i < pub.turn ? 'bg-white/5 text-violet-200/40' : 'bg-white/5 text-violet-100/80'}`}
              >
                <Avatar room={room} id={id} size="sm" dimmed={i < pub.turn} /> {nameOf(room, id)}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case 'discuss':
      return (
        <>
          <Title sub="Wer hat komisch geantwortet? Wer weiß das Wort nicht? Wenn die Mehrheit bereit ist, beginnt die Abstimmung.">Diskutiert!</Title>
          <PlayerRow room={room} ids={pub.order} check={(id) => pub.ready.includes(id)} />
        </>
      );
    case 'vote':
      return (
        <>
          <Title sub="Stimmt auf dem Handy ab – wer ist der Imposter?">Abstimmung</Title>
          <PlayerRow room={room} ids={pub.order} check={(id) => pub.voted.includes(id)} />
        </>
      );
    case 'guess':
      return (
        <div className="flex flex-col items-center">
          {pub.accusedId && (
            <div className="mb-6 rounded-full p-2 shadow-[0_0_70px_rgba(244,114,182,0.7)]">
              <Avatar room={room} id={pub.accusedId} size="xl" />
            </div>
          )}
          <Title sub="Letzte Chance: Errät der Imposter das geheime Wort, holt er sich trotzdem Punkte.">{nameOf(room, pub.accusedId)} wurde enttarnt!</Title>
        </div>
      );
    case 'result':
      return <ResultReveal room={room} pub={pub} />;
  }
}

function ResultReveal({ room, pub }: { room: RoomSnapshot; pub: ImposterPublicState }) {
  const r = pub.result;
  if (!r) return null;
  const votesFor = (id: string) => Object.entries(r.votes).filter(([, t]) => t === id).map(([v]) => v);
  const headline = r.imposterLeft
    ? 'Der Imposter ist verschwunden …'
    : r.caught
      ? r.guessCorrect
        ? 'Erwischt – aber das Wort erraten!'
        : 'Der Imposter wurde enttarnt!'
      : r.ejectedId
        ? `${nameOf(room, r.ejectedId)} war unschuldig …`
        : 'Gleichstand – niemand fliegt raus';
  return (
    <div className="flex flex-col items-center">
      <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 14 }} className="flex flex-col items-center">
        <div className="rounded-full p-2 shadow-[0_0_80px_rgba(168,85,247,0.85)]">
          <Avatar room={room} id={r.imposterId} size="xl" />
        </div>
        <div className="mt-4 text-2xl font-bold text-violet-200/80">
          <span className="text-violet-50">{nameOf(room, r.imposterId)}</span> war der Imposter
        </div>
      </motion.div>
      <Title sub={!r.caught && !r.imposterLeft ? 'Der Imposter entkommt und kassiert die Punkte.' : r.guess ? `Tipp des Imposters: „${r.guess}“` : undefined}>{headline}</Title>
      <motion.div initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.12em' }} transition={{ delay: 0.9, duration: 1.2 }} className="mt-6 text-center">
        <div className="text-base font-bold uppercase tracking-[0.3em] text-violet-300/70">Das geheime Wort · {r.category}</div>
        <div className="font-mystery glow-violet mt-1 text-[clamp(2rem,4.5vw,4.5rem)] font-extrabold text-white">{r.word}</div>
      </motion.div>
      {!r.imposterLeft && (
        <div className="mt-8 flex flex-wrap justify-center gap-5">
          {pub.order.map((id) => (
            <div key={id} className={`flex min-w-28 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 ${id === r.imposterId ? 'bg-violet-500/25 ring-1 ring-violet-300/60' : 'bg-white/5'}`}>
              <Avatar room={room} id={id} size="md" />
              <span className="text-base font-bold text-violet-100">{nameOf(room, id)}</span>
              <span className="flex -space-x-1.5">
                {votesFor(id).map((v) => (
                  <Avatar key={v} room={room} id={v} size="xs" />
                ))}
              </span>
              {r.gained[id] ? <span className="text-sm font-black text-emerald-300">+{r.gained[id]}</span> : <span className="text-sm text-transparent">·</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
