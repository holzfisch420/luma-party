import { describe, expect, it } from 'vitest';
import { PanzerEngine } from '../src/games/panzer/game-engine';
import { DEFAULT_PANZER_SETTINGS } from '../src/games/panzer/game-config';
import { MAPS, validateMap } from '../src/games/panzer/maps';
import { moveBouncing, traceLaser } from '../src/games/panzer/logic/geometry';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n = 2) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  const events: { name: string; payload: any }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'kettenchaos',
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
  const engine = new PanzerEngine(ctx, { ...DEFAULT_PANZER_SETTINGS, mapMode: 'rotation', maps: ['feld'], powerups: 'off', winScore: 2 });
  const advance = (ms: number) => {
    const end = now + ms;
    while (true) {
      const next = timers.filter((t) => !t.dead && t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      now = next.at;
      next.dead = true;
      next.fn();
    }
    now = end;
  };
  return { engine, advance, events, players, ended: () => ended, eng: engine as any };
}

function ready(s: ReturnType<typeof setup>) {
  s.engine.start();
  for (const p of s.players) s.engine.handleAction(p.id, 'ready', { ready: true });
  s.advance(3100); // Countdown
  expect(s.engine.getPublicState().phase).toBe('battle');
}

describe('Kettenchaos – Karten & Geometrie', () => {
  it('hat mindestens 12 gültige, verbundene Karten mit 8 Startpunkten', () => {
    expect(MAPS.length).toBeGreaterThanOrEqual(12);
    for (const m of MAPS) {
      expect(validateMap(m), m.id).toBeNull();
      expect(m.spawns).toHaveLength(8);
      expect(new Set(m.spawns.map((s) => `${s.x},${s.y}`)).size, m.id).toBe(8);
    }
  });
  it('Kugeln prallen an Wänden ab', () => {
    const wall = [{ x: 5, y: 0, w: 1, h: 10 }];
    const r = moveBouncing(4.5, 5, 5, 0, 0.1, 0.3, wall);
    expect(r.vx).toBeLessThan(0);
    expect(r.bounces).toBe(1);
    expect(r.x).toBeLessThan(4.9);
  });
  it('Laser prallt ab', () => {
    const pts = traceLaser(1, 1, 0, [{ x: 5, y: 0, w: 1, h: 10 }], 10, 3);
    expect(pts[2]).toBeCloseTo(5);
    expect(pts[pts.length - 2]).toBeLessThan(5);
  });
});

describe('Kettenchaos – Engine', () => {
  it('Farbwahl: Farben sind eindeutig, alle bereit → Runde startet', () => {
    const s = setup(3);
    s.engine.start();
    expect(s.engine.getPublicState().phase).toBe('colors');
    const colors = s.engine.getPublicState().players.map((p) => p.color);
    expect(new Set(colors).size).toBe(3);
    s.engine.handleAction('p0', 'color', { index: colors[1] }); // vergeben → ignoriert
    expect(s.engine.getPublicState().players[0]!.color).toBe(colors[0]);
    s.engine.handleAction('p0', 'color', { index: 15 });
    expect(s.engine.getPublicState().players[0]!.color).toBe(15);
    for (const p of s.players) s.engine.handleAction(p.id, 'ready', { ready: true });
    expect(s.engine.getPublicState().phase).toBe('countdown');
    expect(s.events.some((e) => e.name === 'round')).toBe(true);
  });

  it('Treffer zerstört, Überlebender punktet, Spielende bei Siegpunktzahl', () => {
    const s = setup(2);
    ready(s);
    const [a, b] = [s.eng.tanks.get('p0'), s.eng.tanks.get('p1')];
    // a schaut auf b
    Object.assign(a, { x: 2.5, y: 4.5, a: 0 });
    Object.assign(b, { x: 6.5, y: 4.5, a: Math.PI });
    s.engine.handleAction('p0', 'input', { x: 0, y: 0, b: 1 });
    s.engine.handleAction('p0', 'input', { x: 0, y: 0, b: 0 });
    s.advance(1500);
    expect(b.alive).toBe(false);
    expect(a.kills).toBe(1);
    const frames = s.events.filter((e) => e.name === 'frame');
    expect(frames.length).toBeGreaterThan(20);
    expect(frames.some((f) => f.payload.fx.some((x: any) => x.t === 'kill'))).toBe(true);
    s.advance(2600); // Gnadenfrist
    expect(s.engine.getPublicState().phase).toBe('roundEnd');
    expect(s.engine.getPublicState().roundWinnerId).toBe('p0');
    expect(a.score).toBe(1);
    s.advance(3600 + 3100); // nächste Runde + Countdown
    expect(s.engine.getPublicState().round).toBe(2);
    expect(b.alive).toBe(true);
    // zweiter Sieg → Spielende
    Object.assign(a, { x: 2.5, y: 4.5, a: 0 });
    Object.assign(b, { x: 6.5, y: 4.5, a: Math.PI });
    s.engine.handleAction('p0', 'input', { x: 0, y: 0, b: 1 });
    s.advance(1500 + 2600 + 3600);
    expect(s.ended()?.scores.p0).toBe(2);
  });

  it('Schild hält einen Treffer ab, Laser und Mine zerstören', () => {
    const s = setup(3);
    ready(s);
    const [a, b, c] = ['p0', 'p1', 'p2'].map((id) => s.eng.tanks.get(id));
    Object.assign(a, { x: 2.5, y: 4.5, a: 0 });
    Object.assign(b, { x: 6.5, y: 4.5, a: 0, power: 'shield' });
    Object.assign(c, { x: 20.5, y: 12.5, a: 0 });
    s.engine.handleAction('p1', 'input', { x: 0, y: 0, b: 2 }); // Schild aktivieren
    s.advance(50);
    expect(b.shieldUntil).toBeGreaterThan(0);
    s.engine.handleAction('p0', 'input', { x: 0, y: 0, b: 1 });
    s.advance(1200);
    expect(b.alive).toBe(true);
    expect(b.shieldUntil).toBe(0);
    // Laser
    a.power = 'laser';
    s.engine.handleAction('p0', 'input', { x: 0, y: 0, b: 2 });
    s.advance(50);
    expect(b.alive).toBe(false);
    // Mine
    Object.assign(c, { x: 20.5, y: 12.5, power: 'mine' });
    s.engine.handleAction('p2', 'input', { x: 0, y: 0, b: 2 });
    s.advance(1300);
    expect(s.eng.mines).toHaveLength(1);
    Object.assign(a, { x: s.eng.mines[0].x + 0.2, y: s.eng.mines[0].y });
    s.advance(50);
    expect(a.alive).toBe(false);
  });

  it('Panzer fahren nicht durch Wände', () => {
    const s = setup(2);
    ready(s);
    const a = s.eng.tanks.get('p0');
    Object.assign(a, { x: 1.5, y: 1.5, a: Math.PI }); // Blick zur linken Wand
    s.engine.handleAction('p0', 'input', { x: 0, y: -1, b: 0 });
    s.advance(2000);
    expect(a.x).toBeGreaterThanOrEqual(0.3);
  });
});

describe('Kettenchaos – Einstellungen', () => {
  it('Standard-Einstellungen sind gültig', async () => {
    const { parsePanzerSettings } = await import('../src/games/panzer/game-config');
    expect(parsePanzerSettings({}).maps).toEqual([]);
    expect(parsePanzerSettings({ powerups: 'many', maps: ['feld'] }).powerups).toBe('many');
    expect(() => parsePanzerSettings({ winScore: 0 })).toThrow();
  });
});
