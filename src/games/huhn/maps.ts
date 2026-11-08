/**
 * Strecken der Hühnerjagd – unterschiedliche Schwierigkeit, Tempo und Hindernisse.
 */
export const OBSTACLES = {
  cone: { name: 'Pylone', w: 0.42, h: 0.5, y0: 0, extra: 0 },
  barrier: { name: 'Absperrung', w: 0.32, h: 0.85, y0: 0, extra: 0 },
  cop: { name: 'Polizist', w: 0.5, h: 1.05, y0: 0, extra: 1.1 },
  dog: { name: 'Polizeihund', w: 0.78, h: 0.52, y0: 0, extra: 3.2 },
  car: { name: 'Streifenwagen', w: 2.0, h: 0.85, y0: 0, extra: 2.2 },
  heli: { name: 'Helikopter-Scheinwerfer', w: 1.6, h: 4, y0: 1.15, extra: 0 },
} as const;
export type ObstacleKind = keyof typeof OBSTACLES;
export const OBSTACLE_KINDS = Object.keys(OBSTACLES) as ObstacleKind[];

export interface HuhnTheme {
  skyTop: string;
  skyBottom: string;
  far: string;
  near: string;
  ground: string;
  road: string;
  stripe: string;
  night?: boolean;
  /** Hintergrund-Deko */
  deco: 'farm' | 'village' | 'market' | 'highway' | 'station' | 'city';
}

export interface HuhnMap {
  id: string;
  name: string;
  /** 1 (leicht) bis 5 (sehr schwer) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  blurb: string;
  theme: HuhnTheme;
  v0: number;
  accel: number;
  vmax: number;
  /** Abstand zwischen Hindernissen in Sekunden [min, max] */
  gap: [number, number];
  weights: Partial<Record<ObstacleKind, number>>;
}

export const MAPS: HuhnMap[] = [
  {
    id: 'hof',
    name: 'Bauernhof',
    difficulty: 1,
    blurb: 'Gemütlicher Ausbruch – ein paar Pylonen und ein müder Dorfpolizist.',
    theme: { skyTop: '#8fd3ff', skyBottom: '#d8f1ff', far: '#9ed67a', near: '#77bf55', ground: '#c8a46b', road: '#b08850', stripe: '#e3c995', deco: 'farm' },
    v0: 4.4,
    accel: 0.05,
    vmax: 7,
    gap: [1.5, 2.6],
    weights: { cone: 3, barrier: 1, cop: 2 },
  },
  {
    id: 'dorf',
    name: 'Dorfstraße',
    difficulty: 2,
    blurb: 'Die Dorfpolizei hat Verstärkung geholt – inklusive Hund.',
    theme: { skyTop: '#7ec8f7', skyBottom: '#e3f4ff', far: '#b5c9a3', near: '#e7a26d', ground: '#9aa0a6', road: '#6b7178', stripe: '#f4f4f4', deco: 'village' },
    v0: 5,
    accel: 0.07,
    vmax: 8.5,
    gap: [1.25, 2.3],
    weights: { cone: 2, barrier: 2, cop: 3, dog: 1 },
  },
  {
    id: 'markt',
    name: 'Marktplatz',
    difficulty: 3,
    blurb: 'Viel los: Polizisten, Hunde und der erste Streifenwagen.',
    theme: { skyTop: '#ffb88c', skyBottom: '#ffe7c9', far: '#d99a7a', near: '#f2c14e', ground: '#a1887f', road: '#7d6b63', stripe: '#f5e6c8', deco: 'market' },
    v0: 5.5,
    accel: 0.09,
    vmax: 10,
    gap: [1.05, 2.0],
    weights: { cone: 1, barrier: 2, cop: 3, dog: 2, car: 1 },
  },
  {
    id: 'autobahn',
    name: 'Autobahn',
    difficulty: 4,
    blurb: 'Vollgas! Streifenwagen mit Blaulicht von vorne.',
    theme: { skyTop: '#6fb1e8', skyBottom: '#cfe6f7', far: '#8fa8b8', near: '#5c8a4a', ground: '#4a4f55', road: '#3a3e44', stripe: '#ffd23f', deco: 'highway' },
    v0: 6.5,
    accel: 0.1,
    vmax: 11.5,
    gap: [0.95, 1.8],
    weights: { cone: 2, barrier: 1, cop: 1, dog: 1, car: 4 },
  },
  {
    id: 'revier',
    name: 'Polizeirevier',
    difficulty: 4,
    blurb: 'Mitten durchs Revier – Achtung: Unter dem Helikopter NICHT springen!',
    theme: { skyTop: '#5d7fa8', skyBottom: '#b8cbe0', far: '#3e5a80', near: '#2f4a6e', ground: '#7d8590', road: '#5a626d', stripe: '#e9edf2', deco: 'station' },
    v0: 6,
    accel: 0.11,
    vmax: 11,
    gap: [0.95, 1.8],
    weights: { cone: 1, barrier: 1, cop: 4, dog: 2, car: 1, heli: 2 },
  },
  {
    id: 'razzia',
    name: 'Nachtrazzia',
    difficulty: 5,
    blurb: 'Dunkel, schnell, Blaulicht überall. Nur für Profi-Hühner.',
    theme: { skyTop: '#0b1026', skyBottom: '#25305a', far: '#1a2142', near: '#121731', ground: '#2b2f3a', road: '#1f222b', stripe: '#8892a8', night: true, deco: 'city' },
    v0: 7,
    accel: 0.13,
    vmax: 13,
    gap: [0.85, 1.6],
    weights: { cone: 1, barrier: 1, cop: 3, dog: 3, car: 2, heli: 3 },
  },
];

export const MAP_IDS = ['hof', 'dorf', 'markt', 'autobahn', 'revier', 'razzia'] as const;

export function getMap(id: string): HuhnMap {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

export const DIFFICULTY_LABEL = ['', 'Leicht', 'Normal', 'Mittel', 'Schwer', 'Extrem'] as const;
