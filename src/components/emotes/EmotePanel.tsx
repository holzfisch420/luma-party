import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { playSfx } from '../../app/audio/sfx';
import { haptics } from '../../app/haptics';
import { emitWithAck } from '../../app/session/socket';
import { EFFECTS, EMOTE_COOLDOWN_MS, EMOTES, type EmoteDef } from '../../shared/emotes';
import type { PublicPlayer } from '../../shared/types/room';
import { EmoteAvatar } from './EmoteAvatar';

interface Flight {
  key: number;
  emote: EmoteDef | null;
  effect: string | null;
  x: number;
  y: number;
  size: number;
}

/**
 * Für Zuschauer: 3×3 Emotes (plus „GG!“) vom eigenen Avatar und einmal pro Spiel ein Bildschirmeffekt.
 * Ausgewähltes fliegt nach oben aus dem Handy – Richtung Fernseher.
 */
/** Abklingzeit überlebt das Ein-/Ausblenden des Menüs */
let lastReadyAt = 0;

export function EmotePanel({ me, effectUsed, onEffectUsed }: { me: PublicPlayer; effectUsed: boolean; onEffectUsed: () => void }) {
  const [open, setOpen] = useState(true);
  const [readyAt, setReadyAtState] = useState(lastReadyAt);
  const setReadyAt = (v: number) => {
    lastReadyAt = v;
    setReadyAtState(v);
  };
  const [now, setNow] = useState(Date.now());
  const [flights, setFlights] = useState<Flight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (now >= readyAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [readyAt, now]);

  const cooling = now < readyAt;
  const left = Math.max(0, readyAt - now);

  const launch = (el: HTMLElement, emote: EmoteDef | null, effect: string | null) => {
    const r = el.getBoundingClientRect();
    setFlights((f) => [...f, { key: Date.now() + Math.random(), emote, effect, x: r.left + r.width / 2, y: r.top + r.height / 2, size: Math.min(r.width, r.height) }]);
    playSfx('whoosh', { vol: 0.6, rate: 1.2 });
    haptics.play('medium');
  };

  const sendEmote = (emote: EmoteDef, el: HTMLElement) => {
    if (cooling) return;
    launch(el, emote, null);
    const t = Date.now();
    setReadyAt(t + EMOTE_COOLDOWN_MS);
    setNow(t);
    emitWithAck('player:emote', { kind: 'emote', id: emote.id }).catch((e: Error) => setError(e.message));
  };

  const sendEffect = (id: string, el: HTMLElement) => {
    if (effectUsed) return;
    launch(el, null, id);
    onEffectUsed();
    emitWithAck('player:emote', { kind: 'effect', id }).catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 2500);
    return () => clearTimeout(t);
  }, [error]);

  const grid = EMOTES.slice(0, 9);
  const extra = EMOTES[9]!;

  return createPortal(
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[90] touch-none select-none rounded-t-[28px] border-t border-white/15 bg-[#1b1530]/95 px-3 pb-3 pt-2 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md safe-pb"
          >
            <button onClick={() => setOpen(false)} className="flex w-full items-center justify-between px-1 pb-2" aria-label="Emotes einklappen">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Du schaust zu – feuere an!</span>
              <ChevronDown className="size-5 text-white/60" />
            </button>
            <div className="relative">
              <div className="grid grid-cols-3 gap-2">
                {grid.map((e) => (
                  <EmoteButton key={e.id} me={me} emote={e} disabled={cooling} onSend={sendEmote} />
                ))}
              </div>
              <button
                disabled={cooling}
                onClick={(ev) => sendEmote(extra, ev.currentTarget)}
                className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-white/10 py-1 transition active:scale-95 disabled:opacity-40"
              >
                <EmoteAvatar avatar={me.avatar} seed={me.id} emote={extra} size={30} still />
                <span className="text-lg font-black">
                  {extra.emoji} {extra.bubble}
                </span>
              </button>
              {cooling && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="grid size-16 place-items-center rounded-full bg-black/60 text-2xl font-black tabular-nums">{Math.ceil(left / 1000)}</div>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1.5 px-1">
              <Sparkles className="size-4 shrink-0 text-[#ffd23f]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-white/60">{effectUsed ? 'Bildschirmeffekt verschickt' : 'Bildschirmeffekt · 1× pro Spiel'}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-6 gap-1">
              {EFFECTS.map((f) => (
                <button
                  key={f.id}
                  disabled={effectUsed}
                  onClick={(ev) => sendEffect(f.id, ev.currentTarget)}
                  className="flex min-w-0 flex-col items-center rounded-xl bg-gradient-to-b from-[#ffd23f]/25 to-[#ff4d6d]/20 px-0.5 py-1 transition active:scale-90 disabled:opacity-30"
                  title={f.label}
                >
                  <span className="text-2xl leading-none">{f.emoji}</span>
                  <span className="w-full truncate text-center text-[8.5px] font-black">{f.label}</span>
                </button>
              ))}
            </div>
            {error && <div className="mt-2 rounded-xl bg-[#e03131]/80 px-3 py-1 text-center text-xs font-black">{error}</div>}
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Emotes öffnen"
            className="fixed bottom-4 right-4 z-[90] grid size-16 place-items-center rounded-full bg-[#1b1530] text-3xl shadow-xl ring-2 ring-white/30"
          >
            😀
            {cooling && <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-[#ff4d6d] text-xs font-black text-white">{Math.ceil(left / 1000)}</span>}
          </motion.button>
        )}
      </AnimatePresence>
      {/* Flug nach oben aus dem Handy hinaus */}
      {flights.map((f) => (
        <motion.div
          key={f.key}
          className="pointer-events-none fixed z-[95]"
          style={{ left: f.x - f.size / 2, top: f.y - f.size / 2, width: f.size, height: f.size }}
          initial={{ y: 0, scale: 1, opacity: 1 }}
          animate={{ y: -(f.y + f.size * 2), scale: [1, 1.5, 0.7], rotate: [0, -8, 8], opacity: [1, 1, 0.9] }}
          transition={{ duration: 0.75, ease: [0.5, 0, 0.75, 0] }}
          onAnimationComplete={() => setFlights((all) => all.filter((x) => x.key !== f.key))}
        >
          {f.emote ? (
            <EmoteAvatar avatar={me.avatar} seed={me.id} emote={f.emote} size={f.size} still />
          ) : (
            <div className="grid size-full place-items-center text-6xl">{EFFECTS.find((x) => x.id === f.effect)?.emoji}</div>
          )}
        </motion.div>
      ))}
    </>,
    document.body,
  );
}

function EmoteButton({ me, emote, disabled, onSend }: { me: PublicPlayer; emote: EmoteDef; disabled: boolean; onSend: (e: EmoteDef, el: HTMLElement) => void }) {
  return (
    <button
      disabled={disabled}
      onClick={(ev) => onSend(emote, ev.currentTarget.querySelector('[data-face]') as HTMLElement)}
      className="flex flex-col items-center gap-0.5 rounded-2xl bg-white/[0.08] py-1.5 transition active:scale-90 disabled:opacity-40"
    >
      <div data-face className="relative">
        <EmoteAvatar avatar={me.avatar} seed={me.id} emote={emote} size={Math.min(58, Math.round(window.innerWidth * 0.14))} still />
        <span className="absolute -bottom-1 -right-2 text-xl drop-shadow">{emote.emoji}</span>
      </div>
      <span className="text-[11px] font-black text-white/85">{emote.label}</span>
    </button>
  );
}
