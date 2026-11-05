/**
 * Einheitliches Server-Interface für alle Spiele.
 *
 * Ein Spiel besteht serverseitig aus einem `ServerGameModule` (Metadaten, Einstellungen,
 * Startprüfung, Engine-Fabrik) und einer `GameEngine`-Instanz pro laufender Partie.
 * Die Engine ist die maßgebliche Quelle für den Spielzustand. Sie kommuniziert ausschließlich
 * über den `GameContext` – sie kennt weder Sockets noch Räume direkt.
 */
import type { GameMeta } from '../../shared/types/game';
import type { NoticeKind, PlayerId } from '../../shared/types/room';
import type { WordListStore } from '../storage/word-list-store';

export interface GamePlayer {
  id: PlayerId;
  name: string;
  avatarColor: string;
  isConnected: boolean;
  joinedAt: number;
}

/** Empfänger einzelner Events: alle, nur Hauptbildschirm, ein Spieler oder alle außer einem Spieler. */
export type EmitTarget =
  | { to: 'all'; except?: PlayerId }
  | { to: 'host' }
  | { to: 'player'; playerId: PlayerId };

export type Viewer = { kind: 'host' } | { kind: 'player'; playerId: PlayerId };

export interface TimerHandle {
  cancel(): void;
}

/** Gemeinsame Dienste, die Spiele nutzen können (erweiterbar). */
export interface GameServices {
  wordLists: WordListStore;
}

export interface FinalScores {
  scores: Record<PlayerId, number>;
  summary?: string;
}

export interface GameContext {
  readonly roomCode: string;
  readonly gameId: string;
  readonly services: GameServices;
  /** alle Spieler im Raum (inkl. getrennter) – sortiert nach Beitrittszeit */
  getPlayers(): GamePlayer[];
  getPlayer(id: PlayerId): GamePlayer | undefined;
  /** markiert den Zustand als geändert; öffentliche + private Zustände werden gebündelt verschickt */
  publishState(): void;
  /** kurzlebiges Spielereignis (z. B. Zeichenoperationen, Chat) */
  emit(name: string, payload: unknown, target?: EmitTarget): void;
  notify(target: PlayerId | 'all', kind: NoticeKind, message: string): void;
  /** Timer, die beim Cleanup automatisch beendet werden */
  setTimer(ms: number, fn: () => void): TimerHandle;
  now(): number;
  /** beendet die Partie; der Launcher zeigt anschließend die Rangliste */
  endGame(result: FinalScores): void;
  log(...args: unknown[]): void;
}

export interface GameEngine<Pub = unknown, Priv = unknown> {
  /** Startlogik – wird direkt nach der Initialisierung aufgerufen */
  start(): void;
  /** öffentlicher Zustand – darf KEINE geheimen Informationen enthalten */
  getPublicState(): Pub;
  /** privater Zustand für einen einzelnen Spieler (z. B. das geheime Wort des Zeichners) */
  getPrivateState(playerId: PlayerId): Priv | null;
  /** Event-Handling – jede Aktion wird hier serverseitig validiert */
  handleAction(playerId: PlayerId, type: string, payload: unknown): void;
  onPlayerJoined?(player: GamePlayer): void;
  onPlayerLeft?(player: GamePlayer): void;
  onPlayerDisconnected?(player: GamePlayer): void;
  onPlayerReconnected?(player: GamePlayer): void;
  /** wird aufgerufen, wenn ein Gerät (neu) verbunden ist – z. B. um die Zeichnung zu synchronisieren */
  onViewerSync?(viewer: Viewer): void;
  /** Cleanup – Timer werden zusätzlich automatisch vom Kontext entfernt */
  dispose(): void;
}

export interface ServerGameModule<Settings = unknown> {
  meta: GameMeta;
  defaultSettings: Settings;
  /** validiert/normalisiert Einstellungen vom Client; wirft bei ungültigen Daten */
  parseSettings(raw: unknown): Settings;
  /** gibt eine Fehlermeldung zurück, falls das Spiel (noch) nicht startbar ist */
  canStart?(players: GamePlayer[], settings: Settings, services: GameServices): Promise<string | null> | string | null;
  /** Initialisierung einer neuen Partie */
  createEngine(ctx: GameContext, settings: Settings): GameEngine | Promise<GameEngine>;
}
