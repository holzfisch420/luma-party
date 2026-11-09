import type { PlayerId } from '../../shared/types/room';

export type RacerPhase = 'intro' | 'countdown' | 'race' | 'results';

export interface RacerPlayerInfo {
  playerId: PlayerId;
  slot: number;
  points: number;
  inRace: boolean;
  /** Platz in diesem Rennen (live) */
  place: number;
  finished: boolean;
  finishMs: number | null;
  dnf: boolean;
  lap: number;
  /** Fortschritt 0 … 1 */
  progress: number;
  gained: number;
}

export interface RacerPublicState {
  phase: RacerPhase;
  race: number;
  totalRaces: number;
  trackId: string;
  phaseEndsAt: number | null;
  raceStartAt: number | null;
  /** Restzeit nach dem ersten Zieleinlauf */
  finishDeadline: number | null;
  view: 'split' | 'shared';
  players: RacerPlayerInfo[];
}

export interface RacerPrivateState {
  slot: number;
  inRace: boolean;
  place: number;
  lap: number;
  laps: number;
  checkpoint: number;
  checkpoints: number;
  finished: boolean;
  falling: boolean;
}

/** Positions-Frame an den Fernseher: [slot, x, y, z, Richtung, km/h, Abtastindex, Flags] */
export type CarFrame = [number, number, number, number, number, number, number, number];
export interface RacerFrame {
  t: number;
  c: CarFrame[];
  fx: RacerFx[];
}

export const CAR_FLAG = { finished: 1, falling: 2, boost: 4, wrongWay: 8, drift: 16 } as const;

export type RacerFx = { t: 'cp'; s: number } | { t: 'lap'; s: number } | { t: 'finish'; s: number; place: number } | { t: 'bump'; s: number } | { t: 'fall'; s: number } | { t: 'wall'; s: number };

export const RACER_EVENTS = { frame: 'frame' } as const;
