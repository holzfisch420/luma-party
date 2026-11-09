import { describe, expect, it } from 'vitest';
import { RacerEngine, racerServerModule } from '../src/games/racer/game-engine';
import { DEFAULT_RACER_SETTINGS, parseRacerSettings } from '../src/games/racer/game-config';
import { buildTrack, TRACKS } from '../src/games/racer/tracks';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n: number, settings = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  const events: { name: string; payload: any }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'kurvenrausch',
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
  const engine = new RacerEngine(ctx, { ...DEFAULT_RACER_SETTINGS, ...settings });
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
  return { engine, eng: engine as any, advance, events, ended: () => ended };
}

/** Bot: zielt auf einen Punkt weiter vorne auf der Mittellinie, bremst vor engen Kurven */
function bot(s: ReturnType<typeof setup>, id: string) {
  const c = s.eng.cars.get(id);
  const t = s.eng.track;
  if (!c?.inRace) return;
  const speed = Math.hypot(c.vx, c.vz);
  const look = Math.round(6 + speed * 0.35);
  const j = t.closed ? (c.si + look) % t.n : Math.min(t.n - 1, c.si + look);
  const target = Math.atan2(t.x[j] - c.x, t.z[j] - c.z);
  let dh = target - c.h;
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  // Kurvigkeit voraus
  const k = t.closed ? (c.si + 30) % t.n : Math.min(t.n - 1, c.si + 30);
  const turn = Math.abs(Math.atan2(t.tx[c.si] * t.tz[k] - t.tz[c.si] * t.tx[k], t.tx[c.si] * t.tx[k] + t.tz[c.si] * t.tz[k]));
  const maxV = Math.max(10, 44 - turn * 26);
  s.engine.handleAction(id, 'input', { s: Math.max(-1, Math.min(1, -dh * 2.5)), g: speed < maxV ? 1 : 0, b: speed > maxV + 4 ? 1 : 0 });
}

describe('Kurvenrausch – Strecken', () => {
  for (const def of TRACKS) {
    it(`„${def.name}“ ist gültig`, () => {
      const t = buildTrack(def);
      expect(t.n).toBeGreaterThan(300);
      expect(t.checkpoints).toHaveLength(def.checkpoints * def.laps);
      expect(t.checkpoints.at(-1)).toBeCloseTo(t.raceDistance);
      for (let i = 0; i < t.n; i++) expect(Number.isFinite(t.x[i]! + t.y[i]! + t.z[i]! + t.tx[i]!)).toBe(true);
    });
  }
});

describe('Kurvenrausch – Fahren', () => {
  it('Gas beschleunigt, Lenkung nach rechts dreht nach rechts, Bande hält das Auto auf der Strecke', () => {
    const s = setup(1, { tracks: ['speedway'] });
    s.engine.start();
    s.advance(4500 + 3300);
    expect(s.engine.getPublicState().phase).toBe('race');
    const c = s.eng.cars.get('p0');
    const t0 = s.eng.track;
    // auf die lange Gerade setzen
    Object.assign(c, { x: t0.x[30], z: t0.z[30], si: 30, dist: 30, h: Math.atan2(t0.tx[30], t0.tz[30]), vx: 0, vz: 0 });
    const h0 = c.h;
    s.engine.handleAction('p0', 'input', { s: 0, g: 1, b: 0 });
    s.advance(3000);
    expect(Math.hypot(c.vx, c.vz)).toBeGreaterThan(25);
    // voll nach rechts: Richtung wird kleiner
    s.engine.handleAction('p0', 'input', { s: 1, g: 1, b: 0 });
    s.advance(300);
    expect(c.h).toBeLessThan(h0);
    // lange voll einlenken → Bande
    s.advance(5000);
    const t = s.eng.track;
    const nx = -t.tz[c.si];
    const nz = t.tx[c.si];
    const d = (c.x - t.x[c.si]) * nx + (c.z - t.z[c.si]) * nz;
    expect(Math.abs(d)).toBeLessThanOrEqual(t.halfWidth);
  });

  it('ohne Bande fällt man runter und landet wieder beim letzten Checkpoint', () => {
    const s = setup(1, { tracks: ['kueste'] });
    s.engine.start();
    s.advance(4500 + 3300);
    const c = s.eng.cars.get('p0');
    const t = s.eng.track;
    // in einen offenen Abschnitt setzen und seitlich runterfahren
    const i = Math.round(t.n * 0.5);
    Object.assign(c, { x: t.x[i], z: t.z[i], si: i, dist: i - t.startIdx, h: Math.atan2(-t.tz[i], t.tx[i]), vx: 0, vz: 0 });
    s.engine.handleAction('p0', 'input', { s: 0, g: 1, b: 0 });
    let fell = false;
    s.advance(2500, () => (fell ||= c.falling));
    expect(fell).toBe(true);
    s.advance(1500);
    expect(c.falling).toBe(false);
    expect(s.events.some((e) => e.name === 'frame' && e.payload.fx.some((f: any) => f.t === 'fall'))).toBe(true);
  });

  it('Autos stoßen sich ab', () => {
    const s = setup(2, { tracks: ['oval'] });
    s.engine.start();
    const [a, b] = ['p0', 'p1'].map((id) => s.eng.cars.get(id));
    b.x = a.x + 0.5;
    b.z = a.z;
    s.eng.step();
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(2 * 1.15 - 0.01);
  });

  for (const def of TRACKS) {
    it(`Bot schafft „${def.name}“ (Checkpoints, Runden, Ziel)`, () => {
      const s = setup(1, { tracks: [def.id], races: 1 });
      s.engine.start();
      s.advance(4500 + 3300);
      s.advance(240_000, () => bot(s, 'p0'));
      const c = s.eng.cars.get('p0');
      expect(c.finished, `${def.id}: ${Math.round(c.dist)} / ${Math.round(s.eng.track.raceDistance)} m`).toBe(true);
      expect(s.events.some((e) => e.name === 'frame' && e.payload.fx.some((f: any) => f.t === 'finish'))).toBe(true);
    });
  }

  it('Punkte nach Platz, Spielende nach allen Rennen', () => {
    const s = setup(2, { tracks: ['oval'], races: 1 });
    s.engine.start();
    s.advance(4500 + 3300);
    s.advance(200_000, () => bot(s, 'p0')); // p1 steht – DNF nach Ablauf der Frist
    s.advance(20_000);
    expect(s.ended()?.scores).toEqual({ p0: 10, p1: 0 });
  });

  it('Einstellungen', () => {
    expect(parseRacerSettings({}).view).toBe('split');
    expect(() => parseRacerSettings({ tracks: ['nope'] })).toThrow();
    expect(racerServerModule.canStart!([], DEFAULT_RACER_SETTINGS, {} as any)).toBeTruthy();
  });
});
