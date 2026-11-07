import type { PlayerId } from '../../shared/types/room';
import type { PowerId } from './game-config';

export type PanzerPhase = 'colors' | 'countdown' | 'battle' | 'roundEnd';

export interface PanzerPlayerInfo {
  playerId: PlayerId;
  /** fester Platz 0..7 – Kennung in den Positions-Frames */
  slot: number;
  color: number;
  ready: boolean;
  score: number;
  kills: number;
  /** nimmt an der laufenden Runde teil und lebt */
  alive: boolean;
  inRound: boolean;
}

export interface PanzerPublicState {
  phase: PanzerPhase;
  round: number;
  winScore: number;
  mapId: string;
  phaseEndsAt: number;
  phaseDurationMs: number;
  players: PanzerPlayerInfo[];
  roundWinnerId: PlayerId | null;
  powerupsEnabled: boolean;
}

export interface PanzerPrivateState {
  slot: number;
  color: number;
  alive: boolean;
  inRound: boolean;
  /** Waffen-Power-up für den nächsten automatischen Schuss */
  power: PowerId | null;
  shieldUntil: number;
  /** aktuelle Drehrichtung (1 = Uhrzeigersinn) */
  rotDir: 1 | -1;
}

/** Projektiltypen in Frames */
export const BULLET_KIND = { shell: 0, pellet: 1, missile: 2, mg: 3, frag: 4, shard: 5 } as const;
export type BulletKind = (typeof BULLET_KIND)[keyof typeof BULLET_KIND];

/** Flags je Panzer */
/** turbo = fährt gerade (für Abgasflammen) */
export const TANK_FLAG = { shield: 1, cloak: 2, turbo: 4 } as const;

export type Fx =
  | { t: 'boom'; x: number; y: number; s: number }
  | { t: 'laser'; p: number[]; c: number }
  | { t: 'pickup'; x: number; y: number; i: number; s: number }
  | { t: 'shot'; x: number; y: number }
  | { t: 'honk'; s: number }
  | { t: 'pop'; x: number; y: number }
  | { t: 'kill'; s: number; by: number };

/** Positions-Frame (nur an den Hauptbildschirm, ~20× pro Sekunde) */
export interface PanzerFrame {
  t: number;
  /** [slot, x, y, winkel, flags] */
  k: number[][];
  /** [id, x, y, kind, winkel, slot des Schützen] */
  b: number[][];
  /** [x, y, scharf (0/1), slot] */
  m: number[][];
  /** [x, y, powerIndex] */
  c: number[][];
  fx: Fx[];
}

export const PZ_EVENTS = { frame: 'frame', round: 'round' } as const;

export interface RoundStartEvent {
  round: number;
  mapId: string;
}
