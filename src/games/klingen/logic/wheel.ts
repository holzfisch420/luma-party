/**
 * Rad-Logik für Handy und Fernseher: Drehmuster, Stufen, Treffer.
 * Alles deterministisch aus einem Startwert – so bekommen alle dieselben Stufen.
 */

/** Mindestabstand zweier Messer im Rad (Bogenmaß) */
export const MIN_GAP = 0.19;
const TAU = Math.PI * 2;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Drehung: Grundgeschwindigkeit + Schwankung (kann die Richtung umkehren) */
export interface Spin {
  base: number;
  amp: number;
  freq: number;
  phase: number;
}

/** Drehwinkel zur Zeit t (Sekunden): ∫ base + amp·sin(freq·t + phase) dt */
export function angleAt(spin: Spin, t: number): number {
  if (spin.amp === 0 || spin.freq === 0) return spin.base * t;
  return spin.base * t + (spin.amp / spin.freq) * (Math.cos(spin.phase) - Math.cos(spin.freq * t + spin.phase));
}

export function norm(a: number): number {
  return ((a % TAU) + TAU) % TAU;
}

export function angleDist(a: number, b: number): number {
  const d = Math.abs(norm(a) - norm(b));
  return Math.min(d, TAU - d);
}

/** Ein Messer trifft unten (Welt-Winkel π/2) – Position im Rad */
export function localImpact(wheelAngle: number): number {
  return norm(Math.PI / 2 - wheelAngle);
}

export function collides(local: number, stuck: readonly number[]): boolean {
  return stuck.some((k) => angleDist(k, local) < MIN_GAP);
}

export interface Stage {
  n: number;
  knives: number;
  /** schon steckende Messer (Hindernisse) */
  obstacles: number[];
  spin: Spin;
  boss: boolean;
}

/** Stufe n (ab 1) – für alle gleich bei gleichem Startwert */
export function makeStage(seed: number, n: number): Stage {
  const rnd = mulberry32(seed * 1000 + n * 7919);
  const boss = n % 5 === 0;
  const knives = Math.min(12, 5 + Math.floor(n * 0.6) + (boss ? 2 : 0));
  const obstacleCount = n < 2 ? 0 : Math.min(6, 1 + Math.floor(n / 3));
  const obstacles: number[] = [];
  for (let tries = 0; obstacles.length < obstacleCount && tries < 200; tries++) {
    const a = rnd() * TAU;
    if (!obstacles.some((o) => angleDist(o, a) < MIN_GAP * 2.2)) obstacles.push(a);
  }
  const dir = rnd() < 0.5 ? -1 : 1;
  const base = dir * Math.min(3.4, 1.5 + n * 0.11);
  // ab Stufe 3 schwankt die Geschwindigkeit, Boss-Stufen kehren die Richtung um
  const amp = n < 3 ? 0 : boss ? Math.abs(base) * 1.6 : Math.min(2.6, 0.5 + n * 0.12) * (rnd() < 0.5 ? 1 : 0.6);
  const spin: Spin = { base, amp, freq: 0.8 + rnd() * 1.1, phase: rnd() * TAU };
  return { n, knives, obstacles, spin, boss };
}

/** Drehung des gemeinsamen Rads in Runde r */
export function sharedSpin(seed: number, round: number): Spin {
  const rnd = mulberry32(seed * 31 + round * 104729);
  const dir = rnd() < 0.5 ? -1 : 1;
  const base = dir * Math.min(3, 1.3 + round * 0.18);
  return { base, amp: round < 2 ? 0 : Math.min(2.4, 0.6 + round * 0.25), freq: 0.7 + rnd() * 0.9, phase: rnd() * TAU };
}
