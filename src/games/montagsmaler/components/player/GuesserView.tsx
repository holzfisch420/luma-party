import { AnimatePresence, motion } from 'framer-motion';
import { Send, Tv } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useGameEvent } from '../../../../app/session/hooks';
import { Burst } from '../../../../components/comic/Burst';
import { fitWord } from '../../../../components/comic/fit-text';
import type { PublicPlayer } from '../../../../shared/types/room';
import { GUESS_MAX_LENGTH } from '../../game-config';
import type { StrokeModel } from '../../logic/stroke-model';
import { MM_EVENTS, type GuessFeedbackEvent, type MontagsmalerPrivateState, type MontagsmalerPublicState } from '../../types';
import { CanvasView } from '../CanvasView';
import { DrawingSheet } from '../DrawingSheet';
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
    if (e.kind === 'close') setFeedback({ id: Date.now(), msg: `„${e.text}“ – knapp daneben!`, tone: 'warn' });
    else if (e.kind === 'rate-limited') setFeedback({ id: Date.now(), msg: 'Nicht so schnell!', tone: 'info' });
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
    <div className="flex min-h-0 flex-1 flex-col">
      <PlayerHeader
        state={state}
        right={
          <div className="comic-box-sm rotate-2 px-2.5 py-0.5 text-center">
            <div className="text-[11px] font-bold leading-none">Punkte</div>
            <div className="font-bangers text-2xl leading-none">{myScore}</div>
          </div>
        }
      >
        <div className="font-bangers mt-1 truncate text-2xl leading-none">{drawer ? `${drawer.name} ${choosing ? 'wählt …' : 'zeichnet!'}` : '…'}</div>
      </PlayerHeader>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4">
        {showPreview && !choosing ? (
          <div className="min-h-0 w-full flex-1 [container-type:size]">
            <button onClick={() => setShowPreview(false)} className="mx-auto block" style={{ width: 'min(calc(100cqw - 8px), calc(100cqh - 8px))' }} aria-label="Vorschau ausblenden">
              <DrawingSheet tape={false}>
                <CanvasView model={model} />
              </DrawingSheet>
            </button>
          </div>
        ) : (
          <button onClick={() => setShowPreview(true)} className="comic-box-sm flex flex-col items-center gap-2 px-5 py-4" disabled={choosing}>
            <Tv className="size-10" />
            <span className="text-sm font-bold">{choosing ? 'Gleich geht’s los – schau zum Fernseher!' : 'Schau zum Fernseher · Tippen für Vorschau'}</span>
          </button>
        )}
        {state.wordMask && <WordMask mask={state.wordMask} size="sm" />}
        {state.category && <div className="rotate-1 rounded-md border-2 border-ink bg-pop-pink px-2 text-sm font-bold">Kategorie: {state.category}</div>}
      </div>

      <div className="px-4 pt-3 safe-pb">
        <AnimatePresence mode="wait">
          {priv.hasGuessed ? (
            <motion.div key="done" initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="mx-auto">
              <Burst color="#7dea9f" className="mx-auto aspect-[1.9] w-80" spikes={18}>
                <div className="font-bangers text-4xl leading-none">Richtig!</div>
                <div className="text-base font-bold">
                  Das Wort ist <span className="font-bangers" style={{ fontSize: fitWord(priv.word ?? '', 1.25, 9) }}>{priv.word}</span>
                </div>
              </Burst>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} className="flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 6, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: -1 }}
                    exit={{ opacity: 0 }}
                    className={`self-start rounded-lg border-2 border-ink px-3 py-1 text-sm font-bold shadow-[2px_2px_0_#161616] ${feedback.tone === 'warn' ? 'bg-pop-yellow' : 'bg-white'}`}
                  >
                    {feedback.msg}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-2.5">
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
                  className="comic-input flex-1 disabled:opacity-50"
                />
                <motion.button
                  whileTap={{ x: 3, y: 3, boxShadow: '0 0 0 #161616' }}
                  type="submit"
                  disabled={choosing || !text.trim()}
                  aria-label="Absenden"
                  className="grid size-14 shrink-0 place-items-center rounded-[14px] border-[3px] border-ink bg-pop-yellow shadow-[3px_3px_0_#161616] disabled:opacity-40"
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
