import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { useCountdown } from '../../../../app/session/hooks';
import type { PlayerViewProps } from '../../../game-types';
import { ANSWER_MAX, blankCount } from '../../game-config';
import type { EchtPrivateState, EchtPublicState } from '../../types';
import { AnswerParts, Avatar, LETTERS, nameOf, NOTE_COLORS, Statement, Sticky, tilt } from '../shared';

type Props = PlayerViewProps<EchtPublicState, EchtPrivateState>;

/** Handy: Antwort schreiben (ehrlich oder gefälscht), abstimmen, Ergebnis sehen. */
export function EchtController({ room, me, state, sendAction }: Props) {
  const pub = state.public;
  const priv = state.private;
  const remaining = useCountdown(pub.phaseEndsAt, 250);
  const secs = Math.ceil(remaining / 1000);
  const hero = nameOf(room, pub.heroId);
  const isHero = !!priv?.isHero;

  // Haptik, wenn man selbst dran ist
  const wasHero = useRef(false);
  useEffect(() => {
    if (isHero && !wasHero.current) haptics.play('double');
    wasHero.current = isHero;
  }, [isHero]);

  return (
    <div className="corkboard fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full flex-col gap-4 px-4 pb-6 safe-pt safe-pb">
        <header className="flex items-center justify-between pt-3">
          <span className="font-hand text-4xl font-bold text-white drop-shadow-[0_2px_0_rgba(80,40,10,0.45)]">Echt jetzt?</span>
          <span className="flex items-center gap-2 text-sm font-black text-white">
            {pub.scores[me.id] ?? 0} Punkte
            {pub.phase !== 'reveal' && pub.phaseEndsAt && <span className={`rounded-full px-2.5 py-0.5 tabular-nums ${secs <= 10 ? 'bg-[#e03131]' : 'bg-black/30'}`}>{secs}s</span>}
          </span>
        </header>

        <div className="index-card rounded-md px-5 py-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#e8590c]">
            <Avatar room={room} id={pub.heroId} size="xs" /> {isHero ? 'Du bist dran – sei ehrlich!' : `${hero} ist dran`}
          </div>
          <div className="text-2xl font-black leading-snug">
            <Statement text={pub.statement} fill={priv?.myAnswer && pub.phase === 'write' ? priv.myAnswer : undefined} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${pub.turn}-${pub.step}-${pub.phase}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-1 flex-col gap-4">
            {pub.phase === 'write' && <Write pub={pub} priv={priv} hero={hero} isHero={isHero} sendAction={sendAction} />}
            {pub.phase === 'vote' && <Vote room={room} pub={pub} priv={priv} hero={hero} isHero={isHero} sendAction={sendAction} />}
            {pub.phase === 'reveal' && <Result room={room} me={me.id} pub={pub} hero={hero} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Write({ pub, priv, hero, isHero, sendAction }: { pub: EchtPublicState; priv: EchtPrivateState | null; hero: string; isHero: boolean; sendAction: Props['sendAction'] }) {
  const n = blankCount(pub.statement);
  const [parts, setParts] = useState<string[]>(() => Array.from({ length: n }, (_, i) => priv?.myAnswer?.[i] ?? ''));
  const [editing, setEditing] = useState(!priv?.myAnswer);
  const sent = !!priv?.myAnswer && !editing;
  const ready = parts.every((p) => p.trim());
  const waiting = pub.submitted.length;
  return sent ? (
    <div className="flex flex-col items-center gap-4 pt-2">
      <Sticky color={NOTE_COLORS[0]} rotate={-2} className="w-full max-w-sm px-5 pb-5 pt-7 text-center">
        <AnswerParts parts={priv!.myAnswer!} className="font-hand text-4xl font-bold" />
      </Sticky>
      <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-black">
        <Check className="size-4 text-[#2b8a3e]" strokeWidth={3} /> Abgegeben – warte auf die anderen ({waiting})
      </div>
      <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-black text-white underline">
        <Pencil className="size-4" /> Ändern
      </button>
    </div>
  ) : (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        haptics.play('light');
        sendAction('answer', { parts: parts.map((p) => p.trim()) });
        setEditing(false);
      }}
    >
      <p className="rounded-xl bg-black/25 px-4 py-2 text-center text-base font-bold text-white">
        {isHero ? 'Schreib deine ehrliche Antwort. Die anderen versuchen, sie zu erraten.' : `Was würde ${hero} schreiben? Schreib eine Fälschung, die echt wirkt!`}
        {n > 1 && <span className="block text-sm text-white/80">Dieser Satz hat {n} Lücken – für jede eine eigene Antwort.</span>}
      </p>
      {parts.map((value, i) => (
        <Sticky key={i} color={isHero ? '#fff3a0' : '#ffd3e0'} rotate={i % 2 ? 1 : -1} className="px-4 pb-3 pt-6">
          {n > 1 && <span className="absolute left-3 top-2 grid size-7 place-items-center rounded-full bg-[#e8590c] text-sm font-black text-white">{i + 1}</span>}
          <textarea
            autoFocus={i === 0}
            value={value}
            maxLength={ANSWER_MAX}
            onChange={(e) => setParts((ps) => ps.map((p, k) => (k === i ? e.target.value.replace(/\n/g, ' ') : p)))}
            rows={n > 1 ? 1 : 2}
            placeholder={n > 1 ? `Lücke ${i + 1} …` : isHero ? 'Meine Antwort …' : `${hero} würde schreiben …`}
            className="w-full resize-none bg-transparent text-center font-hand text-4xl font-bold leading-tight outline-none placeholder:text-[#3b2a1a]/35"
            style={{ outline: 'none', boxShadow: 'none' }}
          />
          <div className="text-right text-xs font-bold text-[#3b2a1a]/50">
            {value.length}/{ANSWER_MAX}
          </div>
        </Sticky>
      ))}
      <button type="submit" disabled={!ready} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#e8590c] text-xl font-black text-white shadow-[0_5px_0_#a33c05] transition active:translate-y-1 active:shadow-[0_2px_0_#a33c05] disabled:opacity-50">
        <Send className="size-5" /> Abgeben
      </button>
    </form>
  );
}

function Vote({ room, pub, priv, hero, isHero, sendAction }: { room: Props['room']; pub: EchtPublicState; priv: EchtPrivateState | null; hero: string; isHero: boolean; sendAction: Props['sendAction'] }) {
  if (isHero)
    return (
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <div className="font-hand text-4xl font-bold text-white drop-shadow">Die anderen raten …</div>
        <p className="font-bold text-white/85">Welche Antwort halten sie für deine? Pokerface!</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {pub.voted.map((id) => (
            <Avatar key={id} room={room} id={id} size="sm" />
          ))}
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl bg-black/25 px-4 py-2 text-center text-base font-bold text-white">Welche Antwort ist von {hero}? Du kannst deine Wahl ändern.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {pub.options.map((o, i) => {
          const own = priv?.ownOptionIds.includes(o.id);
          const active = priv?.myVote === o.id;
          return (
            <button
              key={o.id}
              disabled={own}
              onClick={() => {
                haptics.play('medium');
                sendAction('vote', { optionId: o.id });
              }}
              className="text-left disabled:opacity-60"
            >
              <Sticky color={NOTE_COLORS[i % NOTE_COLORS.length]!} rotate={tilt(o.id, 1.5)} pin={false} className={`flex items-center gap-3 px-4 py-3 transition ${active ? 'ring-4 ring-[#e8590c]' : ''}`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black/10 text-lg font-black">{LETTERS[i]}</span>
                <AnswerParts parts={o.parts} className="flex-1 font-hand text-3xl font-bold leading-tight" />
                {own && <span className="text-xs font-black text-[#3b2a1a]/60">deine</span>}
                {active && <Check className="size-6 text-[#e8590c]" strokeWidth={3} />}
              </Sticky>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Result({ room, me, pub, hero }: { room: Props['room']; me: string; pub: EchtPublicState; hero: string }) {
  const r = pub.reveal;
  if (!r) return null;
  if (r.skipped) return <div className="pt-6 text-center font-hand text-4xl font-bold text-white">{hero} hat nichts geschrieben.</div>;
  const real = r.options.find((o) => o.real);
  const gained = r.gained[me] ?? 0;
  const fooledBy = r.options.filter((o) => !o.real && o.authors.includes(me)).flatMap((o) => o.voters);
  return (
    <div className="flex flex-col items-center gap-4 pt-2 text-center">
      <div className="text-sm font-black uppercase tracking-[0.2em] text-white/85">Die echte Antwort</div>
      <Sticky color="#fff3a0" rotate={-2} className="w-full max-w-sm px-5 pb-5 pt-7 ring-4 ring-[#2b8a3e]">
        <AnswerParts parts={real?.parts ?? []} className="font-hand text-4xl font-bold" />
      </Sticky>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }} className={`rounded-full px-6 py-2 text-2xl font-black text-white shadow ${gained ? 'bg-[#2b8a3e]' : 'bg-black/30'}`}>
        {gained ? `+${gained} Punkte` : 'Diesmal keine Punkte'}
      </motion.div>
      {fooledBy.length > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-black">
          Reingelegt: {fooledBy.map((id) => nameOf(room, id)).join(', ')}
        </div>
      )}
    </div>
  );
}
