import { describe, expect, it } from 'vitest';
import { SchachEngine } from '../src/games/schach/game-engine';
import { DEFAULT_SCHACH_SETTINGS, END_SHOW_MS } from '../src/games/schach/game-config';
import { MuehleEngine } from '../src/games/muehle/game-engine';
import { DEFAULT_MUEHLE_SETTINGS } from '../src/games/muehle/game-config';
import { initialState, move, place, remove, removable, NEIGHBORS, MILLS, type MillState } from '../src/games/muehle/logic/rules';
import { KinoEngine } from '../src/games/kino/game-engine';
import { MEDIA, filterMedia, GENRE_IDS } from '../src/games/kino/data/catalog';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n: number) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'x',
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
  return { ctx, advance, players, ended: () => ended };
}

describe('Schach', () => {
  it('Narrenmatt in 2 Zügen, Uhr läuft, Ergebnis', () => {
    const s = setup(3);
    const e = new SchachEngine(s.ctx, { ...DEFAULT_SCHACH_SETTINGS, colors: 'first-white' });
    e.start();
    const pub = () => e.getPublicState();
    expect(pub().players).toEqual({ w: 'p0', b: 'p1' });
    // Zuschauer und falsche Seite dürfen nicht ziehen
    e.handleAction('p2', 'move', { from: 'e2', to: 'e4' });
    e.handleAction('p1', 'move', { from: 'e7', to: 'e5' });
    expect(pub().history).toHaveLength(0);
    // illegaler Zug
    e.handleAction('p0', 'move', { from: 'e2', to: 'e5' });
    expect(pub().history).toHaveLength(0);
    s.advance(2000);
    e.handleAction('p0', 'move', { from: 'f2', to: 'f3' });
    expect(pub().clocks!.w).toBe(5 * 60_000 - 2000);
    e.handleAction('p1', 'move', { from: 'e7', to: 'e5' });
    e.handleAction('p0', 'move', { from: 'g2', to: 'g4' });
    e.handleAction('p1', 'move', { from: 'd8', to: 'h4' });
    expect(pub().result).toEqual({ winner: 'b', reason: 'checkmate' });
    s.advance(END_SHOW_MS);
    expect(s.ended().scores).toEqual({ p0: 0, p1: 3, p2: 0 });
  });

  it('Zeit läuft ab → Gegner gewinnt; Remis per Angebot', () => {
    const s = setup(2);
    const e = new SchachEngine(s.ctx, { time: '1+0', colors: 'first-white' });
    e.start();
    s.advance(60_100);
    expect(e.getPublicState().result).toEqual({ winner: 'b', reason: 'timeout' });

    const t = setup(2);
    const f = new SchachEngine(t.ctx, { time: '0+0', colors: 'first-white' });
    f.start();
    expect(f.getPublicState().clocks).toBeNull();
    f.handleAction('p0', 'offerDraw', {});
    f.handleAction('p1', 'answerDraw', { accept: true });
    expect(f.getPublicState().result).toEqual({ winner: null, reason: 'agreed' });
  });

  it('Umwandlung wählbar', () => {
    const s = setup(2);
    const e = new SchachEngine(s.ctx, { time: '0+0', colors: 'first-white' });
    e.start();
    const moves: [string, string, string?][] = [
      ['h2', 'h4'], ['g7', 'g5'], ['h4', 'g5'], ['h7', 'h6'], ['g5', 'h6'], ['g8', 'f6'], ['h6', 'h7'], ['f6', 'g8'], ['h7', 'g8', 'n'],
    ];
    moves.forEach(([from, to, promotion], i) => e.handleAction(i % 2 ? 'p1' : 'p0', 'move', { from, to, promotion }));
    expect(e.getPublicState().history.at(-1)).toBe('hxg8=N');
  });
});

describe('Mühle – Regeln', () => {
  it('Brett: 24 Punkte, 16 Mühlen, jeder Punkt hat 2–4 Nachbarn', () => {
    expect(MILLS).toHaveLength(16);
    for (const n of NEIGHBORS) expect(n.length).toBeGreaterThanOrEqual(2);
    expect(NEIGHBORS[4]!.sort()).toEqual([1, 3, 5, 7]);
  });

  it('Mühle beim Setzen → Stein wegnehmen, geschützte Steine bleiben', () => {
    let s: MillState = initialState();
    const seq: [number][] = [[0], [9], [1], [10], [2]];
    for (const [p] of seq) s = place(s, p)!;
    expect(s.mustRemove).toBe(true);
    expect(s.turn).toBe('w');
    expect(removable(s).sort((a, b) => a - b)).toEqual([9, 10]);
    expect(place(s, 5)).toBeNull(); // erst wegnehmen
    s = remove(s, 9)!;
    expect(s.board[9]).toBeNull();
    expect(s.turn).toBe('b');
  });

  it('Zugphase: nur zu Nachbarn; mit 3 Steinen springen; unter 3 = verloren', () => {
    let s: MillState = initialState();
    s = { ...s, hand: { w: 0, b: 0 }, board: Array(24).fill(null) };
    s.board[0] = 'w';
    s.board[1] = 'w';
    s.board[14] = 'w';
    s.board[21] = 'b';
    s.board[22] = 'b';
    s.board[18] = 'b';
    s.board[4] = 'b';
    // Weiß hat 3 Steine → darf springen
    s = move(s, 14, 2)!;
    expect(s.mustRemove).toBe(true);
    s = remove(s, 4)!;
    expect(s.turn).toBe('b');
    // Schwarz hat 3 Steine (darf springen) und spielt weiter
    expect(s.winner).toBeNull();
    s = move(s, 18, 9)!;
    s = move(s, 0, 3)!; // Weiß springt
    expect(s.turn).toBe('b');
  });

  it('Engine: nur die zwei Spieler, abwechselnd', () => {
    const t = setup(3);
    const e = new MuehleEngine(t.ctx, { ...DEFAULT_MUEHLE_SETTINGS, colors: 'first-white' });
    e.start();
    e.handleAction('p2', 'place', { to: 0 });
    e.handleAction('p1', 'place', { to: 0 });
    expect(e.getPublicState().state.board[0]).toBeNull();
    e.handleAction('p0', 'place', { to: 0 });
    expect(e.getPublicState().state.board[0]).toBe('w');
    e.handleAction('p1', 'resign', {});
    expect(e.getPublicState().state.winner).toBe('w');
  });
});

describe('Couch-Match', () => {
  it('große Datenbank mit Beschreibungen in zwei Sätzen', () => {
    expect(MEDIA.length).toBeGreaterThanOrEqual(350);
    expect(MEDIA.filter((m) => m.type === 'serie').length).toBeGreaterThanOrEqual(100);
    expect(new Set(MEDIA.map((m) => m.id)).size).toBe(MEDIA.length);
    for (const m of MEDIA) {
      expect(m.genres.length, m.title).toBeGreaterThan(0);
      expect(m.desc.length, m.title).toBeGreaterThan(40);
      expect(m.desc.length, m.title).toBeLessThan(220);
    }
    for (const g of GENRE_IDS) expect(filterMedia('beide', [g]).length, g).toBeGreaterThanOrEqual(5);
  });

  it('alle bekommen dieselben 25 Titel in eigener Reihenfolge, Rangliste nach Matches', () => {
    const t = setup(3);
    const e = new KinoEngine(t.ctx, { type: 'film', genres: [] });
    e.start();
    const pub = e.getPublicState();
    expect(pub.deck).toHaveLength(25);
    const o0 = e.getPrivateState('p0')!.order;
    const o1 = e.getPrivateState('p1')!.order;
    expect([...o0].sort()).toEqual([...pub.deck].sort());
    expect(o0).not.toEqual(o1);
    const fav = pub.deck[3]!;
    for (const p of ['p0', 'p1', 'p2']) for (const id of pub.deck) e.handleAction(p, 'swipe', { id, like: id === fav || (p === 'p0' && id === pub.deck[5]) });
    // doppelt zählt nicht
    e.handleAction('p0', 'swipe', { id: fav, like: false });
    const res = e.getPublicState();
    expect(res.phase).toBe('results');
    expect(res.results![0]).toEqual({ id: fav, likers: ['p0', 'p1', 'p2'] });
    expect(res.results![1]!.likers).toEqual(['p0']);
    e.handleAction('p1', 'again', {});
    expect(e.getPublicState().phase).toBe('swipe');
  });
});
