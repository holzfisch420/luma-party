import type { PlayerId } from '../../shared/types/room';
import type { ObstacleKind } from './maps';

export type HuhnPhase = 'countdown' | 'run' | 'roundEnd';

export interface HuhnPlayerInfo {
  playerId: PlayerId;
  slot: number;
  score: number;
  inRound: boolean;
  alive: boolean;
  /** Platz in der aktuellen Runde (1 = Sieg), 0 = noch im Rennen */
  place: number;
  best: number;
}

export interface HuhnPublicState {
  phase: HuhnPhase;
  round: number;
  totalRounds: number;
  mapId: string;
  phaseEndsAt: number | null;
  players: HuhnPlayerInfo[];
  roundWinnerId: PlayerId | null;
  /** zurückgelegte Meter dieser Runde */
  meters: number;
}

export interface HuhnPrivateState {
  slot: number;
  inRound: boolean;
  alive: boolean;
  place: number;
}

/** kompakter Positions-Frame an den Fernseher */
export interface HuhnFrame {
  t: number;
  /** Strecke (Einheiten) */
  d: number;
  v: number;
  /** [slot, y, alive(0/1), holding(0/1)] */
  c: [number, number, number, number][];
  /** [id, slot, kindIndex, x] – x relativ zum Huhn */
  o: [number, number, number, number][];
  fx: HuhnFx[];
}

export type HuhnFx = { t: 'jump'; s: number } | { t: 'caught'; s: number; k: number };

export interface HuhnRoundEvent {
  round: number;
  mapId: string;
  slots: number[];
}

export const HUHN_EVENTS = { frame: 'frame', round: 'round' } as const;
export type { ObstacleKind };
