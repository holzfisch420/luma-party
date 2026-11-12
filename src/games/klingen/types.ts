import type { PlayerId } from '../../shared/types/room';
import type { KlingenMode } from './game-config';

export interface SoloRow {
  /** aktuelle Stufe (ab 1) */
  stage: number;
  /** geschaffte Stufen */
  cleared: number;
  /** Messer in der aktuellen Stufe schon gesteckt */
  stuck: number;
  lives: number;
  done: boolean;
}

export interface SharedRow {
  alive: boolean;
  /** Messer in dieser Runde noch übrig */
  left: number;
  /** insgesamt steckende Messer */
  stuckTotal: number;
  /** Runde, in der die Person rausflog */
  outRound: number | null;
}

export interface KlingenPublicState {
  mode: KlingenMode;
  seed: number;
  phase: 'countdown' | 'play' | 'roundEnd' | 'done';
  phaseEndsAt: number | null;
  /** Startzeit der Drehung (Serverzeit) – gemeinsames Rad */
  spinStartedAt: number | null;
  maxLives: number;
  solo: Record<PlayerId, SoloRow>;
  round: number;
  shared: Record<PlayerId, SharedRow>;
  /** wer zuletzt rausgeflogen ist (für Meldungen) */
  lastOut: PlayerId | null;
}

export interface KlingenPrivateState {
  /** gemeinsames Rad: Ergebnis des letzten eigenen Wurfs */
  lastResult: { id: number; ok: boolean } | null;
}

/** Ereignis an den Fernseher: ein Messer fliegt */
export interface ThrowEvent {
  id: number;
  playerId: PlayerId;
}
