/**
 * Level-Generator der Hühnerjagd (Server UND Fernseher nutzen denselben Code mit demselben Seed).
 *
 * Das Level besteht aus Blöcken. Jeder Block hat Boden, Decke oder beides. Regeln, damit es
 * immer einen Weg gibt:
 * - zwei aufeinanderfolgende Blöcke teilen mindestens eine Seite, die ohne Wand weitergeht
 * - „nur Boden“ und „nur Decke“ folgen nie direkt aufeinander (dazwischen liegt ein Block mit beidem)
 * - jeder Block ist lang genug, um rechtzeitig umzuschalten
 *
 * Koordinaten: x nach rechts, y nach unten, sichtbare Höhe 0 … WORLD_H.
 */
import type { HuhnMap } from '../maps';

export const WORLD_H = 9;
export const MID_THICK = 0.6;
export const COP_W = 0.5;
export const COP_H = 1.05;
export const LEVEL_LENGTH = 9000;

/** Boden: Oberkante y (fest bis ganz unten) · Decke: Unterkante y (fest bis ganz oben) · Mitte: schwebender Block, Oberkante y */
export interface Platform {
  x0: number;
  x1: number;
  y: number;
  side: 'floor' | 'ceil' | 'mid';
}

export interface Cop {
  x: number;
  y: number;
  side: 'floor' | 'ceil';
}

export interface Level {
  floor: Platform[];
  ceil: Platform[];
  mid: Platform[];
  cops: Cop[];
}

const FLOOR_RANGE: [number, number] = [5.8, 8.0];
const CEIL_RANGE: [number, number] = [1.0, 3.2];
const MID_RANGE: [number, number] = [4.35, 4.45];
const MIN_STEP = 0.35;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Kind = 'both' | 'floor' | 'ceil';

const clamp = (v: number, [a, b]: [number, number]) => Math.max(a, Math.min(b, v));

/** Strecke, die man mindestens braucht, um sicher auf die andere Seite zu wechseln */
export function flipDistance(map: HuhnMap) {
  return map.vmax * 0.62 + 2.6;
}

export function generateLevel(map: HuhnMap, seed: number, length = LEVEL_LENGTH): Level {
  const rnd = mulberry32(seed);
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const O = flipDistance(map);
  const L = map.level;
  const level: Level = { floor: [], ceil: [], mid: [], cops: [] };

  // Startbereich: beide Seiten, lang und flach
  let x = 30;
  let kind: Kind = 'both';
  let fy = 7.2;
  let cy = 1.8;
  level.floor.push({ x0: -20, x1: x, y: fy, side: 'floor' });
  level.ceil.push({ x0: -20, x1: x, y: cy, side: 'ceil' });

  while (x < length) {
    // nächste Blockart
    let next: Kind;
    if (kind === 'both') next = rnd() < L.onlyChance ? (rnd() < 0.5 ? 'floor' : 'ceil') : 'both';
    else next = 'both';

    const len = next === 'both' ? between(O + 1, O + 1 + L.bothExtra) : between(O * 0.75, O * 0.75 + L.onlyExtra);
    const hasF = next !== 'ceil';
    const hasC = next !== 'floor';
    const prevF = kind !== 'ceil';
    const prevC = kind !== 'floor';

    // neue Höhen
    let nfy = clamp(fy + (rnd() * 2 - 1) * L.step, FLOOR_RANGE);
    let ncy = clamp(cy + (rnd() * 2 - 1) * L.step, CEIL_RANGE);
    if (!prevF) nfy = clamp(between(FLOOR_RANGE[0], FLOOR_RANGE[1]), FLOOR_RANGE);
    if (!prevC) ncy = clamp(between(CEIL_RANGE[0], CEIL_RANGE[1]), CEIL_RANGE);
    // keine Mini-Stufen: entweder deutlich anders oder gleich hoch
    if (Math.abs(nfy - fy) < MIN_STEP) nfy = fy;
    if (Math.abs(ncy - cy) < MIN_STEP) ncy = cy;
    const wallF = prevF && hasF && nfy < fy - 0.02;
    const wallC = prevC && hasC && ncy > cy + 0.02;
    const safeF = prevF && hasF && !wallF;
    const safeC = prevC && hasC && !wallC;
    // mindestens eine Seite muss gefahrlos weitergehen
    if (!safeF && !safeC) {
      if (prevF && hasF) nfy = Math.max(nfy, fy);
      else ncy = Math.min(ncy, cy);
    }
    // Wände nur, wenn die andere Seite durchgehend sicher ist (sonst flach weiter)
    if (prevF && hasF && nfy < fy - 0.02 && !(prevC && hasC && ncy <= cy + 0.02)) nfy = fy;
    if (prevC && hasC && ncy > cy + 0.02 && !(prevF && hasF && nfy >= fy - 0.02)) ncy = cy;

    const x1 = x + len;
    if (hasF) {
      const last = level.floor[level.floor.length - 1]!;
      if (prevF && Math.abs(last.y - nfy) < 0.02 && last.x1 === x) last.x1 = x1;
      else level.floor.push({ x0: x, x1, y: nfy, side: 'floor' });
      fy = nfy;
    }
    if (hasC) {
      const last = level.ceil[level.ceil.length - 1]!;
      if (prevC && Math.abs(last.y - ncy) < 0.02 && last.x1 === x) last.x1 = x1;
      else level.ceil.push({ x0: x, x1, y: ncy, side: 'ceil' });
      cy = ncy;
    }

    if (next === 'both') {
      // Polizist auf einer Seite – nur mit genug Platz davor und danach zum Umschalten
      if (len >= 2 * O + 1.5 && rnd() < L.copChance) {
        const side = rnd() < 0.5 ? 'floor' : 'ceil';
        const cx = between(x + O, x1 - O - COP_W);
        level.cops.push({ x: cx, y: side === 'floor' ? fy : cy, side });
      }
      // schwebender Block in der Mitte
      if (rnd() < L.midChance) {
        const w = between(2, Math.min(5, len - 2));
        const mx = between(x + 1, x1 - w - 1);
        level.mid.push({ x0: mx, x1: mx + w, y: between(MID_RANGE[0], MID_RANGE[1]), side: 'mid' });
      }
    }
    kind = next;
    x = x1;
  }
  return level;
}

/** feste Rechtecke [x0, x1, y0, y1] in einem x-Bereich (für Kollisionen und Zeichnen) */
export function solidsIn(level: Level, a: number, b: number): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (const p of level.floor) if (p.x1 > a && p.x0 < b) out.push([p.x0, p.x1, p.y, WORLD_H + 50]);
  for (const p of level.ceil) if (p.x1 > a && p.x0 < b) out.push([p.x0, p.x1, -50, p.y]);
  for (const p of level.mid) if (p.x1 > a && p.x0 < b) out.push([p.x0, p.x1, p.y, p.y + MID_THICK]);
  return out;
}

/** Fenster-Suche in einer sortierten Liste (schnell genug für lange Level) */
export function inRange<T extends { x0: number; x1: number }>(list: T[], a: number, b: number): T[] {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (list[m]!.x1 <= a) lo = m + 1;
    else hi = m;
  }
  const out: T[] = [];
  for (let i = lo; i < list.length && list[i]!.x0 < b; i++) out.push(list[i]!);
  return out;
}
