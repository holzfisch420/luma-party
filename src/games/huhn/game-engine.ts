/**
 * Hühnerjagd – Server-Engine.
 *
 * - jedes Huhn rennt auf seiner eigenen Spur, alle Spuren bekommen dieselbe Hindernisfolge
 *   (fair), nur zeitlich etwas versetzt
 * - Handys schicken nur „Knopf gedrückt / losgelassen“, alles andere entscheidet der Server
 * - 60 Hz Simulation, 20 Hz Positions-Frames an den Fernseher
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { DEFAULT_HUHN_SETTINGS, huhnMeta, MAX_CHICKENS, parseHuhnSettings, PHYS, TIMING, type HuhnSettings } from './game-config';
import { getMap, MAPS, OBSTACLE_KINDS, OBSTACLES, type HuhnMap, type ObstacleKind } from './maps';
import { HUHN_EVENTS, type HuhnFrame, type HuhnFx, type HuhnPhase, type HuhnPrivateState, type HuhnPublicState, type HuhnRoundEvent } from './types';

const STEP = 1 / PHYS.tickHz;

interface Chicken {
  playerId: PlayerId;
  slot: number;
  score: number;
  best: number;
  inRound: boolean;
  alive: boolean;
  place: number;
  y: number;
  vy: number;
  down: boolean;
  holdLeft: number;
  /** Zeitpunkt (Sim-Sekunden) des letzten Drückens – für den Sprung-Puffer */
  pressedAt: number;
}

interface Obstacle {
  id: number;
  slot: number;
  kind: ObstacleKind;
  x: number;
}

interface Lane {
  slot: number;
  /** Index in der gemeinsamen Hindernisfolge */
  next: number;
  /** Ankunftszeit (Sim-Sekunden) des zuletzt erzeugten Hindernisses */
  lastArrival: number;
  obstacles: Obstacle[];
}

/** kleiner deterministischer Zufallsgenerator */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** gemeinsame Hindernisfolge einer Runde */
class Course {
  private items: { kind: ObstacleKind; gap: number }[] = [];
  private rng: () => number;
  constructor(
    private readonly map: HuhnMap,
    seed: number,
  ) {
    this.rng = mulberry32(seed);
  }
  get(i: number) {
    while (this.items.length <= i) this.items.push(this.roll(this.items[this.items.length - 1]?.kind));
    return this.items[i]!;
  }
  private roll(prev?: ObstacleKind) {
    const entries = Object.entries(this.map.weights) as [ObstacleKind, number][];
    const total = entries.reduce((n, [, w]) => n + w, 0);
    let r = this.rng() * total;
    let kind = entries[0]![0];
    for (const [k, w] of entries) {
      r -= w;
      if (r <= 0) {
        kind = k;
        break;
      }
    }
    const [min, max] = this.map.gap;
    let gap = min + this.rng() * (max - min);
    // nach einem Helikopter oder vor langen Autos etwas mehr Luft
    if (prev === 'heli' || kind === 'heli') gap = Math.max(gap, min + 0.25);
    if (kind === 'car') gap += 0.15;
    return { kind, gap };
  }
}

export class HuhnEngine implements GameEngine<HuhnPublicState, HuhnPrivateState> {
  private chickens = new Map<PlayerId, Chicken>();
  private phase: HuhnPhase = 'countdown';
  private phaseEndsAt: number | null = null;
  private phaseTimer: TimerHandle | null = null;
  private loop: TimerHandle | null = null;
  private round = 0;
  private map: HuhnMap = MAPS[0]!;
  private mapCursor = 0;
  private course: Course | null = null;
  private lanes: Lane[] = [];
  private nextId = 1;
  private simT = 0;
  private dist = 0;
  private speed = 0;
  private caughtCount = 0;
  private participants = 0;
  private roundWinnerId: PlayerId | null = null;
  private endScheduled = false;
  private fx: HuhnFx[] = [];
  private lastTickAt = 0;
  private acc = 0;
  private tickCount = 0;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: HuhnSettings,
  ) {}

  start(): void {
    for (const p of this.ctx.getPlayers()) this.addChicken(p);
    this.startRound();
  }

  dispose(): void {
    this.loop?.cancel();
    this.phaseTimer?.cancel();
  }

  private addChicken(p: GamePlayer): Chicken | null {
    const existing = this.chickens.get(p.id);
    if (existing) return existing;
    const used = new Set([...this.chickens.values()].map((c) => c.slot));
    let slot = -1;
    for (let i = 0; i < MAX_CHICKENS; i++)
      if (!used.has(i)) {
        slot = i;
        break;
      }
    const c: Chicken = { playerId: p.id, slot, score: 0, best: 0, inRound: false, alive: false, place: 0, y: 0, vy: 0, down: false, holdLeft: 0, pressedAt: -1 };
    this.chickens.set(p.id, c);
    return c;
  }

  // ------------------------------------------------------------------ Zustand

  getPublicState(): HuhnPublicState {
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.settings.rounds,
      mapId: this.map.id,
      phaseEndsAt: this.phaseEndsAt,
      players: [...this.chickens.values()]
        .filter((c) => c.slot >= 0)
        .map((c) => ({ playerId: c.playerId, slot: c.slot, score: c.score, inRound: c.inRound, alive: c.alive, place: c.place, best: Math.round(c.best) })),
      roundWinnerId: this.roundWinnerId,
      meters: Math.round(this.dist),
    };
  }

  getPrivateState(playerId: PlayerId): HuhnPrivateState | null {
    const c = this.chickens.get(playerId);
    if (!c) return null;
    return { slot: c.slot, inRound: c.inRound, alive: c.alive, place: c.place };
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished || type !== 'input') return;
    const c = this.chickens.get(playerId);
    if (!c || !c.inRound) return;
    const down = !!(payload && typeof payload === 'object' && (payload as { down?: unknown }).down === true);
    if (down && !c.down) c.pressedAt = this.simT;
    c.down = down;
  }

  onPlayerJoined(p: GamePlayer): void {
    this.addChicken(p);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    const c = this.chickens.get(p.id);
    if (!c) return;
    if (c.alive && this.phase === 'run') this.catchChicken(c, -1);
    this.chickens.delete(p.id);
    this.ctx.publishState();
  }

  onPlayerDisconnected(p: GamePlayer): void {
    const c = this.chickens.get(p.id);
    if (c) c.down = false;
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  // ------------------------------------------------------------------ Ablauf

  private setPhase(phase: HuhnPhase, ms: number | null, onEnd?: () => void) {
    this.phaseTimer?.cancel();
    this.phaseTimer = null;
    this.phase = phase;
    this.phaseEndsAt = ms ? this.ctx.now() + ms : null;
    if (ms && onEnd) this.phaseTimer = this.ctx.setTimer(ms, onEnd);
    this.ctx.publishState();
  }

  private pickMap(): HuhnMap {
    const pool = this.settings.maps.length ? MAPS.filter((m) => (this.settings.maps as string[]).includes(m.id)) : MAPS;
    const list = pool.length ? pool : MAPS;
    if (this.settings.mapMode === 'random') return list[Math.floor(Math.random() * list.length)]!;
    // der Reihe nach – von leicht nach schwer
    const sorted = [...list].sort((a, b) => a.difficulty - b.difficulty);
    return sorted[this.mapCursor++ % sorted.length]!;
  }

  private startRound() {
    this.round++;
    this.map = this.pickMap();
    this.course = new Course(this.map, Math.floor(Math.random() * 2 ** 31));
    this.simT = 0;
    this.dist = 0;
    this.speed = this.map.v0;
    this.caughtCount = 0;
    this.roundWinnerId = null;
    this.endScheduled = false;
    this.fx = [];
    const slots: number[] = [];
    for (const c of this.chickens.values()) {
      const connected = this.ctx.getPlayer(c.playerId)?.isConnected;
      c.inRound = c.slot >= 0 && !!connected;
      c.alive = c.inRound;
      c.place = 0;
      c.y = 0;
      c.vy = 0;
      c.down = false;
      c.holdLeft = 0;
      c.pressedAt = -1;
      if (c.inRound) slots.push(c.slot);
    }
    this.participants = slots.length;
    // gleiche Folge für alle Spuren, nur zeitlich versetzt
    this.lanes = slots.map((slot) => ({ slot, next: 0, lastArrival: PHYS.graceSeconds + Math.random() * 1.4 - this.course!.get(0).gap, obstacles: [] }));
    const ev: HuhnRoundEvent = { round: this.round, mapId: this.map.id, slots };
    this.ctx.emit(HUHN_EVENTS.round, ev, { to: 'all' });
    this.setPhase('countdown', TIMING.countdownMs, () => this.startRun());
    this.emitFrame();
  }

  private startRun() {
    this.setPhase('run', null);
    this.ensureLoop();
  }

  private ensureLoop() {
    if (this.loop) return;
    this.lastTickAt = this.ctx.now();
    const tick = () => {
      if (this.finished) return;
      const now = this.ctx.now();
      this.acc = Math.min(this.acc + (now - this.lastTickAt) / 1000, STEP * 6);
      this.lastTickAt = now;
      while (this.acc >= STEP) {
        this.acc -= STEP;
        this.step();
        this.tickCount++;
        if (this.tickCount % (PHYS.tickHz / PHYS.frameHz) === 0) this.emitFrame();
      }
      this.loop = this.ctx.setTimer(1000 / PHYS.tickHz, tick);
    };
    this.loop = this.ctx.setTimer(1000 / PHYS.tickHz, tick);
  }

  private stopLoop() {
    this.loop?.cancel();
    this.loop = null;
    this.acc = 0;
  }

  /** ein Simulationsschritt */
  step() {
    // nach Rundenende friert die Welt ein
    if (this.phase !== 'run') return;
    const dt = STEP;
    this.simT += dt;
    this.speed = Math.min(this.map.vmax, this.map.v0 + this.map.accel * this.simT);
    this.dist += this.speed * dt;
    const rush = this.simT > PHYS.rushAfter ? 0.75 : 1;

    // Hühner
    for (const c of this.chickens.values()) {
      if (!c.alive) continue;
      const onGround = c.y <= 0 && c.vy <= 0;
      if (onGround && c.pressedAt >= 0 && this.simT - c.pressedAt <= PHYS.jumpBuffer + dt) {
        c.vy = PHYS.jumpV;
        c.holdLeft = PHYS.holdMax;
        c.pressedAt = -1;
        this.fx.push({ t: 'jump', s: c.slot });
      }
      if (c.y > 0 || c.vy > 0) {
        const holding = c.down && c.vy > 0 && c.holdLeft > 0;
        if (holding) c.holdLeft -= dt;
        c.vy -= (holding ? PHYS.holdGravity : PHYS.gravity) * dt;
        c.y += c.vy * dt;
        if (c.y <= 0) {
          c.y = 0;
          c.vy = 0;
        }
      }
    }

    // Hindernisse bewegen, erzeugen, prüfen
    for (const lane of this.lanes) {
      for (const o of lane.obstacles) o.x -= (this.speed + OBSTACLES[o.kind].extra) * dt;
      lane.obstacles = lane.obstacles.filter((o) => o.x + OBSTACLES[o.kind].w > -6);
      for (;;) {
        const item = this.course!.get(lane.next);
        const arrival = lane.lastArrival + item.gap * rush;
        const x = (arrival - this.simT) * (this.speed + OBSTACLES[item.kind].extra);
        if (x > PHYS.spawnDist) break;
        lane.obstacles.push({ id: this.nextId++, slot: lane.slot, kind: item.kind, x: Math.max(x, 4) });
        lane.lastArrival = arrival;
        lane.next++;
      }
      const c = [...this.chickens.values()].find((ch) => ch.slot === lane.slot && ch.alive);
      if (!c || this.endScheduled) continue; // Sieger ist nach Rundenende unverwundbar
      for (const o of lane.obstacles) {
        const ob = OBSTACLES[o.kind];
        const m = 0.07; // etwas Nachsicht
        const hitX = o.x + m < PHYS.chickenHalfW && o.x + ob.w - m > -PHYS.chickenHalfW;
        const hitY = c.y + m < ob.y0 + ob.h && c.y + PHYS.chickenH - m > ob.y0;
        if (hitX && hitY) {
          this.catchChicken(c, OBSTACLE_KINDS.indexOf(o.kind));
          break;
        }
      }
    }
  }

  private catchChicken(c: Chicken, kindIndex: number) {
    if (!c.alive) return;
    c.alive = false;
    c.down = false;
    c.best = Math.max(c.best, this.dist);
    // Platz: alle, die schon gefangen sind, liegen dahinter
    const remaining = [...this.chickens.values()].filter((o) => o.alive).length;
    c.place = remaining + 1;
    const points = this.participants > 1 ? this.caughtCount : Math.floor(this.dist / 25);
    c.score += points;
    this.caughtCount++;
    if (kindIndex >= 0) this.fx.push({ t: 'caught', s: c.slot, k: kindIndex });
    this.ctx.publishState();
    this.checkRoundOver();
  }

  private checkRoundOver() {
    if (this.endScheduled || this.phase !== 'run') return;
    const alive = [...this.chickens.values()].filter((c) => c.alive);
    const done = this.participants > 1 ? alive.length <= 1 : alive.length === 0;
    if (!done) return;
    this.endScheduled = true;
    const winner = alive[0];
    if (winner) {
      winner.place = 1;
      winner.score += this.caughtCount + 1;
      winner.best = Math.max(winner.best, this.dist);
      this.roundWinnerId = winner.playerId;
      this.ctx.publishState();
    }
    this.ctx.setTimer(winner ? 300 : TIMING.lastCatchMs, () => this.endRound());
  }

  private endRound() {
    this.setPhase('roundEnd', TIMING.roundEndMs, () => {
      this.stopLoop();
      if (this.round >= this.settings.rounds) this.finish();
      else this.startRound();
    });
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.stopLoop();
    this.phaseTimer?.cancel();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.chickens.get(p.id)?.score ?? 0;
    const best = Math.max(0, ...[...this.chickens.values()].map((c) => c.best));
    this.ctx.endGame({ scores, summary: `${this.round} ${this.round === 1 ? 'Runde' : 'Runden'} · Rekord ${Math.round(best)} m` });
  }

  private emitFrame() {
    const frame: HuhnFrame = {
      t: this.ctx.now(),
      d: Math.round(this.dist * 100) / 100,
      v: Math.round(this.speed * 100) / 100,
      c: [...this.chickens.values()]
        .filter((c) => c.inRound)
        .map((c) => [c.slot, Math.round(c.y * 100) / 100, c.alive ? 1 : 0, c.down ? 1 : 0]),
      o: this.lanes.flatMap((l) => l.obstacles.filter((o) => o.x < PHYS.spawnDist).map((o) => [o.id, o.slot, OBSTACLE_KINDS.indexOf(o.kind), Math.round(o.x * 100) / 100] as [number, number, number, number])),
      fx: this.fx,
    };
    this.fx = [];
    this.ctx.emit(HUHN_EVENTS.frame, frame, { to: 'host' });
  }

  onViewerSync(viewer: { kind: 'host' } | { kind: 'player'; playerId: string }): void {
    if (viewer.kind !== 'host') return;
    const ev: HuhnRoundEvent = { round: this.round, mapId: this.map.id, slots: this.lanes.map((l) => l.slot) };
    this.ctx.emit(HUHN_EVENTS.round, ev, { to: 'host' });
  }
}

export const huhnServerModule: ServerGameModule<HuhnSettings> = {
  meta: huhnMeta,
  defaultSettings: DEFAULT_HUHN_SETTINGS,
  parseSettings: parseHuhnSettings,
  canStart(players) {
    if (!players.some((p) => p.isConnected)) return 'Mindestens ein Huhn (Handy) muss verbunden sein.';
    return null;
  },
  createEngine(ctx, settings) {
    return new HuhnEngine(ctx, settings);
  },
};

export { getMap };
