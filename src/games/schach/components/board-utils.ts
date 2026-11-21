import { Chess, type Square } from 'chess.js';
import type { PieceType } from './pieces';
import type { Side } from '../types';

export const FILES = 'abcdefgh';

export interface BoardPiece {
  type: PieceType;
  color: Side;
}

/** Stellung als Feld → Figur */
export function piecesOf(fen: string): Map<string, BoardPiece> {
  const m = new Map<string, BoardPiece>();
  const rows = fen.split(' ')[0]!.split('/');
  rows.forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/[0-9]/.test(ch)) {
        f += Number(ch);
        continue;
      }
      const color: Side = ch === ch.toUpperCase() ? 'w' : 'b';
      m.set(`${FILES[f]}${8 - r}`, { type: ch.toLowerCase() as PieceType, color });
      f++;
    }
  });
  return m;
}

const START: Record<PieceType, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** geschlagene Figuren je Farbe und Materialvorteil (positiv = Weiß vorne) */
export function captured(fen: string): { w: PieceType[]; b: PieceType[]; diff: number } {
  const count = { w: { ...START }, b: { ...START } };
  for (const p of piecesOf(fen).values()) count[p.color][p.type]--;
  const list = (side: Side) => (['q', 'r', 'b', 'n', 'p'] as PieceType[]).flatMap((t) => Array.from({ length: Math.max(0, count[side][t]) }, () => t));
  // Material auf dem Brett
  let diff = 0;
  for (const p of piecesOf(fen).values()) diff += (p.color === 'w' ? 1 : -1) * VALUE[p.type];
  // geschlagene Figuren von Weiß = von Schwarz verloren
  return { w: list('b'), b: list('w'), diff };
}

export interface Target {
  to: string;
  capture: boolean;
  promotion: boolean;
}

export function legalTargets(fen: string, from: string): Target[] {
  try {
    const c = new Chess(fen);
    return c.moves({ square: from as Square, verbose: true }).map((m) => ({ to: m.to, capture: !!m.captured, promotion: !!m.promotion }));
  } catch {
    return [];
  }
}

/** Feld des Königs, der im Schach steht */
export function checkSquare(fen: string, inCheck: boolean): string | null {
  if (!inCheck) return null;
  const turn = fen.split(' ')[1] as Side;
  for (const [sq, p] of piecesOf(fen)) if (p.type === 'k' && p.color === turn) return sq;
  return null;
}
