import { describe, expect, it } from 'vitest';
import { PloppEngine } from '../src/games/plopp/game-engine';
import { DEFAULT_PLOPP_SETTINGS, FUSE_RANGES, TIMING } from '../src/games/plopp/game-config';
import { allPrompts, getPrompt, matchAnswer, normalizeAnswer, PROMPT_SOURCES } from '../src/games/plopp/logic/answers';
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n = 3, overrides = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  let ended: any = null;
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'plopp',
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
  const engine = new PloppEngine(ctx, { ...DEFAULT_PLOPP_SETTINGS, packs: ['natur'], letters: false, ...overrides });
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
  /** eine noch nicht genannte, gültige Antwort zur aktuellen Aufgabe */
  const freshAnswer = () => {
    const p = allPrompts().find((x) => x.text === pub().prompt.text)!;
    const used = new Set(pub().used.map((u) => u.text));
    return p.answers.find((a) => !used.has(a.display) && (!p.letter || a.keys[0]!.startsWith(p.letter)))!.display;
  };
  return { engine, advance, players, pub, ended: () => ended, freshAnswer };
}

describe('Plopp! – Antworten & Autokorrektur', () => {
  it('hat viele Aufgaben mit vielen Antworten', () => {
    expect(PROMPT_SOURCES.length).toBeGreaterThanOrEqual(60);
    expect(allPrompts().length).toBeGreaterThanOrEqual(100);
    for (const s of PROMPT_SOURCES) expect(getPrompt(s.id)!.answers.length, s.id).toBeGreaterThanOrEqual(50);
    expect(new Set(PROMPT_SOURCES.map((s) => s.id)).size).toBe(PROMPT_SOURCES.length);
  });

  it('korrigiert Tippfehler, Mehrzahl, Artikel und Umlaute', () => {
    const tier = getPrompt('tier')!;
    const ok = (input: string, display: string) => {
      const r = matchAnswer(tier, input);
      expect(r.kind, input).toBe('ok');
      if (r.kind === 'ok') expect(r.answer.display).toBe(display);
    };
    ok('Tigger', 'Tiger');
    ok('tiger', 'Tiger');
    ok('der Elefannt', 'Elefant');
    ok('Katzen', 'Katze');
    ok('Eisbaer', 'Eisbär');
    ok('Polarbär', 'Eisbär');
    ok('Hnud', 'Hund');
    ok('Kuhh', 'Kuh');
    expect(matchAnswer(tier, 'Tigger').kind === 'ok' && (matchAnswer(tier, 'Tigger') as any).corrected).toBe(true);
    expect(matchAnswer(tier, 'Auto').kind).toBe('unknown');
    expect(matchAnswer(tier, 'Kühlschrank').kind).toBe('unknown');
    expect(normalizeAnswer('  Die  Schwiiz! ')).toBe('schwiiz');
  });

  it('prüft den Anfangsbuchstaben', () => {
    const p = allPrompts().find((x) => x.id === 'tier-b')!;
    expect(matchAnswer(p, 'Bär').kind).toBe('ok');
    expect(matchAnswer(p, 'Tiger').kind).toBe('letter');
  });
});

describe('Plopp! – Ablauf', () => {
  it('gültige Antwort gibt den Fisch weiter, doppelte nicht', () => {
    const s = setup(3);
    s.engine.start();
    expect(s.pub().phase).toBe('intro');
    s.advance(TIMING.introMs);
    expect(s.pub().phase).toBe('play');
    const h = s.pub().holderId!;
    const answer = s.freshAnswer();
    s.engine.handleAction(h, 'answer', { text: answer });
    const h2 = s.pub().holderId!;
    expect(h2).not.toBe(h);
    expect(s.pub().used).toHaveLength(1);
    // gleiche Antwort nochmal: Fisch bleibt
    s.engine.handleAction(h2, 'answer', { text: answer });
    expect(s.pub().holderId).toBe(h2);
    expect(s.engine.getPrivateState(h2).feedback?.kind).toBe('dupe');
    // wer den Fisch nicht hat, kann nichts abschicken
    s.engine.handleAction(h, 'answer', { text: s.freshAnswer() });
    expect(s.pub().used).toHaveLength(1);
  });

  it('Zündschnur: wer den Fisch hält, verliert ein Leben; letzte Person gewinnt', () => {
    const s = setup(2, { lives: 1 });
    s.engine.start();
    s.advance(TIMING.introMs);
    const loser = s.pub().holderId!;
    s.advance(FUSE_RANGES.mittel.max * 1000 + 10);
    expect(s.pub().phase).toBe('pop');
    expect(s.pub().pop).toMatchObject({ playerId: loser, eliminated: true });
    s.advance(TIMING.popMs);
    const ended = s.ended();
    expect(ended).toBeTruthy();
    const winner = loser === 'p0' ? 'p1' : 'p0';
    expect(ended.scores[winner]).toBeGreaterThan(ended.scores[loser]);
  });

  it('unbekannte Antwort: Abstimmung pausiert die Zündschnur; Ja lässt sie gelten', () => {
    const s = setup(3);
    s.engine.start();
    s.advance(TIMING.introMs);
    const h = s.pub().holderId!;
    s.engine.handleAction(h, 'answer', { text: 'Gummibärchenmonster' });
    expect(s.pub().phase).toBe('vote');
    // lange Abstimmung darf den Fisch nicht platzen lassen
    s.advance(TIMING.voteMs - 100);
    expect(s.pub().phase).toBe('vote');
    for (const id of s.pub().vote!.eligible) s.engine.handleAction(id, 'vote', { yes: true });
    expect(s.pub().phase).toBe('play');
    expect(s.pub().holderId).not.toBe(h);
    expect(s.pub().used.at(-1)).toMatchObject({ text: 'Gummibärchenmonster', voted: true });
  });

  it('abgelehnte Antwort: Fisch bleibt, zweite unbekannte Antwort wird direkt abgelehnt', () => {
    const s = setup(3);
    s.engine.start();
    s.advance(TIMING.introMs);
    const h = s.pub().holderId!;
    s.engine.handleAction(h, 'answer', { text: 'Quatschwort' });
    for (const id of s.pub().vote!.eligible) s.engine.handleAction(id, 'vote', { yes: false });
    expect(s.pub().holderId).toBe(h);
    expect(s.engine.getPrivateState(h).feedback?.kind).toBe('rejected');
    s.engine.handleAction(h, 'answer', { text: 'Nochsoeinquatsch' });
    expect(s.pub().phase).toBe('play');
    expect(s.engine.getPrivateState(h).feedback?.kind).toBe('unknown');
  });

  it('Person mit Fisch geht offline: Fisch wandert weiter', () => {
    const s = setup(3);
    s.engine.start();
    s.advance(TIMING.introMs);
    const h = s.pub().holderId!;
    s.players.find((p) => p.id === h)!.isConnected = false;
    s.engine.onPlayerDisconnected();
    expect(s.pub().holderId).not.toBe(h);
    expect(s.pub().phase).toBe('play');
  });
});
