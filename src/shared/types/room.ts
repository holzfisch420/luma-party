import type { GameResults } from './game';
import type { AvatarConfig } from '../avatar';

export type PlayerId = string;

export interface PublicPlayer {
  id: PlayerId;
  name: string;
  avatarColor: string;
  isConnected: boolean;
  joinedAt: number;
  /** eigener Avatar (nur mit Konto), sonst null → Initialen */
  avatar: AvatarConfig | null;
  hasAccount: boolean;
}

export type RoomPhase = 'lobby' | 'playing' | 'results';

/** Öffentlicher Raumzustand – wird an Hauptbildschirm und alle Smartphones gesendet. */
export interface RoomSnapshot {
  code: string;
  phase: RoomPhase;
  hostConnected: boolean;
  players: PublicPlayer[];
  /** im Launcher ausgewähltes Spiel */
  selectedGameId: string;
  /** Spieler mit Auswahlberechtigung (erster beigetretener, verbundener Spieler) */
  controllerId: PlayerId | null;
  /** true = der Host hat die Auswahl übernommen, Smartphone-Steuerung pausiert */
  hostHasControl: boolean;
  /** aktuelle (validierte) Einstellungen je Spiel */
  gameSettings: Record<string, unknown>;
  activeGameId: string | null;
  results: GameResults | null;
  serverTime: number;
}

/** Spielzustand: öffentlich für alle + optional privat für den jeweiligen Empfänger. */
export interface GameStatePayload<Pub = unknown, Priv = unknown> {
  gameId: string;
  public: Pub;
  private: Priv | null;
  serverTime: number;
}

export interface GameEventPayload<T = unknown> {
  gameId: string;
  name: string;
  payload: T;
}

export type NoticeKind = 'info' | 'success' | 'error';
export interface Notice {
  kind: NoticeKind;
  message: string;
}
