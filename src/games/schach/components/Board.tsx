import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { FILES, piecesOf, type Target } from './board-utils';
import { Piece } from './pieces';
import type { Side } from '../types';

const LIGHT = '#eeeed2';
const DARK = '#769656';

interface Props {
  fen: string;
  orientation: Side;
  lastMove?: { from: string; to: string } | null;
  selected?: string | null;
  targets?: Target[];
  check?: string | null;
  /** Anzahl der Züge – damit die Bewegung des letzten Zugs genau einmal animiert wird */
  ply: number;
  onSquare?: (sq: string) => void;
  className?: string;
}

/** Schachbrett im Stil der bekannten Online-Bretter: grün/creme, Markierungen, Koordinaten */
export function Board({ fen, orientation, lastMove, selected, targets = [], check, ply, onSquare, className = '' }: Props) {
  const pieces = useMemo(() => piecesOf(fen), [fen]);
  const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'w' ? FILES.split('') : FILES.split('').reverse();
  const idx = (sq: string) => {
    const f = files.indexOf(sq[0]!);
    const r = ranks.indexOf(Number(sq[1]));
    return { f, r };
  };
  const targetMap = new Map(targets.map((t) => [t.to, t]));

  return (
    <div className={`relative grid aspect-square select-none grid-cols-8 grid-rows-8 overflow-hidden rounded-md shadow-2xl ${className}`}>
      {ranks.map((rank, r) =>
        files.map((file, f) => {
          const sq = `${file}${rank}`;
          const dark = (FILES.indexOf(file) + rank) % 2 === 0;
          const piece = pieces.get(sq);
          const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const target = targetMap.get(sq);
          const fromIdx = lastMove && lastMove.to === sq ? idx(lastMove.from) : null;
          return (
            <div
              key={sq}
              onPointerDown={onSquare ? (e) => (e.preventDefault(), onSquare(sq)) : undefined}
              className="relative"
              style={{ background: dark ? DARK : LIGHT }}
            >
              {isLast && <div className="absolute inset-0" style={{ background: 'rgba(255, 235, 59, 0.45)' }} />}
              {selected === sq && <div className="absolute inset-0" style={{ background: 'rgba(255, 214, 0, 0.6)' }} />}
              {check === sq && <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255,0,0,0.9) 0%, rgba(231,0,0,0.5) 45%, transparent 75%)' }} />}
              {/* Koordinaten am Rand */}
              {f === 0 && (
                <span className="absolute left-[4%] top-[2%] text-[clamp(7px,1.4cqw,14px)] font-black leading-none" style={{ color: dark ? LIGHT : DARK }}>
                  {rank}
                </span>
              )}
              {r === 7 && (
                <span className="absolute bottom-[2%] right-[5%] text-[clamp(7px,1.4cqw,14px)] font-black leading-none" style={{ color: dark ? LIGHT : DARK }}>
                  {file}
                </span>
              )}
              {piece && (
                <motion.div
                  key={`${sq}-${piece.color}${piece.type}-${fromIdx ? ply : 'x'}`}
                  className="absolute inset-[4%] z-10"
                  initial={fromIdx && fromIdx.f >= 0 ? { x: `${(fromIdx.f - f) * 108}%`, y: `${(fromIdx.r - r) * 108}%` } : false}
                  animate={{ x: 0, y: 0 }}
                  transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
                >
                  <Piece type={piece.type} color={piece.color} className="size-full drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]" />
                </motion.div>
              )}
              {target &&
                (target.capture ? (
                  <div className="absolute inset-0 z-20 rounded-full border-[6px] border-black/20" />
                ) : (
                  <div className="absolute left-1/2 top-1/2 z-20 size-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20" />
                ))}
            </div>
          );
        }),
      )}
    </div>
  );
}
