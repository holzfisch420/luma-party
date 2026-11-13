import { motion, useAnimationControls } from 'framer-motion';
import { Delete, CornerDownLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { useSecondsLeft } from '../../../../app/session/hooks';
import type { PlayerViewProps } from '../../../game-types';
import { KEYBOARD_ROWS, MAX_GUESSES, WORD_LENGTH } from '../../game-config';
import type { Mark, WortPrivateState, WortPublicState } from '../../types';
import { Board, MARK_COLORS, Tile } from '../shared';
import { playSfx } from '../../../../app/audio/sfx';

type Props = PlayerViewProps<WortPublicState, WortPrivateState>;

/** Handy: eigenes Raster und Tastatur mit Farbhinweisen */
export function WortController({ me, state, sendAction }: Props) {
  const pub = state.public;
  const priv = state.private;
  const guesses = priv?.guesses ?? [];
  const marks = priv?.marks ?? [];
  const board = pub.boards[me.id];
  const done = !!board && (board.solved || board.failed);
  const playing = pub.phase === 'play' && !!board && !done;
  const [current, setCurrent] = useState('');
  const shake = useAnimationControls();
  const secs = useSecondsLeft(pub.phaseEndsAt);

  // neue Runde / angenommener Versuch: Eingabe leeren
  useEffect(() => setCurrent(''), [pub.round, guesses.length]);

  // Fehler (unbekanntes Wort): wackeln
  const lastError = useRef<number | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  useEffect(() => {
    const e = priv?.error;
    if (!e || e.id === lastError.current) return;
    lastError.current = e.id;
    haptics.play('error');
    void shake.start({ x: [0, -10, 10, -8, 8, 0], transition: { duration: 0.35 } });
    setErrorText(e.message);
    const t = setTimeout(() => setErrorText(null), 1600);
    return () => clearTimeout(t);
  }, [priv?.error, shake]);

  // gelöst: Freude
  const wasSolved = useRef(false);
  useEffect(() => {
    if (board?.solved && !wasSolved.current) haptics.play('success');
    wasSolved.current = !!board?.solved;
  }, [board?.solved]);

  // beste bekannte Farbe je Buchstabe für die Tastatur
  const keyMarks = useMemo(() => {
    const rank: Record<Mark, number> = { x: 0, y: 1, g: 2 };
    const m = new Map<string, Mark>();
    guesses.forEach((g, r) =>
      [...g].forEach((ch, i) => {
        const mk = marks[r]?.[i];
        if (!mk) return;
        const prev = m.get(ch);
        if (!prev || rank[mk] > rank[prev]) m.set(ch, mk);
      }),
    );
    return m;
  }, [guesses, marks]);

  const press = (key: string) => {
    if (!playing) return;
    if (key === 'ENTER') {
      if (current.length !== WORD_LENGTH) {
        haptics.play('error');
        void shake.start({ x: [0, -8, 8, 0], transition: { duration: 0.25 } });
        setErrorText('Genau 5 Buchstaben');
        return;
      }
      haptics.play('medium');
      sendAction('guess', { word: current });
      return;
    }
    haptics.play('tick');
    playSfx('key', { vol: 0.35, vary: 0.1 });
    if (key === 'DEL') setCurrent((c) => c.slice(0, -1));
    else setCurrent((c) => (c.length < WORD_LENGTH ? c + key : c));
  };

  // echte Tastatur (z. B. Tablet mit Tastatur)
  const pressRef = useRef(press);
  pressRef.current = press;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') pressRef.current('ENTER');
      else if (e.key === 'Backspace') pressRef.current('DEL');
      else if (/^[a-zäöüA-ZÄÖÜ]$/.test(e.key)) pressRef.current(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tile = Math.min(58, Math.floor((Math.min(window.innerWidth, 440) - 56) / WORD_LENGTH));

  return (
    <div className="newsprint fixed inset-0 flex flex-col safe-pt safe-pb">
      <header className="px-4 pt-3">
        <div className="flex items-center justify-between font-typewriter text-sm">
          <span>Ausgabe {pub.round}/{pub.rounds}</span>
          <span className="flex items-center gap-2">
            {pub.scores[me.id] ?? 0} P.
            {pub.phase === 'play' && <span className={`rounded-full border-2 px-2 tabular-nums ${secs <= 20 ? 'border-[#b3261e] text-[#b3261e]' : 'border-[#2a241c]'}`}>{secs}s</span>}
          </span>
        </div>
        <div className="news-rule mt-1" />
        <div className="py-0.5 text-center font-stage text-3xl font-black leading-tight">Der Wortknacker</div>
        <div className="news-rule" />
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4">
        {errorText && (
          <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-2 z-10 rotate-[-2deg] border-2 border-[#b3261e] bg-[#fbf6e9] px-4 py-1 font-typewriter text-base text-[#b3261e] shadow">
            {errorText}
          </motion.div>
        )}
        <motion.div animate={shake}>
          <Board marks={marks} letters={guesses} current={current} size={tile} gap={6} showCurrent={playing} />
        </motion.div>
        {pub.phase === 'reveal' && pub.reveal ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="font-stage text-lg font-bold italic">Das Wort lautete</div>
            <div className="flex gap-1.5">
              {[...pub.reveal.word].map((ch, i) => (
                <Tile key={i} letter={ch} mark="g" size={40} flipDelay={i * 0.1} />
              ))}
            </div>
            <div className="font-typewriter text-lg">{pub.reveal.gained[me.id] ? `+${pub.reveal.gained[me.id]} Punkte` : 'Diesmal keine Punkte'}</div>
          </div>
        ) : board?.solved ? (
          <div className="rotate-[-3deg] border-4 border-[#2f7d4f] px-4 py-1 font-typewriter text-xl text-[#2f7d4f]">GEKNACKT in {guesses.length}! {board.place === 1 ? '★ Erste/r' : `Platz ${board.place}`}</div>
        ) : board?.failed ? (
          <div className="font-typewriter text-base">Keine Versuche mehr – warte auf die Auflösung</div>
        ) : !board ? (
          <div className="font-typewriter text-base">Nächste Runde machst du mit!</div>
        ) : (
          <div className="font-typewriter text-sm text-[#2a241c]/70">Versuch {Math.min(guesses.length + 1, MAX_GUESSES)} von {MAX_GUESSES}</div>
        )}
      </div>

      {/* Tastatur */}
      <div className={`flex flex-col gap-1.5 px-1.5 pb-3 pt-2 ${playing ? '' : 'pointer-events-none opacity-40'}`}>
        {KEYBOARD_ROWS.map((row, r) => (
          <div key={row} className="flex justify-center gap-1">
            {r === 2 && <Key label={<CornerDownLeft className="size-5" />} wide onPress={() => press('ENTER')} aria="Raten" accent />}
            {[...row].map((k) => {
              const mk = keyMarks.get(k);
              return <Key key={k} label={k} mark={mk} onPress={() => press(k)} />;
            })}
            {r === 2 && <Key label={<Delete className="size-5" />} wide onPress={() => press('DEL')} aria="Löschen" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Key({ label, mark, wide, onPress, aria, accent }: { label: React.ReactNode; mark?: Mark; wide?: boolean; onPress: () => void; aria?: string; accent?: boolean }) {
  const c = mark ? MARK_COLORS[mark] : null;
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      aria-label={aria ?? (typeof label === 'string' ? label : undefined)}
      className={`grid aspect-square place-items-center rounded-full border-2 border-[#9a8f78] font-typewriter text-lg shadow-[0_3px_0_#2a241c,inset_0_2px_0_rgba(255,255,255,0.25)] active:translate-y-[2px] active:shadow-[0_1px_0_#2a241c] ${wide ? 'flex-[1.5] aspect-auto h-auto rounded-2xl' : 'flex-1'}`}
      style={{ background: c ? c.bg : accent ? '#2f7d4f' : '#2f2a24', color: c ? c.text : '#f6efdc', minWidth: 0, maxWidth: wide ? 72 : 40, opacity: mark === 'x' ? 0.28 : 1 }}
    >
      {label}
    </button>
  );
}
