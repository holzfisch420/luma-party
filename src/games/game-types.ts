/**
 * Einheitliches Client-Interface für Spiele.
 *
 * Ein Spiel liefert seine Oberflächen als React-Komponenten. Der Launcher rendert sie
 * generisch und reicht nur Raum- und Spielzustand durch – er kennt keine Spielinterna.
 * Das Server-Gegenstück ist `ServerGameModule` in `src/server/game-engine/types.ts`.
 */
import type { ComponentType } from 'react';
import type { TrackId } from '../app/audio/music';
import type { GameMeta, GameResults } from '../shared/types/game';
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

/** Rangliste am Spielende – optional im eigenen Stil des Spiels */
export interface ResultsViewProps {
  room: RoomSnapshot;
  results: GameResults;
  /** 'host' = Hauptbildschirm, 'player' = Smartphone */
  device: 'host' | 'player';
  meId?: string;
  canControl: boolean;
  onRestart: () => void;
  onBack: () => void;
}

export interface ClientGameModule<Pub = any, Priv = any, S = any> {
  meta: GameMeta;
  /** quadratische Kachel-Grafik; ohne Angabe wird eine generische aus `meta.theme` erzeugt */
  Cover?: ComponentType<CoverProps>;
  HostView: ComponentType<HostViewProps<Pub>>;
  PlayerView: ComponentType<PlayerViewProps<Pub, Priv>>;
  SettingsPanel?: ComponentType<SettingsPanelProps<S>>;
  /** kompakte Auswahl direkt im Startbildschirm (z. B. Kategorien) */
  QuickSettings?: ComponentType<SettingsPanelProps<S>>;
  /** eigene Ergebnis-Ansicht; ohne Angabe zeigt der Launcher eine neutrale Rangliste */
  ResultsView?: ComponentType<ResultsViewProps>;
  /** kurze Spielregeln für den Launcher */
  rules?: string[];
  /** Hintergrundmusik auf dem Hauptbildschirm (Phasen können sie mit useMusic überschreiben) */
  music?: TrackId;
}
