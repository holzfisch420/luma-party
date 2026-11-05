/**
 * Clientseitiges Strichmodell mit Änderungs-Events für inkrementelles Rendering.
 */
import type { DrawOp, Stroke } from '../types';
import { applyDrawOp } from './draw-model';

export type ModelChange = { kind: 'redraw' } | { kind: 'append'; stroke: Stroke; fromPoint: number };

export class StrokeModel {
  strokes: Stroke[] = [];
  turn = 0;
  private listeners = new Set<(c: ModelChange) => void>();
  private total = { value: 0 };

  subscribe(fn: (c: ModelChange) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(c: ModelChange) {
    this.listeners.forEach((l) => l(c));
  }

  load(turn: number, strokes: Stroke[]) {
    this.turn = turn;
    this.strokes = strokes.map((s) => ({ ...s, pts: [...s.pts] }));
    this.total = { value: this.strokes.reduce((n, s) => n + s.pts.length / 2, 0) };
    this.emit({ kind: 'redraw' });
  }

  reset(turn: number) {
    this.load(turn, []);
  }

  apply(op: DrawOp): boolean {
    const before = op.k === 'p' ? (this.strokes[this.strokes.length - 1]?.pts.length ?? 0) : 0;
    if (!applyDrawOp(this.strokes, op, this.total)) return false;
    const last = this.strokes[this.strokes.length - 1];
    if (op.k === 's' && last) this.emit({ kind: 'append', stroke: last, fromPoint: 0 });
    else if (op.k === 'p' && last) this.emit({ kind: 'append', stroke: last, fromPoint: Math.max(0, before / 2 - 1) });
    else this.emit({ kind: 'redraw' });
    return true;
  }

  get lastStrokeId() {
    return this.strokes[this.strokes.length - 1]?.id ?? 0;
  }
}
