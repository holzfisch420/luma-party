/** Geometrie für die Arena: Kreise gegen achsenparallele Rechtecke, Strahlen mit Abprallern. */
import type { Rect } from '../maps';

export function circleHitsRect(x: number, y: number, r: number, w: Rect): boolean {
  const cx = Math.max(w.x, Math.min(x, w.x + w.w));
  const cy = Math.max(w.y, Math.min(y, w.y + w.h));
  return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
}

/** Schiebt einen Kreis aus einem Rechteck heraus; gibt die neue Position zurück */
export function pushOutOfRect(x: number, y: number, r: number, w: Rect): [number, number] {
  const cx = Math.max(w.x, Math.min(x, w.x + w.w));
  const cy = Math.max(w.y, Math.min(y, w.y + w.h));
  let dx = x - cx;
  let dy = y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [x, y];
  if (d2 > 1e-9) {
    const d = Math.sqrt(d2);
    return [cx + (dx / d) * r, cy + (dy / d) * r];
  }
  // Mittelpunkt im Rechteck: zur nächsten Kante schieben
  const left = x - w.x;
  const right = w.x + w.w - x;
  const top = y - w.y;
  const bottom = w.y + w.h - y;
  const m = Math.min(left, right, top, bottom);
  if (m === left) dx = -(left + r);
  else if (m === right) dx = right + r;
  else dx = 0;
  if (m === top) dy = -(top + r);
  else if (m === bottom) dy = bottom + r;
  else dy = 0;
  return [x + dx, y + dy];
}

/**
 * Bewegt einen Kreis um (vx, vy)·dt und lässt ihn an Wänden abprallen.
 * Gibt neue Position/Geschwindigkeit und die Zahl der Abpraller zurück.
 */
export function moveBouncing(x: number, y: number, vx: number, vy: number, r: number, dt: number, walls: Rect[]) {
  let bounces = 0;
  const steps = Math.max(1, Math.ceil((Math.hypot(vx, vy) * dt) / (r * 0.9)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const nx = x + vx * h;
    const ny = y + vy * h;
    let hitX = false;
    let hitY = false;
    for (const w of walls) {
      if (!circleHitsRect(nx, ny, r, w)) continue;
      // welche Achse verursacht die Kollision?
      const xOnly = circleHitsRect(nx, y, r, w);
      const yOnly = circleHitsRect(x, ny, r, w);
      if (xOnly && !yOnly) hitX = true;
      else if (yOnly && !xOnly) hitY = true;
      else {
        hitX = true;
        hitY = true;
      }
    }
    if (hitX) vx = -vx;
    if (hitY) vy = -vy;
    if (hitX || hitY) bounces++;
    x = hitX ? x : nx;
    y = hitY ? y : ny;
  }
  return { x, y, vx, vy, bounces };
}

/** Schnitt eines Strahls mit einem Rechteck (Slab-Methode): Abstand t und Normale */
function rayRect(ox: number, oy: number, dx: number, dy: number, w: Rect): { t: number; nx: number; ny: number } | null {
  let tmin = -Infinity;
  let tmax = Infinity;
  let nx = 0;
  let ny = 0;
  for (const axis of [0, 1] as const) {
    const o = axis === 0 ? ox : oy;
    const d = axis === 0 ? dx : dy;
    const lo = axis === 0 ? w.x : w.y;
    const hi = axis === 0 ? w.x + w.w : w.y + w.h;
    if (Math.abs(d) < 1e-12) {
      if (o < lo || o > hi) return null;
      continue;
    }
    let t1 = (lo - o) / d;
    let t2 = (hi - o) / d;
    let sign = -1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      sign = 1;
    }
    if (t1 > tmin) {
      tmin = t1;
      nx = axis === 0 ? sign : 0;
      ny = axis === 1 ? sign : 0;
    }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (tmin < 1e-6) return null;
  return { t: tmin, nx, ny };
}

/** Strahl, der an Wänden abprallt; liefert die Eckpunkte des Pfads */
export function traceLaser(x: number, y: number, angle: number, walls: Rect[], maxLength: number, maxBounces: number): number[] {
  const pts = [x, y];
  let dx = Math.cos(angle);
  let dy = Math.sin(angle);
  let left = maxLength;
  for (let b = 0; b <= maxBounces && left > 0; b++) {
    let best: { t: number; nx: number; ny: number } | null = null;
    for (const w of walls) {
      const hit = rayRect(x, y, dx, dy, w);
      if (hit && (!best || hit.t < best.t)) best = hit;
    }
    const reachesWall = !!best && best.t < left;
    const t = reachesWall ? best!.t : left;
    x += dx * t;
    y += dy * t;
    pts.push(x, y);
    left -= t;
    if (!reachesWall || !best) break;
    if (best.nx) dx = -dx;
    if (best.ny) dy = -dy;
    // leicht von der Wand lösen
    x += dx * 1e-3;
    y += dy * 1e-3;
  }
  return pts;
}

/** Abstand Punkt–Strecke */
export function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2)) : 0;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

export function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
