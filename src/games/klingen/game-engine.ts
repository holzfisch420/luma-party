/**
 * „Klingenrad“ – Server-Engine.
 *
 * Einzeln: Jedes Handy rechnet seine Stufen selbst (keine Verzögerung) und meldet Fortschritt;
 *   der Server führt die Rangliste und beendet das Spiel nach Ablauf der Zeit.
 * Gemeinsames Rad: Der Fernseher berechnet die Treffer (er zeigt das Rad). Ein Wurf geht
 *   Handy → Server → Fernseher, das Ergebnis zurück an den Server.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { DEFAULT_KLINGEN_SETTINGS, klingenMeta, parseKlingenSettings, TIMING, type KlingenSettings } from './game-config';
import { KNIFE_COUNT, validSkin } from './logic/knives';
import { BOSS_EVERY, makeStage } from './logic/wheel';
import type { KlingenPrivateState, KlingenPublicState, LiveFrame, SharedRow, SoloRow, ThrowEvent } from './types';

export class KlingenEngine implements GameEngine<KlingenPublicState, KlingenPrivateState> {
  private phase: KlingenPublicState['phase'] = 'pick';
  private knives = new Map<PlayerId, number>();
  private picked = new Set<PlayerId>();
  private lastLiveAt = 0;
  private phaseEndsAt: number | null = null;
  private spinStartedAt: number | null = null;
  private readonly seed = Math.floor(Math.random() * 1e9);
  private solo = new Map<PlayerId, SoloRow>();
  private shared = new Map<PlayerId, SharedRow>();
  private round = 0;
  private throwId = 0;
  private pending = new Map<number, { playerId: PlayerId; timer: TimerHandle }>();
  private lastThrowAt = new Map<PlayerId, number>();
  private lastResult = new Map<PlayerId, { id: number; ok: boolean }>();
  private lastOut: PlayerId | null = null;
  private timer: TimerHandle | null = null;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: KlingenSettings,
  ) {}

  start(): void {
    const players = this.ctx.getPlayers().filter((p) => p.isConnected);
    players.forEach((p, i) => {
      if (this.settings.mode === 'solo') this.solo.set(p.id, { stage: 1, cleared: 0, stuck: 0, lives: this.settings.lives, done: false, stars: 0, bosses: 0 });
      else this.shared.set(p.id, { alive: true, left: 0, stuckTotal: 0, outRound: null });
      // Vorschlag, bis selbst gewählt wird: alle verschieden
      this.knives.set(p.id, (i * 5) % KNIFE_COUNT);
    });
    // zuerst 10 Sekunden Messer aussuchen
    this.setPhase('pick', TIMING.pickMs, () => this.afterPick());
  }

  private afterPick() {
    if (this.phase !== 'pick') return;
    if (this.settings.mode === 'solo') {
      this.setPhase('countdown', TIMING.countdownMs, () => {
        this.spinStartedAt = this.ctx.now();
        this.setPhase('play', this.settings.minutes * 60_000, () => this.finish());
      });
    } else this.startRound();
  }

  dispose(): void {
    this.timer?.cancel();
    for (const p of this.pending.values()) p.timer.cancel();
  }

  private setPhase(phase: KlingenPublicState['phase'], ms: number, next: () => void) {
    this.timer?.cancel();
    this.phase = phase;
    this.phaseEndsAt = this.ctx.now() + ms;
    this.timer = this.ctx.setTimer(ms, next);
    this.ctx.publishState();
  }

  getPublicState(): KlingenPublicState {
    return {
      mode: this.settings.mode,
      seed: this.seed,
      phase: this.phase,
      phaseEndsAt: this.phaseEndsAt,
      spinStartedAt: this.spinStartedAt,
      maxLives: this.settings.lives,
      solo: Object.fromEntries(this.solo),
      round: this.round,
      shared: Object.fromEntries(this.shared),
      lastOut: this.lastOut,
      knives: Object.fromEntries(this.knives),
      picked: [...this.picked],
      spotlight: this.spotlight(),
    };
  }

  getPrivateState(playerId: PlayerId): KlingenPrivateState {
    return { lastResult: this.lastResult.get(playerId) ?? null };
  }

  // ------------------------------------------------------------------ Einzeln

  /** Platz 1 (noch im Spiel) – dessen Handy überträgt live an den Fernseher */
  private spotlight(): PlayerId | null {
    if (this.settings.mode !== 'solo' || this.phase !== 'play') return null;
    const rows = [...this.solo].filter(([id, r]) => !r.done && this.ctx.getPlayer(id)?.isConnected);
    rows.sort((a, b) => b[1].cleared - a[1].cleared || b[1].stars - a[1].stars || b[1].stuck - a[1].stuck);
    return rows[0]?.[0] ?? null;
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    if (type === 'knife') {
      const skin = validSkin(data.skin);
      if (this.phase !== 'pick' || skin === null || !this.knives.has(playerId)) return;
      this.knives.set(playerId, skin);
      this.picked.add(playerId);
      // alle haben gewählt: sofort weiter
      const everyone = [...this.knives.keys()].filter((id) => this.ctx.getPlayer(id)?.isConnected);
      if (everyone.every((id) => this.picked.has(id))) this.afterPick();
      else this.ctx.publishState();
      return;
    }
    if (type === 'live') return this.forwardLive(playerId, data);
    if (this.settings.mode === 'shared') {
      if (type === 'throw') this.throwShared(playerId);
      return;
    }
    const row = this.solo.get(playerId);
    if (!row || row.done || this.phase !== 'play') return;
    const stage = Number(data.stage);
    if (stage !== row.stage) return; // nur die aktuelle Stufe zählt
    if (type === 'progress') {
      row.stuck = Math.max(0, Math.min(20, Math.floor(Number(data.stuck) || 0)));
    } else if (type === 'clear') {
      if (row.stage % BOSS_EVERY === 0) row.bosses++;
      row.cleared++;
      row.stage++;
      row.stuck = 0;
      // höchstens so viele Sterne, wie die Stufe hat
      row.stars += Math.max(0, Math.min(makeStage(this.seed, stage).stars.length, Math.floor(Number(data.stars) || 0)));
    } else if (type === 'fail') {
      // Leben weg – die Stufe läuft aber weiter (steckende Messer bleiben)
      row.lives--;
      if (row.lives <= 0) row.done = true;
      if (this.allSoloDone()) {
        this.finish();
        return;
      }
    } else return;
    this.ctx.publishState();
  }

  /** Bild vom Handy des Erstplatzierten an den Fernseher weiterreichen */
  private forwardLive(playerId: PlayerId, data: Record<string, unknown>) {
    if (this.settings.mode !== 'solo' || this.phase !== 'play' || playerId !== this.spotlight()) return;
    const now = this.ctx.now();
    const ev = typeof data.ev === 'string' && ['throw', 'stick', 'star', 'hit', 'clear'].includes(data.ev) ? (data.ev as LiveFrame['ev']) : undefined;
    // höchstens ~20 Bilder pro Sekunde (Ereignisse immer)
    if (!ev && now - this.lastLiveAt < 45) return;
    this.lastLiveAt = now;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const nums = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max).map(num) : []);
    const modes = ['intro', 'play', 'clear', 'over'] as const;
    const frame: LiveFrame = {
      playerId,
      stage: Math.max(1, Math.floor(num(data.stage))),
      t: num(data.t),
      angle: num(data.angle),
      knives: nums(data.knives, 40),
      stars: nums(data.stars, 6),
      left: Math.max(0, Math.floor(num(data.left))),
      lives: Math.max(0, Math.floor(num(data.lives))),
      mode: modes.includes(data.mode as never) ? (data.mode as LiveFrame['mode']) : 'play',
      ev,
      hit: typeof data.hit === 'string' ? data.hit.slice(0, 12) : undefined,
    };
    this.ctx.emit('live', frame, { to: 'host' });
  }

  private allSoloDone() {
    return [...this.solo].every(([id, r]) => r.done || !this.ctx.getPlayer(id)?.isConnected);
  }

  // ------------------------------------------------------------------ Gemeinsames Rad

  private startRound() {
    this.round++;
    for (const r of this.shared.values()) if (r.alive) r.left = this.round;
    this.lastOut = null;
    this.spinStartedAt = null;
    this.setPhase('countdown', TIMING.roundIntroMs, () => {
      this.spinStartedAt = this.ctx.now();
      this.phase = 'play';
      this.phaseEndsAt = null;
      this.timer?.cancel();
      this.ctx.publishState();
    });
  }

  private throwShared(playerId: PlayerId) {
    const row = this.shared.get(playerId);
    if (!row || !row.alive || row.left <= 0 || this.phase !== 'play') return;
    const now = this.ctx.now();
    if (now - (this.lastThrowAt.get(playerId) ?? 0) < TIMING.throwCooldownMs) return;
    this.lastThrowAt.set(playerId, now);
    row.left--;
    const id = ++this.throwId;
    // falls der Fernseher nicht antwortet: Messer gilt als steckend
    const timer = this.ctx.setTimer(TIMING.resultTimeoutMs, () => this.resolve(id, true));
    this.pending.set(id, { playerId, timer });
    this.ctx.emit('throw', { id, playerId } satisfies ThrowEvent, { to: 'host' });
    this.ctx.publishState();
  }

  handleHostAction(type: string, payload: unknown): void {
    if (type !== 'result' || this.settings.mode !== 'shared') return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    if (typeof data.id === 'number' && typeof data.ok === 'boolean') this.resolve(data.id, data.ok);
  }

  private resolve(id: number, ok: boolean) {
    const p = this.pending.get(id);
    if (!p) return;
    p.timer.cancel();
    this.pending.delete(id);
    const row = this.shared.get(p.playerId);
    this.lastResult.set(p.playerId, { id, ok });
    if (row && row.alive) {
      if (ok) row.stuckTotal++;
      else {
        row.alive = false;
        row.left = 0;
        row.outRound = this.round;
        this.lastOut = p.playerId;
      }
    }
    this.checkRoundEnd();
    this.ctx.publishState();
  }

  private checkRoundEnd() {
    if (this.phase !== 'play' || this.pending.size > 0) return;
    const active = [...this.shared].filter(([id, r]) => r.alive && this.ctx.getPlayer(id)?.isConnected);
    if (active.some(([, r]) => r.left > 0) && active.length > 1) return;
    this.setPhase('roundEnd', TIMING.roundEndMs, () => {
      const alive = [...this.shared].filter(([id, r]) => r.alive && this.ctx.getPlayer(id)?.isConnected);
      const total = this.shared.size;
      if (alive.length === 0 || (alive.length === 1 && total > 1)) this.finish();
      else this.startRound();
    });
  }

  // ------------------------------------------------------------------ Spieler

  onPlayerJoined(p: GamePlayer): void {
    // Einzeln: wer später kommt, steigt direkt ein
    if (this.settings.mode === 'solo' && !this.solo.has(p.id) && this.phase !== 'done')
      this.solo.set(p.id, { stage: 1, cleared: 0, stuck: 0, lives: this.settings.lives, done: false, stars: 0, bosses: 0 });
    if (!this.knives.has(p.id)) this.knives.set(p.id, this.knives.size % KNIFE_COUNT);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    this.solo.delete(p.id);
    this.shared.delete(p.id);
    this.check();
  }

  onPlayerDisconnected(): void {
    this.check();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  private check() {
    if (this.settings.mode === 'solo') {
      if (this.phase === 'play' && this.solo.size > 0 && this.allSoloDone()) this.finish();
      else this.ctx.publishState();
    } else {
      this.checkRoundEnd();
      this.ctx.publishState();
    }
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.timer?.cancel();
    this.phase = 'done';
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) {
      if (this.settings.mode === 'solo') {
        const r = this.solo.get(p.id);
        // Stufen zählen am meisten, Sterne entscheiden bei Gleichstand
        scores[p.id] = r ? r.cleared * 10 + r.stars : 0;
      }
      else {
        const r = this.shared.get(p.id);
        // überstandene Runden zählen zuerst, dann steckende Messer
        scores[p.id] = r ? (r.alive ? this.round : (r.outRound ?? 1) - 1) * 100 + r.stuckTotal : 0;
      }
    }
    this.ctx.endGame({
      scores,
      summary: this.settings.mode === 'solo' ? 'Punkte: 10 je geschaffte Stufe, 1 je Bonus-Stern' : `${this.round} Runden am gemeinsamen Rad · Punkte = Runden × 100 + Messer`,
    });
  }
}

export const klingenServerModule: ServerGameModule<KlingenSettings> = {
  meta: klingenMeta,
  defaultSettings: DEFAULT_KLINGEN_SETTINGS,
  parseSettings: parseKlingenSettings,
  canStart(players, settings) {
    const n = players.filter((p) => p.isConnected).length;
    if (n < 1) return 'Mindestens eine Person muss mit dem Handy verbunden sein.';
    if (settings.mode === 'shared' && n < 2) return 'Das gemeinsame Rad braucht mindestens 2 Spieler.';
    return null;
  },
  createEngine(ctx, settings) {
    return new KlingenEngine(ctx, settings);
  },
};
