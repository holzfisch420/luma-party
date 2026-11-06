/**
 * Kettenchaos – serverseitige Engine (maßgebliche Simulation).
 *
 * - 60 Hz feste Physik-Schritte, 20 Hz Positions-Frames an den Hauptbildschirm
 * - Handys schicken nur Eingaben (Joystick + Tasten), alles andere entscheidet der Server
 * - Rundenablauf: Farbwahl → Countdown → Kampf → Rundenende → … → Sieg
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import {
  BTN,
  DEFAULT_PANZER_SETTINGS,
  PHASE_SECONDS,
  PHYS,
  POWER_IDS,
  POWERUP_INTERVAL,
  TANK_COLORS,
  panzerMeta,
  parsePanzerSettings,
  type PanzerSettings,
  type PowerId,
} from './game-config';
import { angleDiff, circleHitsRect, distToSegment, moveBouncing, pushOutOfRect, traceLaser } from './logic/geometry';
import { MAP_H, MAP_IDS, MAP_W, getMap, type ArenaMap } from './maps';
import {
  BULLET_KIND,
  PZ_EVENTS,
  TANK_FLAG,
  type BulletKind,
  type Fx,
  type PanzerFrame,
  type PanzerPhase,
  type PanzerPrivateState,
  type PanzerPublicState,
  type RoundStartEvent,
  type Steering,
} from './types';

const MAX_SLOTS = 8;
const STEP = 1 / PHYS.tickHz;

interface Tank {
  playerId: PlayerId;
  slot: number;
  color: number;
  ready: boolean;
  score: number;
  kills: number;
  inRound: boolean;
  alive: boolean;
  x: number;
  y: number;
  a: number;
  input: { x: number; y: number; mask: number };
  pending: { fire: boolean; special: boolean; turbo: boolean; honk: boolean };
  steering: Steering;
  fireReadyAt: number;
  turboUntil: number;
  turboReadyAt: number;
  shieldUntil: number;
  cloakUntil: number;
  honkReadyAt: number;
  power: PowerId | null;
  mgLeft: number;
  mgNextAt: number;
}

interface Bullet {
  id: number;
  owner: number; // slot
  kind: BulletKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  spawnAt: number;
  dieAt: number;
  grace: number;
}

interface Mine {
  owner: number;
  x: number;
  y: number;
  armAt: number;
  /** eigener Panzer hat die Mine verlassen → ab dann auch für ihn gefährlich */
  ownerClear: boolean;
}

interface Crate {
  x: number;
  y: number;
  power: PowerId;
}

const BULLET_SPEC: Record<BulletKind, { speed: number; r: number; life: number; grace: number }> = {
  [BULLET_KIND.shell]: { speed: PHYS.shellSpeed, r: PHYS.shellRadius, life: PHYS.shellLife, grace: PHYS.selfHitGrace },
  [BULLET_KIND.pellet]: { speed: 7, r: 0.06, life: 1.0, grace: 0.15 },
  [BULLET_KIND.missile]: { speed: 3.8, r: 0.11, life: 9, grace: 1.0 },
  [BULLET_KIND.mg]: { speed: 7.5, r: 0.06, life: 2.5, grace: 0.15 },
  [BULLET_KIND.frag]: { speed: 4.2, r: 0.15, life: 1.3, grace: 0.3 },
  [BULLET_KIND.shard]: { speed: 6.5, r: 0.05, life: 0.9, grace: 0 },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r2 = (v: number) => Math.round(v * 100) / 100;

export class PanzerEngine implements GameEngine<PanzerPublicState, PanzerPrivateState> {
  private phase: PanzerPhase = 'colors';
  private round = 0;
  private tanks = new Map<PlayerId, Tank>();
  private map: ArenaMap = getMap(MAP_IDS[0]!);
  private mapQueue: string[] = [];
  private bullets: Bullet[] = [];
  private mines: Mine[] = [];
  private crates: Crate[] = [];
  private fx: Fx[] = [];
  private bulletSeq = 0;
  private phaseEndsAt = 0;
  private phaseDurationMs = 0;
  private phaseTimer: TimerHandle | null = null;
  private loop: TimerHandle | null = null;
  private lastTickAt = 0;
  private acc = 0;
  private tickCount = 0;
  private nextCrateAt = Infinity;
  private lastStandingAt: number | null = null;
  private roundWinnerId: PlayerId | null = null;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: PanzerSettings,
  ) {}

  // ------------------------------------------------------------------ Lebenszyklus

  start(): void {
    for (const p of this.ctx.getPlayers()) this.addTank(p);
    this.setPhase('colors', PHASE_SECONDS.colors * 1000, () => this.startRound());
    this.ctx.publishState();
  }

  dispose(): void {
    this.finished = true;
    this.phaseTimer?.cancel();
    this.loop?.cancel();
  }

  private addTank(p: GamePlayer): Tank | null {
    if (this.tanks.has(p.id)) return this.tanks.get(p.id)!;
    const usedSlots = new Set([...this.tanks.values()].map((t) => t.slot));
    let slot = -1;
    for (let s = 0; s < MAX_SLOTS; s++) {
      if (!usedSlots.has(s)) {
        slot = s;
        break;
      }
    }
    const usedColors = new Set([...this.tanks.values()].map((t) => t.color));
    const color = [...TANK_COLORS.keys()].find((c) => !usedColors.has(c)) ?? 0;
    const tank: Tank = {
      playerId: p.id,
      slot,
      color,
      ready: false,
      score: 0,
      kills: 0,
      inRound: false,
      alive: false,
      x: 0,
      y: 0,
      a: 0,
      input: { x: 0, y: 0, mask: 0 },
      pending: { fire: false, special: false, turbo: false, honk: false },
      steering: 'tank',
      fireReadyAt: 0,
      turboUntil: 0,
      turboReadyAt: 0,
      shieldUntil: 0,
      cloakUntil: 0,
      honkReadyAt: 0,
      power: null,
      mgLeft: 0,
      mgNextAt: 0,
    };
    this.tanks.set(p.id, tank);
    return tank;
  }

  // ------------------------------------------------------------------ Zustand

  getPublicState(): PanzerPublicState {
    return {
      phase: this.phase,
      round: this.round,
      winScore: this.settings.winScore,
      mapId: this.map.id,
      phaseEndsAt: this.phaseEndsAt,
      phaseDurationMs: this.phaseDurationMs,
      players: [...this.tanks.values()]
        .filter((t) => t.slot >= 0)
        .map((t) => ({ playerId: t.playerId, slot: t.slot, color: t.color, ready: t.ready, score: t.score, kills: t.kills, alive: t.alive, inRound: t.inRound })),
      roundWinnerId: this.roundWinnerId,
      powerupsEnabled: this.settings.powerups !== 'off',
    };
  }

  getPrivateState(playerId: PlayerId): PanzerPrivateState | null {
    const t = this.tanks.get(playerId);
    if (!t) return null;
    return {
      slot: t.slot,
      color: t.color,
      alive: t.alive,
      inRound: t.inRound,
      power: t.power,
      turboReadyAt: t.turboReadyAt,
      shieldUntil: t.shieldUntil,
      steering: t.steering,
    };
  }

  // ------------------------------------------------------------------ Aktionen

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished) return;
    const t = this.tanks.get(playerId);
    if (!t) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    switch (type) {
      case 'input': {
        const x = typeof data.x === 'number' && Number.isFinite(data.x) ? clamp(data.x, -1, 1) : 0;
        const y = typeof data.y === 'number' && Number.isFinite(data.y) ? clamp(data.y, -1, 1) : 0;
        const mask = typeof data.b === 'number' && Number.isInteger(data.b) ? data.b & 15 : 0;
        const pressed = mask & ~t.input.mask;
        if (pressed & BTN.fire) t.pending.fire = true;
        if (pressed & BTN.special) t.pending.special = true;
        if (pressed & BTN.turbo) t.pending.turbo = true;
        if (pressed & BTN.honk) t.pending.honk = true;
        t.input = { x, y, mask };
        return;
      }
      case 'color': {
        if (this.phase !== 'colors' && t.inRound) return;
        const index = data.index;
        if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= TANK_COLORS.length) return;
        if ([...this.tanks.values()].some((o) => o !== t && o.color === index)) return; // Farbe vergeben
        t.color = index;
        this.ctx.publishState();
        return;
      }
      case 'ready': {
        if (this.phase !== 'colors') return;
        t.ready = Boolean(data.ready);
        this.ctx.publishState();
        const active = [...this.tanks.values()].filter((o) => o.slot >= 0 && this.ctx.getPlayer(o.playerId)?.isConnected);
        if (active.length >= 2 && active.every((o) => o.ready)) this.startRound();
        return;
      }
      case 'steering': {
        if (data.mode === 'tank' || data.mode === 'direction') {
          t.steering = data.mode;
          this.ctx.publishState();
        }
        return;
      }
      default:
        return;
    }
  }

  // ------------------------------------------------------------------ Spieler-Ereignisse

  onPlayerJoined(p: GamePlayer): void {
    this.addTank(p);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    const t = this.tanks.get(p.id);
    if (!t) return;
    this.tanks.delete(p.id);
    this.bullets = this.bullets.filter((b) => b.owner !== t.slot || b.kind !== BULLET_KIND.missile);
    this.checkRoundOver();
    this.ctx.publishState();
  }

  onPlayerDisconnected(p: GamePlayer): void {
    const t = this.tanks.get(p.id);
    if (t) t.input = { x: 0, y: 0, mask: 0 };
    if (this.phase === 'colors') {
      const active = [...this.tanks.values()].filter((o) => o.slot >= 0 && this.ctx.getPlayer(o.playerId)?.isConnected);
      if (active.length >= 2 && active.every((o) => o.ready)) this.startRound();
    }
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  onViewerSync(viewer: { kind: 'host' } | { kind: 'player'; playerId: string }): void {
    if (viewer.kind !== 'host' || this.round === 0) return;
    const ev: RoundStartEvent = { round: this.round, mapId: this.map.id };
    this.ctx.emit(PZ_EVENTS.round, ev, { to: 'host' });
  }

  // ------------------------------------------------------------------ Runden

  private pickMap(): ArenaMap {
    const pool = this.settings.maps.filter((id) => MAP_IDS.includes(id));
    const ids = pool.length ? pool : MAP_IDS;
    if (this.settings.mapMode === 'rotation') return getMap(ids[(this.round - 1) % ids.length]!);
    if (this.mapQueue.length === 0) this.mapQueue = [...ids].sort(() => Math.random() - 0.5);
    // dieselbe Karte nicht zweimal hintereinander
    if (ids.length > 1 && this.mapQueue[0] === this.map.id) this.mapQueue.push(this.mapQueue.shift()!);
    return getMap(this.mapQueue.shift()!);
  }

  private startRound(): void {
    if (this.finished) return;
    const participants = [...this.tanks.values()].filter((t) => t.slot >= 0 && this.ctx.getPlayer(t.playerId)?.isConnected);
    if (participants.length < 2) {
      this.ctx.notify('all', 'info', 'Zu wenige Spieler verbunden – das Spiel wird beendet.');
      return this.finish();
    }
    this.round++;
    this.map = this.pickMap();
    this.bullets = [];
    this.mines = [];
    this.crates = [];
    this.fx = [];
    this.roundWinnerId = null;
    this.lastStandingAt = null;
    const spawns = [...this.map.spawns].sort(() => Math.random() - 0.5);
    for (const t of this.tanks.values()) {
      t.inRound = false;
      t.alive = false;
      t.power = null;
      t.mgLeft = 0;
      t.shieldUntil = 0;
      t.cloakUntil = 0;
      t.turboUntil = 0;
      t.turboReadyAt = 0;
      t.pending = { fire: false, special: false, turbo: false, honk: false };
    }
    participants.forEach((t, i) => {
      const sp = spawns[i % spawns.length]!;
      t.inRound = true;
      t.alive = true;
      t.x = sp.x;
      t.y = sp.y;
      // Blick grob zur Mitte, auf 90° gerundet
      const toCenter = Math.atan2(MAP_H / 2 - sp.y, MAP_W / 2 - sp.x);
      t.a = Math.round(toCenter / (Math.PI / 2)) * (Math.PI / 2);
    });
    const ev: RoundStartEvent = { round: this.round, mapId: this.map.id };
    this.ctx.emit(PZ_EVENTS.round, ev, { to: 'host' });
    this.setPhase('countdown', PHASE_SECONDS.countdown * 1000, () => this.startBattle());
    this.ensureLoop();
    this.ctx.publishState();
  }

  private startBattle(): void {
    const interval = POWERUP_INTERVAL[this.settings.powerups];
    this.nextCrateAt = Number.isFinite(interval) ? this.ctx.now() + interval * 500 : Infinity;
    this.phase = 'battle';
    this.phaseEndsAt = 0;
    this.phaseDurationMs = 0;
    this.ctx.publishState();
  }

  private checkRoundOver(): void {
    if (this.phase !== 'battle' || this.lastStandingAt !== null) return;
    const alive = [...this.tanks.values()].filter((t) => t.alive);
    if (alive.length <= 1) {
      this.lastStandingAt = this.ctx.now();
      this.ctx.setTimer(PHASE_SECONDS.lastStanding * 1000, () => this.endRound());
    }
  }

  private endRound(): void {
    if (this.phase !== 'battle' || this.finished) return;
    const alive = [...this.tanks.values()].filter((t) => t.alive);
    const winner = alive.length === 1 ? alive[0]! : null;
    if (winner) winner.score++;
    this.roundWinnerId = winner?.playerId ?? null;
    const champion = winner && winner.score >= this.settings.winScore;
    this.setPhase('roundEnd', PHASE_SECONDS.roundEnd * 1000, () => (champion ? this.finish() : this.startRound()));
    this.ctx.publishState();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.loop?.cancel();
    this.phaseTimer?.cancel();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.tanks.get(p.id)?.score ?? 0;
    const kills = [...this.tanks.values()].reduce((n, t) => n + t.kills, 0);
    this.ctx.endGame({ scores, summary: `${this.round} ${this.round === 1 ? 'Runde' : 'Runden'} · ${kills} Abschüsse` });
  }

  private setPhase(phase: PanzerPhase, ms: number, onEnd: () => void) {
    this.phaseTimer?.cancel();
    this.phase = phase;
    this.phaseDurationMs = ms;
    this.phaseEndsAt = this.ctx.now() + ms;
    this.phaseTimer = this.ctx.setTimer(ms, onEnd);
  }

  // ------------------------------------------------------------------ Simulation

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
        this.step(now);
        this.tickCount++;
        if (this.tickCount % (PHYS.tickHz / PHYS.frameHz) === 0) this.emitFrame(now);
      }
      this.loop = this.ctx.setTimer(1000 / PHYS.tickHz, tick);
    };
    this.loop = this.ctx.setTimer(1000 / PHYS.tickHz, tick);
  }

  private step(now: number) {
    const battle = this.phase === 'battle' || this.phase === 'roundEnd';
    if (!battle) return;
    let privateDirty = false;

    for (const t of this.tanks.values()) {
      if (!t.alive) {
        t.pending = { fire: false, special: false, turbo: false, honk: false };
        continue;
      }
      // Hupe
      if (t.pending.honk && now >= t.honkReadyAt) {
        t.honkReadyAt = now + 800;
        this.fx.push({ t: 'honk', s: t.slot });
      }
      // Turbo
      if (t.pending.turbo && now >= t.turboReadyAt) {
        t.turboUntil = now + PHYS.turboSeconds * 1000;
        t.turboReadyAt = now + PHYS.turboCooldown * 1000;
        privateDirty = true;
      }
      // Bewegung
      this.drive(t, now);
      // Feuer
      if (t.pending.fire && now >= t.fireReadyAt) {
        const own = this.bullets.filter((b) => b.owner === t.slot && b.kind === BULLET_KIND.shell).length;
        if (own < PHYS.maxShells) {
          this.spawnBullet(t, BULLET_KIND.shell, t.a, now);
          t.fireReadyAt = now + PHYS.fireCooldown * 1000;
          this.fx.push({ t: 'shot', x: r2(t.x), y: r2(t.y) });
        }
      }
      // Spezial
      if (t.pending.special && t.power) {
        this.usePower(t, now);
        privateDirty = true;
      }
      // Dauerfeuer
      if (t.mgLeft > 0 && now >= t.mgNextAt) {
        this.spawnBullet(t, BULLET_KIND.mg, t.a + (Math.random() - 0.5) * 0.16, now);
        t.mgLeft--;
        t.mgNextAt = now + 90;
      }
      t.pending = { fire: false, special: false, turbo: false, honk: false };
    }

    this.separateTanks();
    this.updateBullets(now);
    this.updateMines(now);
    this.updateCrates(now);
    if (privateDirty) this.ctx.publishState();
  }

  private drive(t: Tank, now: number) {
    const speed = PHYS.tankSpeed * (now < t.turboUntil ? PHYS.turboFactor : 1);
    let throttle = 0;
    if (t.steering === 'direction') {
      const mag = Math.min(1, Math.hypot(t.input.x, t.input.y));
      if (mag > 0.2) {
        const target = Math.atan2(t.input.y, t.input.x);
        const d = angleDiff(t.a, target);
        t.a += clamp(d, -PHYS.tankTurn * STEP, PHYS.tankTurn * STEP);
        throttle = mag * Math.max(0, Math.cos(d));
      }
    } else {
      throttle = -t.input.y;
      const turn = t.input.x;
      if (Math.abs(turn) > 0.15) t.a += turn * PHYS.tankTurn * STEP * (throttle < -0.2 ? -1 : 1);
      if (Math.abs(throttle) < 0.15) throttle = 0;
    }
    t.a = ((t.a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    if (throttle) {
      const v = throttle * speed * (throttle < 0 ? 0.7 : 1) * STEP;
      t.x += Math.cos(t.a) * v;
      t.y += Math.sin(t.a) * v;
    }
    for (let i = 0; i < 2; i++) {
      for (const w of this.map.walls) [t.x, t.y] = pushOutOfRect(t.x, t.y, PHYS.tankRadius, w);
    }
  }

  private separateTanks() {
    const alive = [...this.tanks.values()].filter((t) => t.alive);
    const minD = PHYS.tankRadius * 2;
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i]!;
        const b = alive[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < minD) {
          const push = (minD - d) / 2;
          a.x -= (dx / d) * push;
          a.y -= (dy / d) * push;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
        }
      }
    }
  }

  private spawnBullet(t: Tank, kind: BulletKind, angle: number, now: number, from?: { x: number; y: number }) {
    const spec = BULLET_SPEC[kind];
    const ox = from?.x ?? t.x + Math.cos(angle) * (PHYS.tankRadius + spec.r + 0.04);
    const oy = from?.y ?? t.y + Math.sin(angle) * (PHYS.tankRadius + spec.r + 0.04);
    // Mündung in der Wand? Dann aus der Panzermitte starten (Kugel prallt sofort ab)
    const blocked = !from && this.map.walls.some((w) => circleHitsRect(ox, oy, spec.r, w));
    this.bullets.push({
      id: ++this.bulletSeq,
      owner: t.slot,
      kind,
      x: blocked ? t.x : ox,
      y: blocked ? t.y : oy,
      vx: Math.cos(angle) * spec.speed,
      vy: Math.sin(angle) * spec.speed,
      r: spec.r,
      spawnAt: now,
      dieAt: now + spec.life * 1000,
      grace: spec.grace * 1000,
    });
  }

  private usePower(t: Tank, now: number) {
    const power = t.power!;
    t.power = null;
    switch (power) {
      case 'laser': {
        const sx = t.x + Math.cos(t.a) * PHYS.tankRadius * 0.9;
        const sy = t.y + Math.sin(t.a) * PHYS.tankRadius * 0.9;
        const pts = traceLaser(sx, sy, t.a, this.map.walls, 32, 3);
        this.fx.push({ t: 'laser', p: pts.map(r2), c: t.color });
        for (const o of this.tanks.values()) {
          if (!o.alive) continue;
          for (let i = 0; i + 3 < pts.length; i += 2) {
            if (o === t && i === 0) continue; // eigener Panzer erst nach dem ersten Abpraller
            if (distToSegment(o.x, o.y, pts[i]!, pts[i + 1]!, pts[i + 2]!, pts[i + 3]!) < PHYS.tankRadius) {
              this.damage(o, t.slot, now);
              break;
            }
          }
        }
        break;
      }
      case 'shotgun':
        for (let i = 0; i < 7; i++) this.spawnBullet(t, BULLET_KIND.pellet, t.a + (i - 3) * 0.12, now);
        this.fx.push({ t: 'shot', x: r2(t.x), y: r2(t.y) });
        break;
      case 'missile':
        this.spawnBullet(t, BULLET_KIND.missile, t.a, now);
        break;
      case 'mine':
        this.mines.push({ owner: t.slot, x: t.x - Math.cos(t.a) * 0.15, y: t.y - Math.sin(t.a) * 0.15, armAt: now + 1200, ownerClear: false });
        break;
      case 'shield':
        t.shieldUntil = now + 8000;
        break;
      case 'machinegun':
        t.mgLeft = 14;
        t.mgNextAt = now;
        break;
      case 'frag':
        this.spawnBullet(t, BULLET_KIND.frag, t.a, now);
        break;
      case 'cloak':
        t.cloakUntil = now + 7000;
        break;
    }
  }

  private nearestEnemy(b: Bullet): Tank | null {
    let best: Tank | null = null;
    let bestD = Infinity;
    for (const t of this.tanks.values()) {
      if (!t.alive || t.slot === b.owner) continue;
      const d = (t.x - b.x) ** 2 + (t.y - b.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  private updateBullets(now: number) {
    const keep: Bullet[] = [];
    const spawned: Bullet[] = [];
    for (const b of this.bullets) {
      if (now >= b.dieAt) {
        if (b.kind === BULLET_KIND.frag) {
          this.fx.push({ t: 'boom', x: r2(b.x), y: r2(b.y), s: 0.6 });
          const owner = [...this.tanks.values()].find((t) => t.slot === b.owner);
          for (let i = 0; i < 16; i++) {
            const ang = (i / 16) * Math.PI * 2;
            const spec = BULLET_SPEC[BULLET_KIND.shard];
            spawned.push({
              id: ++this.bulletSeq,
              owner: owner?.slot ?? b.owner,
              kind: BULLET_KIND.shard,
              x: b.x,
              y: b.y,
              vx: Math.cos(ang) * spec.speed,
              vy: Math.sin(ang) * spec.speed,
              r: spec.r,
              spawnAt: now,
              dieAt: now + spec.life * 1000,
              grace: 0,
            });
          }
        }
        continue;
      }
      if (b.kind === BULLET_KIND.missile) {
        const target = this.nearestEnemy(b);
        if (target) {
          const cur = Math.atan2(b.vy, b.vx);
          const want = Math.atan2(target.y - b.y, target.x - b.x);
          const na = cur + clamp(angleDiff(cur, want), -2.6 * STEP, 2.6 * STEP);
          const sp = BULLET_SPEC[BULLET_KIND.missile].speed;
          b.vx = Math.cos(na) * sp;
          b.vy = Math.sin(na) * sp;
        }
      }
      const m = moveBouncing(b.x, b.y, b.vx, b.vy, b.r, STEP, this.map.walls);
      b.x = m.x;
      b.y = m.y;
      b.vx = m.vx;
      b.vy = m.vy;
      // Treffer?
      let hit = false;
      for (const t of this.tanks.values()) {
        if (!t.alive) continue;
        if (t.slot === b.owner && now - b.spawnAt < b.grace) continue;
        if ((t.x - b.x) ** 2 + (t.y - b.y) ** 2 < (PHYS.tankRadius + b.r) ** 2) {
          this.damage(t, b.owner, now);
          hit = true;
          break;
        }
      }
      if (!hit) keep.push(b);
      else if (b.kind === BULLET_KIND.missile || b.kind === BULLET_KIND.frag) this.fx.push({ t: 'boom', x: r2(b.x), y: r2(b.y), s: 0.5 });
    }
    this.bullets = keep.concat(spawned);
  }

  private updateMines(now: number) {
    const keep: Mine[] = [];
    for (const m of this.mines) {
      const armed = now >= m.armAt;
      const near = (t: Tank, r: number) => (t.x - m.x) ** 2 + (t.y - m.y) ** 2 < r * r;
      const owner = [...this.tanks.values()].find((t) => t.slot === m.owner);
      if (!m.ownerClear && (!owner || !owner.alive || !near(owner, 0.75))) m.ownerClear = true;
      const trigger = armed && [...this.tanks.values()].some((t) => t.alive && near(t, 0.5) && (t.slot !== m.owner || m.ownerClear));
      if (!trigger) {
        keep.push(m);
        continue;
      }
      this.fx.push({ t: 'boom', x: r2(m.x), y: r2(m.y), s: 1.4 });
      for (const t of this.tanks.values()) {
        if (t.alive && (t.x - m.x) ** 2 + (t.y - m.y) ** 2 < 1.15 ** 2) this.damage(t, m.owner, now);
      }
    }
    this.mines = keep;
  }

  private updateCrates(now: number) {
    if (this.phase !== 'battle') return;
    // aufsammeln
    for (const t of this.tanks.values()) {
      if (!t.alive) continue;
      const idx = this.crates.findIndex((c) => (c.x - t.x) ** 2 + (c.y - t.y) ** 2 < (PHYS.tankRadius + PHYS.crateRadius) ** 2);
      if (idx < 0) continue;
      const c = this.crates[idx]!;
      this.crates.splice(idx, 1);
      t.power = c.power;
      this.fx.push({ t: 'pickup', x: r2(c.x), y: r2(c.y), i: POWER_IDS.indexOf(c.power), s: t.slot });
      this.ctx.publishState();
    }
    // neue Kisten
    if (now >= this.nextCrateAt) {
      const interval = POWERUP_INTERVAL[this.settings.powerups];
      this.nextCrateAt = now + interval * 1000 * (0.7 + Math.random() * 0.6);
      if (this.crates.length < PHYS.maxCrates) {
        const spot = this.freeSpot();
        if (spot) this.crates.push({ ...spot, power: POWER_IDS[Math.floor(Math.random() * POWER_IDS.length)]! });
      }
    }
  }

  private freeSpot(): { x: number; y: number } | null {
    for (let tries = 0; tries < 60; tries++) {
      const x = Math.floor(Math.random() * MAP_W) + 0.5;
      const y = Math.floor(Math.random() * MAP_H) + 0.5;
      if (this.map.grid[Math.floor(y)]![Math.floor(x)] === '#') continue;
      if ([...this.tanks.values()].some((t) => t.alive && (t.x - x) ** 2 + (t.y - y) ** 2 < 2.2 ** 2)) continue;
      if (this.crates.some((c) => (c.x - x) ** 2 + (c.y - y) ** 2 < 1)) continue;
      return { x, y };
    }
    return null;
  }

  private damage(t: Tank, bySlot: number, now: number) {
    if (!t.alive) return;
    if (now < t.shieldUntil) {
      t.shieldUntil = 0;
      this.fx.push({ t: 'pop', x: r2(t.x), y: r2(t.y) });
      this.ctx.publishState();
      return;
    }
    t.alive = false;
    t.mgLeft = 0;
    this.fx.push({ t: 'boom', x: r2(t.x), y: r2(t.y), s: 1 });
    this.fx.push({ t: 'kill', s: t.slot, by: bySlot });
    const killer = [...this.tanks.values()].find((k) => k.slot === bySlot);
    if (killer && killer !== t) killer.kills++;
    this.ctx.publishState();
    this.checkRoundOver();
  }

  private emitFrame(now: number) {
    const frame: PanzerFrame = {
      t: now,
      k: [...this.tanks.values()]
        .filter((t) => t.alive)
        .map((t) => [
          t.slot,
          r2(t.x),
          r2(t.y),
          Math.round(t.a * 1000) / 1000,
          (now < t.shieldUntil ? TANK_FLAG.shield : 0) | (now < t.cloakUntil ? TANK_FLAG.cloak : 0) | (now < t.turboUntil ? TANK_FLAG.turbo : 0),
        ]),
      b: this.bullets.map((b) => [b.id, r2(b.x), r2(b.y), b.kind, Math.round(Math.atan2(b.vy, b.vx) * 100) / 100, b.owner]),
      m: this.mines.map((m) => [r2(m.x), r2(m.y), now >= m.armAt ? 1 : 0, m.owner]),
      c: this.crates.map((c) => [c.x, c.y, POWER_IDS.indexOf(c.power)]),
      fx: this.fx,
    };
    this.fx = [];
    this.ctx.emit(PZ_EVENTS.frame, frame, { to: 'host' });
  }
}

export const panzerServerModule: ServerGameModule<PanzerSettings> = {
  meta: panzerMeta,
  defaultSettings: DEFAULT_PANZER_SETTINGS,
  parseSettings: parsePanzerSettings,
  canStart(players) {
    const connected = players.filter((p) => p.isConnected).length;
    if (connected < panzerMeta.minPlayers) return `Kettenchaos braucht mindestens ${panzerMeta.minPlayers} Spieler.`;
    if (connected > panzerMeta.maxPlayers) return `Kettenchaos erlaubt höchstens ${panzerMeta.maxPlayers} Spieler.`;
    return null;
  },
  createEngine(ctx, settings) {
    return new PanzerEngine(ctx, settings);
  },
};
