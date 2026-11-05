import { CANVAS_BACKGROUND, COORD_MAX, ERASER_COLOR_INDEX, PALETTE } from '../game-config';
import type { Stroke } from '../types';

export function strokeColor(c: number): string {
  return c === ERASER_COLOR_INDEX ? CANVAS_BACKGROUND : (PALETTE[c] ?? '#000');
}

/** Zeichnet einen Strich ab Punktindex `from` (inkrementell). */
export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, from = 0) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const sx = W / COORD_MAX;
  const sy = H / COORD_MAX;
  const lw = Math.max(1, (s.w / 1000) * W);
  ctx.strokeStyle = ctx.fillStyle = strokeColor(s.c);
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = s.pts.length / 2;
  if (n === 1) {
    ctx.beginPath();
    ctx.arc(s.pts[0]! * sx, s.pts[1]! * sy, lw / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const start = Math.max(0, Math.min(from, n - 2));
  ctx.beginPath();
  ctx.moveTo(s.pts[start * 2]! * sx, s.pts[start * 2 + 1]! * sy);
  for (let i = start + 1; i < n; i++) ctx.lineTo(s.pts[i * 2]! * sx, s.pts[i * 2 + 1]! * sy);
  ctx.stroke();
}

export function redrawAll(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.fillStyle = CANVAS_BACKGROUND;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const s of strokes) drawStroke(ctx, s);
}
