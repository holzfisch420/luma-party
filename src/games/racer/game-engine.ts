/**
 * Kurvenrausch – Server-Engine.
 *
 * Arcade-Fahrphysik in der Ebene (Höhe kommt aus der Strecke), 60 Hz Simulation,
 * 30 Hz Positions-Frames an den Fernseher. Handys schicken nur Lenkung, Gas, Bremse, Reset.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { CAR, DEFAULT_RACER_SETTINGS, MAX_CARS, parseRacerSettings, PLACE_POINTS, racerMeta, TIMING, type RacerSettings } from './game-config';
import { buildTrack, getTrack, indexAtDistance, indexDelta, nearestIndex, TRACKS, type BuiltTrack } from './tracks';
import { CAR_FLAG, RACER_EVENTS, type CarFrame, type RacerFrame, type RacerFx, type RacerPhase, type RacerPrivateState, type RacerPublicState } from './types';

const DT = 1 / CAR.tickHz;

interface Car {
  playerId: PlayerId;
  slot: number;
  points: number;
  gained: number;
  inRace: boolean;
  x: number;
  y: number;
  z: number;
  /** Fahrtrichtung (rad), 0 = +z */
  h: number;
  vx: number;
  vz: number;
  vy: number;
  si: number;
  dist: number;
  nextCp: number;
  lastCpDist: number;
  steer: number;
  gas: boolean;
  brake: boolean;
  falling: boolean;
  fallAt: number;
  finished: boolean;
  finishMs: number | null;
  dnf: boolean;
  boosting: boolean;
  wrongWay: number;
  wallAt: number;
}

export class RacerEngine implements GameEngine<RacerPublicState, RacerPrivateState> {
  private cars = new Map<PlayerId, Car>();
  private phase: RacerPhase = 'intro';
  private phaseEndsAt: number | null = null;
  private phaseTimer: TimerHandle | null = null;
  private loop: TimerHandle | null = null;
  private race = 0;
  private trackCursor = 0;
  track: BuiltTrack = buildTrack(TRACKS[0]!);
  private raceStartAt: number | null = null;
  private finishDeadline: number | null = null;
  private simMs = 0;
  private fx: RacerFx[] = [];
  private lastTickAt = 0;
  private acc = 0;
  private ticks = 0;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: RacerSettings,
  ) {}

  start(): void {
    for (const p of this.ctx.getPlayers()) this.addCar(p);
    this.startRace();
  }

  dispose(): void {
    this.loop?.cancel();
    this.phaseTimer?.cancel();
  }

  private addCar(p: GamePlayer): Car {
    const existing = this.cars.get(p.id);
    if (existing) return existing;
    const used = new Set([...this.cars.values()].map((c) => c.slot));
    let slot = -1;
    for (let i = 0; i < MAX_CARS; i++)
      if (!used.has(i)) {
        slot = i;
        break;
      }
    const c: Car = {
      playerId: p.id, slot, points: 0, gained: 0, inRace: false, x: 0, y: 0, z: 0, h: 0, vx: 0, vz: 0, vy: 0, si: 0, dist: 0, nextCp: 0, lastCpDist: 0,
      steer: 0, gas: false, brake: false, falling: false, fallAt: 0, finished: false, finishMs: null, dnf: false, boosting: false, wrongWay: 0, wallAt: -10,
    };
    this.cars.set(p.id, c);
    return c;
  }

  // ------------------------------------------------------------------ Zustand

  private ranking(): Car[] {
    return [...this.cars.values()]
      .filter((c) => c.inRace)
      .sort((a, b) => {
        if (a.finished !== b.finished) return a.finished ? -1 : 1;
        if (a.finished && b.finished) return (a.finishMs ?? 0) - (b.finishMs ?? 0);
        return b.dist - a.dist;
      });
  }

  getPublicState(): RacerPublicState {
    const ranking = this.ranking();
    const lapLen = this.track.raceDistance / this.track.def.laps;
    return {
      phase: this.phase,
      race: this.race,
      totalRaces: this.settings.races,
      trackId: this.track.def.id,
      phaseEndsAt: this.phaseEndsAt,
      raceStartAt: this.raceStartAt,
      finishDeadline: this.finishDeadline,
      view: this.settings.view,
      players: [...this.cars.values()]
        .filter((c) => c.slot >= 0)
        .map((c) => ({
          playerId: c.playerId,
          slot: c.slot,
          points: c.points,
          inRace: c.inRace,
          place: ranking.indexOf(c) + 1,
          finished: c.finished,
          finishMs: c.finishMs,
          dnf: c.dnf,
          lap: Math.min(this.track.def.laps, Math.max(1, Math.floor(Math.max(0, c.dist) / lapLen) + 1)),
          progress: Math.max(0, Math.min(1, c.dist / this.track.raceDistance)),
          gained: c.gained,
        })),
    };
  }

  getPrivateState(playerId: PlayerId): RacerPrivateState | null {
    const c = this.cars.get(playerId);
    if (!c) return null;
    const perLap = this.track.def.checkpoints;
    const lapLen = this.track.raceDistance / this.track.def.laps;
    return {
      slot: c.slot,
      inRace: c.inRace,
      place: this.ranking().indexOf(c) + 1,
      lap: Math.min(this.track.def.laps, Math.max(1, Math.floor(Math.max(0, c.dist) / lapLen) + 1)),
      laps: this.track.def.laps,
      checkpoint: c.nextCp % perLap,
      checkpoints: perLap,
      finished: c.finished,
      falling: c.falling,
    };
  }

  // ------------------------------------------------------------------ Eingaben

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished) return;
    const c = this.cars.get(playerId);
    if (!c || !c.inRace) return;
    const d = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    if (type === 'input') {
      const s = typeof d.s === 'number' && Number.isFinite(d.s) ? d.s : 0;
      c.steer = Math.max(-1, Math.min(1, s));
      c.gas = d.g === 1 || d.g === true;
      c.brake = d.b === 1 || d.b === true;
    } else if (type === 'reset' && this.phase === 'race' && !c.finished) {
      this.respawn(c);
    }
  }

  onPlayerJoined(p: GamePlayer): void {
    this.addCar(p);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    const c = this.cars.get(p.id);
    if (!c) return;
    this.cars.delete(p.id);
    this.checkRaceOver();
    this.ctx.publishState();
  }

  onPlayerDisconnected(p: GamePlayer): void {
    const c = this.cars.get(p.id);
    if (c) {
      c.gas = c.brake = false;
      c.steer = 0;
    }
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  onViewerSync(viewer: { kind: 'host' } | { kind: 'player'; playerId: string }): void {
    if (viewer.kind === 'host') this.emitFrame();
  }

  // ------------------------------------------------------------------ Ablauf

  private setPhase(phase: RacerPhase, ms: number | null, onEnd?: () => void) {
    this.phaseTimer?.cancel();
    this.phaseTimer = null;
    this.phase = phase;
    this.phaseEndsAt = ms ? this.ctx.now() + ms : null;
    if (ms && onEnd) this.phaseTimer = this.ctx.setTimer(ms, onEnd);
    this.ctx.publishState();
  }

  private pickTrack() {
    const pool = this.settings.tracks.length ? TRACKS.filter((t) => (this.settings.tracks as string[]).includes(t.id)) : TRACKS;
    const list = pool.length ? pool : TRACKS;
    if (this.settings.trackMode === 'random') return list[Math.floor(Math.random() * list.length)]!;
    const sorted = [...list].sort((a, b) => a.difficulty - b.difficulty);
    return sorted[this.trackCursor++ % sorted.length]!;
  }

  private startRace() {
    this.race++;
    this.track = buildTrack(this.pickTrack());
    this.raceStartAt = null;
    this.finishDeadline = null;
    this.simMs = 0;
    this.fx = [];
    const t = this.track;
    const active = [...this.cars.values()].filter((c) => c.slot >= 0 && this.ctx.getPlayer(c.playerId)?.isConnected).sort((a, b) => a.slot - b.slot);
    for (const c of this.cars.values()) c.inRace = false;
    // Startaufstellung: zwei Spalten, versetzt hinter der Startlinie
    active.forEach((c, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2 ? 1 : -1;
      const back = 6 + row * 7 + (i % 2) * 3;
      const si = indexAtDistance(t, -back);
      const nx = -t.tz[si]!;
      const nz = t.tx[si]!;
      const off = col * Math.min(t.halfWidth * 0.45, 3.2);
      Object.assign(c, {
        inRace: true, x: t.x[si]! + nx * off, z: t.z[si]! + nz * off, y: t.y[si]!, h: Math.atan2(t.tx[si]!, t.tz[si]!), vx: 0, vz: 0, vy: 0, si, dist: -back,
        nextCp: 0, lastCpDist: 0, steer: 0, gas: false, brake: false, falling: false, finished: false, finishMs: null, dnf: false, gained: 0, boosting: false, wrongWay: 0,
      });
    });
    this.setPhase('intro', TIMING.introMs, () =>
      this.setPhase('countdown', TIMING.countdownMs, () => {
        this.raceStartAt = this.ctx.now();
        this.setPhase('race', TIMING.maxRaceMs, () => this.endRace());
      }),
    );
    this.emitFrame();
    this.ensureLoop();
  }

  private ensureLoop() {
    if (this.loop) return;
    this.lastTickAt = this.ctx.now();
    const tick = () => {
      if (this.finished) return;
      const now = this.ctx.now();
      this.acc = Math.min(this.acc + (now - this.lastTickAt) / 1000, DT * 6);
      this.lastTickAt = now;
      while (this.acc >= DT) {
        this.acc -= DT;
        this.step();
        this.ticks++;
        if (this.ticks % (CAR.tickHz / CAR.frameHz) === 0) this.emitFrame();
      }
      this.loop = this.ctx.setTimer(1000 / CAR.tickHz, tick);
    };
    this.loop = this.ctx.setTimer(1000 / CAR.tickHz, tick);
  }

  /** ein Simulationsschritt */
  step() {
    const racing = this.phase === 'race';
    if (racing) this.simMs += DT * 1000;
    const t = this.track;
    const cars = [...this.cars.values()].filter((c) => c.inRace);
    for (const c of cars) {
      if (c.falling) {
        c.vy -= 25 * DT;
        c.y += c.vy * DT;
        c.x += c.vx * DT;
        c.z += c.vz * DT;
        if (this.simMs - c.fallAt > CAR.fallRespawnS * 1000) this.respawn(c);
        continue;
      }
      const fx = Math.sin(c.h);
      const fz = Math.cos(c.h);
      let fwd = c.vx * fx + c.vz * fz;
      let lat = c.vx * fz - c.vz * fx;
      const canDrive = racing && !c.finished;
      // Gas, Bremse, Rückwärts
      if (canDrive && c.gas) fwd += CAR.accel * Math.max(0.2, Math.sqrt(Math.max(0, 1 - Math.max(0, fwd) / CAR.maxSpeed))) * DT * (c.boosting ? 1.6 : 1);
      if (canDrive && c.brake) {
        if (fwd > 0.5) fwd = Math.max(0, fwd - CAR.brake * DT);
        else fwd = Math.max(-CAR.reverseMax, fwd - CAR.accel * 0.6 * DT);
      }
      if (!c.gas && !c.brake) fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), CAR.rolling * DT);
      if (c.finished) fwd *= 1 - 1.5 * DT;
      fwd -= CAR.drag * fwd * Math.abs(fwd) * DT;
      // Steigung
      fwd -= CAR.slopeGravity * t.slope[c.si]! * DT * 0.6;
      // Turbo-Feld
      c.boosting = t.boost[c.si] === 1;
      if (c.boosting && fwd > 0) fwd = Math.min(CAR.boostSpeed, fwd + 30 * DT);
      if (fwd > CAR.maxSpeed && !c.boosting) fwd -= (fwd - CAR.maxSpeed) * 1.5 * DT;
      // Lenken – weniger bei hohem Tempo, rückwärts umgekehrt
      const speedF = Math.min(1, Math.abs(fwd) / 7) * (1 - 0.42 * Math.min(1, Math.abs(fwd) / CAR.maxSpeed));
      // positive Lenkung = nach rechts (aus Fahrersicht) = Richtung kleiner
      c.h -= (canDrive || Math.abs(fwd) > 1 ? c.steer : 0) * CAR.steerRate * speedF * Math.sign(fwd || 1) * DT;
      // Seitenhaftung (Bremsen in der Kurve = Driften)
      const grip = c.brake && fwd > 15 && Math.abs(c.steer) > 0.3 ? CAR.driftGrip : CAR.grip;
      lat *= Math.exp(-grip * DT);
      const nfx = Math.sin(c.h);
      const nfz = Math.cos(c.h);
      c.vx = nfx * fwd + nfz * lat;
      c.vz = nfz * fwd - nfx * lat;
      c.x += c.vx * DT;
      c.z += c.vz * DT;

      // Position auf der Strecke
      const ni = nearestIndex(t, c.x, c.z, c.si);
      const delta = indexDelta(t, c.si, ni);
      c.si = ni;
      if (racing && !c.finished) c.dist += delta;
      c.wrongWay = racing && fwd > 3 && delta < 0 ? c.wrongWay + DT : Math.max(0, c.wrongWay - DT * 2);
      c.y = t.y[ni]!;
      // seitlicher Abstand zur Mittellinie
      const nx = -t.tz[ni]!;
      const nz = t.tx[ni]!;
      const d = (c.x - t.x[ni]!) * nx + (c.z - t.z[ni]!) * nz;
      const lim = t.halfWidth - CAR.radius * 0.8;
      if (Math.abs(d) > lim) {
        if (t.wall[ni]) {
          // an die Bande schieben, Geschwindigkeit nach außen wegnehmen
          const push = Math.abs(d) - lim;
          c.x -= nx * Math.sign(d) * push;
          c.z -= nz * Math.sign(d) * push;
          const vn = c.vx * nx + c.vz * nz;
          if (vn * Math.sign(d) > 0) {
            c.vx -= nx * vn * 1.25;
            c.vz -= nz * vn * 1.25;
            c.vx *= 0.985;
            c.vz *= 0.985;
            // an der Bande sanft in Streckenrichtung drehen – so bleibt niemand frontal hängen
            const th = Math.atan2(t.tx[ni]!, t.tz[ni]!);
            let da = th - c.h;
            while (da > Math.PI) da -= 2 * Math.PI;
            while (da < -Math.PI) da += 2 * Math.PI;
            if (Math.abs(da) < Math.PI * 0.75) c.h += da * 0.12;
            if (Math.abs(vn) > 6 && this.simMs - c.wallAt > 400) {
              c.wallAt = this.simMs;
              this.fx.push({ t: 'wall', s: c.slot });
            }
          }
        } else if (Math.abs(d) > t.halfWidth + 0.6) {
          // keine Bande: runtergefallen
          c.falling = true;
          c.fallAt = this.simMs;
          c.vy = 2;
          this.fx.push({ t: 'fall', s: c.slot });
          this.ctx.publishState();
          continue;
        }
      }
      if (racing && !c.finished) this.checkProgress(c);
    }
    if (this.settings.collisions) this.collide(cars);
    if (racing) this.checkRaceOver();
  }

  private collide(cars: Car[]) {
    const r2 = (CAR.radius * 2) ** 2;
    for (let i = 0; i < cars.length; i++)
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i]!;
        const b = cars[j]!;
        if (a.falling || b.falling || Math.abs(a.y - b.y) > 2.5) continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r2 || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const nz = dz / d;
        const push = (CAR.radius * 2 - d) / 2;
        a.x -= nx * push;
        a.z -= nz * push;
        b.x += nx * push;
        b.z += nz * push;
        const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
        if (rel < 0) {
          const imp = -rel * 0.75;
          a.vx -= nx * imp;
          a.vz -= nz * imp;
          b.vx += nx * imp;
          b.vz += nz * imp;
          if (-rel > 4) this.fx.push({ t: 'bump', s: a.slot });
        }
      }
  }

  private checkProgress(c: Car) {
    const t = this.track;
    const perLap = t.def.checkpoints;
    while (c.nextCp < t.checkpoints.length && c.dist >= t.checkpoints[c.nextCp]!) {
      c.lastCpDist = t.checkpoints[c.nextCp]!;
      c.nextCp++;
      const isFinish = c.nextCp === t.checkpoints.length;
      if (isFinish) {
        c.finished = true;
        c.finishMs = Math.round(this.simMs);
        const place = this.ranking().filter((o) => o.finished).length;
        this.fx.push({ t: 'finish', s: c.slot, place });
        if (this.finishDeadline === null) {
          this.finishDeadline = this.ctx.now() + TIMING.finishGraceMs;
          this.phaseTimer?.cancel();
          this.phaseTimer = this.ctx.setTimer(TIMING.finishGraceMs, () => this.endRace());
        }
      } else this.fx.push({ t: c.nextCp % perLap === 0 ? 'lap' : 'cp', s: c.slot });
      this.ctx.publishState();
    }
  }

  /** zurück zum letzten Checkpoint (bzw. Start), Blick in Fahrtrichtung */
  private respawn(c: Car) {
    const t = this.track;
    const si = indexAtDistance(t, c.lastCpDist);
    Object.assign(c, { x: t.x[si]!, z: t.z[si]!, y: t.y[si]!, h: Math.atan2(t.tx[si]!, t.tz[si]!), vx: 0, vz: 0, vy: 0, si, dist: c.lastCpDist, falling: false });
    this.ctx.publishState();
  }

  private checkRaceOver() {
    if (this.phase !== 'race') return;
    const racing = [...this.cars.values()].filter((c) => c.inRace && this.ctx.getPlayer(c.playerId)?.isConnected);
    if (racing.length > 0 && racing.every((c) => c.finished)) this.endRace();
  }

  private endRace() {
    if (this.phase !== 'race') return;
    const ranking = this.ranking();
    ranking.forEach((c, i) => {
      if (!c.finished) c.dnf = true;
      c.gained = c.finished ? (PLACE_POINTS[i] ?? 0) : 0;
      c.points += c.gained;
    });
    this.setPhase('results', TIMING.resultsMs, () => {
      if (this.race >= this.settings.races) this.finish();
      else this.startRace();
    });
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.loop?.cancel();
    this.phaseTimer?.cancel();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.cars.get(p.id)?.points ?? 0;
    this.ctx.endGame({ scores, summary: `${this.race} ${this.race === 1 ? 'Rennen' : 'Rennen'} gefahren` });
  }

  private emitFrame() {
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const c: CarFrame[] = [...this.cars.values()]
      .filter((car) => car.inRace)
      .map((car) => [
        car.slot,
        r2(car.x),
        r2(car.y),
        r2(car.z),
        Math.round(car.h * 1000) / 1000,
        Math.round(Math.hypot(car.vx, car.vz) * 3.6),
        car.si,
        (car.finished ? CAR_FLAG.finished : 0) | (car.falling ? CAR_FLAG.falling : 0) | (car.boosting ? CAR_FLAG.boost : 0) | (car.wrongWay > 1 ? CAR_FLAG.wrongWay : 0),
      ]);
    const frame: RacerFrame = { t: this.ctx.now(), c, fx: this.fx };
    this.fx = [];
    this.ctx.emit(RACER_EVENTS.frame, frame, { to: 'host' });
  }
}

export const racerServerModule: ServerGameModule<RacerSettings> = {
  meta: racerMeta,
  defaultSettings: DEFAULT_RACER_SETTINGS,
  parseSettings: parseRacerSettings,
  canStart(players) {
    if (!players.some((p) => p.isConnected)) return 'Mindestens ein Handy muss verbunden sein.';
    return null;
  },
  createEngine(ctx, settings) {
    return new RacerEngine(ctx, settings);
  },
};

export { getTrack };
