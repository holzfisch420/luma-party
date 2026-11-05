import { describe, expect, it } from 'vitest';
import { DEFAULT_WORDS } from '../src/games/montagsmaler/words/default-words';
import { evaluateGuess, buildMask, normalizeGuess } from '../src/games/montagsmaler/logic/word-utils';
import { guesserPoints } from '../src/games/montagsmaler/logic/scoring';
import { DEFAULT_SCORING, parseMontagsmalerSettings } from '../src/games/montagsmaler/game-config';
import { applyDrawOp, sanitizeDrawOp } from '../src/games/montagsmaler/logic/draw-model';
import { buildResults } from '../src/server/rooms/room';

describe('Wörterpool', () => {
  it('enthält mindestens 400 eindeutige Wörter', () => {
    expect(DEFAULT_WORDS.length).toBeGreaterThanOrEqual(400);
    expect(new Set(DEFAULT_WORDS.map((w) => normalizeGuess(w.word))).size).toBe(DEFAULT_WORDS.length);
    expect(new Set(DEFAULT_WORDS.map((w) => w.id)).size).toBe(DEFAULT_WORDS.length);
  });
});

describe('Raten', () => {
  it('erkennt richtige und knappe Antworten', () => {
    expect(evaluateGuess('elefant', 'Elefant')).toBe('correct');
    expect(evaluateGuess('Loewe', 'Löwe')).toBe('correct');
    expect(evaluateGuess('Strasse', 'Straße')).toBe('correct');
    expect(evaluateGuess('cafe', 'Café')).toBe('correct');
    expect(evaluateGuess('Elefnt', 'Elefant')).toBe('close');
    expect(evaluateGuess('Hund', 'Elefant')).toBe('wrong');
    expect(evaluateGuess('', 'Elefant')).toBe('wrong');
  });
  it('erzeugt Masken ohne das Wort preiszugeben', () => {
    expect(buildMask('U-Boot', new Set())).toEqual([null, '-', null, null, null, null]);
    expect(buildMask('Eis', new Set([1]))).toEqual([null, 'i', null]);
  });
});

describe('Punkte', () => {
  it('verteilt absteigend mit Mindestwert und Zeitbonus', () => {
    expect(guesserPoints(DEFAULT_SCORING, 0, 1)).toBe(150);
    expect(guesserPoints(DEFAULT_SCORING, 1, 0)).toBe(85);
    expect(guesserPoints(DEFAULT_SCORING, 10, 0)).toBe(40);
  });
  it('validiert Einstellungen', () => {
    expect(parseMontagsmalerSettings({}).rounds).toBe(3);
    expect(() => parseMontagsmalerSettings({ rounds: 99 })).toThrow();
    expect(() => parseMontagsmalerSettings({ categories: [] })).toThrow();
  });
  it('Rangliste mit geteilten Plätzen', () => {
    const players = ['a', 'b', 'c'].map((id, i) => ({ id, name: id, avatarColor: '#fff', isConnected: true, joinedAt: i }));
    const r = buildResults('x', players, { scores: { a: 10, b: 30, c: 30 } });
    expect(r.entries.map((e) => e.rank)).toEqual([1, 1, 3]);
    expect(r.winnerIds.sort()).toEqual(['b', 'c']);
  });
});

describe('Zeichenmodell', () => {
  it('validiert und wendet Operationen an', () => {
    expect(sanitizeDrawOp({ k: 's', id: 1, c: 0, w: 9, x: 2000, y: 0 })).toBeNull();
    expect(sanitizeDrawOp({ k: 'p', id: 1, pts: [1, 2, 3] })).toBeNull();
    const strokes: any[] = [];
    expect(applyDrawOp(strokes, { k: 's', id: 1, c: 0, w: 9, x: 1, y: 1 })).toBe(true);
    expect(applyDrawOp(strokes, { k: 'p', id: 2, pts: [1, 1] })).toBe(false);
    expect(applyDrawOp(strokes, { k: 'p', id: 1, pts: [5, 5] })).toBe(true);
    expect(applyDrawOp(strokes, { k: 's', id: 1, c: 0, w: 9, x: 1, y: 1 })).toBe(false);
    applyDrawOp(strokes, { k: 'u' });
    expect(strokes).toHaveLength(0);
  });
});
