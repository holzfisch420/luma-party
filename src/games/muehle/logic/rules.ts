/**
 * Mühle (Neunsteinmühle) – reine Spielregeln, ohne Server/Client.
 *
 * Punkte 0–23 auf drei Quadraten (Koordinaten auf einem 7×7-Raster):
 *   0───────1───────2
 *   │   3───4───5   │
 *   │   │ 6─7─8 │   │
 *   9──10─11   12─13─14
 *   │   │15─16─17   │
 *   │  18───19───20 │
 *  21──────22──────23
 */

export type Side = 'w' | 'b';
export type Cell = Side | null;

export const POINTS: [number, number][] = [
  [0, 0], [3, 0], [6, 0],
  [1, 1], [3, 1], [5, 1],
  [2, 2], [3, 2], [4, 2],
  [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3],
  [2, 4], [3, 4], [4, 4],
  [1, 5], [3, 5], [5, 5],
  [0, 6], [3, 6], [6, 6],
];

export const MILLS: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
  [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23],
];

/** Nachbarn: in jeder Mühlen-Linie sind aufeinanderfolgende Punkte verbunden */
export const NEIGHBORS: number[][] = Array.from({ length: 24 }, () => []);
for (const [a, b, c] of MILLS) {
  NEIGHBORS[a]!.push(b);
  NEIGHBORS[b]!.push(a, c);
  NEIGHBORS[c]!.push(b);
}

export const PIECES = 9;
/** so viele Züge (Halbzüge) ohne Mühle in der Zugphase = Remis */
export const QUIET_LIMIT = 50;

export interface MillState {
  board: Cell[];
  /** noch zu setzende Steine */
  hand: Record<Side, number>;
  turn: Side;
  /** nach einer Mühle: dieselbe Seite muss einen Stein wegnehmen */
  mustRemove: boolean;
  /** Halbzüge ohne Mühle, seit beide alle Steine gesetzt haben */
  quiet: number;
  flying: boolean;
  winner: Side | null;
  draw: boolean;
  /** letzte Aktion (für Markierung) */
  last: { from?: number; to?: number; removed?: number } | null;
}

export const other = (s: Side): Side => (s === 'w' ? 'b' : 'w');

export function initialState(flying = true): MillState {
  return { board: Array(24).fill(null), hand: { w: PIECES, b: PIECES }, turn: 'w', mustRemove: false, quiet: 0, flying, winner: null, draw: false, last: null };
}

export const countOn = (s: MillState, side: Side) => s.board.filter((c) => c === side).length;

export type Phase = 'place' | 'move' | 'fly';
export function phaseOf(s: MillState, side: Side): Phase {
  if (s.hand[side] > 0) return 'place';
  return s.flying && countOn(s, side) === 3 ? 'fly' : 'move';
}

export function inMill(board: Cell[], p: number): boolean {
  const side = board[p];
  if (!side) return false;
  return MILLS.some((m) => m.includes(p) && m.every((q) => board[q] === side));
}

/** Steine des Gegners, die weggenommen werden dürfen */
export function removable(s: MillState): number[] {
  const opp = other(s.turn);
  const all = s.board.map((c, i) => (c === opp ? i : -1)).filter((i) => i >= 0);
  const free = all.filter((i) => !inMill(s.board, i));
  return free.length ? free : all;
}

/** Ziele für einen Stein (Zug-/Springphase) */
export function targetsFrom(s: MillState, from: number): number[] {
  if (s.board[from] !== s.turn) return [];
  const ph = phaseOf(s, s.turn);
  if (ph === 'place') return [];
  const empty = (i: number) => s.board[i] === null;
  if (ph === 'fly') return s.board.map((_, i) => i).filter(empty);
  return NEIGHBORS[from]!.filter(empty);
}

export function hasMove(s: MillState, side: Side): boolean {
  if (s.hand[side] > 0) return s.board.some((c) => c === null);
  const probe = { ...s, turn: side };
  return s.board.some((c, i) => c === side && targetsFrom(probe, i).length > 0);
}

function afterPlaceOrMove(s: MillState, to: number, from?: number): MillState {
  const formed = inMill(s.board, to);
  s.last = { from, to };
  // Mühle – außer der Gegner hat noch gar keinen Stein auf dem Brett
  if (formed && s.board.some((c) => c === other(s.turn))) {
    s.mustRemove = true;
    s.quiet = 0;
    return s;
  }
  if (s.hand.w === 0 && s.hand.b === 0) s.quiet++;
  return endTurn(s);
}

function endTurn(s: MillState): MillState {
  s.turn = other(s.turn);
  const side = s.turn;
  // verloren: weniger als 3 Steine insgesamt oder kein Zug möglich
  if (countOn(s, side) + s.hand[side] < 3 || !hasMove(s, side)) s.winner = other(side);
  else if (s.quiet >= QUIET_LIMIT) s.draw = true;
  return s;
}

const clone = (s: MillState): MillState => ({ ...s, board: [...s.board], hand: { ...s.hand } });

/** Stein setzen; null = nicht erlaubt */
export function place(s0: MillState, to: number): MillState | null {
  if (s0.winner || s0.draw || s0.mustRemove || phaseOf(s0, s0.turn) !== 'place' || s0.board[to] !== null || to < 0 || to > 23) return null;
  const s = clone(s0);
  s.board[to] = s.turn;
  s.hand[s.turn]--;
  return afterPlaceOrMove(s, to);
}

/** Stein ziehen (bzw. springen) */
export function move(s0: MillState, from: number, to: number): MillState | null {
  if (s0.winner || s0.draw || s0.mustRemove || !targetsFrom(s0, from).includes(to)) return null;
  const s = clone(s0);
  s.board[to] = s.turn;
  s.board[from] = null;
  return afterPlaceOrMove(s, to, from);
}

/** nach einer Mühle: gegnerischen Stein wegnehmen */
export function remove(s0: MillState, at: number): MillState | null {
  if (s0.winner || s0.draw || !s0.mustRemove || !removable(s0).includes(at)) return null;
  const s = clone(s0);
  s.board[at] = null;
  s.mustRemove = false;
  s.last = { ...s.last, removed: at };
  return endTurn(s);
}
