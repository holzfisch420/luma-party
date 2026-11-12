import type { PlayerId } from '../../shared/types/room';
import type { PromptPack } from './prompt-types';

export type PloppPhase = 'intro' | 'play' | 'vote' | 'pop';

export interface PloppUsed {
  by: PlayerId;
  /** gültige Antwort (korrigiert) */
  text: string;
  /** ursprüngliche Eingabe, falls korrigiert */
  typed?: string;
  /** per Abstimmung zugelassen */
  voted?: boolean;
}

/** kurze Meldung für Fernseher/Handys */
export interface PloppEvent {
  id: number;
  kind: 'pass' | 'dupe' | 'unknown' | 'letter' | 'rejected' | 'skip';
  playerId: PlayerId;
  text: string;
  answer?: string;
  /** neue Person mit dem Fisch */
  to?: PlayerId;
}

export interface PloppPublicState {
  phase: PloppPhase;
  round: number;
  prompt: { text: string; pack: PromptPack; letter?: string };
  holderId: PlayerId | null;
  /** Sitzreihenfolge (alle, die mitspielen) */
  order: PlayerId[];
  lives: Record<PlayerId, number>;
  maxLives: number;
  used: PloppUsed[];
  /** Aufblasen: Startzeit, ggf. Pause, max. Zündschnur (nicht die echte!) */
  fuse: { startedAt: number; pausedAt: number | null; pausedMs: number; max: number } | null;
  phaseEndsAt: number | null;
  vote: { playerId: PlayerId; text: string; voters: PlayerId[]; eligible: PlayerId[] } | null;
  pop: { playerId: PlayerId; livesLeft: number; eliminated: boolean } | null;
  event: PloppEvent | null;
  /** überlebte Runden */
  scores: Record<PlayerId, number>;
  winnerId: PlayerId | null;
}

export interface PloppPrivateState {
  isHolder: boolean;
  /** letzte Rückmeldung auf die eigene Eingabe */
  feedback: { id: number; kind: 'ok' | 'dupe' | 'unknown' | 'letter' | 'rejected' | 'pending'; typed: string; answer?: string; corrected?: boolean } | null;
  myVote: 'yes' | 'no' | null;
  canVote: boolean;
  /** darf in diesem Zug noch eine Abstimmung auslösen */
  canAppeal: boolean;
}
