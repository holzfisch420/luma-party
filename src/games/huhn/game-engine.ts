/**
 * Hühnerjagd – Server-Engine (Schwerkraft-Läufer).
 *
 * - alle Hühner laufen im selben Level; die Kamera scrollt immer schneller nach rechts
 * - Knopf = Schwerkraft umdrehen (Boden ↔ Decke), nur mit festem Stand (plus kurzer Puffer)
 * - Hühner rempeln sich gegenseitig; wer aus dem Bild fällt, an einem Polizisten hängen bleibt
 *   oder links zurückfällt (Polizei), ist raus
 * - 60 Hz Simulation, 20 Hz Positions-Frames an den Fernseher; das Level selbst erzeugt der
 *   Fernseher aus demselben Seed
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { DEFAULT_HUHN_SETTINGS, huhnMeta, MAX_CHICKENS, parseHuhnSettings, PHYS, TIMING, type HuhnSettings } from './game-config';
import { COP_H, COP_W, generateLevel, solidsIn, WORLD_H, type Level } from './logic/level';
import { MAPS, type HuhnMap } from './maps';
import { HUHN_EVENTS, type HuhnFrame, type HuhnFx, type HuhnPhase, type HuhnPrivateState, type HuhnPublicState, type HuhnRoundEvent } from './types';

const STEP = 1 / PHYS.tickHz;
const S = PHYS.size;

interface Chicken {
  playerId: PlayerId;
  slot: number;
  score: number;
  best: number;
  inRound: boolean;
  alive: boolean;
  place: number;
  out: 'fell' | 'police' | 'cop' | null;
  /** linke obere Ecke */
  x: number;
  y: number;
  vy: number;
  g: 1 | -1;
  grounded: boolean;
  lastGroundAt: number;
  flipAt: number;
  bumpAt: number;
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
  private seed = 1;
  level: Level = { floor: [], ceil: [], mid: [], cops: [] };
  private simT = 0;
  camX = 0;
  speed = 0;
  private outCount = 0;
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

  private addChicken(p: GamePlayer): Chicken {
    const existing = this.chickens.get(p.id);
    if (existing) return existing;
    const used = new Set([...this.chickens.values()].map((c) => c.slot));
    let slot = -1;
    for (let i = 0; i < MAX_CHICKENS; i++)
      if (!used.has(i)) {
        slot = i;
        break;
      }
    const c: Chicken = { playerId: p.id, slot, score: 0, best: 0, inRound: false, alive: false, place: 0, out: null, x: 0, y: 0, vy: 0, g: 1, grounded: false, lastGroundAt: -1, flipAt: -1, bumpAt: -1 };
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
      seed: this.seed,
      phaseEndsAt: this.phaseEndsAt,
      players: [...this.chickens.values()]
        .filter((c) => c.slot >= 0)
        .map((c) => ({ playerId: c.playerId, slot: c.slot, score: c.score, inRound: c.inRound, alive: c.alive, place: c.place, best: Math.round(c.best), out: c.out })),
      roundWinnerId: this.roundWinnerId,
      meters: Math.round(this.camX),
    };
  }

  getPrivateState(playerId: PlayerId): HuhnPrivateState | null {
    const c = this.chickens.get(playerId);
    if (!c) return null;
    return { slot: c.slot, inRound: c.inRound, alive: c.alive, place: c.place, g: c.g };
  }

  handleAction(playerId: PlayerId, type: string): void {
    if (this.finished || type !== 'flip') return;
    const c = this.chickens.get(playerId);
    if (!c || !c.alive) return;
    c.flipAt = this.simT;
  }

  onPlayerJoined(p: GamePlayer): void {
    this.addChicken(p);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    const c = this.chickens.get(p.id);
    if (!c) return;
    if (c.alive && this.phase === 'run') this.knockOut(c, 'fell');
    this.chickens.delete(p.id);
    this.ctx.publishState();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  onViewerSync(viewer: { kind: 'host' } | { kind: 'player'; playerId: string }): void {
    if (viewer.kind !== 'host') return;
    this.ctx.emit(HUHN_EVENTS.round, this.roundEvent(), { to: 'host' });
    this.emitFrame();
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
    const sorted = [...list].sort((a, b) => a.difficulty - b.difficulty);
    return sorted[this.mapCursor++ % sorted.length]!;
  }

  private roundEvent(): HuhnRoundEvent {
    return { round: this.round, mapId: this.map.id, seed: this.seed, slots: [...this.chickens.values()].filter((c) => c.inRound).map((c) => c.slot) };
  }

  private startRound() {
    this.round++;
    this.map = this.pickMap();
    this.seed = Math.floor(Math.random() * 2 ** 31);
    this.level = generateLevel(this.map, this.seed);
    this.simT = 0;
    this.camX = 0;
    this.speed = this.map.v0;
    this.outCount = 0;
    this.roundWinnerId = null;
    this.endScheduled = false;
    this.fx = [];
    const active = [...this.chickens.values()].filter((c) => c.slot >= 0 && this.ctx.getPlayer(c.playerId)?.isConnected).sort((a, b) => a.slot - b.slot);
    for (const c of this.chickens.values()) {
      c.inRound = false;
      c.alive = false;
    }
    const floorY = this.level.floor[0]!.y;
    const ceilY = this.level.ceil[0]!.y;
    active.forEach((c, i) => {
      c.inRound = true;
      c.alive = true;
      c.place = 0;
      c.out = null;
      // abwechselnd Boden und Decke, leicht versetzt – so wird gleich gerempelt
      c.g = i % 2 === 0 ? 1 : -1;
      c.x = PHYS.anchor + 1.2 - Math.floor(i / 2) * 1.0;
      c.y = c.g === 1 ? floorY - S : ceilY;
      c.vy = 0;
      c.grounded = true;
      c.lastGroundAt = 0;
      c.flipAt = -1;
    });
    this.participants = active.length;
    this.ctx.emit(HUHN_EVENTS.round, this.roundEvent(), { to: 'all' });
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
    if (this.phase !== 'run') return;
    const dt = STEP;
    this.simT += dt;
    this.speed = Math.min(this.map.vmax, this.map.v0 + this.map.accel * this.simT);
    this.camX += this.speed * dt;
    const alive = [...this.chickens.values()].filter((c) => c.alive);
    const solids = solidsIn(this.level, this.camX - 3, this.camX + 30);

    for (const c of alive) {
      // umschalten (nur mit Bodenkontakt, kurzer Puffer)
      if (c.flipAt >= 0 && this.simT - c.flipAt <= PHYS.flipBuffer && (c.grounded || this.simT - c.lastGroundAt <= PHYS.coyote)) {
        c.g = c.g === 1 ? -1 : 1;
        c.vy = c.g * 2;
        c.grounded = false;
        c.lastGroundAt = -1;
        c.flipAt = -1;
        this.fx.push({ t: 'flip', s: c.slot });
        this.ctx.publishState();
      }
      // vorwärts: zur Gruppe aufschließen
      const target = this.camX + PHYS.anchor;
      const vx = Math.max(0, this.speed + Math.max(-1.5, Math.min(PHYS.catchUp, (target - c.x) * 1.2)));
      c.x += vx * dt;
      this.resolve(c, solids, 'x');
      // Schwerkraft
      c.vy = Math.max(-PHYS.maxFall, Math.min(PHYS.maxFall, c.vy + c.g * PHYS.gravity * dt));
      c.y += c.vy * dt;
      c.grounded = false;
      this.resolve(c, solids, 'y');
    }

    // Rempeln
    for (let i = 0; i < alive.length; i++)
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i]!;
        const b = alive[j]!;
        const ox = Math.min(a.x + S, b.x + S) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + S, b.y + S) - Math.max(a.y, b.y);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) {
          const push = ox / 2 + 0.001;
          if (a.x < b.x) {
            a.x -= push;
            b.x += push;
          } else {
            a.x += push;
            b.x -= push;
          }
        } else {
          const push = oy / 2 + 0.001;
          const [top, bottom] = a.y < b.y ? [a, b] : [b, a];
          top.y -= push;
          bottom.y += push;
          if (top.g === 1 && bottom.g === -1) {
            // Kopfnuss in der Luft: beide prallen ab und fliegen zurück
            top.g = -1;
            bottom.g = 1;
            top.vy = -3;
            bottom.vy = 3;
            top.grounded = bottom.grounded = false;
            top.lastGroundAt = bottom.lastGroundAt = -1;
            this.fx.push({ t: 'bump', s: top.slot });
            this.ctx.publishState();
          } else {
            // wer auf einem anderen Huhn steht, hat festen Stand
            if (top.g === 1 && top.vy >= 0) {
              top.vy = 0;
              this.land(top);
            }
            if (bottom.g === -1 && bottom.vy <= 0) {
              bottom.vy = 0;
              this.land(bottom);
            }
          }
        }
        if (this.simT - a.bumpAt > 0.5) {
          a.bumpAt = this.simT;
          this.fx.push({ t: 'bump', s: a.slot });
        }
        this.resolve(a, solids, 'any');
        this.resolve(b, solids, 'any');
      }

    // ausgeschieden?
    for (const c of alive) {
      if (!c.alive) continue;
      if (c.y > WORLD_H + 0.6 || c.y + S < -0.6) this.knockOut(c, 'fell');
      else if (c.x < this.camX + PHYS.policeX) this.knockOut(c, 'police');
      else if (this.hitsCop(c)) this.knockOut(c, 'cop');
    }
  }

  /** aus festen Plattformen herausschieben */
  private resolve(c: Chicken, solids: [number, number, number, number][], axis: 'x' | 'y' | 'any') {
    for (const [x0, x1, y0, y1] of solids) {
      const ox = Math.min(c.x + S, x1) - Math.max(c.x, x0);
      const oy = Math.min(c.y + S, y1) - Math.max(c.y, y0);
      if (ox <= 1e-6 || oy <= 1e-6) continue;
      const useX = axis === 'x' || (axis === 'any' && ox < oy);
      // kleine Kanten werden einfach mitgenommen
      if (useX && c.g === 1 && c.y + S - y0 <= 0.22 && y1 > c.y + S) {
        c.y = y0 - S;
        continue;
      }
      if (useX && c.g === -1 && y1 - c.y <= 0.22 && y0 < c.y) {
        c.y = y1;
        continue;
      }
      if (useX) {
        // Hühner laufen nach rechts – also vor die Wand schieben
        if (c.x + S / 2 < (x0 + x1) / 2) c.x = x0 - S;
        else c.x = x1;
      } else if (c.y + S / 2 < (y0 + y1) / 2) {
        c.y = y0 - S;
        if (c.vy > 0) c.vy = 0;
        if (c.g === 1) this.land(c);
      } else {
        c.y = y1;
        if (c.vy < 0) c.vy = 0;
        if (c.g === -1) this.land(c);
      }
    }
  }

  private land(c: Chicken) {
    c.grounded = true;
    c.lastGroundAt = this.simT;
  }

  private hitsCop(c: Chicken) {
    for (const cop of this.level.cops) {
      if (cop.x > c.x + 2) break;
      if (cop.x + COP_W < c.x) continue;
      const y0 = cop.side === 'floor' ? cop.y - COP_H : cop.y;
      const m = 0.08;
      if (c.x + m < cop.x + COP_W && c.x + S - m > cop.x && c.y + m < y0 + COP_H && c.y + S - m > y0) return true;
    }
    return false;
  }

  private knockOut(c: Chicken, why: 'fell' | 'police' | 'cop') {
    if (!c.alive) return;
    c.alive = false;
    c.out = why;
    c.best = Math.max(c.best, this.camX);
    c.place = [...this.chickens.values()].filter((o) => o.alive).length + 1;
    c.score += this.participants > 1 ? this.outCount : Math.floor(this.camX / 25);
    this.outCount++;
    this.fx.push({ t: 'out', s: c.slot, why });
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
      winner.score += this.outCount + 1;
      winner.best = Math.max(winner.best, this.camX);
      this.roundWinnerId = winner.playerId;
      this.ctx.publishState();
    }
    this.ctx.setTimer(winner ? 600 : TIMING.lastCatchMs, () => this.endRound());
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
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const frame: HuhnFrame = {
      t: this.ctx.now(),
      cx: r2(this.camX),
      v: r2(this.speed),
      c: [...this.chickens.values()].filter((c) => c.inRound).map((c) => [c.slot, r2(c.x), r2(c.y), c.g, c.alive ? 1 : 0]),
      fx: this.fx,
    };
    this.fx = [];
    this.ctx.emit(HUHN_EVENTS.frame, frame, { to: 'host' });
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
