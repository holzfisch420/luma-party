import { describe, expect, it } from 'vitest';
import { PanzerEngine } from '../src/games/panzer/game-engine';
import { DEFAULT_PANZER_SETTINGS } from '../src/games/panzer/game-config';
import { MAPS, validateMap } from '../src/games/panzer/maps';
import { traceLaser } from '../src/games/panzer/logic/geometry';
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
  it('Laser geht geradeaus bis zur Wand', () => {
    const pts = traceLaser(1, 1, 0, [{ x: 5, y: 0, w: 1, h: 10 }], 10, 0);
    expect(pts).toHaveLength(4);
    expect(pts[2]).toBeCloseTo(5);
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

  it('Fahrknopf: sofort losfahren, loslassen = drehen, Tippen wechselt die Drehrichtung', () => {
    const s = setup(2);
    ready(s);
    const a = s.eng.tanks.get('p0');
    Object.assign(a, { x: 6.5, y: 9.5, a: 0 });
    Object.assign(s.eng.tanks.get('p1'), { x: 20.5, y: 12.5 });
    expect(a.rotDir).toBe(1);
    s.advance(500);
    expect(a.a).toBeGreaterThan(0.5); // losgelassen: dreht sich von selbst
    expect(a.x).toBeCloseTo(6.5);
    // gedrückt → fährt ohne Verzögerung
    Object.assign(a, { x: 6.5, y: 9.5, a: 0 });
    s.engine.handleAction('p0', 'input', { b: 1 });
    s.advance(50);
    expect(a.x).toBeGreaterThan(6.55);
    expect(a.a).toBeCloseTo(0);
    s.advance(1000);
    expect(a.x).toBeGreaterThan(8.5);
    s.engine.handleAction('p0', 'input', { b: 0 });
    expect(a.rotDir).toBe(1); // langes Halten wechselt die Richtung nicht
    // kurzes Tippen
    s.engine.handleAction('p0', 'input', { b: 1 });
    s.advance(80);
    s.engine.handleAction('p0', 'input', { b: 0 });
    expect(a.rotDir).toBe(-1);
    expect(s.engine.getPrivateState('p0')!.rotDir).toBe(-1);
    const before = a.a;
    s.advance(300);
    expect(a.a).toBeLessThan(before);
  });

  it('Feuer-Knopf schießt, Treffer zerstört, Überlebender punktet, Spielende bei Siegpunktzahl', () => {
    const s = setup(2);
    ready(s);
    const [a, b] = [s.eng.tanks.get('p0'), s.eng.tanks.get('p1')];
    const shoot = () => {
      Object.assign(a, { x: 2.5, y: 4.5, a: 0 });
      Object.assign(b, { x: 6.5, y: 4.5, a: Math.PI / 2 });
      s.engine.handleAction('p0', 'input', { b: 2 });
      s.engine.handleAction('p0', 'input', { b: 0 });
    };
    s.advance(1000);
    expect(s.eng.bullets).toHaveLength(0); // kein automatisches Feuer
    shoot();
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
    shoot();
    s.advance(1500 + 2600 + 3600);
    expect(s.ended()?.scores.p0).toBe(2);
  });

  it('Kugeln prallen nicht ab – kein Eigentreffer an der Wand', () => {
    const s = setup(2);
    ready(s);
    const [a, b] = [s.eng.tanks.get('p0'), s.eng.tanks.get('p1')];
    Object.assign(a, { x: 1.5, y: 7.5, a: Math.PI }); // direkt vor der linken Wand
    Object.assign(b, { x: 20.5, y: 12.5 });
    s.engine.handleAction('p0', 'input', { b: 2 });
    s.advance(17);
    expect(s.eng.bullets.length).toBeGreaterThan(0);
    s.advance(800);
    expect(s.eng.bullets).toHaveLength(0);
    expect(a.alive).toBe(true);
  });

  it('Items werden eingesammelt und erst mit dem Item-Knopf eingesetzt', () => {
    const s = setup(3);
    ready(s);
    const [a, b, c] = ['p0', 'p1', 'p2'].map((id) => s.eng.tanks.get(id));
    Object.assign(a, { x: 2.5, y: 4.5, a: 0 });
    Object.assign(b, { x: 6.5, y: 4.5, a: 0 });
    Object.assign(c, { x: 20.5, y: 12.5, a: 0 });
    const press = (id: string, bit: number) => {
      s.engine.handleAction(id, 'input', { b: bit });
      s.engine.handleAction(id, 'input', { b: 0 });
    };
    // Schild einsammeln → noch nicht aktiv
    s.eng.crates.push({ x: 6.5, y: 4.5, power: 'shield' });
    s.advance(17);
    expect(b.power).toBe('shield');
    expect(b.shieldUntil).toBe(0);
    press('p1', 4);
    s.advance(17);
    expect(b.power).toBeNull();
    expect(b.shieldUntil).toBeGreaterThan(0);
    // a schießt → Schild fängt ab
    a.a = 0;
    press('p0', 2);
    s.advance(1200);
    expect(b.alive).toBe(true);
    expect(b.shieldUntil).toBe(0);
    // Laser per Item-Knopf
    Object.assign(a, { a: 0, power: 'laser' });
    press('p0', 4);
    s.advance(17);
    expect(a.power).toBeNull();
    expect(b.alive).toBe(false);
    // Mine einsammeln und legen
    s.eng.crates.push({ x: 20.5, y: 12.5, power: 'mine' });
    s.advance(17);
    expect(s.eng.mines).toHaveLength(0);
    press('p2', 4);
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
    s.engine.handleAction('p0', 'input', { b: 1 });
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
