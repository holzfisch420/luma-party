import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EchtEngine, echtServerModule, statementPool } from '../src/games/echt/game-engine';
import { normalizeStatement } from '../src/server/storage/statement-store';
import { DEFAULT_ECHT_SETTINGS, parseEchtSettings } from '../src/games/echt/game-config';
import { STATEMENTS } from '../src/games/echt/statements';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n = 4, overrides = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'echtjetzt',
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
  const engine = new EchtEngine(ctx, { ...DEFAULT_ECHT_SETTINGS, perTurn: 1, sets: ['familie'], ...overrides });
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
  return { engine, advance, players, pub: () => engine.getPublicState(), ended: () => ended };
}

describe('Echt jetzt?', () => {
  it('hat genug eigene Sätze (auch mit zwei Platzhaltern)', () => {
    const all = Object.values(STATEMENTS).flat();
    expect(all.length).toBeGreaterThanOrEqual(250);
    expect(new Set(all).size).toBe(all.length);
    for (const s of all) expect(s.split('___').length - 1, s).toBeGreaterThanOrEqual(1);
    expect(all.some((s) => s.split('___').length - 1 === 2)).toBe(true);
  });

  it('Ablauf: schreiben → abstimmen → Auflösung mit Punkten; Autoren bleiben bis zur Auflösung geheim', () => {
    const s = setup(4);
    s.engine.start();
    const hero = s.pub().heroId;
    expect(hero).toBe('p0');
    s.engine.handleAction('p0', 'answer', { text: 'Pfannkuchen' });
    s.engine.handleAction('p1', 'answer', { text: 'Pizza' });
    s.engine.handleAction('p2', 'answer', { text: 'pfannkuchen!' }); // gleiche Antwort wie p0
    expect(s.pub().phase).toBe('write');
    s.engine.handleAction('p3', 'answer', { text: 'Sushi' });
    expect(s.pub().phase).toBe('vote');
    const opts = s.pub().options;
    expect(opts).toHaveLength(3); // zusammengefasst
    expect(JSON.stringify(s.pub())).not.toContain('authors');
    const optOf = (text: string) => opts.find((o) => o.parts[0]!.toLowerCase().startsWith(text))!.id;
    // p2 darf nicht für die eigene (= echte) Antwort stimmen
    s.engine.handleAction('p2', 'vote', { optionId: optOf('pfann') });
    expect(s.pub().voted).not.toContain('p2');
    s.engine.handleAction('p0', 'vote', { optionId: optOf('pizza') }); // Person, die dran ist, stimmt nicht ab
    expect(s.pub().voted).not.toContain('p0');
    s.engine.handleAction('p1', 'vote', { optionId: optOf('pfann') }); // richtig
    s.engine.handleAction('p2', 'vote', { optionId: optOf('sushi') }); // fällt auf p3 rein
    s.engine.handleAction('p3', 'vote', { optionId: optOf('pizza') }); // fällt auf p1 rein
    const r = s.pub().reveal!;
    expect(s.pub().phase).toBe('reveal');
    expect(r.options[0]!.real).toBe(true);
    expect(r.options[0]!.authors).toEqual(['p0', 'p2']);
    expect(r.gained).toEqual({ p2: 2, p1: 2, p0: 1, p3: 1 });
  });

  it('mehrere Lücken: eine eigene Antwort je Lücke', () => {
    const s = setup(3);
    s.engine.start();
    (s.engine as any).statement = 'Früher hatte ich Angst vor ___, heute liebe ich ___.';
    s.engine.handleAction('p0', 'answer', { text: 'Hunden' }); // zu wenige Antworten
    expect(s.pub().submitted).not.toContain('p0');
    s.engine.handleAction('p0', 'answer', { parts: ['Hunden', ''] });
    expect(s.pub().submitted).not.toContain('p0');
    s.engine.handleAction('p0', 'answer', { parts: ['Hunden', 'Katzen'] });
    s.engine.handleAction('p1', 'answer', { parts: ['hunden', 'Spinnen'] }); // nur gleich, wenn beide Teile gleich sind
    s.engine.handleAction('p2', 'answer', { parts: ['Hunden!', 'katzen'] });
    expect(s.pub().phase).toBe('vote');
    expect(s.pub().options).toHaveLength(2);
    expect(s.engine.getPrivateState('p0').myAnswer).toEqual(['Hunden', 'Katzen']);
  });

  it('jede Person ist einmal dran, dann Spielende', () => {
    const s = setup(3);
    s.engine.start();
    const heroes: string[] = [];
    for (let i = 0; i < 3; i++) {
      heroes.push(s.pub().heroId);
      for (const p of s.players) s.engine.handleAction(p.id, 'answer', { text: `Antwort ${p.id}` });
      s.advance(80_000);
    }
    expect(heroes).toEqual(['p0', 'p1', 'p2']);
    expect(s.ended()).not.toBeNull();
  });

  it('ohne echte Antwort wird der Satz übersprungen', () => {
    const s = setup(3, { rounds: 2 });
    s.engine.start();
    s.engine.handleAction('p1', 'answer', { text: 'X' });
    s.advance(DEFAULT_ECHT_SETTINGS.writeSeconds * 1000 + 10);
    expect(s.pub().phase).toBe('reveal');
    expect(s.pub().reveal!.skipped).toBe(true);
    s.advance(6000);
    expect(s.pub().heroId).toBe('p1');
  });

  it('Person, die dran ist, verlässt das Spiel → nächste Person', () => {
    const s = setup(4);
    s.engine.start();
    s.engine.onPlayerLeft!(s.players[0]!);
    expect(s.pub().phase).toBe('write');
    expect(s.pub().heroId).toBe('p1');
  });

  it('Einstellungen & Startprüfung', () => {
    expect(parseEchtSettings({}).sets).toContain('klassisch');
    expect(() => parseEchtSettings({ sets: ['gibtsnicht'] })).toThrow();
    const three = [0, 1, 2].map((i) => ({ id: `p${i}`, name: 'x', avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
    expect(echtServerModule.canStart!(three, { ...DEFAULT_ECHT_SETTINGS, sets: [] }, { statements: { get: () => undefined } } as any)).toMatch(/Sammlung/);
    const two = [0, 1].map((i) => ({ id: `p${i}`, name: 'x', avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
    expect(echtServerModule.canStart!(two, DEFAULT_ECHT_SETTINGS, {} as any)).toMatch(/3 Spieler/);
  });
});

describe('Echt jetzt? – eigene Sätze', () => {
  let server: Awaited<ReturnType<typeof import('../src/server/index').startServer>>;
  let base = '';
  beforeAll(async () => {
    const mod = await import('../src/server/index');
    server = await mod.startServer({ port: 0, dataDir: null, databaseUrl: null, publicMode: true });
    base = `http://localhost:${server.port}`;
  });
  afterAll(async () => server?.close());

  const A = 'a'.repeat(24);
  const B = 'b'.repeat(24);
  const api = (owner: string, path: string, init?: RequestInit) =>
    fetch(`${base}/api/statements${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'X-Luma-Owner': owner } });

  it('Platzhalter werden erkannt – auch mehrfach und mitten im Wort', () => {
    expect(normalizeStatement('Mein LieblingsBLUBB ist der BLUBB.')).toBe('Mein Lieblings___ ist der ___.');
    expect(normalizeStatement('Ohne Lücke geht es nicht.')).toBeNull();
  });

  it('Sammlungen sind privat und landen im Spiel', async () => {
    const created = await (
      await api(A, '/', { method: 'POST', body: JSON.stringify({ name: 'Unsere', statements: ['Mein LieblingsBLUBB ist der BLUBB.', 'kein Platzhalter', '', 'Ich esse gern BLUBB.'] }) })
    ).json();
    expect(created.list.statements).toEqual(['Mein Lieblings___ ist der ___.', 'Ich esse gern ___.']);
    expect(created.invalid).toBe(1);
    expect((await (await api(B, '/')).json()).lists).toHaveLength(0);
    expect((await api(B, `/${created.list.id}`)).status).toBe(404);
    expect((await api(B, `/${created.list.id}`, { method: 'DELETE' })).status).toBe(400);
    const updated = await (await api(A, `/${created.list.id}`, { method: 'PUT', body: JSON.stringify({ name: 'Neu', statements: ['Nur BLUBB.'] }) })).json();
    expect(updated.list.name).toBe('Neu');
    // Spiel nutzt eigene Sätze (auch ohne eingebaute Sammlungen)
    const services = { statements: { get: (id: string) => (id === created.list.id ? updated.list : undefined) } } as any;
    expect(statementPool({ ...DEFAULT_ECHT_SETTINGS, sets: [], customListIds: [created.list.id] }, services)).toEqual(['Nur ___.']);
  });
});
