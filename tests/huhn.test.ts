import { describe, expect, it } from 'vitest';
import { HuhnEngine, huhnServerModule } from '../src/games/huhn/game-engine';
import { DEFAULT_HUHN_SETTINGS, parseHuhnSettings } from '../src/games/huhn/game-config';
import { MAPS, OBSTACLES } from '../src/games/huhn/maps';
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

/** einfacher Bot: springt rechtzeitig, hält bei hohen Hindernissen, springt nie unter dem Helikopter */
function bot(s: ReturnType<typeof setup>, id: string) {
  const c = s.eng.chickens.get(id);
  if (!c?.alive) return;
  const lane = s.eng.lanes.find((l: any) => l.slot === c.slot);
  const v = s.eng.speed;
  const ahead = lane.obstacles.filter((o: any) => o.x + OBSTACLES[o.kind as keyof typeof OBSTACLES].w > -0.3).sort((a: any, b: any) => a.x - b.x);
  const o = ahead[0];
  if (!o) return s.engine.handleAction(id, 'input', { down: false });
  const ob = OBSTACLES[o.kind as keyof typeof OBSTACLES];
  const t = (o.x - 0.27) / (v + ob.extra);
  if (o.kind === 'heli') return s.engine.handleAction(id, 'input', { down: false });
  const heliSoon = ahead.some((h: any) => h.kind === 'heli' && (h.x - 0.27) / v < 1.0);
  const tall = ob.h > 0.8;
  if (t < 0.11 && t > -0.2 && c.y === 0 && !heliSoon) s.engine.handleAction(id, 'input', { down: true });
  else if (!tall || c.vy <= 0) s.engine.handleAction(id, 'input', { down: false });
}

describe('Hühnerjagd', () => {
  it('Sprung: Tippen springt, Halten springt höher', () => {
    const s = setup(2);
    s.engine.start();
    s.advance(3600);
    const [a, b] = ['p0', 'p1'].map((id) => s.eng.chickens.get(id));
    // Hindernisse weg, damit nichts stört
    for (const l of s.eng.lanes) l.obstacles = [];
    s.eng.lanes.forEach((l: any) => (l.lastArrival = 1e9));
    s.engine.handleAction('p0', 'input', { down: true });
    s.engine.handleAction('p0', 'input', { down: false });
    s.engine.handleAction('p1', 'input', { down: true });
    let maxA = 0;
    let maxB = 0;
    s.advance(900, () => {
      maxA = Math.max(maxA, a.y);
      maxB = Math.max(maxB, b.y);
    });
    expect(maxA).toBeGreaterThan(1.2);
    expect(maxB).toBeGreaterThan(maxA + 0.4);
    expect(a.y).toBe(0);
  });

  it('ohne Springen wird man geschnappt; Letzter gewinnt die Runde', () => {
    const s = setup(3, { rounds: 1, maps: ['hof'] });
    s.engine.start();
    s.advance(3600);
    s.advance(20_000, () => bot(s, 'p2'));
    const pub = s.engine.getPublicState();
    expect(pub.roundWinnerId).toBe('p2');
    const p2 = pub.players.find((p) => p.playerId === 'p2')!;
    expect(p2.place).toBe(1);
    expect(p2.score).toBe(3); // 2 überholt + 1 Siegbonus
    expect(s.events.some((e) => e.name === 'frame' && e.payload.fx.some((f: any) => f.t === 'caught'))).toBe(true);
    s.advance(6000);
    expect(s.ended()?.scores.p2).toBe(3);
  });

  for (const map of MAPS) {
    it(`Strecke „${map.name}“ ist für einen guten Spieler schaffbar (30 s)`, () => {
      const s = setup(2, { maps: [map.id], rounds: 1 });
      s.engine.start();
      s.advance(3600);
      const pass = () => {
        bot(s, 'p0');
        bot(s, 'p1');
      };
      s.advance(30_000, pass);
      const alive = ['p0', 'p1'].filter((id) => s.eng.chickens.get(id).alive || s.engine.getPublicState().roundWinnerId === id);
      expect(alive.length, `${map.id} nach ${Math.round(s.eng.dist)} m`).toBeGreaterThan(0);
    });
  }

  it('Einstellungen', () => {
    expect(parseHuhnSettings({}).maps).toEqual([]);
    expect(() => parseHuhnSettings({ maps: ['gibtsnicht'] })).toThrow();
    expect(huhnServerModule.canStart!([], DEFAULT_HUHN_SETTINGS, {} as any)).toBeTruthy();
  });
});
