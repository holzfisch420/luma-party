import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';
import { Piece, type PieceType } from './pieces';

// eine kleine Eröffnung, die sich im Hintergrund abspielt (Feld = [Spalte, Reihe] von 0)
const START: { t: PieceType; c: 'w' | 'b'; f: number; r: number }[] = [
  { t: 'k', c: 'w', f: 4, r: 0 }, { t: 'q', c: 'w', f: 3, r: 0 }, { t: 'n', c: 'w', f: 6, r: 0 }, { t: 'b', c: 'w', f: 5, r: 0 },
  { t: 'p', c: 'w', f: 4, r: 1 }, { t: 'p', c: 'w', f: 3, r: 1 }, { t: 'r', c: 'w', f: 0, r: 0 },
  { t: 'k', c: 'b', f: 4, r: 7 }, { t: 'q', c: 'b', f: 3, r: 7 }, { t: 'n', c: 'b', f: 1, r: 7 }, { t: 'p', c: 'b', f: 4, r: 6 }, { t: 'p', c: 'b', f: 2, r: 6 }, { t: 'r', c: 'b', f: 7, r: 7 },
];
const MOVES: [number, number, number][] = [
  [4, 4, 3], [10, 4, 4], [2, 5, 2], [9, 2, 5], [5, 2, 3], [11, 2, 4],
];
const ICONS: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

/** Schachbrett in Perspektive, im Hintergrund spielt sich eine Eröffnung ab */
export function SchachTitleScreen({ meta, room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const [pos, setPos] = useState(START);
  useEffect(() => {
    let k = 0;
    const id = setInterval(() => {
      if (k >= MOVES.length) {
        k = 0;
        setPos(START);
        return;
      }
      const [idx, f, r] = MOVES[k++]!;
      setPos((p) => p.map((x, i) => (i === idx ? { ...x, f, r } : x)));
      playSfx('thunk-1', { vol: 0.25, vary: 0.1 });
    }, 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_30%_10%,#4f6b3a,#1c2416_70%)] text-white">
      {/* Brett in Perspektive */}
      <div className="absolute bottom-[-4vh] left-[2vw] [perspective:900px]">
        <div className="relative size-[78vh] [transform:rotateX(52deg)_rotateZ(-14deg)] [transform-style:preserve-3d]">
          <div className="grid size-full grid-cols-8 grid-rows-8 overflow-hidden rounded-md shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} style={{ background: (Math.floor(i / 8) + i) % 2 ? '#769656' : '#eeeed2' }} />
            ))}
          </div>
          {pos.map((p, i) => (
            <motion.div
              key={i}
              className="absolute size-[12.5%] [transform-origin:bottom]"
              animate={{ left: `${p.f * 12.5}%`, top: `${(7 - p.r) * 12.5}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              <div className="size-full [transform:rotateZ(14deg)_rotateX(-52deg)_translateY(-45%)_scale(1.6)]">
                <Piece type={p.t} color={p.c} className="size-full drop-shadow-[0_6px_3px_rgba(0,0,0,0.5)]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="absolute right-[6vw] top-[8vh] w-[40vw] text-right">
        <motion.h1 initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="font-stage text-[8vw] font-black leading-none tracking-tight [text-shadow:0_6px_20px_rgba(0,0,0,0.5)]">
          {meta.name}
        </motion.h1>
        <p className="mt-2 font-stage text-2xl italic text-[#cfe3b6]">{meta.tagline}</p>
      </div>
      {/* Knöpfe wie Zugnotation mit Figur */}
      <div className="absolute bottom-[12vh] right-[6vw] flex w-[34vw] flex-col gap-[1.2vh]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              animate={{ x: f ? '-1.4vw' : 0 }}
              className={`flex items-center gap-[1.4vw] rounded-xl px-[1.4vw] py-[1.1vh] text-left font-black ${start ? 'text-[2.4vw]' : 'text-[1.7vw]'} ${f ? 'bg-[#eeeed2] text-[#262421] shadow-[0_0_0_4px_#81b64c]' : 'bg-black/35 text-white/90'} ${start && blocked ? 'opacity-50' : ''}`}
            >
              <Piece type={ICONS[i % ICONS.length]!} color={f ? 'b' : 'w'} className={start ? 'size-[4vw]' : 'size-[3vw]'} />
              <span className="font-mono text-[1.2vw] opacity-50">{i + 1}.</span>
              {it.label}
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[4vh] right-[6vw] flex items-center gap-3">
        <BlockedHint blocked={blocked} />
        <span className="text-lg font-bold text-white/55">{controlLine(room)}</span>
      </div>
    </div>
  );
}
