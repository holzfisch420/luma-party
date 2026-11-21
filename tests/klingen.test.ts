import { describe, expect, it } from 'vitest';
import { KlingenEngine } from '../src/games/klingen/game-engine';
import { DEFAULT_KLINGEN_SETTINGS, TIMING } from '../src/games/klingen/game-config';
import { angleAt, angleDist, BOSS_EVERY, bossOrder, collides, localImpact, makeStage, MIN_GAP } from '../src/games/klingen/logic/wheel';
import { BOSS_IDS, BOSSES } from '../src/games/klingen/logic/bosses';
import { stepFor, WheelSim } from '../src/games/klingen/logic/sim';
import { KNIFE_SKINS } from '../src/games/klingen/logic/knives';
import { knifeHalfWidth } from '../src/games/klingen/components/knife-skins';
import { KNIFE_LEN } from '../src/games/klingen/components/draw';

/** Bot: wirft, sobald die Vorschau ein Steckenbleiben mit Sicherheitsabstand zeigt */
function botPlays(seed: number, n: number): { left: number; time: number } {
  const st = makeStage(seed, n);
  const sim = new WheelSim(st);
  let left = st.knives;
  const limit = st.boss ? (BOSSES[st.boss].timeLimit ?? 60) : 60;
  while (left > 0 && sim.t < limit) {
    const probe = sim.clone();
    const ok = probe.predict() === 'stick';
    // Sicherheitsabstand zu anderen Messern
    const future = sim.clone();
    stepFor(future, 0.13);
    const local = future.impactLocal();
    const safe = ok && !future.knives.some((k) => angleDist(k.a, local) < MIN_GAP * 1.35);
    if (safe) {
      stepFor(sim, 0.065);
      const mid = sim.clone();
      stepFor(sim, 0.065);
      if (sim.outcome(mid) !== 'stick') return { left, time: sim.t };
      sim.stick(0);
      left--;
      stepFor(sim, 0.05);
    } else stepFor(sim, 1 / 120);
  }
  return { left, time: sim.t };
}
import type { GameContext, GamePlayer } from '../src/server/game-engine/types';

function setup(n = 3, overrides = {}) {
  let now = 1_000_000;
  const timers: { at: number; fn: () => void; dead: boolean }[] = [];
  let ended: any = null;
  const events: { name: string; payload: any }[] = [];
  const players: GamePlayer[] = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, avatarColor: '#fff', isConnected: true, joinedAt: i, avatar: null }));
  const ctx: GameContext = {
    roomCode: 'TEST',
    gameId: 'klingen',
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
  const engine = new KlingenEngine(ctx, { ...DEFAULT_KLINGEN_SETTINGS, ...overrides });
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
  return { engine, advance, events, pub: () => engine.getPublicState(), ended: () => ended };
}

describe('Klingenrad – Rad', () => {
  it('Treffer und Abstand', () => {
    expect(collides(1, [1.1])).toBe(true);
    expect(collides(1, [1 + MIN_GAP + 0.01])).toBe(false);
    expect(angleDist(0.05, Math.PI * 2 - 0.05)).toBeCloseTo(0.1);
    expect(localImpact(0)).toBeCloseTo(Math.PI / 2);
  });

  it('Stufen sind für alle gleich und schaffbar (Bot schafft 1–30)', () => {
    expect(makeStage(42, 7)).toEqual(makeStage(42, 7));
    for (const seed of [1, 2, 3]) {
      for (let n = 1; n <= 30; n++) {
        const st = makeStage(seed, n);
        const stuck = [...st.obstacles];
        let t = 0;
        let left = st.knives;
        // Bot wirft, sobald unten genug Platz ist (mit Flugzeit gerechnet)
        while (left > 0 && t < 60) {
          const at = t + TIMING.flightMs / 1000;
          const local = localImpact(angleAt(st.spin, at));
          if (!stuck.some((k) => angleDist(k, local) < MIN_GAP * 1.3)) {
            stuck.push(local);
            left--;
            t = at + 0.05;
          } else t += 0.004;
        }
        expect(left, `Seed ${seed} Stufe ${n}`).toBe(0);
      }
    }
  });
});

describe('Klingenrad – Bosse', () => {
  it('15 verschiedene Bosse, jede dritte Stufe, alle kommen in einem Durchlauf vor', () => {
    expect(BOSS_IDS).toHaveLength(15);
    const order = bossOrder(7);
    expect(new Set(order).size).toBe(15);
    expect(order.at(-1)).toBe('drache');
    const seen = new Set<string>();
    for (let n = 1; n <= 45; n++) {
      const st = makeStage(7, n);
      expect(!!st.boss, `Stufe ${n}`).toBe(n % BOSS_EVERY === 0);
      if (st.boss) seen.add(st.boss);
    }
    expect(seen.size).toBe(15);
  });

  it('jeder Boss ist schaffbar (auch im zweiten Durchlauf)', () => {
    for (const seed of [3, 11]) {
      for (const n of [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 63, 90]) {
        const r = botPlays(seed, n);
        expect(r.left, `Seed ${seed} Stufe ${n} (${makeStage(seed, n).boss})`).toBe(0);
      }
    }
  });
});

describe('Klingenrad – Einzeln', () => {
  it('zählt geschaffte Stufen, Leben und endet nach Ablauf der Zeit', () => {
    const s = setup(2, { mode: 'solo', lives: 1, minutes: 2 });
    s.engine.start();
    // zuerst Messer aussuchen
    expect(s.pub().phase).toBe('pick');
    s.engine.handleAction('p0', 'knife', { skin: 7 });
    s.engine.handleAction('p0', 'knife', { skin: 99 }); // ungültig
    expect(s.pub().knives.p0).toBe(7);
    s.advance(TIMING.pickMs);
    expect(s.pub().phase).toBe('countdown');
    s.advance(TIMING.countdownMs);
    expect(s.pub().phase).toBe('play');
    s.engine.handleAction('p0', 'clear', { stage: 1 });
    s.engine.handleAction('p0', 'clear', { stage: 1 }); // doppelt zählt nicht
    s.engine.handleAction('p0', 'clear', { stage: 2 });
    expect(s.pub().solo.p0).toMatchObject({ stage: 3, cleared: 2 });
    s.engine.handleAction('p1', 'fail', { stage: 1 });
    expect(s.pub().solo.p1.done).toBe(true);
    s.advance(2 * 60_000);
    expect(s.ended().scores).toEqual({ p0: 20, p1: 0 });
  });
});

describe('Klingenrad – Leben und Sterne', () => {
  it('ein Fehlwurf kostet ein Leben, die Stufe läuft aber weiter; Sterne zählen mit', () => {
    const s = setup(1, { mode: 'solo', lives: 3 });
    s.engine.start();
    s.advance(TIMING.pickMs + TIMING.countdownMs);
    s.engine.handleAction('p0', 'progress', { stage: 1, stuck: 3 });
    s.engine.handleAction('p0', 'fail', { stage: 1 });
    expect(s.pub().solo.p0).toMatchObject({ stage: 1, stuck: 3, lives: 2, done: false });
    // Stufe 2 hat Sterne; mehr als vorhanden zählen nicht
    s.engine.handleAction('p0', 'clear', { stage: 1, stars: 5 });
    expect(s.pub().solo.p0.stars).toBe(makeStage(s.pub().seed, 1).stars.length);
  });
});

describe('Klingenrad – Messer & Live-Übertragung', () => {
  it('16 Messer; wenn alle gewählt haben, geht es sofort los', () => {
    expect(KNIFE_SKINS).toHaveLength(16);
    const s = setup(2, { mode: 'solo' });
    s.engine.start();
    expect(s.pub().phase).toBe('pick');
    s.engine.handleAction('p0', 'knife', { skin: 3 });
    expect(s.pub().phase).toBe('pick');
    s.engine.handleAction('p1', 'knife', { skin: 15 });
    expect(s.pub().phase).toBe('countdown');
    expect(s.pub().knives).toEqual({ p0: 3, p1: 15 });
    // nach der Auswahl lässt sich nichts mehr ändern
    s.engine.handleAction('p0', 'knife', { skin: 4 });
    expect(s.pub().knives.p0).toBe(3);
  });

  it('nur Platz 1 wird live an den Fernseher übertragen', () => {
    const s = setup(2, { mode: 'solo' });
    s.engine.start();
    s.advance(TIMING.pickMs + TIMING.countdownMs);
    s.engine.handleAction('p1', 'clear', { stage: 1 });
    expect(s.pub().spotlight).toBe('p1');
    const frame = { stage: 2, t: 1.5, angle: 2, knives: [0.1, 1.2], stars: [], left: 4, lives: 2, mode: 'play', ev: 'stick' };
    s.engine.handleAction('p0', 'live', frame);
    expect(s.events.filter((e) => e.name === 'live')).toHaveLength(0);
    s.engine.handleAction('p1', 'live', frame);
    const live = s.events.filter((e) => e.name === 'live');
    expect(live).toHaveLength(1);
    expect(live[0]!.payload).toMatchObject({ playerId: 'p1', stage: 2, knives: [0.1, 1.2], ev: 'stick' });
  });

  it('Trefferzone ist kleiner als die gezeichneten Messer', () => {
    // halbe Klingenbreite am Radrand im Verhältnis zum Radius → Winkel, ab dem sich Messer sichtbar berühren
    const visualTouch = 2 * knifeHalfWidth(KNIFE_LEN);
    expect(MIN_GAP).toBeLessThan(visualTouch);
  });
});

describe('Klingenrad – gemeinsames Rad', () => {
  it('Würfe gehen an den Fernseher, Ergebnis kommt zurück; wer trifft, ist raus', () => {
    const s = setup(3, { mode: 'shared' });
    s.engine.start();
    s.advance(TIMING.pickMs + TIMING.roundIntroMs);
    expect(s.pub()).toMatchObject({ phase: 'play', round: 1 });
    expect(s.pub().shared.p0.left).toBe(1);
    s.engine.handleAction('p0', 'throw', {});
    s.engine.handleAction('p0', 'throw', {}); // kein Messer mehr
    const throws = s.events.filter((e) => e.name === 'throw');
    expect(throws).toHaveLength(1);
    s.engine.handleHostAction('result', { id: throws[0]!.payload.id, ok: true });
    s.engine.handleAction('p1', 'throw', {});
    s.engine.handleAction('p2', 'throw', {});
    const [t1, t2] = s.events.filter((e) => e.name === 'throw').slice(1);
    s.engine.handleHostAction('result', { id: t1!.payload.id, ok: false });
    s.engine.handleHostAction('result', { id: t2!.payload.id, ok: true });
    expect(s.pub().shared.p1.alive).toBe(false);
    expect(s.pub().phase).toBe('roundEnd');
    s.advance(TIMING.roundEndMs + TIMING.roundIntroMs);
    expect(s.pub()).toMatchObject({ phase: 'play', round: 2 });
    expect(s.pub().shared.p0.left).toBe(2);
    expect(s.pub().shared.p1.left).toBe(0);
    // Runde 2: p2 trifft → p0 gewinnt
    s.engine.handleAction('p2', 'throw', {});
    const t3 = s.events.filter((e) => e.name === 'throw').at(-1)!;
    s.engine.handleHostAction('result', { id: t3.payload.id, ok: false });
    for (let i = 0; i < 2; i++) {
      s.advance(TIMING.throwCooldownMs);
      s.engine.handleAction('p0', 'throw', {});
      s.engine.handleHostAction('result', { id: s.events.filter((e) => e.name === 'throw').at(-1)!.payload.id, ok: true });
    }
    s.advance(TIMING.roundEndMs);
    const ended = s.ended();
    expect(ended).toBeTruthy();
    expect(ended.scores.p0).toBeGreaterThan(ended.scores.p2);
    expect(ended.scores.p2).toBeGreaterThan(ended.scores.p1);
  });

  it('antwortet der Fernseher nicht, gilt der Wurf als steckend', () => {
    const s = setup(2, { mode: 'shared' });
    s.engine.start();
    s.advance(TIMING.pickMs + TIMING.roundIntroMs);
    s.engine.handleAction('p0', 'throw', {});
    s.advance(TIMING.resultTimeoutMs);
    expect(s.pub().shared.p0).toMatchObject({ alive: true, stuckTotal: 1 });
  });
});
