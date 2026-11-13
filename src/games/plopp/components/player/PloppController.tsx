import { AnimatePresence, motion } from 'framer-motion';
import { Send, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { useSecondsLeft } from '../../../../app/session/hooks';
import type { PlayerViewProps } from '../../../game-types';
import { ANSWER_MAX } from '../../game-config';
import type { PloppPrivateState, PloppPublicState } from '../../types';
import { Avatar, Lives, nameOf, Ocean, Puffer, useTension } from '../shared';

type Props = PlayerViewProps<PloppPublicState, PloppPrivateState>;

/**
 * Handy: Aufgabe sehen, Antwort tippen (geht auch schon vorher – abschicken nur mit Fisch),
 * Rückmeldung mit Autokorrektur, bei unbekannten Antworten abstimmen.
 */
export function PloppController({ room, me, state, sendAction }: Props) {
  const pub = state.public;
  const priv = state.private;
  const tension = useTension(pub.fuse);
  const isHolder = !!priv?.isHolder;
  const myLives = pub.lives[me.id] ?? 0;
  const playing = pub.order.includes(me.id);
  const out = playing && myLives <= 0;
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const canSend = isHolder && pub.phase === 'play' && text.trim().length > 0;

  // Haptik + Fokus, wenn der Fisch zu mir kommt
  const wasHolder = useRef(false);
  useEffect(() => {
    if (isHolder && !wasHolder.current && pub.phase !== 'pop') {
      haptics.play('double');
      inputRef.current?.focus();
    }
    wasHolder.current = isHolder;
  }, [isHolder, pub.phase]);

  // Rückmeldung: bei Erfolg Feld leeren, sonst kurz vibrieren
  const lastFeedback = useRef<number | null>(null);
  useEffect(() => {
    const f = priv?.feedback;
    if (!f || f.id === lastFeedback.current) return;
    lastFeedback.current = f.id;
    if (f.kind === 'ok') {
      haptics.play('success');
      setText('');
    } else if (f.kind !== 'pending') haptics.play('error');
  }, [priv?.feedback]);

  // Plopp bei mir
  const lastPop = useRef<number | null>(null);
  useEffect(() => {
    if (pub.phase === 'pop' && pub.pop?.playerId === me.id && lastPop.current !== pub.round) {
      lastPop.current = pub.round;
      haptics.play('error');
    }
    if (pub.phase === 'intro') setText('');
  }, [pub.phase, pub.pop, pub.round, me.id]);

  const submit = () => {
    if (!canSend) return;
    haptics.play('light');
    sendAction('answer', { text: text.trim() });
  };

  return (
    <div className="fixed inset-0 overflow-y-auto text-white">
      <Ocean />
      <div className="relative z-10 flex min-h-full flex-col gap-3 px-4 pb-6 safe-pt safe-pb">
        <header className="flex items-center justify-between pt-3">
          <span className="flex items-center gap-1.5 text-3xl font-black drop-shadow">
            <Puffer tension={0.3} size={38} /> Plopp!
          </span>
          {playing && (out ? <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-black">raus</span> : <Lives left={myLives} max={pub.maxLives} size={18} />)}
        </header>

        <div className="rounded-3xl bg-white px-5 py-4 text-center text-[#0b3d6b] shadow-lg">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[#1576a8]">Runde {pub.round} · Nenne …</div>
          <div className="text-3xl font-black leading-tight">{pub.prompt.text}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${pub.phase}-${isHolder}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-3">
            {pub.phase === 'vote' && pub.vote ? (
              <Vote room={room} pub={pub} priv={priv} meId={me.id} sendAction={sendAction} />
            ) : pub.phase === 'pop' && pub.pop ? (
              <div className="flex flex-col items-center gap-2 pt-2 text-center">
                <Puffer popped size={160} />
                <div className="text-2xl font-black">
                  {pub.pop.playerId === me.id ? (pub.pop.eliminated ? 'Geplatzt – du bist raus!' : 'Geplatzt bei dir! Ein Leben weniger.') : pub.pop.eliminated ? `${nameOf(room, pub.pop.playerId)} ist raus!` : `Bei ${nameOf(room, pub.pop.playerId)} geplatzt!`}
                </div>
              </div>
            ) : isHolder ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 0.5 - tension * 0.35, repeat: Infinity }}>
                  <Puffer tension={tension} size={130} />
                </motion.div>
                <div className="rounded-full bg-[#ffd23f] px-5 py-1.5 text-xl font-black text-[#0b3d6b] shadow">{pub.phase === 'intro' ? 'Du fängst an – gleich geht’s los!' : 'Du hast den Fisch! Schnell!'}</div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 rounded-2xl bg-black/25 px-4 py-3">
                {pub.holderId && <Avatar room={room} id={pub.holderId} size="sm" />}
                <span className="text-lg font-black">{pub.holderId ? `${nameOf(room, pub.holderId)} hat den Fisch` : '…'}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Eingabe – auch ohne Fisch schon tippbar */}
        {playing && !out && pub.phase !== 'vote' && pub.phase !== 'pop' && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              value={text}
              maxLength={ANSWER_MAX}
              onChange={(e) => setText(e.target.value)}
              placeholder={isHolder ? 'Antwort eingeben …' : 'Schon mal vorbereiten …'}
              enterKeyHint="send"
              autoComplete="off"
              className={`min-h-14 min-w-0 flex-1 rounded-2xl border-4 bg-white px-4 text-2xl font-black text-[#0b3d6b] outline-none placeholder:text-[#0b3d6b]/35 ${isHolder ? 'border-[#ffd23f]' : 'border-white/40'}`}
            />
            <button type="submit" disabled={!canSend} className="grid min-h-14 w-16 place-items-center rounded-2xl bg-[#ffb02e] text-white shadow-[0_5px_0_#c46d00] transition active:translate-y-1 active:shadow-[0_2px_0_#c46d00] disabled:opacity-40" aria-label="Abschicken">
              <Send className="size-6" />
            </button>
          </form>
        )}

        <Feedback priv={priv} />

        {out && pub.phase !== 'pop' && <div className="rounded-2xl bg-black/25 px-4 py-3 text-center font-bold">Du bist raus – schau zu, wer am längsten durchhält!</div>}

        {pub.used.length > 0 && (
          <div className="mt-1">
            <div className="mb-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/75">Schon genannt · {pub.used.length}</div>
            <div className="flex flex-wrap gap-1.5">
              {[...pub.used].reverse().map((u) => (
                <span key={`${u.text}-${u.by}`} className="rounded-full bg-white/20 px-3 py-1 text-sm font-black">
                  {u.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Feedback({ priv }: { priv: PloppPrivateState | null }) {
  const f = priv?.feedback;
  if (!f) return null;
  const tone =
    f.kind === 'ok'
      ? { bg: 'bg-[#2b8a3e]', text: f.corrected ? `✓ ${f.answer} (korrigiert aus „${f.typed}“)` : `✓ ${f.answer} – weitergegeben!` }
      : f.kind === 'dupe'
        ? { bg: 'bg-[#e03131]', text: `„${f.answer}“ wurde schon genannt!` }
        : f.kind === 'letter'
          ? { bg: 'bg-[#e03131]', text: `„${f.answer}“ hat den falschen Anfangsbuchstaben!` }
          : f.kind === 'rejected'
            ? { bg: 'bg-[#e03131]', text: `„${f.typed}“ wurde abgelehnt – versuch was anderes!` }
            : f.kind === 'pending'
              ? { bg: 'bg-[#1576a8]', text: `„${f.typed}“ kenne ich nicht – die anderen stimmen ab …` }
              : { bg: 'bg-[#e03131]', text: `„${f.typed}“ kenne ich nicht – versuch was anderes!` };
  return (
    <motion.div key={f.id} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-2xl px-4 py-2.5 text-center text-lg font-black shadow ${tone.bg}`}>
      {tone.text}
    </motion.div>
  );
}

function Vote({ room, pub, priv, meId, sendAction }: { room: Props['room']; pub: PloppPublicState; priv: PloppPrivateState | null; meId: string; sendAction: Props['sendAction'] }) {
  const v = pub.vote!;
  const secs = useSecondsLeft(pub.phaseEndsAt);
  const mine = v.playerId === meId;
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-black/25 px-4 py-4 text-center">
      <div className="text-sm font-black uppercase tracking-[0.2em] text-white/80">Abstimmung · {secs}s</div>
      <div className="text-lg font-bold">{mine ? 'Gilt deine Antwort?' : `${nameOf(room, v.playerId)} sagt:`}</div>
      <div className="text-4xl font-black">„{v.text}“</div>
      {priv?.canVote ? (
        <div className="grid w-full grid-cols-2 gap-3">
          {(['yes', 'no'] as const).map((k) => {
            const active = priv.myVote === k;
            return (
              <button
                key={k}
                onClick={() => {
                  haptics.play('medium');
                  sendAction('vote', { yes: k === 'yes' });
                }}
                className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl text-lg font-black shadow transition active:scale-95 ${
                  k === 'yes' ? (active ? 'bg-[#2b8a3e] ring-4 ring-white' : 'bg-[#2b8a3e]/80') : active ? 'bg-[#e03131] ring-4 ring-white' : 'bg-[#e03131]/80'
                }`}
              >
                {k === 'yes' ? <ThumbsUp className="size-7" /> : <ThumbsDown className="size-7" />}
                {k === 'yes' ? 'Gilt' : 'Gilt nicht'}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="font-bold text-white/80">{mine ? 'Die anderen entscheiden …' : 'Du stimmst diesmal nicht ab.'}</div>
      )}
      <div className="flex gap-1.5">
        {v.eligible.map((id) => (
          <div key={id} className={`rounded-full p-0.5 ${v.voters.includes(id) ? 'bg-[#2b8a3e]' : 'bg-white/20'}`}>
            <Avatar room={room} id={id} size="xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
