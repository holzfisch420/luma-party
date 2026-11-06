import { COORD_MAX, ERASER_COLOR_INDEX, PALETTE } from '../game-config';
import type { Stroke } from '../types';

/**
 * Die Zeichenfläche ist durchsichtig, damit das Karopapier durchscheint.
 * Der Radierer entfernt daher Pixel (destination-out), statt weiß zu malen.
 */
function prepare(ctx: CanvasRenderingContext2D, s: Stroke) {
  const eraser = s.c === ERASER_COLOR_INDEX;
  ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
  ctx.strokeStyle = ctx.fillStyle = eraser ? '#000' : (PALETTE[s.c] ?? '#000');
}

/** Zeichnet einen Strich ab Punktindex `from` (inkrementell). */
export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, from = 0) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const sx = W / COORD_MAX;
  const sy = H / COORD_MAX;
  const lw = Math.max(1, (s.w / 1000) * W);
  prepare(ctx, s);
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = s.pts.length / 2;
  if (n === 1) {
    ctx.beginPath();
    ctx.arc(s.pts[0]! * sx, s.pts[1]! * sy, lw / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const start = Math.max(0, Math.min(from, n - 2));
    ctx.beginPath();
    ctx.moveTo(s.pts[start * 2]! * sx, s.pts[start * 2 + 1]! * sy);
    for (let i = start + 1; i < n; i++) ctx.lineTo(s.pts[i * 2]! * sx, s.pts[i * 2 + 1]! * sy);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

export function redrawAll(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const s of strokes) drawStroke(ctx, s);
}
