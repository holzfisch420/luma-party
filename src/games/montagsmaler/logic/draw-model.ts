/**
 * Zeichenmodell – wird identisch auf Server (Validierung + maßgeblicher Stand)
 * und Client (Darstellung) verwendet.
 */
import { BRUSH_SIZES, COORD_MAX, ERASER_COLOR_INDEX, PALETTE } from '../game-config';
import type { DrawOp, Stroke } from '../types';

export const DRAW_LIMITS = {
  maxOpsPerMessage: 64,
  maxPointsPerOp: 400,
  maxStrokes: 3000,
  maxTotalPoints: 120_000,
} as const;

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const inCoord = (v: unknown): v is number => isInt(v) && v >= 0 && v <= COORD_MAX;

/** Validiert eine (unbekannte) Operation; gibt eine bereinigte Kopie oder null zurück. */
export function sanitizeDrawOp(raw: unknown): DrawOp | null {
  if (!raw || typeof raw !== 'object') return null;
  const op = raw as Record<string, unknown>;
  switch (op.k) {
    case 's': {
      const { id, c, w, x, y } = op;
      if (!isInt(id) || id < 0 || id > 1e9) return null;
      if (!isInt(c) || (c !== ERASER_COLOR_INDEX && (c < 0 || c >= PALETTE.length))) return null;
      if (!isInt(w) || !(BRUSH_SIZES as readonly number[]).includes(w)) return null;
      if (!inCoord(x) || !inCoord(y)) return null;
      return { k: 's', id, c, w, x, y };
    }
    case 'p': {
      const { id, pts } = op;
      if (!isInt(id) || !Array.isArray(pts)) return null;
      if (pts.length === 0 || pts.length % 2 !== 0 || pts.length > DRAW_LIMITS.maxPointsPerOp * 2) return null;
      if (!pts.every(inCoord)) return null;
      return { k: 'p', id, pts: pts.slice() as number[] };
    }
    case 'u':
      return { k: 'u' };
    case 'x':
      return { k: 'x' };
    default:
      return null;
  }
}

export interface ApplyResult {
  applied: boolean;
}

/**
 * Wendet eine Operation auf die Strichliste an (mutierend).
 * Gibt false zurück, wenn die Operation nicht passt (z. B. falsche Strich-ID).
 */
export function applyDrawOp(strokes: Stroke[], op: DrawOp, totalPoints = { value: 0 }): boolean {
  switch (op.k) {
    case 's': {
      if (strokes.length >= DRAW_LIMITS.maxStrokes) return false;
      const last = strokes[strokes.length - 1];
      if (last && op.id <= last.id) return false;
      strokes.push({ id: op.id, c: op.c, w: op.w, pts: [op.x, op.y] });
      totalPoints.value += 1;
      return true;
    }
    case 'p': {
      const last = strokes[strokes.length - 1];
      if (!last || last.id !== op.id) return false;
      if (totalPoints.value + op.pts.length / 2 > DRAW_LIMITS.maxTotalPoints) return false;
      for (const v of op.pts) last.pts.push(v);
      totalPoints.value += op.pts.length / 2;
      return true;
    }
    case 'u': {
      const removed = strokes.pop();
      if (removed) totalPoints.value -= removed.pts.length / 2;
      return !!removed;
    }
    case 'x':
      strokes.length = 0;
      totalPoints.value = 0;
      return true;
  }
}
