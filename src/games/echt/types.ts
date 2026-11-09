import type { PlayerId } from '../../shared/types/room';

export type EchtPhase = 'write' | 'vote' | 'reveal';

export interface EchtOption {
  id: string;
  /** eine Antwort je Lücke */
  parts: string[];
}

export interface EchtRevealOption extends EchtOption {
  /** wer diese Antwort geschrieben hat */
  authors: PlayerId[];
  real: boolean;
  voters: PlayerId[];
}

export interface EchtReveal {
  options: EchtRevealOption[];
  gained: Record<PlayerId, number>;
  /** Person, die dran war, hat nichts geschrieben */
  skipped: boolean;
}

export interface EchtPublicState {
  phase: EchtPhase;
  /** Zug (eine Person ist dran) */
  turn: number;
  totalTurns: number;
  /** Satz innerhalb des Zugs */
  step: number;
  perTurn: number;
  /** Person, die dran ist */
  heroId: PlayerId;
  /** Satz mit ___ als Platzhalter */
  statement: string;
  phaseEndsAt: number | null;
  /** wer schon geschrieben bzw. abgestimmt hat */
  submitted: PlayerId[];
  voted: PlayerId[];
  options: EchtOption[];
  reveal: EchtReveal | null;
  scores: Record<PlayerId, number>;
}

export interface EchtPrivateState {
  isHero: boolean;
  myAnswer: string[] | null;
  myVote: string | null;
  /** eigene Antwort(en) – dafür darf man nicht stimmen */
  ownOptionIds: string[];
}
