import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, Fingerprint, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { useCountdown } from '../../../../app/session/hooks';
import type { PlayerViewProps } from '../../../game-types';
import type { ImposterPrivateState, ImposterPublicState } from '../../types';
import { Fog } from '../Fog';
import { Avatar, nameOf } from '../shared';

type Props = PlayerViewProps<ImposterPublicState, ImposterPrivateState>;

/** Handy: geheime Karte (gedrückt halten), Hinweis abgeben, abstimmen, raten. */
export function ImposterController({ room, me, state, sendAction }: Props) {
  const pub = state.public;
  const priv = state.private;
  const remaining = useCountdown(pub.phaseEndsAt, 250);
  const secs = Math.ceil(remaining / 1000);
  const myTurn = pub.phase === 'clues' && pub.order[pub.turn] === me.id;

  // Haptik, wenn man dran ist
  const wasMyTurn = useRef(false);
  useEffect(() => {
    if (myTurn && !wasMyTurn.current) haptics.play('double');
    wasMyTurn.current = myTurn;
  }, [myTurn]);

  return (
    <div className="mystery fixed inset-0 overflow-hidden">
      <Fog />
      <div className="relative z-10 flex h-full flex-col gap-4 overflow-y-auto px-5 pb-6 safe-pt safe-pb">
        <header className="flex items-center justify-between pt-3">
          <span className="font-mystery glow-violet text-xl font-extrabold tracking-[0.25em] text-violet-100">IMPOSTER</span>
          <span className="flex items-center gap-3 text-sm font-bold text-violet-200/70">
            Runde {pub.round}/{pub.totalRounds}
            {pub.phaseEndsAt && pub.phase !== 'result' && <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 tabular-nums text-violet-100">{secs}s</span>}
          </span>
        </header>

        {!priv?.inRound ? (
          <Center title="Gleich geht's los" text="Du steigst in der nächsten Runde ein. Schau solange auf den Fernseher." />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pub.round}-${pub.phase}-${myTurn}`}
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.35 }}
              className="flex flex-1 flex-col gap-4"
            >
              <Phase room={room} me={me} pub={pub} priv={priv} sendAction={sendAction} myTurn={myTurn} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function Phase({ room, me, pub, priv, sendAction, myTurn }: Omit<Props, 'state'> & { pub: ImposterPublicState; priv: ImposterPrivateState; myTurn: boolean }) {
  switch (pub.phase) {
    case 'reveal': {
      const seen = pub.ready.includes(me.id);
      return (
        <>
          <SecretCard pub={pub} priv={priv} big />
          <BigButton disabled={seen} onClick={() => sendAction('seen')}>
            {seen ? (
              <>
                <Check className="size-6" strokeWidth={3} /> Warte auf die anderen …
              </>
            ) : (
              'Gesehen – weiter'
            )}
          </BigButton>
        </>
      );
    }
    case 'clues': {
      const current = pub.order[pub.turn];
      return (
        <>
          {myTurn ? (
            <div className="rounded-3xl border border-violet-300/50 bg-violet-500/20 p-5 text-center shadow-[0_0_40px_rgba(168,85,247,0.45)]">
              <div className="font-mystery glow-violet text-3xl font-extrabold text-white">Du bist dran!</div>
              <p className="mt-2 font-semibold text-violet-100/85">
                {priv.role === 'imposter' ? 'Bluffe! Sag ein Wort, das passen könnte.' : 'Sag laut ein Wort, das zum geheimen Wort passt – nicht zu deutlich!'}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-3xl bg-white/5 p-4">
              {current && <Avatar room={room} id={current} size="lg" />}
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300/70">
                  Hinweisrunde {pub.clueRound}/{pub.clueRounds}
                </div>
                <div className="text-2xl font-black text-violet-50">{nameOf(room, current)} ist dran</div>
              </div>
            </div>
          )}
          <SecretCard pub={pub} priv={priv} />
          {myTurn && (
            <BigButton
              onClick={() => {
                haptics.play('light');
                sendAction('done');
              }}
            >
              <Check className="size-6" strokeWidth={3} /> Fertig
            </BigButton>
          )}
        </>
      );
    }
    case 'discuss': {
      const ready = pub.ready.includes(me.id);
      return (
        <>
          <Center title="Diskutiert!" text="Wer hat komisch geantwortet? Sobald die Mehrheit bereit ist, wird abgestimmt." />
          <SecretCard pub={pub} priv={priv} />
          <BigButton disabled={ready} onClick={() => sendAction('readyToVote')}>
            {ready ? `Bereit (${pub.ready.length}/${pub.order.length})` : 'Bereit zum Abstimmen'}
          </BigButton>
        </>
      );
    }
    case 'vote':
      return (
        <>
          <div className="text-center">
            <div className="font-mystery glow-violet text-3xl font-extrabold text-white">Wer ist der Imposter?</div>
            <p className="mt-1 text-sm font-semibold text-violet-200/70">Du kannst deine Stimme ändern, bis alle abgestimmt haben.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {pub.order
              .filter((id) => id !== me.id)
              .map((id) => {
                const active = priv.myVote === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      haptics.play('medium');
                      sendAction('vote', { target: id });
                    }}
                    className={`flex flex-col items-center gap-2 rounded-3xl border p-3 transition ${active ? 'border-violet-300 bg-violet-500/35 shadow-[0_0_30px_rgba(168,85,247,0.6)]' : 'border-white/10 bg-white/5 active:bg-white/10'}`}
                  >
                    <Avatar room={room} id={id} size="lg" />
                    <span className="max-w-full truncate text-lg font-black text-violet-50">{nameOf(room, id)}</span>
                    {active && <Fingerprint className="size-5 text-violet-200" />}
                  </button>
                );
              })}
          </div>
          <p className="text-center text-sm font-bold text-violet-200/60">
            {pub.voted.length}/{pub.order.length} haben abgestimmt
          </p>
        </>
      );
    case 'guess':
      return priv.role === 'imposter' ? <GuessForm onGuess={(text) => sendAction('guess', { text })} /> : <Center title={`${nameOf(room, pub.accusedId)} wurde enttarnt!`} text="Jetzt rät der Imposter das geheime Wort …" />;
    case 'result': {
      const r = pub.result;
      if (!r) return null;
      const gained = r.gained[me.id] ?? 0;
      const iWasImposter = r.imposterId === me.id;
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-violet-300/70">{iWasImposter ? 'Du warst der Imposter' : `${nameOf(room, r.imposterId)} war der Imposter`}</div>
          <Avatar room={room} id={r.imposterId} size="xl" />
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.25em] text-violet-300/70">Das Wort</div>
            <div className="font-mystery glow-violet text-4xl font-extrabold text-white">{r.word}</div>
          </div>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }} className={`rounded-full px-5 py-2 text-2xl font-black ${gained ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/5 text-violet-200/60'}`}>
            {gained ? `+${gained} Punkte` : 'Keine Punkte'}
          </motion.div>
        </div>
      );
    }
  }
}

/** Geheime Karte – nur sichtbar, solange sie gedrückt gehalten wird */
function SecretCard({ pub, priv, big }: { pub: ImposterPublicState; priv: ImposterPrivateState; big?: boolean }) {
  const [open, setOpen] = useState(false);
  const imposter = priv.role === 'imposter';
  const show = (on: boolean) => {
    if (on && !open) haptics.play(imposter ? 'heavy' : 'light');
    setOpen(on);
  };
  return (
    <button
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* egal */
        }
        show(true);
      }}
      onPointerUp={() => show(false)}
      onPointerCancel={() => show(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full select-none overflow-hidden rounded-[28px] border text-center transition-[box-shadow,border-color] ${big ? 'min-h-[46dvh]' : 'min-h-[22dvh]'} ${open ? (imposter ? 'border-pink-300/70 shadow-[0_0_50px_rgba(244,114,182,0.55)]' : 'border-violet-300/70 shadow-[0_0_50px_rgba(168,85,247,0.55)]') : 'border-violet-400/25'}`}
      style={{ background: 'linear-gradient(160deg, rgba(76,29,149,0.55), rgba(17,8,33,0.85))', touchAction: 'none' }}
      aria-label="Karte gedrückt halten zum Aufdecken"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5">
        {open ? (
          imposter ? (
            <>
              <div className="text-sm font-bold uppercase tracking-[0.3em] text-pink-200/80">Psst …</div>
              <div className="font-mystery text-4xl font-extrabold text-pink-100 [text-shadow:0_0_24px_rgba(244,114,182,0.8)]">Du bist der Imposter</div>
              <div className="font-semibold text-violet-100/80">{pub.category ? `Kategorie: ${pub.category}` : 'Du kennst das Wort nicht – bluffe!'}</div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold uppercase tracking-[0.3em] text-violet-200/70">Das geheime Wort{pub.category ? ` · ${pub.category}` : ''}</div>
              <div className="font-mystery glow-violet text-4xl font-extrabold break-words text-white">{priv.word}</div>
            </>
          )
        ) : (
          <>
            <Eye className="size-10 text-violet-300/80" />
            <div className="text-lg font-black text-violet-100">Gedrückt halten zum Aufdecken</div>
            <div className="text-xs font-semibold text-violet-200/50">Pass auf, dass niemand mitschaut</div>
          </>
        )}
      </div>
    </button>
  );
}

function GuessForm({ onGuess }: { onGuess: (text: string) => void }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <form
      className="flex flex-1 flex-col justify-center gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim() || sent) return;
        setSent(true);
        onGuess(text.trim());
      }}
    >
      <div className="text-center">
        <div className="font-mystery text-3xl font-extrabold text-pink-100 [text-shadow:0_0_24px_rgba(244,114,182,0.8)]">Du wurdest enttarnt!</div>
        <p className="mt-2 font-semibold text-violet-100/80">Letzte Chance: Welches Wort hatten die anderen?</p>
      </div>
      <input
        autoFocus
        value={text}
        maxLength={60}
        onChange={(e) => setText(e.target.value)}
        disabled={sent}
        placeholder="Dein Tipp"
        className="h-14 rounded-2xl border border-violet-300/40 bg-black/30 px-4 text-xl font-bold text-white outline-none placeholder:text-violet-200/40 focus:border-violet-300"
      />
      <BigButton type="submit" disabled={sent || !text.trim()}>
        <Send className="size-5" /> {sent ? 'Gesendet' : 'Raten'}
      </BigButton>
    </form>
  );
}

function BigButton({ children, onClick, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-violet-500 to-violet-700 px-5 text-xl font-black text-white shadow-[0_6px_0_#3b0f6e,0_0_30px_rgba(139,92,246,0.45)] transition active:translate-y-1 active:shadow-[0_2px_0_#3b0f6e] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Center({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="font-mystery glow-violet text-3xl font-extrabold text-white">{title}</div>
      <p className="max-w-sm font-semibold text-violet-100/75">{text}</p>
    </div>
  );
}
