/**
 * Eine laufende Partie: verbindet eine GameEngine mit dem Raum.
 * Kümmert sich um gebündeltes Versenden der Zustände, Timer und Cleanup.
 */
import type { GameEventPayload, GameStatePayload, NoticeKind, PlayerId } from '../../shared/types/room';
import type {
  EmitTarget,
  FinalScores,
  GameContext,
  GameEngine,
  GamePlayer,
  GameServices,
  ServerGameModule,
  TimerHandle,
  Viewer,
} from '../game-engine/types';

/** Schnittstelle, die der Raum der Session zur Verfügung stellt (entkoppelt von Socket.IO). */
export interface SessionHost {
  readonly code: string;
  getGamePlayers(): GamePlayer[];
  sendGameState(target: { kind: 'host' } | { kind: 'player'; playerId: PlayerId }, state: GameStatePayload): void;
  sendGameEvent(target: EmitTarget, event: GameEventPayload): void;
  notify(target: PlayerId | 'all', kind: NoticeKind, message: string): void;
  onGameFinished(result: FinalScores): void;
}

export class GameSession {
  readonly gameId: string;
  private engine!: GameEngine;
  private timers = new Set<NodeJS.Timeout>();
  private dirty = false;
  private disposed = false;

  private constructor(
    private readonly host: SessionHost,
    private readonly module: ServerGameModule<unknown>,
  ) {
    this.gameId = module.meta.id;
  }

  static async create(host: SessionHost, module: ServerGameModule<unknown>, settings: unknown, services: GameServices) {
    const session = new GameSession(host, module);
    session.engine = await module.createEngine(session.createContext(services), settings);
    return session;
  }

  start(): void {
    this.engine.start();
    this.flush();
  }

  private createContext(services: GameServices): GameContext {
    const host = this.host;
    return {
      roomCode: host.code,
      gameId: this.gameId,
      services,
      getPlayers: () => host.getGamePlayers(),
      getPlayer: (id) => host.getGamePlayers().find((p) => p.id === id),
      publishState: () => this.markDirty(),
      emit: (name, payload, target = { to: 'all' }) => {
        if (this.disposed) return;
        // ausstehenden Zustand zuerst senden, damit die Reihenfolge stimmt
        if (this.dirty) this.flush();
        host.sendGameEvent(target, { gameId: this.gameId, name, payload });
      },
      notify: (target, kind, message) => host.notify(target, kind, message),
      setTimer: (ms, fn) => this.setTimer(ms, fn),
      now: () => Date.now(),
      endGame: (result) => {
        if (this.disposed) return;
        // außerhalb des aktuellen Call-Stacks beenden, um Reentranz zu vermeiden
        setImmediate(() => !this.disposed && host.onGameFinished(result));
      },
      log: (...args) => console.log(`[${host.code}/${this.gameId}]`, ...args),
    };
  }

  private setTimer(ms: number, fn: () => void): TimerHandle {
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (this.disposed) return;
      try {
        fn();
      } catch (err) {
        console.error(`[${this.host.code}] Timer-Fehler:`, err);
      }
    }, Math.max(0, ms));
    this.timers.add(t);
    return {
      cancel: () => {
        clearTimeout(t);
        this.timers.delete(t);
      },
    };
  }

  private markDirty(): void {
    if (this.disposed || this.dirty) return;
    this.dirty = true;
    queueMicrotask(() => this.dirty && this.flush());
  }

  /** öffentlichen Zustand an alle, privaten Zustand individuell versenden */
  flush(): void {
    if (this.disposed) return;
    this.dirty = false;
    const serverTime = Date.now();
    const pub = this.engine.getPublicState();
    this.host.sendGameState({ kind: 'host' }, { gameId: this.gameId, public: pub, private: null, serverTime });
    for (const p of this.host.getGamePlayers()) {
      if (!p.isConnected) continue;
      this.host.sendGameState(
        { kind: 'player', playerId: p.id },
        { gameId: this.gameId, public: pub, private: this.engine.getPrivateState(p.id), serverTime },
      );
    }
  }

  /** Zustand gezielt an ein (neu verbundenes) Gerät senden */
  syncViewer(viewer: Viewer): void {
    if (this.disposed) return;
    const serverTime = Date.now();
    const pub = this.engine.getPublicState();
    const priv = viewer.kind === 'player' ? this.engine.getPrivateState(viewer.playerId) : null;
    this.host.sendGameState(viewer, { gameId: this.gameId, public: pub, private: priv, serverTime });
    this.safely(() => this.engine.onViewerSync?.(viewer));
  }

  handleHostAction(type: string, payload: unknown): void {
    this.safely(() => this.engine.handleHostAction?.(type, payload));
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    this.safely(() => this.engine.handleAction(playerId, type, payload));
  }

  playerJoined(p: GamePlayer) {
    this.safely(() => this.engine.onPlayerJoined?.(p));
  }
  playerLeft(p: GamePlayer) {
    this.safely(() => this.engine.onPlayerLeft?.(p));
  }
  playerDisconnected(p: GamePlayer) {
    this.safely(() => this.engine.onPlayerDisconnected?.(p));
  }
  playerReconnected(p: GamePlayer) {
    this.safely(() => this.engine.onPlayerReconnected?.(p));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    try {
      this.engine.dispose();
    } catch (err) {
      console.error(`[${this.host.code}/${this.gameId}] Cleanup-Fehler:`, err);
    }
  }

  private safely(fn: () => void): void {
    if (this.disposed) return;
    try {
      fn();
    } catch (err) {
      console.error(`[${this.host.code}/${this.gameId}] Engine-Fehler:`, err);
    }
  }

  get moduleMeta() {
    return this.module.meta;
  }
}
