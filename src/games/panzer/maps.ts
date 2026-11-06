/**
 * Arenen für Kettenchaos: 24 × 14 Kacheln, '#' = Wand, '.' = Boden.
 * Der Rand wird automatisch ergänzt. Startpunkte werden automatisch verteilt.
 */

export const MAP_W = 24;
export const MAP_H = 14;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArenaMap {
  id: string;
  name: string;
  /** Bodenfarbe / Thema */
  theme: 'sand' | 'grass' | 'snow' | 'asphalt';
  grid: string[];
  walls: Rect[];
  spawns: { x: number; y: number }[];
}

const RAW: { id: string; name: string; theme: ArenaMap['theme']; rows: string[] }[] = [
  {
    id: 'feld',
    name: 'Offenes Feld',
    theme: 'grass',
    rows: [
      '........................',
      '........................',
      '...##..............##...',
      '...##..............##...',
      '........................',
      '........................',
      '..........####..........',
      '..........####..........',
      '........................',
      '........................',
      '...##..............##...',
      '...##..............##...',
      '........................',
      '........................',
    ],
  },
  {
    id: 'kreuzung',
    name: 'Kreuzung',
    theme: 'asphalt',
    rows: [
      '........................',
      '........................',
      '...........##...........',
      '...........##...........',
      '...........##...........',
      '........................',
      '.....######..######.....',
      '.....######..######.....',
      '........................',
      '...........##...........',
      '...........##...........',
      '...........##...........',
      '........................',
      '........................',
    ],
  },
  {
    id: 'labyrinth',
    name: 'Labyrinth',
    theme: 'sand',
    rows: [
      '........#...............',
      '.######.#.#####.#######.',
      '.#......#.....#.......#.',
      '.#.####.#####.#.#####.#.',
      '.#.#..........#.#.....#.',
      '.#.#.########.#.#.###.#.',
      '...#.#......#...#.#...#.',
      '.#.#.#.####.#####.#.#.#.',
      '.#...#....#.......#.#...',
      '.#####.##.#.#######.###.',
      '.......#..#.#.......#...',
      '.#######..#.#.#######.#.',
      '.#........#...........#.',
      '........................',
    ],
  },
  {
    id: 'saeulen',
    name: 'Säulenhalle',
    theme: 'asphalt',
    rows: [
      '........................',
      '........................',
      '..#...#...#..#...#...#..',
      '........................',
      '........................',
      '..#...#...#..#...#...#..',
      '........................',
      '........................',
      '..#...#...#..#...#...#..',
      '........................',
      '........................',
      '..#...#...#..#...#...#..',
      '........................',
      '........................',
    ],
  },
  {
    id: 'festung',
    name: 'Festung',
    theme: 'sand',
    rows: [
      '........................',
      '........................',
      '........................',
      '.......####..####.......',
      '.......#........#.......',
      '.......#..#..#..#.......',
      '..........#..#..........',
      '..........#..#..........',
      '.......#..#..#..#.......',
      '.......#........#.......',
      '.......####..####.......',
      '........................',
      '........................',
      '........................',
    ],
  },
  {
    id: 'x-kreuz',
    name: 'X-Kreuz',
    theme: 'snow',
    rows: [
      '........................',
      '........................',
      '...##..............##...',
      '....##............##....',
      '.....##..........##.....',
      '......##........##......',
      '........................',
      '........................',
      '......##........##......',
      '.....##..........##.....',
      '....##............##....',
      '...##..............##...',
      '........................',
      '........................',
    ],
  },
  {
    id: 'schach',
    name: 'Schachbrett',
    theme: 'grass',
    rows: [
      '........................',
      '........................',
      '...##......##......##...',
      '...##......##......##...',
      '........................',
      '........................',
      '.......##......##.......',
      '.......##......##.......',
      '........................',
      '........................',
      '...##......##......##...',
      '...##......##......##...',
      '........................',
      '........................',
    ],
  },
  {
    id: 'spirale',
    name: 'Spirale',
    theme: 'snow',
    rows: [
      '........................',
      '........................',
      '..####################..',
      '..#..................#..',
      '..#..................#..',
      '..#..############....#..',
      '..#..#..........#....#..',
      '..#..#..........#....#..',
      '..#..#...########....#..',
      '..#..#...............#..',
      '..#..#...............#..',
      '..#..#################..',
      '........................',
      '........................',
    ],
  },
  {
    id: 'lager',
    name: 'Zwei Lager',
    theme: 'grass',
    rows: [
      '........................',
      '........................',
      '.####..............####.',
      '.#....................#.',
      '.#....................#.',
      '.#.........##.........#.',
      '...........##...........',
      '...........##...........',
      '.#.........##.........#.',
      '.#....................#.',
      '.#....................#.',
      '.####..............####.',
      '........................',
      '........................',
    ],
  },
  {
    id: 'gassen',
    name: 'Gassen',
    theme: 'asphalt',
    rows: [
      '........................',
      '........................',
      '.########..######..####.',
      '........................',
      '........................',
      '..####..########..######',
      '........................',
      '........................',
      '######..########..####..',
      '........................',
      '........................',
      '.####..######..########.',
      '........................',
      '........................',
    ],
  },
  {
    id: 'ring',
    name: 'Ring',
    theme: 'sand',
    rows: [
      '........................',
      '........................',
      '...########..########...',
      '...#................#...',
      '...#..############..#...',
      '...#..############..#...',
      '......############......',
      '......############......',
      '...#..############..#...',
      '...#..############..#...',
      '...#................#...',
      '...########..########...',
      '........................',
      '........................',
    ],
  },
  {
    id: 'inseln',
    name: 'Inseln',
    theme: 'grass',
    rows: [
      '........................',
      '........................',
      '..###..............###..',
      '..#..................#..',
      '........................',
      '.........##..##.........',
      '....##...#....#...##....',
      '....##...#....#...##....',
      '.........##..##.........',
      '........................',
      '..#..................#..',
      '..###..............###..',
      '........................',
      '........................',
    ],
  },
  {
    id: 'engpass',
    name: 'Engpass',
    theme: 'snow',
    rows: [
      '...........##...........',
      '...........##...........',
      '...........##...........',
      '........................',
      '...##......##......##...',
      '...##......##......##...',
      '...........##...........',
      '...........##...........',
      '...##......##......##...',
      '...##......##......##...',
      '........................',
      '...........##...........',
      '...........##...........',
      '...........##...........',
    ],
  },
];

/** '#'-Kacheln zu möglichst großen Rechtecken zusammenfassen */
function buildWalls(rows: string[]): Rect[] {
  const runs: Rect[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') {
        x++;
        continue;
      }
      const start = x;
      while (x < row.length && row[x] === '#') x++;
      runs.push({ x: start, y, w: x - start, h: 1 });
    }
  });
  // gleiche Läufe in aufeinanderfolgenden Zeilen vertikal verschmelzen
  const merged: Rect[] = [];
  for (const r of runs) {
    const above = merged.find((m) => m.x === r.x && m.w === r.w && m.y + m.h === r.y);
    if (above) above.h += 1;
    else merged.push({ ...r });
  }
  // Rand (außerhalb des Spielfelds, damit das Feld voll nutzbar bleibt)
  const t = 1;
  merged.push({ x: -t, y: -t, w: MAP_W + 2 * t, h: t });
  merged.push({ x: -t, y: MAP_H, w: MAP_W + 2 * t, h: t });
  merged.push({ x: -t, y: 0, w: t, h: MAP_H });
  merged.push({ x: MAP_W, y: 0, w: t, h: MAP_H });
  return merged;
}

const isFloor = (rows: string[], x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H && rows[y]![x] !== '#';

/** 8 Startpunkte: freie Kacheln mit freier Umgebung, möglichst weit voneinander entfernt */
function buildSpawns(rows: string[]): { x: number; y: number }[] {
  const freeAround = (x: number, y: number) => {
    let free = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (isFloor(rows, x + dx, y + dy)) free++;
    return free;
  };
  // möglichst offene Kacheln; bei engen Karten (Labyrinth) schrittweise weniger streng
  let pool: { x: number; y: number }[] = [];
  for (const min of [8, 6, 4, 1]) {
    pool = [];
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (isFloor(rows, x, y) && freeAround(x, y) >= min) pool.push({ x, y });
    if (pool.length >= 40) break;
  }
  // Start in der Ecke oben links, dann jeweils der am weitesten entfernte Punkt
  const chosen = [pool.reduce((a, b) => (a.x + a.y <= b.x + b.y ? a : b))];
  while (chosen.length < 8) {
    let best = pool[0]!;
    let bestD = -1;
    for (const p of pool) {
      const d = Math.min(...chosen.map((c) => (c.x - p.x) ** 2 + (c.y - p.y) ** 2));
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    chosen.push(best);
  }
  return chosen.map((c) => ({ x: c.x + 0.5, y: c.y + 0.5 }));
}

export const MAPS: ArenaMap[] = RAW.map((m) => ({ id: m.id, name: m.name, theme: m.theme, grid: m.rows, walls: buildWalls(m.rows), spawns: buildSpawns(m.rows) }));

export const MAP_IDS = MAPS.map((m) => m.id);

export function getMap(id: string): ArenaMap {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

/** Prüft Kartengröße und ob alle Bodenkacheln miteinander verbunden sind (für Tests). */
export function validateMap(m: { grid: string[] }): string | null {
  if (m.grid.length !== MAP_H) return `Höhe ${m.grid.length} statt ${MAP_H}`;
  const bad = m.grid.findIndex((r) => r.length !== MAP_W);
  if (bad >= 0) return `Zeile ${bad} hat Breite ${m.grid[bad]!.length}`;
  const floor: [number, number][] = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (isFloor(m.grid, x, y)) floor.push([x, y]);
  const seen = new Set<string>([floor[0]!.join(',')]);
  const queue = [floor[0]!];
  while (queue.length) {
    const [x, y] = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const k = `${x + dx},${y + dy}`;
      if (!seen.has(k) && isFloor(m.grid, x + dx, y + dy)) {
        seen.add(k);
        queue.push([x + dx, y + dy]);
      }
    }
  }
  if (seen.size !== floor.length) return `${floor.length - seen.size} Bodenkacheln sind nicht erreichbar`;
  return null;
}
