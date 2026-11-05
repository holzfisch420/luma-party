/**
 * Einheitliches Client-Interface für Spiele.
 *
 * Ein Spiel liefert seine Oberflächen als React-Komponenten. Der Launcher rendert sie
 * generisch und reicht nur Raum- und Spielzustand durch – er kennt keine Spielinterna.
 * Das Server-Gegenstück ist `ServerGameModule` in `src/server/game-engine/types.ts`.
 */
import type { ComponentType } from 'react';
import type { GameMeta } from '../shared/types/game';
import type { GameStatePayload, PublicPlayer, RoomSnapshot } from '../shared/types/room';

export interface CoverProps {
  meta: GameMeta;
  focused: boolean;
}

/** Hauptbildschirm (TV) während des Spiels */
export interface HostViewProps<Pub = unknown> {
  room: RoomSnapshot;
  state: GameStatePayload<Pub, null>;
}

/** Smartphone-Oberfläche eines Spielers während des Spiels */
export interface PlayerViewProps<Pub = unknown, Priv = unknown> {
  room: RoomSnapshot;
  me: PublicPlayer;
  state: GameStatePayload<Pub, Priv>;
  sendAction: (type: string, payload?: unknown) => void;
}

/** Spieleinstellungen (Launcher auf TV und Smartphone) */
export interface SettingsPanelProps<S = unknown> {
  settings: S;
  onChange: (next: S) => void;
  disabled?: boolean;
  compact?: boolean;
}

export interface ClientGameModule<Pub = any, Priv = any, S = any> {
  meta: GameMeta;
  /** eigenes Cover; ohne Angabe wird ein generisches Cover aus `meta.theme` erzeugt */
  Cover?: ComponentType<CoverProps>;
  HostView: ComponentType<HostViewProps<Pub>>;
  PlayerView: ComponentType<PlayerViewProps<Pub, Priv>>;
  SettingsPanel?: ComponentType<SettingsPanelProps<S>>;
  /** kurze Spielregeln für den Launcher */
  rules?: string[];
}
