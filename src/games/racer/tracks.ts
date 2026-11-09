/**
 * Strecken für „Kurvenrausch“ – eigene Low-Poly-Strecken (Server + Fernseher teilen denselben Code).
 *
 * Eine Strecke ist eine Catmull-Rom-Kurve durch Kontrollpunkte (x, y = Höhe, z), die in 1-m-Schritten
 * abgetastet wird. Physik und Grafik arbeiten nur mit diesen Abtastpunkten – schnell und einfach.
 */

export type Vec3 = [number, number, number];

export interface TrackTheme {
  sky: string;
  fog: string;
  ground: string;
  road: string;
  roadAlt: string;
  wall: string;
  scenery: 'forest' | 'desert' | 'snow' | 'sea' | 'city' | 'night';
}

export interface TrackDef {
  id: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  blurb: string;
  theme: TrackTheme;
  closed: boolean;
  laps: number;
  /** Fahrbahnbreite in Metern */
  width: number;
  points: Vec3[];
  /** Abschnitte ohne Bande (Anteil 0–1 der Strecke) – wer runterfährt, fällt */
  open?: [number, number][];
  /** Turbo-Felder (Anteil 0–1) */
  boosts?: [number, number][];
  checkpoints: number;
}

const ellipse = (rx: number, rz: number, n: number, y = (_t: number) => 0): Vec3[] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return [Math.sin(t) * rx, y(t), -Math.cos(t) * rz];
  });

export const TRACKS: TrackDef[] = [
  {
    id: 'oval',
    name: 'Übungsoval',
    difficulty: 1,
    blurb: 'Breit, rund, schnell – zum Warmfahren.',
    theme: { sky: '#9fd8ff', fog: '#cfeaff', ground: '#7cc46a', road: '#5b6270', roadAlt: '#646c7b', wall: '#f2f4f7', scenery: 'forest' },
    closed: true,
    laps: 3,
    width: 16,
    points: ellipse(130, 65, 14),
    checkpoints: 4,
  },
  {
    id: 'speedway',
    name: 'Turbo-Speedway',
    difficulty: 2,
    blurb: 'Lange Geraden mit Turbo-Feldern – Vollgas!',
    theme: { sky: '#ffd29b', fog: '#ffe6c4', ground: '#e0b778', road: '#4f5560', roadAlt: '#585f6b', wall: '#ff8c42', scenery: 'desert' },
    closed: true,
    laps: 3,
    width: 18,
    points: [
      [-180, 0, -70], [-60, 0, -75], [60, 0, -75], [180, 0, -70], [230, 0, -35], [235, 0, 35], [180, 0, 72],
      [60, 0, 76], [-60, 0, 76], [-180, 0, 72], [-232, 0, 35], [-230, 0, -35],
    ],
    boosts: [[0.08, 0.13], [0.55, 0.6]],
    checkpoints: 4,
  },
  {
    id: 'huegel',
    name: 'Hügelring',
    difficulty: 2,
    blurb: 'Rauf und runter durch den Wald.',
    theme: { sky: '#a7d8f0', fog: '#d6eef8', ground: '#5fae57', road: '#555b66', roadAlt: '#5f6672', wall: '#ffffff', scenery: 'forest' },
    closed: true,
    laps: 3,
    width: 14,
    points: [
      [0, 0, -90], [90, 5, -90], [145, 12, -35], [150, 8, 40], [95, 2, 95], [10, 6, 100],
      [-75, 14, 95], [-145, 18, 35], [-150, 9, -40], [-90, 3, -90],
    ],
    checkpoints: 5,
  },
  {
    id: 'haarnadel',
    name: 'Haarnadel-Alpen',
    difficulty: 3,
    blurb: 'Enge Kehren im Schnee – bremsen nicht vergessen!',
    theme: { sky: '#cfe3f3', fog: '#e9f2fa', ground: '#f1f5f9', road: '#59606b', roadAlt: '#626a76', wall: '#e03131', scenery: 'snow' },
    closed: true,
    laps: 2,
    width: 13,
    points: [
      [0, 0, 0], [110, 2, 0], [165, 4, 25], [140, 6, 62], [30, 8, 62], [-5, 10, 92], [25, 12, 124],
      [135, 14, 124], [185, 12, 155], [150, 9, 196], [-60, 6, 196], [-115, 4, 150], [-115, 2, 45], [-65, 0, 2],
    ],
    checkpoints: 6,
  },
  {
    id: 'acht',
    name: 'Achterbahn',
    difficulty: 3,
    blurb: 'Eine Acht mit Brücke – oben drüber, unten durch.',
    theme: { sky: '#b4c6ff', fog: '#dde5ff', ground: '#6db36a', road: '#4d5361', roadAlt: '#575e6d', wall: '#7c5cff', scenery: 'city' },
    closed: true,
    laps: 2,
    width: 14,
    points: Array.from({ length: 20 }, (_, i) => {
      const t = (i / 20) * Math.PI * 2;
      return [Math.sin(t) * 170, 9 + 9 * Math.cos(t), Math.sin(t) * Math.cos(t) * 150] as Vec3;
    }),
    checkpoints: 6,
  },
  {
    id: 'kueste',
    name: 'Küstenstraße',
    difficulty: 4,
    blurb: 'Sprint über die Klippen – keine Bande, nur das Meer.',
    theme: { sky: '#8fd0ff', fog: '#c8e8ff', ground: '#3d8fd1', road: '#5a5f69', roadAlt: '#636975', wall: '#f8f9fa', scenery: 'sea' },
    closed: false,
    laps: 1,
    width: 13,
    points: [
      [0, 4, -40], [0, 4, 0], [70, 5, 10], [135, 7, 50], [150, 9, 120], [105, 11, 170], [35, 13, 180],
      [-15, 15, 230], [5, 17, 300], [80, 18, 330], [160, 16, 310], [215, 14, 250], [280, 12, 255], [330, 10, 310], [340, 9, 380],
    ],
    open: [[0.18, 0.88]],
    checkpoints: 6,
  },
  {
    id: 'canyon',
    name: 'Canyon-Sprint',
    difficulty: 4,
    blurb: 'Schmal, kurvig und lang – kein Platz für Fehler.',
    theme: { sky: '#ffc9a3', fog: '#ffe3cc', ground: '#c9743f', road: '#5c534d', roadAlt: '#675d56', wall: '#7a3b18', scenery: 'desert' },
    closed: false,
    laps: 1,
    width: 11,
    points: [
      [0, 0, -40], [0, 0, 0], [40, 1, 60], [10, 2, 120], [-50, 3, 150], [-60, 4, 220], [0, 5, 260], [70, 6, 240],
      [120, 7, 280], [110, 8, 350], [40, 9, 380], [-30, 9, 430], [-10, 8, 500], [60, 7, 520], [130, 6, 500], [180, 5, 540], [190, 4, 610],
    ],
    checkpoints: 7,
  },
  {
    id: 'gipfel',
    name: 'Gipfelsturm bei Nacht',
    difficulty: 5,
    blurb: 'Steil hinauf, ohne Bande über den Kamm und wieder hinab.',
    theme: { sky: '#141a33', fog: '#20294d', ground: '#1d2a3a', road: '#3c4252', roadAlt: '#454c5e', wall: '#4dabf7', scenery: 'night' },
    closed: true,
    laps: 2,
    width: 12,
    points: [
      [0, 0, 0], [90, 3, -10], [160, 10, 30], [170, 18, 100], [110, 26, 150], [30, 32, 140], [-30, 34, 180],
      [-110, 30, 160], [-160, 22, 100], [-150, 12, 30], [-90, 4, -5],
    ],
    open: [[0.42, 0.62]],
    boosts: [[0.02, 0.05]],
    checkpoints: 6,
  },
];

export const TRACK_IDS = ['oval', 'speedway', 'huegel', 'haarnadel', 'acht', 'kueste', 'canyon', 'gipfel'] as const;

export function getTrack(id: string): TrackDef {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0]!;
}

export const DIFFICULTY_LABEL = ['', 'Leicht', 'Normal', 'Mittel', 'Schwer', 'Extrem'] as const;

// ------------------------------------------------------------------ abgetastete Strecke

export const STEP = 1; // Meter zwischen zwei Abtastpunkten

export interface BuiltTrack {
  def: TrackDef;
  n: number;
  length: number;
  closed: boolean;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  /** Fahrtrichtung (Einheitsvektor in der Ebene) */
  tx: Float32Array;
  tz: Float32Array;
  /** Steigung (dy/ds) */
  slope: Float32Array;
  wall: Uint8Array;
  boost: Uint8Array;
  halfWidth: number;
  /** Startlinie (Index) und Ziellinie (Strecke ab Start, gesamt über alle Runden) */
  startIdx: number;
  raceDistance: number;
  /** Strecke ab Start für jeden Checkpoint (über alle Runden, aufsteigend; letzter = Ziel) */
  checkpoints: number[];
  /** Abtastindex je Checkpoint (für Grafik) */
  checkpointIdx: number[];
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

const cache = new Map<string, BuiltTrack>();

export function buildTrack(def: TrackDef): BuiltTrack {
  const hit = cache.get(def.id);
  if (hit && hit.def === def) return hit;
  const P = def.points;
  const m = P.length;
  const get = (i: number) => (def.closed ? P[((i % m) + m) % m]! : P[Math.max(0, Math.min(m - 1, i))]!);
  // dicht abtasten
  const dense: Vec3[] = [];
  const segs = def.closed ? m : m - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let k = 0; k < 40; k++) {
      const t = k / 40;
      dense.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t), catmull(p0[2], p1[2], p2[2], p3[2], t)]);
    }
  }
  if (!def.closed) dense.push(get(m - 1));
  else dense.push(dense[0]!);
  // gleichmäßig nach Bogenlänge (in der Ebene) neu abtasten
  const out: Vec3[] = [dense[0]!];
  let acc = 0; // Strecke seit dem letzten Abtastpunkt
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1]!;
    const b = dense[i]!;
    const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
    let pos = 0;
    while (acc + (L - pos) >= STEP) {
      pos += STEP - acc;
      const f = pos / L;
      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
      acc = 0;
    }
    acc += L - pos;
  }
  if (def.closed) out.pop(); // letzter Punkt = erster
  const n = out.length;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  out.forEach((p, i) => {
    x[i] = p[0];
    y[i] = p[1];
    z[i] = p[2];
  });
  const idx = (i: number) => (def.closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i)));
  const tx = new Float32Array(n);
  const tz = new Float32Array(n);
  const slope = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = idx(i - 2);
    const b = idx(i + 2);
    const dx = x[b]! - x[a]!;
    const dz = z[b]! - z[a]!;
    const l = Math.hypot(dx, dz) || 1;
    tx[i] = dx / l;
    tz[i] = dz / l;
    slope[i] = (y[b]! - y[a]!) / l;
  }
  const inRanges = (ranges: [number, number][] | undefined, i: number) => !!ranges?.some(([a, b]) => i / n >= a && i / n <= b);
  const wall = new Uint8Array(n);
  const boost = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    wall[i] = inRanges(def.open, i) ? 0 : 1;
    boost[i] = inRanges(def.boosts, i) ? 1 : 0;
  }
  const startIdx = def.closed ? 0 : 40;
  const lapLen = def.closed ? n : n - 25 - startIdx;
  const raceDistance = lapLen * def.laps;
  const checkpoints: number[] = [];
  const checkpointIdx: number[] = [];
  for (let lap = 0; lap < def.laps; lap++)
    for (let k = 1; k <= def.checkpoints; k++) {
      const d = lap * lapLen + (k / def.checkpoints) * lapLen;
      checkpoints.push(d);
      if (lap === 0) checkpointIdx.push(idx(startIdx + Math.round((k / def.checkpoints) * lapLen)));
    }
  const built: BuiltTrack = { def, n, length: n * STEP, closed: def.closed, x, y, z, tx, tz, slope, wall, boost, halfWidth: def.width / 2, startIdx, raceDistance, checkpoints, checkpointIdx };
  cache.set(def.id, built);
  return built;
}

/** nächster Abtastpunkt in einem Fenster um den bisherigen Index (so klappen auch Brücken/Kreuzungen) */
export function nearestIndex(t: BuiltTrack, px: number, pz: number, near: number, back = 10, ahead = 24): number {
  let best = near;
  let bestD = Infinity;
  for (let k = -back; k <= ahead; k++) {
    let i = near + k;
    if (t.closed) i = ((i % t.n) + t.n) % t.n;
    else if (i < 0 || i >= t.n) continue;
    const dx = px - t.x[i]!;
    const dz = pz - t.z[i]!;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Index-Differenz (bei Rundkursen über den Rundenwechsel hinweg) */
export function indexDelta(t: BuiltTrack, from: number, to: number): number {
  let d = to - from;
  if (t.closed) {
    if (d > t.n / 2) d -= t.n;
    else if (d < -t.n / 2) d += t.n;
  }
  return d;
}

/** Abtastindex zu einer zurückgelegten Strecke ab Start */
export function indexAtDistance(t: BuiltTrack, dist: number): number {
  const i = t.startIdx + Math.round(dist / STEP);
  return t.closed ? ((i % t.n) + t.n) % t.n : Math.max(0, Math.min(t.n - 1, i));
}
