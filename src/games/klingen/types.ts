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
  /** eingesammelte Bonus-Sterne */
  stars: number;
  /** besiegte Bosse */
  bosses: number;
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
  /** pick = Messer aussuchen (am Anfang, 10 s) */
  phase: 'pick' | 'countdown' | 'play' | 'roundEnd' | 'done';
  phaseEndsAt: number | null;
  /** Startzeit der Drehung (Serverzeit) – gemeinsames Rad */
  spinStartedAt: number | null;
  maxLives: number;
  solo: Record<PlayerId, SoloRow>;
  round: number;
  shared: Record<PlayerId, SharedRow>;
  /** gewähltes Messer je Person (Index in KNIFE_SKINS) */
  knives: Record<PlayerId, number>;
  /** wer schon bewusst gewählt hat */
  picked: PlayerId[];
  /** Einzeln: wessen Spiel live am Fernseher läuft (Platz 1) */
  spotlight: PlayerId | null;
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

/** Einzeln: Momentaufnahme vom Handy des Erstplatzierten für den Fernseher */
export interface LiveFrame {
  playerId: PlayerId;
  stage: number;
  /** Simulationszeit und Drehwinkel */
  t: number;
  angle: number;
  /** geworfene Messer: Ruheposition im Rad */
  knives: number[];
  /** noch vorhandene Bonus-Sterne */
  stars: number[];
  left: number;
  lives: number;
  mode: 'intro' | 'play' | 'clear' | 'over';
  /** Ereignis seit dem letzten Bild */
  ev?: 'throw' | 'stick' | 'star' | 'hit' | 'clear';
  /** Art des Fehlwurfs */
  hit?: string;
}
