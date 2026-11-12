import { describe, expect, it } from 'vitest';
import { dealRoles, VollmondEngine } from '../src/games/vollmond/game-engine';
import { DEFAULT_VOLLMOND_SETTINGS, TIMING, type Role } from '../src/games/vollmond/game-config';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n = 7, overrides = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'vollmond',
    services: {} as any,
    getPlayers: () => players,
    getPlayer: (id) => players.find((p) => p.id === id),
    publishState: () => {},
    emit: () => {},
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
  const engine = new VollmondEngine(ctx, { ...DEFAULT_VOLLMOND_SETTINGS, ...overrides });
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const next = timers.filter((t) => !t.dead && t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      now = next.at;
      next.dead = true;
      next.fn();
    }
    now = end;
  };
  const role = (id: string) => engine.getPrivateState(id)!.role;
  const withRole = (r: Role) => players.map((p) => p.id).filter((id) => role(id) === r);
  return { engine, advance, players, pub: () => engine.getPublicState(), ended: () => ended, role, withRole };
}

describe('Vollmond', () => {
  it('verteilt Rollen passend zur Spielerzahl', () => {
    const r7 = dealRoles(7, DEFAULT_VOLLMOND_SETTINGS);
    expect(r7.filter((r) => r === 'werwolf')).toHaveLength(2);
    expect(r7).toContain('seherin');
    expect(r7).toContain('leibwaechter');
    const r4 = dealRoles(4, DEFAULT_VOLLMOND_SETTINGS);
    expect(r4.filter((r) => r === 'werwolf')).toHaveLength(1);
    expect(r4).not.toContain('hexe');
  });

  it('öffentlicher Zustand verrät keine Rollen', () => {
    const s = setup(7);
    s.engine.start();
    expect(s.pub().roles).toBeNull();
    const { roleCount, ...rest } = s.pub();
    expect(roleCount.werwolf).toBe(2); // nur die Zusammensetzung ist öffentlich
    expect(JSON.stringify(rest)).not.toContain('werwolf');
  });

  it('Nacht: Werwölfe töten, Leibwächter schützt, Seherin sieht', () => {
    const s = setup(8, { specials: ['seherin', 'leibwaechter'] });
    s.engine.start();
    for (const p of s.players) s.engine.handleAction(p.id, 'seen', {});
    expect(s.pub().phase).toBe('night');
    const wolves = s.withRole('werwolf');
    const seer = s.withRole('seherin')[0]!;
    const guard = s.withRole('leibwaechter')[0]!;
    const villagers = s.withRole('dorf');
    const [v1, v2] = villagers;
    for (const w of wolves) s.engine.handleAction(w, 'pick', { target: v1 });
    s.engine.handleAction(seer, 'pick', { target: wolves[0] });
    expect(s.engine.getPrivateState(seer)!.seen[0]).toMatchObject({ playerId: wolves[0], wolf: true });
    s.engine.handleAction(guard, 'pick', { target: v1 });
    for (const v of villagers) s.engine.handleAction(v, 'pick', { target: v2 });
    expect(s.pub().phase).toBe('morning');
    expect(s.pub().news).toHaveLength(0); // geschützt
    s.advance(TIMING.morningMs);
    expect(s.pub().phase).toBe('day');
    // Leibwächter darf nicht zweimal dieselbe Person schützen (nächste Nacht)
  });

  it('Abstimmung verbannt, Gleichstand niemanden; Dorf gewinnt, wenn alle Wölfe weg sind', () => {
    const s = setup(5, { specials: [] });
    s.engine.start();
    s.advance(TIMING.rolesMs);
    const wolf = s.withRole('werwolf')[0]!;
    const others = s.players.map((p) => p.id).filter((id) => id !== wolf);
    s.engine.handleAction(wolf, 'pick', { target: others[0] });
    for (const o of others) s.engine.handleAction(o, 'pick', { target: null });
    expect(s.pub().news.map((d) => d.playerId)).toEqual([others[0]]);
    s.advance(TIMING.morningMs);
    // alle bereit → Abstimmung
    for (const id of s.pub().alive) s.engine.handleAction(id, 'ready', {});
    expect(s.pub().phase).toBe('vote');
    for (const id of s.pub().alive) if (id !== wolf) s.engine.handleAction(id, 'vote', { target: wolf });
    s.engine.handleAction(wolf, 'vote', { target: others[1] });
    expect(s.pub().phase).toBe('verdict');
    expect(s.pub().news[0]).toMatchObject({ playerId: wolf, cause: 'dorf', role: 'werwolf' });
    s.advance(TIMING.verdictMs);
    expect(s.pub()).toMatchObject({ phase: 'end', winner: 'dorf' });
    expect(s.pub().roles![wolf]).toBe('werwolf');
    s.advance(15_000);
    expect(s.ended().scores[others[1]!]).toBe(4);
    expect(s.ended().scores[wolf]).toBe(0);
  });

  it('Jäger nimmt jemanden mit; Werwölfe gewinnen bei Gleichstand der Zahl', () => {
    const s = setup(6, { specials: ['jaeger'] });
    s.engine.start();
    s.advance(TIMING.rolesMs);
    const wolf = s.withRole('werwolf')[0]!;
    const hunter = s.withRole('jaeger')[0]!;
    const villagers = s.withRole('dorf');
    s.engine.handleAction(wolf, 'pick', { target: hunter });
    for (const id of s.players.map((p) => p.id)) if (id !== wolf) s.engine.handleAction(id, 'pick', { target: null });
    s.advance(TIMING.morningMs);
    expect(s.pub()).toMatchObject({ phase: 'hunter', hunterId: hunter });
    s.engine.handleAction(hunter, 'shoot', { target: villagers[0] });
    expect(s.pub().phase).toBe('day');
    expect(s.pub().alive).toHaveLength(4);
  });
});
