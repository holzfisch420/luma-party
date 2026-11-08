import { describe, expect, it } from 'vitest';
import { HuhnEngine, huhnServerModule } from '../src/games/huhn/game-engine';
import { DEFAULT_HUHN_SETTINGS, parseHuhnSettings, PHYS } from '../src/games/huhn/game-config';
import { COP_W, flipDistance, generateLevel, inRange, TUBE, type Level } from '../src/games/huhn/logic/level';
import { MAPS } from '../src/games/huhn/maps';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n: number, settings = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  const events: { name: string; payload: any }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'huehnerjagd',
    services: {} as any,
    getPlayers: () => players,
    getPlayer: (id) => players.find((p) => p.id === id),
    publishState: () => {},
    emit: (name, payload) => events.push({ name, payload }),
    notify: () => {},
    setTimer: (ms, fn) => {
      const t = { at: now + ms, fn, dead: false };
      timers.push(t);
      return { cancel: () => (t.dead = true) };
    },
    now: () => now,
    endGame: (r) => (ended = r),
    log: () => {},
  };
  const engine = new HuhnEngine(ctx, { ...DEFAULT_HUHN_SETTINGS, ...settings });
  const advance = (ms: number, each?: () => void) => {
    const end = now + ms;
    for (;;) {
      const next = timers.filter((t) => !t.dead && t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      now = next.at;
      next.dead = true;
      next.fn();
      each?.();
    }
    now = end;
  };
  return { engine, eng: engine as any, advance, events, players, ended: () => ended };
}

/** Untergrund einer Seite an Stelle x (Oberkante bzw. Unterkante) */
function surface(level: Level, side: 1 | -1, x: number): number | null {
  const list = side === 1 ? level.floor : level.ceil;
  const p = inRange(list, x, x + 0.001)[0];
  return p ? p.y : null;
}

/** Bot: schaut nach vorn – Lücke, Wand oder Polizist auf der eigenen Seite → umschalten */
function bot(s: ReturnType<typeof setup>, id: string) {
  const c = s.eng.chickens.get(id);
  if (!c?.alive) return;
  const level: Level = s.eng.level;
  const v = s.eng.speed;
  const here = surface(level, c.g, c.x + PHYS.size / 2);
  const look = v * 0.5 + 1.2;
  let danger = false;
  for (let d = 0.2; d < look; d += 0.2) {
    const X = c.x + PHYS.size + d;
    const sup = surface(level, c.g, X);
    if (sup === null || here === null) danger = true;
    else if (c.g === 1 ? sup < here - 0.05 : sup > here + 0.05) danger = true;
    const mySide = c.g === 1 ? 'floor' : 'ceil';
    if (level.cops.some((cop) => cop.side === mySide && cop.x <= X && cop.x + COP_W >= X - PHYS.size)) danger = true;
    if (level.barriers.some((b) => b.side === mySide && b.x0 <= X && b.x1 >= X - PHYS.size)) danger = true;
    if (danger) break;
  }
  if (danger) s.engine.handleAction(id, 'flip');
}

describe('Hühnerjagd – Level', () => {
  for (const map of MAPS) {
    it(`„${map.name}“: an jeder Stelle gibt es Boden oder Decke, Polizisten sind umgehbar`, () => {
      const level = generateLevel(map, 1234 + map.difficulty, 3000);
      const O = flipDistance(map);
      for (let x = 0; x < 2950; x += 0.5) {
        expect(surface(level, 1, x) !== null || surface(level, -1, x) !== null, `${map.id} x=${x}`).toBe(true);
      }
      for (const cop of level.cops) {
        const other = cop.side === 'floor' ? -1 : 1;
        for (let x = cop.x - O; x < cop.x + COP_W + 1; x += 0.5) expect(surface(level, other, x), `${map.id} Polizist bei ${cop.x}`).not.toBeNull();
      }
    });
  }
  it('gleicher Seed → gleiches Level', () => {
    expect(generateLevel(MAPS[2]!, 42, 500)).toEqual(generateLevel(MAPS[2]!, 42, 500));
  });
});

describe('Hühnerjagd – Engine', () => {
  it('Umschalten dreht die Schwerkraft: vom Boden an die Decke', () => {
    const s = setup(1);
    s.engine.start();
    s.advance(3600);
    const c = s.eng.chickens.get('p0');
    expect(c.g).toBe(1);
    const y0 = c.y;
    s.engine.handleAction('p0', 'flip');
    s.advance(800);
    expect(c.g).toBe(-1);
    expect(c.y).toBeLessThan(y0 - 1);
    expect(c.grounded).toBe(true);
    expect(s.engine.getPrivateState('p0')!.g).toBe(-1);
    // in der Luft lässt sich nicht nochmal umschalten
    s.engine.handleAction('p0', 'flip');
    s.advance(40);
    s.engine.handleAction('p0', 'flip');
    s.advance(40);
    expect(c.g).toBe(1);
  });

  it('Hühner rempeln sich (keine Überlappung)', () => {
    const s = setup(2);
    s.engine.start();
    s.advance(3600);
    const [a, b] = ['p0', 'p1'].map((id) => s.eng.chickens.get(id));
    Object.assign(b, { g: 1, y: a.y, x: a.x + 0.3, vy: 0 });
    s.advance(100);
    expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(PHYS.size - 0.01);
    expect(s.events.some((e) => e.name === 'frame' && e.payload.fx.some((f: any) => f.t === 'bump'))).toBe(true);
  });

  it('Start in der Röhre: alle nebeneinander, niemand übereinander', () => {
    const s = setup(8);
    s.engine.start();
    const cs = [...s.eng.chickens.values()];
    for (const c of cs) {
      expect(c.y).toBeGreaterThanOrEqual(TUBE.ceil - 0.01);
      expect(c.y + PHYS.size).toBeLessThanOrEqual(TUBE.floor + 0.01);
    }
    for (const a of cs)
      for (const b of cs) if (a !== b && a.g === b.g) expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(PHYS.size);
    // in der Röhre stehen Absperrungen abwechselnd unten und oben
    const tubeBarriers = s.eng.level.barriers.filter((b: any) => b.x1 < TUBE.length);
    expect(tubeBarriers.length).toBeGreaterThanOrEqual(3);
    expect(new Set(tubeBarriers.map((b: any) => b.side)).size).toBe(2);
  });

  it('in der Luft fliegen Hühner aneinander vorbei', () => {
    const s = setup(2);
    s.engine.start();
    s.advance(3600);
    const [a, b] = ['p0', 'p1'].map((id) => s.eng.chickens.get(id));
    s.eng.level.barriers = [];
    // a steht unten, b steht oben genau darüber; a schaltet um und fliegt an b vorbei nach oben
    Object.assign(b, { x: a.x, g: -1 });
    s.advance(100);
    s.engine.handleAction('p0', 'flip');
    s.advance(500);
    expect(a.g).toBe(-1);
    expect(b.g).toBe(-1); // b wurde nicht weggehauen
    expect(a.grounded && b.grounded).toBe(true);
  });

  it('Absperrung bremst: wer hineinläuft, fällt zurück', () => {
    const s = setup(1);
    s.engine.start();
    s.advance(3600);
    const c = s.eng.chickens.get('p0');
    s.eng.level.barriers = [];
    const x = c.x + 1.5;
    s.eng.level.barriers.push({ x0: x, x1: x + 0.7, y0: c.y + PHYS.size - 0.9, y1: c.y + PHYS.size, side: c.g === 1 ? 'floor' : 'ceil' });
    s.advance(600);
    expect(c.x + PHYS.size).toBeLessThanOrEqual(x + 0.01);
    expect(c.alive).toBe(true);
  });

  it('wer nie umschaltet, fällt irgendwann raus; Letzter gewinnt', () => {
    const s = setup(3, { rounds: 1, maps: ['dorf'] });
    s.engine.start();
    s.advance(3600);
    s.advance(60_000, () => bot(s, 'p2'));
    const pub = s.engine.getPublicState();
    expect(pub.roundWinnerId).toBe('p2');
    expect(pub.players.find((p) => p.playerId === 'p2')!.score).toBe(3);
    expect(pub.players.filter((p) => p.out).length).toBe(2);
    s.advance(6000);
    expect(s.ended()?.scores.p2).toBe(3);
  });

  it('Sieger bekommt die Punkte nur einmal, auch wenn danach etwas passiert', () => {
    const s = setup(2, { rounds: 1, maps: ['hof'] });
    s.engine.start();
    s.advance(3600);
    s.advance(60_000); // niemand schaltet um
    const pub = s.engine.getPublicState();
    const total = pub.players.reduce((n, p) => n + p.score, 0);
    expect(total).toBe(2); // 0 für den Ersten raus, 1 + 1 Siegbonus
  });

  for (const map of MAPS) {
    it(`„${map.name}“ ist mit gutem Timing schaffbar (40 s)`, () => {
      const s = setup(1, { maps: [map.id], rounds: 1 });
      s.engine.start();
      s.advance(3600);
      s.advance(40_000, () => bot(s, 'p0'));
      const c = s.eng.chickens.get('p0');
      expect(c.alive, `${map.id}: raus (${c.out}) nach ${Math.round(s.eng.camX)} m`).toBe(true);
    });
  }

  it('Einstellungen', () => {
    expect(parseHuhnSettings({}).maps).toEqual([]);
    expect(() => parseHuhnSettings({ maps: ['gibtsnicht'] })).toThrow();
    expect(huhnServerModule.canStart!([], DEFAULT_HUHN_SETTINGS, {} as any)).toBeTruthy();
  });
});
