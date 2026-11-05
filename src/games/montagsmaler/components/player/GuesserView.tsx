import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Send, Tv } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useGameEvent } from '../../../../app/session/hooks';
import type { PublicPlayer } from '../../../../shared/types/room';
import { GUESS_MAX_LENGTH } from '../../game-config';
import type { StrokeModel } from '../../logic/stroke-model';
import { MM_EVENTS, type GuessFeedbackEvent, type MontagsmalerPrivateState, type MontagsmalerPublicState } from '../../types';
import { CanvasView } from '../CanvasView';
import { WordMask } from '../WordMask';
import { PlayerHeader } from './PlayerHeader';

interface GuesserViewProps {
  state: MontagsmalerPublicState;
  priv: Extract<MontagsmalerPrivateState, { role: 'guesser' }>;
  drawer: PublicPlayer | undefined;
  myScore: number;
  model: StrokeModel;
  sendAction: (type: string, payload?: unknown) => void;
}

export function GuesserView({ state, priv, drawer, myScore, model, sendAction }: GuesserViewProps) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<{ id: number; msg: string; tone: 'warn' | 'info' } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useGameEvent<GuessFeedbackEvent>(MM_EVENTS.feedback, (e) => {
    if (e.kind === 'close') setFeedback({ id: Date.now(), msg: `„${e.text}“ ist knapp daneben!`, tone: 'warn' });
    else if (e.kind === 'rate-limited') setFeedback({ id: Date.now(), msg: 'Nicht so schnell – kurz warten.', tone: 'info' });
    else setFeedback(null);
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    sendAction('guess', { text: value });
    setText('');
    inputRef.current?.focus();
  };

  const choosing = state.phase === 'choosing';

  return (
    <div className="flex h-dvh flex-col">
      <PlayerHeader
        state={state}
        right={
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Punkte</div>
            <div className="text-xl font-semibold tabular-nums">{myScore}</div>
          </div>
        }
      >
        <div className="truncate text-lg font-semibold">{drawer ? `${drawer.name} ${choosing ? 'wählt ein Wort …' : 'zeichnet'}` : '…'}</div>
      </PlayerHeader>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4">
        {showPreview && !choosing ? (
          <div className="min-h-0 w-full flex-1 [container-type:size]">
            <button
              onClick={() => setShowPreview(false)}
              className="mx-auto block overflow-hidden rounded-3xl ring-1 ring-white/10"
              style={{ width: 'min(100cqw, 100cqh)' }}
              aria-label="Vorschau ausblenden"
            >
              <CanvasView model={model} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowPreview(true)} className="flex flex-col items-center gap-2 text-white/50" disabled={choosing}>
            <Tv className="size-10" />
            <span className="text-sm">{choosing ? 'Gleich geht’s los – schau auf den Bildschirm!' : 'Schau auf den Bildschirm · Tippen für Vorschau'}</span>
          </button>
        )}
        {state.wordMask && <WordMask mask={state.wordMask} size="sm" />}
        {state.category && <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">Kategorie: {state.category}</div>}
      </div>

      <div className="px-4 pt-3 safe-pb">
        <AnimatePresence mode="wait">
          {priv.hasGuessed ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-3xl bg-emerald-400/15 px-5 py-4 text-emerald-100"
            >
              <CheckCircle2 className="size-7 shrink-0 text-emerald-300" />
              <div>
                <div className="font-semibold">Richtig erraten!</div>
                <div className="text-sm text-emerald-100/70">
                  Das Wort ist <strong className="text-white">{priv.word}</strong>
                  {state.turnGains && Object.keys(state.turnGains).length ? '' : ''}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} className="flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium ${feedback.tone === 'warn' ? 'bg-amber-300/15 text-amber-100' : 'bg-white/10 text-white/70'}`}
                  >
                    {feedback.msg}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={GUESS_MAX_LENGTH}
                  disabled={choosing}
                  placeholder={choosing ? 'Warte auf das Wort …' : 'Deine Vermutung …'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  enterKeyHint="send"
                  className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.07] px-5 text-lg outline-none transition placeholder:text-white/35 focus:border-white/40 disabled:opacity-50"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="submit"
                  disabled={choosing || !text.trim()}
                  aria-label="Absenden"
                  className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-black transition disabled:opacity-30"
                >
                  <Send className="size-6" />
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
