import { describe, expect, it } from 'vitest';
import { WortEngine } from '../src/games/wort/game-engine';
import { DEFAULT_WORT_SETTINGS } from '../src/games/wort/game-config';
import { answers, isAllowed, normalizeWord, scoreGuess } from '../src/games/wort/logic/words';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n = 2, overrides = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'wort',
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
  const engine = new WortEngine(ctx, { ...DEFAULT_WORT_SETTINGS, ...overrides });
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
  return { engine, advance, pub: () => engine.getPublicState(), ended: () => ended };
}

describe('Wortknacker', () => {
  it('Wortlisten: genug Lösungen, alle 5 Buchstaben und als Versuch erlaubt', () => {
    expect(answers().length).toBeGreaterThanOrEqual(400);
    expect(new Set(answers()).size).toBe(answers().length);
    for (const w of answers()) {
      expect(w, w).toMatch(/^[A-ZÄÖÜ]{5}$/);
      expect(isAllowed(w), w).toBe(true);
    }
    expect(isAllowed('KATZE')).toBe(true);
    expect(isAllowed('HAUSE')).toBe(true);
    expect(isAllowed('QXZVB')).toBe(false);
    expect(normalizeWord('äpfel')).toBe('ÄPFEL');
  });

  it('Farben mit doppelten Buchstaben', () => {
    expect(scoreGuess('KATZE', 'KATZE')).toEqual(['g', 'g', 'g', 'g', 'g']);
    expect(scoreGuess('TASSE', 'STAAT')).toEqual(['y', 'y', 'y', 'x', 'x']);
    // drei E geraten, zwei im Wort → ein E grün, ein E gelb, das dritte grau
    expect(scoreGuess('EBENE', 'KERZE')).toEqual(['y', 'x', 'x', 'x', 'g']);
    expect(scoreGuess('LEBEN', 'KERZE')).toEqual(['x', 'g', 'x', 'y', 'x']);
  });

  it('Ablauf: lösen gibt Punkte, unbekannte Wörter zählen nicht, Runde endet wenn alle fertig', () => {
    const s = setup(2, { rounds: 1 });
    s.engine.start();
    const word = s.engine.secret;
    s.engine.handleAction('p0', 'guess', { word: 'QXZVB' });
    expect(s.engine.getPrivateState('p0').guesses).toHaveLength(0);
    expect(s.engine.getPrivateState('p0').error?.message).toBe('Kein bekanntes Wort');
    s.engine.handleAction('p0', 'guess', { word: word === 'KATZE' ? 'HAUSE' : 'KATZE' });
    s.engine.handleAction('p0', 'guess', { word });
    expect(s.pub().boards.p0).toMatchObject({ solved: true, place: 1 });
    // TV sieht keine Buchstaben
    expect(JSON.stringify(s.pub().boards)).not.toContain(word);
    for (let i = 0; i < 6; i++) s.engine.handleAction('p1', 'guess', { word: word === 'KATZE' ? 'HAUSE' : 'KATZE' });
    expect(s.pub().phase).toBe('reveal');
    expect(s.pub().reveal?.word).toBe(word);
    expect(s.pub().reveal?.gained.p0).toBe(5 + 2);
    s.advance(20_000);
    expect(s.ended().scores.p0).toBe(7);
    expect(s.ended().scores.p1).toBe(0);
  });

  it('Zeit läuft ab: Auflösung und nächstes Wort', () => {
    const s = setup(2, { rounds: 2, seconds: 60 });
    s.engine.start();
    const first = s.engine.secret;
    s.advance(60_000);
    expect(s.pub().phase).toBe('reveal');
    s.advance(10_000);
    expect(s.pub().phase).toBe('play');
    expect(s.pub().round).toBe(2);
    expect(s.engine.secret).not.toBe(first);
  });
});
