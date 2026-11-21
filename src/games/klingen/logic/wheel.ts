/**
 * Rad-Logik für Handy und Fernseher: Drehmuster, Stufen, Treffer.
 * Alles deterministisch aus einem Startwert – so bekommen alle dieselben Stufen.
 */

import { BOSS_IDS, BOSSES, type BossId } from './bosses';

/**
 * Trefferzone: zwei Messer kollidieren, wenn sie näher als das beieinander stecken (Bogenmaß).
 * Bewusst etwas kleiner als die gezeichneten Messer – knappe Würfe zählen noch.
 */
export const MIN_GAP = 0.12;
/** Abstand für vorgegebene Hindernisse und Sterne (wie früher, damit Stufen nicht verstopfen) */
const PLACE_GAP = 0.19;
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
  /** Bonus-Sterne im Rad (Position im Rad) */
  stars: number[];
  spin: Spin;
  /** Boss dieser Stufe (jede dritte Stufe) */
  boss: BossId | null;
  /** Tempo-Faktor für Boss-Mechaniken (steigt mit der Stufe) */
  power: number;
  /** Startwert für zufällige Abläufe (z. B. Richtungswechsel) */
  seed: number;
}

/** jede dritte Stufe ist ein Boss */
export const BOSS_EVERY = 3;

/** Reihenfolge der Bosse – pro Spiel gemischt, aber für alle gleich */
export function bossOrder(seed: number): BossId[] {
  const rnd = mulberry32(seed * 13 + 7);
  const list = [...BOSS_IDS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  // der Drache bleibt der große Endgegner jeder Runde durch alle Bosse
  const d = list.indexOf('drache');
  list.splice(d, 1);
  list.push('drache');
  return list;
}

function placeFree(rnd: () => number, count: number, taken: number[], gap: number): number[] {
  const out: number[] = [];
  for (let tries = 0; out.length < count && tries < 300; tries++) {
    const a = rnd() * TAU;
    if (![...taken, ...out].some((o) => angleDist(o, a) < gap)) out.push(a);
  }
  return out;
}

/** Stufe n (ab 1) – für alle gleich bei gleichem Startwert */
export function makeStage(seed: number, n: number): Stage {
  const rnd = mulberry32(seed * 1000 + n * 7919);
  const isBoss = n % BOSS_EVERY === 0;
  const bossNo = n / BOSS_EVERY - 1;
  const boss = isBoss ? bossOrder(seed)[bossNo % BOSS_IDS.length]! : null;
  // beim zweiten Durchlauf durch alle Bosse wird es härter
  const lap = isBoss ? Math.floor(bossNo / BOSS_IDS.length) : 0;
  const power = 1 + Math.min(0.6, n * 0.012) + lap * 0.15;
  if (boss) {
    const def = BOSSES[boss];
    const obstacles = placeFree(rnd, def.obstacles + lap, [], PLACE_GAP * 2.1);
    const stars = placeFree(rnd, 2, obstacles, PLACE_GAP * 1.6);
    const dir = rnd() < 0.5 ? -1 : 1;
    const base = dir * def.speed * power;
    const spin: Spin = { base, amp: Math.abs(base) * (def.wave ?? 0), freq: 0.8 + rnd() * 0.7, phase: rnd() * TAU };
    return { n, knives: def.knives + lap, obstacles, stars, spin, boss, power, seed: seed * 31 + n };
  }
  const knives = Math.min(12, 6 + Math.floor(n * 0.45));
  const obstacleCount = n < 2 ? 0 : Math.min(6, 1 + Math.floor(n / 3));
  const obstacles = placeFree(rnd, obstacleCount, [], PLACE_GAP * 2.2);
  const stars = n < 2 ? [] : placeFree(rnd, rnd() < 0.5 ? 1 : 2, obstacles, PLACE_GAP * 1.6);
  const dir = rnd() < 0.5 ? -1 : 1;
  const base = dir * Math.min(3.2, 1.5 + n * 0.1);
  // ab Stufe 4 schwankt die Geschwindigkeit
  const amp = n < 4 ? 0 : Math.min(2.4, 0.5 + n * 0.1) * (rnd() < 0.5 ? 1 : 0.6);
  const spin: Spin = { base, amp, freq: 0.8 + rnd() * 1.1, phase: rnd() * TAU };
  return { n, knives, obstacles, stars, spin, boss: null, power, seed: seed * 31 + n };
}

/** Drehung des gemeinsamen Rads in Runde r */
export function sharedSpin(seed: number, round: number): Spin {
  const rnd = mulberry32(seed * 31 + round * 104729);
  const dir = rnd() < 0.5 ? -1 : 1;
  const base = dir * Math.min(3, 1.3 + round * 0.18);
  return { base, amp: round < 2 ? 0 : Math.min(2.4, 0.6 + round * 0.25), freq: 0.7 + rnd() * 0.9, phase: rnd() * TAU };
}

/** gemeinsames Rad: ab Runde 3 jede zweite Runde im Look eines Bosses (nur Aussehen) */
export function sharedBoss(seed: number, round: number): BossId | null {
  if (round < 3 || round % 2 === 0) return null;
  return bossOrder(seed)[Math.floor((round - 3) / 2) % BOSS_IDS.length]!;
}
