import type { PlayerId } from '../../shared/types/room';

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
  /** wie ausgeschieden: gefallen oder von der Polizei geschnappt */
  out: 'fell' | 'police' | 'cop' | null;
}

export interface HuhnPublicState {
  phase: HuhnPhase;
  round: number;
  totalRounds: number;
  mapId: string;
  seed: number;
  phaseEndsAt: number | null;
  players: HuhnPlayerInfo[];
  roundWinnerId: PlayerId | null;
  meters: number;
}

export interface HuhnPrivateState {
  slot: number;
  inRound: boolean;
  alive: boolean;
  place: number;
  /** Schwerkraft: 1 = Boden, -1 = Decke */
  g: 1 | -1;
}

/** kompakter Positions-Frame an den Fernseher */
export interface HuhnFrame {
  t: number;
  /** linke Kante der Kamera (Welt-x) */
  cx: number;
  v: number;
  /** [slot, x, y, g, alive(0/1)] */
  c: [number, number, number, number, number][];
  fx: HuhnFx[];
}

export type HuhnFx = { t: 'flip'; s: number } | { t: 'out'; s: number; why: 'fell' | 'police' | 'cop' } | { t: 'bump'; s: number };

export interface HuhnRoundEvent {
  round: number;
  mapId: string;
  seed: number;
  slots: number[];
}

export const HUHN_EVENTS = { frame: 'frame', round: 'round' } as const;
