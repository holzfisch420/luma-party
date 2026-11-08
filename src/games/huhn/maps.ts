/**
 * Level der Hühnerjagd – unterschiedliche Schwierigkeit, Tempo und Plattform-Aufbau.
 */
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
  /** Plattformen: Körper und Oberfläche */
  block: string;
  surface: string;
}

export interface LevelParams {
  /** Chance auf einen Abschnitt mit nur Boden oder nur Decke (Umschalten Pflicht) */
  onlyChance: number;
  onlyExtra: number;
  bothExtra: number;
  /** maximale Höhenänderung zwischen Abschnitten */
  step: number;
  copChance: number;
  midChance: number;
  /** Chance auf eine Polizei-Absperrung je Abschnitt */
  barrierChance: number;
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
  level: LevelParams;
}

export const MAPS: HuhnMap[] = [
  {
    id: 'hof',
    name: 'Bauernhof',
    difficulty: 1,
    blurb: 'Gemütlicher Ausbruch – breite Plattformen, wenig Lücken.',
    theme: { skyTop: '#8fd3ff', skyBottom: '#d8f1ff', far: '#9ed67a', near: '#77bf55', ground: '#c8a46b', road: '#b08850', stripe: '#e3c995', deco: 'farm', block: '#8b5a2b', surface: '#6cc04a' },
    v0: 5,
    accel: 0.05,
    vmax: 8,
    level: { onlyChance: 0.35, onlyExtra: 4, bothExtra: 10, step: 0.6, copChance: 0.15, midChance: 0, barrierChance: 0.35 },
  },
  {
    id: 'dorf',
    name: 'Dorfstraße',
    difficulty: 2,
    blurb: 'Die Dorfpolizei steht schon auf den Dächern – und die Straße hat Löcher.',
    theme: { skyTop: '#7ec8f7', skyBottom: '#e3f4ff', far: '#b5c9a3', near: '#e7a26d', ground: '#9aa0a6', road: '#6b7178', stripe: '#f4f4f4', deco: 'village', block: '#7c6f64', surface: '#b45309' },
    v0: 5.6,
    accel: 0.06,
    vmax: 9,
    level: { onlyChance: 0.5, onlyExtra: 5, bothExtra: 8, step: 0.9, copChance: 0.3, midChance: 0.1, barrierChance: 0.45 },
  },
  {
    id: 'markt',
    name: 'Marktplatz',
    difficulty: 3,
    blurb: 'Marktstände in der Luft, Polizisten überall – oft umschalten!',
    theme: { skyTop: '#ffb88c', skyBottom: '#ffe7c9', far: '#d99a7a', near: '#f2c14e', ground: '#a1887f', road: '#7d6b63', stripe: '#f5e6c8', deco: 'market', block: '#9a6b4f', surface: '#f2c14e' },
    v0: 6.2,
    accel: 0.08,
    vmax: 10.5,
    level: { onlyChance: 0.6, onlyExtra: 5, bothExtra: 6, step: 1.2, copChance: 0.4, midChance: 0.25, barrierChance: 0.5 },
  },
  {
    id: 'autobahn',
    name: 'Autobahn',
    difficulty: 4,
    blurb: 'Vollgas! Kurze Plattformen und Brücken auf allen Höhen.',
    theme: { skyTop: '#6fb1e8', skyBottom: '#cfe6f7', far: '#8fa8b8', near: '#5c8a4a', ground: '#4a4f55', road: '#3a3e44', stripe: '#ffd23f', deco: 'highway', block: '#4b5563', surface: '#ffd23f' },
    v0: 7,
    accel: 0.1,
    vmax: 12,
    level: { onlyChance: 0.7, onlyExtra: 3, bothExtra: 4, step: 1.5, copChance: 0.3, midChance: 0.3, barrierChance: 0.55 },
  },
  {
    id: 'revier',
    name: 'Polizeirevier',
    difficulty: 4,
    blurb: 'Mitten durchs Revier – Polizisten oben und unten.',
    theme: { skyTop: '#5d7fa8', skyBottom: '#b8cbe0', far: '#3e5a80', near: '#2f4a6e', ground: '#7d8590', road: '#5a626d', stripe: '#e9edf2', deco: 'station', block: '#334155', surface: '#60a5fa' },
    v0: 6.8,
    accel: 0.1,
    vmax: 12,
    level: { onlyChance: 0.65, onlyExtra: 4, bothExtra: 5, step: 1.4, copChance: 0.6, midChance: 0.3, barrierChance: 0.6 },
  },
  {
    id: 'razzia',
    name: 'Nachtrazzia',
    difficulty: 5,
    blurb: 'Dunkel, schnell, Blaulicht überall. Nur für Profi-Hühner.',
    theme: { skyTop: '#0b1026', skyBottom: '#25305a', far: '#1a2142', near: '#121731', ground: '#2b2f3a', road: '#1f222b', stripe: '#8892a8', night: true, deco: 'city', block: '#1f2937', surface: '#a78bfa' },
    v0: 7.5,
    accel: 0.12,
    vmax: 13.5,
    level: { onlyChance: 0.8, onlyExtra: 3, bothExtra: 3, step: 2, copChance: 0.5, midChance: 0.4, barrierChance: 0.65 },
  },
];

export const MAP_IDS = ['hof', 'dorf', 'markt', 'autobahn', 'revier', 'razzia'] as const;

export function getMap(id: string): HuhnMap {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

export const DIFFICULTY_LABEL = ['', 'Leicht', 'Normal', 'Mittel', 'Schwer', 'Extrem'] as const;
