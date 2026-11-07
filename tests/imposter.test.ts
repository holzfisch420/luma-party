import { describe, expect, it } from 'vitest';
import { ImposterEngine, imposterServerModule, wordPool } from '../src/games/imposter/game-engine';
import { DEFAULT_IMPOSTER_SETTINGS, parseImposterSettings } from '../src/games/imposter/game-config';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n = 4, overrides = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'imposter',
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
  const engine = new ImposterEngine(ctx, { ...DEFAULT_IMPOSTER_SETTINGS, rounds: 2, clueRounds: 1, ...overrides });
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
  const pub = () => engine.getPublicState();
  const imposter = () => players.find((p) => engine.getPrivateState(p.id)!.role === 'imposter')!.id;
  return { engine, advance, players, pub, imposter, ended: () => ended };
}

function toVote(s: ReturnType<typeof setup>) {
  for (const p of s.players) s.engine.handleAction(p.id, 'seen', {});
  expect(s.pub().phase).toBe('clues');
  for (let i = 0; i < s.players.length; i++) s.engine.handleAction(s.pub().order[s.pub().turn]!, 'done', {});
  expect(s.pub().phase).toBe('discuss');
  for (const p of s.players) s.engine.handleAction(p.id, 'readyToVote', {});
  expect(s.pub().phase).toBe('vote');
}

describe('Imposter', () => {
  it('genau ein Imposter ohne Wort, alle anderen mit demselben Wort; Wort nicht öffentlich', () => {
    const s = setup(5);
    s.engine.start();
    const privs = s.players.map((p) => s.engine.getPrivateState(p.id)!);
    expect(privs.filter((p) => p.role === 'imposter')).toHaveLength(1);
    const words = new Set(privs.filter((p) => p.role === 'crew').map((p) => p.word));
    expect(words.size).toBe(1);
    expect(privs.find((p) => p.role === 'imposter')!.word).toBeNull();
    const word = [...words][0]!;
    expect(JSON.stringify(s.pub())).not.toContain(word);
    expect(s.pub().order[0]).not.toBe(s.imposter()); // Imposter beginnt nie
  });

  it('nur wer dran ist, kann weitergeben', () => {
    const s = setup(4);
    s.engine.start();
    for (const p of s.players) s.engine.handleAction(p.id, 'seen', {});
    const current = s.pub().order[0]!;
    const other = s.pub().order[1]!;
    s.engine.handleAction(other, 'done', {});
    expect(s.pub().turn).toBe(0);
    s.engine.handleAction(current, 'done', {});
    expect(s.pub().turn).toBe(1);
  });

  it('Imposter erwischt → Crew punktet, richtiger Tipp gibt dem Imposter Punkte', () => {
    const s = setup(4);
    s.engine.start();
    const imp = s.imposter();
    const word = s.engine.getPrivateState(s.players.find((p) => p.id !== imp)!.id)!.word!;
    toVote(s);
    const crew = s.players.filter((p) => p.id !== imp);
    for (const p of crew) s.engine.handleAction(p.id, 'vote', { target: imp });
    s.engine.handleAction(imp, 'vote', { target: crew[0]!.id });
    expect(s.pub().phase).toBe('guess');
    expect(s.pub().accusedId).toBe(imp);
    expect(s.pub().result).toBeNull(); // Wort noch geheim
    s.engine.handleAction(crew[0]!.id, 'guess', { text: word }); // nur der Imposter darf raten
    expect(s.pub().phase).toBe('guess');
    s.engine.handleAction(imp, 'guess', { text: word.toUpperCase() });
    const r = s.pub().result!;
    expect(s.pub().phase).toBe('result');
    expect(r.caught).toBe(true);
    expect(r.guessCorrect).toBe(true);
    expect(s.pub().scores[imp]).toBe(2);
    expect(s.pub().scores[crew[1]!.id]).toBe(2);
  });

  it('Imposter entkommt bei Gleichstand; Spielende nach den Runden', () => {
    const s = setup(4);
    s.engine.start();
    const imp = s.imposter();
    toVote(s);
    const [a, b, c, d] = s.pub().order;
    s.engine.handleAction(a!, 'vote', { target: b });
    s.engine.handleAction(b!, 'vote', { target: a });
    s.engine.handleAction(c!, 'vote', { target: d });
    s.engine.handleAction(d!, 'vote', { target: c });
    expect(s.pub().result!.ejectedId).toBeNull();
    expect(s.pub().scores[imp]).toBe(3);
    s.advance(13_000);
    expect(s.pub().round).toBe(2);
    expect(s.pub().phase).toBe('reveal');
    s.advance(500_000); // alles läuft per Timer durch
    expect(s.ended()).not.toBeNull();
  });

  it('Imposter verlässt das Spiel → neue Runde', () => {
    const s = setup(4, { rounds: 3 });
    s.engine.start();
    const imp = s.imposter();
    s.engine.onPlayerLeft!(s.players.find((p) => p.id === imp)!);
    expect(s.pub().phase).toBe('result');
    expect(s.pub().result!.imposterLeft).toBe(true);
  });

  it('Einstellungen & Startprüfung', () => {
    expect(parseImposterSettings({}).categories).not.toContain('Geeker-Vocab');
    expect(wordPool(DEFAULT_IMPOSTER_SETTINGS).length).toBeGreaterThan(100);
    const two: GamePlayer[] = [0, 1].map((i) => ({ id: `p${i}`, name: 'x', avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
    expect(imposterServerModule.canStart!(two, DEFAULT_IMPOSTER_SETTINGS, {} as any)).toMatch(/3 Spieler/);
  });
});
