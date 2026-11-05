/**
 * Ein Raum = eine Party-Session mit Hauptbildschirm (Host) und Spielern.
 * Verwaltet Spieler, Verbindungen, Spielauswahl, Einstellungen und die laufende Partie.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import { AVATAR_COLORS, MAX_PLAYERS_PER_ROOM, PLAYER_NAME_MAX, PLAYER_RECONNECT_GRACE_MS } from '../../shared/constants';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/events';
import type { GameResults } from '../../shared/types/game';
import type {
  GameEventPayload,
  GameStatePayload,
  NoticeKind,
  PlayerId,
  PublicPlayer,
  RoomPhase,
  RoomSnapshot,
} from '../../shared/types/room';
import { sanitizeText } from '../../shared/utils/text';
import { DEFAULT_GAME_ID, getGameMeta } from '../../games/game-catalog';
import type { EmitTarget, FinalScores, GamePlayer, GameServices } from '../game-engine/types';
import { GameSession, type SessionHost } from '../game-manager/game-session';
import { getServerGame, listServerGames } from '../game-manager/server-game-registry';

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export interface SocketData {
  roomCode?: string;
  role?: 'host' | 'player';
  playerId?: PlayerId;
  bucket?: { tokens: number; updatedAt: number };
}

interface PlayerRecord {
  id: PlayerId;
  name: string;
  token: string;
  avatarColor: string;
  joinedAt: number;
  socketId: string | null;
  disconnectedAt: number | null;
}

export class RoomError extends Error {}

const token = () => randomBytes(24).toString('base64url');

export class Room implements SessionHost {
  readonly hostToken = token();
  readonly createdAt = Date.now();
  private hostSocketId: string | null = null;
  private hostDisconnectedAt: number | null = Date.now();
  private players = new Map<PlayerId, PlayerRecord>();
  private phase: RoomPhase = 'lobby';
  private selectedGameId = DEFAULT_GAME_ID;
  private hostHasControl = false;
  private settings: Record<string, unknown> = {};
  private session: GameSession | null = null;
  private results: GameResults | null = null;
  private colorCursor = 0;
  private broadcastQueued = false;
  private starting = false;

  constructor(
    readonly code: string,
    private readonly io: TypedServer,
    private readonly services: GameServices,
  ) {
    for (const m of listServerGames()) this.settings[m.meta.id] = m.defaultSettings;
  }

  // ------------------------------------------------------------------ Socket-Räume

  private get ioRoom() {
    return `r:${this.code}`;
  }
  private get hostRoom() {
    return `r:${this.code}:host`;
  }
  private playerRoom(id: PlayerId) {
    return `p:${this.code}:${id}`;
  }

  // ------------------------------------------------------------------ Snapshot

  snapshot(): RoomSnapshot {
    return {
      code: this.code,
      phase: this.phase,
      hostConnected: this.hostSocketId !== null,
      players: this.publicPlayers(),
      selectedGameId: this.selectedGameId,
      controllerId: this.controllerId(),
      hostHasControl: this.hostHasControl,
      gameSettings: this.settings,
      activeGameId: this.session?.gameId ?? null,
      results: this.results,
      serverTime: Date.now(),
    };
  }

  private publicPlayers(): PublicPlayer[] {
    return [...this.players.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => ({ id: p.id, name: p.name, avatarColor: p.avatarColor, isConnected: p.socketId !== null, joinedAt: p.joinedAt }));
  }

  /** Auswahlberechtigt ist genau ein Spieler: der am frühesten beigetretene, verbundene Spieler. */
  controllerId(): PlayerId | null {
    let best: PlayerRecord | null = null;
    for (const p of this.players.values()) {
      if (p.socketId === null) continue;
      if (!best || p.joinedAt < best.joinedAt) best = p;
    }
    return best?.id ?? null;
  }

  /** Raumstatus gebündelt (einmal pro Tick) an alle senden */
  broadcast(): void {
    if (this.broadcastQueued) return;
    this.broadcastQueued = true;
    queueMicrotask(() => {
      this.broadcastQueued = false;
      this.io.to(this.ioRoom).emit('room:state', this.snapshot());
    });
  }

  // ------------------------------------------------------------------ Host

  attachHost(socket: TypedSocket): void {
    if (this.hostSocketId && this.hostSocketId !== socket.id) {
      // älteren Hauptbildschirm ablösen
      const old = this.io.sockets.sockets.get(this.hostSocketId);
      old?.emit('session:ended', { reason: 'Der Raum wurde auf einem anderen Bildschirm geöffnet.' });
      old?.leave(this.ioRoom);
      old?.leave(this.hostRoom);
      if (old) old.data = {};
    }
    this.hostSocketId = socket.id;
    this.hostDisconnectedAt = null;
    socket.data.roomCode = this.code;
    socket.data.role = 'host';
    socket.data.playerId = undefined;
    socket.join([this.ioRoom, this.hostRoom]);
    socket.emit('room:state', this.snapshot());
    this.session?.syncViewer({ kind: 'host' });
    this.broadcast();
  }

  // ------------------------------------------------------------------ Spieler

  addPlayer(rawName: unknown, socket: TypedSocket): PlayerRecord {
    const name = sanitizeText(rawName, PLAYER_NAME_MAX);
    if (!name) throw new RoomError('Bitte gib einen Namen ein.');
    const existing = [...this.players.values()].find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      // getrennter Spieler mit gleichem Namen darf seinen Platz zurückholen
      if (existing.socketId === null) {
        this.attachPlayer(existing, socket);
        return existing;
      }
      throw new RoomError('Dieser Name ist bereits vergeben.');
    }
    if (this.players.size >= MAX_PLAYERS_PER_ROOM) throw new RoomError(`Der Raum ist voll (max. ${MAX_PLAYERS_PER_ROOM}).`);

    const record: PlayerRecord = {
      id: randomUUID(),
      name,
      token: token(),
      avatarColor: this.nextColor(),
      joinedAt: Date.now(),
      socketId: null,
      disconnectedAt: null,
    };
    this.players.set(record.id, record);
    this.attachPlayer(record, socket, true);
    return record;
  }

  resumePlayer(tokenValue: string, socket: TypedSocket): PlayerRecord {
    const record = [...this.players.values()].find((p) => p.token === tokenValue);
    if (!record) throw new RoomError('Sitzung abgelaufen – bitte erneut beitreten.');
    this.attachPlayer(record, socket);
    return record;
  }

  private attachPlayer(record: PlayerRecord, socket: TypedSocket, isNew = false): void {
    const wasDisconnected = record.socketId === null;
    if (record.socketId && record.socketId !== socket.id) {
      const old = this.io.sockets.sockets.get(record.socketId);
      old?.emit('session:ended', { reason: 'Du bist auf einem anderen Gerät beigetreten.' });
      old?.leave(this.ioRoom);
      old?.leave(this.playerRoom(record.id));
      if (old) old.data = {};
    }
    record.socketId = socket.id;
    record.disconnectedAt = null;
    socket.data.roomCode = this.code;
    socket.data.role = 'player';
    socket.data.playerId = record.id;
    socket.join([this.ioRoom, this.playerRoom(record.id)]);
    socket.emit('room:state', this.snapshot());

    if (this.session) {
      const gp = this.toGamePlayer(record);
      if (isNew) this.session.playerJoined(gp);
      else if (wasDisconnected) this.session.playerReconnected(gp);
      this.session.syncViewer({ kind: 'player', playerId: record.id });
    }
    this.broadcast();
  }

  /** Socket hat die Verbindung verloren */
  detachSocket(socket: TypedSocket): void {
    if (socket.data.role === 'host' && this.hostSocketId === socket.id) {
      this.hostSocketId = null;
      this.hostDisconnectedAt = Date.now();
      this.broadcast();
      return;
    }
    const id = socket.data.playerId;
    const record = id ? this.players.get(id) : undefined;
    if (!record || record.socketId !== socket.id) return;
    record.socketId = null;
    record.disconnectedAt = Date.now();
    this.session?.playerDisconnected(this.toGamePlayer(record));
    this.broadcast();
  }

  removePlayer(id: PlayerId, reason?: string): void {
    const record = this.players.get(id);
    if (!record) return;
    this.players.delete(id);
    if (record.socketId) {
      const s = this.io.sockets.sockets.get(record.socketId);
      if (reason) s?.emit('session:ended', { reason });
      s?.leave(this.ioRoom);
      s?.leave(this.playerRoom(id));
      if (s) s.data = {};
    }
    this.session?.playerLeft(this.toGamePlayer(record));
    this.broadcast();
  }

  /** regelmäßiges Aufräumen getrennter Spieler; true = Raum kann gelöscht werden */
  sweep(now: number, emptyRoomTtl: number): boolean {
    for (const p of [...this.players.values()]) {
      if (p.disconnectedAt !== null && now - p.disconnectedAt > PLAYER_RECONNECT_GRACE_MS) this.removePlayer(p.id);
    }
    const anyConnected = this.hostSocketId !== null || [...this.players.values()].some((p) => p.socketId !== null);
    if (anyConnected) return false;
    const lastSeen = Math.max(
      this.hostDisconnectedAt ?? 0,
      ...[...this.players.values()].map((p) => p.disconnectedAt ?? 0),
      this.createdAt,
    );
    return now - lastSeen > emptyRoomTtl;
  }

  // ------------------------------------------------------------------ Berechtigungen

  /** Host darf immer steuern; der berechtigte Spieler, solange der Host nicht übernommen hat. */
  canControl(socket: TypedSocket): boolean {
    if (socket.data.role === 'host') return socket.id === this.hostSocketId;
    if (socket.data.role === 'player') return !this.hostHasControl && socket.data.playerId === this.controllerId();
    return false;
  }

  isHost(socket: TypedSocket): boolean {
    return socket.data.role === 'host' && socket.id === this.hostSocketId;
  }

  // ------------------------------------------------------------------ Launcher-Aktionen

  selectGame(gameId: string): void {
    if (this.phase === 'playing') throw new RoomError('Während eines Spiels kann nicht gewechselt werden.');
    if (!getGameMeta(gameId)) throw new RoomError('Unbekanntes Spiel.');
    this.selectedGameId = gameId;
    this.broadcast();
  }

  setHostControl(enabled: boolean): void {
    this.hostHasControl = enabled;
    this.broadcast();
  }

  updateSettings(gameId: string, raw: unknown): void {
    const module = getServerGame(gameId);
    if (!module) throw new RoomError('Dieses Spiel hat keine Einstellungen.');
    if (this.phase === 'playing' && this.session?.gameId === gameId) throw new RoomError('Einstellungen sind während des Spiels gesperrt.');
    try {
      this.settings[gameId] = module.parseSettings(raw);
    } catch {
      throw new RoomError('Ungültige Einstellungen.');
    }
    this.broadcast();
  }

  async startGame(gameId = this.selectedGameId): Promise<void> {
    if (this.phase === 'playing' || this.starting) throw new RoomError('Es läuft bereits ein Spiel.');
    const meta = getGameMeta(gameId);
    const module = getServerGame(gameId);
    if (!meta || !module || meta.status === 'coming-soon') throw new RoomError(`${meta?.name ?? 'Dieses Spiel'} ist noch nicht verfügbar.`);
    const players = this.getGamePlayers();
    const settings = this.settings[gameId] ?? module.defaultSettings;
    const problem = await module.canStart?.(players, settings, this.services);
    if (problem) throw new RoomError(problem);

    this.starting = true;
    try {
      this.session?.dispose();
      this.session = await GameSession.create(this, module, settings, this.services);
      this.phase = 'playing';
      this.results = null;
      this.selectedGameId = gameId;
      this.broadcast();
      // Raumstatus vor dem ersten Spielzustand versenden
      await Promise.resolve();
      this.session.start();
    } finally {
      this.starting = false;
    }
  }

  async restartGame(): Promise<void> {
    if (this.phase !== 'results') throw new RoomError('Es gibt keine beendete Partie.');
    this.phase = 'lobby';
    await this.startGame(this.results?.gameId ?? this.selectedGameId).catch((err) => {
      this.phase = 'results';
      throw err;
    });
  }

  backToLauncher(): void {
    this.session?.dispose();
    this.session = null;
    this.phase = 'lobby';
    this.results = null;
    this.broadcast();
  }

  handleGameAction(socket: TypedSocket, type: unknown, payload: unknown): void {
    if (!this.session || socket.data.role !== 'player' || !socket.data.playerId) return;
    if (typeof type !== 'string' || type.length > 40) return;
    const record = this.players.get(socket.data.playerId);
    if (!record || record.socketId !== socket.id) return;
    this.session.handleAction(record.id, type, payload);
  }

  // ------------------------------------------------------------------ SessionHost

  getGamePlayers(): GamePlayer[] {
    return [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt).map((p) => this.toGamePlayer(p));
  }

  sendGameState(target: { kind: 'host' } | { kind: 'player'; playerId: PlayerId }, state: GameStatePayload): void {
    if (target.kind === 'host') this.io.to(this.hostRoom).emit('game:state', state);
    else this.io.to(this.playerRoom(target.playerId)).emit('game:state', state);
  }

  sendGameEvent(target: EmitTarget, event: GameEventPayload): void {
    if (target.to === 'host') this.io.to(this.hostRoom).emit('game:event', event);
    else if (target.to === 'player') this.io.to(this.playerRoom(target.playerId)).emit('game:event', event);
    else if (target.except) this.io.to(this.ioRoom).except(this.playerRoom(target.except)).emit('game:event', event);
    else this.io.to(this.ioRoom).emit('game:event', event);
  }

  notify(target: PlayerId | 'all', kind: NoticeKind, message: string): void {
    if (target === 'all') this.io.to(this.ioRoom).emit('room:notice', { kind, message });
    else this.io.to(this.playerRoom(target)).emit('room:notice', { kind, message });
  }

  onGameFinished(result: FinalScores): void {
    const gameId = this.session?.gameId ?? this.selectedGameId;
    this.session?.dispose();
    this.session = null;
    this.results = buildResults(gameId, this.getGamePlayers(), result);
    this.phase = 'results';
    this.broadcast();
  }

  // ------------------------------------------------------------------ Sonstiges

  close(reason: string): void {
    this.session?.dispose();
    this.session = null;
    this.io.to(this.ioRoom).emit('room:closed', { reason });
    this.io.in(this.ioRoom).socketsLeave([this.ioRoom, this.hostRoom]);
    for (const p of this.players.values()) this.io.in(this.playerRoom(p.id)).socketsLeave(this.playerRoom(p.id));
  }

  private toGamePlayer(p: PlayerRecord): GamePlayer {
    return { id: p.id, name: p.name, avatarColor: p.avatarColor, isConnected: p.socketId !== null, joinedAt: p.joinedAt };
  }

  private nextColor(): string {
    const used = new Set([...this.players.values()].map((p) => p.avatarColor));
    for (let i = 0; i < AVATAR_COLORS.length; i++) {
      const c = AVATAR_COLORS[(this.colorCursor + i) % AVATAR_COLORS.length]!;
      if (!used.has(c)) {
        this.colorCursor = (this.colorCursor + i + 1) % AVATAR_COLORS.length;
        return c;
      }
    }
    return AVATAR_COLORS[this.colorCursor++ % AVATAR_COLORS.length]!;
  }
}

/** Rangliste mit geteilten Plätzen bei Gleichstand */
export function buildResults(gameId: string, players: GamePlayer[], result: FinalScores): GameResults {
  const entries = players
    .map((p) => ({ playerId: p.id, name: p.name, avatarColor: p.avatarColor, score: result.scores[p.id] ?? 0, rank: 0 }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  entries.forEach((e, i) => {
    e.rank = i > 0 && entries[i - 1]!.score === e.score ? entries[i - 1]!.rank : i + 1;
  });
  const top = entries[0]?.score ?? 0;
  return {
    gameId,
    entries,
    winnerIds: entries.length && top > 0 ? entries.filter((e) => e.score === top).map((e) => e.playerId) : [],
    finishedAt: Date.now(),
    summary: result.summary,
  };
}
